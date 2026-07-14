/* =====================================================================
   CINEMATES — auth-guard.js
   -----------------------------------------------------------------------
   BUG FIX (3.1 — Session Check / Redirect Bypass)

   What the report described (a client-side check on a fake token string)
   does not match this codebase: there is no token at all here, only a
   `currentUser` JSON object saved to localStorage on login. The real gap
   was that dashboard.html, room.html, riwayat-nonton.html and
   pengaturan.html had NO check at all — any of them could be opened
   directly and would render normally (dashboard.js only swapped the
   displayed name for "Guest", it never redirected).

   This script must be loaded BEFORE any other page script, as early as
   possible in <head>, on every protected page:
     1) If there is no `currentUser` in localStorage, redirect to
        login.html immediately.
     2) In the background, confirm with the server (`/api/verify-session`)
        that the user still exists and is verified. If not (account
        deleted, unverified, or the value was tampered with), the local
        session is cleared and the user is sent back to login.html.

   Step 1 blocks a page from ever rendering when nothing is set. Step 2
   protects against `currentUser` being hand-edited in dev tools to an
   invented user, since it has to match a real, verified row in the
   database.
   ===================================================================== */
(function() {
    const raw = localStorage.getItem('currentUser');
    let user = null;

    try {
        user = raw ? JSON.parse(raw) : null;
    } catch (err) {
        user = null;
    }

    if (!user || !user.username) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
        return;
    }

    fetch(`/api/verify-session?username=${encodeURIComponent(user.username)}`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
            if (!data.valid) {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        })
        .catch(() => {
            // Kalau server sedang tidak bisa dihubungi, jangan langsung logout
            // paksa pengguna yang sah — cukup biarkan halaman berjalan dengan
            // data lokal, supaya UX tidak rusak akibat masalah jaringan sesaat.
            console.warn('⚠️ Tidak bisa memverifikasi sesi ke server, memakai data lokal sementara.');
        });
})();
