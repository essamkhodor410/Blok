import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { config } from "../config.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatar_url: u.avatar_url,
  provider: u.provider,
});

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- register ----------
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });
    if (!emailRe.test(email))
      return res.status(400).json({ error: "Please enter a valid email" });
    if (String(password).length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.length) return res.status(409).json({ error: "An account with that email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const rows = await query(
      "INSERT INTO users (name, email, password_hash, provider) VALUES ($1,$2,$3,'local') RETURNING *",
      [name, email, hash]
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

// ---------- login ----------
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const rows = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user || !user.password_hash)
      return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

// ---------- current user ----------
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(rows[0]) });
  } catch (e) { next(e); }
});

// ---------- Google OAuth ----------
router.get("/google", (req, res) => {
  if (!config.google.enabled)
    return res.status(501).json({ error: "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env" });

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req, res, next) => {
  try {
    if (!config.google.enabled) return res.status(501).send("Google sign-in is not configured.");
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing authorization code");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) return res.status(401).send("Google token exchange failed");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) return res.status(401).send("Could not read Google profile");

    let rows = await query("SELECT * FROM users WHERE email = $1", [profile.email]);
    let user = rows[0];
    if (!user) {
      rows = await query(
        "INSERT INTO users (name, email, avatar_url, provider) VALUES ($1,$2,$3,'google') RETURNING *",
        [profile.name || profile.email.split("@")[0], profile.email, profile.picture || null]
      );
      user = rows[0];
    }

    const token = signToken(user);
    res.redirect(`${config.clientOrigin}/auth/callback#token=${token}`);
  } catch (e) { next(e); }
});

router.get("/google/status", (req, res) => res.json({ enabled: config.google.enabled }));

export default router;
