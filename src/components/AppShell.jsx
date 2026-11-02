import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Activity, ClipboardList, Map, Menu, Satellite, Sprout, X } from "lucide-react";
import { api } from "../lib/api";
import "./AppShell.css";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: Activity },
  { to: "/fields", label: "My fields", icon: Sprout },
  { to: "/observations", label: "Observations", icon: ClipboardList },
  { to: "/satellite", label: "Field intelligence", icon: Satellite },
  { to: "/missions", label: "Drone missions", icon: Map },
];

export default function AppShell() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState("checking");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const load = () => api("/auth/me").then(({ user: current }) => { setUser(current); setAuthState("signed-in"); }).catch(() => { setUser(null); setAuthState("signed-out"); });
    const onAuthChanged = (event) => {
      if (event.detail?.user) { setUser(event.detail.user); setAuthState("signed-in"); }
      else load();
    };
    load();
    window.addEventListener("kv-auth-changed", onAuthChanged);
    return () => window.removeEventListener("kv-auth-changed", onAuthChanged);
  }, []);

  const isPublic = location.pathname === "/" || location.pathname === "/account";
  useEffect(() => {
    if (authState === "signed-out" && !isPublic) {
      navigate(`/account?next=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [authState, isPublic, location.pathname, navigate]);

  async function signOut() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setAuthState("signed-out");
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <div className="kv-platform">
      <header className="kv-topbar">
        <Link className="kv-brand" to="/" aria-label="KhetVardhan home">
          <img className="kv-brand-logo" src="/khetvardhan-company-logo.png" alt="" />
          <span className="kv-brand-name"><span>KhetVardhan</span><small>Technologies</small></span>
        </Link>
        <button className="kv-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`kv-main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `kv-nav-link${isActive ? " is-active" : ""}`}><Icon size={16} />{label}</NavLink>)}
          {user ? <div className="kv-account"><span className="kv-avatar">{user.name?.slice(0, 1)?.toUpperCase() || "K"}</span><span className="kv-account-name">{user.name}</span><button className="kv-signout" type="button" onClick={signOut}>Sign out</button></div> : <Link className="kv-signin-link" to="/account" onClick={() => setMenuOpen(false)}>Log in</Link>}
        </nav>
      </header>
      {isPublic || authState === "signed-in" ? <Outlet /> : <main className="kv-route-loading" role="status">{authState === "checking" ? "Checking your secure session…" : "Redirecting to sign in…"}</main>}
      <footer className="kv-footer">
        <div className="kv-footer-brand"><strong>KhetVardhan Technologies</strong><span>Field records, crop observations and inspection plans.</span></div>
        <a className="kv-footer-contact" href="mailto:contact@khetvardhan.tech">contact@khetvardhan.tech</a>
        <a className="kv-footer-photo" href="https://unsplash.com/photos/an-aerial-view-of-a-rice-field-in-the-countryside-SX0jeTOlieo" target="_blank" rel="noreferrer">Field photograph: Jeswin Thomas / Unsplash</a>
      </footer>
    </div>
  );
}
