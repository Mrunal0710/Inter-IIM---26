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
api/                             Vercel functions: live + admin (committee platform), mymap (Google map) and weather. Each is cached so 1000+ users never overload Google or the weather service
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


## Committee platform (live status, delays, results, MVP, standings, team lists)

Committee members open **`https://inter-iim26.vercel.app/admin`** on their phones and **tap their name**. There are no codes.

**Login:**
- **Members** (Akash, Akshat, Amruth, Ayushi, Prajwal, Rahul, Sushant, Yash, Ajay, Anagha, Dvitika, Hrithik, Laveena, Melvin, Shashi, Shubham, Thrupthi): tap your name and wait about 10 seconds while Mrunal approves the phone. After that you stay logged in on that phone.
- **Mrunal (owner):** tap your name and enter `OWNER_PASSWORD`. You only need to do this once per phone. A 🔔 and a red badge on **Control** appear when someone asks for access.

**What each member can do:**
- **Matches:** tap ▶ Start, ⏱ Delay (+5/+10/+15… min) or ✓ Finish. On a finished match, enter the score, winner and MVP, plus an optional note. Each match has its own "show publicly" switches for status, result and MVP.
- **Standings:** a points table per event plus an "Overall" table, each with a "Show publicly" switch.
- **Teams (private):** player name, jersey number, phone and role. These are **never** shown on the public site or sent to visitors' phones.
- **Log:** the latest 60 changes, with who made each one.

**What only Mrunal can do (Control tab):**
- **Undo / Redo** the latest change by anyone, or undo any single line in **History**. History keeps the last 1,000 changes with their before/after values. Undoing an undo is a redo. If someone changed the same item again afterwards, you get a warning before anything is overwritten.
- **Access requests:** Approve, Approve all or Deny. **Logged-in phones:** log any phone out.
- **Committee members:** add or remove names. Removing a name logs that person out everywhere.
- **Home-page announcements:** edit, mark as ⚠️ alert, publish (live on phones within about a minute), or go back to the defaults in `data.js`.
- **Public switches:** hide all results, MVPs or standings from the public site, for example if Sportagon should be the only scoreboard.

### One-time setup (about 5 minutes, do it BEFORE uploading the new files)
1. **Database:** in Vercel → your project → **Storage** → **Create Database** → **Upstash for Redis** (free plan) → **Connect** it to this project (all environments). Vercel adds the connection settings automatically.
2. **Your password:** in Vercel → **Settings → Environment Variables**, add **`OWNER_PASSWORD`** with a strong password only you know → Save. (If you added `COMMITTEE_CODES` earlier, delete it. It is no longer used.)
3. **Optional:** to let members in by name alone, with no approval step, add `COMMITTEE_APPROVAL` = `off`. Anyone who opens /admin could then act as any member, so leave approval on unless you have to turn it off.
4. **Deploy:** upload the new files to GitHub (or click Redeploy in Vercel). Settings only take effect on a new deployment.
5. **Test:** log in as Mrunal on your phone. Ask one member to tap their name, approve them in Control, have them mark a match LIVE, and check that the public Fixtures tab shows it within 30 seconds. Then press ↶ Undo.

**Security notes:**
- Every change is saved under the member's name. Nothing is ever lost, because Undo restores it.
- After 8 wrong owner passwords, that network is locked out for 15 minutes.
- Never put `OWNER_PASSWORD` in any file or on GitHub. It belongs only in Vercel's settings.

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
