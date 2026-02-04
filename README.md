# Form Asah Kemampuan

Aplikasi web statis untuk latihan soal pilihan ganda (Multiple Choice) dengan fitur anti-cheat sederhana.

## Fitur
- **Mobile First Design**: Tampilan responsif seperti Google Forms.
- **Dynamic Questions**: Soal diambil dari file `questions.json`.
- **Anti-Cheat**: 
  - Klik kanan dinonaktifkan.
  - Reset otomatis jika pengguna berpindah tab/keluar dari halaman saat mengerjakan soal.
- **Result Summary**: Menampilkan skor dan jumlah jawaban benar/salah.

## Cara Menggunakan
1. Buka `index.html` di browser.
2. Masukkan Nama.
3. Kerjakan soal.

## Cara Mengganti Soal
Edit file `questions.json`. Format:
```json
{
  "id": 1,
  "question": "Pertanyaan...",
  "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
  "answer": "Opsi Benar (harus sama persis dengan salah satu opsi)"
}
```

## Deploy ke GitHub Pages
1. Push semua file ini ke repository GitHub baru.
2. Buka **Settings** > **Pages** di repository tersebut.
3. Pilih source: **Deploy from a branch**.
4. Pilih branch **main** (atau master) dan folder **root (/)**.
5. Klik **Save**. Tunggu beberapa saat, link website akan muncul.

## Alternatif Hosting Gratis
Selain GitHub Pages, berikut adalah layanan populer yang gratis dan memberikan domain (subdomain) sendiri:

### 1. Vercel (Rekomendasi)
- **Kelebihan**: Sangat cepat, deploy otomatis dari GitHub.
- **Domain**: `nama-project.vercel.app`.
- **Caranya**:
  1. Daftar di [vercel.com](https://vercel.com).
  2. Klik "Add New..." -> "Project".
  3. Import repository GitHub kamu.
  4. Klik "Deploy". Selesai dalam hitungan detik.

### 2. Netlify
- **Kelebihan**: Bisa Drag & Drop folder (tanpa Git) atau connect GitHub.
- **Domain**: `nama-project.netlify.app`.
- **Caranya (Manual Upload)**:
  1. Daftar di [netlify.com](https://netlify.com).
  2. Login, lalu drag & drop folder `Latihan-PPKN` dari komputermu ke dashboard Netlify.
  3. Website langsung online.
