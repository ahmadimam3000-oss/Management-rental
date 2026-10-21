import React, { useState, useMemo, useEffect } from 'react';
import { MotorMaster, TransaksiSewa, PengeluaranMotor, YearlyRecapArchive } from '../types/rental';
import { formatRupiah, INDONESIAN_MONTHS_SHORT, exportYearlyRecapToCSV, exportYearlyRecapToJSON } from '../utils/formatters';
import { 
  TrendingUp, 
  BarChart3, 
  Download, 
  Award, 
  DollarSign, 
  LayoutDashboard, 
  Table, 
  LineChart as LineChartIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CalendarCheck,
  Archive,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend 
} from 'recharts';
import { RevenueChart } from './RevenueChart';

interface PerformanceReportProps {
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  expenses: PengeluaranMotor[];
  activeBookYear?: number;
  yearlyRecaps?: YearlyRecapArchive[];
  onOpenYearRollover?: (tab?: 'rollover' | 'archives' | 'settings') => void;
}

export const PerformanceReport: React.FC<PerformanceReportProps> = ({
  fleet,
  transactions,
  expenses,
  activeBookYear = 2026,
  yearlyRecaps = [],
  onOpenYearRollover
}) => {
  // Combine live transactions/expenses with archived ones (deduplicated by ID) so historical reports work even if old years were cleared
  const combinedTransactions = useMemo(() => {
    const map = new Map<string, TransaksiSewa>();
    yearlyRecaps.forEach(r => {
      r.archivedTransactions?.forEach(t => map.set(t.id, t));
    });
    transactions.forEach(t => map.set(t.id, t));
    return Array.from(map.values());
  }, [transactions, yearlyRecaps]);

  const combinedExpenses = useMemo(() => {
    const map = new Map<string, PengeluaranMotor>();
    yearlyRecaps.forEach(r => {
      r.archivedExpenses?.forEach(e => map.set(e.id, e));
    });
    expenses.forEach(e => map.set(e.id, e));
    return Array.from(map.values());
  }, [expenses, yearlyRecaps]);

  // Available years dynamically detected from data + activeBookYear + recaps
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, 2025, activeBookYear]);
    combinedTransactions.forEach(t => {
      const y = new Date(t.waktuStartSewa).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    combinedExpenses.forEach(e => {
      const y = new Date(e.tanggal).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    yearlyRecaps.forEach(r => yearsSet.add(r.year));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [combinedTransactions, combinedExpenses, activeBookYear, yearlyRecaps]);

  // Selected year can be a specific year (e.g. 2026) or 'all' for complete history
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(activeBookYear);
  const [metricView, setMetricView] = useState<'net' | 'income' | 'expense'>('net');
  const [activeReportTab, setActiveReportTab] = useState<'chart' | 'table' | 'both'>('chart');
  const [showComparisonLines, setShowComparisonLines] = useState(true);

  useEffect(() => {
    setSelectedYear(activeBookYear);
  }, [activeBookYear]);

  // Compute multi-year comparison summary (Year-over-Year)
  const multiYearSummary = useMemo(() => {
    const chronoSortedYears = [...availableYears].sort((a, b) => a - b);
    return chronoSortedYears.map((year, idx) => {
      const yearTrxs = combinedTransactions.filter(t => new Date(t.waktuStartSewa).getFullYear() === year);
      const yearExps = combinedExpenses.filter(e => new Date(e.tanggal).getFullYear() === year);

      const income = yearTrxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
      const expense = yearExps.reduce((sum, e) => sum + e.nominal, 0);
      const net = income - expense;
      const margin = income > 0 ? Math.round((net / income) * 100) : 0;
      const rates = yearTrxs.map(t => t.hargaPerHari);
      const adr = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;

      // YoY growth compared to previous year in array
      let growthYoY: number | null = null;
      if (idx > 0) {
        const prevYear = chronoSortedYears[idx - 1];
        const prevYearIncome = combinedTransactions
          .filter(t => new Date(t.waktuStartSewa).getFullYear() === prevYear)
          .reduce((sum, t) => sum + t.totalPemasukan, 0);
        if (prevYearIncome > 0) {
          growthYoY = Math.round(((income - prevYearIncome) / prevYearIncome) * 100);
        }
      }

      return {
        year: year.toString(),
        yearNum: year,
        'Pemasukan Kotor': income,
        'Biaya Operasional': expense,
        'Laba Bersih': net,
        margin,
        totalRentals: yearTrxs.length,
        adr,
        growthYoY
      };
    });
  }, [availableYears, combinedTransactions, combinedExpenses]);

  // Compute monthly data specifically for the Recharts Line Chart
  const rechartsMonthlyData = useMemo(() => {
    return INDONESIAN_MONTHS_SHORT.map((monthName, idx) => {
      if (selectedYear === 'all') {
        // Multi-year comparison: show lines for each year
        const row: Record<string, any> = { bulan: monthName };
        let allYearsIncome = 0;
        let allYearsExpense = 0;

        availableYears.forEach(year => {
          let yrIncome = 0;
          let yrExpense = 0;

          combinedTransactions.forEach(t => {
            const d = new Date(t.waktuStartSewa);
            if (d.getFullYear() === year && d.getMonth() === idx) {
              yrIncome += t.totalPemasukan;
            }
          });

          combinedExpenses.forEach(e => {
            const d = new Date(e.tanggal);
            if (d.getFullYear() === year && d.getMonth() === idx) {
              yrExpense += e.nominal;
            }
          });

          row[`Laba Bersih ${year}`] = yrIncome - yrExpense;
          allYearsIncome += yrIncome;
          allYearsExpense += yrExpense;
        });

        row['Total Laba Bersih (All-Time)'] = allYearsIncome - allYearsExpense;
        row['Total Pemasukan'] = allYearsIncome;
        row['Total Biaya'] = allYearsExpense;
        return row;
      } else {
        // Single year view
        let income = 0;
        let expense = 0;

        combinedTransactions.forEach(t => {
          const d = new Date(t.waktuStartSewa);
          if (d.getFullYear() === selectedYear && d.getMonth() === idx) {
            income += t.totalPemasukan;
          }
        });

        combinedExpenses.forEach(e => {
          const d = new Date(e.tanggal);
          if (d.getFullYear() === selectedYear && d.getMonth() === idx) {
            expense += e.nominal;
          }
        });

        const netRevenue = income - expense;

        return {
          bulan: monthName,
          'Laba Bersih (Net)': netRevenue,
          'Pemasukan Kotor': income,
          'Biaya Operasional': expense
        };
      }
    });
  }, [combinedTransactions, combinedExpenses, selectedYear, availableYears]);

  // Compute performance matrix per motor (for 12 months table)
  const reportData = useMemo(() => {
    return fleet.map((motor) => {
      const monthlyNet = Array(12).fill(0);
      const monthlyIncome = Array(12).fill(0);
      const monthlyExpense = Array(12).fill(0);

      // Filter transactions for this motor
      const motorTrxs = combinedTransactions.filter(t => {
        if (t.nopolMotor !== motor.nopol) return false;
        if (selectedYear === 'all') return true;
        const d = new Date(t.waktuStartSewa);
        return d.getFullYear() === selectedYear;
      });

      // Filter expenses for this motor
      const motorExpenses = combinedExpenses.filter(e => {
        if (e.nopolMotor !== motor.nopol) return false;
        if (selectedYear === 'all') return true;
        const d = new Date(e.tanggal);
        return d.getFullYear() === selectedYear;
      });

      // Populate monthly income
      motorTrxs.forEach(t => {
        const d = new Date(t.waktuStartSewa);
        const m = d.getMonth();
        monthlyIncome[m] += t.totalPemasukan;
      });

      // Populate monthly expenses
      motorExpenses.forEach(e => {
        const d = new Date(e.tanggal);
        const m = d.getMonth();
        monthlyExpense[m] += e.nominal;
      });

      // Net profit = Income - Expense
      for (let i = 0; i < 12; i++) {
        monthlyNet[i] = monthlyIncome[i] - monthlyExpense[i];
      }

      // ADR: Average Daily Rate for this bike
      const allRates = motorTrxs.filter(t => t.hargaPerHari > 0).map(t => t.hargaPerHari);
      const adr = allRates.length > 0
        ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length)
        : 0;

      const totalIncomeYear = monthlyIncome.reduce((a, b) => a + b, 0);
      const totalExpenseYear = monthlyExpense.reduce((a, b) => a + b, 0);
      const totalNetYear = monthlyNet.reduce((a, b) => a + b, 0);

      return {
        no: motor.no,
        namaUnit: motor.namaUnit,
        nopol: motor.nopol,
        monthlyNet,
        monthlyIncome,
        monthlyExpense,
        totalIncomeYear,
        totalExpenseYear,
        totalNetYear,
        adr
      };
    });
  }, [fleet, combinedTransactions, combinedExpenses, selectedYear]);

  // Overall totals per month
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    reportData.forEach(row => {
      for (let i = 0; i < 12; i++) {
        if (metricView === 'net') {
          totals[i] += row.monthlyNet[i];
        } else if (metricView === 'income') {
          totals[i] += row.monthlyIncome[i];
        } else {
          totals[i] += row.monthlyExpense[i];
        }
      }
    });
    return totals;
  }, [reportData, metricView]);

  const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);
  const averageFleetADR = Math.round(
    reportData.reduce((acc, curr) => acc + curr.adr, 0) / (reportData.length || 1)
  );

  // Highest earner
  const topEarner = [...reportData].sort((a, b) => b.totalNetYear - a.totalNetYear)[0];
  const topADR = [...reportData].sort((a, b) => b.adr - a.adr)[0];

  const exportMonthlyReportToCSV = () => {
    const headers = [
      'No',
      'Nama Unit',
      'Nopol',
      ...INDONESIAN_MONTHS_SHORT,
      selectedYear === 'all' ? 'Total Seluruh Riwayat (Rp)' : `Total Tahun ${selectedYear} (Rp)`,
      'ADR / Hari (Rp)'
    ];

    const rows = reportData.map(r => {
      const values = metricView === 'net' ? r.monthlyNet : metricView === 'income' ? r.monthlyIncome : r.monthlyExpense;
      const total = metricView === 'net' ? r.totalNetYear : metricView === 'income' ? r.totalIncomeYear : r.totalExpenseYear;
      return [
        r.no,
        `"${r.namaUnit}"`,
        `"${r.nopol}"`,
        ...values,
        total,
        r.adr
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Performa_Armada_${selectedYear === 'all' ? 'Semua_Tahun' : selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Dropdown / Tab Bar Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        
        {/* Top line with title and actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                Analisis Keuangan &amp; ADR (13 Fleet)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                {selectedYear === 'all' ? 'Multi-Year History' : `Tahun ${selectedYear}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Laporan Pendapatan Bersih &amp; Komparasi Multi-Tahun
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Pilih tahun anggaran atau buka riwayat komparasi lengkap untuk menganalisis performa pendapatan dan tren laba bersih armada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenYearRollover && (
              <button
                onClick={() => onOpenYearRollover('rollover')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-lg transition-all shadow-md shadow-cyan-500/10 whitespace-nowrap"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Pergantian Tahun &amp; Buat Baru</span>
              </button>
            )}

            {onOpenYearRollover && (
              <button
                onClick={() => onOpenYearRollover('archives')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-700/70 rounded-lg transition-colors whitespace-nowrap"
              >
                <Archive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Arsip Rekap ({yearlyRecaps.length})</span>
              </button>
            )}

            {/* Year Dropdown Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="bg-transparent outline-none font-mono text-xs text-white cursor-pointer"
              >
                <option value="all" className="bg-slate-900">⚡ Semua Riwayat (All-Time)</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className="bg-slate-900">
                    Tahun {yr} {yr === activeBookYear ? '(Buku Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={exportMonthlyReportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Interface for Switching Years or Viewing Entire History */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setSelectedYear('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedYear === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Riwayat (All-Time)</span>
            </button>

            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedYear === yr
                    ? 'bg-slate-800 text-cyan-400 font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tahun {yr} {yr === activeBookYear ? '• Aktif' : ''}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            {selectedYear === 'all' ? (
              <span>Menampilkan agregasi <strong className="text-white">{availableYears.length} tahun</strong> data rental</span>
            ) : (
              <span>Fokus pada periode kalender <strong className="text-cyan-400">1 Januari - 31 Desember {selectedYear}</strong></span>
            )}
          </div>
        </div>

      </div>

      {/* Yearly Rollover & Auto-Recap Quick Banner */}
      {onOpenYearRollover && (
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 rounded-xl border border-cyan-800/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Sistem Pergantian Tahun, Otomatis Rekap Data &amp; Pembuatan Tahun Baru
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Tahun Buku Aktif: {activeBookYear}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Tutup buku akhir tahun otomatis merekap seluruh pemasukan, biaya servis, rincian metode bayar (Tunai/BRI/QRIS), dan ADR 13 armada, lalu membuat lembar kerja baru untuk tahun berikutnya.
              </p>
              {yearlyRecaps.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="text-[11px] text-slate-400">Arsip Terekap:</span>
                  {yearlyRecaps.map(rec => (
                    <button
                      key={rec.year}
                      onClick={() => exportYearlyRecapToCSV(rec)}
                      title={`Unduh CSV Rekap Tahunan ${rec.year}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-slate-800 transition-colors"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                      <span>Rekap {rec.year}: {formatRupiah(rec.totalNetProfit)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenYearRollover('archives')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            >
              Lihat Arsip Rekap
            </button>
            <button
              onClick={() => onOpenYearRollover('rollover')}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors shadow-sm"
            >
              Proses Pergantian Tahun ({activeBookYear} ➔ {activeBookYear + 1})
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">
            Total Akumulasi {selectedYear === 'all' ? '(All-Time)' : `(${selectedYear})`}
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums mt-1">
            {formatRupiah(grandTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            13 armada motor di Malang
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Rata-Rata ADR Armada</div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            {formatRupiah(averageFleetADR)}
            <span className="text-xs font-normal text-slate-400 font-sans"> / hari</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target tarif rata-rata &gt; Rp 60rb
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Armada Laba Tertinggi</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>{topEarner ? `${topEarner.namaUnit} (${topEarner.nopol})` : '-'}</span>
          </div>
          <div className="text-[11px] text-amber-400/90 font-mono mt-1">
            Net: {formatRupiah(topEarner ? topEarner.totalNetYear : 0)}
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">ADR Tertinggi per Hari</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>{topADR ? topADR.namaUnit : '-'}</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono mt-1">
            {formatRupiah(topADR ? topADR.adr : 0)} / hari
          </div>
        </div>
      </div>

      {/* When All-Time History is selected: Multi-Year Comparative Analysis Card */}
      {selectedYear === 'all' && (
        <div className="bg-slate-900 rounded-xl border border-cyan-800/40 p-5 space-y-5 shadow-lg shadow-cyan-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-base text-white">
                  Komparasi Finansial Antar-Tahun (Year-over-Year Analysis)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbandingan performa pendapatan kotor, biaya operasional, dan laba bersih dari tahun ke tahun.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800/60">
              {multiYearSummary.length} Tahun Tercatat
            </span>
          </div>

          {/* Recharts Multi-Year Bar Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={multiYearSummary}
                margin={{ top: 15, right: 25, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val: number) => (val === 0 ? '0' : `${(val / 1000).toLocaleString('id-ID')}k`)}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono">
                          <div className="font-bold text-white font-sans text-xs border-b border-slate-800 pb-1">
                            Tahun Anggaran: {label}
                          </div>
                          {payload.map((entry: any, index: number) => (
                            <div key={`entry-${index}`} className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="font-sans flex items-center gap-1.5" style={{ color: entry.color }}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}:
                              </span>
                              <span className="font-bold tabular-nums" style={{ color: entry.color }}>
                                {formatRupiah(entry.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <RechartsLegend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Pemasukan Kotor" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Biaya Operasional" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Laba Bersih" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* YoY Metrics Comparison Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <th className="py-2.5 px-3">Tahun</th>
                  <th className="py-2.5 px-3 text-right">Pemasukan Kotor</th>
                  <th className="py-2.5 px-3 text-right">Biaya Operasional</th>
                  <th className="py-2.5 px-3 text-right">Laba Bersih (Net)</th>
                  <th className="py-2.5 px-3 text-right">Margin Laba</th>
                  <th className="py-2.5 px-3 text-right">Rata2 ADR</th>
                  <th className="py-2.5 px-3 text-center">Pertumbuhan (YoY)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {multiYearSummary.map(row => (
                  <tr key={row.year} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 font-bold text-white font-sans flex items-center gap-1.5">
                      <span>Tahun {row.year}</span>
                      {row.yearNum === new Date().getFullYear() && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded border border-cyan-800">
                          Berjalan
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-400 tabular-nums">
                      {formatRupiah(row['Pemasukan Kotor'])}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-400 tabular-nums">
                      {formatRupiah(row['Biaya Operasional'])}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold tabular-nums">
                      {formatRupiah(row['Laba Bersih'])}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                      {row.margin}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">
                      {formatRupiah(row.adr)}/hr
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.growthYoY === null ? (
                        <span className="text-slate-500">-</span>
                      ) : row.growthYoY >= 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>+{row.growthYoY}%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-rose-400 font-bold text-[11px]">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>{row.growthYoY}%</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Switcher: Revenue Chart vs Matrix Table vs Both */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveReportTab('chart')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'chart'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafik Analisis Pendapatan</span>
          </button>
          <button
            onClick={() => setActiveReportTab('table')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'table'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabel Matriks 12 Bulan (ADR)</span>
          </button>
          <button
            onClick={() => setActiveReportTab('both')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === 'both'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Semua Tampilan</span>
          </button>
        </div>

        {activeReportTab !== 'chart' && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setMetricView('net')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                metricView === 'net'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Laba Bersih
            </button>
            <button
              onClick={() => setMetricView('income')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                metricView === 'income'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setMetricView('expense')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                metricView === 'expense'
                  ? 'bg-slate-800 text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pengeluaran
            </button>
          </div>
        )}
      </div>

      {/* Recharts Monthly Net Revenue Line Chart Card */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-base text-white">
                Tren Laba Bersih Bulanan (Visualisasi Recharts Line Chart)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedYear === 'all'
                ? 'Komparasi garis laba bersih bulanan untuk setiap tahun riwayat rental.'
                : `Grafik garis fluktuasi pendapatan bersih (Total Sewa - Pengeluaran) per bulan pada tahun ${selectedYear}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedYear !== 'all' && (
              <button
                onClick={() => setShowComparisonLines(!showComparisonLines)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  showComparisonLines
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {showComparisonLines ? '✓ Garis Omset & Biaya Aktif' : '+ Bandingkan Omset & Biaya'}
              </button>
            )}
          </div>
        </div>

        {/* Recharts Responsive Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rechartsMonthlyData}
              margin={{ top: 15, right: 25, left: 15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="bulan" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val: number) => (val === 0 ? '0' : `${(val / 1000).toLocaleString('id-ID')}k`)}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono">
                        <div className="font-bold text-white font-sans text-xs border-b border-slate-800 pb-1">
                          Bulan: {label} ({selectedYear === 'all' ? 'Multi-Year' : selectedYear})
                        </div>
                        {payload.map((entry: any, index: number) => (
                          <div key={`entry-${index}`} className="flex items-center justify-between gap-4 text-[11px]">
                            <span className="font-sans flex items-center gap-1.5" style={{ color: entry.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}:
                            </span>
                            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
                              {formatRupiah(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <RechartsLegend 
                verticalAlign="top" 
                height={32} 
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} 
              />
              
              {selectedYear === 'all' ? (
                <>
                  {/* Dynamic Multi-Year Comparison Lines */}
                  {availableYears.map((yr, idx) => {
                    const colors = ['#10b981', '#06b6d4', '#a855f7', '#ec4899', '#3b82f6'];
                    const color = colors[idx % colors.length];
                    return (
                      <Line
                        key={yr}
                        type="monotone"
                        dataKey={`Laba Bersih ${yr}`}
                        name={`Laba Bersih ${yr}`}
                        stroke={color}
                        strokeWidth={idx === 0 ? 3 : 2.5}
                        strokeDasharray={idx === 0 ? undefined : '4 4'}
                        dot={{ fill: color, r: idx === 0 ? 4 : 3 }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
                  <Line
                    type="monotone"
                    dataKey="Total Laba Bersih (All-Time)"
                    name="Kumulatif All-Time"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3 }}
                  />
                </>
              ) : (
                <>
                  {/* Single Year Primary Net Line */}
                  <Line
                    type="monotone"
                    dataKey="Laba Bersih (Net)"
                    name="Laba Bersih (Net)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#022c22' }}
                    activeDot={{ r: 7, stroke: '#ecfdf5', strokeWidth: 2 }}
                  />

                  {showComparisonLines && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Pemasukan Kotor"
                        name="Pemasukan Kotor"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ fill: '#06b6d4', r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Biaya Operasional"
                        name="Biaya Operasional"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ fill: '#f43f5e', r: 3 }}
                      />
                    </>
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Render Revenue Chart (Bar & Ranking) */}
      {(activeReportTab === 'chart' || activeReportTab === 'both') && (
        <RevenueChart
          fleet={fleet}
          transactions={combinedTransactions}
          expenses={combinedExpenses}
          selectedYear={selectedYear}
        />
      )}

      {/* Render Table Matrix */}
      {(activeReportTab === 'table' || activeReportTab === 'both') && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                📋 Matriks Bulanan 13 Armada Motor · {selectedYear === 'all' ? 'Seluruh Riwayat (All-Time)' : `Tahun ${selectedYear}`}
              </span>
              <span className="text-slate-400">
                Formula: Pemasukan Sewa - Biaya Servis/Operasional
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                    <th className="py-3 px-3 text-center sticky left-0 bg-slate-950 z-10 w-10">No</th>
                    <th className="py-3 px-3 sticky left-10 bg-slate-950 z-10 min-w-[120px]">Nama Unit</th>
                    <th className="py-3 px-3 sticky left-36 bg-slate-950 z-10 min-w-[110px]">Nopol</th>
                    {INDONESIAN_MONTHS_SHORT.map((m) => (
                      <th key={m} className="py-3 px-2 text-right min-w-[75px]">
                        {m}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right bg-slate-950 font-bold min-w-[120px]">
                      Total {metricView === 'net' ? 'Net' : metricView === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </th>
                    <th className="py-3 px-4 text-right bg-cyan-950/40 text-cyan-300 font-bold min-w-[140px]">
                      Rata2 Sewa (ADR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {reportData.map((row) => {
                    const values = metricView === 'net' ? row.monthlyNet : metricView === 'income' ? row.monthlyIncome : row.monthlyExpense;
                    const total = metricView === 'net' ? row.totalNetYear : metricView === 'income' ? row.totalIncomeYear : row.totalExpenseYear;

                    return (
                      <tr 
                        key={row.nopol}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 sticky left-0 bg-slate-900 z-10">
                          {row.no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white sticky left-10 bg-slate-900 z-10 whitespace-nowrap">
                          {row.namaUnit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 sticky left-36 bg-slate-900 z-10 whitespace-nowrap">
                          {row.nopol}
                        </td>

                        {/* 12 Months Columns */}
                        {values.map((val, idx) => (
                          <td 
                            key={idx}
                            className={`py-2.5 px-2 text-right font-mono tabular-nums whitespace-nowrap ${
                              val > 0
                                ? metricView === 'expense' ? 'text-rose-400' : 'text-slate-200'
                                : val < 0
                                ? 'text-rose-400 font-semibold'
                                : 'text-slate-600'
                            }`}
                          >
                            {val === 0 ? '-' : (val / 1000).toLocaleString('id-ID') + 'k'}
                          </td>
                        ))}

                        {/* Total column */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white bg-slate-950/40 tabular-nums whitespace-nowrap">
                          {formatRupiah(total)}
                        </td>

                        {/* ADR Column */}
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-cyan-400 bg-cyan-950/20 tabular-nums whitespace-nowrap">
                          {formatRupiah(row.adr)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Row matching `=SUM(col4:col16)` */}
                  <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                    <td colSpan={3} className="py-3 px-3 text-right sticky left-0 bg-slate-950 z-10">
                      TOTAL PENDAPATAN KESELURUHAN:
                    </td>
                    {monthlyTotals.map((tot, idx) => (
                      <td key={idx} className="py-3 px-2 text-right font-mono tabular-nums text-cyan-300">
                        {tot === 0 ? '-' : (tot / 1000).toLocaleString('id-ID') + 'k'}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right font-mono text-cyan-400 tabular-nums text-sm">
                      {formatRupiah(grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 tabular-nums">
                      {formatRupiah(averageFleetADR)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>* Nilai per bulan disajikan dalam satuan ribuan (k) untuk kemudahan membaca. Kolom total menggunakan format Rupiah lengkap.</span>
            <span className="font-mono">Formula: ADR = Rata-rata Tarif / Hari per Unit</span>
          </div>
        </div>
      )}

    </div>
  );
};
