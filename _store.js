/* Shared helpers for the committee platform (files starting with "_" are not public routes on Vercel).
   Storage: Upstash Redis REST. Connect it from Vercel → Storage → Upstash for Redis; Vercel then adds
   KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) automatically.
   Env vars:
     OWNER_PASSWORD       Mrunal's password (needed once per device to log in as the owner)
     COMMITTEE_APPROVAL   "off" = members log in by name with no approval (default: owner approves each new phone) */
const crypto = require("crypto");
const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const P = "iim26:";
const OWNER = "Mrunal";
const DEFAULT_MEMBERS = ["Akash", "Akshat", "Amruth", "Ayushi", "Prajwal", "Rahul", "Sushant", "Yash", "Ajay",
  "Anagha", "Dvitika", "Hrithik", "Laveena", "Melvin", "Shashi", "Shubham", "Thrupthi", "Mrunal"];

async function redis(...cmd) {
  if (!DB_URL || !DB_TOKEN) { const e = new Error("Database not connected yet (see README: Committee platform)."); e.code = "NODB"; throw e; }
  const r = await fetch(DB_URL, { method: "POST", headers: { Authorization: `Bearer ${DB_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({ error: `Database error ${r.status}` }));
  if (j.error) throw new Error(j.error);
  return j.result;
}
const hash = arr => { const o = {}; for (let i = 0; Array.isArray(arr) && i < arr.length; i += 2) { try { o[arr[i]] = JSON.parse(arr[i + 1]); } catch { /* skip */ } } return o; };
const parse = v => { try { return v == null ? null : JSON.parse(v); } catch { return null; } };
async function members() { const m = parse(await redis("GET", P + "members")); const list = Array.isArray(m) && m.length ? m : DEFAULT_MEMBERS;
  return list.includes(OWNER) ? list : [...list, OWNER]; }
const DEFAULT_SETTINGS = { results: true, mvp: true, standings: true };
async function settings() { return { ...DEFAULT_SETTINGS, ...(parse(await redis("GET", P + "settings")) || {}) }; }
const str = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const num = v => { if (v === "" || v == null) return null; const x = Number(v); return Number.isFinite(x) ? Math.max(-999, Math.min(999, Math.round(x))) : null; };
const newToken = () => crypto.randomBytes(24).toString("base64url");
const safeEq = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y); };
module.exports = { redis, hash, parse, P, OWNER, DEFAULT_MEMBERS, members, settings, str, num, newToken, safeEq };
