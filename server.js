const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const path = require('path');
const net = require('net');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CORS (Bug 3.2) — header manual, tanpa dependency tambahan
// karena package 'cors' belum terpasang di package.json/node_modules.
// Aman untuk kondisi same-origin saat ini, dan siap dipakai jika
// frontend suatu saat di-deploy dari origin/port lain.
// ==========================================
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-file-name, x-room-id');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Izinkan browser mengakses file CSS, JS, dan gambar di dalam folder assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Izinkan browser mengakses dan membuka isi folder uploads secara langsung
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routing Halaman Utama
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/room.html', (req, res) => res.sendFile(path.join(__dirname, 'room.html')));
app.get('/riwayat-nonton.html', (req, res) => res.sendFile(path.join(__dirname, 'riwayat-nonton.html')));
app.get('/pengaturan.html', (req, res) => res.sendFile(path.join(__dirname, 'pengaturan.html')));

// ==========================================
// SETUP KONEKSI MYSQL (PERBAIKAN KOMA & PROMISE)
// ==========================================
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cinemates',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tes Koneksi Awal untuk versi Promise
(async() => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Database MySQL Sukses Terhubung!');
        connection.release();
    } catch (err) {
        console.error('❌ Database MySQL Gagal Terhubung:', err.message);
    }
})();

// Setup SMTP Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cinemmates.message@gmail.com',
        pass: 'vboxrpfgcnvuamqw'
    }
});

// ==========================================
// ENDPOINT 1: REGISTRASI
// ==========================================
app.post('/api/register', async(req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const query = `INSERT INTO users (username, email, password, verification_token) VALUES (?, ?, ?, ?)`;
        await db.execute(query, [username, email, hashedPassword, otpCode]);

        const mailOptions = {
            from: '"Cinemates Admin" <emailkamu@gmail.com>',
            to: email,
            subject: 'Kode Verifikasi Akun Cinemates kamu',
            text: `Halo ${username}, berikut adalah kode OTP kamu: ${otpCode}. Kode berlaku selama 10 menit.`
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Registrasi berhasil! Silakan cek email kamu untuk kode OTP.' });
    } catch (error) {
        console.error("LOG ERROR SERVER:", error);
        res.status(500).json({ error: error.message || 'Terjadi error pada server.' });
    }
});

// ==========================================
// ENDPOINT 2: VERIFIKASI OTP
// ==========================================
app.post('/api/verify-otp', async(req, res) => {
    const { email, otp } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND verification_token = ?', [email, otp]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Kode OTP salah atau tidak valid.' });
        }
        await db.execute('UPDATE users SET is_verified = 1, verification_token = NULL WHERE email = ?', [email]);
        res.status(200).json({ message: 'Akun berhasil diverifikasi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal memverifikasi OTP.' });
    }
});

// ==========================================
// ENDPOINT 3: LOGIN
// ==========================================
app.post('/api/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.execute(query, [email]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Email belum terdaftar atau salah.' });
        }

        const user = rows[0];
        if (user.is_verified === 0) {
            return res.status(400).json({ error: 'Akun kamu belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ error: 'Kata sandi salah.' });
        }

        res.status(200).json({
            message: 'Login berhasil!',
            user: {
                id: user.id,
                username: user.username, // Ini adalah kunci yang kita ambil
                email: user.email
            }
        });
    } catch (error) {
        console.error("LOG ERROR LOGIN SERVER:", error);
        res.status(500).json({ error: error.message || 'Terjadi error pada server.' });
    }
});

// ==========================================
// ENDPOINT: VERIFIKASI SESI (Bug 3.1)
// Dipakai oleh assets/js/auth-guard.js di semua halaman terproteksi
// untuk memastikan user di localStorage benar-benar masih valid & terverifikasi
// di database, bukan sekadar string bebas yang disisipkan manual.
// ==========================================
app.get('/api/verify-session', async(req, res) => {
    const { username, email } = req.query;
    if (!username && !email) {
        return res.status(401).json({ valid: false, error: 'Sesi tidak ditemukan.' });
    }
    try {
        const query = username ?
            'SELECT id, username, email, is_verified FROM users WHERE username = ?' :
            'SELECT id, username, email, is_verified FROM users WHERE email = ?';
        const [rows] = await db.execute(query, [username || email]);

        if (rows.length === 0 || rows[0].is_verified === 0) {
            return res.status(401).json({ valid: false, error: 'Sesi tidak valid, silakan login kembali.' });
        }
        res.status(200).json({ valid: true, user: rows[0] });
    } catch (err) {
        console.error('❌ Gagal memverifikasi sesi:', err.message);
        res.status(500).json({ valid: false, error: 'Gagal memverifikasi sesi.' });
    }
});

// ==========================================
// ROOM MAKER & WATCH HISTORY
// ==========================================
app.post('/api/rooms', async(req, res) => {
    const { name, link, max_participants, category, privacy, username } = req.body;

    console.log("Data yang diterima:", { name, link, max_participants, category, privacy, username });

    try {
        const query = `INSERT INTO rooms (room_name, video_url, max_participants, genre, privacy, host_name) VALUES (?, ?, ?, ?, ?, ?)`;

        const [result] = await db.execute(query, [
            name,
            link || null,
            max_participants,
            category,
            privacy,
            username
        ]);

        res.status(201).json({ success: true, roomId: result.insertId });
    } catch (err) {
        console.error('❌ Gagal membuat room:', err.message);
        res.status(500).json({ error: 'Gagal membuat room di database: ' + err.message });
    }
});

// Endpoint JOIN Room
app.post('/api/rooms/join', async(req, res) => {
    const { roomId, username } = req.body;
    try {
        // Cek apakah user sudah ada
        const [existing] = await db.execute(
            'SELECT id FROM room_participants WHERE room_id = ? AND username = ?', [roomId, username]
        );

        if (existing.length === 0) {
            // Cek apakah ada host di room ini
            const [host] = await db.execute('SELECT id FROM room_participants WHERE room_id = ? AND is_host = 1', [roomId]);
            const isHost = (host.length === 0) ? 1 : 0; // Jadi host jika belum ada host

            await db.execute(
                'INSERT INTO room_participants (room_id, username, is_host) VALUES (?, ?, ?)', [roomId, username, isHost]
            );
        }
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Endpoint LEAVE Room (Penting untuk pindah host)
app.post('/api/rooms/leave', async(req, res) => {
    // Ambil data (sendBeacon mengirim data sebagai string biasa)
    const { roomId, username } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    try {
        // Hapus user dari database
        await db.execute('DELETE FROM room_participants WHERE room_id = ? AND username = ?', [roomId, username]);

        // Logika pindah Host otomatis
        const [hostCheck] = await db.execute('SELECT id FROM room_participants WHERE room_id = ? AND username = ? AND is_host = 1', [roomId, username]);

        if (hostCheck.length > 0) {
            const [nextHost] = await db.execute('SELECT username FROM room_participants WHERE room_id = ? ORDER BY id ASC LIMIT 1', [roomId]);
            if (nextHost.length > 0) {
                await db.execute('UPDATE room_participants SET is_host = 1 WHERE room_id = ? AND username = ?', [roomId, nextHost[0].username]);
            }
        }
        res.status(200).send("OK");
    } catch (err) { res.status(500).send(err.message); }
});

// Endpoint untuk mengambil list room aktif/publik di dashboard
app.get('/api/rooms/public', async(req, res) => {
    try {
        const query = `SELECT * FROM rooms WHERE privacy = 'public' ORDER BY id DESC`;
        const [results] = await db.execute(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('❌ Gagal mengambil data room publik:', err.message);
        res.status(500).json({ error: 'Gagal memuat daftar room.' });
    }
});

// Endpoint untuk MENGAMBIL daftar peserta
app.get('/api/rooms/:id/participants', async(req, res) => {
    try {
        const [participants] = await db.execute(
            'SELECT username, is_host FROM room_participants WHERE room_id = ?', [req.params.id]
        );
        res.json(participants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/rooms/:id/files', async(req, res) => {
    const roomId = req.params.id;
    try {
        const query = `SELECT * FROM files WHERE room_id = ? ORDER BY created_at ASC`;
        const [results] = await db.execute(query, [roomId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('❌ Gagal mengambil riwayat file:', err.message);
        res.status(500).json({ error: 'Gagal memuat riwayat file.' });
    }
});

app.get('/api/rooms/:id', async(req, res) => {
    try {
        const query = `SELECT * FROM rooms WHERE id = ?`;
        const [results] = await db.execute(query, [req.params.id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Room tidak ditemukan.' });
        }
        res.status(200).json(results[0]);
    } catch (err) {
        console.error('❌ Gagal mengambil detail room:', err.message);
        res.status(500).json({ error: 'Gagal memuat data detail room.' });
    }
});

app.post('/api/history', async(req, res) => {
    const { username, room_id, video_title, room_name, genre, status } = req.body;
    const finalUsername = username || 'sephiaase';
    const finalRoomId = room_id || 0;

    try {
        const query = `
            INSERT INTO watch_history (username, room_id, video_title, room_name, genre, status, watched_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                video_title = VALUES(video_title),
                room_name = VALUES(room_name),
                status = VALUES(status),
                watched_at = NOW();
        `;
        await db.execute(query, [finalUsername, finalRoomId, video_title || room_name, room_name, genre || 'anime', status || 'partial']);
        res.status(200).json({ success: true, message: 'Riwayat nonton berhasil diperbarui!' });
    } catch (err) {
        console.error('❌ Gagal mencatat riwayat nonton:', err.message);
        res.status(500).json({ error: 'Gagal mencatat riwayat ke database.' });
    }
});

app.get('/api/riwayat', async(req, res) => {
    const username = req.query.username;

    try {
        // BUG FIX (3): sebelumnya query hanya SELECT * FROM watch_history, tidak
        // pernah menyertakan `active_room_id`. Akibatnya di frontend
        // `item.active_room_id !== null` SELALU true (karena undefined !== null),
        // sehingga tombol "Lanjut Nonton" tetap tampil meski room sudah dihapus/
        // berakhir. LEFT JOIN ke tabel rooms memberi tahu apakah room-nya masih ada.
        const query = `
            SELECT wh.*, r.id AS active_room_id
            FROM watch_history wh
            LEFT JOIN rooms r ON wh.room_id = r.id
            WHERE wh.username = ?
            ORDER BY wh.watched_at DESC
        `;
        const [results] = await db.execute(query, [username]);

        res.status(200).json(results);
    } catch (err) {
        console.error('❌ Gagal mengambil riwayat:', err.message);
        res.status(500).json({ error: 'Gagal memuat data riwayat.' });
    }
});

app.delete('/api/rooms/:id', async(req, res) => {
    const roomId = req.params.id;
    try {
        const query = `DELETE FROM rooms WHERE id = ?`;
        const [result] = await db.execute(query, [roomId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Room tidak ditemukan atau sudah dihapus.' });
        }
        res.status(200).json({ success: true, message: 'Sesi room berhasil diakhiri.' });
    } catch (err) {
        console.error('❌ Gagal menghapus room:', err.message);
        res.status(500).json({ error: 'Gagal mengakhiri sesi room.' });
    }
});

// Route untuk Host mengirim sync (POST)
app.post('/api/rooms/:roomId/sync', async(req, res) => {
    try {
        const { action, time, state } = req.body;
        await db.execute(
            'UPDATE rooms SET video_action = ?, video_time = ?, video_state = ? WHERE id = ?', [action, time, state, req.params.roomId]
        );
        res.status(200).send("Sync updated");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route untuk Peserta mengambil sync (GET)
// BUG FIX (2.1): route ini sebelumnya TIDAK ADA sama sekali — room.js memanggil
// GET /api/rooms/:roomId/sync setiap 1 detik, tapi hanya endpoint POST-nya yang
// pernah dibuat, sehingga request GET selalu 404 dan video peserta tidak
// pernah ikut sinkron dengan host. Endpoint ini melengkapi pasangannya.
app.get('/api/rooms/:roomId/sync', async(req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT video_action, video_time, video_state FROM rooms WHERE id = ?', [req.params.roomId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Room tidak ditemukan.' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/rooms/:id/host', async(req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT username FROM room_participants WHERE room_id = ? AND is_host = 1 LIMIT 1', [req.params.id]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: "Host tidak ditemukan" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/rooms/:id/chats', async(req, res) => {
    const { sender, message } = req.body;
    const roomId = req.params.id;

    if (!sender || !message) {
        return res.status(400).json({ error: 'Pengirim dan pesan tidak boleh kosong.' });
    }

    try {
        const query = `INSERT INTO chats (room_id, sender, message) VALUES (?, ?, ?)`;
        await db.execute(query, [roomId, sender, message]);
        res.status(201).json({ success: true, message: 'Chat berhasil disimpan!' });
    } catch (err) {
        console.error('❌ Gagal menyimpan chat:', err.message);
        res.status(500).json({ error: 'Gagal mengirim pesan.' });
    }
});

app.get('/api/rooms/:id/chats', async(req, res) => {
    const roomId = req.params.id;
    try {
        const query = `SELECT sender, message, created_at FROM chats WHERE room_id = ? ORDER BY created_at ASC`;
        const [results] = await db.execute(query, [roomId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('❌ Gagal mengambil riwayat chat:', err.message);
        res.status(500).json({ error: 'Gagal memuat riwayat chat.' });
    }
});

// ==========================================
// INTEGRASI FITUR UPLOAD FILE VIA TCP
// ==========================================
const TCP_PORT = 5001;
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Server Raw TCP
const myTcpServer = net.createServer((socket) => {
    console.log('🔴 TCP Socket: Client internal terhubung.');
    let fileStream = null;
    let bufferHeader = '';
    let headerParsed = false;

    socket.on('data', (chunk) => {
        if (!headerParsed) {
            bufferHeader += chunk.toString('utf8');
            const separatorIndex = bufferHeader.indexOf('|||');

            if (separatorIndex !== -1) {
                const fileName = bufferHeader.substring(0, separatorIndex);
                const filePath = path.join(uploadDir, fileName);

                console.log(`💾 TCP Socket: Mulai menulis file -> ${fileName}`);
                fileStream = fs.createWriteStream(filePath);

                const headerRaw = fileName + '|||';
                const headerLength = Buffer.byteLength(headerRaw, 'utf8');
                const remainingData = chunk.slice(headerLength);

                if (remainingData.length > 0) {
                    fileStream.write(remainingData);
                }
                headerParsed = true;
            }
        } else {
            if (fileStream) fileStream.write(chunk);
        }
    });

    socket.on('end', () => {
        if (fileStream) {
            fileStream.end();
            console.log('✅ TCP Socket: File sukses ditulis ke folder uploads.');
        }
        socket.write('SUCCESS\n');
    });

    socket.on('error', (err) => {
        console.error('❌ TCP Socket Error:', err.message);
        if (fileStream) fileStream.end();
    });
});

myTcpServer.listen(TCP_PORT, () => {
    console.log(`🚀 Raw TCP Server berjalan kokoh di port ${TCP_PORT}`);
});

// 2. HTTP Endpoint API Bridge
app.post('/api/upload-tcp', (req, res) => {
    const fileName = req.headers['x-file-name'] || `file_${Date.now()}`;
    const roomId = req.headers['x-room-id'];

    let dataBlocks = [];
    req.on('data', (chunk) => { dataBlocks.push(chunk); });

    req.on('end', () => {
        const fullBuffer = Buffer.concat(dataBlocks);

        const tcpClient = net.createConnection({ port: TCP_PORT }, () => {
            tcpClient.write(fileName + '|||');
            tcpClient.write(fullBuffer);
            tcpClient.end();
        });

        tcpClient.on('data', async(data) => {
            if (data.toString().includes('SUCCESS')) {
                console.log(`🎉 API Bridge: Server TCP sukses menyimpan file.`);

                if (roomId) {
                    try {
                        const fileSize = fullBuffer.length;
                        const fileUrl = `/uploads/${fileName}`;
                        const query = `INSERT INTO files (room_id, file_name, file_size, file_url) VALUES (?, ?, ?, ?)`;
                        await db.execute(query, [roomId, fileName, fileSize, fileUrl]);
                        console.log('✅ File berhasil dicatat ke database MySQL.');
                    } catch (err) {
                        console.error('❌ Gagal mencatat file ke database:', err.message);
                    }
                }

                if (!res.headersSent) {
                    return res.status(200).json({ message: 'File sukses diunggah via TCP!' });
                }
            }
        });

        tcpClient.on('error', (err) => {
            console.error('❌ Gagal meneruskan file ke Server TCP:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Gagal mengirim file melalui jembatan TCP.' });
            }
        });
    });
});

// Jalankan Main HTTP Web Server Port 3000
app.listen(3000, () => console.log('🚀 Server running on port 3000'));