/* POST /api/admin  { token, action, ... }   Committee platform.
   Login: pick your name. A new phone needs the owner's one-tap approval (unless COMMITTEE_APPROVAL=off).
   The owner (Mrunal) logs in with OWNER_PASSWORD once per phone and can: approve/revoke phones, edit the member
   list, change publish switches and announcements, and undo/redo any change. Every change is kept in the history
   with its before/after value, so it can be reversed (an undo is itself a change that can be undone = redo). */
const { redis, hash, parse, P, OWNER, members, settings, str, num, newToken, safeEq } = require("./_store");
const STATUSES = ["scheduled", "live", "delayed", "done", "cancelled"];
const APPROVAL = String(process.env.COMMITTEE_APPROVAL || "on").toLowerCase() !== "off";
const STORE = {   // where each kind of change lives
  match: { get: k => redis("HGET", P + "matches", k), set: (k, v) => v == null ? redis("HDEL", P + "matches", k) : redis("HSET", P + "matches", k, JSON.stringify(v)) },
  standings: { get: k => redis("HGET", P + "standings", k), set: (k, v) => v == null ? redis("HDEL", P + "standings", k) : redis("HSET", P + "standings", k, JSON.stringify(v)) },
  roster: { get: k => redis("HGET", P + "rosters", k), set: (k, v) => v == null ? redis("HDEL", P + "rosters", k) : redis("HSET", P + "rosters", k, JSON.stringify(v)) },
  settings: { get: () => redis("GET", P + "settings"), set: (k, v) => v == null ? redis("DEL", P + "settings") : redis("SET", P + "settings", JSON.stringify(v)) },
  announce: { get: () => redis("GET", P + "announce"), set: (k, v) => v == null ? redis("DEL", P + "announce") : redis("SET", P + "announce", JSON.stringify(v)) },
  members: { get: () => redis("GET", P + "members"), set: (k, v) => v == null ? redis("DEL", P + "members") : redis("SET", P + "members", JSON.stringify(v)) }
};
const OWNER_ONLY = ["devices", "approve", "revoke", "deleteDevice", "setMembers", "setSettings", "setAnnounce", "undo"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  let b = req.body || {}; if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  try {
    const now = new Date().toISOString();
    const ip = String(req.headers["x-forwarded-for"] || "local").split(",")[0].trim();

    /* ---------- no login needed ---------- */
    if (b.action === "names") return res.json({ names: await members(), owner: OWNER, approval: APPROVAL });
    if (b.action === "request") {
      const list = await members(), name = list.find(n => n.toLowerCase() === str(b.name, 40).toLowerCase());
      if (!name) return res.status(400).json({ error: "That name isn't on the committee list." });
      let status = APPROVAL ? "pending" : "approved";
      if (name === OWNER) {
        const failKey = P + "fail:" + ip;
        if (Number(await redis("GET", failKey) || 0) >= 8) return res.status(429).json({ error: "Too many wrong passwords. Try again in 15 minutes." });
        if (!process.env.OWNER_PASSWORD) return res.status(503).json({ error: "OWNER_PASSWORD is not set in Vercel yet." });
        if (!safeEq(b.password, process.env.OWNER_PASSWORD)) { await redis("INCR", failKey); await redis("EXPIRE", failKey, 900); return res.status(401).json({ error: "Wrong password." }); }
        status = "approved";
      }
      const pending = Object.values(hash(await redis("HGETALL", P + "devices"))).filter(d => d.status === "pending").length;
      if (status === "pending" && pending >= 40) return res.status(429).json({ error: "Too many pending requests. Ask Mrunal to clear them." });
      const token = newToken();
      await redis("HSET", P + "devices", token, JSON.stringify({ name, status, device: str(b.device, 80), created: now, approvedBy: status === "approved" ? (name === OWNER ? "password" : "auto") : "" }));
      return res.json({ token, name, status });
    }
    if (b.action === "status") { const d = parse(await redis("HGET", P + "devices", str(b.token, 64)));
      return res.json(d ? { name: d.name, status: d.status, owner: d.name === OWNER } : { status: "unknown" }); }

    /* ---------- logged-in actions ---------- */
    const dev = parse(await redis("HGET", P + "devices", str(b.token, 64)));
    if (!dev || dev.status !== "approved") return res.status(401).json({ error: dev?.status === "pending" ? "Waiting for Mrunal to approve this phone." : "Please log in again.", status: dev?.status || "unknown" });
    const who = dev.name, owner = who === OWNER;
    if (!(await members()).includes(who)) return res.status(401).json({ error: "You're no longer on the committee list." });
    if (OWNER_ONLY.includes(b.action) && !owner) return res.status(403).json({ error: "Only Mrunal can do that." });

    const record = async (kind, key, before, after, detail, extra = {}) => {
      const lid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      await redis("LPUSH", P + "log", JSON.stringify({ lid, by: who, at: now, kind, key, before, after, detail, ...extra }));
      await redis("LTRIM", P + "log", 0, 999);
      return lid;
    };
    const change = async (kind, key, after, detail) => {
      const before = parse(await STORE[kind].get(key));
      await STORE[kind].set(key, after);
      await record(kind, key, before, after, detail);
      return after;
    };

    switch (b.action) {
      case "whoami": return res.json({ name: who, owner });
      case "load": {
        const [m, st, ro, s, lg, ann, mem] = await Promise.all([redis("HGETALL", P + "matches"), redis("HGETALL", P + "standings"),
          b.rosters === false ? [] : redis("HGETALL", P + "rosters"), settings(), redis("LRANGE", P + "log", 0, owner ? 199 : 59), redis("GET", P + "announce"), members()]);
        const out = { name: who, owner, approval: APPROVAL, matches: hash(m), standings: hash(st), settings: s, announce: parse(ann), members: mem,
          log: (lg || []).map(parse).filter(Boolean).map(l => owner ? l : { lid: l.lid, by: l.by, at: l.at, kind: l.kind, key: l.key, detail: l.detail, op: l.op }) };
        if (b.rosters !== false) out.rosters = hash(ro);
        if (owner) { const devs = hash(await redis("HGETALL", P + "devices")); out.devices = Object.entries(devs).map(([t, d]) => ({ id: t.slice(0, 10), ...d })); }
        return res.json(out);
      }
      case "setMatch": {
        const id = str(b.id, 140), d = b.data || {}; if (!id) return res.status(400).json({ error: "Missing match id" });
        const rec = { status: STATUSES.includes(d.status) ? d.status : "scheduled", delay: Math.max(0, Math.min(600, num(d.delay) || 0)),
          score: str(d.score, 120), winner: str(d.winner, 12), mvp: str(d.mvp, 60), mvpTeam: str(d.mvpTeam, 12), note: str(d.note, 140),
          pubStatus: d.pubStatus !== false, pubResult: d.pubResult !== false, pubMvp: d.pubMvp !== false, by: who, at: now };
        await change("match", id, rec, `${id.split("|").slice(1).join(" ")} → ${rec.status}${rec.status === "delayed" ? " +" + rec.delay + "m" : ""}${rec.score ? " · " + rec.score : ""}${rec.winner ? " · W: " + rec.winner : ""}${rec.mvp ? " · MVP " + rec.mvp : ""}`);
        return res.json({ ok: true, rec });
      }
      case "setStandings": {
        const key = str(b.key, 80); if (!key) return res.status(400).json({ error: "Missing table" });
        const rows = (Array.isArray(b.rows) ? b.rows : []).slice(0, 20).map(r => ({ team: str(r.team, 12), p: num(r.p), w: num(r.w), d: num(r.d), l: num(r.l), pts: num(r.pts), note: str(r.note, 80) })).filter(r => r.team);
        const rec = { rows, pub: b.pub !== false, by: who, at: now };
        await change("standings", key, rec, `${key} table · ${rows.length} teams${rec.pub ? "" : " (hidden)"}`);
        return res.json({ ok: true, rec });
      }
      case "setRoster": {
        const key = str(b.key, 100); if (!key) return res.status(400).json({ error: "Missing team" });
        const players = (Array.isArray(b.players) ? b.players : []).slice(0, 60).map(p => ({ name: str(p.name, 60), no: str(p.no, 8), phone: str(p.phone, 20), role: str(p.role, 20) })).filter(p => p.name);
        const rec = { players, by: who, at: now };
        await change("roster", key, rec, `${key.replace("|", " · ")} team list · ${players.length} players`);
        return res.json({ ok: true, rec });
      }
      /* ----- owner only ----- */
      case "setSettings": {
        const s = { results: b.settings?.results !== false, mvp: b.settings?.mvp !== false, standings: b.settings?.standings !== false };
        await change("settings", "publish", s, `Publish: results ${s.results ? "on" : "off"} · MVP ${s.mvp ? "on" : "off"} · standings ${s.standings ? "on" : "off"}`);
        return res.json({ ok: true, settings: s });
      }
      case "setAnnounce": {
        const items = (Array.isArray(b.items) ? b.items : []).slice(0, 8).map(a => ({ text: str(a.text, 280), level: a.level === "alert" ? "alert" : "info" })).filter(a => a.text);
        const rec = b.useDefault ? null : { items, by: who, at: now };
        await change("announce", "home", rec, rec ? `Announcements · ${items.length}` : "Announcements reset to site defaults");
        return res.json({ ok: true, announce: rec });
      }
      case "setMembers": {
        let list = [...new Set((Array.isArray(b.members) ? b.members : []).map(n => str(n, 40)).filter(Boolean))].slice(0, 60);
        if (!list.includes(OWNER)) list.push(OWNER);
        await change("members", "list", list, `Committee list · ${list.length} names`);
        return res.json({ ok: true, members: list });
      }
      case "devices": { const devs = hash(await redis("HGETALL", P + "devices")); return res.json({ devices: Object.entries(devs).map(([t, d]) => ({ id: t.slice(0, 10), ...d })) }); }
      case "approve": case "revoke": case "deleteDevice": {
        const devs = await redis("HGETALL", P + "devices"); const ids = [].concat(b.ids || b.id || []);
        let n = 0;
        for (let i = 0; i < devs.length; i += 2) {
          const t = devs[i], d = parse(devs[i + 1]); if (!d || !ids.includes(t.slice(0, 10))) continue;
          if (d.name === OWNER && t === str(b.token, 64) && b.action !== "approve") continue;   // don't lock yourself out
          if (b.action === "deleteDevice") await redis("HDEL", P + "devices", t);
          else await redis("HSET", P + "devices", t, JSON.stringify({ ...d, status: b.action === "approve" ? "approved" : "revoked", approvedBy: who, decidedAt: now }));
          n++;
        }
        await record("access", ids.join(","), null, null, `${b.action === "approve" ? "Approved" : b.action === "revoke" ? "Revoked" : "Removed"} ${n} phone(s)`);
        return res.json({ ok: true, n });
      }
      case "undo": {
        const lid = str(b.lid, 40), all = (await redis("LRANGE", P + "log", 0, 999)).map(parse).filter(Boolean);
        const e = all.find(l => l.lid === lid);
        if (!e || !STORE[e.kind]) return res.status(400).json({ error: "That change can't be undone." });
        const current = parse(await STORE[e.kind].get(e.key));
        if (!b.force && JSON.stringify(current) !== JSON.stringify(e.after)) {
          const later = all.find(l => l.kind === e.kind && l.key === e.key && l.at > e.at);
          return res.status(409).json({ conflict: true, error: `This was changed again after (${later ? `by ${later.by}` : "later"}). Undoing will overwrite that newer change.` });
        }
        await STORE[e.kind].set(e.key, e.before);
        const op = e.op === "undo" ? "redo" : "undo", base = e.base || e.detail || e.key;
        await record(e.kind, e.key, current, e.before, `${op === "redo" ? "↷ Redo" : "↶ Undo"}: ${base}`, { undoOf: lid, op, base });
        return res.json({ ok: true });
      }
      default: return res.status(400).json({ error: "Unknown action" });
    }
  } catch (e) { return res.status(e.code === "NODB" ? 503 : 500).json({ error: e.message }); }
};
