/* GET /api/weather: campus weather from Open-Meteo, cached 15 min at Vercel's edge. */
module.exports = async (req, res) => {
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=11.2943&longitude=75.8736&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m&hourly=precipitation_probability&forecast_days=2&timezone=Asia%2FKolkata");
    if (!r.ok) { res.status(502).send("weather unavailable"); return; }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.status(200).send(await r.text());
  } catch (e) { res.status(502).send("weather unavailable"); }
};
