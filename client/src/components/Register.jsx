import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Square } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { GoogleMark } from "./Login.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleOn, setGoogleOn] = useState(false);

  useEffect(() => { api.get("/auth/google/status").then((r) => setGoogleOn(r.data.enabled)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await register(name, email, password); nav("/dashboard"); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Link to="/" className="auth-logo"><span className="auth-logo-mark"><Square size={15} color="#fff" fill="#fff" /></span> Blok</Link>
        <div className="auth-aside-inner">
          <h2>Build the whole thing.</h2>
          <p>From landing page to launch — design every block, connect every page, publish in a click.</p>
          <div className="auth-aside-art" />
        </div>
        <div className="auth-aside-foot">No credit card. Your first site is free.</div>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <h1>Create your account</h1>
          <p className="auth-sub">Start building in under a minute.</p>

          {err && <div className="auth-error"><AlertCircle size={15} /> {err}</div>}

          <form onSubmit={submit} className="auth-form">
            <label className="auth-label">Name
              <input className="auth-input" value={name} autoComplete="name"
                onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </label>
            <label className="auth-label">Email
              <input className="auth-input" type="email" value={email} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </label>
            <label className="auth-label">Password
              <input className="auth-input" type="password" value={password} autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
            </label>
            <button className="auth-btn auth-btn-primary" disabled={busy}>
              {busy ? <Loader2 size={16} className="spin" /> : null} Create account
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <a className={`auth-btn auth-btn-google${googleOn ? "" : " disabled"}`}
            href={googleOn ? "/api/auth/google" : undefined}
            onClick={(e) => { if (!googleOn) e.preventDefault(); }}>
            <GoogleMark /> Continue with Google
          </a>
          {!googleOn && <p className="auth-tinyhint">Google sign-in activates once you add credentials to <code>server/.env</code>.</p>}

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
