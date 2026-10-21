export type BikeStatus = 'Tersedia' | 'Disewa' | 'Booking' | 'Overdue' | 'Perawatan';

export type CustomerCategory = 
  | 'Mhs Malang' 
  | 'Luar Malang / Wisatawan';

export type GuaranteeIdType = 
  | 'KTM dan KTP'
  | 'KTP Asli' 
  | 'KTM (Kartu Tanda Mahasiswa)' 
  | 'SIM C + KTP' 
  | 'Paspor / KITAS' 
  | 'Lainnya'
  | (string & {});

export type PaymentStatus = 'Lunas' | 'DP / Sebagian' | 'Belum Bayar' | 'Refund';

export type PaymentMethod = 'Tunai' | 'Transfer BRI' | 'QRIS';

export type ExpenseCategory = 
  | 'Service Rutin & Oli' 
  | 'Sparepart & Ban' 
  | 'Cuci Motor' 
  | 'Pajak & STNK' 
  | 'Bensin Operasional' 
  | 'Lainnya';

export interface MotorMaster {
  no: number;
  namaUnit: string;
  nopol: string;
  tipeMotor: string;
  status: BikeStatus;
  tahun?: number;
  warna?: string;
  kilometer?: number;
}

export interface TarifAcuan {
  tipeMotor: string;
  mhsMalang24Jam: number;
  luarMalang24Jam: number;
}

export interface TransaksiSewa {
  id: string;
  namaPenyewa: string;
  whatsapp: string;
  alamatAsalKos: string;
  identitasDijaminkan: GuaranteeIdType;
  nopolMotor: string;
  kategoriPelanggan: CustomerCategory;
  hariSewa: string; // e.g. "Senin", "Selasa"
  waktuStartSewa: string; // ISO string e.g. "2026-10-20T09:00:00"
  lamaSewaHari: number;
  estWaktuKembali: string; // ISO string
  waktuSelesai?: string; // ISO string when returned
  hargaPerHari: number;
  totalPemasukan: number;
  statusBayar: PaymentStatus;
  metodePembayaran?: PaymentMethod;
  statusUnit: 'Disewa' | 'Selesai' | 'Booking' | 'Overdue' | 'Refund';
  catatanJaminanTambahan: string;
  dendaKeterlambatan?: number;
  tambahanJam?: number;
  durasiJam?: number; // Durasi untuk sewa per jam (1 - 11 jam di bawah 12 jam) atau 12 jam
  paketKhusus?: 'Per Jam' | 'Paket 12 Jam' | 'Harian' | string;
  hargaPaket12Jam?: number; // Harga opsional untuk paket sewa 12 jam
  jumlahHelm?: '0' | '1' | '2';
  levelBensin?: '1 Kotak' | '2 Kotak' | '3 Kotak' | '4 Kotak' | '5 Kotak' | 'Full Kotak';
  nominalRefund?: number;
  keteranganRefund?: string;
  waktuRefund?: string;
  pemasukanAwalSebelumRefund?: number;
}

export interface PengeluaranMotor {
  id: string;
  tanggal: string; // ISO string
  nopolMotor: string;
  kategoriBiaya: ExpenseCategory;
  nominal: number;
  keteranganBengkel: string;
  penanggungJawab: string;
}

export interface MonthlyFleetPerformance {
  no: number;
  namaUnit: string;
  nopol: string;
  monthlyNet: number[]; // 12 elements (Jan..Dec)
  totalIncomeYear: number;
  totalExpenseYear: number;
  totalNetYear: number;
  adr: number; // Average Daily Rate
}

export interface FrequentRenter {
  id: string;
  nama: string;
  whatsapp: string;
  alamat: string;
  identitasDefault: GuaranteeIdType;
  kategoriDefault: CustomerCategory;
  totalRentals: number;
  totalSpent: number;
  ratingTrust: number; // 1 - 5
  lastRentalDate?: string;
  catatanKhusus?: string;
}

export interface YearlyRecapArchive {
  year: number;
  closedAt: string; // ISO timestamp when year-end recap was generated
  isAutoRecap?: boolean;
  totalIncome: number;
  totalExpense: number;
  totalNetProfit: number;
  profitMargin: number;
  totalTransactions: number;
  totalExpensesCount: number;
  averageADR: number;
  topMotorUnit: string;
  topMotorNopol: string;
  topMotorNet: number;
  paymentMethodBreakdown: {
    Tunai: number;
    'Transfer BRI': number;
    QRIS: number;
  };
  monthlySummary: {
    month: string;
    income: number;
    expense: number;
    net: number;
    trxCount: number;
  }[];
  fleetPerformance: {
    no: number;
    namaUnit: string;
    nopol: string;
    tipeMotor: string;
    totalIncome: number;
    totalExpense: number;
    totalNet: number;
    rentalCount: number;
    adr: number;
  }[];
  archivedTransactions?: TransaksiSewa[];
  archivedExpenses?: PengeluaranMotor[];
  notes?: string;
}

export interface ConnectedSheetInfo {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncedAt: string;
  lastSyncedBy?: string;
  autoSyncEnabled?: boolean;
}
