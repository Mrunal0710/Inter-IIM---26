# Inter IIM '26 · Contingent Hub

A mobile-first guide for the six visiting contingents. It covers:
- the full fixture schedule, filterable by IIM and synced live from the sports committee's sheet
- a stop-to-stop campus bus finder
- the auto/taxi chetta list with tap-to-call and WhatsApp
- the Team Namo fare card
- food timings with "open now", an editable Google map, the weather, a Malayalam phrasebook and SOS numbers

It's a plain static site with no build step. Anyone on the committee can edit it.

```
index.html, styles.css, app.js   page + logic (rarely touched)
data.js                          ALL CONTENT: teams, places, autos, fares, buses, food
fixtures.js                      bundled fixtures (fallback if the live sheet can't be read)
assets/                          IIM logos, Inter-IIM emblem, Sports Committee crest (source images)
assets.js                        the same logos embedded in code, so they always display
mymap-data.js                    snapshot of the IIMK Google My Map + its icons
api/                             Vercel functions: mymap (Google map), schedule (fixtures sheet), weather. Each is cached so 1000+ users never overload Google or the weather service
tools/export-mymaps.js           regenerates the import file from data.js
```

---

## 1. Deploy to Vercel (5 min)

1. Create a GitHub repo and upload everything in this folder to the repo root.
2. vercel.com → **Add New → Project → Import** the repo. Preset: **Other**. Leave the build settings empty. **Deploy**.
3. Put the live URL in `config.siteUrl` in `data.js`.

From then on, every commit to GitHub redeploys automatically in about 30 seconds.

---

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

## 4. Live fixtures from the schedule sheet

`config.scheduleSheet.id` points at the **"Inter IIM 26 - Schedule"** Google Sheet. The site reads the tabs *Day 1 - 13th*, *Day 2 - 14th* and *Day 3 - 15th* whenever someone opens it. If the sports committee edits a slot or writes the teams into a semi-final cell (e.g. `B VS K`), everyone sees it on the next page load.

For this to keep working:
- The sheet must stay **Anyone with the link → Viewer**.
- Keep the layout: row 1 holds the times, column A the sports, and each cell is `X VS Y` using the team letters (B V T I N M K) or a stage name (SEMIS 1, FINALS, …).
- If the sheet can't be read, the site uses the last copy it saved, then `fixtures.js`. The Sports tab says which one it's showing.

⚠️ That same sheet has the **Sports Committee** and **Captains List** tabs with personal phone numbers, and "anyone with the link" can read them. Move those tabs to a separate private sheet before you share the site.

---

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
- Times from 00:00 to 03:59 count as late night of the same event day, for both buses and fixtures.
- Offline: after one visit, everything except the map tiles and weather works without signal.
- "Your IIM" is stored only on each phone. There's no login and no data is collected.
- Colours are set at the top of `styles.css` (`--accent` is the Inter-IIM gold).
