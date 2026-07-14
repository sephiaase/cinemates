const registerForm = document.getElementById('registerForm');
const otpForm = document.getElementById('otpForm');
const otpHelp = document.getElementById('otpHelp');
let registeredEmail = ''; // Untuk menyimpan email sementara

// 1. Alur Submit Pendaftaran
registerForm.addEventListener('submit', async(e) => {
    e.preventDefault();

    const username = document.getElementById('re-name').value;
    const email = document.getElementById('re-email').value;
    const password = document.getElementById('re-pass').value;
    registeredEmail = email; // simpan untuk form OTP nanti

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            // Sembunyikan form register, munculkan form OTP
            registerForm.style.display = 'none';
            otpForm.style.display = 'block';
            otpHelp.innerText = `Kode dikirim ke ${email}, berlaku 10 menit.`;
        } else {
            alert(result.error || 'Gagal mendaftar');
        }
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan koneksi ke server.');
    }
});

// 2. Alur Kirim OTP
otpForm.addEventListener('submit', async(e) => {
    e.preventDefault();

    // Gabungkan ke-6 input OTP menjadi satu string string
    const inputs = document.querySelectorAll('.otp-input');
    let otpCode = '';
    inputs.forEach(input => otpCode += input.value);

    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registeredEmail, otp: otpCode })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Verifikasi sukses! Kamu akan dialihkan ke halaman login.');
            window.location.href = 'login.html'; // Pindah ke halaman login
        } else {
            alert(result.error || 'Kode OTP salah.');
        }
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat memverifikasi.');
    }
});

// Bonus: Auto-focus ke input OTP berikutnya setelah mengetik angka
const otpInputs = document.querySelectorAll('.otp-input');
otpInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });
});

// 3. Alur Login
const loginForm = document.getElementById('loginForm'); // Pastikan ID form di HTML kamu sesuai

// BUG FIX: auth.js hanya di-include di register.html, yang tidak memiliki
// elemen #loginForm. Sebelumnya baris ini langsung memanggil
// `.addEventListener` pada `null` dan melempar TypeError setiap kali
// register.html dimuat (terlihat di console). Dibungkus guard supaya aman
// dipakai di halaman manapun.
if (loginForm) {
    loginForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        const email = document.getElementById('email').value; // Sesuaikan ID input
        const password = document.getElementById('password').value;

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // 🟢 PENTING: Simpan objek user dari database ke localStorage
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.error);
        }
    });
}