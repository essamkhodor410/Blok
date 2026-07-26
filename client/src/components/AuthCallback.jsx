import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../auth.jsx";

export default function AuthCallback() {
  const { setTokenAndLoad } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("token");
    if (!token) { setError("No sign-in token was returned."); return; }
    setTokenAndLoad(token)
      .then(() => nav("/dashboard", { replace: true }))
      .catch((e) => setError(e.message || "Sign-in failed."));
  }, [setTokenAndLoad, nav]);

  return (
    <div className="auth-callback">
      {error ? (
        <div className="auth-callback-box">
          <AlertCircle size={22} />
          <p>{error}</p>
          <a className="auth-btn" href="/login">Back to sign in</a>
        </div>
      ) : (
        <div className="auth-callback-box"><Loader2 size={24} className="spin" /><p>Signing you in…</p></div>
      )}
    </div>
  );
}
