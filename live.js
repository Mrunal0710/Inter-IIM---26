/* GET /api/live: what the PUBLIC site may show: match status/delay; results/MVP/standings only where both
   the master switch and the item's own "public" switch are on; live announcements. Team lists are never included. */
const { redis, hash, parse, P, settings } = require("./_store");
module.exports = async (req, res) => {
  try {
    const [m, st, s, ann] = await Promise.all([redis("HGETALL", P + "matches"), redis("HGETALL", P + "standings"), settings(), redis("GET", P + "announce")]);
    const matches = {};
    for (const [id, x] of Object.entries(hash(m))) {
      const o = {};
      if (x.pubStatus !== false && x.status && x.status !== "scheduled") { o.status = x.status; o.delay = x.delay || 0; if (x.note) o.note = x.note; }
      if (s.results && x.pubResult !== false && (x.score || x.winner)) { o.score = x.score || ""; o.winner = x.winner || ""; }
      if (s.mvp && x.pubMvp !== false && x.mvp) { o.mvp = x.mvp; o.mvpTeam = x.mvpTeam || ""; }
      if (Object.keys(o).length) matches[id] = o;
    }
    const standings = {};
    if (s.standings) for (const [k, x] of Object.entries(hash(st))) if (x.pub !== false && Array.isArray(x.rows)) standings[k] = { rows: x.rows, at: x.at };
    const a = parse(ann);
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
    res.status(200).json({ matches, standings, settings: s, announcements: Array.isArray(a?.items) ? a.items : null, at: Date.now() });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(e.code === "NODB" ? 503 : 500).json({ error: e.message });
  }
};
