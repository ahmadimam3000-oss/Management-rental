import React, { useState, useMemo, useEffect } from 'react';
import { 
  MotorMaster, 
  TransaksiSewa, 
  PengeluaranMotor, 
  YearlyRecapArchive 
} from '../types/rental';
import { 
  formatRupiah, 
  formatIndonesianDateTime, 
  generateYearlyRecapSnapshot, 
  exportYearlyRecapToCSV, 
  exportYearlyRecapToJSON 
} from '../utils/formatters';
import { 
  X, 
  CalendarCheck, 
  Sparkles, 
  Archive, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  Layers, 
  Clock, 
  FolderPlus,
  RotateCcw
} from 'lucide-react';

interface YearEndRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBookYear: number;
  onChangeActiveBookYear: (year: number) => void;
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  expenses: PengeluaranMotor[];
  yearlyRecaps: YearlyRecapArchive[];
  onExecuteYearRollover: (params: {
    closingYear: number;
    newYear: number;
    clearCompletedOldYearData: boolean;
    autoDownloadCSV: boolean;
    autoDownloadJSON: boolean;
    notes: string;
  }) => void;
  onSaveRecapSnapshotOnly: (recap: YearlyRecapArchive) => void;
  onRestoreArchivedYearTransactions: (recap: YearlyRecapArchive) => void;
  initialTab?: 'rollover' | 'archives' | 'settings';
}

export const YearEndRolloverModal: React.FC<YearEndRolloverModalProps> = ({
  isOpen,
  onClose,
  activeBookYear,
  onChangeActiveBookYear,
  fleet,
  transactions,
  expenses,
  yearlyRecaps,
  onExecuteYearRollover,
  onSaveRecapSnapshotOnly,
  onRestoreArchivedYearTransactions,
  initialTab = 'rollover'
}) => {
  const [activeTab, setActiveTab] = useState<'rollover' | 'archives' | 'settings'>(initialTab);
  const [closingYear, setClosingYear] = useState<number>(activeBookYear);
  const [targetNewYear, setTargetNewYear] = useState<number>(activeBookYear + 1);
  const [rolloverMode, setRolloverMode] = useState<'keep_history' | 'clean_slate'>('keep_history');
  const [autoDownloadCSV, setAutoDownloadCSV] = useState<boolean>(true);
  const [autoDownloadJSON, setAutoDownloadJSON] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [selectedArchiveYear, setSelectedArchiveYear] = useState<number>(
    yearlyRecaps[0]?.year || activeBookYear
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setClosingYear(activeBookYear);
      setTargetNewYear(activeBookYear + 1);
    }
  }, [isOpen, initialTab, activeBookYear]);

  // Live preview of the closing year's automatic recap
  const liveRecapPreview = useMemo(() => {
    return generateYearlyRecapSnapshot(
      closingYear,
      fleet,
      transactions,
      expenses,
      true,
      notes || `Tutup buku & rekap otomatis periode tahun ${closingYear}`
    );
  }, [closingYear, fleet, transactions, expenses, notes]);

  // Count active rentals that will carry over across New Year
  const activeCarryOverTransactions = useMemo(() => {
    return transactions.filter(
      t => t.statusUnit === 'Disewa' || t.statusUnit === 'Booking' || t.statusUnit === 'Overdue'
    );
  }, [transactions]);

  // All years available to select
  const selectableYears = useMemo(() => {
    const s = new Set<number>([2025, 2026, 2027, 2028, activeBookYear, activeBookYear + 1]);
    transactions.forEach(t => {
      const y = new Date(t.waktuStartSewa).getFullYear();
      if (!isNaN(y)) s.add(y);
    });
    yearlyRecaps.forEach(r => s.add(r.year));
    return Array.from(s).sort((a, b) => a - b);
  }, [transactions, yearlyRecaps, activeBookYear]);

  // Selected archive item for Tab 2
  const currentArchiveView = useMemo(() => {
    const found = yearlyRecaps.find(r => r.year === selectedArchiveYear);
    if (found) return found;
    return generateYearlyRecapSnapshot(selectedArchiveYear, fleet, transactions, expenses, true);
  }, [yearlyRecaps, selectedArchiveYear, fleet, transactions, expenses]);

  if (!isOpen) return null;

  const handleConfirmRollover = () => {
    const modeDesc = rolloverMode === 'clean_slate'
      ? `Arsipkan penuh & bersihkan transaksi selesai tahun ${closingYear} (mulai tabel kosong untuk tahun ${targetNewYear})`
      : `Simpan rekap tahun ${closingYear} & aktifkan buku baru tahun ${targetNewYear} (riwayat multi-tahun tetap tampil)`;

    if (
      window.confirm(
        `Konfirmasi Pergantian Tahun Buku (${closingYear} ➔ ${targetNewYear}):\n\n` +
        `• Total Pemasukan ${closingYear}: ${formatRupiah(liveRecapPreview.totalIncome)}\n` +
        `• Total Pengeluaran ${closingYear}: ${formatRupiah(liveRecapPreview.totalExpense)}\n` +
        `• Laba Bersih ${closingYear}: ${formatRupiah(liveRecapPreview.totalNetProfit)}\n` +
        `• Mode Tahun Baru: ${modeDesc}\n\n` +
        `Lanjutkan proses otomatis rekap & pembuatan tahun buku baru ${targetNewYear}?`
      )
    ) {
      onExecuteYearRollover({
        closingYear,
        newYear: targetNewYear,
        clearCompletedOldYearData: rolloverMode === 'clean_slate',
        autoDownloadCSV,
        autoDownloadJSON,
        notes: notes.trim() || `Tutup buku otomatis pergantian tahun ${closingYear} ke ${targetNewYear}`
      });
      setSelectedArchiveYear(closingYear);
      setActiveTab('archives');
    }
  };

  const handleManualSnapshotSave = () => {
    onSaveRecapSnapshotOnly(liveRecapPreview);
    setSelectedArchiveYear(closingYear);
    setActiveTab('archives');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Pergantian Tahun, Otomatis Rekap Data &amp; Buku Baru
                </h3>
                <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Tahun Aktif: {activeBookYear}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tutup buku akhir tahun otomatis, arsip rekapitulasi performa 12 bulan, dan inisialisasi lembar kerja tahun baru Ai Rent.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('rollover')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'rollover'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>1. Proses Pergantian Tahun &amp; Buat Baru</span>
          </button>

          <button
            onClick={() => setActiveTab('archives')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'archives'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>2. Arsip Rekap Tahunan ({yearlyRecaps.length} Tahun)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>3. Pengaturan Tahun Buku Aktif</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {/* TAB 1: ROLLOVER & PEMBUATAN TAHUN BARU */}
          {activeTab === 'rollover' && (
            <div className="space-y-6">
              
              {/* Year Transition Selector Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Wizard Otomatis Tutup Buku &amp; Tahun Baru</span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Rekap Otomatis Tahun {closingYear} &amp; Buat Buku Baru Tahun {targetNewYear}
                  </h4>
                  <p className="text-slate-400 text-[11px] max-w-xl">
                    Seluruh transaksi sewa, pemasukan per metode bayar (Tunai, BRI, QRIS), pengeluaran bengkel, dan ADR 13 armada pada tahun {closingYear} akan direkap otomatis sebelum memulai tahun {targetNewYear}.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 shrink-0">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      Tahun Direkap
                    </label>
                    <select
                      value={closingYear}
                      onChange={e => {
                        const y = parseInt(e.target.value);
                        setClosingYear(y);
                        setTargetNewYear(y + 1);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono font-bold text-sm text-amber-400 outline-none focus:border-cyan-500"
                    >
                      {selectableYears.map(y => (
                        <option key={y} value={y}>Tahun {y}</option>
                      ))}
                    </select>
                  </div>

                  <ArrowRight className="w-5 h-5 text-cyan-400 mt-4" />

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      Tahun Buku Baru
                    </label>
                    <select
                      value={targetNewYear}
                      onChange={e => setTargetNewYear(parseInt(e.target.value))}
                      className="bg-slate-950 border border-emerald-700/80 rounded-lg px-3 py-1.5 font-mono font-bold text-sm text-emerald-400 outline-none focus:border-emerald-400"
                    >
                      {[closingYear + 1, closingYear + 2, 2026, 2027, 2028, 2029]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .sort((a, b) => a - b)
                        .map(y => (
                          <option key={y} value={y}>Tahun {y}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Preview of Closing Year Recap */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Pratinjau Hasil Rekap Otomatis Tahun {closingYear}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {liveRecapPreview.totalTransactions} Transaksi Sewa · {liveRecapPreview.totalExpensesCount} Catatan Pengeluaran
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Total Pemasukan Kotor ({closingYear})</div>
                    <div className="text-base font-bold font-mono text-cyan-400 mt-1">
                      {formatRupiah(liveRecapPreview.totalIncome)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Dari {liveRecapPreview.totalTransactions} transaksi sewa
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Total Biaya Operasional ({closingYear})</div>
                    <div className="text-base font-bold font-mono text-rose-400 mt-1">
                      {formatRupiah(liveRecapPreview.totalExpense)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Dari {liveRecapPreview.totalExpensesCount} servis &amp; perawatan
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/60">
                    <div className="text-[11px] text-emerald-300 font-medium">Laba Bersih / Net Profit ({closingYear})</div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                      {formatRupiah(liveRecapPreview.totalNetProfit)}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-1">
                      Margin Keuntungan: {liveRecapPreview.profitMargin}% · ADR: {formatRupiah(liveRecapPreview.averageADR)}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Rekap Metode Pembayaran ({closingYear})</div>
                    <div className="space-y-1 mt-1.5 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">💵 Tunai:</span>
                        <span className="text-emerald-400">{formatRupiah(liveRecapPreview.paymentMethodBreakdown.Tunai)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">🏦 BRI:</span>
                        <span className="text-blue-400">{formatRupiah(liveRecapPreview.paymentMethodBreakdown['Transfer BRI'])}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">📱 QRIS:</span>
                        <span className="text-purple-400">{formatRupiah(liveRecapPreview.paymentMethodBreakdown.QRIS)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Year Creation Mode Options */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Pilih Metode Pembuatan Tahun Buku Baru ({targetNewYear})</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: Keep Multi-Year History */}
                  <button
                    type="button"
                    onClick={() => setRolloverMode('keep_history')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      rolloverMode === 'keep_history'
                        ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${rolloverMode === 'keep_history' ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <span>Opsi 1: Buat Tahun Baru + Simpan Riwayat Multi-Tahun</span>
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          DIREKOMENDASIKAN
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed pl-5.5">
                        Merekap seluruh data tahun <strong>{closingYear}</strong> ke Arsip Resmi dan mengalihkan sistem ke <strong>Tahun Buku {targetNewYear}</strong>. Tabel Transaksi &amp; Pengeluaran otomatis difilter ke tahun baru <strong>{targetNewYear}</strong> (mulai dari <code className="text-cyan-300">TRX-{targetNewYear}-001</code>), namun data tahun {closingYear} tetap bisa dilihat kapan saja lewat filter tahun &amp; grafik perbandingan antar-tahun.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Clean Slate / Reset Completed Rows */}
                  <button
                    type="button"
                    onClick={() => setRolloverMode('clean_slate')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      rolloverMode === 'clean_slate'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${rolloverMode === 'clean_slate' ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span>Opsi 2: Arsipkan Penuh &amp; Bersihkan Tabel Harian</span>
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300">
                          Mulai Tabel Kosong
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed pl-5.5">
                        Menyimpan rekapitulasi lengkap beserta seluruh rincian transaksi tahun <strong>{closingYear}</strong> ke dalam <strong>Arsip Rekap Tahunan</strong>, lalu membersihkan transaksi yang sudah <em>Selesai</em> dari tabel utama agar lembar kerja <strong>Tahun {targetNewYear}</strong> benar-benar kosong dari awal (unit yang masih <em>Disewa/Booking</em> tetap dipertahankan).
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Carry-over & Auto-Export Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carry-over protection info */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Proteksi Transaksi Lintas Tahun Baru (Carry-Over)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Terdapat <strong className="text-cyan-400">{activeCarryOverTransactions.length} unit motor</strong> yang saat ini sedang berstatus <strong>Disewa / Booking</strong>. Sistem otomatis mempertahankan unit tersebut di tahun buku baru hingga penyewa melakukan Check-Out, serta mempertahankan seluruh <strong>{fleet.length} Master Armada</strong> dan <strong>Database Penyewa Setia</strong>.
                  </p>
                </div>

                {/* Auto-download options */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Opsi Ekspor File Otomatis Saat Tutup Buku</span>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={autoDownloadCSV}
                      onChange={e => setAutoDownloadCSV(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Otomatis unduh Laporan Rekap Tahunan {closingYear} (<strong>.CSV Excel</strong>)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={autoDownloadJSON}
                      onChange={e => setAutoDownloadJSON(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Otomatis unduh Cadangan Arsip Lengkap {closingYear} (<strong>.JSON Backup</strong>)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleManualSnapshotSave}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
                >
                  <Archive className="w-4 h-4 text-cyan-400" />
                  <span>Simpan Rekap Tahun {closingYear} Saja (Tanpa Ganti Tahun)</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRollover}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Proses Pergantian Tahun ({closingYear} ➔ {targetNewYear}) &amp; Buat Baru</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ARSIP REKAP DATA TAHUNAN */}
          {activeTab === 'archives' && (
            <div className="space-y-5">
              {/* Archive Year Selector Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-medium mr-1">Pilih Arsip Tahun:</span>
                  {Array.from(new Set([...yearlyRecaps.map(r => r.year), activeBookYear, 2025]))
                    .sort((a, b) => b - a)
                    .map(yr => {
                      const isArchived = yearlyRecaps.some(r => r.year === yr);
                      return (
                        <button
                          key={yr}
                          onClick={() => setSelectedArchiveYear(yr)}
                          className={`px-3 py-1.5 rounded-lg font-mono font-semibold text-xs transition-all flex items-center gap-1.5 ${
                            selectedArchiveYear === yr
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <span>Tahun {yr}</span>
                          {isArchived && (
                            <span className="text-[10px] px-1 rounded bg-black/20">✓ Terekap</span>
                          )}
                        </button>
                      );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportYearlyRecapToCSV(currentArchiveView)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh CSV Rekap {currentArchiveView.year}</span>
                  </button>
                  <button
                    onClick={() => exportYearlyRecapToJSON(currentArchiveView)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Unduh JSON</span>
                  </button>
                  {currentArchiveView.archivedTransactions && currentArchiveView.archivedTransactions.length > 0 && (
                    <button
                      onClick={() => onRestoreArchivedYearTransactions(currentArchiveView)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium rounded-lg border border-amber-800/50 transition-colors"
                      title="Pulihkan transaksi arsip tahun ini kembali ke tabel transaksi utama"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pulihkan ke Tabel Utama</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Recap Header Info */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>📋 Laporan Rekapitulasi Tutup Buku Tahun {currentArchiveView.year}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {currentArchiveView.isAutoRecap ? 'Auto-Recap System' : 'Tutup Buku Resmi'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentArchiveView.notes || `Rekapitulasi performa tahunan periode 1 Januari - 31 Desember ${currentArchiveView.year}`}
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Waktu Rekap: {formatIndonesianDateTime(currentArchiveView.closedAt)}
                </div>
              </div>

              {/* Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Total Pemasukan ({currentArchiveView.year})</div>
                  <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                    {formatRupiah(currentArchiveView.totalIncome)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {currentArchiveView.totalTransactions} transaksi sewa
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Total Pengeluaran ({currentArchiveView.year})</div>
                  <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                    {formatRupiah(currentArchiveView.totalExpense)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {currentArchiveView.totalExpensesCount} catatan pengeluaran
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/50">
                  <div className="text-[11px] text-emerald-300">Laba Bersih / Net ({currentArchiveView.year})</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                    {formatRupiah(currentArchiveView.totalNetProfit)}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">
                    Margin: {currentArchiveView.profitMargin}% · ADR: {formatRupiah(currentArchiveView.averageADR)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Unit Terbaik ({currentArchiveView.year})</div>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{currentArchiveView.topMotorUnit} ({currentArchiveView.topMotorNopol})</span>
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 mt-0.5">
                    Net: {formatRupiah(currentArchiveView.topMotorNet)}
                  </div>
                </div>
              </div>

              {/* 12-Month Breakdown Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 font-semibold text-white flex items-center justify-between">
                  <span>📅 Rekapitulasi Bulanan (Januari – Desember {currentArchiveView.year})</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Tunai: {formatRupiah(currentArchiveView.paymentMethodBreakdown.Tunai)} · BRI: {formatRupiah(currentArchiveView.paymentMethodBreakdown['Transfer BRI'])} · QRIS: {formatRupiah(currentArchiveView.paymentMethodBreakdown.QRIS)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                        <th className="py-2 px-3">Bulan</th>
                        <th className="py-2 px-3 text-center">Jml Sewa</th>
                        <th className="py-2 px-3 text-right">Pemasukan Kotor</th>
                        <th className="py-2 px-3 text-right">Biaya Operasional</th>
                        <th className="py-2 px-3 text-right">Laba Bersih (Net)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {currentArchiveView.monthlySummary.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-sans font-semibold text-white">{m.month} {currentArchiveView.year}</td>
                          <td className="py-2 px-3 text-center text-slate-300">{m.trxCount}x</td>
                          <td className="py-2 px-3 text-right text-cyan-400">{formatRupiah(m.income)}</td>
                          <td className="py-2 px-3 text-right text-rose-400">{formatRupiah(m.expense)}</td>
                          <td className={`py-2 px-3 text-right font-bold ${m.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatRupiah(m.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fleet Performance Breakdown */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 font-semibold text-white">
                  🏍️ Rekapitulasi Performa Per Unit Armada ({currentArchiveView.year})
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-950">
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">Unit Armada</th>
                        <th className="py-2 px-3">Nopol</th>
                        <th className="py-2 px-3 text-center">Total Sewa</th>
                        <th className="py-2 px-3 text-right">Pemasukan</th>
                        <th className="py-2 px-3 text-right">Pengeluaran</th>
                        <th className="py-2 px-3 text-right">Laba Bersih</th>
                        <th className="py-2 px-3 text-right">ADR / Hari</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {currentArchiveView.fleetPerformance.map(f => (
                        <tr key={f.nopol} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 text-slate-500">{f.no}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-white">{f.namaUnit}</td>
                          <td className="py-2 px-3 text-slate-300">{f.nopol}</td>
                          <td className="py-2 px-3 text-center text-slate-300">{f.rentalCount}x</td>
                          <td className="py-2 px-3 text-right text-cyan-400">{formatRupiah(f.totalIncome)}</td>
                          <td className="py-2 px-3 text-right text-rose-400">{formatRupiah(f.totalExpense)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-400">{formatRupiah(f.totalNet)}</td>
                          <td className="py-2 px-3 text-right text-cyan-300">{formatRupiah(f.adr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PENGATURAN TAHUN BUKU AKTIF */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Pilih Tahun Buku Operasional Aktif</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Tahun buku aktif menentukan penomoran otomatis ID Transaksi (<code className="text-cyan-400">TRX-{activeBookYear}-XXX</code>), ID Pengeluaran (<code className="text-amber-400">EXP-{activeBookYear}-XXX</code>), serta filter tahun default pada Laporan &amp; Tabel.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {[2025, 2026, 2027, 2028, 2029].map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => onChangeActiveBookYear(yr)}
                      className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold border transition-all flex items-center gap-2 ${
                        activeBookYear === yr
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>Tahun Buku {yr}</span>
                      {activeBookYear === yr && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Status Deteksi Pergantian Tahun Otomatis: AKTIF</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Sistem Ai Rent secara otomatis mendeteksi apabila kalender memasuki tahun baru (1 Januari) atau terdapat riwayat transaksi dari tahun sebelumnya yang belum direkap, lalu menyimpan snapshot <strong>Rekap Tahunan Otomatis</strong> agar data keuangan tahun lama tidak pernah hilang.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
