/* Vercel serverless function: GET /api/mymap?mid=<Google My Maps id>
   Browsers can't read a Google My Map directly (CORS), so this fetches its
   KML server-side and hands it to the site. Cached at Vercel's edge for 60s,
   so map edits show up within about a minute. */
module.exports = async (req, res) => {
  const mid = String((req.query && req.query.mid) || "");
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(mid)) { res.status(400).send("Invalid map id"); return; }
  try {
    const r = await fetch(`https://www.google.com/maps/d/kml?mid=${mid}&forcekml=1`, {
      redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (InterIIM-Hub)" }
    });
    const text = await r.text();
    if (!r.ok || !text.includes("<kml")) {
      res.status(502).send("Could not read the map. Is it shared as 'Anyone with the link can view'?");
      return;
    }
    res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    res.status(200).send(text);
  } catch (e) {
    res.status(502).send("Map fetch failed");
  }
};
