/* Inter IIM '26 Contingent Hub. Content: data.js + mymap-data.js (+ optional live Google Sheets). No fixtures: those live on Sportagon. */
(() => {
  "use strict";
  const S = window.SITE, C = S.config, A = window.ASSETS || {};
  S.teams.forEach(t => { if (A[t.id]) t.logo = A[t.id]; });   // embedded logos (always load)
  const EMBLEM = A.emblem || "assets/emblem.png", CREST = A.crest || "assets/sports-crest.png";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }
  };
  const PICK = new URLSearchParams(location.search).has("pick");

  /* ---------- time: 00:00–03:59 belongs to the previous event day ---------- */
  const LATE = 240;
  const pad = n => String(n).padStart(2, "0");
  const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toMin = hm => { const [h, m] = String(hm).split(":").map(Number); return h * 60 + (m || 0); };
  const ev = hm => { const m = toMin(hm); return m < LATE ? m + 1440 : m; };
  function now() {
    const d = new Date(); let m = d.getHours() * 60 + d.getMinutes();
    if (m < LATE) { d.setDate(d.getDate() - 1); m += 1440; }
    return { iso: isoOf(d), min: m };
  }
  const fmt12 = hm => { let [h, m] = String(hm).split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${pad(m || 0)} ${ap}`; };
  const fmtIn = m => m <= 0 ? "now" : m < 60 ? `in ${m} min` : `in ${Math.floor(m / 60)}h ${m % 60}m`;
  const fmtDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const dayByKey = k => S.days.find(d => d.key === k);
  const todayDay = () => S.days.find(d => d.date === now().iso);
  const firstUpcomingDay = () => todayDay() || S.days.find(d => d.date > now().iso) || null;
  function phase() {
    const t = now().iso, first = S.days[0].date, last = S.days[S.days.length - 1].date;
    if (t < first) return { kind: "before", first };
    if (t > last) return { kind: "after" };
    return { kind: "during", day: todayDay() };
  }
  const isToday = key => todayDay()?.key === key;

  /* ---------- helpers ---------- */
  const tel = p => `tel:${String(p).replace(/[^\d+]/g, "")}`;
  const wa = p => `https://wa.me/${String(p).replace(/[^\d]/g, "")}`;
  const prettyPhone = p => { const d = String(p).replace(/[^\d]/g, ""); return d.length === 12 && d.startsWith("91") ? `${d.slice(2, 7)} ${d.slice(7)}` : p; };
  const placeById = id => S.places.find(p => p.id === id);
  const catById = id => S.categories.find(c => c.id === id) || { label: id, emoji: "📍", color: "#888" };
  const teamByLetter = l => S.teams.find(t => t.letter === l);
  const teamById = id => S.teams.find(t => t.id === id);
  const myTeam = () => teamById(store.get("team"));
  const baseSport = s => String(s).replace(/\s*\(.*?\)\s*/g, "").trim();
  const sportEmoji = s => S.sportEmoji[baseSport(s)] || "🏅";
  const venueOf = s => placeById(S.venues[baseSport(s)]);
  function directionsUrl(p) {
    const dest = p.gmaps ? encodeURIComponent(p.gmaps) : `${p.lat},${p.lng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  }
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200); }
  async function copy(text) { try { await navigator.clipboard.writeText(text); toast("Copied"); } catch { toast(text); } }
  const sportagonLink = (cls = "btn accent", label = `Open ${C.sportagonName} ↗`) =>
    C.sportagonUrl ? `<a class="${cls}" href="${esc(C.sportagonUrl)}" target="_blank" rel="noopener">${label}</a>`
                   : `<span class="${cls}" aria-disabled="true" title="Add sportagonUrl in data.js">${esc(C.sportagonName)} link coming soon</span>`;
  const badge = (t, size = 24) => t ? `<span class="tm"><img src="${esc(t.logo)}" alt="" width="${size}" height="${size}" loading="lazy">${esc(t.short)}</span>` : "";

  /* ---------- buses ---------- */
  const seq = t => [t.from, ...(t.via || []), t.to];
  const serves = (t, a, b) => { const s = seq(t), i = s.indexOf(a), j = s.indexOf(b); return i >= 0 && j > i; };
  const busesOn = key => S.buses.filter(t => t.d === key).sort((a, b) => ev(a.t) - ev(b.t));
  function routeHTML(t, a, b) {
    return seq(t).map(s => `<span class="${s === a || s === b ? "hl" : ""}">${esc(s)}</span>`).join(`<i>→</i>`);
  }

  /* ---------- food ---------- */
  function foodStatus() {
    const n = now();
    return S.food.map(f => { const st = ev(f.start), en = ev(f.end) <= st ? ev(f.end) + 1440 : ev(f.end);
      return { ...f, open: n.min >= st && n.min < en, st, en }; });
  }

  /* ---------- team picker ---------- */
  function renderTeamBtn() {
    const t = myTeam(), b = $("#contBtn");
    b.innerHTML = t ? `<img src="${esc(t.logo)}" alt="" width="20" height="20">${esc(t.short)} ▾` : "Your IIM ▾";
    b.classList.toggle("set", !!t);
  }
  function openTeamDialog() {
    const d = $("#contDialog"), cur = store.get("team");
    $("#contList").innerHTML = S.teams.map(t =>
      `<button type="button" data-id="${esc(t.id)}" class="${t.id === cur ? "on" : ""}"><img src="${esc(t.logo)}" alt="" width="40" height="40"><span><b>${esc(t.short)}</b><small>${t.visiting ? esc(t.name) : "Host"}</small></span></button>`
    ).join("");
    $$("#contList button").forEach(b => b.onclick = () => {
      store.set("team", b.dataset.id); xTeam = null; d.close(); renderTeamBtn(); rerender(); toast("Saved on this phone");
    });
    d.showModal ? d.showModal() : d.setAttribute("open", "");
  }

  /* ---------- header ---------- */
  function renderPhase() {
    const el = $("#phase"), ph = phase();
    el.classList.remove("live");
    if (ph.kind === "before") {
      const days = Math.round((new Date(ph.first + "T00:00:00") - new Date(now().iso + "T00:00:00")) / 864e5);
      el.textContent = days <= 1 ? "Starts tomorrow" : `In ${days} days`;
    } else if (ph.kind === "during") { el.textContent = `${ph.day.label} · Live`; el.classList.add("live"); }
    else el.textContent = "That's a wrap";
  }

  /* ---------- weather (Open-Meteo, free, no key) ---------- */
  const WX = { 0: ["☀️", "Clear"], 1: ["🌤️", "Mostly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Overcast"], 45: ["🌫️", "Fog"], 48: ["🌫️", "Fog"],
    51: ["🌦️", "Drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌦️", "Drizzle"], 61: ["🌧️", "Light rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"],
    80: ["🌦️", "Showers"], 81: ["🌧️", "Showers"], 82: ["⛈️", "Heavy showers"], 95: ["⛈️", "Thunderstorm"], 96: ["⛈️", "Thunderstorm"], 99: ["⛈️", "Thunderstorm"] };
  let wxCache = null;
  async function fillWeather() {
    const box = $("#wxBox"); if (!box) return;
    try {
      if (!wxCache) {
        const [lat, lng] = C.mapCenter;
        let r = await fetch("/api/weather").catch(() => null);   // cached proxy (Vercel); direct as fallback
        if (!r || !r.ok) r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m&hourly=precipitation_probability&forecast_days=2&timezone=Asia%2FKolkata`);
        if (!r.ok) throw new Error("wx");
        const j = await r.json(), h = new Date().getHours(), p = (j.hourly?.precipitation_probability || []).slice(h, h + 6);
        wxCache = { ...j.current, rain6: p.length ? Math.max(...p) : null };
      }
      const w = wxCache, [ic, txt] = WX[w.weather_code] || ["🌡️", "Weather"];
      box.innerHTML = `<div class="wx"><div class="big">${ic}</div><div><b>${Math.round(w.temperature_2m)}°C</b>
        <div class="small muted">${txt} · feels ${Math.round(w.apparent_temperature)}° · humidity ${w.relative_humidity_2m}%</div>
        ${w.rain6 != null ? `<div style="margin-top:5px"><span class="tag ${w.rain6 >= 50 ? "warn" : "ok"}">Rain chance next 6h: ${w.rain6}%</span></div>` : ""}</div></div>`;
    } catch { box.innerHTML = `<p class="small muted" style="margin:0">Weather is unavailable offline.</p>`; }
  }

  /* =================================================================== HOME
     Priority for first-time visitors: sports venues → common rooms → washrooms → mess → everything else. */
  let homeBusStop = store.get("busFrom") || "Main Gate";
  function distKm(a, b) { const R = 6371, r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]);
    const x = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
  const isOff = p => !!p && distKm([p.lat, p.lng], C.mapCenter) > 2.5;
  function venueGroups() {
    const by = {}; Object.entries(S.venues).forEach(([sport, pid]) => (by[pid] ||= []).push(sport));
    return Object.entries(by).map(([pid, sports]) => ({ place: placeById(pid), sports })).filter(g => g.place)
      .sort((a, b) => isOff(a.place) - isOff(b.place));
  }
  function mealStatus() {
    const n = now(), M = S.mess.meals.map(m => ({ ...m, st: ev(m.start), en: ev(m.end) }));
    return { cur: M.find(m => n.min >= m.st && n.min < m.en), next: M.find(m => m.st > n.min), n };
  }
  const chev = `<span class="chev" aria-hidden="true">›</span>`;
  function renderHome() {
    const ph = phase();
    let countdown = "";
    if (ph.kind === "before") {
      const ms = new Date(`${S.days[0].date}T08:00:00`) - new Date();
      const d = Math.max(0, Math.floor(ms / 864e5)), h = Math.max(0, Math.floor(ms / 36e5) % 24), m = Math.max(0, Math.floor(ms / 6e4) % 60);
      countdown = `<div class="countdown"><div><b>${d}</b><span>days</span></div><div><b>${h}</b><span>hrs</span></div><div><b>${m}</b><span>min</span></div></div>`;
    }
    const range = `${fmtDate(S.days[0].date)} – ${fmtDate(S.days[S.days.length - 1].date)}`;
    const notes = (S.announcements || []).map(a => `<div class="notice ${a.level === "alert" ? "alert" : ""}"><i>${a.level === "alert" ? "⚠️" : "📣"}</i><div>${esc(a.text)}</div></div>`).join("");

    // 1. Sports venues
    const venues = venueGroups().map(g => { const off = isOff(g.place);
      return `<a class="vrow" href="#map/${esc(g.place.id)}"><div class="v-ico">${g.sports.slice(0, 3).map(s => S.sportEmoji[s] || "🏅").join("")}</div>
        <div class="v-b"><b>${esc(g.sports.join(" · "))}</b><span>${off ? `<em class="offtag">Off campus</em> ` : ""}${esc(g.place.name)}</span></div>${chev}</a>`; }).join("");
    // 2. Common rooms & stay
    const rooms = S.places.filter(p => p.cat === "stay").map(p => `<a class="vrow" href="#map/${esc(p.id)}"><div class="v-ico">${isOff(p) ? "🛏️" : "🛋️"}</div>
      <div class="v-b"><b>${esc(p.name)}</b><span>${isOff(p) ? `<em class="offtag">Off campus</em> ` : ""}${esc((p.desc || "").replace(/^Washrooms:\s*/, "🚻 "))}</span></div>${chev}</a>`).join("");
    // 4. Mess
    const ms = mealStatus(), live = !!todayDay();
    const messLine = !live ? `Breakfast ${fmt12(S.mess.meals[0].start)} · Lunch ${fmt12(S.mess.meals[1].start)} · Dinner ${fmt12(S.mess.meals[2].start)}`
      : ms.cur ? `<span class="tag ok">● Serving ${esc(ms.cur.label)}</span> till ${fmt12(ms.cur.end)}`
      : ms.next ? `Next: <b>${esc(ms.next.label)}</b> at ${fmt12(ms.next.start)} (${fmtIn(ms.next.st - ms.n.min)})` : `Mess closed for today`;

    // Next campus buses
    let busHTML = "";
    const bday = firstUpcomingDay();
    if (bday) {
      const lv = isToday(bday.key), n = now();
      const nexts = busesOn(bday.key).filter(b => seq(b).slice(0, -1).includes(homeBusStop) && (!lv || ev(b.t) >= n.min)).slice(0, 3);
      busHTML = `<div class="section"><div class="section-head"><h2>🚌 Next campus buses</h2><a href="#transport/bus">Bus finder →</a></div>
        <div class="chips scroll-x" style="margin-bottom:10px">${S.busStops.map(s => `<button class="chip ${s === homeBusStop ? "on" : ""}" data-stop="${esc(s)}">From ${esc(s)}</button>`).join("")}</div>
        <div class="card list">${nexts.length ? nexts.map(b => `<div class="bus-row"><div class="bt"><b>${fmt12(b.t)}</b>${lv ? `<small>${fmtIn(ev(b.t) - n.min)}</small>` : `<small>${esc(bday.label)}</small>`}</div>
          <div class="route-line">${routeHTML(b, homeBusStop)}</div></div>`).join("") : `<p class="muted small" style="margin:0">No more buses from ${esc(homeBusStop)} today. Try an auto.</p>`}</div></div>`;
    }

    $("#view-home").innerHTML = `
      <div class="hero"><img class="hero-emblem" src="${EMBLEM}" alt=""><div class="kicker">Hosted by ${esc(C.host)}</div><h1>${esc(C.eventName)}</h1>
        <p><b>${range}</b><br>Venues, mess, buses and autos, all in one place.</p>${countdown}
        ${C.sportagonUrl ? `<a class="hero-cta" href="${esc(C.sportagonUrl)}" target="_blank" rel="noopener">🏆 Fixtures & live scores on ${esc(C.sportagonName)} ↗</a>` : ""}</div>
      ${notes ? `<div class="section notes">${notes}</div>` : ""}

      <div class="section"><div class="section-head"><h2>🏟️ Sports venues</h2><a href="#map/only-sports">All on map →</a></div>
        <div class="card vlist">${venues}</div>
        <a class="btn ghost full" style="margin-top:10px" href="#transport/shuttle">🚐 Shuttle to cricket, badminton & boys' accommodation</a></div>

      <div class="section"><div class="section-head"><h2>🛋️ Common rooms</h2><a href="#map/only-common">On map →</a></div>
        <div class="card vlist">${rooms}</div></div>

      <div class="section"><div class="section-head"><h2>🚻 Washrooms</h2></div>
        <div class="row two"><a class="btn full" href="#map/only-utility">Show on map</a><a class="btn ghost full" href="#help/washrooms">Which one to use?</a></div></div>

      <div class="section"><div class="section-head"><h2>🍽️ Mess</h2><a href="#food">Menu →</a></div>
        <a class="card mess-card" href="#food"><div class="mc-top"><div><b>${esc(S.mess.name)}</b><span>${esc(S.mess.where)} · for all contingents</span></div>${chev}</div>
        <div class="mc-status">${messLine}</div><div class="small muted">🎟️ ${esc(S.mess.note)}</div></a></div>

      ${homeFixturesHTML()}
      ${homeShuttleHTML()}
      <div class="section quick">
        ${C.sportagonUrl ? `<a class="qa primary" href="${esc(C.sportagonUrl)}" target="_blank" rel="noopener"><i>🏆</i>Sportagon</a>` : `<span class="qa primary" aria-disabled="true"><i>🏆</i>Sportagon</span>`}
        <a class="qa dark" href="#map"><i>🗺️</i>Map</a>
        <a class="qa" href="#transport/bus"><i>🚌</i>Campus bus</a>
        <a class="qa" href="#transport/autos"><i>🛺</i>Autos</a>
        <a class="qa" href="#fixtures"><i>📅</i>Fixtures</a>
        <a class="qa" href="#food"><i>🍛</i>Menu</a>
        <a class="qa" href="#transport/shuttle"><i>🚐</i>Shuttle</a>
        <a class="qa sos" href="#help"><i>🚨</i>SOS</a>
      </div>
      ${busHTML}
      <div class="section grid grid-2">
        <div><div class="section-head"><h2>Weather on campus</h2></div><div class="card" id="wxBox"><p class="small muted" style="margin:0">Loading…</p></div></div>
        <div><div class="banner"><div><h3>Live scores & results</h3><p>Fixtures, live scores and the medal table are on ${esc(C.sportagonName)}.</p></div>${sportagonLink()}</div></div>
      </div>
      <div class="foot"><img src="${CREST}" alt="IIM Kozhikode Sports Committee" width="110"><p>Made by the IIM Kozhikode Sports Committee. Add this page to your home screen.</p></div>`;
    $$("#view-home [data-stop]").forEach(b => b.onclick = () => { homeBusStop = b.dataset.stop; store.set("busFrom", homeBusStop); renderHome(); });
    $$("#view-home [data-shhome]").forEach(b => b.onclick = () => { store.set("shHome", b.dataset.shhome); renderHome(); });
    fillWeather();
  }
  /* =================================================================== FOOD (BL Mess) */
  let fDay = null;
  const NONVEG = /chicken|egg|omelette|mutton|fish|prawn/i;
  function dishHTML(item) {
    const parts = NONVEG.test(item) && item.includes(" / ") ? item.split(" / ") : [item];
    return `<li>${parts.map(x => `<span class="dish"><i class="vd ${NONVEG.test(x) ? "nv" : "v"}"></i>${esc(x)}</span>`).join(`<em class="or">or</em>`)}</li>`;
  }
  function renderFood() {
    const M = S.mess, p = placeById(M.place);
    if (!fDay) fDay = (firstUpcomingDay() || S.days[0]).key;
    const live = isToday(fDay), ms = mealStatus(), menu = M.menu[fDay] || {};
    const status = !todayDay() ? "" : ms.cur ? `<div class="mess-now ok">● Now serving <b>${esc(ms.cur.label)}</b> until ${fmt12(ms.cur.end)}</div>`
      : ms.next ? `<div class="mess-now">Next: <b>${esc(ms.next.label)}</b> at ${fmt12(ms.next.start)} · ${fmtIn(ms.next.st - ms.n.min)}</div>` : `<div class="mess-now">The mess is closed for today. See you at breakfast!</div>`;
    const fs = foodStatus();
    $("#view-food").innerHTML = `
      <div class="card mess-head"><div class="mh-ico">🍽️</div><div><h2>${esc(M.name)}</h2><p>${esc(M.where)} · for ALL contingents</p></div></div>
      <div class="notice alert" style="margin-top:10px"><i>🎟️</i><div>${esc(M.note)}</div></div>
      <div class="row two" style="margin-top:10px">${p ? `<a class="btn full" href="#map/${esc(p.id)}">Show on map</a><a class="btn ghost full" href="${directionsUrl(p)}" target="_blank" rel="noopener">Directions ↗</a>` : ""}</div>
      ${status}
      <div class="section"><div class="section-head"><h2>Timings</h2></div><div class="card meal-times">
        ${M.meals.map(m => `<div class="${live && ms.cur?.id === m.id ? "on" : ""}"><b>${esc(m.label)}</b><span>${fmt12(m.start)} – ${fmt12(m.end)}</span></div>`).join("")}</div></div>
      <div class="section"><div class="section-head"><h2>Menu</h2><span class="small muted"><i class="vd v"></i> veg <i class="vd nv"></i> non-veg</span></div>
        <div class="chips scroll-x" style="margin-bottom:10px">${S.days.map(d => `<button class="chip ${fDay === d.key ? "on" : ""}" data-fd="${d.key}">${fmtDate(d.date)}${isToday(d.key) ? " · today" : ""}</button>`).join("")}</div>
        ${M.meals.map(m => { const items = menu[m.id] || [], st = ev(m.start), en = ev(m.end), n = ms.n.min;
          const tag = live ? (n >= st && n < en ? `<span class="tag ok">● Serving now</span>` : n >= en ? `<span class="tag">Over</span>` : `<span class="tag">${fmtIn(st - n)}</span>`) : "";
          return `<div class="card meal ${live && n >= en ? "past" : ""} ${live && n >= st && n < en ? "now" : ""}"><div class="meal-h"><h3>${esc(m.label)}</h3><span>${fmt12(m.start)} – ${fmt12(m.end)}</span>${tag}</div>
            ${items.length ? `<ul class="dishes">${items.map(dishHTML).join("")}</ul>` : `<p class="small muted">Menu not posted yet.</p>`}</div>`; }).join("")}
      </div>
      <div class="section"><div class="section-head"><h2>☕ Snacks</h2></div><div class="card"><table><tbody>
        ${fs.map(f => { const pl = placeById(f.where); return `<tr><td><b>${esc(f.meal)}</b>${f.open ? ` <span class="tag ok">Open</span>` : ""}${pl ? `<div class="small"><a href="#map/${esc(pl.id)}">On map</a></div>` : ""}</td><td class="r">${fmt12(f.start)} – ${fmt12(f.end)}</td></tr>`; }).join("")}
      </tbody></table></div></div>`;
    $$("#view-food [data-fd]").forEach(b => b.onclick = () => { fDay = b.dataset.fd; renderFood(); });
  }

  /* =================================================================== FIXTURES
     From the schedule Google Sheet (live via /api/schedule), fallback: saved copy, then fixtures.js. */
  let FX = (window.FIXTURES || []).slice(), fxSource = { kind: "built-in", at: "" };
  const pairsOf = m => String(m).split(/\s*&\s*/).map(x => x.trim()).filter(Boolean);
  const teamsIn = m => pairsOf(m).flatMap(p => p.toUpperCase().split(/\s+VS\s+/).map(x => x.trim()).filter(x => x.length === 1));
  const isKnockout = m => !teamsIn(m).length;
  function matchHTML(m) {
    return pairsOf(m).map(p => { const parts = p.split(/\s+VS\s+/i).map(x => x.trim().toUpperCase());
      return parts.length === 2 && parts.every(x => teamByLetter(x))
        ? `<span class="vs">${badge(teamByLetter(parts[0]))}<i>vs</i>${badge(teamByLetter(parts[1]))}</span>`
        : `<span class="stage">${esc(p)}</span>`; }).join("");
  }
  const fxSorted = list => list.slice().sort((a, b) => ev(a.t) - ev(b.t) || a.s.localeCompare(b.s));
  const involves = (f, team) => !team || teamsIn(f.m).includes(team.letter);
  function fxVenue(s) {
    const p = placeById(S.venues[baseSport(s)]), note = S.venueNotes[s];
    return p ? `📍 <a href="#map/${esc(p.id)}">${esc(note || p.name)}</a>` : "";
  }
  const fxState = (f, live, n) => { if (!live) return ""; const st = ev(f.t);
    return n >= st && n < st + 60 ? `<span class="tag live-tag">● Now</span>` : n >= st + 60 ? `<span class="tag">Done</span>` : `<span class="tag">${fmtIn(st - n)}</span>`; };

  let xDay = null, xSport = "all", xTeam = null;
  function renderFixtures(arg) {
    if (arg) { const s = [...new Set(FX.map(f => f.s))].find(x => nameKey(baseSport(x)) === nameKey(decodeURIComponent(arg))); if (s) xSport = baseSport(s); }
    if (!xDay) xDay = (firstUpcomingDay() || S.days[0]).key;
    if (xTeam === null) xTeam = myTeam()?.id || "all";
    const live = isToday(xDay), n = now().min, t = xTeam !== "all" ? teamById(xTeam) : null;
    const sports = [...new Set(FX.map(f => baseSport(f.s)))].sort();
    const list = fxSorted(FX.filter(f => f.d === xDay && (xSport === "all" || baseSport(f.s) === xSport) && involves(f, t)));
    const groups = {}; list.forEach(f => (groups[f.t] ||= []).push(f));
    const src = fxSource.kind === "live" ? `🟢 Live from the sports committee schedule · updated ${esc(fxSource.at)}`
      : fxSource.kind === "saved" ? `Saved copy of the schedule (${esc(fxSource.at)}). It refreshes when you're back online.` : `Built-in copy of the schedule (13 Nov).`;
    $("#view-fixtures").innerHTML = `
      <div class="banner"><div><h3>🏆 Fixtures</h3><p>Times can change. Live scores & results are on ${esc(C.sportagonName)}.</p></div>${sportagonLink("btn accent", `Live scores ↗`)}</div>
      <div class="chips scroll-x" style="margin:14px 0 10px">${S.days.map(d => `<button class="chip ${xDay === d.key ? "on" : ""}" data-xd="${d.key}">${esc(d.label)} · ${fmtDate(d.date)}${isToday(d.key) ? " · today" : ""}</button>`).join("")}</div>
      <div class="filters"><select id="xSport" aria-label="Sport"><option value="all">All sports</option>${sports.map(s => `<option ${s === xSport ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
        <select id="xTeam" aria-label="IIM"><option value="all">All IIMs</option>${S.teams.map(x => `<option value="${x.id}" ${x.id === xTeam ? "selected" : ""}>${esc(x.short)}</option>`).join("")}</select></div>
      <p class="small muted src">${src} · ${list.length} fixture${list.length === 1 ? "" : "s"}</p>
      ${t ? `<p class="small muted" style="margin-top:-6px">Showing ${esc(t.short)}'s matches. Semis and finals appear once the sheet names the teams.</p>` : ""}
      <div class="timeline">${Object.keys(groups).map(tm => `<div class="slot ${live && n >= ev(tm) + 60 ? "past" : ""}"><div class="slot-t">${fmt12(tm)}</div>
        <div class="slot-b">${groups[tm].map(f => `<div class="card fx-card"><div class="fx-s">${sportEmoji(f.s)} ${esc(f.s)} ${fxState(f, live, n)}</div>${matchHTML(f.m)}
          <div class="small muted">${fxVenue(f.s)}</div></div>`).join("")}</div></div>`).join("")
        || `<div class="empty-note">No fixtures match these filters on this day.</div>`}</div>`;
    $("#xSport").onchange = e => { xSport = e.target.value; renderFixtures(); };
    $("#xTeam").onchange = e => { xTeam = e.target.value; renderFixtures(); };
    $$("#view-fixtures [data-xd]").forEach(b => b.onclick = () => { xDay = b.dataset.xd; renderFixtures(); });
  }
  function homeFixturesHTML() {
    const day = firstUpcomingDay(); if (!day || !FX.length) return "";
    const live = isToday(day.key), n = now().min, t = myTeam();
    let list = fxSorted(FX.filter(f => f.d === day.key && (!live || ev(f.t) >= n - 45)));
    const mine = t ? list.filter(f => involves(f, t)) : [];
    list = (mine.length ? mine : list).slice(0, 5);
    return `<div class="section"><div class="section-head"><h2>⏱ ${live ? "Up next" : `${esc(day.label)} fixtures`}${mine.length ? ` · ${esc(t.short)}` : ""}</h2><a href="#fixtures">All fixtures →</a></div>
      <div class="card list fx-list">${list.length ? list.map(f => `<div class="fx"><div class="fx-t">${fmt12(f.t)}</div><div class="fx-b">
        <div class="fx-s">${sportEmoji(f.s)} ${esc(f.s)} ${fxState(f, live, n)}</div>${matchHTML(f.m)}<div class="small muted">${fxVenue(f.s)}</div></div></div>`).join("")
        : `<p class="muted small" style="margin:0">No more fixtures today.</p>`}</div></div>`;
  }
  function timeLabel(s) {
    const m = String(s).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i); if (!m) return null;
    let h = +m[1]; const ap = (m[3] || "").toUpperCase();
    if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0;
    return `${pad(h)}:${m[2]}`;
  }
  async function loadScheduleSheet() {
    const sh = C.scheduleSheet; if (!sh || !sh.id) return;
    const cached = store.get("fxLive2");
    if (cached) { try { const c = JSON.parse(cached); if (c.fx?.length > 30) { FX = c.fx; fxSource = { kind: "saved", at: c.at }; } } catch { /* ignore */ } }
    try {
      const out = [];
      await Promise.all(Object.entries(sh.tabs).map(async ([key, tab]) => {
        let r = await fetch(`/api/schedule?id=${encodeURIComponent(sh.id)}&sheet=${encodeURIComponent(tab)}`).catch(() => null);
        if (!r || !r.ok) r = await fetch(`https://docs.google.com/spreadsheets/d/${sh.id}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`, { cache: "no-store" });
        if (!r.ok) throw new Error("sheet");
        const rows = parseCSV(await r.text()); if (!rows.length) throw new Error("empty");
        const hdr = rows[0].map(timeLabel);
        if (hdr.filter(Boolean).length < 20) throw new Error("layout");
        rows.slice(1).forEach(row => { const sport = (row[0] || "").trim(); if (!sport) return;
          row.forEach((c, i) => { if (i && hdr[i] && String(c).trim()) out.push({ d: key, t: hdr[i], s: sport, m: String(c).trim().replace(/\s+/g, " ") }); }); });
      }));
      if (out.length < 30) throw new Error("too few");
      FX = out; const at = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      fxSource = { kind: "live", at }; store.set("fxLive2", JSON.stringify({ fx: out, at: `${fmtDate(now().iso)} ${at}` }));
    } catch (e) { console.info("Live schedule unavailable; using", fxSource.kind, e.message); }
  }

  /* =================================================================== MAP
     Shows the IIMK Google My Map (layers, Google's icons, legend) on a satellite base.
     1) Draws the bundled snapshot (mymap-data.js) instantly, so it works offline.
     2) Then loads the live map via /api/mymap and redraws if it changed. */
  let map, mapInit = false, meMarker, baseSat, baseStreet, labels, onSat = true, gView = false, firstFit = true;
  let LAYERS = [], FEATS = [], visible = null, groups = {}, fmarkers = {}, mapSource = "", kmlNow = "";
  const GID = C.googleMyMapsId, SNAP = window.MYMAP || null;
  const nameKey = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanLayer = s => String(s || "Places").replace(/^\s*\d+\.\s*/, "").replace(/\s*\((move these|draft|todo)[^)]*\)/i, "").trim();
  const sportsAt = id => [...new Set(Object.entries(S.venues).filter(([, v]) => v === id).map(([k]) => k))];
  function placeForFeat(f) {
    const k = nameKey(f.name);
    return S.places.find(p => p.mapName && nameKey(p.mapName) === k) || null;
  }
  const sportsForFeat = f => { const p = placeForFeat(f); return p ? sportsAt(p.id) : []; };
  const FALLBACK_EMOJI = [[/sport|ground|court|venue|complex/i, "🏟️"], [/food|mess|cafe|restaurant/i, "🍛"], [/bus|transport|gate|parking|auto/i, "🚌"],
    [/hostel|stay|room/i, "🛏️"], [/health|medical|hospital/i, "🩺"], [/washroom|toilet|utility/i, "🚻"]];
  const emojiFor = (a, b) => { for (const [re, e] of FALLBACK_EMOJI) if (re.test(a) || re.test(b)) return e; return "📍"; };

  function parseKML(text) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) return null;
    const styles = {}, smap = {};
    doc.querySelectorAll("Style").forEach(s => { styles[s.getAttribute("id")] = s; });
    doc.querySelectorAll("StyleMap").forEach(m => { const p = [...m.querySelectorAll("Pair")].find(p => p.querySelector("key")?.textContent.trim() === "normal");
      smap[m.getAttribute("id")] = (p?.querySelector("styleUrl")?.textContent || "").trim().replace("#", ""); });
    const hex = c => c && c.trim().length === 8 ? "#" + c.trim().slice(6, 8) + c.trim().slice(4, 6) + c.trim().slice(2, 4) : null;
    const alpha = c => c && c.trim().length === 8 ? parseInt(c.trim().slice(0, 2), 16) / 255 : null;
    const styleOf = url => {
      let id = (url || "").trim().replace("#", ""); const raw = id; if (smap[id]) id = smap[id];
      const base = id.replace(/-(nodesc|normal|highlight)/g, ""), s = styles[id], txt = q => s?.querySelector(q)?.textContent;
      const m = base.match(/-([0-9A-Fa-f]{6})$/), icon = SNAP?.icons?.[base] || null;
      const ic = hex(txt("IconStyle color")), lc = txt("LineStyle color"), pc = txt("PolyStyle color");
      const color = (m ? "#" + m[1] : null) || ic || hex(lc) || "#ecb310";
      return { key: base || raw, icon, color, line: hex(lc) || color, lineW: Math.max(2, +(txt("LineStyle width") || 3)), fill: hex(pc) || color, fillO: alpha(pc) ?? .3 };
    };
    const coords = s => String(s || "").trim().split(/\s+/).map(c => { const [x, y] = c.split(",").map(Number); return [y, x]; }).filter(([a, b]) => isFinite(a) && isFinite(b));
    function parseDesc(html) {
      if (!html) return { text: "", walk: null };
      const d = new DOMParser().parseFromString(String(html).replace(/<br\s*\/?>/gi, "\n"), "text/html");
      let walk = null;
      d.querySelectorAll("a[href]").forEach(a => { if (/maps\/dir/.test(a.href)) { walk = walk || a.href; a.remove(); } });
      let text = (d.body.textContent || "");
      text = text.replace(/Walking directions\s*\((https:\/\/www\.google\.com\/maps\/dir\/[^)\s]+)\)/gi, (_, u) => { walk = walk || u; return ""; })
                 .replace(/Walking directions\s*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
      return { text, walk };
    }
    let folders = [...doc.querySelectorAll("Folder")].filter(f => f.querySelector("Placemark"));
    if (!folders.length) folders = [doc.querySelector("Document") || doc.documentElement];
    const layers = [], feats = [];
    folders.forEach((f, i) => {
      const rawName = f.querySelector(":scope > name")?.textContent.trim() || "Places", lid = "L" + i, icons = {}, colors = {};
      [...f.querySelectorAll(":scope > Placemark")].forEach((p, j) => {
        const name = (p.querySelector(":scope > name")?.textContent || "Untitled").replace(/\s+/g, " ").trim();
        const st = styleOf(p.querySelector(":scope > styleUrl")?.textContent);
        const { text, walk } = parseDesc(p.querySelector(":scope > description")?.textContent);
        const media = (p.querySelector('Data[name="gx_media_links"] value')?.textContent || "").trim().split(/\s+/).filter(u => /^https:\/\//.test(u));
        const base = { id: `${lid}-${j}`, layer: lid, layerName: cleanLayer(rawName), name, desc: text, walk, media, style: st };
        const pt = p.querySelector("Point coordinates"), ls = p.querySelectorAll("LineString coordinates"), pg = p.querySelectorAll("Polygon outerBoundaryIs coordinates");
        if (pt) { const [ll] = coords(pt.textContent); if (!ll) return; feats.push({ ...base, kind: "point", center: ll }); }
        else if (pg.length) { const rings = [...pg].map(c => coords(c.textContent)); feats.push({ ...base, kind: "poly", rings, center: L.polygon(rings).getBounds().getCenter() }); }
        else if (ls.length) { const lines = [...ls].map(c => coords(c.textContent)); feats.push({ ...base, kind: "line", lines, center: lines[0][Math.floor(lines[0].length / 2)] }); }
        else return;
        if (st.icon) icons[st.key] = st.icon; colors[st.color] = (colors[st.color] || 0) + 1;
      });
      const count = feats.filter(x => x.layer === lid).length;
      if (count) layers.push({ id: lid, raw: rawName, name: cleanLayer(rawName), count, icons: Object.values(icons).slice(0, 5),
        color: Object.entries(colors).sort((a, b) => b[1] - a[1])[0]?.[0] || "#ecb310" });
    });
    return layers.length ? { layers, feats } : null;
  }

  function featIcon(f) {
    const ic = f.style.icon;
    const label = `<div class="pin-label">${esc(f.name)}</div>`;
    if (ic) {
      const sz = ic.pin ? [30, 30] : [26, 26], anchor = ic.pin ? [15, 30] : [13, 13];
      return L.divIcon({ className: "", iconSize: sz, iconAnchor: anchor, popupAnchor: [0, ic.pin ? -26 : -12],
        html: `<img class="gicon" src="${ic.src}" width="${sz[0]}" height="${sz[1]}" alt="">${label}` });
    }
    return L.divIcon({ className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -26],
      html: `<div class="pin" style="background:${f.style.color};width:28px;height:28px"><span style="font-size:14px">${emojiFor(f.name, f.layerName)}</span></div>${label}` });
  }
  const featDirections = f => {
    const p = placeForFeat(f);
    if (p?.gmaps) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.gmaps)}`;
    return f.walk || `https://www.google.com/maps/dir/?api=1&destination=${f.center[0]},${f.center[1]}&travelmode=walking`;
  };
  const linkify = t => esc(t).replace(/(\+91[\d\s]{10,14}\d)/g, m => `<a href="tel:${m.replace(/\s/g, "")}">${m}</a>`).replace(/\n/g, "<br>");
  function popupHTML(f) {
    const sp = sportsForFeat(f), layer = LAYERS.find(l => l.id === f.layer), ic = f.style.icon;
    return `<div class="pop"><div class="cat">${ic ? `<img src="${ic.src}" width="16" height="16" alt="">` : ""} ${esc(layer?.name || "")}</div><h4>${esc(f.name)}</h4>
      ${f.media[0] ? `<img class="pop-img" src="${esc(f.media[0])}" alt="" loading="lazy">` : ""}
      ${sp.length ? `<div class="row" style="gap:4px;margin-top:4px">${sp.map(s => `<span class="tag">${S.sportEmoji[s] || ""} ${esc(s)}</span>`).join("")}</div>` : ""}
      ${(() => { const p = placeForFeat(f); return p?.desc && !f.desc.includes(p.desc.slice(0, 20)) ? `<p class="pop-info">${linkify(p.desc)}</p>` : ""; })()}
      ${f.desc ? `<p>${linkify(f.desc)}</p>` : ""}
      <div class="row"><a class="btn sm" href="${featDirections(f)}" target="_blank" rel="noopener">Directions ↗</a>
      ${sp.length ? `<a class="btn sm accent" href="#fixtures/${encodeURIComponent(sp[0])}">Fixtures</a>` : ""}</div></div>`;
  }

  function fromDataPlaces() {   // last-resort fallback if no Google map data at all
    const layers = S.categories.map(c => ({ id: c.id, name: c.label, color: c.color, icons: [], count: S.places.filter(p => p.cat === c.id).length })).filter(l => l.count);
    const feats = S.places.map(p => ({ id: p.id, layer: p.cat, layerName: catById(p.cat).label, name: p.mapName || p.name, desc: p.desc || "", media: [], kind: "point",
      center: [p.lat, p.lng], style: { color: catById(p.cat).color, icon: null } }));
    return { layers, feats };
  }

  function initMap() {
    if (mapInit) return; mapInit = true;
    if (!window.L) { $("#leaflet").innerHTML = `<div class="empty-note" style="margin:12px">The map needs an internet connection. The list below still works.</div>`; return; }
    map = L.map("leaflet", { zoomControl: false, maxZoom: 20 }).setView(C.mapCenter, 16);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    baseSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 20, maxNativeZoom: 18, attribution: "Imagery &copy; Esri, Maxar · Places &copy; IIMK Google My Map" });
    labels = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 18, opacity: .6 });
    baseStreet = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 20, subdomains: "abcd", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO' });
    baseSat.addTo(map); labels.addTo(map);
    const placeLegend = () => { const lg = $("#legend"), below = window.innerWidth < 700;
      lg.classList.toggle("below", below);
      if (below && lg.parentElement.classList.contains("map-wrap")) $(".map-wrap").after(lg);
      if (!below && !lg.parentElement.classList.contains("map-wrap")) $(".map-wrap").appendChild(lg); };
    placeLegend(); window.addEventListener("resize", placeLegend);
    const lbl = () => $("#leaflet").classList.toggle("show-labels", map.getZoom() >= 18);
    map.on("zoomend", lbl); lbl();
    if (PICK) map.on("click", e => { const t = `lat: ${e.latlng.lat.toFixed(6)}, lng: ${e.latlng.lng.toFixed(6)}`; copy(t);
      L.popup().setLatLng(e.latlng).setContent(`<div class="pop"><code>${t}</code><p class="small">Copied</p></div>`).openOn(map); });

    $("#btnCampus").onclick = fitCampus;
    $("#btnFit").onclick = fitVisible;
    $("#btnBase").onclick = () => { onSat = !onSat;
      if (onSat) { map.removeLayer(baseStreet); baseSat.addTo(map); labels.addTo(map); } else { map.removeLayer(baseSat); map.removeLayer(labels); baseStreet.addTo(map); }
      $("#btnBase").textContent = onSat ? "🗺 Street" : "🛰 Satellite"; };
    $("#btnView").hidden = !GID;
    $("#btnView").onclick = () => { gView = !gView;
      if (gView && !$("#gframe iframe")) $("#gframe").innerHTML = `<iframe src="https://www.google.com/maps/d/embed?mid=${encodeURIComponent(GID)}&ehbc=2E312F" allowfullscreen loading="lazy" title="Google My Maps"></iframe>`;
      $("#gframe").hidden = !gView; $("#btnView").textContent = gView ? "← Back" : "Google view"; $("#legend").hidden = gView; };
    $("#btnLocate").onclick = () => {
      if (!navigator.geolocation) return toast("Location isn't available on this device");
      toast("Finding you…");
      navigator.geolocation.getCurrentPosition(pos => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        if (meMarker) meMarker.setLatLng(ll); else meMarker = L.marker(ll, { icon: L.divIcon({ className: "", html: '<div class="me-dot"></div>', iconSize: [16, 16] }) }).addTo(map);
        map.flyTo(ll, 18);
      }, () => toast("Couldn't get your location"), { enableHighAccuracy: true, timeout: 10000 });
    };

    // 1) instant: last live copy saved on this phone, else the bundled snapshot
    const saved = store.get("kml");
    if (saved && drawKML(saved, "saved")) { /* drawn */ }
    else if (SNAP?.kml && drawKML(SNAP.kml, "snapshot")) { /* drawn */ }
    else { const d = fromDataPlaces(); setData(d, "data"); }
    // 2) live from Google (via the cached Vercel function)
    if (GID) fetch(`/api/mymap?mid=${encodeURIComponent(GID)}`).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => {
      if (!t.includes("<kml")) throw new Error("not kml");
      store.set("kml", t);
      if (t !== kmlNow) drawKML(t, "live"); else { mapSource = "live"; setHint(); }
    }).catch(e => console.info("Live Google map not available, showing", mapSource, e));
  }
  function drawKML(text, source) {
    const parsed = parseKML(text); if (!parsed) return false;
    kmlNow = text; setData(parsed, source); return true;
  }
  function setData(data, source) {
    Object.values(groups).forEach(g => map.removeLayer(g)); groups = {}; fmarkers = {};
    const rank = l => { const i = (C.mapLayerOrder || []).findIndex(k => l.name.toLowerCase().includes(k)); return i < 0 ? 99 : i; };
    data.layers.sort((a, b) => rank(a) - rank(b));
    const offByDefault = l => (C.mapLayersOff || []).some(k => l.name.toLowerCase().includes(k));
    const prevHidden = visible ? LAYERS.filter(l => !visible.has(l.id)).map(l => l.name) : null;
    LAYERS = data.layers; FEATS = data.feats; mapSource = source;
    visible = new Set(LAYERS.filter(l => prevHidden ? !prevHidden.includes(l.name) : !offByDefault(l)).map(l => l.id));
    LAYERS.forEach(l => { groups[l.id] = L.featureGroup(); if (visible.has(l.id)) groups[l.id].addTo(map); });
    FEATS.forEach(f => {
      let lyr;
      if (f.kind === "point") lyr = L.marker(f.center, { icon: featIcon(f), title: f.name, riseOnHover: true });
      else if (f.kind === "poly") lyr = L.polygon(f.rings, { color: f.style.line, weight: 2, fillColor: f.style.fill, fillOpacity: Math.max(.15, Math.min(.5, f.style.fillO)) });
      else lyr = L.polyline(f.lines, { color: f.style.line, weight: Math.min(6, f.style.lineW), opacity: .9 });
      lyr.bindPopup(() => popupHTML(f), { autoPanPaddingTopLeft: [12, 64], maxWidth: 280 });
      if (f.kind !== "point") lyr.bindTooltip(esc(f.name), { sticky: true, className: "shape-tip" });
      lyr.addTo(groups[f.layer]); fmarkers[f.id] = lyr;
    });
    renderLegend(); renderChips(); filterPlaces(); setHint();
    if (firstFit) { firstFit = false; setTimeout(() => { map.invalidateSize(); if (pendingFocus) { focusPlace(pendingFocus); pendingFocus = null; } else fitCampus(); }, 120); }
  }
  function setHint() {
    const open = GID ? ` · <a href="https://www.google.com/maps/d/viewer?mid=${encodeURIComponent(GID)}" target="_blank" rel="noopener">Open in Google Maps ↗</a>` : "";
    $("#mapHint").innerHTML = (mapSource === "live" ? `🟢 Live from the IIMK Google map · ${FEATS.length} places`
      : mapSource === "snapshot" ? `IIMK Google map · ${FEATS.length} places (copy from ${esc(SNAP?.asOf || "")})`
      : mapSource === "saved" ? `IIMK Google map · ${FEATS.length} places (saved copy)` : `Built-in pins`) + open;
  }
  function fitCampus() {   // everything within ~1.5 km of campus
    const near = FEATS.filter(f => visible.has(f.layer) && map.distance(f.center, C.mapCenter) < 1500);
    if (near.length) map.fitBounds(L.latLngBounds(near.map(f => f.center)).pad(0.06), { maxZoom: 18 }); else map.setView(C.mapCenter, 16);
  }
  function fitVisible() {
    const b = L.latLngBounds([]); LAYERS.forEach(l => { if (visible.has(l.id) && groups[l.id].getLayers().length) b.extend(groups[l.id].getBounds()); });
    if (b.isValid()) map.flyToBounds(b.pad(0.06), { maxZoom: 18 });
  }
  function setVisible(ids) {
    visible = new Set(ids);
    LAYERS.forEach(l => { const g = groups[l.id]; if (!g) return; if (visible.has(l.id)) { if (!map.hasLayer(g)) g.addTo(map); } else if (map.hasLayer(g)) map.removeLayer(g); });
    renderLegend(); renderChips(); filterPlaces();
  }
  function renderLegend() {
    const lg = $("#legend"); if (!lg) return;
    const pref = store.get("legendOpen"), open = pref ? pref === "1" : true;
    const sw = l => l.icons.length ? `<span class="sw-icons">${l.icons.map(i => `<img src="${i.src}" alt="">`).join("")}</span>` : `<span class="sw" style="background:${l.color}"></span>`;
    lg.innerHTML = `<button class="lg-head" type="button" aria-expanded="${open}">🗂 Legend <span>${open ? "▾ hide" : "▸ show"}</span></button>
      ${open ? `<div class="lg-body">${LAYERS.map(l => `<label class="lg-row"><input type="checkbox" data-l="${l.id}" ${visible.has(l.id) ? "checked" : ""}>
        <span class="nm">${esc(l.name)}</span><small>${l.count}</small>${sw(l)}</label>`).join("")}
        <div class="lg-acts"><button type="button" data-all="1">Show all</button><button type="button" data-all="0">Hide all</button></div></div>` : ""}`;
    $(".lg-head", lg).onclick = () => { store.set("legendOpen", open ? "0" : "1"); renderLegend(); };
    $$("input[data-l]", lg).forEach(cb => cb.onchange = () => { const s = new Set(visible); cb.checked ? s.add(cb.dataset.l) : s.delete(cb.dataset.l); setVisible([...s]); });
    $$("[data-all]", lg).forEach(b => b.onclick = () => setVisible(b.dataset.all === "1" ? LAYERS.map(l => l.id) : []));
  }
  function renderChips() {
    const allOn = visible.size === LAYERS.length;
    $("#mapChips").innerHTML = `<button class="chip ${allOn ? "on" : ""}" data-c="all">✳️ All</button>` +
      LAYERS.map(l => `<button class="chip ${!allOn && visible.size === 1 && visible.has(l.id) ? "on" : ""}" data-c="${l.id}">${l.icons[0] ? `<img class="chip-ic" src="${l.icons[0].src}" alt="">` : `<span class="dotc" style="background:${l.color}"></span>`}${esc(l.name)}</button>`).join("");
    $$("#mapChips .chip").forEach(b => b.onclick = () => setVisible(b.dataset.c === "all" ? LAYERS.map(l => l.id) : [b.dataset.c]));
  }
  const hay = f => [f.name, f.desc, f.layerName, ...sportsForFeat(f)].join(" ").toLowerCase();
  function filterPlaces() {
    const q = ($("#mapSearch").value || "").trim().toLowerCase();
    const shown = FEATS.filter(f => visible.has(f.layer) && (!q || hay(f).includes(q)));
    $("#placeList").innerHTML = shown.length ? LAYERS.filter(l => shown.some(f => f.layer === l.id)).map(l =>
      `<li class="grp">${l.icons[0] ? `<img class="chip-ic" src="${l.icons[0].src}" alt="">` : `<span class="dotc" style="background:${l.color}"></span>`}${esc(l.name)}</li>` +
      shown.filter(f => f.layer === l.id).map(f => { const sp = sportsForFeat(f), ic = f.style.icon;
        return `<li data-id="${esc(f.id)}"><div class="dot">${ic ? `<img src="${ic.src}" alt="" width="26" height="26">` : emojiFor(f.name, f.layerName)}</div><div class="pl-b">
          <h4>${esc(f.name)}</h4><p>${sp.length ? esc(sp.join(" · ")) : esc((f.desc || l.name).split("\n")[0])}</p></div>
          <a class="btn sm ghost" href="${featDirections(f)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Go ↗</a></li>`; }).join("")).join("")
      : `<li class="empty">Nothing matches${visible.size < LAYERS.length ? " in the layers that are switched on" : ""}.</li>`;
    $$("#placeList li[data-id]").forEach(li => li.onclick = () => openFeat(li.dataset.id, true));
    if (q && shown.length && map && shown.length <= 15) map.flyToBounds(L.latLngBounds(shown.map(f => f.center)).pad(0.3), { maxZoom: 19 });
  }
  function openFeat(id, scroll) {
    const f = FEATS.find(x => x.id === id); if (!f || !map) return;
    if (gView) $("#btnView").click();
    if (!visible.has(f.layer)) setVisible([...visible, f.layer]);
    map.flyTo(f.center, map.distance(f.center, C.mapCenter) > 3000 ? 15 : 19, { duration: .6 });
    setTimeout(() => fmarkers[id]?.openPopup(f.kind === "point" ? undefined : f.center), 650);
    if (scroll) $(".map-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  let pendingFocus = null;
  function focusPlace(id) {   // id = a place id from data.js (links like #map/football)
    if (!FEATS.length || firstFit) { pendingFocus = id; return; }
    firstFit = false;
    if (id.startsWith("only-")) { const kw = id.slice(5).toLowerCase(); const ids = LAYERS.filter(l => l.name.toLowerCase().includes(kw)).map(l => l.id);
      if (ids.length) { setVisible(ids); setTimeout(fitVisible, 50); } return; }
    const p = placeById(id); if (!p) return;
    const f = FEATS.find(x => x.id === id) || (p.mapName && FEATS.find(x => nameKey(x.name) === nameKey(p.mapName)));
    if (f) return openFeat(f.id);
    map.flyTo([p.lat, p.lng], map.distance([p.lat, p.lng], C.mapCenter) > 3000 ? 14 : 18);
    L.popup().setLatLng([p.lat, p.lng]).setContent(`<div class="pop"><h4>${esc(p.name)}</h4><p>${esc(p.desc || "")}</p>
      <div class="row"><a class="btn sm" href="${directionsUrl(p)}" target="_blank" rel="noopener">Directions ↗</a></div></div>`).openOn(map);
  }

  /* =================================================================== TRANSPORT */
  let tTab = "bus", aFilter = "all", aQuery = "", fQuery = "";
  let bFrom = store.get("busFrom") || "Main Gate", bTo = store.get("busTo") || "PGP Auditorium", bDay = null, bAll = false;
  function renderTransport() {
    const v = $("#view-transport");
    v.innerHTML = `<div class="seg seg4">${[["bus", "🚌", "Campus bus"], ["offsite", "🚐", "Shuttle"], ["autos", "🛺", "Autos"], ["fares", "₹", "Fares"]]
      .map(([k, e, l]) => `<button class="${tTab === k ? "on" : ""}" data-t="${k}"><span>${e}</span>${l}</button>`).join("")}</div><div id="tBody"></div>`;
    $$("#view-transport .seg button").forEach(b => b.onclick = () => { tTab = b.dataset.t; history.replaceState(null, "", `#transport/${tTab}`); renderTransport(); });
    ({ bus: renderBus, offsite: renderOffsite, autos: renderAutos, fares: renderFares })[tTab]();
  }
  function renderBus() {
    if (!bDay) bDay = (firstUpcomingDay() || S.days[0]).key;
    const live = isToday(bDay), n = now().min;
    const opts = sel => S.busStops.map(s => `<option ${s === sel ? "selected" : ""}>${esc(s)}</option>`).join("");
    const all = busesOn(bDay), hits = all.filter(t => serves(t, bFrom, bTo));
    const upcoming = live ? hits.filter(t => ev(t.t) >= n) : hits, past = live ? hits.filter(t => ev(t.t) < n) : [];
    const card = (t, i) => `<div class="bus-row ${i === 0 && live ? "next" : ""}"><div class="bt"><b>${fmt12(t.t)}</b>${live ? `<small>${fmtIn(ev(t.t) - n)}</small>` : ""}</div>
      <div><div class="route-line">${routeHTML(t, bFrom, bTo)}</div>${t.from !== bFrom ? `<div class="small muted">Leaves ${esc(t.from)} at ${fmt12(t.t)}. Reaches ${esc(bFrom)} a few minutes later.</div>` : ""}</div></div>`;
    $("#tBody").innerHTML = `
      <div class="card bus-finder"><div class="bf-row"><label>From<select id="bFrom">${opts(bFrom)}</select></label>
        <button class="swap" id="bSwap" title="Swap" aria-label="Swap">⇅</button><label>To<select id="bTo">${opts(bTo)}</select></label></div></div>
      <div class="chips scroll-x" style="margin:12px 0">${S.days.map(d => `<button class="chip ${bDay === d.key ? "on" : ""}" data-b="${d.key}">${esc(d.label)} · ${fmtDate(d.date)}${isToday(d.key) ? " · today" : ""}</button>`).join("")}</div>
      ${bFrom === bTo ? `<div class="empty-note">Choose two different stops.</div>` : `
      <div class="card list">${upcoming.length ? upcoming.map(card).join("") : `<p class="muted small" style="margin:0">${live ? "No more buses on this route today." : "No direct buses on this route that day."} Autos at the Main Gate: Gate → Hostel ₹70.</p>`}</div>
      ${past.length ? `<details class="past-d"><summary>${past.length} earlier bus${past.length === 1 ? "" : "es"} today</summary><div class="list" style="padding-bottom:12px">${past.map(card).join("")}</div></details>` : ""}`}
      <div class="section"><button class="btn ghost full" id="bAllBtn">${bAll ? "Hide" : "Show"} full ${esc(dayByKey(bDay).label)} timetable (${all.length} trips)</button>
        ${bAll ? `<div class="card" style="margin-top:10px"><table><thead><tr><th>Time</th><th>Route</th></tr></thead><tbody>${all.map(t => `<tr class="${live && ev(t.t) < n ? "past-r" : ""}"><td><b>${fmt12(t.t)}</b></td><td class="small">${seq(t).map(esc).join(" → ")}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>
      <p class="small muted">Stops: ${S.busStops.map(s => { const p = placeById(S.busStopPlace[s]); return p ? `<a href="#map/${p.id}">${esc(s)}</a>` : esc(s); }).join(" · ")}. Source: Inter-IIM bus schedule.</p>`;
    const save = () => { store.set("busFrom", bFrom); store.set("busTo", bTo); homeBusStop = bFrom; };
    $("#bFrom").onchange = e => { bFrom = e.target.value; save(); renderBus(); };
    $("#bTo").onchange = e => { bTo = e.target.value; save(); renderBus(); };
    $("#bSwap").onclick = () => { [bFrom, bTo] = [bTo, bFrom]; save(); renderBus(); };
    $("#bAllBtn").onclick = () => { bAll = !bAll; renderBus(); };
    $$("#tBody [data-b]").forEach(b => b.onclick = () => { bDay = b.dataset.b; renderBus(); });
  }
  function renderAutos() {
    const q = aQuery.toLowerCase();
    const list = S.autos.filter(a => (aFilter === "all" || (aFilter === "namo" ? a.team : !a.team)) && (!q || [a.name, a.phone, a.alt, a.team].join(" ").toLowerCase().includes(q)));
    $("#tBody").innerHTML = `
      <div class="notice" style="margin-bottom:12px"><i>💡</i><div>The <b>Team Namo</b> stand is at the Main Gate. Check the <a href="#transport/fares">fare card</a> and agree the price before you ride.</div></div>
      <div class="search"><input id="aSearch" type="search" placeholder="Search by name or number…" value="${esc(aQuery)}" /></div>
      <div class="chips scroll-x" style="margin:10px 0 12px">
        <button class="chip ${aFilter === "all" ? "on" : ""}" data-f="all">All (${S.autos.length})</button>
        <button class="chip ${aFilter === "namo" ? "on" : ""}" data-f="namo">Team Namo · Main Gate</button>
        <button class="chip ${aFilter === "other" ? "on" : ""}" data-f="other">Other drivers</button></div>
      <div class="card list">${list.length ? list.map(a => `<div class="auto"><div class="ico">🛺</div><div class="body"><h4>${esc(a.name)}</h4>
        <p>${prettyPhone(a.phone)}${a.alt ? ` · alt ${prettyPhone(a.alt)}` : ""}${a.team ? ` <span class="tag gold">${esc(a.team)}</span>` : ""}</p></div>
        <div class="acts"><a class="btn sm accent" href="${tel(a.phone)}" aria-label="Call ${esc(a.name)}">📞</a>
        <a class="btn sm ok" target="_blank" rel="noopener" href="${wa(a.phone)}?text=${encodeURIComponent(`Hi chetta, I'm at IIM Kozhikode for ${C.eventName}. Can you pick me up?`)}" aria-label="WhatsApp">💬</a>
        ${a.alt ? `<a class="btn sm ghost" href="${tel(a.alt)}" aria-label="Call alternate number">📞2</a>` : ""}</div></div>`).join("")
        : `<p class="muted small" style="margin:0">No drivers match.</p>`}</div>`;
    const inp = $("#aSearch"); inp.oninput = () => { aQuery = inp.value; const pos = inp.selectionStart; renderAutos(); const n = $("#aSearch"); n.focus(); n.setSelectionRange(pos, pos); };
    $$("#tBody [data-f]").forEach(b => b.onclick = () => { aFilter = b.dataset.f; renderAutos(); });
  }
  const rs = n => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;
  function renderFares() {
    const q = fQuery.toLowerCase();
    $("#tBody").innerHTML = `
      <div class="card fare-head"><div><b>Team Namo call taxi · IIMK Main Gate</b><div class="small muted">${esc(S.fareNote)}</div></div></div>
      <div class="search" style="margin:12px 0"><input id="fSearch" type="search" placeholder="Where to? e.g. beach, airport, Gokulam…" value="${esc(fQuery)}" /></div>
      ${S.fares.map(g => { const items = g.items.filter(i => !q || i.to.toLowerCase().includes(q)); if (!items.length) return "";
        return `<div class="section" style="margin-top:14px"><div class="section-head"><h2>${esc(g.group)}</h2></div><div class="card"><table><thead><tr><th>Place</th><th class="r">Drop</th><th class="r">Return</th></tr></thead><tbody>
        ${items.map(i => `<tr><td>${esc(i.to)}</td><td class="r"><b>${rs(i.drop)}</b></td><td class="r muted">${rs(i.ret)}</td></tr>`).join("")}</tbody></table></div></div>`; }).join("") || `<div class="empty-note">No match. Ask a chettan for the fare.</div>`}`;
    const inp = $("#fSearch"); inp.oninput = () => { fQuery = inp.value; const pos = inp.selectionStart; renderFares(); const n = $("#fSearch"); n.focus(); n.setSelectionRange(pos, pos); };
  }
  /* ---------- outside-campus shuttle ---------- */
  const SH = S.shuttle || { route: [], trips: [], stopPlace: {} };
  const SH_STOPS = [...new Set(SH.route)];
  let shFrom = store.get("shFrom") || SH_STOPS[0], shTo = store.get("shTo") || "IIM Kozhikode", oDay = null, shAll = false;
  if (!SH_STOPS.includes(shFrom)) shFrom = SH_STOPS[0]; if (!SH_STOPS.includes(shTo)) shTo = SH_STOPS[2];
  const isFull = t => t.t[1] != null;
  function shuttleOptions(dayKey, a, b) {
    const out = [];
    SH.trips.filter(t => t.d === dayKey).forEach(t => {
      const byArr = {};
      for (let i = 0; i < SH.route.length; i++) {
        if (SH.route[i] !== a || !t.t[i]) continue;
        for (let j = i + 1; j < SH.route.length; j++) if (SH.route[j] === b && t.t[j]) { byArr[j] = { trip: t, i, j, dep: t.t[i], arr: t.t[j] }; break; }
      }
      out.push(...Object.values(byArr));   // keeps the latest boarding point for each arrival
    });
    return out.sort((x, y) => ev(x.dep) - ev(y.dep));
  }
  function shuttleLine(t, from = 0, hiA, hiB) {
    return SH.route.map((s, k) => ({ s, k, tm: t.t[k] })).filter(x => x.tm && x.k >= from)
      .map(x => `<span class="${x.k === hiA || x.k === hiB ? "hl" : ""}">${esc(s(x.s))} ${fmt12(x.tm).replace(" AM", "a").replace(" PM", "p")}</span>`).join("<i>→</i>");
    function s(n) { return n.replace("Boys' Accommodation", "Accomm.").replace(" (NIT)", "").replace(" (Devagiri)", "").replace("IIM Kozhikode", "IIMK"); }
  }
  function renderOffsite() {
    if (!oDay) oDay = (firstUpcomingDay() || S.days[0]).key;
    const live = isToday(oDay), n = now().min;
    const opts = sel => SH_STOPS.map(s => `<option ${s === sel ? "selected" : ""}>${esc(s)}</option>`).join("");
    const all = shuttleOptions(oDay, shFrom, shTo);
    const upcoming = live ? all.filter(o => ev(o.dep) >= n) : all, past = live ? all.filter(o => ev(o.dep) < n) : [];
    const row = (o, k) => { const mins = ev(o.dep) - n, last = o.trip.last && isFull(o.trip);
      return `<div class="sh-row ${k === 0 && live ? "next" : ""}"><div class="bt"><b>${fmt12(o.dep)}</b>${live && mins >= 0 ? `<small>${fmtIn(mins)}</small>` : ""}</div>
        <div><div class="sh-arr">→ ${esc(shTo)} ~<b>${fmt12(o.arr)}</b> <span class="tag ${isFull(o.trip) ? "" : "gold"}">${isFull(o.trip) ? "Full loop" : "Short loop"}</span></div>
        <div class="route-line">${shuttleLine(o.trip, o.i, o.i, o.j)}</div>
        ${last ? `<div class="last-note">⭐ ${esc(SH.lastNote)}</div>` : ""}</div></div>`; };
    const dayTrips = SH.trips.filter(t => t.d === oDay).sort((a, b) => ev(a.t[0]) - ev(b.t[0]));
    const cards = S.offsite.map(r => { const p = placeById(r.place);
      return `<div class="card off-card"><h3>${esc(r.title)}</h3><p class="off-meta">${esc(r.km)} from campus</p>
        <p class="small" style="margin:8px 0 10px">${esc(r.how)}</p>
        <div class="row two">${r.shuttleStop ? `<button class="btn sm full" data-shto="${esc(r.shuttleStop)}">🚐 Shuttles here</button>` : ""}${p ? `<a class="btn sm ghost full" href="${directionsUrl(p)}" target="_blank" rel="noopener">Directions ↗</a>` : ""}</div>
        ${r.reportMin ? `<div class="leave-rule">⏱ Take a shuttle that gets you there at least <b>${r.reportMin} min</b> before your match. Match times are on ${C.sportagonUrl ? `<a href="${esc(C.sportagonUrl)}" target="_blank" rel="noopener">${esc(C.sportagonName)}</a>` : esc(C.sportagonName)}.</div>` : ""}</div>`; }).join("");
    const hubs = S.places.filter(p => ["rly", "airport", "kgm"].includes(p.id));
    $("#tBody").innerHTML = `
      <div class="card bus-finder"><div class="sh-title">🚐 Outside-campus shuttle <span>free</span></div>
        <div class="bf-row"><label>From<select id="shFrom">${opts(shFrom)}</select></label>
        <button class="swap" id="shSwap" title="Swap" aria-label="Swap">⇅</button><label>To<select id="shTo">${opts(shTo)}</select></label></div></div>
      <div class="chips scroll-x" style="margin:12px 0">${S.days.map(d => `<button class="chip ${oDay === d.key ? "on" : ""}" data-o="${d.key}">${esc(d.label)} · ${fmtDate(d.date)}${isToday(d.key) ? " · today" : ""}</button>`).join("")}</div>
      ${shFrom === shTo ? `<div class="empty-note">Choose two different stops.</div>` : `
      <div class="card list">${upcoming.length ? upcoming.map(row).join("") : `<p class="muted small" style="margin:0">${live ? "No more shuttles on this route today." : "No shuttles on this route that day."} Autos: see the Fares tab.</p>`}</div>
      ${past.length ? `<details class="past-d"><summary>${past.length} earlier shuttle${past.length === 1 ? "" : "s"} today</summary><div class="card list" style="margin-top:8px">${past.map(row).join("")}</div></details>` : ""}`}
      <p class="small muted" style="margin:8px 2px 0">${esc(SH.note)}</p>
      <div class="section"><button class="btn ghost full" id="shAllBtn">${shAll ? "Hide" : "Show"} full ${esc(dayByKey(oDay).label)} shuttle timetable (${dayTrips.length} trips)</button>
        ${shAll ? `<div class="card list" style="margin-top:10px">${dayTrips.map(t => `<div class="sh-full"><b>${fmt12(t.t[0])}</b> <span class="tag ${isFull(t) ? "" : "gold"}">${isFull(t) ? "Full" : "Short"}</span>${t.last ? " ⭐" : ""}<div class="route-line">${shuttleLine(t)}</div></div>`).join("")}</div>` : ""}</div>
      <div class="section"><div class="section-head"><h2>Off-campus venues & stay</h2></div><div class="list">${cards}</div></div>
      <div class="section"><div class="section-head"><h2>Getting around Kozhikode</h2></div><div class="list">
        ${S.publicTransport.map(t => `<div class="card"><h4 style="margin:0 0 4px;font-weight:850">${esc(t.title)}</h4><p style="margin:0" class="small">${esc(t.text)}</p></div>`).join("")}
        ${hubs.map(p => `<div class="card"><h4 style="margin:0 0 4px;font-weight:850">${esc(p.name)}</h4><p class="small" style="margin:0 0 8px">${esc(p.desc || "")}</p><a class="btn sm" href="${directionsUrl(p)}" target="_blank" rel="noopener">Directions ↗</a></div>`).join("")}</div></div>`;
    const save = () => { store.set("shFrom", shFrom); store.set("shTo", shTo); };
    $("#shFrom").onchange = e => { shFrom = e.target.value; save(); renderOffsite(); };
    $("#shTo").onchange = e => { shTo = e.target.value; save(); renderOffsite(); };
    $("#shSwap").onclick = () => { [shFrom, shTo] = [shTo, shFrom]; save(); renderOffsite(); };
    $("#shAllBtn").onclick = () => { shAll = !shAll; renderOffsite(); };
    $$("#tBody [data-o]").forEach(b => b.onclick = () => { oDay = b.dataset.o; renderOffsite(); });
    $$("#tBody [data-shto]").forEach(b => b.onclick = () => { shTo = b.dataset.shto; if (shFrom === shTo) shFrom = "IIM Kozhikode"; save(); renderOffsite(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  }
  function homeShuttleHTML() {
    const day = firstUpcomingDay(); if (!day || !SH.trips.length) return "";
    const live = isToday(day.key), n = now().min, from = store.get("shHome") || "Boys' Accommodation";
    const list = [];
    SH.trips.filter(t => t.d === day.key).forEach(t => { for (let i = 0; i < SH.route.length - 1; i++) if (SH.route[i] === from && t.t[i] && (!live || ev(t.t[i]) >= n)) { list.push({ t, i }); } });
    list.sort((a, b) => ev(a.t.t[a.i]) - ev(b.t.t[b.i]));
    const rows = list.slice(0, 3).map(({ t, i }) => `<div class="bus-row"><div class="bt"><b>${fmt12(t.t[i])}</b><small>${live ? fmtIn(ev(t.t[i]) - n) : esc(day.label)}</small></div>
      <div class="route-line">${shuttleLine(t, i, i)}</div></div>`).join("");
    return `<div class="section"><div class="section-head"><h2>🚐 Shuttle (outside campus)</h2><a href="#transport/shuttle">Shuttle finder →</a></div>
      <div class="chips scroll-x" style="margin-bottom:10px">${SH_STOPS.map(s => `<button class="chip ${s === from ? "on" : ""}" data-shhome="${esc(s)}">From ${esc(s)}</button>`).join("")}</div>
      <div class="card list">${rows || `<p class="muted small" style="margin:0">No more shuttles from ${esc(from)} today.</p>`}</div></div>`;
  }

  /* =================================================================== HELP */
  function renderHelp() {
    const outings = S.places.filter(p => p.cat === "city");
    $("#view-help").innerHTML = `
      <div class="section-head" style="margin-top:0"><h2>🚨 Emergency</h2></div>
      <div class="sos-grid">${S.emergency.map((e, i) => `<a class="sos-btn ${i > 1 ? "alt" : ""}" href="${tel(e.phone)}"><b>${esc(e.phone.length > 6 ? prettyPhone(e.phone) : e.phone)}</b><span>${esc(e.label)}</span></a>`).join("")}</div>
      <p class="small muted">On campus: <a href="#map/medical">Medical Centre</a>. Nearest hospital: <a href="#map/gmch">Govt. Medical College</a> (₹270 by auto).</p>

      <div class="section" id="wayfinding"><div class="section-head"><h2>🧭 Finding your way</h2><a href="#map">Map →</a></div><div class="card list">
        ${S.wayfinding.map(w => `<a class="way" href="#map/${esc(w.place)}"><b>${esc(w.what)}</b><span>${esc(w.where)}</span></a>`).join("")}</div>
        <p class="small muted">Follow the placards from the Main Gate. Each one points to the venues listed here.</p></div>

      <div class="section" id="washrooms"><div class="section-head"><h2>🚻 Washrooms</h2></div><div class="card"><table><thead><tr><th>If you're at</th><th>Use</th></tr></thead><tbody>
        ${S.washrooms.map(w => `<tr><td><a href="#map/${esc(w.place)}"><b>${esc(w.at)}</b></a></td><td>${esc(w.use)}</td></tr>`).join("")}</tbody></table></div></div>

      <div class="section"><a class="card mess-card" href="#food"><div class="mc-top"><div><b>🍽️ Mess: ${esc(S.mess.name)}</b><span>${esc(S.mess.where)} · timings & menu</span></div>${chev}</div></a></div>

      <div class="section"><div class="section-head"><h2>FAQs</h2></div>${S.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>

      <div class="section"><div class="section-head"><h2>🗣 Malayalam in 60 seconds</h2></div><div class="card">
        ${S.phrases.map(p => `<div class="phrase"><span class="en">${esc(p.en)}</span><span class="sc">${esc(p.script)}</span><span class="ml">${esc(p.ml)}</span></div>`).join("")}</div></div>

      <div class="section"><div class="section-head"><h2>🌴 After your last match</h2><a href="#transport/fares">All fares →</a></div><div class="grid grid-2">
        ${outings.map(p => `<a class="card" href="#map/${esc(p.id)}" style="text-decoration:none"><h4 style="margin:0 0 4px;font-weight:850">${esc(p.name)}</h4><p class="small" style="margin:0">${esc(p.desc)}</p></a>`).join("")}</div></div>

      <div class="section"><div class="card row" style="justify-content:space-between"><div><b>Share this hub</b><div class="small muted">Send it to your contingent group.</div></div>
        <button class="btn accent" id="shareBtn">Share ↗</button></div></div>
      <div class="foot"><img src="${CREST}" alt="IIM Kozhikode Sports Committee" width="110"></div>`;
    $("#shareBtn").onclick = async () => {
      const url = C.siteUrl || location.origin + location.pathname, text = `${C.eventName} Contingent Hub: venues, mess menu, buses, autos and map`;
      if (navigator.share) { try { await navigator.share({ title: C.eventName, text, url }); } catch { /* cancelled */ } }
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
    };
  }

  /* =================================================================== ROUTER */
  const views = ["home", "map", "fixtures", "food", "transport", "help"];
  function current() { const [v0, arg] = (location.hash.slice(1) || "home").split("/"); return { v: views.includes(v0) ? v0 : "home", arg }; }
  function route() {
    const { v, arg } = current();
    $$(".view").forEach(s => s.classList.toggle("active", s.id === `view-${v}`));
    $$(".tabbar a").forEach(a => a.classList.toggle("active", a.dataset.tab === v));
    if (v === "home") renderHome();
    if (v === "food") renderFood();
    if (v === "fixtures") renderFixtures(arg);
    if (v === "transport") { if (arg === "shuttle") tTab = "offsite"; else if (["bus", "offsite", "autos", "fares"].includes(arg)) tTab = arg; renderTransport(); }
    if (v === "help") { renderHelp(); if (arg) setTimeout(() => document.getElementById(arg)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }
    if (v === "map") { initMap(); setTimeout(() => { map?.invalidateSize(); if (arg) focusPlace(arg); }, 60); }
    if (!(v === "help" && arg)) window.scrollTo(0, 0);
  }
  function rerender() {
    const { v } = current();
    if (v === "home") renderHome(); else if (v === "food") renderFood(); else if (v === "fixtures") renderFixtures();
    else if (v === "transport" && tTab === "bus") renderBus(); else if (v === "transport" && tTab === "offsite") renderOffsite();
  }

  /* =================================================================== LIVE DATA */
  function parseCSV(text) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c !== "\r") f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  const asObjects = rows => { if (!rows.length) return []; const keys = rows[0].map(k => k.trim().toLowerCase().replace(/\s+/g, "_"));
    return rows.slice(1).filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] || "").trim()]))); };
  function timeLabel(s) {
    const m = String(s).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i); if (!m) return null;
    let h = +m[1]; const ap = (m[3] || "").toUpperCase();
    if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0;
    return `${pad(h)}:${m[2]}`;
  }
  async function loadSheets() {
    const L_ = C.liveSheets || {}, jobs = [loadScheduleSheet()];
    const get = async url => asObjects(parseCSV(await (await fetch(url, { cache: "no-store" })).text()));
    const dayKey = v => { const d = S.days.find(x => x.key === v || x.date === v || x.label.toLowerCase() === String(v).toLowerCase()); return d ? d.key : v; };
    const stopName = v => S.busStops.find(s => s.toLowerCase().replace(/\s/g, "") === String(v).toLowerCase().replace(/\s/g, "")) || v.trim();
    if (L_.announcements) jobs.push(get(L_.announcements).then(r => { const a = r.filter(x => x.text).map(x => ({ text: x.text, level: x.level || "info" })); if (a.length) S.announcements = a; }));
    if (L_.autos) jobs.push(get(L_.autos).then(r => { const a = r.filter(x => x.name && x.phone); if (a.length) S.autos = a; }));
    if (L_.buses) jobs.push(get(L_.buses).then(r => {
      const b = r.filter(x => x.time && x.from && x.to).map(x => ({ d: dayKey(x.day), t: timeLabel(x.time) || x.time, from: stopName(x.from),
        via: (x.via || "").split(/[,;]/).map(s => s.trim()).filter(s => s && s !== "-" && s !== "—").map(stopName), to: stopName(x.to) }));
      if (b.length) S.buses = b; }));
    await Promise.allSettled(jobs);
  }

  /* =================================================================== BOOT */
  async function boot() {
    $("#brandImg").src = EMBLEM;
    $("#evName").textContent = C.eventName; $("#evTag").textContent = C.tagline;
    document.title = `${C.eventName} · ${C.tagline}`;
    $("#contBtn").onclick = openTeamDialog;
    $("#contBtn").hidden = !(C.scheduleSheet && C.scheduleSheet.id) && !S.teams.some(t => t.hostel);
    $("#mapSearch").addEventListener("input", () => filterPlaces());
    renderTeamBtn(); renderPhase();
    window.addEventListener("hashchange", route);
    route();
    await loadSheets();
    rerender();
    setInterval(() => { renderPhase(); rerender(); }, 60000);
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  boot();
})();
