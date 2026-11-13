/* GET /api/schedule?id=<sheet id>&sheet=<tab name>
   Reads one tab of the schedule Google Sheet as CSV. Vercel caches it for 60s,
   so Google sees ~1 request a minute however many people open the site. */
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || ""), sheet = String((req.query && req.query.sheet) || "");
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(id) || !sheet || sheet.length > 80) { res.status(400).send("Invalid request"); return; }
  try {
    const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(sheet)}`, { redirect: "follow" });
    const text = await r.text();
    if (!r.ok || text.trim().startsWith("<")) { res.status(502).send("Sheet not readable. Is it shared as 'Anyone with the link'?"); return; }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");
    res.status(200).send(text);
  } catch (e) { res.status(502).send("Sheet fetch failed"); }
};
