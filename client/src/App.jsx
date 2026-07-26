import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth.jsx";
import Landing from "./components/Landing.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import AuthCallback from "./components/AuthCallback.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Builder from "./components/Builder.jsx";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="app-loader"><Loader2 size={22} className="spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, ready } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={ready && user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={ready && user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/builder/:projectId" element={<Protected><Builder /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
