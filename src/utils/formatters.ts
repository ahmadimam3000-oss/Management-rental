import type { TransaksiSewa, MotorMaster, PengeluaranMotor, MonthlyFleetPerformance, YearlyRecapArchive } from '../types/rental.ts';

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function getIndonesianDay(dateInput: string | Date): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return INDONESIAN_DAYS[d.getDay()];
}

export function formatIndonesianDateTime(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = INDONESIAN_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatIndonesianDateOnly(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = INDONESIAN_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function toInputDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function calculateEstimatedReturn(startIso: string, days: number): string {
  if (!startIso || isNaN(days) || days <= 0) return '';
  const d = new Date(startIso);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Aturan Tarif Sewa Per Jam (di bawah 12 jam, start minimal 1 jam):
 * 1 jam  = Rp 10.000
 * Di atas 1 jam kelipatan Rp 5.000/jam:
 * 1 jam  = Rp 10.000
 * 2 jam  = Rp 15.000
 * 3 jam  = Rp 20.000
 * 4 jam  = Rp 25.000
 * 5 jam  = Rp 30.000
 * 6 jam  = Rp 35.000
 * 7 jam  = Rp 40.000
 * 8 jam  = Rp 45.000
 * 9 jam  = Rp 50.000
 * 10 jam = Rp 55.000
 * 11 jam = Rp 60.000
 */
export function calculateHourlyRentalFee(hours: number): number {
  if (hours <= 0) return 0;
  return 10000 + (hours - 1) * 5000;
}

export const calculateHourlyOvertimeFee = calculateHourlyRentalFee;

export function calculateEstimatedReturnWithHours(startIso: string, days: number, extraHours: number = 0): string {
  if (!startIso) return '';
  const d = new Date(startIso);
  if (isNaN(d.getTime())) return '';
  if (days > 0) d.setDate(d.getDate() + days);
  if (extraHours > 0) d.setHours(d.getHours() + extraHours);
  return d.toISOString();
}

export function checkIsOverdue(trx: TransaksiSewa): { isOverdue: boolean; hoursLate: number } {
  if (trx.statusUnit === 'Selesai' || trx.statusUnit === 'Refund') return { isOverdue: false, hoursLate: 0 };
  const est = new Date(trx.estWaktuKembali).getTime();
  const now = new Date().getTime();
  if (now > est) {
    const diffHours = Math.round((now - est) / (1000 * 60 * 60));
    return { isOverdue: true, hoursLate: diffHours };
  }
  return { isOverdue: false, hoursLate: 0 };
}

export const RENTAL_CUSTOMER_HOTLINE = '6282245508680'; // Hotline WhatsApp CS Ai Rent (082245508680)
export const RENTAL_CS_DISPLAY = '082245508680';

// Public Shared App URL so anyone with the link can open it without developer login restrictions
export const PUBLIC_SHARED_APP_ORIGIN = 'https://ais-pre-r35iyxcpzmh7ca3oo42gnl-747732554400.asia-northeast1.run.app';

export function getPublicAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customGhUrl = localStorage.getItem('airent_github_pages_url_v1');
    if (customGhUrl && customGhUrl.trim().startsWith('http')) {
      const cleaned = customGhUrl.trim().replace(/\/+$/, '');
      return `${cleaned}/`;
    }
    const origin = window.location.origin;
    const pathname = window.location.pathname || '/';
    const publicOrigin = origin.includes('ais-dev-')
      ? origin.replace('ais-dev-', 'ais-pre-')
      : origin;
    return `${publicOrigin}${pathname}`;
  }
  return `${PUBLIC_SHARED_APP_ORIGIN}/`;
}

export function getCloudApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // When hosted on static GitHub Pages (*.github.io), connect to the live Cloud Run API server
    if (window.location.hostname.endsWith('github.io')) {
      return PUBLIC_SHARED_APP_ORIGIN;
    }
  }
  return '';
}

// Informasi Rekening & Metode Pembayaran Resmi Ai Rent
export const PAYMENT_BRI_BANK = 'BRI';
export const PAYMENT_BRI_ACCOUNT = '603201007355508';
export const PAYMENT_BRI_HOLDER = 'Ahmad imam makhali';
export const PAYMENT_QRIS_IMAGE = './assets/aistudio/d322eab6-ceaa-4745-92b1-36f02d622551_fa408462.jpeg';
export const PAYMENT_QRIS_MERCHANT = 'AI RENT FOOD GROUP';
export const PAYMENT_QRIS_NMID = 'ID1025443889106';

export function getCustomerWhatsAppChatUrl(customMsg?: string): string {
  const text = customMsg || `Halo Admin Ai Rent, saya ingin tanya ketersediaan unit armada dan booking motor (Termasuk fasilitas: 0/1/2 Helm SNI dan Bensin awal).`;
  return `https://wa.me/${RENTAL_CUSTOMER_HOTLINE}?text=${encodeURIComponent(text)}`;
}

export function getPaymentMethodLabel(metode?: string): string {
  if (metode === 'Transfer BRI') {
    return `Transfer BRI (${PAYMENT_BRI_ACCOUNT} An ${PAYMENT_BRI_HOLDER})`;
  }
  if (metode === 'QRIS') {
    return `QRIS (${PAYMENT_QRIS_MERCHANT})`;
  }
  return 'Tunai';
}

export function generateWhatsAppMessage(trx: TransaksiSewa, bike?: MotorMaster): string {
  const bikeName = bike ? `${bike.namaUnit} (${bike.tipeMotor} - ${bike.nopol})` : trx.nopolMotor;
  const startFmt = formatIndonesianDateTime(trx.waktuStartSewa);
  const estFmt = formatIndonesianDateTime(trx.estWaktuKembali);
  const totalFmt = formatRupiah(trx.totalPemasukan);
  const rateFmt = formatRupiah(trx.hargaPerHari);

  let durasiText = `${trx.lamaSewaHari} Hari`;
  if (trx.paketKhusus === 'Per Jam') {
    const jam = trx.durasiJam || trx.tambahanJam || 1;
    durasiText = `Sewa Per Jam (${jam} Jam)`;
  } else if (trx.paketKhusus === 'Paket 12 Jam') {
    const hariPart = trx.lamaSewaHari > 0 ? `${trx.lamaSewaHari} Hari + ` : '0 Hari / ';
    const harga12Part = typeof trx.hargaPaket12Jam === 'number' && trx.hargaPaket12Jam > 0
      ? ` (${formatRupiah(trx.hargaPaket12Jam)})`
      : ' (Harga Opsional)';
    const extraJamPart = trx.tambahanJam && trx.tambahanJam > 0 ? ` + Tambahan ${trx.tambahanJam} Jam` : '';
    durasiText = `${hariPart}Paket 12 Jam${harga12Part}${extraJamPart}`;
  } else if (trx.tambahanJam && trx.tambahanJam > 0) {
    durasiText = `${trx.lamaSewaHari} Hari + Tambahan ${trx.tambahanJam} Jam`;
  }

  const metodeBayar = trx.metodePembayaran || 'Tunai';
  const metodeDesc = getPaymentMethodLabel(metodeBayar);

  const refundBlock =
    trx.statusUnit === 'Refund' || trx.statusBayar === 'Refund' || (trx.nominalRefund && trx.nominalRefund > 0)
      ? `\n💸 *INFORMASI REFUND TRANSAKSI*:\n• Status: *REFUND*\n• Total Awal: ${formatRupiah(trx.pemasukanAwalSebelumRefund ?? (trx.totalPemasukan + (trx.nominalRefund || 0)))}\n• Nominal Refund: *${formatRupiah(trx.nominalRefund || 0)}*\n• Sisa Pemasukan Bersih: *${totalFmt}*\n• Keterangan Refund: *${trx.keteranganRefund || '-'}*\n• Waktu Refund: ${trx.waktuRefund ? formatIndonesianDateTime(trx.waktuRefund) : '-'}\n`
      : '';

  return `🛵 *NOTA & BUKTI SEWA AI RENT*
No. Transaksi: *${trx.id}*
----------------------------------------
👤 *Penyewa*: ${trx.namaPenyewa}
📱 *Kontak*: +${trx.whatsapp.replace(/\D/g, '')}
📍 *Alamat / Kos*: ${trx.alamatAsalKos}
🪪 *Jaminan*: ${trx.identitasDijaminkan}
🏷️ *Kategori*: ${trx.kategoriPelanggan}

🏍️ *DETAIL UNIT & SEWA*
• Unit: *${bikeName}*
• Hari Mulai: *${trx.hariSewa}*
• Waktu Ambil: ${startFmt}
• Durasi: *${durasiText}*
• Waktu Kembali: *${estFmt}*
• Tarif: ${rateFmt}
• Total Sewa: *${totalFmt}*
• Metode Pembayaran: *${metodeDesc}*
• Status Bayar: *${trx.statusBayar}*${refundBlock}

💳 *OPSI PEMBAYARAN RESMI AI RENT*:
1. *Tunai* (Bayar langsung di kasir)
2. *Transfer BRI*: *${PAYMENT_BRI_ACCOUNT}* An (${PAYMENT_BRI_HOLDER}) BRI
3. *QRIS*: *${PAYMENT_QRIS_MERCHANT}* (NMID: ${PAYMENT_QRIS_NMID})

🎁 *FASILITAS & INKLUSI RESMI SEWA*:
• 🪖 *Helm*: ${trx.jumlahHelm ? `${trx.jumlahHelm} Helm SNI` : '0 / 1 / 2 Helm SNI Bersih'}
• ⛽ *Bahan Bakar*: ${trx.levelBensin || '1-5 / Full Kotak Sesuai Check-In'}
• 📝 *Catatan Tambahan*: ${trx.catatanJaminanTambahan || '-'}

⚠️ *SYARAT & KETENTUAN*:
1. Harap mengembalikan unit tepat waktu sesuai estimasi.
2. Dilarang memindahtangankan unit sewa ke pihak lain tanpa izin.
3. Membawa motor keluar kota tanpa izin, membawa ke area terlarang dan bonceng 3 dikenakan denda Rp 250.000.
4. Jaminan identitas akan dikembalikan saat unit selesai diperiksa bersama kelengkapan (helm).

Terima kasih telah mempercayakan perjalanan Anda bersama Ai Rent! 🙏
📞 CS Hotline WhatsApp: ${RENTAL_CS_DISPLAY}`;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function exportTransactionsToCSV(transactions: TransaksiSewa[]): void {
  const headers = [
    'ID Transaksi',
    'Nama Penyewa',
    'WhatsApp',
    'Alamat Asal/Kos',
    'Identitas Dijaminkan',
    'Nopol Motor',
    'Helm (0/1/2)',
    'Bensin (1-5/Full)',
    'Kategori Pelanggan',
    'Hari Sewa',
    'Waktu Start Sewa',
    'Lama Sewa (Hari)',
    'Est. Waktu Kembali',
    'Harga / Hari (Rp)',
    'Total Pemasukan Bersih (Rp)',
    'Nominal Refund (Rp)',
    'Keterangan Refund',
    'Metode Pembayaran',
    'Status Bayar',
    'Status Unit',
    'Catatan / Jaminan'
  ];

  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.namaPenyewa}"`,
    `"${t.whatsapp}"`,
    `"${t.alamatAsalKos.replace(/"/g, '""')}"`,
    `"${t.identitasDijaminkan}"`,
    `"${t.nopolMotor}"`,
    `"${t.jumlahHelm || (t.catatanJaminanTambahan?.includes('0 Helm') ? '0' : t.catatanJaminanTambahan?.includes('1') ? '1' : '2')} Helm"`,
    `"${t.levelBensin || '1 Kotak'}"`,
    `"${t.kategoriPelanggan}"`,
    `"${t.hariSewa}"`,
    `"${t.waktuStartSewa}"`,
    t.lamaSewaHari,
    `"${t.estWaktuKembali}"`,
    t.hargaPerHari,
    t.totalPemasukan,
    t.nominalRefund || 0,
    `"${(t.keteranganRefund || '').replace(/"/g, '""')}"`,
    `"${t.metodePembayaran || 'Tunai'}"`,
    `"${t.statusBayar}"`,
    `"${t.statusUnit}"`,
    `"${(t.catatanJaminanTambahan || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, 'Transaksi_Sewa_Ai_Rent.csv', 'text/csv;charset=utf-8;');
}

export function exportExpensesToCSV(expenses: PengeluaranMotor[]): void {
  const headers = ['ID', 'Tanggal', 'Nopol Motor', 'Kategori Biaya', 'Nominal (Rp)', 'Keterangan/Bengkel', 'Penanggung Jawab'];
  const rows = expenses.map(e => [
    `"${e.id}"`,
    `"${e.tanggal}"`,
    `"${e.nopolMotor}"`,
    `"${e.kategoriBiaya}"`,
    e.nominal,
    `"${e.keteranganBengkel.replace(/"/g, '""')}"`,
    `"${e.penanggungJawab}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, 'Pengeluaran_Motor_Ai_Rent.csv', 'text/csv;charset=utf-8;');
}

export function generateYearlyRecapSnapshot(
  year: number,
  fleet: MotorMaster[],
  transactions: TransaksiSewa[],
  expenses: PengeluaranMotor[],
  isAutoRecap: boolean = true,
  notes?: string
): YearlyRecapArchive {
  const yearTrxs = transactions.filter(t => new Date(t.waktuStartSewa).getFullYear() === year);
  const yearExps = expenses.filter(e => new Date(e.tanggal).getFullYear() === year);

  const totalIncome = yearTrxs.reduce((acc, curr) => acc + curr.totalPemasukan, 0);
  const totalExpense = yearExps.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalNetProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? Math.round((totalNetProfit / totalIncome) * 100) : 0;

  const paymentMethodBreakdown = {
    Tunai: 0,
    'Transfer BRI': 0,
    QRIS: 0
  };

  yearTrxs.forEach(t => {
    const m = t.metodePembayaran || 'Tunai';
    if (m === 'Transfer BRI') paymentMethodBreakdown['Transfer BRI'] += t.totalPemasukan;
    else if (m === 'QRIS') paymentMethodBreakdown.QRIS += t.totalPemasukan;
    else paymentMethodBreakdown.Tunai += t.totalPemasukan;
  });

  const monthlySummary = INDONESIAN_MONTHS_SHORT.map((month, idx) => {
    const mTrxs = yearTrxs.filter(t => new Date(t.waktuStartSewa).getMonth() === idx);
    const mExps = yearExps.filter(e => new Date(e.tanggal).getMonth() === idx);
    const income = mTrxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
    const expense = mExps.reduce((sum, e) => sum + e.nominal, 0);
    return {
      month,
      income,
      expense,
      net: income - expense,
      trxCount: mTrxs.length
    };
  });

  const fleetPerformance = fleet.map(motor => {
    const mTrxs = yearTrxs.filter(t => t.nopolMotor === motor.nopol);
    const mExps = yearExps.filter(e => e.nopolMotor === motor.nopol);
    const inc = mTrxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
    const exp = mExps.reduce((sum, e) => sum + e.nominal, 0);
    const rates = mTrxs.filter(t => t.hargaPerHari > 0).map(t => t.hargaPerHari);
    const adr = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
    return {
      no: motor.no,
      namaUnit: motor.namaUnit,
      nopol: motor.nopol,
      tipeMotor: motor.tipeMotor,
      totalIncome: inc,
      totalExpense: exp,
      totalNet: inc - exp,
      rentalCount: mTrxs.length,
      adr
    };
  });

  const sortedByNet = [...fleetPerformance].sort((a, b) => b.totalNet - a.totalNet);
  const topMotor = sortedByNet[0];

  const allRates = yearTrxs.filter(t => t.hargaPerHari > 0).map(t => t.hargaPerHari);
  const averageADR = allRates.length > 0
    ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length)
    : 0;

  return {
    year,
    closedAt: new Date().toISOString(),
    isAutoRecap,
    totalIncome,
    totalExpense,
    totalNetProfit,
    profitMargin,
    totalTransactions: yearTrxs.length,
    totalExpensesCount: yearExps.length,
    averageADR,
    topMotorUnit: topMotor ? topMotor.namaUnit : '-',
    topMotorNopol: topMotor ? topMotor.nopol : '-',
    topMotorNet: topMotor ? topMotor.totalNet : 0,
    paymentMethodBreakdown,
    monthlySummary,
    fleetPerformance,
    archivedTransactions: yearTrxs,
    archivedExpenses: yearExps,
    notes: notes || `Rekapitulasi tutup buku tahunan otomatis periode 1 Jan ${year} - 31 Des ${year}`
  };
}

export function exportYearlyRecapToCSV(recap: YearlyRecapArchive): void {
  const lines: string[] = [];
  lines.push(`"LAPORAN REKAPITULASI TAHUNAN AI RENT - TAHUN BUKU ${recap.year}"`);
  lines.push(`"Tanggal Rekap Tutup Buku","${formatIndonesianDateTime(recap.closedAt)}"`);
  lines.push(`"Total Pemasukan Kotor (Rp)",${recap.totalIncome}`);
  lines.push(`"Total Biaya Operasional (Rp)",${recap.totalExpense}`);
  lines.push(`"Total Laba Bersih / Net Profit (Rp)",${recap.totalNetProfit}`);
  lines.push(`"Margin Keuntungan (%)",${recap.profitMargin}%`);
  lines.push(`"Total Transaksi Sewa",${recap.totalTransactions}`);
  lines.push(`"Rata-Rata Tarif Harian / ADR (Rp)",${recap.averageADR}`);
  lines.push(`"Pemasukan Tunai (Rp)",${recap.paymentMethodBreakdown.Tunai}`);
  lines.push(`"Pemasukan Transfer BRI (Rp)",${recap.paymentMethodBreakdown['Transfer BRI']}`);
  lines.push(`"Pemasukan QRIS (Rp)",${recap.paymentMethodBreakdown.QRIS}`);
  lines.push('');

  lines.push('"REKAPITULASI BULANAN (JANUARI - DESEMBER)"');
  lines.push('"Bulan","Pemasukan Kotor (Rp)","Biaya Operasional (Rp)","Laba Bersih (Rp)","Jumlah Transaksi"');
  recap.monthlySummary.forEach(m => {
    lines.push(`"${m.month}",${m.income},${m.expense},${m.net},${m.trxCount}`);
  });
  lines.push('');

  lines.push('"REKAPITULASI PERFORMA PER UNIT ARMADA"');
  lines.push('"No","Nama Unit","Nopol","Tipe Motor","Jumlah Sewa","Pemasukan (Rp)","Pengeluaran (Rp)","Laba Bersih (Rp)","ADR / Hari (Rp)"');
  recap.fleetPerformance.forEach(f => {
    lines.push(`${f.no},"${f.namaUnit}","${f.nopol}","${f.tipeMotor}",${f.rentalCount},${f.totalIncome},${f.totalExpense},${f.totalNet},${f.adr}`);
  });

  const csvContent = lines.join('\n');
  downloadBlob(csvContent, `Rekap_Tahunan_Ai_Rent_${recap.year}.csv`, 'text/csv;charset=utf-8;');
}

export function exportYearlyRecapToJSON(recap: YearlyRecapArchive): void {
  const jsonStr = JSON.stringify(recap, null, 2);
  downloadBlob(jsonStr, `Arsip_Lengkap_Tahunan_Ai_Rent_${recap.year}.json`, 'application/json');
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

