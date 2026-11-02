import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { query, pool } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }));

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });
const fieldSchema = z.object({
  name: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(240),
  crop: z.string().trim().max(120).optional().default(""),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  boundary: z.array(z.object({ lat: z.number(), lng: z.number() })).max(1000).optional().default([]),
  areaHectares: z.number().positive().max(1_000_000).nullable().optional(),
});
const missionSchema = z.object({
  fieldId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(160),
  targetZone: z.string().trim().max(100).optional().default(""),
  objective: z.string().trim().min(1).max(1000),
  plannedFor: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(4000).optional().default(""),
});
const observationSchema = z.object({
  fieldId: z.string().uuid().nullable().optional(),
  source: z.enum(["satellite", "drone", "scouting", "other"]),
  zone: z.string().trim().max(100).optional().default(""),
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().min(1).max(4000),
  severity: z.enum(["unclassified", "low", "moderate", "high"]).optional().default("unclassified"),
  ndvi: z.number().min(-1).max(1).nullable().optional(),
  observedAt: z.string().datetime().optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Check the form fields and try again.", details: parsed.error.flatten() });
    req.validated = parsed.data;
    next();
  };
}

function auth(req, res, next) {
  const token = req.cookies?.kv_session;
  if (!token) return res.status(401).json({ error: "Sign in to continue." });
  try {
    req.user = jwt.verify(token, jwtSecret, { issuer: "khetvardhan-api", audience: "khetvardhan-web" });
    next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, jwtSecret, { expiresIn: "12h", issuer: "khetvardhan-api", audience: "khetvardhan-web" });
}

function setSession(res, user) {
  res.cookie("kv_session", issueToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/api",
  });
}

app.get("/api/health", async (_req, res) => {
  try { await query("SELECT 1"); res.json({ status: "ok", database: "connected" }); }
  catch { res.status(503).json({ status: "degraded", database: "unavailable" }); }
});

app.post("/api/auth/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validated;
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await query("INSERT INTO users(name,email,password_hash) VALUES($1,lower($2),$3) RETURNING id,name,email", [name, email, passwordHash]);
    const user = rows[0];
    setSession(res, user);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "An account with this email already exists." });
    next(error);
  }
});

app.post("/api/auth/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const { rows } = await query("SELECT id,name,email,password_hash FROM users WHERE email=lower($1)", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Email or password is incorrect." });
    delete user.password_hash;
    setSession(res, user);
    res.json({ user });
  } catch (error) { next(error); }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("kv_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api" });
  res.status(204).end();
});

app.get("/api/auth/me", auth, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT id,name,email,created_at FROM users WHERE id=$1", [req.user.sub]);
    if (!rows[0]) return res.status(401).json({ error: "Account no longer exists." });
    res.json({ user: rows[0] });
  } catch (error) { next(error); }
});

app.get("/api/fields", auth, async (req, res, next) => {
  try { const { rows } = await query("SELECT * FROM fields WHERE user_id=$1 ORDER BY updated_at DESC", [req.user.sub]); res.json({ fields: rows }); }
  catch (error) { next(error); }
});
app.post("/api/fields", auth, validate(fieldSchema), async (req, res, next) => {
  try {
    const f = req.validated;
    const { rows } = await query("INSERT INTO fields(user_id,name,location,crop,latitude,longitude,boundary,area_hectares) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [req.user.sub, f.name, f.location, f.crop, f.latitude ?? null, f.longitude ?? null, JSON.stringify(f.boundary), f.areaHectares ?? null]);
    res.status(201).json({ field: rows[0] });
  } catch (error) { next(error); }
});
app.patch("/api/fields/:id", auth, validate(fieldSchema), async (req, res, next) => {
  try {
    const f = req.validated;
    const { rows } = await query("UPDATE fields SET name=$1,location=$2,crop=$3,latitude=$4,longitude=$5,boundary=$6,area_hectares=$7,updated_at=now() WHERE id=$8 AND user_id=$9 RETURNING *", [f.name, f.location, f.crop, f.latitude ?? null, f.longitude ?? null, JSON.stringify(f.boundary), f.areaHectares ?? null, req.params.id, req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: "Field not found." });
    res.json({ field: rows[0] });
  } catch (error) { next(error); }
});
app.delete("/api/fields/:id", auth, async (req, res, next) => {
  try { const { rowCount } = await query("DELETE FROM fields WHERE id=$1 AND user_id=$2", [req.params.id, req.user.sub]); if (!rowCount) return res.status(404).json({ error: "Field not found." }); res.status(204).end(); }
  catch (error) { next(error); }
});

app.get("/api/missions", auth, async (req, res, next) => {
  try { const { rows } = await query("SELECT m.*,f.name AS field_name FROM missions m LEFT JOIN fields f ON f.id=m.field_id WHERE m.user_id=$1 ORDER BY m.created_at DESC", [req.user.sub]); res.json({ missions: rows }); }
  catch (error) { next(error); }
});
app.post("/api/missions", auth, validate(missionSchema), async (req, res, next) => {
  try {
    const m = req.validated;
    if (m.fieldId) {
      const owned = await query("SELECT 1 FROM fields WHERE id=$1 AND user_id=$2", [m.fieldId, req.user.sub]);
      if (!owned.rowCount) return res.status(400).json({ error: "Choose one of your saved fields." });
    }
    const { rows } = await query("INSERT INTO missions(user_id,field_id,name,target_zone,objective,planned_for,notes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *", [req.user.sub, m.fieldId ?? null, m.name, m.targetZone, m.objective, m.plannedFor ?? null, m.notes]);
    res.status(201).json({ mission: rows[0] });
  } catch (error) { next(error); }
});
app.patch("/api/missions/:id/status", auth, async (req, res, next) => {
  const status = z.enum(["draft", "planned", "ready_for_review", "completed", "cancelled"]).safeParse(req.body?.status);
  if (!status.success) return res.status(400).json({ error: "Select a valid mission status." });
  try {
    const { rows } = await query("UPDATE missions SET status=$1,updated_at=now() WHERE id=$2 AND user_id=$3 RETURNING *", [status.data, req.params.id, req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: "Mission not found." });
    res.json({ mission: rows[0] });
  } catch (error) { next(error); }
});

app.get("/api/observations", auth, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT o.*,f.name AS field_name FROM observations o LEFT JOIN fields f ON f.id=o.field_id WHERE o.user_id=$1 ORDER BY o.observed_at DESC LIMIT 500", [req.user.sub]);
    res.json({ observations: rows });
  } catch (error) { next(error); }
});
app.post("/api/observations", auth, validate(observationSchema), async (req, res, next) => {
  try {
    const o = req.validated;
    if (o.fieldId) {
      const owned = await query("SELECT 1 FROM fields WHERE id=$1 AND user_id=$2", [o.fieldId, req.user.sub]);
      if (!owned.rowCount) return res.status(400).json({ error: "Choose one of your saved fields." });
    }
    const { rows } = await query("INSERT INTO observations(user_id,field_id,source,zone,title,summary,severity,ndvi,observed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::timestamptz,now())) RETURNING *", [req.user.sub, o.fieldId ?? null, o.source, o.zone, o.title, o.summary, o.severity, o.ndvi ?? null, o.observedAt ?? null]);
    res.status(201).json({ observation: rows[0] });
  } catch (error) { next(error); }
});

const webRoot = fileURLToPath(new URL("../../dist/", import.meta.url));
app.use(express.static(webRoot, {
  index: "index.html",
  maxAge: process.env.NODE_ENV === "production" ? "1y" : 0,
  immutable: process.env.NODE_ENV === "production",
  setHeaders(res, filePath) {
    if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
  },
}));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/") && req.accepts("html")) {
    return res.sendFile(fileURLToPath(new URL("../../dist/index.html", import.meta.url)));
  }
  next();
});

app.use((error, _req, res, _next) => {
  void _next;
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Try again shortly." });
});

const server = app.listen(port, () => console.log(`KhetVardhan API listening on ${port}`));
async function shutdown() { server.close(); await pool.end(); process.exit(0); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
