import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Square } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleOn, setGoogleOn] = useState(false);

  useEffect(() => { api.get("/auth/google/status").then((r) => setGoogleOn(r.data.enabled)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await login(email, password); nav("/dashboard"); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Link to="/" className="auth-logo"><span className="auth-logo-mark"><Square size={15} color="#fff" fill="#fff" /></span> Blok</Link>
        <div className="auth-aside-inner">
          <h2>Welcome back.</h2>
          <p>Pick up where you left off and ship the site you’ve been building.</p>
          <div className="auth-aside-art" />
        </div>
        <div className="auth-aside-foot">Trusted canvas for makers, studios and founders.</div>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <h1>Sign in</h1>
          <p className="auth-sub">Enter your details to continue.</p>

          {err && <div className="auth-error"><AlertCircle size={15} /> {err}</div>}

          <form onSubmit={submit} className="auth-form">
            <label className="auth-label">Email
              <input className="auth-input" type="email" value={email} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </label>
            <label className="auth-label">Password
              <input className="auth-input" type="password" value={password} autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </label>
            <button className="auth-btn auth-btn-primary" disabled={busy}>
              {busy ? <Loader2 size={16} className="spin" /> : null} Sign in
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <a className={`auth-btn auth-btn-google${googleOn ? "" : " disabled"}`}
            href={googleOn ? "/api/auth/google" : undefined}
            onClick={(e) => { if (!googleOn) e.preventDefault(); }}>
            <GoogleMark /> Continue with Google
          </a>
          {!googleOn && <p className="auth-tinyhint">Google sign-in activates once you add credentials to <code>server/.env</code>.</p>}

          <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 2.3 29.6 0 24 0 10.7 0 0 10.7 0 24s10.7 24 24 24 24-10.7 24-24c0-1.6-.2-2.8-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 2.3 29.6 0 24 0 15.3 0 7.8 5 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 48c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 39 26.7 40 24 40c-5.3 0-9.6-3.4-11.3-8.1l-6.5 5C7.7 43 15.2 48 24 48z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.3 5.3C41.7 41.1 48 36.3 48 24c0-1.6-.2-2.8-.4-3.5z" />
    </svg>
  );
}
