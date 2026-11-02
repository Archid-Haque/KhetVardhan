import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, ClipboardList, MapPin, Plane, Plus, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import "./Missions.css";

const labels = { draft: "Draft", planned: "Planned", ready_for_review: "Review before flight", completed: "Completed", cancelled: "Cancelled" };

export default function Missions() {
  const [user, setUser] = useState(false);
  const [missions, setMissions] = useState([]);
  const [fields, setFields] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const me = await api("/auth/me"); setUser(Boolean(me.user));
      const [m, f] = await Promise.all([api("/missions"), api("/fields")]);
      setMissions(m.missions); setFields(f.fields);
    } catch { setUser(null); }
  }
  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((me) => {
        if (!active) return null;
        setUser(Boolean(me.user));
        return Promise.all([api("/missions"), api("/fields")]);
      })
      .then((result) => {
        if (!active || !result) return;
        const [savedMissions, savedFields] = result;
        setMissions(savedMissions.missions);
        setFields(savedFields.fields);
      })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  async function createMission(event) {
    event.preventDefault(); setError(""); setBusy(true);
    const values = new FormData(event.currentTarget);
    try {
      await api("/missions", { method: "POST", body: JSON.stringify({ name: values.get("name"), fieldId: values.get("fieldId") || null, targetZone: values.get("targetZone"), objective: values.get("objective"), notes: values.get("notes") }) });
      setShowForm(false); await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function updateStatus(mission, status) {
    try { await api(`/missions/${mission.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); }
    catch (e) { setError(e.message); }
  }

  return <main className="kv-missions-page">
    <header className="kv-missions-heading"><div><span className="kv-section-kicker"><Plane size={14} /> DRONE OPERATIONS</span><h1>Mission planning</h1><p>Turn a field observation into a focused inspection plan. Every flight remains subject to operator review.</p></div>{user === true ? <button className="kv-mission-primary" onClick={() => setShowForm(!showForm)} type="button"><Plus size={17} /> Plan a mission</button> : <Link className="kv-mission-primary" to="/account">Sign in to plan <Plus size={17} /></Link>}</header>
    {user === null && <section className="kv-mission-gate"><ShieldCheck size={22} /><div><strong>Sign in to save mission plans</strong><p>Your plans stay private to your account.</p></div><Link to="/account">Sign in <ArrowUpRight size={15} /></Link></section>}
    {showForm && user && <form className="kv-mission-form" onSubmit={createMission}><div className="kv-mission-form-head"><div><span className="kv-section-kicker">NEW PLAN</span><h2>Mission details</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close mission form">×</button></div><label>Mission name<input name="name" required maxLength="160" placeholder="North plot health check" /></label><div className="kv-mission-form-row"><label>Field<select name="fieldId"><option value="">Choose a field</option>{fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Target zone<input name="targetZone" maxLength="100" placeholder="e.g. East boundary" /></label></div><label>Inspection objective<textarea name="objective" required maxLength="1000" placeholder="Describe what the operator should inspect…" /></label><label>Operator notes<textarea name="notes" maxLength="4000" placeholder="Flight constraints, access notes, or context" /></label>{error && <p className="kv-mission-error" role="alert">{error}</p>}<div className="kv-mission-form-actions"><span><ShieldCheck size={15} /> Saved as a draft. Flight execution is not connected.</span><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save draft"}</button></div></form>}
    {user === false && <section className="kv-mission-loading">Loading your workspace…</section>}
    {user && missions.length === 0 && !showForm && <section className="kv-mission-empty"><div><ClipboardList size={24} /></div><h2>No mission plans yet</h2><p>Create a draft from a satellite alert or field inspection need. Plans are stored in your workspace.</p><button type="button" onClick={() => setShowForm(true)}>Create first plan <ArrowUpRight size={15} /></button></section>}
    {user && missions.length > 0 && <section className="kv-mission-list" aria-label="Saved missions">{missions.map((mission) => <article className="kv-mission-card" key={mission.id}><div className="kv-mission-icon"><Plane size={19} /></div><div className="kv-mission-content"><div className="kv-mission-title-row"><h2>{mission.name}</h2><span className={`kv-mission-status status-${mission.status}`}>{labels[mission.status]}</span></div><p>{mission.objective}</p><div className="kv-mission-meta"><span><MapPin size={13} /> {mission.field_name || "Field not selected"}</span>{mission.target_zone && <span>ZONE {mission.target_zone}</span>}</div></div><div className="kv-mission-actions">{mission.status === "draft" && <button type="button" onClick={() => updateStatus(mission, "planned")}>Mark planned</button>}{mission.status === "planned" && <button type="button" onClick={() => updateStatus(mission, "ready_for_review")}>Ready for review</button>}{mission.status === "ready_for_review" && <button type="button" onClick={() => updateStatus(mission, "completed")}>Mark complete</button>}</div></article>)}</section>}
  </main>;
}
