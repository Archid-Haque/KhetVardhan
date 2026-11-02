import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Plus, Sprout, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import "./Fields.css";

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function load() {
    try { const { fields: saved } = await api("/fields"); setFields(saved); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => {
    let active = true;
    api("/fields")
      .then(({ fields: saved }) => { if (active) setFields(saved); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  function openField(field) {
    localStorage.setItem("khetvardhan-field", JSON.stringify({ ...field, latitude: field.latitude == null ? null : Number(field.latitude), longitude: field.longitude == null ? null : Number(field.longitude), boundary: field.boundary || [] }));
    navigate("/dashboard");
  }
  async function removeField(field) {
    if (!window.confirm(`Delete ${field.name} and unlink its missions? This cannot be undone.`)) return;
    try {
      await api(`/fields/${field.id}`, { method: "DELETE" });
      const active = JSON.parse(localStorage.getItem("khetvardhan-field") || "null");
      if (active?.id === field.id) localStorage.removeItem("khetvardhan-field");
      await load();
    } catch (e) { setError(e.message); }
  }
  return <main className="kv-fields-page"><header className="kv-fields-heading"><div><span className="kv-section-kicker"><Sprout size={14} /> FARM MANAGEMENT</span><h1>My fields</h1><p>Keep field boundaries and crop context together. Saved field records belong to your account.</p></div><Link className="kv-mission-primary" to="/dashboard" state={{ openFieldSetup: true }}><Plus size={17} /> Add a field</Link></header>{error && <p className="kv-fields-error" role="alert">{error}</p>}{!error && fields.length === 0 && <section className="kv-fields-empty"><MapPin size={25} /><h2>No saved fields yet</h2><p>Add your first field from the field workspace. You’ll be able to store its location and boundary.</p><Link to="/dashboard" state={{ openFieldSetup: true }}>Open field setup</Link></section>}{fields.length > 0 && <section className="kv-fields-list">{fields.map((field) => <article className="kv-fields-card" key={field.id}><span className="kv-fields-icon"><Sprout size={19} /></span><div className="kv-fields-info"><h2>{field.name}</h2><p><MapPin size={13} /> {field.location}</p><div>{field.crop || "Crop not specified"} <span>·</span> {field.boundary?.length || 0} boundary points</div></div><button className="kv-fields-open" type="button" onClick={() => openField(field)}>Open</button><button className="kv-fields-delete" type="button" aria-label={`Delete ${field.name}`} onClick={() => removeField(field)}><Trash2 size={16} /></button></article>)}</section>}</main>;
}
