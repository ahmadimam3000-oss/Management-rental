import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  PieChart, 
  Download, 
  Printer, 
  Share2, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Calendar, 
  Bike, 
  Award, 
  Layers, 
  CheckCircle, 
  ChevronRight,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend,
  LineChart,
  Line
} from 'recharts';
import { MotorMaster, TransaksiSewa, PengeluaranMotor } from '../types/rental';
import { formatRupiah, INDONESIAN_MONTHS_SHORT } from '../utils/formatters';
import { PWAInstallButton, OfflineIndicator } from './PWAInstallButton';

interface InvestorOwnerPortalProps {
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  expenses: PengeluaranMotor[];
  onExitToAdmin?: () => void;
}

export const InvestorOwnerPortal: React.FC<InvestorOwnerPortalProps> = ({
  fleet,
  transactions,
  expenses,
  onExitToAdmin
}) => {
  // Security PIN states (Default: Publicly unlocked for anyone with the link unless requirePin=1)
  const [storedPin] = useState<string>(() => {
    return localStorage.getItem('motorent_investor_pin') || '2026';
  });

  const [inputPin, setInputPin] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('requirePin') === '1') {
        const urlPin = params.get('pin');
        return Boolean(urlPin && urlPin === (localStorage.getItem('motorent_investor_pin') || '2026'));
      }
    }
    return true;
  });
  const [pinError, setPinError] = useState<string>('');
  const [showPinInput, setShowPinInput] = useState<boolean>(false);

  // Check URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin');
      if (urlPin && urlPin === storedPin) {
        setIsUnlocked(true);
      }
    }
  }, [storedPin]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin.trim() === storedPin) {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('PIN Akses Salah. Silakan tanyakan ke Owner Ai Rent.');
    }
  };

  // Filter Year
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(2026);
  
  // Profit Sharing Slider (Default: 70% Owner, 30% Investor)
  const [investorSharePct, setInvestorSharePct] = useState<number>(30);

  // Available years
  const availableYears = useMemo(() => {
    const setY = new Set<number>([2026, 2025]);
    transactions.forEach(t => {
      const y = new Date(t.waktuStartSewa).getFullYear();
      if (!isNaN(y)) setY.add(y);
    });
    expenses.forEach(e => {
      const y = new Date(e.tanggal).getFullYear();
      if (!isNaN(y)) setY.add(y);
    });
    return Array.from(setY).sort((a, b) => b - a);
  }, [transactions, expenses]);

  // Filtered transactions and expenses
  const filteredTrxs = useMemo(() => {
    if (selectedYear === 'all') return transactions;
    return transactions.filter(t => new Date(t.waktuStartSewa).getFullYear() === selectedYear);
  }, [transactions, selectedYear]);

  const filteredExps = useMemo(() => {
    if (selectedYear === 'all') return expenses;
    return expenses.filter(e => new Date(e.tanggal).getFullYear() === selectedYear);
  }, [expenses, selectedYear]);

  // Core Financial Figures
  const grossRevenue = filteredTrxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
  const totalOperatingExpenses = filteredExps.reduce((sum, e) => sum + e.nominal, 0);
  const netProfit = grossRevenue - totalOperatingExpenses;
  const netMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';
  
  // ADR (Average Daily Rate)
  const rates = filteredTrxs.map(t => t.hargaPerHari);
  const averageDailyRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;

  // Profit Sharing Breakdown
  const investorShareAmount = Math.max(0, Math.round((netProfit * investorSharePct) / 100));
  const ownerShareAmount = Math.max(0, netProfit - investorShareAmount);
  const ownerSharePct = 100 - investorSharePct;

  // Unit-by-Unit Financial Performance (13 Bikes)
  const unitPerformance = useMemo(() => {
    return fleet.map(bike => {
      const bikeTrxs = filteredTrxs.filter(t => t.nopolMotor === bike.nopol);
      const bikeExps = filteredExps.filter(e => e.nopolMotor === bike.nopol);

      const income = bikeTrxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
      const expense = bikeExps.reduce((sum, e) => sum + e.nominal, 0);
      const net = income - expense;
      const margin = income > 0 ? Math.round((net / income) * 100) : 0;
      const rentalCount = bikeTrxs.length;

      return {
        ...bike,
        income,
        expense,
        net,
        margin,
        rentalCount
      };
    }).sort((a, b) => b.net - a.net);
  }, [fleet, filteredTrxs, filteredExps]);

  // Monthly Cash Flow Data
  const monthlyData = useMemo(() => {
    const targetYear = selectedYear === 'all' ? 2026 : selectedYear;
    return INDONESIAN_MONTHS_SHORT.map((mName, mIdx) => {
      const mTrxs = transactions.filter(t => {
        const d = new Date(t.waktuStartSewa);
        return d.getFullYear() === targetYear && d.getMonth() === mIdx;
      });
      const mExps = expenses.filter(e => {
        const d = new Date(e.tanggal);
        return d.getFullYear() === targetYear && d.getMonth() === mIdx;
      });

      const income = mTrxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
      const expense = mExps.reduce((sum, e) => sum + e.nominal, 0);
      const net = income - expense;

      return {
        bulan: mName,
        'Omset Sewa': income,
        'Biaya Operasional': expense,
        'Laba Bersih': net
      };
    });
  }, [transactions, expenses, selectedYear]);

  // Expense by category breakdown
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExps.forEach(e => {
      map.set(e.kategoriBiaya, (map.get(e.kategoriBiaya) || 0) + e.nominal);
    });
    return Array.from(map.entries()).map(([kategori, total]) => ({
      kategori,
      total,
      pct: totalOperatingExpenses > 0 ? Math.round((total / totalOperatingExpenses) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [filteredExps, totalOperatingExpenses]);

  // WhatsApp Financial Summary Text for Investors
  const generateInvestorWhatsAppSummary = () => {
    const text = `📊 *LAPORAN KEUANGAN & BAGI HASIL INVESTOR - AI RENT*
Tahun Buku: *${selectedYear === 'all' ? 'Seluruh Periode' : selectedYear}*
Status: *CONFIDENTIAL / DOKUMEN RAHASIA*
----------------------------------------
💰 *RINGKASAN EKSEKUTIF*
• Total Omset Bruto: *${formatRupiah(grossRevenue)}*
• Total Beban Operasional: *${formatRupiah(totalOperatingExpenses)}*
• *Laba Bersih Operasional*: *${formatRupiah(netProfit)}*
• Margin Keuntungan Bersih: *${netMargin}%*
• Rata-rata Tarif (ADR): *${formatRupiah(averageDailyRate)} / hari*
• Total Transaksi Sewa: *${filteredTrxs.length} transaksi*

🤝 *SKEMA PEMBAGIAN HASIL (${ownerSharePct}% Owner : ${investorSharePct}% Investor)*
• Hak Bagian Investor (${investorSharePct}%): *${formatRupiah(investorShareAmount)}*
• Hak Bagian Owner (${ownerSharePct}%): *${formatRupiah(ownerShareAmount)}*

🛵 *TOP 3 ARMADA PALING MENGUNTUNGKAN*:
${unitPerformance.slice(0, 3).map((u, i) => `${i + 1}. ${u.namaUnit} (${u.nopol}): Laba Bersih ${formatRupiah(u.net)}`).join('\n')}

Laporan lengkap dapat diakses secara resmi melalui link portal investor. Terima kasih! 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleExportCSV = () => {
    const headers = ['Nopol', 'Nama Unit', 'Tipe Motor', 'Total Pemasukan', 'Biaya Operasional', 'Laba Bersih', 'Margin %', 'Frekuensi Sewa'];
    const rows = unitPerformance.map(u => [
      `"${u.nopol}"`,
      `"${u.namaUnit}"`,
      `"${u.tipeMotor}"`,
      u.income,
      u.expense,
      u.net,
      `${u.margin}%`,
      u.rentalCount
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Keuangan_Investor_Ai_Rent_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Locked Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6 text-center">
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/70 border border-amber-600/50 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-800/80 rounded-full text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Terbatas</span>
            </div>
            <h1 className="text-xl font-black text-white pt-1">
              Laporan Keuangan Owner &amp; Investor
            </h1>
            <p className="text-xs text-slate-400">
              Dokumen rahasia performa keuangan, omset, dan pembagian laba bersih armada rental.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-slate-300 block">
                Masukkan PIN Akses Keuangan:
              </label>
              <div className="relative">
                <input
                  type={showPinInput ? 'text' : 'password'}
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="Ketik PIN akses (e.g. 2026)"
                  value={inputPin}
                  onChange={e => setInputPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-center text-lg tracking-widest text-white font-mono outline-none shadow-inner transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPinInput(!showPinInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPinInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && (
                <p className="text-xs text-rose-400 font-medium pt-1">
                  ⚠️ {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/50 cursor-pointer"
            >
              Buka Laporan Keuangan
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col gap-2">
            <div>
              💡 <em>PIN bawaan awal adalah <strong>2026</strong>. Hubungi Pemilik Ai Rent untuk otorisasi akses.</em>
            </div>
            {onExitToAdmin && (
              <button
                onClick={onExitToAdmin}
                className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline text-xs"
              >
                ← Kembali ke Halaman Utama Rental
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Unlocked Executive Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #investor-printable-area, #investor-printable-area * {
            visibility: visible !important;
          }
          #investor-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Executive Header */}
      <OfflineIndicator />
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-amber-400 font-bold shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">
                  Ai Rent
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  INVESTOR &amp; OWNER
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dokumen Resmi Laporan Keuangan Eksekutif</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton defaultAppMode="investor" compact label="Install HP" />
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-semibold outline-none focus:border-amber-500"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
              <option value="all">Semua Tahun</option>
            </select>

            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              title="Unduh Data Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <a
              href={generateInvestorWhatsAppSummary()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow-sm"
              title="Kirim Ringkasan ke WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim ke WA</span>
            </a>

            {onExitToAdmin && (
              <button
                onClick={onExitToAdmin}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
                title="Keluar ke Dashboard Rental"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main id="investor-printable-area" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Confidential Notice Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                STRICTLY CONFIDENTIAL
              </span>
              <span className="text-xs text-slate-400">
                Periode Laporan: <strong>{selectedYear === 'all' ? 'Seluruh Riwayat' : `Tahun ${selectedYear}`}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Laporan Keuangan &amp; Pembagian Laba Armada Rental (13 Unit)
            </h1>
            <p className="text-xs text-slate-400">
              Data dikalkulasi secara transparan berdasarkan seluruh nota sewa masuk dan biaya operasional bengkel/servis.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Status Pembukuan</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Terverifikasi Real-Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Hero Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Total Omset Bruto</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-cyan-400 tabular-nums">
              {formatRupiah(grossRevenue)}
            </div>
            <div className="text-[11px] text-slate-400">
              Dari <strong>{filteredTrxs.length}</strong> transaksi sewa motor
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Biaya Operasional &amp; Servis</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-400 tabular-nums">
              {formatRupiah(totalOperatingExpenses)}
            </div>
            <div className="text-[11px] text-slate-400">
              Servis, sparepart, oli, pajak, operasional
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Laba Bersih Operasional</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
              {formatRupiah(netProfit)}
            </div>
            <div className="text-[11px] text-slate-400">
              Pemasukan bersih setelah dipotong biaya
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Margin Laba Bersih</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 tabular-nums">
              {netMargin}%
            </div>
            <div className="text-[11px] text-slate-400">
              ADR Rata-rata: <strong>{formatRupiah(averageDailyRate)}</strong>/hari
            </div>
          </div>

        </div>

        {/* Profit Sharing Calculator (Owner vs Investor) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-600/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                  Simulasi &amp; Skema Bagi Hasil (Profit Sharing)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                  Berdasarkan Laba Bersih
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kalkulasi pembagian keuntungan bersih antara Pemilik Modal (Investor) dan Pengelola (Owner/Operasional).
              </p>
            </div>

            {/* Slider Control */}
            <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-medium text-slate-300">
                Porsi Investor: <strong className="text-amber-400 font-mono">{investorSharePct}%</strong>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={investorSharePct}
                onChange={e => setInvestorSharePct(Number(e.target.value))}
                className="w-32 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-300">
                Owner: <strong className="text-cyan-400 font-mono">{ownerSharePct}%</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Investor Card */}
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4.5 space-y-2">
              <div className="text-xs text-amber-300 font-semibold flex items-center justify-between">
                <span>💰 HAK LABA INVESTOR ({investorSharePct}%)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                  Passive Income
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tabular-nums">
                {formatRupiah(investorShareAmount)}
              </div>
              <p className="text-[11px] text-slate-400">
                Estimasi dividen / return yang dapat ditarik investor pada periode buku ini.
              </p>
            </div>

            {/* Owner Card */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4.5 space-y-2">
              <div className="text-xs text-cyan-300 font-semibold flex items-center justify-between">
                <span>🏢 HAK LABA OWNER / OPERASIONAL ({ownerSharePct}%)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Management &amp; Fleet
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 tabular-nums">
                {formatRupiah(ownerShareAmount)}
              </div>
              <p className="text-[11px] text-slate-400">
                Porsi keuntungan untuk pemilik rental, reinvestasi modal, dan dana cadangan armada.
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Tren Arus Kas Bulanan (Cash Flow Performance)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Perbandingan Omset, Biaya Operasional, dan Laba Bersih per bulan di Tahun {selectedYear === 'all' ? 2026 : selectedYear}
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="bulan" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={val => `Rp ${val / 1000}k`} />
                <RechartsTooltip 
                  formatter={(val: any) => formatRupiah(Number(val) || 0)}
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <RechartsLegend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Omset Sewa" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Biaya Operasional" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Laba Bersih" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unit-by-Unit Performance Table (13 Armada) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bike className="w-4 h-4 text-cyan-400" />
                <span>Laporan Keuangan per Unit Armada (13 Motor)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Laba bersih dan efisiensi biaya tiap motor diurutkan dari yang paling menguntungkan.
              </p>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Total 13 Unit Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Unit Motor</th>
                  <th className="py-3 px-3">Plat Nopol</th>
                  <th className="py-3 px-3 text-right">Omset Bruto</th>
                  <th className="py-3 px-3 text-right">Biaya Servis</th>
                  <th className="py-3 px-3 text-right">Laba Bersih</th>
                  <th className="py-3 px-3 text-right">Margin</th>
                  <th className="py-3 px-3 text-center">Sewa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {unitPerformance.map((bike, idx) => (
                  <tr key={bike.nopol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-white font-sans flex items-center gap-1.5">
                      {idx === 0 && <span title="Top Earner">🥇</span>}
                      {idx === 1 && <span title="Top Earner">🥈</span>}
                      {idx === 2 && <span title="Top Earner">🥉</span>}
                      <span>{bike.namaUnit}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({bike.tipeMotor})</span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">{bike.nopol}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{formatRupiah(bike.income)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400">({formatRupiah(bike.expense)})</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {formatRupiah(bike.net)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        bike.margin >= 70 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        bike.margin >= 40 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {bike.margin}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300 font-sans">
                      {bike.rentalCount}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <span>Rincian Pengeluaran Berdasarkan Kategori Biaya</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expensesByCategory.map(item => (
              <div key={item.kategori} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">{item.kategori}</span>
                  <span className="text-rose-400 font-mono font-bold">{item.pct}%</span>
                </div>
                <div className="text-base font-bold font-mono text-white">
                  {formatRupiah(item.total)}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Sign-off Footer */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Laporan Keuangan Resmi Ai Rent · Hak Cipta Dilindungi Undang-Undang
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Akses Terenkripsi &amp; Terverifikasi Internal Owner &amp; Investor</span>
          </div>
        </div>

      </main>

    </div>
  );
};
