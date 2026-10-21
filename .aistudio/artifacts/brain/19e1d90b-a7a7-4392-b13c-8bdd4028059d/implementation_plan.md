# Penyempurnaan Tata Letak & Ergonomi Operasional Ai Rent

Merombak tata letak antarmuka Ai Rent agar jauh lebih bersih, nyaman di mata, dan sangat cepat dioperasikan menggunakan satu tangan lewat HP Admin maupun layar penuh desktop tanpa kehilangan satu pun fitur operasional, sinkronisasi Google Sheets/Cloud, maupun pengelolaan armada.

## User Review & Critical Decisions

> [!IMPORTANT]
> Rencana ini disusun langsung berdasarkan preferensi yang telah Anda konfirmasi agar layar tidak lagi terasa penuh dan seluruh unit armada dapat dipantau serta dieksekusi dengan cepat.

- **Keputusan Terkonfirmasi 1 — Header Atas Bersih & Pengelompokan Menu**: Menyederhanakan bilah navigasi atas menjadi 3 zona bersih (Identitas Brand di kiri, Navigasi Utama di tengah untuk layar besar, serta Tombol Aksi Utama `+ Sewa Baru`, Pencarian Cepat, dan satu tombol **Menu Pengaturan & Alat** yang mengelompokkan Google Sheets/Cloud, Hosting GitHub, QR Pesanan HP, Link Investor, Pergantian Tahun Buku, Kelola Armada, Install Aplikasi, dan Reset Data).
- **Keputusan Terkonfirmasi 2 — Tampilan Tabel Padat (Compact View) untuk 13 Unit Armada**: Menyediakan tampilan utama **Tabel / Daftar Padat** di mana ke-13 unit motor terlihat sekaligus dalam satu layar tanpa perlu *scroll* panjang, dilengkapi tombol pengalih (*toggle*) ke tampilan Kartu Detail kapan saja diperlukan.
- **Keputusan Terkonfirmasi 3 — Ergonomi Satu Tangan di HP Admin (Thumb-Zone)**: Memindahkan navigasi perpindahan tab utama pada layar HP ke **Bilah Navigasi Bawah (Bottom Tab Bar)** yang mudah dijangkau ibu jari, serta memastikan setiap tombol aksi penting (`Sewa`, `Check-In`, `Check-Out`, `WA`) memiliki area sentuh minimal $44 \times 44\text{px}$.

---

## 1. Overview & Core Concept

- **Apa yang Dilakukan**: Mengubah antarmuka Ai Rent dari kumpulan tombol yang berjejal di bagian atas dan kartu-kartu besar yang memakan ruang vertikal menjadi pusat kendali operasional (*operational cockpit*) yang rapi, terstruktur, dan responsif.
- **Target Pengguna & Konteks**: Admin dan pemilik rental motor yang sering memantau ketersediaan 13 unit motor, mencatat transaksi sewa baru, melakukan *Check-In / Check-Out*, serta mengirim nota WhatsApp secara cepat menggunakan satu tangan di smartphone maupun di komputer kasir.
- **Nilai Utama**:
  1. **Bebas Sesak di Layar Atas**: Menghilangkan deretan 10+ tombol di header atas sehingga fokus visual langsung tertuju pada status unit motor dan transaksi.
  2. **Pantau 13 Unit Sekaligus**: Dengan mode Tabel Padat (*High-Density Fleet Table*), admin langsung melihat Nopol, Nama Unit, Status, Penyewa Aktif, Jam Kembali, dan tombol aksi dalam satu pandangan.
  3. **Operasional Satu Jari di HP**: Navigasi tab berada tepat di area jangkauan jempol bawah (*bottom bar*), sedangkan menu utilitas tersimpan rapi di dalam laci menu (*action sheet / dropdown*).

---

## 2. User Experience & Visual Design

- **Alur Penggunaan Utama (Key User Flows)**:
  1. **Pemantauan Kilat Armada**: Saat aplikasi dibuka, bagian atas menampilkan ringkasan metrik 4 kolom (*Total, Tersedia, Disewa, Overdue*) yang ringkas, diikuti filter status satu baris dan **Tabel Padat 13 Unit**.
  2. **Eksekusi Satu Ketukan**: Pada setiap baris unit motor, admin cukup mengetuk satu tombol utama sesuai status (`Sewa`, `Check-In`, atau `Check-Out`) atau ikon WhatsApp/Servis di sebelah kanan baris.
  3. **Akses Alat & Pengaturan Sistem**: Mengetuk tombol **Menu Alat & Cloud** di kanan atas membuka panel terstruktur berisi status koneksi *Google Sheets & Cloud*, *Hosting GitHub*, *QR Pesanan Mandiri*, *Link Investor*, *Tahun Buku Aktif*, dan *Kelola Master Armada*.
  4. **Navigasi Satu Tangan (Mobile)**: Berpindah antar halaman (*Armada, Transaksi, Pelanggan, Tarif, Pengeluaran, Laporan*) dilakukan melalui bilah tab bawah yang tetap (*fixed bottom navigation*) di layar HP.

- **Identitas Visual & Tema**:
  - *Aesthetic Direction*: **Utilitarian Operational Dashboard & Touch-First Ergonomics** — permukaan gelap kontras tinggi yang nyaman di mata saat siang maupun malam, pembatas garis tipis (*1px hairline borders*), tanpa tumpukan kartu di dalam kartu.
  - *Palet Warna & Kontras (60-30-10)*:
    - **60% Kanvas Utama**: Deep Slate (`#020617` / `bg-slate-950`) memberikan kejelasan baca maksimal di luar ruangan.
    - **30% Permukaan Struktural**: Slate Container (`#0F172A` / `bg-slate-900`) dengan garis batas `border-slate-800` untuk baris tabel, header, dan laci menu.
    - **10% Aksen Semantik & Aksi**: Cyan (`#22D3EE`) untuk aksi utama (`+ Sewa Baru` & status Disewa), Emerald (`#34D399`) untuk unit Tersedia & WhatsApp, Amber (`#FBBF24`) untuk Booking, dan Rose (`#FB7185`) untuk peringatan Overdue.
  - *Tipografi & Hierarki*:
    - Menggunakan angka tabular (`tabular-nums` / `font-mono`) untuk seluruh pelat nomor (Nopol), tarif Rupiah, hitungan mundur jam kembali, dan metrik keuangan agar sejajar vertikal dengan presisi.
  - *Komposisi Ruang & Ergonomi Sentuh*:
    - Mematuhi batas *15% Mobile Sticky Cap* (tinggi gabungan header atas yang ramping $56\text{px}$ dan navigasi bawah di HP tidak memakan ruang baca).
    - Setiap tombol interaktif memiliki area sentuh minimal $44 \times 44\text{px}$ di perangkat layar sentuh agar tidak salah pencet.

- **Umpan Balik Interaktif**:
  - Transisi instan ($\le 150\text{ms}$) saat berganti filter status atau beralih antara mode **Tabel Padat** dan **Kartu Detail**.
  - Indikator sinkronisasi Cloud/Sheets tetap terlihat jelas melalui lencana status ringkas di header dan di dalam menu sistem.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Mengelompokkan 8+ Tombol Utilitas ke Menu Terpusat ("Alat & Sistem")**
  - *Pendekatan Terpilih*: Menyisakan hanya identitas aplikasi, pencarian cepat (`Cari`), tombol utama (`+ Sewa Baru`), dan satu tombol pembuka menu **Alat & Sistem** di bilah atas.
  - *Alasan*: Sebelumnya terdapat lebih dari 9 tombol berbeda warna di header yang membuat layar sempit dan membingungkan mata, terutama di layar HP. Pengelompokan ke dalam menu terstruktur menjaga seluruh fitur tetap mudah diakses dalam 1 ketukan tanpa mengorbankan kerapian layar.
  - *Alternatif yang Dipertimbangkan*: Membuat baris kedua berisi tombol-tombol digulir mendatar (*horizontal scroll*), namun ditolak karena memakan ruang vertikal layar HP.

- **Keputusan 2: Mode Tabel Padat (Compact View) sebagai Tampilan Utama Armada dengan Opsi Kartu**
  - *Pendekatan Terpilih*: Menampilkan ke-13 unit motor dalam daftar/tabel padat berbaris rapi sebagai tampilan *default*, dilengkapi tombol pengalih (*Compact Table* vs *Card Grid*).
  - *Alasan*: Dengan 13 unit motor, tampilan kartu besar mengharuskan admin melakukan *scroll* berkali-kali untuk memeriksa unit mana yang kosong atau kapan unit tertentu kembali. Tampilan padat memungkinkan pemindaian 13 unit sekaligus dalam hitungan detik.
  - *Alternatif yang Dipertimbangkan*: Menghapus tampilan kartu sepenuhnya, namun kami tetap menyimpannya sebagai opsi pengalih (*toggle*) bagi admin yang sesekali ingin melihat tampilan kartu besar.

- **Keputusan 3: Navigasi Bawah (Bottom Tab Bar) Khusus Layar HP**
  - *Pendekatan Terpilih*: Menyembunyikan deretan tab teks di bagian atas saat dibuka di HP dan menggantinya dengan *Fixed Bottom Navigation Bar* berikon jelas di bagian bawah layar.
  - *Alasan*: Saat menggunakan HP dengan satu tangan, menjangkau bagian atas layar untuk berpindah tab sangat melelahkan. Menempatkan tab utama di bagian bawah membuat perpindahan antar *Armada, Transaksi, Pelanggan, Tarif, Pengeluaran,* dan *Laporan* sangat nyaman dengan ibu jari.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Diagram Arsitektur Tata Letak & Komponen**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        HEADER ATAS BERSIH (56px-64px)                      │
│  [🛵 Ai Rent · Buku 2026]     [Tab Navigasi Desktop]     [Cari] [+ Sewa] [☰]│
└──────────────────────────────────────────────────────────────┬─────────────┘
                                                               │
                                   ┌───────────────────────────▼─────────────┐
                                   │     MENU PENGATURAN & ALAT (POPOVER)    │
                                   │ • Google Sheets & Cloud Sync (Status)   │
                                   │ • Hosting GitHub & Monitor Actions      │
                                   │ • QR Code Pesanan HP & Chat WA CS       │
                                   │ • Portal Link Investor & Tahun Buku     │
                                   │ • Kelola Master Armada & Reset Data     │
                                   └─────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────┐
│                         VIEWPORT UTAMA OPERASIONAL                         │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ RINGKASAN KOMPAK ARMADA (1 Baris KPI + Inklusi + Filter Status)      │  │
│  │ [Total: 13] [Tersedia] [Disewa] [Overdue]   [Tabel Padat | Kartu]    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TABEL / DAFTAR PADAT 13 UNIT ARMADA (Satu Layar Terlihat Sekaligus)  │  │
│  │ ──────────────────────────────────────────────────────────────────── │  │
│  │ [Nopol] [Unit & Spek] [Status] [Penyewa & Jam Kembali]  [Aksi Cepat] │  │
│  │  N 2168 AAN · Beat     Disewa   Budi · 21 Okt 14:00     [Check-Out]  │  │
│  │  N 3291 AAB · Vario    Tersedia Siap disewakan          [+ Sewa]     │  │
│  │  ... (Seluruh 13 unit tersaji padat & responsif)                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────┐
│               BILAH NAVIGASI BAWAH HP (MOBILE THUMB-ZONE BAR)              │
│   [🛵 Armada]  [📋 Transaksi]  [⭐ Pelanggan]  [🏷️ Tarif]  [🔧 Biaya] [📊 Laba]│
└────────────────────────────────────────────────────────────────────────────┘
```

- **Pemetaan Interaksi & State Komponen**:
  - **Menu Pengaturan & Alat (`isToolsMenuOpen`)**: Mengelola pembukaan/penutupan panel menu terpusat di kanan atas (dengan dukungan klik di luar area / tombol `Esc` untuk menutup otomatis), dan meneruskan aksi ke modal yang sudah ada (*Google Sheets & Cloud*, *Hosting GitHub*, *QR Pesanan*, *Link Investor*, *Kelola Armada*, *Pergantian Tahun Buku*, *Install PWA*, dan *Reset Data*).
  - **Pengalih Mode Tampilan Armada (`viewMode: 'compact' | 'cards'`)**: Disimpan secara persisten di `localStorage` (dengan *default* `'compact'`) sehingga preferensi tampilan padat pilihan admin selalu diingat.
  - **Aksi Baris Satu Tangan**: Di dalam mode Tabel Padat pada layar HP maupun desktop, setiap baris menampilkan informasi kunci di sisi kiri dan tombol aksi utama (`Sewa`, `Check-In`, `Check-Out`) beserta tombol konteks (`WA`, `Servis`, `Edit`) di sisi kanan dengan ukuran target sentuh ergonomis.
