# Cinemates — Watch Party UI

Prototipe antarmuka (front-end only) untuk **Cinemates**, platform watch party
yang memungkinkan pengguna membuat room virtual untuk menonton video bersama
secara sinkron. Dibangun mengikuti brief proyek "Pembangunan Aplikasi Web
Cinemates dengan Sinkronisasi Berbasis Protokol TCP dan UDP" dan sistem desain
**Neo-Brutalist Design System** (thick black strokes, squared corners, solid
accent blocks, high contrast).

Semua halaman adalah HTML statis, murni untuk kebutuhan desain/UI. Belum ada
backend, database, socket TCP/UDP, atau SMTP yang benar-benar berjalan —
elemen-elemen itu (progress upload, status sinkron, dsb.) hanya representasi
visual dari perilaku yang dijelaskan di brief.

---

## 1. Struktur Folder

```
cinemates/
├── index.html          → redirect otomatis ke login.html
├── login.html           → Halaman login
├── register.html        → Halaman daftar akun + verifikasi OTP email
├── dashboard.html        → Dashboard: daftar room & undangan
├── room.html             → Watch Room: video, peserta, file (TCP), chat
├── assets/
│   ├── css/
│   │   └── style.css     → satu stylesheet berisi seluruh design token & komponen
│   └── js/
│       ├── auth.js       → perilaku halaman login/register (auto-advance OTP)
│       └── room.js       → perilaku halaman room (tab sidebar, kirim chat)
└── README.md
```

Setiap halaman berdiri sendiri (bukan single-page app) dan saling terhubung
lewat elemen navigasi `<a href="...">` di topbar, sesuai flow di brief:
Login → Register/Verifikasi → Dashboard → Watch Room.

## 2. Cara Menjalankan

Karena hanya HTML/CSS/JS statis, tidak perlu build step atau server khusus:

1. Buka folder `cinemates/`.
2. Klik dua kali `index.html` (atau `login.html`) untuk membukanya di browser, **atau**
3. Jalankan server statis sederhana agar path relatif (`assets/...`) selalu
   terbaca dengan benar, misalnya:

   ```bash
   cd cinemates
   python3 -m http.server 8080
   # lalu buka http://localhost:8080
   ```

## 3. Sistem Desain — Neo-Brutalist Design System

Semua token desain didefinisikan sebagai CSS custom properties di bagian atas
`assets/css/style.css` (`:root { ... }`), supaya konsisten di semua halaman
dan mudah diubah di satu tempat.

### Warna
| Token | Hex | Penggunaan |
|---|---|---|
| `--teal` | `#00C2CB` | Warna aksen utama (tombol primary, indikator sync UDP) |
| `--magenta` | `#FF00FF` | Aksen destruktif / live indicator |
| `--yellow` | `#FFD700` | Aksen sekunder (highlight, tab aktif, fokus) |
| `--black` | `#000000` | Teks, border, elemen struktural |
| `--white` | `#FFFFFF` | Latar komponen (card, input, panel) |
| `--paper` | `#F5F1DC` | Latar halaman |

### Tipografi
- **Display / Heading** — `Archivo Black`, huruf besar (uppercase), untuk H1–H4.
- **Body** — `Space Grotesk`, untuk teks, label, dan komponen UI.
- **Mono / Caption teknis** — `JetBrains Mono`, dipakai untuk hal-hal yang
  merepresentasikan data teknis: kode OTP, label protokol (`raw TCP socket ·
  port 5001`, `frame position broadcast via raw UDP socket`), timestamp video.

Skala ukuran mengikuti referensi desain: H1 96px, H2 64px, H3 48px, H4 32px,
Body 18px, Caption 14px (variabel `--h1` … `--caption`).

### Prinsip Visual
- Border tebal hitam 3–4px pada hampir semua komponen (`--stroke`, `--stroke-thick`).
- Sudut kotak / radius minimal — tidak ada rounded card besar.
- Shadow offset keras (bukan blur) untuk elevasi: `4px 4px 0 #000` (level 1)
  dan `8px 8px 0 #000` (level 2), lihat `--sh-1` / `--sh-2`.
- Kontras tinggi antar elemen; fokus keyboard selalu terlihat lewat outline
  kuning (`:focus-visible`).
- Satu aksi utama per bagian layar (tombol primary teal menonjol dari
  outline/secondary di sekitarnya).

## 4. Ringkasan Tiap Halaman

### `login.html`
Form email + kata sandi. Menyertakan contoh state error input (`field.error`)
dengan border merah dan pesan kesalahan, sesuai komponen "ERROR MESSAGE" pada
sistem desain.

### `register.html`
Dua bagian:
1. Form pendaftaran (nama pengguna, email, kata sandi).
2. Form verifikasi kode OTP 6 digit yang "dikirim" ke email pengguna
   (merepresentasikan fitur SMTP di brief). Fokus otomatis pindah ke kotak
   berikutnya saat mengetik — lihat `assets/js/auth.js`.

### `dashboard.html`
Sidebar navigasi (Dashboard, Riwayat Nonton, Room Favorit, Pengaturan, Keluar)
dan grid kartu room dengan status: **Live** (teal/magenta pattern + badge),
**Baru**, dan **Penuh**. Ada state kosong (`empty-state`) untuk daftar
undangan, dan kartu "Buat room baru" bergaya dashed border.

### `room.html`
Halaman inti watch party, terbagi dua kolom:
- **Panel video (kiri)** — area pemutar dengan indikator sinkronisasi
  `UDP SYNC · 34ms` (titik berkedip via CSS animation) yang merepresentasikan
  broadcast posisi video lewat raw UDP socket, plus kontrol pemutaran.
- **Panel samping (kanan)** — tiga tab:
  - **Peserta** — daftar avatar & status sinkronisasi tiap peserta.
  - **File (TCP)** — zona upload dan daftar file dengan progress bar,
    merepresentasikan pengiriman file lewat raw TCP socket (`port 5001`).
  - **Chat** — log pesan; mengetik dan menekan "Kirim" akan menambah pesan
    baru ke log secara langsung di browser (lihat `assets/js/room.js`).

## 5. Menghubungkan ke Backend Sungguhan

UI ini murni lapisan tampilan. Untuk menjadikannya aplikasi Cinemates yang
utuh sesuai brief, langkah selanjutnya secara umum:

1. **Auth & email** — hubungkan form di `login.html`/`register.html` ke
   endpoint backend (mis. Express + `net`/`dgram` untuk socket, atau
   Flask/FastAPI + `socket`), dengan Nodemailer/Flask-Mail untuk OTP.
2. **Dashboard** — ganti data room statis dengan hasil fetch dari API
   (daftar room, jumlah peserta, status live).
3. **Watch Room**:
   - Buka koneksi **WebSocket** dari browser ke backend untuk kontrol
     real-time (play/pause/seek, chat, daftar peserta).
   - Backend meneruskan posisi pemutaran ke peserta lain lewat **raw UDP
     socket** (`dgram` di Node.js / `socket.SOCK_DGRAM` di Python).
   - Upload file di tab "File (TCP)" dikirim lewat WebSocket ke backend,
     lalu backend menyimpannya lewat **raw TCP socket** (`net` di Node.js /
     `socket.SOCK_STREAM` di Python) ke storage server.
4. **Deployment** — arahkan domain kustom lewat Cloudflare DNS, dengan mode
   "DNS Only" (grey cloud) khusus subdomain yang melayani port TCP/UDP agar
   tidak diproksi oleh Cloudflare.

## 6. Kredit Font

Font dimuat dari Google Fonts lewat `<link>` di setiap halaman:
`Archivo Black`, `Space Grotesk`, `JetBrains Mono`. Perlu koneksi internet
saat pertama kali membuka halaman agar font termuat dengan benar.
