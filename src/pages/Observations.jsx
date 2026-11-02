import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Activity, Plus, Satellite, Sprout } from "lucide-react";
import { api } from "../lib/api";
import "./Observations.css";

const sourceLabels = { satellite: "Satellite", drone: "Drone", scouting: "Field scouting", other: "Other" };

export default function Observations() {
  const [observations, setObservations] = useState([]);
  const [fields, setFields] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [o, f] = await Promise.all([api("/observations"), api("/fields")]);
      setObservations(o.observations); setFields(f.fields);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => {
    let active = true;
    Promise.all([api("/observations"), api("/fields")])
      .then(([savedObservations, savedFields]) => {
        if (!active) return;
        setObservations(savedObservations.observations);
        setFields(savedFields.fields);
      })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const ndviValue = form.get("ndvi");
    const payload = { fieldId: form.get("fieldId") || null, source: form.get("source"), zone: form.get("zone"), title: form.get("title"), summary: form.get("summary"), severity: form.get("severity"), ndvi: ndviValue === "" ? null : Number(ndviValue) };
    try { await api("/observations", { method: "POST", body: JSON.stringify(payload) }); setShowForm(false); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="kv-observations-page"><header className="kv-observations-heading"><div><span className="kv-section-kicker"><Activity size={14} /> FIELD RECORDS</span><h1>Observations</h1><p>Keep scouting notes and sourced imagery findings together. Records are private to your workspace.</p></div><button className="kv-mission-primary" type="button" onClick={() => setShowForm(!showForm)}><Plus size={17} /> Add observation</button></header>
    {error && <p className="kv-observation-error" role="alert">{error}</p>}
    {showForm && <form className="kv-observation-form" onSubmit={save}><div className="kv-observation-form-head"><div><span className="kv-section-kicker">NEW FIELD RECORD</span><h2>Observation details</h2></div><button type="button" aria-label="Close form" onClick={() => setShowForm(false)}>×</button></div><div className="kv-observation-grid"><label>Source<select name="source"><option value="scouting">Field scouting</option><option value="satellite">Satellite</option><option value="drone">Drone</option><option value="other">Other</option></select></label><label>Field<select name="fieldId"><option value="">No linked field</option>{fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></label><label>Title<input name="title" required maxLength="180" placeholder="Uneven canopy near east boundary" /></label><label>Zone<input name="zone" maxLength="100" placeholder="East boundary / B7" /></label><label>Severity<select name="severity"><option value="unclassified">Unclassified</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select></label><label>NDVI (optional)<input name="ndvi" type="number" min="-1" max="1" step="0.0001" placeholder="Only enter sourced values" /></label></div><label className="kv-observation-summary">Notes and evidence<textarea name="summary" required maxLength="4000" placeholder="Describe what was observed, when, and any supporting evidence." /></label><div className="kv-observation-form-actions"><span><Satellite size={14} /> Entered observations are not independently verified.</span><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save observation"}</button></div></form>}
    {!error && observations.length === 0 && !showForm && <section className="kv-observations-empty"><div><Sprout size={24} /></div><h2>No observations recorded</h2><p>Start a field log with a scouting note, or add sourced satellite or drone findings when available.</p><button type="button" onClick={() => setShowForm(true)}>Add first observation</button></section>}
    {observations.length > 0 && <section className="kv-observations-list" aria-label="Observation records">{observations.map((o) => <article className="kv-observation-card" key={o.id}><div className="kv-observation-marker"><Activity size={18} /></div><div className="kv-observation-body"><div className="kv-observation-top"><span>{sourceLabels[o.source] || "Field record"}</span><time dateTime={o.observed_at}>{new Date(o.observed_at).toLocaleString()}</time></div><h2>{o.title}</h2><p>{o.summary}</p><div className="kv-observation-meta">{o.field_name && <span>{o.field_name}</span>}{o.zone && <span>{o.zone}</span>}{o.ndvi != null && <span>NDVI {Number(o.ndvi).toFixed(3)}</span>}<span className={`kv-severity severity-${o.severity}`}>{o.severity}</span></div></div></article>)}</section>}
    {fields.length === 0 && <p className="kv-observations-hint">No fields yet? <Link to="/fields">Add a field</Link> to link observations to a boundary.</p>}
  </main>;
}
