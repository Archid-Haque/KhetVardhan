import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LockKeyhole, Mail, Sprout, UserRound } from "lucide-react";
import { api } from "../lib/api";
import "./Account.css";

export default function Account() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = { email: form.get("email"), password: form.get("password") };
    if (isSignup) payload.name = form.get("name");
    try {
      const result = await api(`/auth/${isSignup ? "register" : "login"}`, { method: "POST", body: JSON.stringify(payload) });
      window.dispatchEvent(new CustomEvent("kv-auth-changed", { detail: { user: result.user } }));
      const requested = new URLSearchParams(window.location.search).get("next");
      navigate(requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <main className="kv-account-page">
    <section className="kv-account-card">
      <div className="kv-account-emblem"><Sprout size={23} /></div>
      <span className="kv-account-eyebrow">YOUR FARM, IN FOCUS</span>
      <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p>Secure access to your fields, observations and mission plans.</p>
      <form onSubmit={submit} className="kv-account-form">
        {isSignup && <label><span>Your name</span><div><UserRound size={17} /><input name="name" autoComplete="name" required maxLength="120" placeholder="Full name" /></div></label>}
        <label><span>Email address</span><div><Mail size={17} /><input name="email" type="email" autoComplete="email" required maxLength="254" placeholder="you@example.com" /></div></label>
        <label><span>Password</span><div><LockKeyhole size={17} /><input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 10 : 1} maxLength="128" required placeholder={isSignup ? "At least 10 characters" : "Your password"} /></div></label>
        {error && <p className="kv-account-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</button>
      </form>
      <p className="kv-account-switch">{isSignup ? "Already have an account?" : "New to KhetVardhan?"} <button type="button" onClick={() => { setError(""); setMode(isSignup ? "login" : "signup"); }}>{isSignup ? "Sign in" : "Create an account"}</button></p>
      <Link className="kv-account-back" to="/">Back to overview</Link>
    </section>
  </main>;
}
