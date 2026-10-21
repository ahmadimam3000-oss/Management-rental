import type { MotorMaster, TarifAcuan, TransaksiSewa, PengeluaranMotor, FrequentRenter } from '../types/rental.ts';

export const INITIAL_FLEET: MotorMaster[] = [
  { no: 1, namaUnit: "BEAT 1", nopol: "L 2054 C", tipeMotor: "Honda Beat", status: "Disewa", tahun: 2022, warna: "Hitam Glossy", kilometer: 24350 },
  { no: 2, namaUnit: "BEAT 2", nopol: "N 4849 ACC", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2023, warna: "Merah Hitam", kilometer: 18420 },
  { no: 3, namaUnit: "BEAT 3", nopol: "N 6836 TDV", tipeMotor: "Honda Beat", status: "Disewa", tahun: 2023, warna: "Biru Putih", kilometer: 19100 },
  { no: 4, namaUnit: "BEAT 4", nopol: "N 3575 VAS", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2022, warna: "Hitam Doff", kilometer: 28900 },
  { no: 5, namaUnit: "BEAT 5", nopol: "N 4961 EDF", tipeMotor: "Honda Beat", status: "Overdue", tahun: 2023, warna: "Silver Doff", kilometer: 16750 },
  { no: 6, namaUnit: "BEAT 6", nopol: "W 6365 NDT", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2024, warna: "Putih", kilometer: 9800 },
  { no: 7, namaUnit: "FAZIO", nopol: "S 4616 NBQ", tipeMotor: "Yamaha Fazzio", status: "Disewa", tahun: 2023, warna: "Tosca / Neo Cyan", kilometer: 15300 },
  { no: 8, namaUnit: "FAZIO M 1", nopol: "N 3711 VAJ", tipeMotor: "Yamaha Fazzio", status: "Booking", tahun: 2023, warna: "Hitam Neo", kilometer: 14200 },
  { no: 9, namaUnit: "FAZIO M 2", nopol: "P 2409 BO", tipeMotor: "Yamaha Fazzio", status: "Tersedia", tahun: 2023, warna: "Merah Neo", kilometer: 17800 },
  { no: 10, namaUnit: "FAZIO M 3", nopol: "L 6312 ABH", tipeMotor: "Yamaha Fazzio", status: "Tersedia", tahun: 2024, warna: "Putih Mutiara", kilometer: 8900 },
  { no: 11, namaUnit: "SCOPY 1", nopol: "N 3541 EDB", tipeMotor: "Honda Scoopy", status: "Disewa", tahun: 2023, warna: "Prestige White", kilometer: 21400 },
  { no: 12, namaUnit: "SCOPY 2", nopol: "P 5564 MI", tipeMotor: "Honda Scoopy", status: "Tersedia", tahun: 2022, warna: "Fashion Brown", kilometer: 26100 },
  { no: 13, namaUnit: "MIO J", nopol: "N 5540 GH", tipeMotor: "Yamaha Mio J", status: "Tersedia", tahun: 2020, warna: "Hitam Merah", kilometer: 42100 }
];

export const TARIF_STANDAR: TarifAcuan[] = [
  {
    tipeMotor: "Yamaha Mio J",
    mhsMalang24Jam: 45000,
    luarMalang24Jam: 60000,
    paketMinggu: 350000,
    paketBulan: 1100000
  },
  {
    tipeMotor: "Honda Beat",
    mhsMalang24Jam: 55000,
    luarMalang24Jam: 70000,
    paketMinggu: 350000,
    paketBulan: 1100000
  },
  {
    tipeMotor: "Honda Scoopy",
    mhsMalang24Jam: 65000,
    luarMalang24Jam: 80000,
    paketMinggu: 350000,
    paketBulan: 1100000
  },
  {
    tipeMotor: "Yamaha Fazzio",
    mhsMalang24Jam: 65000,
    luarMalang24Jam: 80000,
    paketMinggu: 350000,
    paketBulan: 1100000
  }
];

export const INITIAL_TRANSACTIONS: TransaksiSewa[] = [
  {
    id: "TRX-2026-001",
    namaPenyewa: "Dimas Arya Pratama",
    whatsapp: "6281234567890",
    alamatAsalKos: "Kos Putra Sigura-gura Gg. 3 No. 12, Lowokwaru",
    identitasDijaminkan: "KTM (Kartu Tanda Mahasiswa)",
    nopolMotor: "L 2054 C",
    kategoriPelanggan: "Mhs Malang",
    hariSewa: "Senin",
    waktuStartSewa: "2026-10-19T08:30:00",
    lamaSewaHari: 3,
    estWaktuKembali: "2026-10-22T08:30:00",
    hargaPerHari: 55000,
    totalPemasukan: 165000,
    statusBayar: "Lunas",
    metodePembayaran: "QRIS",
    statusUnit: "Disewa",
    jumlahHelm: "2",
    levelBensin: "3 Kotak",
    catatanJaminanTambahan: "Helm 2 pcs (INK Hitam + Bogo)"
  },
  {
    id: "TRX-2026-002",
    namaPenyewa: "Sarah Amelia",
    whatsapp: "6282198765432",
    alamatAsalKos: "Hotel Santika Premiere, Jl. Letjen Sutoyo No. 79",
    identitasDijaminkan: "KTP Asli",
    nopolMotor: "S 4616 NBQ",
    kategoriPelanggan: "Luar Malang / Wisatawan",
    hariSewa: "Minggu",
    waktuStartSewa: "2026-10-18T14:00:00",
    lamaSewaHari: 4,
    estWaktuKembali: "2026-10-22T14:00:00",
    hargaPerHari: 80000,
    totalPemasukan: 320000,
    statusBayar: "Lunas",
    metodePembayaran: "Transfer BRI",
    statusUnit: "Disewa",
    jumlahHelm: "2",
    levelBensin: "Full Kotak",
    catatanJaminanTambahan: "Wisata Bromo & Batu. Helm 2 pcs + Holder HP dipasang"
  },
  {
    id: "TRX-2026-003",
    namaPenyewa: "Bagus Wicaksono",
    whatsapp: "6285712344321",
    alamatAsalKos: "Kos Graha Dewandaru Kav. 4B, Jatimulyo",
    identitasDijaminkan: "SIM C + KTP",
    nopolMotor: "N 6836 TDV",
    kategoriPelanggan: "Mhs Malang",
    hariSewa: "Sabtu",
    waktuStartSewa: "2026-10-17T10:00:00",
    lamaSewaHari: 5,
    estWaktuKembali: "2026-10-22T10:00:00",
    hargaPerHari: 55000,
    totalPemasukan: 275000,
    statusBayar: "Lunas",
    metodePembayaran: "Tunai",
    statusUnit: "Disewa",
    jumlahHelm: "1",
    levelBensin: "2 Kotak",
    catatanJaminanTambahan: "Helm 1 pc + Kunci Gembok Cakram"
  },
  {
    id: "TRX-2026-004",
    namaPenyewa: "Fathur Rohman",
    whatsapp: "6281356789900",
    alamatAsalKos: "Jl. Bendungan Sutami No. 15A, Sumbersari",
    identitasDijaminkan: "KTM (Kartu Tanda Mahasiswa)",
    nopolMotor: "N 4961 EDF",
    kategoriPelanggan: "Mhs Malang",
    hariSewa: "Jumat",
    waktuStartSewa: "2026-10-16T09:00:00",
    lamaSewaHari: 3,
    estWaktuKembali: "2026-10-19T09:00:00", // Telat / Overdue!
    hargaPerHari: 55000,
    totalPemasukan: 165000,
    statusBayar: "Lunas",
    metodePembayaran: "Tunai",
    statusUnit: "Overdue",
    jumlahHelm: "1",
    levelBensin: "1 Kotak",
    catatanJaminanTambahan: "KTM UB Malang. Belum konfirmasi perpanjangan, sudah lewat jadwal kembali."
  },
  {
    id: "TRX-2026-005",
    namaPenyewa: "Nadia Kusuma",
    whatsapp: "6287711223344",
    alamatAsalKos: "Ibis Styles Hotel, Jl. S. Parman Malang",
    identitasDijaminkan: "KTP Asli",
    nopolMotor: "N 3541 EDB",
    kategoriPelanggan: "Luar Malang / Wisatawan",
    hariSewa: "Selasa",
    waktuStartSewa: "2026-10-20T07:30:00",
    lamaSewaHari: 2,
    estWaktuKembali: "2026-10-22T07:30:00",
    hargaPerHari: 80000,
    totalPemasukan: 160000,
    statusBayar: "Lunas",
    metodePembayaran: "QRIS",
    statusUnit: "Disewa",
    jumlahHelm: "2",
    levelBensin: "4 Kotak",
    catatanJaminanTambahan: "KTP Jakarta Selatan. Helm 2 pcs Retro Cream"
  },
  {
    id: "TRX-2026-006",
    namaPenyewa: "Rizki Hidayat",
    whatsapp: "6289655443322",
    alamatAsalKos: "Stasiun Kotabaru Malang (Booking Kereta Jam 14:00)",
    identitasDijaminkan: "KTP Asli",
    nopolMotor: "N 3711 VAJ",
    kategoriPelanggan: "Luar Malang / Wisatawan",
    hariSewa: "Rabu",
    waktuStartSewa: "2026-10-21T14:00:00",
    lamaSewaHari: 3,
    estWaktuKembali: "2026-10-24T14:00:00",
    hargaPerHari: 80000,
    totalPemasukan: 240000,
    statusBayar: "DP / Sebagian",
    metodePembayaran: "Transfer BRI",
    statusUnit: "Booking",
    jumlahHelm: "2",
    levelBensin: "3 Kotak",
    catatanJaminanTambahan: "DP Rp 100.000 via Transfer BRI 603201007355508 An Ahmad imam makhali. Unit minta diantar ke Stasiun Kotabaru."
  },
  {
    id: "TRX-2026-007",
    namaPenyewa: "Agus Prasetyo",
    whatsapp: "6282244668800",
    alamatAsalKos: "Kos Green House, Jl. Kerto Raharjo, Ketawanggede",
    identitasDijaminkan: "KTM (Kartu Tanda Mahasiswa)",
    nopolMotor: "W 6365 NDT",
    kategoriPelanggan: "Mhs Malang",
    hariSewa: "Kamis",
    waktuStartSewa: "2026-10-15T13:00:00",
    lamaSewaHari: 4,
    estWaktuKembali: "2026-10-19T13:00:00",
    waktuSelesai: "2026-10-19T12:45:00",
    hargaPerHari: 55000,
    totalPemasukan: 220000,
    statusBayar: "Lunas",
    metodePembayaran: "Tunai",
    statusUnit: "Selesai",
    jumlahHelm: "1",
    levelBensin: "Full Kotak",
    catatanJaminanTambahan: "Dikembalikan tepat waktu, bensin penuh kembali, kondisi mulus."
  },
  {
    id: "TRX-2026-008",
    namaPenyewa: "Jessica Tanuwijaya",
    whatsapp: "6281133445566",
    alamatAsalKos: "Apartemen Begawan, Jl. Raya Tlogomas",
    identitasDijaminkan: "KTP Asli",
    nopolMotor: "P 5564 MI",
    kategoriPelanggan: "Paket Mingguan",
    hariSewa: "Senin",
    waktuStartSewa: "2026-10-12T10:00:00",
    lamaSewaHari: 7,
    estWaktuKembali: "2026-10-19T10:00:00",
    waktuSelesai: "2026-10-19T09:30:00",
    hargaPerHari: 50000, // Paket Mingguan Rp 350.000 / 7 = 50.000/hari
    totalPemasukan: 350000,
    statusBayar: "Lunas",
    metodePembayaran: "Transfer BRI",
    statusUnit: "Selesai",
    jumlahHelm: "2",
    levelBensin: "5 Kotak",
    catatanJaminanTambahan: "Paket 1 Minggu. Unit bersih kembali."
  },
  {
    id: "TRX-2026-009",
    namaPenyewa: "Kurniawan Dwi",
    whatsapp: "6285233669911",
    alamatAsalKos: "Jl. MT Haryono No. 193, Dinoyo",
    identitasDijaminkan: "SIM C + KTP",
    nopolMotor: "N 5540 GH",
    kategoriPelanggan: "Mhs Malang",
    hariSewa: "Jumat",
    waktuStartSewa: "2026-10-09T08:00:00",
    lamaSewaHari: 6,
    estWaktuKembali: "2026-10-15T08:00:00",
    waktuSelesai: "2026-10-15T07:50:00",
    hargaPerHari: 45000,
    totalPemasukan: 270000,
    statusBayar: "Lunas",
    metodePembayaran: "QRIS",
    statusUnit: "Selesai",
    jumlahHelm: "0",
    levelBensin: "2 Kotak",
    catatanJaminanTambahan: "Unit Mio J lancar, rem pakem."
  },
  {
    id: "TRX-2025-081",
    namaPenyewa: "Alifia Zahra",
    whatsapp: "6281299887766",
    alamatAsalKos: "Jl. Gajayana No. 28, Dinoyo",
    identitasDijaminkan: "KTM (Kartu Tanda Mahasiswa)",
    nopolMotor: "N 4849 ACC",
    kategoriPelanggan: "Mhs Malang",
    hariSewa: "Kamis",
    waktuStartSewa: "2025-11-13T09:00:00",
    lamaSewaHari: 4,
    estWaktuKembali: "2025-11-17T09:00:00",
    waktuSelesai: "2025-11-17T08:45:00",
    hargaPerHari: 55000,
    totalPemasukan: 220000,
    statusBayar: "Lunas",
    statusUnit: "Selesai",
    jumlahHelm: "1",
    levelBensin: "3 Kotak",
    catatanJaminanTambahan: "Rental tahun 2025 lancar"
  },
  {
    id: "TRX-2025-082",
    namaPenyewa: "Michael Wicaksono",
    whatsapp: "6281344556677",
    alamatAsalKos: "Whiz Prime Hotel Basuki Rahmat",
    identitasDijaminkan: "KTP Asli",
    nopolMotor: "L 6312 ABH",
    kategoriPelanggan: "Luar Malang / Wisatawan",
    hariSewa: "Jumat",
    waktuStartSewa: "2025-12-19T10:00:00",
    lamaSewaHari: 5,
    estWaktuKembali: "2025-12-24T10:00:00",
    waktuSelesai: "2025-12-24T09:30:00",
    hargaPerHari: 80000,
    totalPemasukan: 400000,
    statusBayar: "Lunas",
    statusUnit: "Selesai",
    jumlahHelm: "2",
    levelBensin: "Full Kotak",
    catatanJaminanTambahan: "Liburan akhir tahun di Batu Malang"
  },
  {
    id: "TRX-2025-083",
    namaPenyewa: "Eko Prasetyo",
    whatsapp: "6285611223344",
    alamatAsalKos: "Kos Sigura-gura Barat",
    identitasDijaminkan: "SIM C + KTP",
    nopolMotor: "N 3575 VAS",
    kategoriPelanggan: "Paket Mingguan",
    hariSewa: "Senin",
    waktuStartSewa: "2025-10-06T08:00:00",
    lamaSewaHari: 7,
    estWaktuKembali: "2025-10-13T08:00:00",
    waktuSelesai: "2025-10-13T07:45:00",
    hargaPerHari: 50000,
    totalPemasukan: 350000,
    statusBayar: "Lunas",
    statusUnit: "Selesai",
    jumlahHelm: "1",
    levelBensin: "4 Kotak",
    catatanJaminanTambahan: "Paket seminggu KKN"
  }
];

export const INITIAL_EXPENSES: PengeluaranMotor[] = [
  {
    id: "EXP-2026-001",
    tanggal: "2026-10-10T14:30:00",
    nopolMotor: "L 2054 C",
    kategoriBiaya: "Service Rutin & Oli",
    nominal: 85000,
    keteranganBengkel: "AHASS Merjosari - Ganti Oli MPX2 + Cek Rem Depan",
    penanggungJawab: "Mas Bambang (Admin Bengkel)"
  },
  {
    id: "EXP-2026-002",
    tanggal: "2026-10-12T11:00:00",
    nopolMotor: "S 4616 NBQ",
    kategoriBiaya: "Service Rutin & Oli",
    nominal: 95000,
    keteranganBengkel: "Yamaha SIP Malang - Ganti Oli Yamalube Power Matic",
    penanggungJawab: "Rian (Staff Armada)"
  },
  {
    id: "EXP-2026-003",
    tanggal: "2026-10-14T16:00:00",
    nopolMotor: "N 3541 EDB",
    kategoriBiaya: "Sparepart & Ban",
    nominal: 245000,
    keteranganBengkel: "Planet Ban Soekarno Hatta - Ganti Ban Belakang Tubeless Planeto",
    penanggungJawab: "Mas Bambang (Admin Bengkel)"
  },
  {
    id: "EXP-2026-004",
    tanggal: "2026-10-17T09:15:00",
    nopolMotor: "W 6365 NDT",
    kategoriBiaya: "Cuci Motor",
    nominal: 20000,
    keteranganBengkel: "Cuci Motor Salju 'Bersih Kilat' Dinoyo",
    penanggungJawab: "Rian (Staff Armada)"
  },
  {
    id: "EXP-2026-005",
    tanggal: "2026-10-05T10:00:00",
    nopolMotor: "N 5540 GH",
    kategoriBiaya: "Pajak & STNK",
    nominal: 220000,
    keteranganBengkel: "Samsat Malang Kota - Perpanjangan Pajak Tahunan",
    penanggungJawab: "Owner Rental"
  },
  {
    id: "EXP-2026-006",
    tanggal: "2026-10-18T17:00:00",
    nopolMotor: "P 5564 MI",
    kategoriBiaya: "Cuci Motor",
    nominal: 20000,
    keteranganBengkel: "Cuci Salju + Semir Ban",
    penanggungJawab: "Rian (Staff Armada)"
  },
  {
    id: "EXP-2025-045",
    tanggal: "2025-11-15T10:00:00",
    nopolMotor: "N 4849 ACC",
    kategoriBiaya: "Service Rutin & Oli",
    nominal: 80000,
    keteranganBengkel: "AHASS Dinoyo - Servis berkala 2025",
    penanggungJawab: "Mas Bambang"
  },
  {
    id: "EXP-2025-046",
    tanggal: "2025-12-20T14:00:00",
    nopolMotor: "L 6312 ABH",
    kategoriBiaya: "Cuci Motor",
    nominal: 18000,
    keteranganBengkel: "Cuci Salju Dinoyo",
    penanggungJawab: "Rian"
  }
];

export const INITIAL_FREQUENT_RENTERS: FrequentRenter[] = [
  {
    id: "CUST-001",
    nama: "Dimas Arya Pratama",
    whatsapp: "6281234567890",
    alamat: "Kos Putra Sigura-gura Gg. 3 No. 12, Lowokwaru",
    identitasDefault: "KTM (Kartu Tanda Mahasiswa)",
    kategoriDefault: "Mhs Malang",
    totalRentals: 6,
    totalSpent: 980000,
    ratingTrust: 5,
    lastRentalDate: "2026-10-19T08:30:00",
    catatanKhusus: "Mahasiswa Teknik UB. Selalu tepat waktu dan mengembalikan motor dalam keadaan bersih."
  },
  {
    id: "CUST-002",
    nama: "Sarah Amelia",
    whatsapp: "6282198765432",
    alamat: "Hotel Santika Premiere, Jl. Letjen Sutoyo No. 79 (Asal Jakarta)",
    identitasDefault: "KTP Asli",
    kategoriDefault: "Luar Malang / Wisatawan",
    totalRentals: 5,
    totalSpent: 1600000,
    ratingTrust: 5,
    lastRentalDate: "2026-10-18T14:00:00",
    catatanKhusus: "Travel blogger & fotografer rutin ke Bromo & Batu. Langganan Fazzio Tosca."
  },
  {
    id: "CUST-003",
    nama: "Jessica Tanuwijaya",
    whatsapp: "6281133445566",
    alamat: "Apartemen Begawan, Jl. Raya Tlogomas Kav. 8",
    identitasDefault: "KTP Asli",
    kategoriDefault: "Paket Mingguan",
    totalRentals: 4,
    totalSpent: 1400000,
    ratingTrust: 5,
    lastRentalDate: "2026-10-12T10:00:00",
    catatanKhusus: "Penyewa paket mingguan loyal. Selalu bayar lunas di depan via BCA."
  },
  {
    id: "CUST-004",
    nama: "Bagus Wicaksono",
    whatsapp: "6285712344321",
    alamat: "Kos Graha Dewandaru Kav. 4B, Jatimulyo",
    identitasDefault: "SIM C + KTP",
    kategoriDefault: "Mhs Malang",
    totalRentals: 4,
    totalSpent: 715000,
    ratingTrust: 5,
    lastRentalDate: "2026-10-17T10:00:00",
    catatanKhusus: "Mahasiswa UM. Sering rental Honda Beat untuk kegiatan organisasi kampus."
  },
  {
    id: "CUST-005",
    nama: "Kurniawan Dwi",
    whatsapp: "6285233669911",
    alamat: "Jl. MT Haryono No. 193, Dinoyo",
    identitasDefault: "SIM C + KTP",
    kategoriDefault: "Mhs Malang",
    totalRentals: 3,
    totalSpent: 540000,
    ratingTrust: 4,
    lastRentalDate: "2026-10-09T08:00:00",
    catatanKhusus: "Mahasiswa UIN Malang. Biasa sewa Mio J atau Beat harian."
  },
  {
    id: "CUST-006",
    nama: "Nadia Kusuma",
    whatsapp: "6287711223344",
    alamat: "Ibis Styles Hotel, Jl. S. Parman Malang (Asal Surabaya)",
    identitasDefault: "KTP Asli",
    kategoriDefault: "Luar Malang / Wisatawan",
    totalRentals: 3,
    totalSpent: 480000,
    ratingTrust: 5,
    lastRentalDate: "2026-10-20T07:30:00",
    catatanKhusus: "Dinas perbankan rutin setiap bulan di Malang. Mengutamakan Scoopy/Fazzio."
  }
];

export const GOOGLE_APPS_SCRIPT_SOURCE = `/**
 * System Manajemen Rental Motor & Keuangan (13 Fleet Unit)
 * Version: Auto-Day Name, Full Tenant Identity, Flexible Pricing & ADR Analysis
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛵 Rental & Keuangan')
    .addItem('🚀 Inisialisasi Database Rental (13 Motor)', 'setupRentalDatabase')
    .addItem('📲 Check-In Unit (Baris Aktif)', 'checkInActiveRow')
    .addItem('🏁 Check-Out Unit (Baris Aktif)', 'checkOutActiveRow')
    .addItem('🔄 Refresh Laporan Bulanan', 'refreshMonthlyReport')
    .addSeparator()
    .addItem('📅 Pergantian Tahun: Otomatis Rekap & Buat Baru', 'prosesPergantianTahunBaru')
    .addToUi();

  cekPergantianTahunOtomatis();
}

function setupRentalDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Master Motor & Acuan Tarif
  let sheetMaster = ss.getSheetByName('Master_Motor') || ss.insertSheet('Master_Motor');
  setupMasterMotor(sheetMaster);

  // 2. Sheet Transaksi Sewa (Pemasukan & Data Penyewa + Hari)
  let sheetTransaksi = ss.getSheetByName('Transaksi_Sewa') || ss.insertSheet('Transaksi_Sewa');
  setupTransaksiSewa(sheetTransaksi);

  // 3. Sheet Pengeluaran Unit
  let sheetPengeluaran = ss.getSheetByName('Pengeluaran_Motor') || ss.insertSheet('Pengeluaran_Motor');
  setupPengeluaran(sheetPengeluaran);

  // 4. Sheet Laporan Bulanan & Rata-Rata Harga
  let sheetLaporan = ss.getSheetByName('Laporan_Performa_Motor') || ss.insertSheet('Laporan_Performa_Motor');
  setupLaporanPerforma(sheetLaporan);

  SpreadsheetApp.getUi().alert('✅ Database Rental dengan Kolom Hari Otomatis Berhasil Disiapkan!');
}

function setupMasterMotor(sheet) {
  sheet.clear();
  sheet.getRange("A1:E1").merge().setValue("🛵 DATABASE MASTER UNIT MOTOR (13 FLEET)")
       .setFontSize(14).setFontWeight("bold").setBackground("#1f4e78").setFontColor("#ffffff")
       .setHorizontalAlignment("center");

  const headers = [["No", "Nama Unit", "Nopol (Plat Nomor)", "Tipe Motor", "Status Unit"]];
  const motorData = [
    [1, "BEAT 1", "L 2054 C", "Honda Beat", "Tersedia"],
    [2, "BEAT 2", "N 4849 ACC", "Honda Beat", "Tersedia"],
    [3, "BEAT 3", "N 6836 TDV", "Honda Beat", "Tersedia"],
    [4, "BEAT 4", "N 3575 VAS", "Honda Beat", "Tersedia"],
    [5, "BEAT 5", "N 4961 EDF", "Honda Beat", "Tersedia"],
    [6, "BEAT 6", "W 6365 NDT", "Honda Beat", "Tersedia"],
    [7, "FAZIO", "S 4616 NBQ", "Yamaha Fazzio", "Tersedia"],
    [8, "FAZIO M 1", "N 3711 VAJ", "Yamaha Fazzio", "Tersedia"],
    [9, "FAZIO M 2", "P 2409 BO", "Yamaha Fazzio", "Tersedia"],
    [10, "FAZIO M 3", "L 6312 ABH", "Yamaha Fazzio", "Tersedia"],
    [11, "SCOPY 1", "N 3541 EDB", "Honda Scoopy", "Tersedia"],
    [12, "SCOPY 2", "P 5564 MI", "Honda Scoopy", "Tersedia"],
    [13, "MIO J", "N 5540 GH", "Yamaha Mio J", "Tersedia"]
  ];

  sheet.getRange(3, 1, 1, 5).setValues(headers).setFontWeight("bold").setBackground("#d9e1f2").setHorizontalAlignment("center");
  sheet.getRange(4, 1, motorData.length, 5).setValues(motorData);
  sheet.getRange(3, 1, motorData.length + 1, 5).setBorder(true, true, true, true, true, true);

  // TABEL ACUAN TARIF SEWA
  sheet.getRange("G1:K1").merge().setValue("💵 TABEL ACUAN TARIF SEWA STANDAR")
       .setFontSize(12).setFontWeight("bold").setBackground("#2e75b6").setFontColor("#ffffff")
       .setHorizontalAlignment("center");

  const tarifHeaders = [["Tipe Motor", "Mhs Malang / 24Jam", "Luar Malang / Wisatawan", "Paket 1 Minggu", "Paket 1 Bulan"]];
  const tarifData = [
    ["Yamaha Mio J", 45000, 60000, 350000, 1100000],
    ["Honda Beat", 55000, 70000, 350000, 1100000],
    ["Honda Scoopy", 65000, 80000, 350000, 1100000],
    ["Yamaha Fazzio", 65000, 80000, 350000, 1100000]
  ];

  sheet.getRange(3, 7, 1, 5).setValues(tarifHeaders).setFontWeight("bold").setBackground("#d9e1f2").setHorizontalAlignment("center");
  sheet.getRange(4, 7, tarifData.length, 5).setValues(tarifData);
  sheet.getRange("H4:K7").setNumberFormat("Rp#,##0");
  sheet.getRange(3, 7, tarifData.length + 1, 5).setBorder(true, true, true, true, true, true);

  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(7, 130);
  sheet.setColumnWidth(8, 150);
  sheet.setColumnWidth(9, 170);
  sheet.setColumnWidth(10, 140);
  sheet.setColumnWidth(11, 140);
}

function setupTransaksiSewa(sheet) {
  sheet.clear();
  sheet.getRange("A1:Q1").merge().setValue("📋 CATATAN TRANSAKSI SEWA & IDENTITAS PENYEWA")
       .setFontSize(14).setFontWeight("bold").setBackground("#2e75b6").setFontColor("#ffffff")
       .setHorizontalAlignment("center");

  const headers = [[
    "ID Transaksi", 
    "Nama Penyewa", 
    "No. WhatsApp / Kontak", 
    "Alamat Asal / Kos", 
    "Identitas Dijaminkan", 
    "Nopol Motor", 
    "Kategori Pelanggan",
    "Hari Sewa", 
    "Waktu Start Sewa", 
    "Lama Sewa (Hari)", 
    "Est. Waktu Kembali", 
    "Harga / Hari (Rp)", 
    "Total Pemasukan (Rp)", 
    "Status Bayar", 
    "Status Unit", 
    "Catatan / Jaminan Tambahan"
  ]];
  
  sheet.getRange(3, 1, 1, 16).setValues(headers).setFontWeight("bold").setBackground("#d9e1f2").setHorizontalAlignment("center");

  // Format Kolom
  sheet.getRange("I4:I100").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.getRange("K4:K100").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.getRange("L4:M100").setNumberFormat("Rp#,##0");

  for (let i = 4; i <= 100; i++) {
    // Formula Hari Otomatis berdasarkan Waktu Start Sewa
    sheet.getRange(\`H\${i}\`).setFormula(\`=IF(I\${i}<>"", TEXT(I\${i}, "dddd"), "")\`);
    // Formula Est. Waktu Kembali = Start Sewa + Lama Sewa
    sheet.getRange(\`K\${i}\`).setFormula(\`=IF(AND(I\${i}<>"", J\${i}<>""), I\${i}+J\${i}, "")\`);
    // Formula Total Pemasukan = Lama Sewa * Harga per Hari
    sheet.getRange(\`M\${i}\`).setFormula(\`=IF(AND(J\${i}<>"", L\${i}<>""), J\${i}*L\${i}, "")\`);
  }

  sheet.getRange(3, 1, 100, 16).setBorder(true, true, true, true, true, true);

  // Dropdown Nopol (Kolom F - Indeks 6)
  const ruleNopol = SpreadsheetApp.newDataValidation().requireValueInRange(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master_Motor').getRange("C4:C16")
  ).build();
  sheet.getRange("F4:F100").setDataValidation(ruleNopol);

  // Dropdown Kategori Pelanggan (Kolom G)
  const ruleKategori = SpreadsheetApp.newDataValidation().requireValueInList([
    'Mhs Malang', 
    'Luar Malang / Wisatawan', 
    'Paket Mingguan', 
    'Paket Bulanan'
  ]).build();
  sheet.getRange("G4:G100").setDataValidation(ruleKategori);

  // Dropdown Identitas Dijaminkan (Kolom E)
  const ruleIdentitas = SpreadsheetApp.newDataValidation().requireValueInList([
    'KTP Asli', 
    'KTM (Kartu Tanda Mahasiswa)', 
    'SIM C + KTP', 
    'Paspor / KITAS', 
    'Lainnya'
  ]).build();
  sheet.getRange("E4:E100").setDataValidation(ruleIdentitas);

  // Dropdown Status Unit (Kolom O)
  const ruleStatus = SpreadsheetApp.newDataValidation().requireValueInList(['Disewa', 'Selesai', 'Booking', 'Overdue']).build();
  sheet.getRange("O4:O100").setDataValidation(ruleStatus);
  
  sheet.setColumnWidth(2, 140); // Nama Penyewa
  sheet.setColumnWidth(3, 140); // No HP
  sheet.setColumnWidth(4, 160); // Alamat
  sheet.setColumnWidth(5, 150); // Identitas
  sheet.setColumnWidth(8, 110); // Hari
  sheet.setColumnWidth(9, 190); // Waktu Start
  sheet.setColumnWidth(11, 190); // Waktu Kembali
  sheet.setColumnWidth(12, 140); // Harga
}

function setupPengeluaran(sheet) {
  sheet.clear();
  sheet.getRange("A1:F1").merge().setValue("🔧 CATATAN PENGELUARAN & OPERASIONAL MOTOR")
       .setFontSize(14).setFontWeight("bold").setBackground("#c55a11").setFontColor("#ffffff")
       .setHorizontalAlignment("center");

  const headers = [["Tanggal", "Nopol Motor", "Kategori Biaya", "Nominal (Rp)", "Keterangan / Bengkel", "Penanggung Jawab"]];
  sheet.getRange(3, 1, 1, 6).setValues(headers).setFontWeight("bold").setBackground("#fce4d6").setHorizontalAlignment("center");

  sheet.getRange("D4:D100").setNumberFormat("Rp#,##0");
  sheet.getRange("A4:A100").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.getRange(3, 1, 100, 6).setBorder(true, true, true, true, true, true);

  const ruleNopol = SpreadsheetApp.newDataValidation().requireValueInRange(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master_Motor').getRange("C4:C16")
  ).build();
  sheet.getRange("B4:B100").setDataValidation(ruleNopol);
}

function setupLaporanPerforma(sheet) {
  sheet.clear();
  sheet.getRange("A1:P1").merge().setValue("📊 LAPORAN PENDAPATAN BERSIH & RATA-RATA HARGA SEWA PER MOTOR")
       .setFontSize(15).setFontWeight("bold").setBackground("#1f4e78").setFontColor("#ffffff")
       .setHorizontalAlignment("center");

  const headers = [["No", "Nama Unit", "Nopol", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des", "Rata2 Harga Sewa / Hari (ADR)"]];
  sheet.getRange(3, 1, 1, 16).setValues(headers).setFontWeight("bold").setBackground("#d9e1f2").setHorizontalAlignment("center");

  const motorData = [
    [1, "BEAT 1", "L 2054 C"],
    [2, "BEAT 2", "N 4849 ACC"],
    [3, "BEAT 3", "N 6836 TDV"],
    [4, "BEAT 4", "N 3575 VAS"],
    [5, "BEAT 5", "N 4961 EDF"],
    [6, "BEAT 6", "W 6365 NDT"],
    [7, "FAZIO", "S 4616 NBQ"],
    [8, "FAZIO M 1", "N 3711 VAJ"],
    [9, "FAZIO M 2", "P 2409 BO"],
    [10, "FAZIO M 3", "L 6312 ABH"],
    [11, "SCOPY 1", "N 3541 EDB"],
    [12, "SCOPY 2", "P 5564 MI"],
    [13, "MIO J", "N 5540 GH"]
  ];

  sheet.getRange(4, 1, motorData.length, 3).setValues(motorData);

  const year = new Date().getFullYear();
  for (let r = 0; r < motorData.length; r++) {
    let row = r + 4;
    let nopolCell = \`C\${row}\`;
    
    for (let col = 4; col <= 15; col++) {
      let month = col - 3;
      let nextMonth = month === 12 ? 1 : month + 1;
      let nextYear = month === 12 ? year + 1 : year;

      let formula = \`=SUMIFS(Transaksi_Sewa!M$4:M, Transaksi_Sewa!F$4:F, \${nopolCell}, Transaksi_Sewa!I$4:I, ">="&DATE(\${year},\${month},1), Transaksi_Sewa!I$4:I, "<"&DATE(\${nextYear},\${nextMonth},1)) - SUMIFS(Pengeluaran_Motor!D$4:D, Pengeluaran_Motor!B$4:B, \${nopolCell}, Pengeluaran_Motor!A$4:A, ">="&DATE(\${year},\${month},1), Pengeluaran_Motor!A$4:A, "<"&DATE(\${nextYear},\${nextMonth},1))\`;
      sheet.getRange(row, col).setFormula(formula);
    }

    let adrFormula = \`=IFERROR(AVERAGEIFS(Transaksi_Sewa!L$4:L, Transaksi_Sewa!F$4:F, \${nopolCell}), 0)\`;
    sheet.getRange(row, 16).setFormula(adrFormula);
  }

  sheet.getRange(17, 1, 1, 3).merge().setValue("TOTAL PENDAPATAN KESELURUHAN").setFontWeight("bold").setHorizontalAlignment("right");
  for (let col = 4; col <= 15; col++) {
    let colLetter = String.fromCharCode(64 + col);
    sheet.getRange(17, col).setFormula(\`=SUM(\${colLetter}4:\${colLetter}16)\`).setFontWeight("bold");
  }

  sheet.getRange(17, 16).setFormula(\`=AVERAGE(P4:P16)\`).setFontWeight("bold");

  sheet.getRange("D4:P17").setNumberFormat("Rp#,##0");
  sheet.getRange(3, 1, 15, 16).setBorder(true, true, true, true, true, true);
  sheet.getRange("A17:P17").setBackground("#fff2cc");
  sheet.setColumnWidth(16, 230);
}

function checkInActiveRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  if (sheet.getName() !== 'Transaksi_Sewa') {
    SpreadsheetApp.getUi().alert("⚠️ Silakan buka tab 'Transaksi_Sewa' terlebih dahulu!");
    return;
  }
  
  const activeRow = sheet.getActiveCell().getRow();
  if (activeRow < 4) {
    SpreadsheetApp.getUi().alert("⚠️ Silakan pilih baris data transaksi (baris 4 ke atas).");
    return;
  }
  
  const now = new Date();
  sheet.getRange(activeRow, 9).setValue(now);
  sheet.getRange(activeRow, 15).setValue("Disewa");
  SpreadsheetApp.getUi().alert(\`✅ Check-In Berhasil!\\n\\nWaktu Start terisi: \${now.toLocaleString('id-ID')}\\nStatus Unit diset: Disewa\`);
}

function checkOutActiveRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  if (sheet.getName() !== 'Transaksi_Sewa') {
    SpreadsheetApp.getUi().alert("⚠️ Silakan buka tab 'Transaksi_Sewa' terlebih dahulu!");
    return;
  }
  
  const activeRow = sheet.getActiveCell().getRow();
  if (activeRow < 4) {
    SpreadsheetApp.getUi().alert("⚠️ Silakan pilih baris data transaksi (baris 4 ke atas).");
    return;
  }
  
  sheet.getRange(activeRow, 15).setValue("Selesai");
  SpreadsheetApp.getUi().alert(\`✅ Check-Out Berhasil!\\n\\nStatus Unit pada baris \${activeRow} diset: Selesai\`);
}

function refreshMonthlyReport() {
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("🔄 Laporan bulanan telah diperbarui!");
}

/**
 * Deteksi Otomatis Pergantian Tahun saat Spreadsheet dibuka
 */
function cekPergantianTahunOtomatis() {
  const props = PropertiesService.getDocumentProperties();
  const currentYear = new Date().getFullYear().toString();
  const activeBookYear = props.getProperty('ACTIVE_BOOK_YEAR');

  if (!activeBookYear) {
    props.setProperty('ACTIVE_BOOK_YEAR', currentYear);
    return;
  }

  if (parseInt(currentYear) > parseInt(activeBookYear)) {
    const ui = SpreadsheetApp.getUi();
    const res = ui.alert(
      '🎉 Pergantian Tahun Terdeteksi (' + activeBookYear + ' ➔ ' + currentYear + ')',
      'Tahun kalender baru (' + currentYear + ') telah dimulai! Apakah Anda ingin otomatis merekap seluruh data tahun ' + activeBookYear + ' ke sheet arsip dan menyiapkan lembar kerja baru untuk tahun ' + currentYear + '?',
      ui.ButtonSet.YES_NO
    );
    if (res === ui.Button.YES) {
      eksekusiTutupBukuTahunan(parseInt(activeBookYear), parseInt(currentYear));
    }
  }
}

/**
 * Menu Manual: Pergantian Tahun, Otomatis Rekap Data, dan Pembuatan Buku Baru
 */
function prosesPergantianTahunBaru() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getDocumentProperties();
  const currentYear = parseInt(props.getProperty('ACTIVE_BOOK_YEAR') || new Date().getFullYear().toString());
  const nextYear = currentYear + 1;

  const res = ui.alert(
    '📅 Tutup Buku & Pergantian Tahun (' + currentYear + ' ➔ ' + nextYear + ')',
    'Sistem akan melakukan:\\n' +
    '1. Otomatis merekap Laporan Performa, Transaksi, dan Pengeluaran tahun ' + currentYear + ' ke sheet Arsip.\\n' +
    '2. Mempertahankan transaksi yang masih berstatus Disewa/Booking (lintas tahun).\\n' +
    '3. Membuat lembar kerja baru yang bersih untuk Tahun Buku ' + nextYear + '.\\n\\nLanjutkan?',
    ui.ButtonSet.YES_NO
  );

  if (res === ui.Button.YES) {
    eksekusiTutupBukuTahunan(currentYear, nextYear);
  }
}

function eksekusiTutupBukuTahunan(oldYear, newYear) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getDocumentProperties();

  const sheetLaporan = ss.getSheetByName('Laporan_Performa_Motor');
  const sheetTransaksi = ss.getSheetByName('Transaksi_Sewa');
  const sheetPengeluaran = ss.getSheetByName('Pengeluaran_Motor');

  // 1. Arsipkan Laporan Performa Tahunan (Copy Nilai Rekap)
  if (sheetLaporan) {
    const rekapName = 'Rekap_Tahunan_' + oldYear;
    let existingRekap = ss.getSheetByName(rekapName);
    if (existingRekap) ss.deleteSheet(existingRekap);
    let archivedReport = sheetLaporan.copyTo(ss).setName(rekapName);
    const range = archivedReport.getDataRange();
    range.copyTo(range, { contentsOnly: true }); // Kunci nilai hasil formula
  }

  // 2. Arsipkan Transaksi & Pertahankan yang Masih Disewa/Booking
  if (sheetTransaksi) {
    const arsipTrxName = 'Arsip_Transaksi_' + oldYear;
    let existingArsip = ss.getSheetByName(arsipTrxName);
    if (existingArsip) ss.deleteSheet(existingArsip);
    sheetTransaksi.copyTo(ss).setName(arsipTrxName);

    const lastRow = sheetTransaksi.getLastRow();
    const activeRows = [];
    if (lastRow >= 4) {
      const data = sheetTransaksi.getRange(4, 1, lastRow - 3, 16).getValues();
      for (let i = 0; i < data.length; i++) {
        const statusUnit = data[i][14];
        if (statusUnit === 'Disewa' || statusUnit === 'Booking' || statusUnit === 'Overdue') {
          activeRows.push(data[i]);
        }
      }
    }
    setupTransaksiSewa(sheetTransaksi);
    if (activeRows.length > 0) {
      sheetTransaksi.getRange(4, 1, activeRows.length, 16).setValues(activeRows);
    }
  }

  // 3. Arsipkan Pengeluaran & Buat Baru
  if (sheetPengeluaran) {
    const arsipExpName = 'Arsip_Pengeluaran_' + oldYear;
    let existingExp = ss.getSheetByName(arsipExpName);
    if (existingExp) ss.deleteSheet(existingExp);
    sheetPengeluaran.copyTo(ss).setName(arsipExpName);
    setupPengeluaran(sheetPengeluaran);
  }

  // 4. Perbarui Formula Laporan untuk Tahun Baru
  if (sheetLaporan) {
    setupLaporanPerforma(sheetLaporan, newYear);
  }

  props.setProperty('ACTIVE_BOOK_YEAR', newYear.toString());
  SpreadsheetApp.getUi().alert(
    '✅ Pergantian Tahun Selesai!\\n\\n' +
    '• Rekap data tahun ' + oldYear + ' telah disimpan di sheet Rekap_Tahunan_' + oldYear + '.\\n' +
    '• Lembar kerja baru Tahun Buku ' + newYear + ' siap digunakan!'
  );
}
`;

