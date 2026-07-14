/* =====================================================================
   CINEMATES — dashboard.js (PERBAIKAN DASYBOARD & ROUTE PROTECTION)
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data user dari localStorage yang disimpan saat Login
    const userDataStr = localStorage.getItem('currentUser');

    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            const nameElement = document.getElementById('user-name');
            const avatarElement = document.getElementById('user-avatar');

            if (nameElement) nameElement.textContent = userData.username;
            if (avatarElement) avatarElement.textContent = userData.username.substring(0, 2).toUpperCase();
        } catch (err) {
            console.error("Gagal membaca data user:", err);
        }
    } else {
        // Jika tidak ada data login, baru tampilkan "Guest"
        const nameElement = document.getElementById('user-name');
        if (nameElement) nameElement.textContent = "Guest";
    }

    // Bersihkan sesi dan lanjutkan fungsi lainnya
    localStorage.removeItem('activeRoomId');
    fetchUserRooms();

    /* ---------- modal open / close ---------- */
    const overlays = document.querySelectorAll('.modal-overlay');

    function openModal(id) {
        const overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        const firstField = overlay.querySelector('input, select, button[data-close-modal]');
        if (firstField) firstField.focus({ preventScroll: true });
    }

    function closeModal(overlay) {
        overlay.classList.remove('open');
        const anyOpen = document.querySelector('.modal-overlay.open');
        if (!anyOpen) document.body.style.overflow = '';
    }

    function closeAllModals() {
        overlays.forEach(closeModal);
    }

    document.querySelectorAll('[data-open-modal]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-open-modal');
            openModal(modalId);
            if (modalId === 'modal-browse-rooms') {
                fetchPublicRooms();
            }
        });
    });

    document.querySelectorAll('[data-close-modal]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const overlay = trigger.closest('.modal-overlay');
            if (overlay) closeModal(overlay);
        });
    });

    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    /* ---------- Buat Room Baru: toggle kode room ---------- */
    const privacyRadios = document.querySelectorAll('input[name="privacy"]');
    const codeWrap = document.getElementById('cr-code-wrap');

    function syncPrivacyUI() {
        const selected = document.querySelector('input[name="privacy"]:checked');
        document.querySelectorAll('.privacy-row .radio-card').forEach(card => {
            card.classList.toggle('selected', card.querySelector('input').checked);
        });
        if (codeWrap) {
            codeWrap.classList.toggle('show', selected && selected.value === 'private');
        }
    }

    privacyRadios.forEach(radio => {
        radio.addEventListener('change', syncPrivacyUI);
    });
    syncPrivacyUI();

    /* ---------- Buat Room Baru: submit (TERHUBUNG KE MYSQL) ---------- */
    const createForm = document.getElementById('form-create-room');
    if (createForm) {
        createForm.addEventListener('submit', async(e) => {
            e.preventDefault();

            // Mengambil data user yang sedang login dari localStorage
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            const username = userData ? userData.username : 'Guest';

            const roomData = {
                name: document.getElementById('cr-name').value.trim(),
                link: document.getElementById('cr-video').value.trim(),
                max_participants: parseInt(document.getElementById('cr-max').value),
                category: document.getElementById('cr-genre').value,
                privacy: document.querySelector('input[name="privacy"]:checked').value,
                username: username
            };

            try {
                const response = await fetch('/api/rooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(roomData)
                });

                const result = await response.json();

                if (response.ok) {
                    closeModal(document.getElementById('modal-create-room'));
                    createForm.reset();
                    syncPrivacyUI();

                    // Set authorization masuk ke room yang baru dibuat
                    localStorage.setItem('activeRoomId', result.roomId);
                    showToast(`Room "${roomData.name}" berhasil dibuat! Mengalihkan...`);

                    setTimeout(() => window.location.href = 'room.html', 1200);
                } else {
                    alert('❌ Gagal menyimpan: ' + (result.error || 'Terjadi kesalahan sistem.'));
                }
            } catch (err) {
                console.error('Koneksi bermasalah:', err);
                alert('❌ Gagal terhubung ke server Node.js.');
            }
        });
    }

    /* ---------- Fungsi Masuk/Join ke Room (Otorisasi) ---------- */
    // BUG FIX (Riwayat Nonton): fungsi ini sebelumnya mengirim POST /api/history
    // TANPA field `username` dan `room_id`. Karena server.js memakai fallback
    // `username || 'sephiaase'` dan `room_id || 0`, SEMUA riwayat nonton siapa pun
    // tercatat sebagai milik user 'sephiaase' dengan room_id 0 (lihat data sampel
    // di cinemates.sql). Pencatatan riwayat sekarang dipindahkan sepenuhnya ke
    // room.js -> recordHistory(), yang dijalankan setelah detail room (termasuk id
    // room asli) berhasil diambil dari server, sehingga datanya akurat per user.
    window.joinRoom = function(roomId, roomName, genre) {
        localStorage.setItem('activeRoomId', roomId);
        window.location.href = 'room.html';
    };

    /* ---------- Real-Time Client Side Search untuk Pop-Up Jelajah ---------- */
    const searchInput = document.getElementById('browse-search');
    const genreSelect = document.getElementById('browse-genre');
    const emptyState = document.getElementById('browse-empty');

    window.filterBrowseList = function() {
        const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
        const genre = genreSelect ? genreSelect.value : 'all';
        const browseItems = document.querySelectorAll('#browse-list .browse-item');
        let visibleCount = 0;

        browseItems.forEach(item => {
            const matchesGenre = genre === 'all' || item.getAttribute('data-genre') === genre;
            const matchesQuery = !query || item.getAttribute('data-name').includes(query);
            const visible = matchesGenre && matchesQuery;
            item.style.display = visible ? '' : 'none';
            if (visible) visibleCount++;
        });

        if (emptyState) emptyState.classList.toggle('show', visibleCount === 0);
    }

    if (searchInput) searchInput.addEventListener('input', window.filterBrowseList);
    if (genreSelect) genreSelect.addEventListener('change', window.filterBrowseList);

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.zIndex = '200';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity .3s ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2600);
    }
});

/* ---------- Ambil Room Milik User untuk Grid Utama ---------- */
async function fetchUserRooms() {
    const grid = document.querySelector('.room-grid');
    if (!grid) return;

    // Ambil tombol buat room bawaan untuk ditaruh di akhir grid nanti
    const createCardHTML = `
        <button class="card create-card" data-open-modal="modal-create-room">
            <div class="plus">+</div>
            Buat room baru
        </button>
    `;

    try {
        // Tarik rute kamar publik sebagai simulasi kamar aktif beranda
        const response = await fetch('/api/rooms/public');
        const rooms = await response.json();

        if (!response.ok) throw new Error(rooms.error);

        // Update teks info jumlah room aktif secara dinamis
        const headDesc = document.querySelector('.dash-head p');
        if (headDesc) headDesc.textContent = `${rooms.length} room aktif tersedia di database`;

        if (rooms.length === 0) {
            grid.innerHTML = createCardHTML;
            // Daftarkan ulang event modal click untuk tombol baru
            document.querySelector('.create-card').addEventListener('click', () => {
                const overlay = document.getElementById('modal-create-room');
                if (overlay) {
                    overlay.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }
            });
            return;
        }

        const roomsHTML = rooms.map(room => {
                    let thumbClass = '';
                    if (room.genre === 'anime') thumbClass = 'thumb-yellow';
                    else if (room.genre === 'studi') thumbClass = 'thumb-magenta';

                    const isFull = room.current_participants >= room.max_participants && room.max_participants !== 0;

                    return `
                <div class="card room-card">
                    <div class="room-thumb ${thumbClass}">
                        <div class="badges">
                            <span class="badge ${isFull ? 'badge-full' : 'badge-live'}">${isFull ? 'Penuh' : '● Live'}</span>
                        </div>
                        <div class="count">${room.current_participants}/${room.max_participants === 0 ? '∞' : room.max_participants}</div>
                    </div>
                    <div class="room-body">
                        <h3>${room.room_name}</h3>
                        <div class="meta">Host: ${room.host_name} · Kategori: <span style="text-transform:capitalize">${room.genre}</span></div>
                        ${isFull 
                            ? `<button class="btn btn-secondary btn-sm" disabled style="opacity:.5; width:100%;">Room Penuh</button>`
                            : `<button onclick="joinRoom(${room.id}, '${room.room_name}', '${room.genre}')" class="btn btn-primary btn-sm" style="width:100%;">Gabung Room</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = roomsHTML + createCardHTML;

        // Re-bind click event untuk tombol modal baru yang dibuat dinamis
        document.querySelectorAll('[data-open-modal]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.getAttribute('data-open-modal');
                const overlay = document.getElementById(modalId);
                if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
                if (modalId === 'modal-browse-rooms') fetchPublicRooms();
            });
        });

    } catch (err) {
        console.error('Gagal memuat room beranda:', err);
    }
}

/* ---------- Ambil Room Publik untuk Pop-up Jelajah ---------- */
async function fetchPublicRooms() {
    const browseList = document.getElementById('browse-list');
    if (!browseList) return;

    browseList.innerHTML = '<div style="text-align:center; padding:20px; font-weight:700;">Memuat data dari MySQL...</div>';

    try {
        const response = await fetch('/api/rooms/public');
        const rooms = await response.json();

        if (!response.ok) throw new Error(rooms.error);

        if (rooms.length === 0) {
            browseList.innerHTML = '<div class="browse-empty show">Tidak ada room publik yang aktif saat ini.</div>';
            return;
        }

        browseList.innerHTML = rooms.map(room => {
            let emoji = '🎬';
            let thumbClass = '';
            if (room.genre === 'anime') { emoji = '🎞'; thumbClass = 'thumb-yellow'; }
            else if (room.genre === 'studi') { emoji = '📁'; thumbClass = 'thumb-magenta'; }
            else if (room.genre === 'series') { emoji = '📺'; }

            const isFull = room.current_participants >= room.max_participants && room.max_participants !== 0;

            return `
                <div class="browse-item" data-genre="${room.genre}" data-name="${room.room_name.toLowerCase()} ${room.host_name.toLowerCase()}">
                    <div class="browse-thumb ${thumbClass}">${emoji}</div>
                    <div class="browse-body">
                        <h4>${room.room_name}</h4>
                        <div class="browse-meta">
                            <span class="badge ${isFull ? 'badge-full' : 'badge-live'}">${isFull ? 'Penuh' : '● Live'}</span>
                            <span>Host: <strong>${room.host_name}</strong></span>
                            <span>${room.current_participants}/${room.max_participants === 0 ? '∞' : room.max_participants} peserta</span>
                        </div>
                    </div>
                    ${isFull
                        ? `<button class="btn btn-secondary btn-sm" disabled style="opacity:.5;">Penuh</button>`
                        : `<button onclick="joinRoom(${room.id}, '${room.room_name}', '${room.genre}')" class="btn btn-primary btn-sm">Gabung</button>`
                    }
                </div>
            `;
        }).join('');

        if (typeof window.filterBrowseList === 'function') window.filterBrowseList();

    } catch (err) {
        browseList.innerHTML = `<div style="color:var(--magenta); text-align:center; padding:20px; font-weight:700;">❌ Error database: ${err.message}</div>`;
    }
}