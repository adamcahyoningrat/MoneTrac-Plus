# 💰 MoneTrac v2.0 - Personal Finance & Savings Tracker (Supabase Edition)

Selamat datang di pembaruan besar **MoneTrac v2.0**! Aplikasi pencatatan keuangan pribadi dan tabungan masa kini yang telah dirombak total dari arsitektur lama berbasis Google Sheet & Apps Script menjadi **arsitektur modern, cepat, aman, dan multiuser berbasis Supabase (PostgreSQL + Auth + Row Level Security)**.

---

## 🌟 Apa yang Baru di MoneTrac v2.0?

### 1. 🚀 Migrasi Total ke Supabase Backend
- **Database Relasional PostgreSQL**: Tidak ada lagi keterbatasan kuota atau kelambatan respon Google Apps Script. Semua data (transaksi, akun, kategori, anggaran, target tabungan) tersimpan secara terstruktur di Supabase.
- **Isolasi Data Multi-User dengan Row Level Security (RLS)**: Setiap pengguna hanya dapat melihat dan memodifikasi datanya sendiri secara otomatis dan terjamin aman di tingkat database.
- **Trigger Registrasi Otomatis**: Saat pengguna mendaftar, sistem otomatis membuatkan profil, dompet default (Cash, Bank, E-Wallet), dan kategori dasar.

### 2. 🔐 Multi-User Authentication (Supabase Auth)
- Halaman **Masuk (Login)** & **Daftar (Register)** dengan proteksi sesi otomatis (`auth.html`).
- Dukungan login email & password, reset password, dan persistensi token sesi.
- Mode Demo / Offline lokal tetap tersedia bagi pengguna yang ingin mencoba langsung sebelum menghubungkan Supabase.

### 3. 👁️ Fitur Mode Privasi (Privacy Mode)
- Tombol toggle mata (**Eye Icon**) di navigasi atas.
- Sekali klik, semua nominal saldo (Total Kekayaan, Saldo Akun, Pemasukan, Pengeluaran, Nominal Transaksi, Anggaran, Tabungan) otomatis disamarkan (*masked/blurred*).
- Sangat aman saat membuka aplikasi di tempat umum, kafe, transportasi, atau saat merekam layar / screenshot.

### 4. 🎯 Fitur Target Tabungan & Celengan Impian (Savings Goals)
- Halaman khusus `savings.html` untuk membuat target tabungan (misal: *Dana Darurat*, *Beli Laptop*, *Liburan*, *Umroh*).
- Lengkap dengan target nominal, estimasi deadline, sisa hari, dan indikator progres visual.
- **Fitur Setor (Nabung) & Tarik Dana**: Mengalokasikan dana langsung dari akun dompet ke celengan impian, atau menarik kembali ke rekening secara otomatis.

### 5. 🔄 Modal Transaksi Cerdas & Dinamis (Transfer Handling)
- **Tiga Tipe Transaksi**: 🔴 Pengeluaran (Expense), 🟢 Pemasukan (Income), dan 🔵 Pindah Dana (Transfer).
- Ketika memilih **Transfer**:
  - Kolom kategori otomatis disembunyikan / dialihkan ke *Transfer Saldo*.
  - Muncul pilihan **Dari Akun (Sumber)** dan **Ke Akun (Tujuan)** beserta *Dynamic Visual Preview* (*Akun A ➔ Akun B*).
  - Terdapat kolom opsional **Biaya Admin Transfer** (misal Rp 2.500).
  - Saldo kedua akun otomatis dihitung secara akurat (*Double-entry balancing*).
- Ketika memilih **Income / Expense**:
  - Kolom akun tujuan disembunyikan.
  - Dropdown kategori difilter secara cerdas sesuai tipe transaksi.
  - Terdapat tombol *Quick Chips* (+10rb, +50rb, +100rb, +500rb, +1jt) untuk pengisian nominal instan.

### 6. 🎨 Tampilan UI/UX Modern & Responsif 100%
- Mengusung tema *Modern FinTech Glassmorphism* dengan transisi halus dan tipografi *Plus Jakarta Sans*.
- **Dark Mode & Light Mode** dengan variabel CSS dinamis.
- **Mobile Bottom Navigation Bar** untuk kenyamanan akses satu jempol di smartphone.
- **Sistem Notifikasi Toast Modern** menggantikan alert browser bawaan.

### 7. 📑 Laporan Keuangan Siap Cetak (Print / PDF) & Ekspor CSV
- Format cetak laporan bulanan (*A4 Clean Layout*) yang rapi saat tombol **Cetak / PDF** ditekan.
- Ekspor data transaksi dan laporan bulanan ke format file `.csv` (kompatibel penuh dengan Microsoft Excel & Google Sheets).
- **Alat Migrasi 1-Klik**: Fitur untuk mengimpor seluruh data JSON dari Google Sheet lama Anda langsung ke database Supabase!

---

## 🛠️ Struktur File & Folder Proyek

```text
monetrac/
├── assets/
│   ├── components/
│   │   ├── modal.js             # Modal universal (Form Transaksi dinamis, Tabungan, Akun, Kategori, Budget)
│   │   ├── navbar.js            # Navbar (Mode Privasi, Ganti Tema, Quick Add, Profil)
│   │   └── sidebar.js           # Sidebar & Mobile Bottom App Bar
│   ├── css/
│   │   ├── responsive.css       # Layout responsif (Mobile/Tablet) & Print Media Styling
│   │   ├── style.css            # Desain komponen kartu, tabel, badge, form, toast
│   │   └── theme.css            # Variabel warna tema Gelap & Terang
│   └── js/
│       ├── accounts.js          # Logika kelola akun dompet & transfer
│       ├── app.js               # State global & inisialisasi tema/privasi
│       ├── auth.js              # Supabase Auth & Proteksi Route
│       ├── budget.js            # Logika anggaran bulanan per kategori
│       ├── categories.js        # Logika kelola kategori transaksi
│       ├── dashboard.js         # Logika dashboard, grafik Chart.js & widget
│       ├── kpi.js               # Metrik rasio tabungan, burn rate & runway
│       ├── reports.js           # Rekap bulanan, cetak PDF & ekspor CSV
│       ├── savings.js           # Logika target tabungan (Celengan Impian)
│       ├── settings.js          # Pengaturan profil, Supabase config & migrasi data
│       ├── storage.js           # Data Access Layer (Supabase CRUD & Local Cache)
│       ├── supabase-config.js   # Konfigurasi Supabase Client
│       └── utils.js             # Formatter rupiah (dengan privasi), tanggal, CSV, toast
├── accounts.html                # Halaman Akun & Dompet
├── auth.html                    # Halaman Masuk / Daftar Akun
├── budget.html                  # Halaman Anggaran (Budget)
├── categories.html              # Halaman Kategori
├── index.html                   # Halaman Utama (Dashboard Finansial)
├── kpi.html                     # Halaman KPI & Skor Kesehatan Keuangan
├── reports.html                 # Halaman Laporan & Cetak
├── savings.html                 # Halaman Target Tabungan (Celengan Impian)
├── settings.html                # Halaman Pengaturan & Migrasi
├── supabase_schema.sql          # Skrip SQL untuk setup database Supabase
└── README.md                    # Dokumentasi lengkap
```

---

## ⚙️ Panduan Setup Supabase (Langkah demi Langkah)

### Langkah 1: Buat Proyek di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan masuk ke akun Anda.
2. Klik **New Project**, pilih organisasi, beri nama proyek (misal `MoneTrac DB`), dan tentukan database password.
3. Tunggu hingga proyek selesai disiapkan (sekitar 1-2 menit).

### Langkah 2: Jalankan Skrip SQL Schema
1. Di dashboard Supabase, buka menu **SQL Editor** pada sidebar kiri.
2. Buka file `supabase_schema.sql` yang ada pada proyek MoneTrac ini.
3. Salin seluruh isi kodenya, tempelkan ke SQL Editor Supabase, lalu klik tombol **Run**.
4. Skrip ini akan secara otomatis:
   - Membuat tabel `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `savings_goals`, `savings_transactions`.
   - Mengaktifkan *Row Level Security (RLS)* dan kebijakannya.
   - Membuat *Trigger Database* untuk inisialisasi akun & kategori default saat ada pengguna baru mendaftar.

### Langkah 3: Dapatkan API URL & Anon Key
1. Buka menu **Project Settings** (ikon gear di sidebar kiri bawah) -> pilih **API**.
2. Salin **Project URL** (misal `https://xxxxxxxx.supabase.co`).
3. Salin **Project API Keys** bagian `anon public` (misal `eyJhbGciOi...`).

### Langkah 4: Hubungkan ke MoneTrac
1. Buka halaman `settings.html` atau klik **Konfigurasi Supabase** pada halaman login `auth.html`.
2. Masukkan **Project URL** dan **Anon Key** yang telah Anda salin.
3. Klik **Simpan Kredensial** lalu klik **Uji Koneksi**.
4. Selesai! Kini aplikasi MoneTrac Anda sudah 100% terhubung ke Supabase.

---

## 📥 Panduan Migrasi Data Lama dari Google Sheet

Jika Anda ingin memindahkan data riwayat transaksi, akun, kategori, dan anggaran dari Google Sheet lama Anda:
1. Buka halaman `settings.html` di MoneTrac.
2. Gulir ke bagian **Migrasi Data Google Sheet Lama**.
3. Buka Google Sheet database lama Anda, salin teks JSON pada baris data (`myfinance_transactions`, `myfinance_accounts`, dsb) atau tempelkan JSON database lama Anda.
4. Klik tombol **Mulai Migrasi Data**.
5. Sistem akan otomatis memasukkan semua akun, kategori, anggaran, dan seluruh riwayat transaksi lama ke akun Supabase Anda secara instan.