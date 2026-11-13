/* Inter IIM '26 · Committee platform (match status, delays, results, MVP, standings, private rosters). */
(() => {
  "use strict";
  const S = window.SITE, C = S.config, A = window.ASSETS || {};
  S.teams.forEach(t => { if (A[t.id]) t.logo = A[t.id]; });
  if (A.emblem) document.getElementById("brandImg").src = A.emblem;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };
  const pad = n => String(n).padStart(2, "0");
  const toMin = hm => { const [h, m] = String(hm).split(":").map(Number); return h * 60 + (m || 0); };
  const ev = hm => { const m = toMin(hm); return m < 240 ? m + 1440 : m; };
  const hmOf = m => { m = ((m % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
  const fmt12 = hm => { let [h, m] = String(hm).split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${pad(m || 0)} ${ap}`; };
  const fmtWhen = iso => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" }); };
  const fmtDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const nowInfo = () => { const d = new Date(); let m = d.getHours() * 60 + d.getMinutes(); if (m < 240) { d.setDate(d.getDate() - 1); m += 1440; }
    return { iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, min: m }; };
  const baseSport = s => String(s).replace(/\s*\(.*?\)\s*/g, "").trim();
  const emoji = s => S.sportEmoji[baseSport(s)] || "🏅";
  const teamByLetter = l => S.teams.find(t => t.letter === l);
  const teamByShort = s => S.teams.find(t => t.short === s);
  const pairs = m => String(m).split(/\s*&\s*/).map(x => x.trim()).filter(Boolean);
  const lettersIn = m => [...new Set(pairs(m).flatMap(p => p.toUpperCase().split(/\s+VS\s+/).map(x => x.trim()).filter(x => x.length === 1 && teamByLetter(x))))];
  const matchText = m => pairs(m).map(p => { const x = p.toUpperCase().split(/\s+VS\s+/).map(y => y.trim());
    return x.length === 2 && x.every(teamByLetter) ? `${teamByLetter(x[0]).short} vs ${teamByLetter(x[1]).short}` : p; }).join("  ·  ");
  const fid = f => `${f.d}|${f.t}|${f.s}`;
  const STATUS = { scheduled: ["Scheduled", ""], live: ["● LIVE", "st-live"], delayed: ["Delayed", "st-delay"], done: ["Finished", "st-done"], cancelled: ["Cancelled", "st-cancel"] };
  function toast(msg, bad) { const t = $("#toast"); t.textContent = msg; t.style.background = bad ? "#c92a2a" : ""; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2400); }

  /* ---------- API ---------- */
  let TOKEN = store.get("admToken") || "", NAME = "", OWNER = false, OWNER_NAME = "Mrunal", APPROVAL = true;
  let D = { matches: {}, standings: {}, rosters: {}, settings: {}, log: [], devices: [], members: [], announce: null }, FX = (window.FIXTURES || []).slice(), fxLive = false;
  async function api(action, extra = {}) {
    const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: TOKEN, action, ...extra }) });
    const j = await r.json().catch(() => ({ error: `Server error (${r.status})` }));
    if (!r.ok) { const e = new Error(j.error || "Error"); e.status = r.status; e.data = j; throw e; }
    return j;
  }
  async function loadAll(withRosters = true) {
    const j = await api("load", { rosters: withRosters });
    NAME = j.name; OWNER = !!j.owner; APPROVAL = j.approval !== false;
    Object.assign(D, { matches: j.matches, standings: j.standings, settings: j.settings, log: j.log, members: j.members || [], announce: j.announce || null });
    if (OWNER) D.devices = j.devices || [];
    if (withRosters) D.rosters = j.rosters;
    paintBadge();
  }
  async function loadFixtures() {
    const sh = C.scheduleSheet; if (!sh || !sh.id) return;
    try {
      const out = [];
      await Promise.all(Object.entries(sh.tabs).map(async ([key, tab]) => {
        const r = await fetch(`/api/schedule?id=${encodeURIComponent(sh.id)}&sheet=${encodeURIComponent(tab)}`); if (!r.ok) throw new Error("sheet");
        const rows = csv(await r.text()), hdr = rows[0].map(h => { const m = String(h).match(/(\d{1,2}):(\d{2})/); return m ? `${pad(+m[1])}:${m[2]}` : null; });
        if (hdr.filter(Boolean).length < 20) throw new Error("layout");
        rows.slice(1).forEach(row => { const s = (row[0] || "").trim(); if (s) row.forEach((c, i) => { if (i && hdr[i] && String(c).trim()) out.push({ d: key, t: hdr[i], s, m: String(c).trim().replace(/\s+/g, " ") }); }); });
      }));
      if (out.length > 30) { FX = out; fxLive = true; }
    } catch { /* keep built-in copy */ }
  }
  function csv(text) { const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) { const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c !== "\r") f += c; }
    if (f || row.length) { row.push(f); rows.push(row); } return rows; }

  /* ---------- Login: pick your name; a new phone waits for Mrunal's one-tap approval ---------- */
  const deviceLabel = () => { const u = navigator.userAgent;
    const os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android" : /Mac/.test(u) ? "Mac" : /Windows/.test(u) ? "Windows" : "Device";
    const br = /EdgA?\//.test(u) ? "Edge" : /SamsungBrowser/.test(u) ? "Samsung" : /CriOS|Chrome\//.test(u) ? "Chrome" : /FxiOS|Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "Browser";
    return `${os} · ${br}`; };
  const shell = on => { $("#admNav").hidden = !on; $("#who").hidden = !on; $("#logout").hidden = !TOKEN; };
  async function renderLogin(err) {
    shell(false); clearInterval(start._t); clearInterval(renderWaiting._t);
    $("#adm").innerHTML = `<div class="view active"><div class="card login"><h2>Sports Committee login</h2><p class="muted">Loading names…</p></div></div>`;
    let names = [];
    try { const j = await api("names"); names = j.names; OWNER_NAME = j.owner; APPROVAL = j.approval; }
    catch (e) { $("#adm .login").innerHTML = `<h2>Sports Committee login</h2><p class="err">${esc(e.message)}</p><button class="btn full" onclick="location.reload()">Try again</button>`; return; }
    const sorted = [...names].sort((x, y) => x.localeCompare(y));
    $("#adm").innerHTML = `<div class="view active"><div class="card login">
      <h2>Who are you?</h2><p class="muted">Tap your name. Every update is saved under it.</p>
      ${err ? `<p class="err">${esc(err)}</p>` : ""}
      <div class="names">${sorted.map(n => `<button class="nm${n === OWNER_NAME ? " own" : ""}" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>
      <div id="pw" hidden><label class="lbl" for="pwIn">Password for ${esc(OWNER_NAME)}</label>
        <input id="pwIn" class="in" type="password" autocomplete="current-password"><button class="btn accent full" id="pwGo" style="margin-top:10px">Log in</button></div>
      <p class="small muted" style="margin-top:14px">${APPROVAL ? `First time on this phone? ${esc(OWNER_NAME)} approves it once, then you stay logged in.` : "You'll stay logged in on this phone."} Name missing? Ask ${esc(OWNER_NAME)}.</p></div></div>`;
    const ask = async (name, password) => {
      try { const j = await api("request", { name, password, device: deviceLabel() });
        TOKEN = j.token; store.set("admToken", TOKEN);
        j.status === "approved" ? start() : renderWaiting(j.name);
      } catch (e) { renderLogin(e.message); } };
    $$(".nm").forEach(b => b.onclick = () => {
      const n = b.dataset.n;
      if (n === OWNER_NAME) { $("#pw").hidden = false; $("#pwIn").focus(); $$(".nm").forEach(x => x.classList.toggle("on", x === b)); return; }
      if (!confirm(`Log in as ${n}?`)) return;
      b.disabled = true; b.textContent = "…"; ask(n);
    });
    $("#pwGo").onclick = () => ask(OWNER_NAME, $("#pwIn").value);
    $("#pwIn").onkeydown = e => { if (e.key === "Enter") ask(OWNER_NAME, $("#pwIn").value); };
  }
  function renderWaiting(name) {
    shell(false); $("#logout").hidden = true;
    $("#adm").innerHTML = `<div class="view active"><div class="card login wait">
      <div class="spin"></div><h2>Waiting for ${esc(OWNER_NAME)}</h2>
      <p>Ask ${esc(OWNER_NAME)} to approve <b>${esc(name)}</b> on <b>${esc(deviceLabel())}</b>.</p>
      <p class="small muted">This page opens by itself once approved. You only need this once per phone.</p>
      <button class="btn ghost full" id="cancelReq">Not ${esc(name)}? Start again</button></div></div>`;
    $("#cancelReq").onclick = () => { store.del("admToken"); TOKEN = ""; renderLogin(); };
    clearInterval(renderWaiting._t);
    renderWaiting._t = setInterval(async () => {
      try { const j = await api("status");
        if (j.status === "approved") { clearInterval(renderWaiting._t); toast("Approved ✓"); start(); }
        else if (j.status !== "pending") { clearInterval(renderWaiting._t); store.del("admToken"); TOKEN = ""; renderLogin(j.status === "revoked" ? `${OWNER_NAME} declined this request.` : ""); }
      } catch { /* offline: keep waiting */ } }, 4000);
  }
  $("#logout").onclick = () => { if (!confirm("Log out on this phone? You'll need approval again to log back in.")) return; store.del("admToken"); TOKEN = ""; renderLogin(); };
  async function boot() {
    if (!TOKEN) return renderLogin();
    try { const j = await api("status");
      if (j.status === "approved") return start();
      if (j.status === "pending") return renderWaiting(j.name);
      store.del("admToken"); TOKEN = ""; renderLogin(j.status === "revoked" ? "Access on this phone was removed. Tap your name to ask again." : "");
    } catch (e) { $("#adm").innerHTML = `<div class="view active"><div class="card login"><p class="err">${esc(e.message)}</p><button class="btn full" onclick="location.reload()">Try again</button></div></div>`; }
  }

  /* ---------- Router ---------- */
  const tabs = ["matches", "standings", "teams", "more"];
  const pendingCount = () => (D.devices || []).filter(d => d.status === "pending").length;
  function paintBadge() {
    const a = $('#admNav a[data-tab="more"]'); if (!a) return;
    a.querySelector("span").textContent = OWNER ? "Control" : "Log"; a.querySelector("i").textContent = OWNER ? "🛠" : "🕘";
    let bd = a.querySelector(".bdg"); const n = OWNER ? pendingCount() : 0;
    if (!n) { bd && bd.remove(); return; }
    if (!bd) { bd = document.createElement("b"); bd.className = "bdg"; a.appendChild(bd); } bd.textContent = n;
  }
  function route() {
    const [t0, arg] = (location.hash.slice(1) || "matches").split("/"); const t = tabs.includes(t0) ? t0 : "matches";
    $$("#admNav a").forEach(a => a.classList.toggle("active", a.dataset.tab === t));
    ({ matches: renderMatches, standings: renderStandings, teams: renderTeams, more: renderMore })[t](arg);
    if (t === "more") loadAll(false).then(() => { if ((location.hash.slice(1) || "").startsWith("more") && !$(".dirty")) renderMore(); }).catch(() => {});
    window.scrollTo(0, 0);
  }
  async function start() {
    clearInterval(renderWaiting._t);
    $("#adm").innerHTML = `<div class="view active"><p class="muted">Loading…</p></div>`;
    try { await Promise.all([loadAll(true), loadFixtures()]); }
    catch (e) { if (e.status === 401) { if (e.data?.status === "pending") return renderWaiting(NAME || "you"); store.del("admToken"); TOKEN = ""; return renderLogin(e.message); } return renderLogin(e.message); }
    $("#who").textContent = OWNER ? `${NAME} · owner` : NAME; shell(true);
    window.onhashchange = route; route();
    clearInterval(start._t); clearInterval(start._o);
    start._t = setInterval(async () => { if (document.hidden || $(".am-ed:not([hidden])") || $(".dirty")) return;
      try { await loadAll(false); const t = (location.hash.slice(1) || "matches").split("/")[0]; if (t === "matches") renderMatches(); if (t === "more") renderMore(); }
      catch (e) { if (e.status === 401) { store.del("admToken"); TOKEN = ""; renderLogin(e.message); } } }, 30000);
    if (OWNER) start._o = setInterval(async () => { if (document.hidden) return;   // quick check for new access requests
      try { const before = pendingCount(), j = await api("devices"); D.devices = j.devices; paintBadge();
        const n = pendingCount(); if (n > before) { const nw = D.devices.filter(d => d.status === "pending").slice(-1)[0]; toast(`🔔 ${nw.name} is asking for access`); }
        if (n !== before && (location.hash.slice(1) || "").startsWith("more") && !$(".dirty")) renderMore();
      } catch { /* ignore */ } }, 8000);
  }

  /* ---------- Matches ---------- */
  let mDay = null, mSport = store.get("admSport") || "all", hideDone = store.get("admHideDone") === "1", openId = null;
  const todayKey = () => (S.days.find(d => d.date === nowInfo().iso) || S.days.find(d => d.date > nowInfo().iso) || S.days[S.days.length - 1]).key;
  const teamOpts = (letters, sel) => `<option value="">—</option>` + (letters.length ? letters.map(teamByLetter) : S.teams).map(t => `<option value="${t.short}" ${t.short === sel ? "selected" : ""}>${t.short}</option>`).join("") + `<option value="Draw" ${sel === "Draw" ? "selected" : ""}>Draw / Tie</option>`;
  function statusPill(r, f) {
    if (!r || !r.status || r.status === "scheduled") return `<span class="pill">Scheduled</span>`;
    const [lbl, cls] = STATUS[r.status];
    return `<span class="pill ${cls}">${lbl}${r.status === "delayed" ? ` +${r.delay}m → ${fmt12(hmOf(ev(f.t) + (r.delay || 0)))}` : ""}</span>`;
  }
  function renderMatches() {
    if (!mDay) mDay = todayKey();
    const cats = [...new Set(FX.map(f => f.s))].sort();
    const list = FX.filter(f => f.d === mDay && (mSport === "all" || f.s === mSport || baseSport(f.s) === mSport))
      .filter(f => !hideDone || !["done", "cancelled"].includes(D.matches[fid(f)]?.status))
      .sort((a, b) => ev(a.t) - ev(b.t) || a.s.localeCompare(b.s));
    const counts = Object.values(D.matches).reduce((o, r) => (o[r.status] = (o[r.status] || 0) + 1, o), {});
    $("#adm").innerHTML = `<div class="view active">
      <div class="adm-sum"><span class="pill st-live">● ${counts.live || 0} live</span><span class="pill st-delay">${counts.delayed || 0} delayed</span><span class="pill st-done">${counts.done || 0} finished</span>
        <button class="btn sm ghost" id="refresh">↻ Refresh</button></div>
      <div class="chips scroll-x" style="margin:10px 0">${S.days.map(d => `<button class="chip ${mDay === d.key ? "on" : ""}" data-md="${d.key}">${esc(d.label)} · ${fmtDate(d.date)}</button>`).join("")}</div>
      <div class="filters"><select id="mSport"><option value="all">All sports</option>${[...new Set(cats.map(baseSport))].sort().map(b => `<optgroup label="${esc(b)}">${cats.filter(c => baseSport(c) === b).length > 1 ? `<option value="${esc(b)}" ${mSport === b ? "selected" : ""}>${esc(b)} (all)</option>` : ""}${cats.filter(c => baseSport(c) === b).map(c => `<option value="${esc(c)}" ${mSport === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</optgroup>`).join("")}</select>
        <label class="chk"><input type="checkbox" id="hideDone" ${hideDone ? "checked" : ""}> Hide finished</label></div>
      <p class="small muted">${fxLive ? "🟢 Fixtures live from the schedule sheet" : "Fixtures from the built-in copy"} · ${list.length} matches · tap a match to update it</p>
      <div class="am-list">${list.map(f => matchCard(f)).join("") || `<div class="empty-note">No matches for this filter.</div>`}</div></div>`;
    $("#refresh").onclick = async () => { try { await loadAll(false); renderMatches(); toast("Up to date"); } catch (e) { toast(e.message, 1); } };
    $$("[data-md]").forEach(b => b.onclick = () => { mDay = b.dataset.md; openId = null; renderMatches(); });
    $("#mSport").onchange = e => { mSport = e.target.value; store.set("admSport", mSport); openId = null; renderMatches(); };
    $("#hideDone").onchange = e => { hideDone = e.target.checked; store.set("admHideDone", hideDone ? "1" : "0"); renderMatches(); };
    $$(".am").forEach(bindCard);
  }
  function matchCard(f) {
    const id = fid(f), r = D.matches[id] || {}, open = openId === id, letters = lettersIn(f.m);
    const res = [r.score && `🏁 ${esc(r.score)}`, r.winner && `🏆 ${esc(r.winner)}`, r.mvp && `⭐ ${esc(r.mvp)}${r.mvpTeam ? ` (${esc(r.mvpTeam)})` : ""}`].filter(Boolean).join(" · ");
    const hidden = [r.pubStatus === false && "status", r.pubResult === false && "result", r.pubMvp === false && "MVP"].filter(Boolean);
    return `<div class="card am ${r.status ? "s-" + r.status : ""}" data-id="${esc(id)}">
      <div class="am-top"><b>${fmt12(f.t)}</b><span class="am-sport">${emoji(f.s)} ${esc(f.s)}</span>${statusPill(r, f)}</div>
      <div class="am-teams">${esc(matchText(f.m))}</div>
      ${res ? `<div class="am-res">${res}</div>` : ""}
      ${hidden.length ? `<div class="small" style="color:#8a6100">🙈 Hidden from public: ${hidden.join(", ")}</div>` : ""}
      ${r.by ? `<div class="small muted">Updated by ${esc(r.by)} · ${esc(fmtWhen(r.at))}</div>` : ""}
      <div class="am-quick">${r.status !== "live" ? `<button class="btn sm" data-q="live">▶ Start (Live)</button>` : ""}
        <button class="btn sm ghost" data-q="delay">⏱ Delay</button>${r.status !== "done" ? `<button class="btn sm ok" data-q="done">✓ Finish</button>` : ""}<button class="btn sm ghost" data-q="edit">✎ Edit</button></div>
      <div class="am-ed" ${open ? "" : "hidden"}>
        <label class="lbl">Status</label>
        <div class="seg am-st">${Object.entries(STATUS).map(([k, [l]]) => `<button type="button" data-st="${k}" class="${(r.status || "scheduled") === k ? "on" : ""}">${l.replace("● ", "")}</button>`).join("")}</div>
        <div class="am-delay" ${r.status === "delayed" ? "" : "hidden"}><label class="lbl">Delayed by (minutes)</label>
          <div class="chips" style="flex-wrap:wrap">${[5, 10, 15, 20, 30, 45, 60].map(x => `<button type="button" class="chip" data-dl="${x}">+${x}</button>`).join("")}</div>
          <input type="number" min="0" max="600" inputmode="numeric" class="in" data-f="delay" value="${r.delay || 0}"><div class="small muted" data-newtime></div></div>
        <label class="lbl">Score / result</label><input class="in" data-f="score" maxlength="120" placeholder="e.g. 21-15, 18-21, 21-19  or  120/4 vs 118/9" value="${esc(r.score)}">
        <div class="two"><div><label class="lbl">Winner</label><select class="in" data-f="winner">${teamOpts(letters, r.winner)}</select></div>
          <div><label class="lbl">MVP's IIM</label><select class="in" data-f="mvpTeam">${teamOpts(letters, r.mvpTeam).replace(/<option value="Draw"[^<]*<\/option>/, "")}</select></div></div>
        <label class="lbl">MVP (player of the match)</label><input class="in" data-f="mvp" maxlength="60" placeholder="Player name" value="${esc(r.mvp)}">
        <label class="lbl">Note (shown with the status)</label><input class="in" data-f="note" maxlength="140" placeholder="e.g. Moved to Court 2 · Rain delay" value="${esc(r.note)}">
        <div class="pubs"><label class="chk"><input type="checkbox" data-f="pubStatus" ${r.pubStatus === false ? "" : "checked"}> Show status publicly</label>
          <label class="chk"><input type="checkbox" data-f="pubResult" ${r.pubResult === false ? "" : "checked"}> Show result publicly</label>
          <label class="chk"><input type="checkbox" data-f="pubMvp" ${r.pubMvp === false ? "" : "checked"}> Show MVP publicly</label></div>
        <div class="row two" style="margin-top:12px"><button class="btn ghost" data-cancel>Cancel</button><button class="btn accent" data-save>Save</button></div>
      </div></div>`;
  }
  function bindCard(card) {
    const id = card.dataset.id, f = FX.find(x => fid(x) === id), ed = $(".am-ed", card);
    let status = D.matches[id]?.status || "scheduled";
    const showDelay = () => { $(".am-delay", ed).hidden = status !== "delayed"; const dl = +$('[data-f="delay"]', ed).value || 0;
      $("[data-newtime]", ed).textContent = `New start ≈ ${fmt12(hmOf(ev(f.t) + dl))}`; };
    const open = () => { $$(".am-ed").forEach(e => { if (e !== ed) e.hidden = true; }); ed.hidden = false; openId = id; showDelay(); card.scrollIntoView({ behavior: "smooth", block: "start" }); };
    const save = async (patch) => {
      const cur = D.matches[id] || {};
      const data = patch ? { ...cur, ...patch } : {
        status, delay: +$('[data-f="delay"]', ed).value || 0, score: $('[data-f="score"]', ed).value, winner: $('[data-f="winner"]', ed).value,
        mvp: $('[data-f="mvp"]', ed).value, mvpTeam: $('[data-f="mvpTeam"]', ed).value, note: $('[data-f="note"]', ed).value,
        pubStatus: $('[data-f="pubStatus"]', ed).checked, pubResult: $('[data-f="pubResult"]', ed).checked, pubMvp: $('[data-f="pubMvp"]', ed).checked };
      try { const j = await api("setMatch", { id, data }); D.matches[id] = j.rec; openId = null; toast(`Saved: ${f.s} ${STATUS[j.rec.status][0].replace("● ", "")}`); renderMatches(); }
      catch (e) { toast(e.message, 1); }
    };
    $$("[data-q]", card).forEach(b => b.onclick = () => {
      const q = b.dataset.q;
      if (q === "live") save({ status: "live" });
      else if (q === "done") { open(); status = "done"; $$("[data-st]", ed).forEach(x => x.classList.toggle("on", x.dataset.st === "done")); showDelay(); $('[data-f="score"]', ed).focus(); }
      else if (q === "delay") { open(); status = "delayed"; $$("[data-st]", ed).forEach(x => x.classList.toggle("on", x.dataset.st === "delayed")); showDelay(); }
      else open();
    });
    $$("[data-st]", ed).forEach(b => b.onclick = () => { status = b.dataset.st; $$("[data-st]", ed).forEach(x => x.classList.toggle("on", x === b)); showDelay(); });
    $$("[data-dl]", ed).forEach(b => b.onclick = () => { $('[data-f="delay"]', ed).value = b.dataset.dl; showDelay(); });
    $('[data-f="delay"]', ed).oninput = showDelay;
    $("[data-cancel]", ed).onclick = () => { openId = null; renderMatches(); };
    $("[data-save]", ed).onclick = () => save();
    $(".am-top", card).onclick = () => (ed.hidden ? open() : (ed.hidden = true, openId = null));
  }

  /* ---------- Standings ---------- */
  let sKey = store.get("admStand") || "Overall";
  function renderStandings() {
    const cats = ["Overall", ...[...new Set(FX.map(f => f.s))].sort()];
    if (!cats.includes(sKey)) sKey = "Overall";
    const rec = D.standings[sKey];
    let rows = rec?.rows?.length ? rec.rows.map(r => ({ ...r })) : (sKey === "Overall" ? S.teams : [...new Set(FX.filter(f => f.s === sKey).flatMap(f => lettersIn(f.m)))].map(teamByLetter))
      .map(t => t.team ? t : { team: t.short, p: null, w: null, d: null, l: null, pts: null, note: "" });
    const cell = (i, k, v) => `<td><input class="in n" inputmode="numeric" data-r="${i}" data-k="${k}" value="${v ?? ""}"></td>`;
    $("#adm").innerHTML = `<div class="view active">
      <div class="section-head" style="margin-top:0"><h2>📊 Standings</h2></div>
      <select id="sKey" class="in">${cats.map(c => `<option ${c === sKey ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <p class="small muted">${sKey === "Overall" ? "Overall championship table across all sports." : "Points table for this event."} Rows are sorted by points when you save.</p>
      <div class="card st-wrap"><table class="st-t"><thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th><th>Note</th><th></th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr><td><select class="in" data-r="${i}" data-k="team">${S.teams.map(t => `<option ${t.short === r.team ? "selected" : ""}>${t.short}</option>`).join("")}</select></td>
          ${cell(i, "p", r.p)}${cell(i, "w", r.w)}${cell(i, "d", r.d)}${cell(i, "l", r.l)}${cell(i, "pts", r.pts)}
          <td><input class="in" data-r="${i}" data-k="note" value="${esc(r.note)}" maxlength="80"></td><td><button class="x" data-del="${i}" aria-label="Remove row">✕</button></td></tr>`).join("")}
      </tbody></table></div>
      <div class="row two" style="margin-top:10px"><button class="btn ghost" id="addRow">+ Add team</button><label class="chk"><input type="checkbox" id="sPub" ${rec?.pub === false ? "" : "checked"}> Show publicly</label></div>
      <button class="btn accent full" id="sSave" style="margin-top:10px">Save table</button>
      ${rec?.by ? `<p class="small muted">Last saved by ${esc(rec.by)} · ${esc(fmtWhen(rec.at))}</p>` : ""}
      ${D.settings.standings === false ? `<p class="small" style="color:#8a6100">🙈 Standings are switched off publicly (Publish & log tab).</p>` : ""}</div>`;
    const read = () => $$(".st-t tbody tr").map(tr => { const o = {}; $$("[data-k]", tr).forEach(x => { o[x.dataset.k] = x.value === "" ? null : x.value; }); return o; });
    $("#sKey").onchange = e => { sKey = e.target.value; store.set("admStand", sKey); renderStandings(); };
    $$(".st-wrap input, .st-wrap select").forEach(x => x.oninput = () => $(".st-wrap").classList.add("dirty"));
    $("#addRow").onclick = () => { const cur = read(); cur.push({ team: S.teams.find(t => !cur.some(r => r.team === t.short))?.short || S.teams[0].short });
      D.standings[sKey] = { ...(D.standings[sKey] || {}), rows: cur, pub: $("#sPub").checked, _draft: true }; renderStandings(); };
    $$("[data-del]").forEach(b => b.onclick = () => { const cur = read(); cur.splice(+b.dataset.del, 1); D.standings[sKey] = { ...(D.standings[sKey] || {}), rows: cur, _draft: true }; renderStandings(); });
    $("#sSave").onclick = async () => {
      const rows = read().map(r => ({ ...r, pts: r.pts == null ? null : +r.pts })).sort((a, b) => (b.pts ?? -1e9) - (a.pts ?? -1e9));
      try { const j = await api("setStandings", { key: sKey, rows, pub: $("#sPub").checked }); D.standings[sKey] = j.rec; toast("Standings saved"); renderStandings(); } catch (e) { toast(e.message, 1); }
    };
  }

  /* ---------- Teams (private rosters) ---------- */
  let tCat = store.get("admTCat") || "", tIIM = store.get("admTIIM") || S.teams[0].short;
  const ROLES = ["Player", "Captain", "Vice-captain", "Substitute", "Manager / Coach"];
  function renderTeams() {
    const cats = [...new Set(FX.map(f => baseSport(f.s)))].sort();
    if (!cats.includes(tCat)) tCat = cats[0];
    const key = `${tCat}|${tIIM}`, rec = D.rosters[key];
    const players = (rec?.players || []).map(p => ({ ...p }));
    while (players.length < Math.max(5, (rec?.players?.length || 0) + 2)) players.push({ name: "", no: "", phone: "", role: "Player" });
    const done = Object.entries(D.rosters).filter(([k, v]) => k.startsWith(tCat + "|") && v.players?.length).map(([k, v]) => `${k.split("|")[1]} (${v.players.length})`);
    $("#adm").innerHTML = `<div class="view active">
      <div class="notice alert" style="margin-bottom:10px"><i>🔒</i><div><b>Private.</b> Team lists are only visible to committee members logged in here. They never appear on the public site.</div></div>
      <div class="filters"><select id="tCat" class="in">${cats.map(c => `<option ${c === tCat ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
        <select id="tIIM" class="in">${S.teams.map(t => `<option ${t.short === tIIM ? "selected" : ""}>${t.short}</option>`).join("")}</select></div>
      <p class="small muted">${done.length ? `Saved for ${esc(tCat)}: ${esc(done.join(", "))}` : `No team lists saved for ${esc(tCat)} yet.`}</p>
      <div class="card ro-wrap">${players.map((p, i) => `<div class="ro-row"><span class="ro-n">${i + 1}</span>
        <input class="in" data-i="${i}" data-k="name" placeholder="Player name" value="${esc(p.name)}" maxlength="60">
        <input class="in" data-i="${i}" data-k="no" placeholder="Jersey" value="${esc(p.no)}" maxlength="8" inputmode="numeric">
        <input class="in" data-i="${i}" data-k="phone" placeholder="Phone" value="${esc(p.phone)}" maxlength="20" inputmode="tel">
        <select class="in" data-i="${i}" data-k="role">${ROLES.map(r => `<option ${r === (p.role || "Player") ? "selected" : ""}>${r}</option>`).join("")}</select></div>`).join("")}</div>
      <div class="row two" style="margin-top:10px"><button class="btn ghost" id="more5">+ 5 more rows</button><button class="btn accent" id="tSave">Save team list</button></div>
      ${rec?.by ? `<p class="small muted">Last saved by ${esc(rec.by)} · ${esc(fmtWhen(rec.at))}</p>` : ""}</div>`;
    const read = () => { const out = []; $$(".ro-row").forEach(row => { const o = {}; $$("[data-k]", row).forEach(x => o[x.dataset.k] = x.value.trim()); out.push(o); }); return out; };
    $$(".ro-wrap input, .ro-wrap select").forEach(x => x.oninput = () => $(".ro-wrap").classList.add("dirty"));
    $("#tCat").onchange = e => { tCat = e.target.value; store.set("admTCat", tCat); renderTeams(); };
    $("#tIIM").onchange = e => { tIIM = e.target.value; store.set("admTIIM", tIIM); renderTeams(); };
    $("#more5").onclick = () => { const cur = read(); for (let i = 0; i < 5; i++) cur.push({ name: "", no: "", phone: "", role: "Player" }); D.rosters[key] = { ...(rec || {}), players: cur }; renderTeams(); };
    $("#tSave").onclick = async () => { try { const j = await api("setRoster", { key, players: read().filter(p => p.name) }); D.rosters[key] = j.rec; toast(`${tIIM} ${tCat} list saved`); renderTeams(); } catch (e) { toast(e.message, 1); } };
  }

  /* ---------- Control (owner) / Log (members) ---------- */
  const UNDOABLE = ["match", "standings", "roster", "settings", "announce", "members"];
  const reversed = () => new Set(D.log.filter(l => l.undoOf).map(l => l.undoOf));
  function undoTargets() {   // editor-style: Undo = latest change still in effect; Redo = available only right after an undo
    const rv = reversed(), live = D.log.filter(l => UNDOABLE.includes(l.kind) && !rv.has(l.lid));
    let redo = null;   // walk back through undos; any fresh change ends the redo chain
    for (const l of D.log) { if (!UNDOABLE.includes(l.kind) || l.op === "redo" || rv.has(l.lid)) continue; if (l.op === "undo") redo = l; break; }
    return { undo: live.find(l => l.op !== "undo"), redo };
  }
  async function doUndo(l, label) {
    try { await api("undo", { lid: l.lid }); }
    catch (e) { if (e.status !== 409) return toast(e.message, 1);
      if (!confirm(`${e.message}\n\n${label} anyway?`)) return;
      try { await api("undo", { lid: l.lid, force: true }); } catch (e2) { return toast(e2.message, 1); } }
    toast(`${label} done`); await loadAll(true); renderMore();
  }
  const kindIcon = { match: "🏁", standings: "📊", roster: "👥", settings: "👁", announce: "📣", members: "🧑‍🤝‍🧑", access: "🔑" };
  function logHTML(limit) {
    const rv = reversed();
    return D.log.slice(0, limit).map(l => `<div class="lg${rv.has(l.lid) ? " rv" : ""}"><div class="lg-h"><span>${kindIcon[l.kind] || "•"} <b>${esc(l.by)}</b> <span class="muted">${esc(fmtWhen(l.at))}</span></span>
      ${OWNER && UNDOABLE.includes(l.kind) ? (rv.has(l.lid) ? `<span class="pill">${l.op === "undo" ? "redone" : "undone"}</span>` : `<button class="btn sm ghost" data-undo="${esc(l.lid)}">${l.op === "undo" ? "↷ Redo" : "↶ Undo"}</button>`) : ""}</div>
      <div>${esc(l.detail || l.key || "")}</div></div>`).join("") || `<p class="muted small">No updates yet.</p>`;
  }
  function renderMore() {
    if (!OWNER) {
      $("#adm").innerHTML = `<div class="view active"><div class="section-head" style="margin-top:0"><h2>🕘 Recent updates</h2><button class="btn sm ghost" id="refLog">↻</button></div>
        <div class="card log">${logHTML(60)}</div><p class="small muted">Need something changed or undone? Ask ${esc(OWNER_NAME)}.</p></div>`;
      $("#refLog").onclick = async () => { try { await loadAll(false); renderMore(); } catch (e) { toast(e.message, 1); } };
      return;
    }
    const s = D.settings, devs = D.devices || [], pend = devs.filter(d => d.status === "pending"), appr = devs.filter(d => d.status === "approved");
    const u = undoTargets();
    const sw = (k, label, sub) => `<label class="sw-row"><input type="checkbox" data-s="${k}" ${s[k] === false ? "" : "checked"}><span><b>${label}</b><small>${sub}</small></span></label>`;
    const ann = Array.isArray(D.announce?.items) ? D.announce.items : (S.announcements || []).map(a => ({ text: a.text, level: a.level === "alert" ? "alert" : "info" }));
    const byName = {}; appr.forEach(d => (byName[d.name] = byName[d.name] || []).push(d));
    $("#adm").innerHTML = `<div class="view active">
      <div class="card ur">
        <button class="btn" id="undoLast" ${u.undo ? "" : "disabled"}>↶ Undo</button>
        <button class="btn" id="redoLast" ${u.redo ? "" : "disabled"}>↷ Redo</button>
        <div class="small muted ur-t">${u.undo ? `Undo: <b>${esc(u.undo.by)}</b> · ${esc(u.undo.detail || "")}` : "Nothing to undo yet."}</div></div>

      <div class="section-head"><h2>🔑 Access requests ${pend.length ? `<span class="bdg in-h">${pend.length}</span>` : ""}</h2>${pend.length > 1 ? `<button class="btn sm accent" id="apprAll">Approve all</button>` : ""}</div>
      <div class="card">${pend.length ? pend.map(d => `<div class="dv"><div><b>${esc(d.name)}</b><small>${esc(d.device || "Unknown phone")} · ${esc(fmtWhen(d.created))}</small></div>
          <button class="btn sm accent" data-appr="${d.id}">Approve</button><button class="btn sm ghost" data-deny="${d.id}">Deny</button></div>`).join("")
        : `<p class="muted small" style="margin:0">${APPROVAL ? "No one waiting. New requests appear here with a 🔔." : "Approval is switched off (COMMITTEE_APPROVAL=off): anyone picking a name gets in."}</p>`}</div>

      <div class="section-head"><h2>📱 Logged-in phones</h2></div>
      <div class="card">${Object.keys(byName).sort().map(n => byName[n].map(d => `<div class="dv"><div><b>${esc(n)}</b><small>${esc(d.device || "")} · since ${esc(fmtWhen(d.decidedAt || d.created))}</small></div>
          ${d.id === TOKEN.slice(0, 10) ? `<span class="pill">this phone</span>` : `<button class="btn sm ghost" data-rev="${d.id}">Log out</button>`}</div>`).join("")).join("") || `<p class="muted small" style="margin:0">None yet.</p>`}</div>

      <div class="section-head"><h2>🧑‍🤝‍🧑 Committee members</h2></div>
      <div class="card"><div class="mchips">${D.members.map(n => `<span class="mchip">${esc(n)}${n === OWNER_NAME ? "" : `<button data-rm="${esc(n)}" aria-label="Remove ${esc(n)}">×</button>`}</span>`).join("")}</div>
        <div class="add-row"><input id="newMem" class="in" placeholder="Add a name" maxlength="40"><button class="btn" id="addMem">Add</button></div>
        <p class="small muted" style="margin:8px 0 0">Removing a name logs that person out on every phone.</p></div>

      <div class="section-head"><h2>📣 Home-page announcements</h2></div>
      <div class="card ann-wrap">${ann.map((a, i) => `<div class="ann-row"><textarea class="in" data-a="${i}" rows="3" maxlength="280">${esc(a.text)}</textarea>
          <label class="chk"><input type="checkbox" data-al="${i}" ${a.level === "alert" ? "checked" : ""}> ⚠️ Alert</label><button class="x" data-ad="${i}" aria-label="Delete">×</button></div>`).join("")}
        <button class="btn sm ghost" id="annAdd">+ Add announcement</button>
        <div class="two" style="margin-top:10px"><button class="btn accent" id="annSave">Publish</button><button class="btn ghost" id="annReset" ${D.announce ? "" : "disabled"}>Use site defaults</button></div>
        <p class="small muted" style="margin:8px 0 0">${D.announce ? `Live version by ${esc(D.announce.by)} · ${esc(fmtWhen(D.announce.at))}.` : "Showing the defaults from data.js."} Shows on phones within about a minute.</p></div>

      <div class="section-head"><h2>👁 What the public site shows</h2></div>
      <div class="card">${sw("results", "Results & scores", "Off = no scores or winners on the public site (e.g. if Sportagon should be the only scoreboard).")}
        ${sw("mvp", "MVPs", "Off = MVP names stay committee-only.")}${sw("standings", "Standings tables", "Off = hide all points tables.")}
        <p class="small muted" style="margin:8px 0 0">Match status (live / delayed / finished) always shows unless hidden on that match. Team lists are never public.</p>
        <button class="btn accent full" id="saveSet" style="margin-top:10px">Save publish settings</button></div>

      <div class="section"><div class="section-head"><h2>🕘 History</h2><button class="btn sm ghost" id="refLog">↻</button></div>
        <p class="small muted" style="margin:-4px 0 8px">Every change by anyone. Undo any line; undoing an undo is a redo.</p>
        <div class="card log">${logHTML(200)}</div></div>
      <p class="small muted">Public site: <a href="./" target="_blank" rel="noopener">${esc(location.host)}</a></p></div>`;

    const act = async (action, extra, msg) => { try { await api(action, extra); toast(msg); await loadAll(action === "undo"); renderMore(); } catch (e) { toast(e.message, 1); } };
    $("#undoLast").onclick = () => u.undo && doUndo(u.undo, "Undo");
    $("#redoLast").onclick = () => u.redo && doUndo(u.redo, "Redo");
    $$("[data-undo]").forEach(b => b.onclick = () => { const l = D.log.find(x => x.lid === b.dataset.undo); l && doUndo(l, l.op === "undo" ? "Redo" : "Undo"); });
    $$("[data-appr]").forEach(b => b.onclick = () => act("approve", { id: b.dataset.appr }, "Approved ✓"));
    $$("[data-deny]").forEach(b => b.onclick = () => act("revoke", { id: b.dataset.deny }, "Request denied"));
    $$("[data-rev]").forEach(b => b.onclick = () => confirm("Log this phone out? They'll need your approval to get back in.") && act("revoke", { id: b.dataset.rev }, "Logged out"));
    $("#apprAll") && ($("#apprAll").onclick = () => act("approve", { ids: pend.map(d => d.id) }, `Approved ${pend.length}`));
    const saveMembers = (list, msg) => act("setMembers", { members: list }, msg);
    $$("[data-rm]").forEach(b => b.onclick = () => confirm(`Remove ${b.dataset.rm} from the committee?`) && saveMembers(D.members.filter(n => n !== b.dataset.rm), `${b.dataset.rm} removed`));
    const addMem = () => { const n = $("#newMem").value.trim().replace(/\s+/g, " "); if (!n) return;
      if (D.members.some(m => m.toLowerCase() === n.toLowerCase())) return toast("Already on the list", 1);
      saveMembers([...D.members, n.charAt(0).toUpperCase() + n.slice(1)], `${n} added`); };
    $("#addMem").onclick = addMem; $("#newMem").onkeydown = e => { if (e.key === "Enter") addMem(); };
    const readAnn = () => $$("[data-a]").map(t => ({ text: t.value.trim(), level: $(`[data-al="${t.dataset.a}"]`).checked ? "alert" : "info" }));
    $$(".ann-wrap textarea, .ann-wrap input").forEach(x => x.oninput = () => $(".ann-wrap").classList.add("dirty"));
    $("#annAdd").onclick = () => { const cur = readAnn(); cur.push({ text: "", level: "info" }); D.announce = { ...(D.announce || {}), items: cur }; renderMore(); $(".ann-wrap").classList.add("dirty"); $$("[data-a]").slice(-1)[0].focus(); };
    $$("[data-ad]").forEach(b => b.onclick = () => { const cur = readAnn(); cur.splice(+b.dataset.ad, 1); D.announce = { ...(D.announce || {}), items: cur }; renderMore(); $(".ann-wrap").classList.add("dirty"); });
    $("#annSave").onclick = () => act("setAnnounce", { items: readAnn().filter(a => a.text) }, "Announcements published");
    $("#annReset").onclick = () => confirm("Go back to the default announcements from data.js?") && act("setAnnounce", { useDefault: true }, "Back to defaults");
    $("#saveSet").onclick = () => { const set = {}; $$("[data-s]").forEach(x => set[x.dataset.s] = x.checked); act("setSettings", { settings: set }, "Publish settings saved"); };
    $("#refLog").onclick = async () => { try { await loadAll(false); renderMore(); } catch (e) { toast(e.message, 1); } };
  }

  boot();
})();
