# Cinemates — Bug Fix Changelog

Date: July 14, 2026
Scope: Dashboard, Watch History (Riwayat Nonton), Room (Co-watching)

## Read this first

I went through the actual codebase (`server.js`, `assets/js/*.js`, the HTML
pages, and `cinemates.sql`) before touching anything, and it turned out this
project is a lot further along than `cinemates_bug_fix_report.txt` assumes.
The report reads like a generic checklist for a bare-bones starter app —
it references things that don't exist here at all (JWT `authenticateToken`,
Socket.IO, a `watch_history` table keyed on `user_id`) and misses things that
are broken in the real code. So instead of applying the report's snippets
as-is (which would have broken the app — e.g. it assumes a `users(id)`
foreign key style history table that conflicts with the one you already
have), I fixed the **actual** bugs behind each symptom the report describes,
plus a few more I found in the same three features.

Every item below says whether it matches the report's diagnosis or not.

---

## 1. Watch History (Riwayat Nonton)

**Report said:** `riwayat.js` has no real fetch logic and there's no backend
endpoint at all.
**Reality:** Both already existed and worked (`GET /api/riwayat`, and
`riwayat.js` already renders the list dynamically). No fix needed there.

**Real bug found — history was being logged to the wrong user:**
- `dashboard.js`'s `joinRoom()` posted to `/api/history` with only
  `room_name` and `genre` — no `username`, no `room_id`.
- `server.js` silently falls back to `username || 'sephiaase'` and
  `room_id || 0` when those are missing.
- Net effect: **every** user's watch history was being written under the
  hardcoded fallback account `sephiaase` / room `0`, no matter who was
  actually logged in. You can see this in the sample data — `watch_history`
  row `id=18` is exactly this fallback row.
- **Fix:** Removed the incomplete call from `dashboard.js`. History is now
  recorded from `room.js` → `recordHistory()`, right after the room's real
  `id` and the logged-in `username` are both known, so it's attributed
  correctly. (`assets/js/dashboard.js`, `assets/js/room.js`)

**Second bug in the same function:** the duplicate `recordHistory()`
definition near the bottom of `room.js` (there were two, JS just used the
last one) sent `status: 'joined'`, but `watch_history.status` is
`ENUM('done','partial')` in the schema — an invalid enum value MySQL would
reject or null out. Changed to `'partial'`. (`assets/js/room.js`)

---

## 2. Room (Co-watching)

**Report said:** `room.js` never binds `play`/`pause` listeners to sync
state over WebSockets, and recommends adding Socket.IO plus STUN servers for
WebRTC. **Reality:** this app doesn't use WebSockets or WebRTC — it
syncs the YouTube player state through the room's row in MySQL
(`video_action` / `video_time` / `video_state`) and polls it. Adding
Socket.IO/WebRTC would be a different architecture, not a fix, and
`package.json` doesn't even have those packages installed.

**Real bug found — sync was completely non-functional:**
- `POST /api/rooms/:roomId/sync` (used by the host) tries to `UPDATE rooms
  SET video_action = ?, video_time = ?, video_state = ?`, but the `rooms`
  table **never had those columns** — every host sync write was failing
  silently.
- `room.js` polls `GET /api/rooms/:roomId/sync` every second (for
  participants), but that route **didn't exist** — only the POST version
  did. The comment in `server.js` even says `// Route untuk Peserta
  mengambil sync (GET)` directly above a *different* route
  (`/api/rooms/:id/host`), so the intended GET route was apparently never
  actually written.
- Combined, participants never received the host's play/pause/seek state.
- **Fix:**
  - Added `video_action`, `video_time`, `video_state` columns to the
    `rooms` table (`cinemates.sql`). If you're applying this to an existing
    database instead of re-importing the dump, run:
    ```sql
    ALTER TABLE rooms
      ADD COLUMN video_action VARCHAR(20) DEFAULT NULL,
      ADD COLUMN video_time FLOAT DEFAULT 0,
      ADD COLUMN video_state INT DEFAULT NULL;
    ```
  - Added the missing `GET /api/rooms/:roomId/sync` endpoint in
    `server.js` so participants can actually read the host's state.

**Second bug — chat & files never reloaded on join:** `loadChatHistory()`
and `loadFileHistory()` were fully written in `room.js` but never called
anywhere, so re-entering a room always showed an empty chat/file list even
if messages/files already existed. Now called once the room id is
available. (`assets/js/room.js`)

**Cleanup (no behavior change):** removed a duplicate `getRoomDetails()`
call that ran once with no room id (wasted request), and an unused
`fetchParticipants()` function that targeted a `#participant-list` element
that doesn't exist in `room.html` (the real one is `loadParticipants()` /
`#participants-list`).

---

## 3. Dashboard

**Report said:** `dashboard.js` does a naive `localStorage.getItem('token')`
check that lets a fake string through, and recommends a JWT
`/api/verify-session` call. **Reality:** this app doesn't issue tokens at
all — login stores a `currentUser` JSON object, and it turns out
**`dashboard.js` had no redirect logic whatsoever**. Visiting
`dashboard.html`, `room.html`, `riwayat-nonton.html`, or
`pengaturan.html` directly with an empty localStorage just rendered the
page (dashboard showed "Guest" but never sent you to `login.html`); `room.js`
would then throw trying to read `userData.username` on `null`.

**Fix:** Added `assets/js/auth-guard.js`, loaded first in `<head>` on all
four protected pages:
1. If `currentUser` isn't in `localStorage`, redirect to `login.html`
   immediately — this is the part actually missing before.
2. In the background, it calls a new `GET /api/verify-session` endpoint
   (added to `server.js`) that checks the username still exists and is
   verified in the `users` table, and clears the session if not (covers a
   hand-edited/fabricated `currentUser` value or a deleted account).

Also guarded `assets/js/auth.js`'s `loginForm` listener with a null check —
it's included on `register.html`, which has no `#loginForm`, so it was
throwing a `TypeError` on every page load (silently, after the register/OTP
listeners had already been attached, so it wasn't breaking registration,
but it was leaving an error in the console and skipping nothing after it
only by luck of ordering).

**Bug 3.2 (CORS):** the app currently serves the frontend and API from the
same Express server on the same origin, so this wasn't actually causing
failures yet. `cors` isn't in `package.json`/`node_modules`, so I didn't
add a dependency that isn't installed. Instead I added a small manual CORS
middleware in `server.js` (reads an `ALLOWED_ORIGINS`/`CORS_ORIGINS` list,
defaults to `http://localhost:3000`) so the API is ready if the frontend
is ever split onto a different origin/port later.

---

## Files touched

- `server.js` — CORS middleware, `GET /api/verify-session`,
  `GET /api/rooms/:roomId/sync`
- `assets/js/auth-guard.js` — **new file**, session guard for protected pages
- `assets/js/auth.js` — null-guard on `loginForm`
- `assets/js/dashboard.js` — removed the history call that mis-attributed
  watch history
- `assets/js/room.js` — real chat/file history loading, correct
  `recordHistory()` wiring, valid `status` enum value, removed dead code
- `dashboard.html`, `room.html`, `riwayat-nonton.html`, `pengaturan.html` —
  include `auth-guard.js`
- `cinemates.sql` — added `video_action`/`video_time`/`video_state` to
  `rooms`

## Not changed

`riwayat.js`, `assets/css/*`, `index.html`, `login.html`, `register.html`,
`old-dashboard.html`, `package.json` — no bugs found in these relative to
the three reported feature areas, and I didn't want to introduce new
dependencies (JWT/Socket.IO/CORS package) the rest of the app doesn't use.
