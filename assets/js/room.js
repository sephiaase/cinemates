/* =====================================================================
   CINEMATES — room.js (INTEGRASI YOUTUBE IFRAME PLAYER & FILE PERSISTENCE)
   ===================================================================== */

let player; // Instansi global Pemutar YouTube
let timeTrackerInterval;

document.addEventListener('DOMContentLoaded', async() => {
    // 1. LOGIKA TAB (DIPINDAHKAN KE ATAS AGAR SELALU RESPONSIF)
    const tabs = document.querySelectorAll('.side-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-side');
            document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.side-view').forEach(v => v.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('side-' + target).classList.add('active');
        });
    });

    // 2. INISIALISASI DATA
    updateProfileUI();

    const userData = JSON.parse(localStorage.getItem('currentUser'));
    const roomId = localStorage.getItem('activeRoomId');

    // 3. JOIN ROOM VIA API (Tanpa hardcoded username)
    try {
        await fetch('/api/rooms/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: roomId,
                username: userData.username
            })
        });

        loadParticipants();
        setInterval(loadParticipants, 3000);
    } catch (err) {
        console.error("Gagal join:", err);
    }

    // 4. LOGIKA INTEGRASI CHAT & FILE DATABASE
    const chatForm = document.getElementById('chat-input-row');
    const chatInput = document.getElementById('chat-input');
    const chatLog = document.getElementById('chat-log');
    const fileListContainer = document.getElementById('file-list-container');

    // BUG FIX (Room/Co-watching): getRoomDetails() sebelumnya dipanggil dua kali
    // (sekali tanpa roomId, sekali dengan) dan loadChatHistory/loadFileHistory
    // memang sudah didefinisikan di bawah tapi TIDAK PERNAH dipanggil sama sekali,
    // jadi riwayat chat & file yang sudah ada di room tidak pernah muncul saat
    // user join/refresh. Sekarang dipanggil sekali dengan roomId yang benar.
    if (roomId) {
        getRoomDetails(roomId);
        if (chatLog) loadChatHistory(roomId, chatLog);
        if (fileListContainer) loadFileHistory(roomId, fileListContainer);
    }

    if (chatForm && chatInput && chatLog && roomId) {
        chatForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            const senderName = userData ? userData.username : 'Guest';
            try {
                const response = await fetch(`/api/rooms/${roomId}/chats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender: senderName, message: text })
                });

                if (response.ok) {
                    appendChat(senderName, text, chatLog, false);
                    chatInput.value = '';
                }
            } catch (err) {
                console.error("Error kirim chat:", err);
            }
        });
    }

    // 5. LOGIKA UPLOAD FILE
    const btnPilihFile = document.getElementById('btn-pilih-file');
    const inputFileTcp = document.getElementById('input-file-tcp');
    if (btnPilihFile && inputFileTcp) {
        btnPilihFile.addEventListener('click', (e) => {
            e.preventDefault();
            inputFileTcp.click();
        });
        inputFileTcp.addEventListener('change', (e) => { if (e.target.files[0]) handleFileUploadTcp(e.target.files[0], fileListContainer); });
    }
});

/* ==========================================
   LOGIKA FUNGSI PENDUKUNG
   ========================================== */
function extractYouTubeId(url) {
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|live\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

// Fungsi untuk menambahkan pesan baru ke chat-log tanpa refresh
function appendNewMessage(sender, message) {
    const chatLog = document.getElementById('chat-log');
    const newMessage = document.createElement('div');

    // Memberi kelas untuk styling pesan
    newMessage.classList.add('chat-message');
    newMessage.innerHTML = `<strong>${sender}:</strong> ${message}`;

    // Tambahkan pesan ke log
    chatLog.appendChild(newMessage);

    // Auto-scroll ke bawah saat pesan baru muncul
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Mengambil chat baru setiap 2 detik
setInterval(function() {
    fetch('/api/get-messages') // Ganti dengan endpoint API Anda
        .then(response => response.json())
        .then(data => {
            const chatLog = document.getElementById('chat-log');
            chatLog.innerHTML = ''; // Bersihkan log lama

            // Render ulang pesan baru
            data.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message';
                messageDiv.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
                chatLog.appendChild(messageDiv);
            });

            // Auto scroll ke paling bawah
            chatLog.scrollTop = chatLog.scrollHeight;
        })
        .catch(err => console.error('Gagal memuat chat:', err));
}, 2000);

function initYouTubePlayer(videoId) {
    window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player('yt-player', { videoId: videoId, playerVars: { 'controls': 0, 'rel': 0, 'disablekb': 1 }, events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange } });
    };
    if (typeof YT !== 'undefined' && YT.loaded) window.onYouTubeIframeAPIReady();
}

function onPlayerReady(event) {
    document.getElementById('custom-placeholder').style.display = 'none';
    document.getElementById('yt-player').style.display = 'block';
    startTimeTracker();
}

function onPlayerStateChange(event) {
    const btnPlay = document.getElementById('btn-play-pause');
    btnPlay.innerText = (event.data === YT.PlayerState.PLAYING) ? '⏸' : '▶';
}

window.controlYT = function(action) {
    if (!player || typeof player.getPlayerState !== 'function') return;

    const meBadge = document.querySelector('.participant .badge');
    const isHost = meBadge && meBadge.innerText === 'Kamu' && document.querySelector('.r').innerText === 'Host';
    if (action === 'toggle')(player.getPlayerState() === YT.PlayerState.PLAYING) ? player.pauseVideo() : player.playVideo();
    else if (action === 'rewind') player.seekTo(Math.max(0, player.getCurrentTime() - 10), true);
    else if (action === 'forward') player.seekTo(player.getCurrentTime() + 10, true);
    else if (action === 'mute') {
        const btnMute = document.getElementById('btn-mute');
        if (player.isMuted()) {
            player.unMute();
            btnMute.innerText = '🔊';
        } else {
            player.mute();
            btnMute.innerText = '🔇';
        }
    }

    if (isHost) {
        sendSync(action, player.getCurrentTime(), player.getPlayerState());
    }
};

function startTimeTracker() {
    if (timeTrackerInterval) clearInterval(timeTrackerInterval);
    timeTrackerInterval = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function') return;
        const current = player.getCurrentTime(),
            total = player.getDuration();
        if (total > 0) {
            document.getElementById('custom-progress').style.width = `${(current / total) * 100}%`;
            document.getElementById('time-display').innerText = `${formatTime(current)} / ${formatTime(total)}`;
        }
    }, 1000);
}

function formatTime(timeSec) {
    return [Math.floor(timeSec / 3600), Math.floor((timeSec % 3600) / 60), Math.floor(timeSec % 60)]
        .map(v => v.toString().padStart(2, '0')).join(':');
}

function handleFileUploadTcp(file, fileListContainer) {
    const fileId = 'file-' + Date.now();
    fileListContainer.insertAdjacentHTML('afterbegin', `<div class="file-item" id="${fileId}"><div class="ficon">${file.name.split('.').pop().toUpperCase()}</div><div class="fmeta"><div class="fname">${file.name}</div><div class="fsub status-text">Mengunggah...</div></div></div>`);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-tcp', true);
    xhr.setRequestHeader('x-file-name', file.name);
    xhr.setRequestHeader('x-room-id', localStorage.getItem('activeRoomId'));
    xhr.onload = () => {
        if (xhr.status === 200) {
            const t = document.getElementById(fileId);
            t.style.cursor = 'pointer';
            t.querySelector('.status-text').innerText = 'Terkirim';
            t.onclick = () => window.open(`/uploads/${file.name}`, '_blank');
        }
    };
    xhr.send(file);
}

async function getRoomDetails(roomId) {
    try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const room = await res.json();

        const titleEl = document.getElementById('room-title-text');
        if (titleEl) titleEl.textContent = room.room_name;

        if (room.video_url) {
            const videoId = extractYouTubeId(room.video_url);
            if (videoId) {
                initYouTubePlayer(videoId);
            }
        }

        // BUG FIX (Riwayat Nonton): dicatat di sini karena inilah satu-satunya
        // tempat yang punya `room.id` dan `username` yang benar-benar valid.
        recordHistory(room);

        loadParticipants();
    } catch (err) {
        console.error("Gagal memuat detail room:", err);
    }
}

async function loadFileHistory(roomId, container) {
    try {
        const res = await fetch(`/api/rooms/${roomId}/files`);
        const files = await res.json();
        container.innerHTML = files.map(f => `<div class="file-item" style="cursor:pointer" onclick="window.open('${f.file_url || '/uploads/'+f.file_name}', '_blank')"><div class="ficon">${f.file_name.split('.').pop().toUpperCase()}</div><div class="fmeta"><div class="fname">${f.file_name}</div><div class="fsub">Terkirim</div></div></div>`).join('');
    } catch (e) { console.error(e); }
}

async function loadChatHistory(roomId, container) {
    try {
        const res = await fetch(`/api/rooms/${roomId}/chats`);
        const chats = await res.json();
        container.innerHTML = '';
        chats.forEach(c => appendChat(c.sender, c.message, container, false));
    } catch (e) { console.error(e); }
}

async function loadParticipants() {
    const roomId = localStorage.getItem('activeRoomId');
    const container = document.getElementById('participants-list');

    // Pastikan container ditemukan sebelum mencoba mengisi innerHTML
    if (!container) {
        console.error("Container 'participants-list' tidak ditemukan di HTML!");
        return;
    }

    const userData = JSON.parse(localStorage.getItem('currentUser'));
    const btnEnd = document.getElementById('btn-end-session');

    try {
        const res = await fetch(`/api/rooms/${roomId}/participants`);
        const p = await res.json();

        // Render daftar peserta
        container.innerHTML = p.map(u => `
            <div class="participant">
                <div class="avatar">${u.username.substring(0,2).toUpperCase()}</div>
                <div class="info">
                    <div class="n">${u.username}</div>
                    <div class="r">${u.is_host ? 'Host' : 'Peserta'}</div>
                </div>
                ${u.username === userData.username ? '<span class="badge">Kamu</span>' : ''}
            </div>
        `).join('');

        // Logika Tombol Akhiri (hanya muncul untuk host)
        const me = p.find(x => x.username === userData.username);
        if (me && me.is_host === 1 && btnEnd) {
            btnEnd.style.display = 'block';
        }
    } catch (e) {
        console.error("Error memuat peserta:", e);
    }
}

function appendChat(sender, message, container, isHost) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = `<div class="who">${sender} ${isHost ? '<span class="badge-host-role">HOST</span>' : ''}</div><div class="txt ${sender === JSON.parse(localStorage.getItem('currentUser')).username ? 'chat-me' : 'chat-others'}"></div>`;
    msg.querySelector('.txt').textContent = message;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

window.endRoomSession = async function() {
    const roomId = localStorage.getItem('activeRoomId');
    if (!confirm("Sudahi sesi nonton?")) return;
    await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
    localStorage.removeItem('activeRoomId');
    window.location.href = 'dashboard.html';
};

function updateProfileUI() {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (document.getElementById('display-username')) document.getElementById('display-username').textContent = u ? u.username : 'Guest';
    if (document.getElementById('user-avatar')) document.getElementById('user-avatar').textContent = u ? u.username.substring(0, 2).toUpperCase() : 'G';
}

window.addEventListener('beforeunload', () => {
    const roomId = localStorage.getItem('activeRoomId');
    const userData = JSON.parse(localStorage.getItem('currentUser'));

    if (roomId && userData) {
        // fetch dengan keepalive: true akan tetap mengirim data meski tab ditutup
        fetch('/api/rooms/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, username: userData.username }),
            keepalive: true
        });
    }
});

// BUG FIX (Riwayat Nonton): status sebelumnya dikirim sebagai 'joined', padahal
// kolom `watch_history.status` hanya berupa ENUM('done','partial') di database
// (lihat cinemates.sql) — nilai 'joined' akan ditolak/di-nol-kan oleh MySQL.
async function recordHistory(roomData) {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData || !roomData) return;

    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: userData.username,
                room_id: roomData.id, // Dinamis dari DB
                video_title: roomData.room_name, // Bisa diganti judul video jika ada
                room_name: roomData.room_name, // Dinamis dari DB
                genre: roomData.genre, // Mengambil dari database room
                status: 'partial'
            })
        });
        console.log("Riwayat dinamis tercatat untuk:", roomData.room_name);
    } catch (err) {
        console.error("Gagal mencatat riwayat:", err);
    }
}

// A. Fungsi untuk Host mengirim status ke server
function sendSync(action, time, state) {
    const roomId = localStorage.getItem('activeRoomId');
    console.log("Host mengirim sync:", { action, time, state }); // Debugging
    fetch(`/api/rooms/${roomId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, time, state })
    });
}

// B. Fungsi Peserta mengecek sync setiap 1 detik
setInterval(async() => {
    const roomId = localStorage.getItem('activeRoomId');
    const userData = JSON.parse(localStorage.getItem('currentUser'));

    if (!roomId || !userData) return;

    try { // <--- TRY DIBUKA DI SINI
        const resParticipants = await fetch(`/api/rooms/${roomId}/participants`);
        const pList = await resParticipants.json();

        // Cari apakah user saat ini adalah host
        const hostData = pList.find(p => p.is_host === 1);
        const isHost = (hostData && hostData.username === userData.username);

        if (!isHost && player && typeof player.getPlayerState === 'function') {
            const resSync = await fetch(`/api/rooms/${roomId}/sync`);
            const data = await resSync.json();

            if (data && data.video_state) {
                if (Math.abs(player.getCurrentTime() - data.video_time) > 2) {
                    player.seekTo(data.video_time, true);
                }

                const currentState = player.getPlayerState();

                if (parseInt(data.video_state) === 1 && currentState !== 1) {
                    player.playVideo();
                    console.log("Peserta: Mengikuti perintah Play");
                } else if (parseInt(data.video_state) === 2 && currentState !== 2) {
                    player.pauseVideo();
                    console.log("Peserta: Mengikuti perintah Pause");
                }
            }
        }
    } catch (e) {
        // Log error di sini jika perlu untuk debugging
        console.log("Error sync:", e);
    }
}, 1000);