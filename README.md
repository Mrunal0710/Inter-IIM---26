# Inter IIM '26 · Contingent Hub

A mobile-first guide for the six visiting contingents. It covers:
- **no fixtures**: fixtures, scores and results stay on Sportagon (sponsor); the site only links to it
- a stop-to-stop campus bus finder
- the auto/taxi chetta list with tap-to-call and WhatsApp
- the Team Namo fare card
- food timings with "open now", an editable Google map, the weather, a Malayalam phrasebook and SOS numbers

It's a plain static site with no build step. Anyone on the committee can edit it.

```
index.html, styles.css, app.js   page + logic (rarely touched)
data.js                          ALL CONTENT: teams, places, autos, fares, buses, food
assets/                          IIM logos, Inter-IIM emblem, Sports Committee crest (source images)
assets.js                        the same logos embedded in code, so they always display
mymap-data.js                    snapshot of the IIMK Google My Map + its icons
api/                             Vercel functions: mymap (Google map) and weather. Each is cached so 1000+ users never overload Google or the weather service
tools/export-mymaps.js           regenerates the import file from data.js
```

---

## 1. Deploy to Vercel (5 min)

1. Create a GitHub repo and upload everything in this folder to the repo root.
2. vercel.com → **Add New → Project → Import** the repo. Preset: **Other**. Leave the build settings empty. **Deploy**.
3. Put the live URL in `config.siteUrl` in `data.js`.

From then on, every commit to GitHub redeploys automatically in about 30 seconds.

---

## 2a. Quick edits during the event (all in `data.js`)

| What | Where |
|---|---|
| Mess timings or menu | `mess.meals` (times) and `mess.menu.D1/D2/D3` (dishes; write `A / B` for either-or) |
| Men's accommodation shuttle / any official off-campus transport | `offsite[].trips`, e.g. `{ d: "D1", t: "07:00", from: "D Landing", note: "Team bus" }` |
| Travel time to NIT / Devagiri, or how early teams should arrive | `offsite[].travelMin`, `offsite[].reportMin` |
| Map layer order / layers that start hidden | `config.mapLayerOrder`, `config.mapLayersOff` |

## 2. Still to fill in (search `data.js` for EDIT)

| What | Where |
|---|---|
| Sportagon link | `config.sportagonUrl` |
| Which common room each IIM stays in | `teams[].hostel`: `"cr-ab"`, `"cr-df"`, `"cr-j"`, `"cr-eg"` or `"cr-mn"`. The home screen then shows each team its room and washrooms |

---

## 3. Google map (your My Map on satellite, with its legend)

The Map tab draws the **IIMK Google My Map** with its own layers, icons and descriptions on a satellite base, plus a legend. You can switch each layer on or off.

- **Snapshot:** `mymap-data.js` holds a copy of the map, exported 12 Nov. It shows instantly and works offline.
- **Live:** `api/mymap.js` then fetches the live map from Google and swaps it in. Edits you make in My Maps appear within about a minute.
- **Which one am I seeing?** The line above the map says "🟢 Live from the IIMK Google map" when the live version loaded. If it says "copy from 12 Nov", the live fetch failed: check that the map is shared as **"Anyone with the link can view"**.
- **Refreshing the snapshot (optional):** in My Maps, ⋮ → Export to KMZ → Download, then run `python3 tools/kmz-to-js.py <file>.kmz` and upload the new `mymap-data.js`.
- **Linking sports to pins:** venue links (e.g. Football → "Football Ground") use the `mapName` field in `data.js`. If you rename a pin in My Maps, update its `mapName` too.
- **Pin icons:** pins use the icons exported in the snapshot. A brand-new icon type added later shows as a coloured pin until the snapshot is refreshed.

## 5. Optional: other live lists

Publish a Google Sheet tab as CSV (**File → Share → Publish to web → CSV**) and paste the link into `config.liveSheets`:

- **autos**: columns `name, phone, alt, team`
- **buses**: columns `day, time, from, via, to`
  - `day`: `D1`/`D2`/`D3` or `2026-11-13`
  - `time`: `7:30 AM` or `07:30`
  - `via`: comma-separated, e.g. `D Landing, Phase V`
- **announcements**: columns `text, level` (`info` or `alert`)

---

## Notes
- Times from 00:00 to 03:59 count as late night of the same event day, for the campus buses.
- Offline: after one visit, everything except the map tiles and weather works without signal.
- "Your IIM" is stored only on each phone. There's no login and no data is collected.
- Colours are set at the top of `styles.css` (`--accent` is the Inter-IIM gold).
