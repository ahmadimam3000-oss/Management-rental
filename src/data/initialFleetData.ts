import type { MotorMaster, TarifAcuan, TransaksiSewa, PengeluaranMotor, FrequentRenter } from '../types/rental.ts';

export const INITIAL_FLEET: MotorMaster[] = [
  { no: 1, namaUnit: "BEAT 1", nopol: "L 2054 C", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2022, warna: "Hitam Glossy", kilometer: 24350 },
  { no: 2, namaUnit: "BEAT 2", nopol: "N 4849 ACC", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2023, warna: "Merah Hitam", kilometer: 18420 },
  { no: 3, namaUnit: "BEAT 3", nopol: "N 6836 TDV", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2023, warna: "Biru Putih", kilometer: 19100 },
  { no: 4, namaUnit: "BEAT 4", nopol: "N 3575 VAS", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2022, warna: "Hitam Doff", kilometer: 28900 },
  { no: 5, namaUnit: "BEAT 5", nopol: "N 4961 EDF", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2023, warna: "Silver Doff", kilometer: 16750 },
  { no: 6, namaUnit: "BEAT 6", nopol: "W 6365 NDT", tipeMotor: "Honda Beat", status: "Tersedia", tahun: 2024, warna: "Putih", kilometer: 9800 },
  { no: 7, namaUnit: "FAZIO", nopol: "S 4616 NBQ", tipeMotor: "Yamaha Fazzio", status: "Tersedia", tahun: 2023, warna: "Tosca / Neo Cyan", kilometer: 15300 },
  { no: 8, namaUnit: "FAZIO M 1", nopol: "N 3711 VAJ", tipeMotor: "Yamaha Fazzio", status: "Tersedia", tahun: 2023, warna: "Hitam Neo", kilometer: 14200 },
  { no: 9, namaUnit: "FAZIO M 2", nopol: "P 2409 BO", tipeMotor: "Yamaha Fazzio", status: "Tersedia", tahun: 2023, warna: "Merah Neo", kilometer: 17800 },
  { no: 10, namaUnit: "FAZIO M 3", nopol: "L 6312 ABH", tipeMotor: "Yamaha Fazzio", status: "Tersedia", tahun: 2024, warna: "Putih Mutiara", kilometer: 8900 },
  { no: 11, namaUnit: "SCOPY 1", nopol: "N 3541 EDB", tipeMotor: "Honda Scoopy", status: "Tersedia", tahun: 2023, warna: "Prestige White", kilometer: 21400 },
  { no: 12, namaUnit: "SCOPY 2", nopol: "P 5564 MI", tipeMotor: "Honda Scoopy", status: "Tersedia", tahun: 2022, warna: "Fashion Brown", kilometer: 26100 },
  { no: 13, namaUnit: "MIO J", nopol: "N 5540 GH", tipeMotor: "Yamaha Mio J", status: "Tersedia", tahun: 2020, warna: "Hitam Merah", kilometer: 42100 }
];

export const TARIF_STANDAR: TarifAcuan[] = [
  {
    tipeMotor: "Yamaha Mio J",
    mhsMalang24Jam: 45000,
    luarMalang24Jam: 60000
  },
  {
    tipeMotor: "Honda Beat",
    mhsMalang24Jam: 55000,
    luarMalang24Jam: 70000
  },
  {
    tipeMotor: "Honda Scoopy",
    mhsMalang24Jam: 65000,
    luarMalang24Jam: 80000
  },
  {
    tipeMotor: "Yamaha Fazzio",
    mhsMalang24Jam: 65000,
    luarMalang24Jam: 80000
  }
];

export const INITIAL_TRANSACTIONS: TransaksiSewa[] = [];

export const INITIAL_EXPENSES: PengeluaranMotor[] = [];

export const INITIAL_FREQUENT_RENTERS: FrequentRenter[] = [];

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
  sheet.getRange("G1:I1").merge().setValue("💵 TABEL ACUAN TARIF SEWA STANDAR")
       .setFontSize(12).setFontWeight("bold").setBackground("#2e75b6").setFontColor("#ffffff")
       .setHorizontalAlignment("center");

  const tarifHeaders = [["Tipe Motor", "Mhs Malang / 24Jam", "Luar Malang / Wisatawan"]];
  const tarifData = [
    ["Yamaha Mio J", 45000, 60000],
    ["Honda Beat", 55000, 70000],
    ["Honda Scoopy", 65000, 80000],
    ["Yamaha Fazzio", 65000, 80000]
  ];

  sheet.getRange(3, 7, 1, 3).setValues(tarifHeaders).setFontWeight("bold").setBackground("#d9e1f2").setHorizontalAlignment("center");
  sheet.getRange(4, 7, tarifData.length, 3).setValues(tarifData);
  sheet.getRange("H4:I7").setNumberFormat("Rp#,##0");
  sheet.getRange(3, 7, tarifData.length + 1, 3).setBorder(true, true, true, true, true, true);

  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(7, 130);
  sheet.setColumnWidth(8, 150);
  sheet.setColumnWidth(9, 170);
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
    'Luar Malang / Wisatawan'
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

