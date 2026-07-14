document.addEventListener('DOMContentLoaded', () => {
    loadWatchHistory();

    async function loadWatchHistory() {
        const historyContainer = document.getElementById('history-list');
        if (!historyContainer) return;

        try {
            // Ambil data user
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            const username = userData ? userData.username : 'sephiaase';

            // Panggil endpoint yang benar
            const response = await fetch(`/api/riwayat?username=${username}`);

            // Cek apakah server merespon dengan OK
            if (!response.ok) throw new Error("Gagal terhubung ke server");

            const data = await response.json();

            if (!data || data.length === 0) {
                historyContainer.innerHTML = `
                <div style="text-align:center; padding:40px; border:2px dashed #ccc; border-radius:8px;">
                    <p style="font-weight:700;">Belum ada riwayat nonton</p>
                    <p style="font-size:13px; color:#666;">Room yang kamu kunjungi akan muncul di sini.</p>
                </div>
            `;
                return;
            }

            historyContainer.innerHTML = data.map(item => {
                let emoji = '🎬';
                if (item.genre === 'anime') emoji = '🎞';
                else if (item.genre === 'studi') emoji = '📁';
                else if (item.genre === 'series') emoji = '📺';

                // Format tanggal agar lebih enak dibaca manusia
                const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                const formattedDate = new Date(item.watched_at).toLocaleDateString('id-ID', dateOptions);

                return `
                    <div class="card history-card" style="display:flex; align-items:center; gap:16px; padding:16px; margin-bottom:12px; background:var(--paper); border:var(--stroke-thick) solid var(--black); box-shadow:var(--sh-2);">
                        <div style="font-size:24px; padding:10px; background:var(--yellow); border:var(--stroke-thin) solid var(--black);">${emoji}</div>
                        <div style="flex-grow:1;">
                            <h3 style="margin:0 0 4px; font-size:16px;">${item.video_title}</h3>
                            <div style="font-size:12px; color:#555;">Room: <strong>${item.room_name}</strong> · Kategori: <span style="text-transform:capitalize;">${item.genre}</span></div>
                            <div style="font-size:11px; color:#888; margin-top:4px;">⏱ Ditonton pada: ${formattedDate}</div>
                        </div>
                        <div style="text-align:right;">
                            <span class="badge" style="background:${item.status === 'done' ? 'var(--green)' : 'var(--border)'}; font-size:11px;">
                                ${item.status === 'done' ? 'Tamat' : 'Sebagian'}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Gagal memuat riwayat:', err);
            historyContainer.innerHTML = `<div style="color:red; text-align:center; padding:20px;">❌ Gagal memuat data: ${err.message}</div>`;
        }
    }
});