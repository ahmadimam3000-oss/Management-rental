import React, { useState, useMemo } from 'react';
import { MotorMaster, TransaksiSewa, PengeluaranMotor } from '../types/rental';
import { formatRupiah, INDONESIAN_MONTHS_SHORT } from '../utils/formatters';
import { BarChart3, TrendingUp, DollarSign, Wallet, ArrowUpRight, Percent, Award } from 'lucide-react';

interface RevenueChartProps {
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  expenses: PengeluaranMotor[];
  selectedYear: number | 'all';
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  fleet,
  transactions,
  expenses,
  selectedYear
}) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Compute monthly data for the selected year or all-time
  const monthlyData = useMemo(() => {
    const months = INDONESIAN_MONTHS_SHORT.map((name, index) => {
      // Find transactions in this month
      const trxs = transactions.filter(t => {
        const d = new Date(t.waktuStartSewa);
        const matchesYear = selectedYear === 'all' ? true : d.getFullYear() === selectedYear;
        return matchesYear && d.getMonth() === index;
      });

      // Find expenses in this month
      const exps = expenses.filter(e => {
        const d = new Date(e.tanggal);
        const matchesYear = selectedYear === 'all' ? true : d.getFullYear() === selectedYear;
        return matchesYear && d.getMonth() === index;
      });

      const income = trxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
      const expense = exps.reduce((sum, e) => sum + e.nominal, 0);
      const net = income - expense;
      const margin = income > 0 ? Math.round((net / income) * 100) : 0;

      return {
        monthIndex: index,
        name,
        income,
        expense,
        net,
        margin,
        trxCount: trxs.length,
        expCount: exps.length
      };
    });

    return months;
  }, [transactions, expenses, selectedYear]);

  // Overall totals
  const totalIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
  const totalExpense = monthlyData.reduce((acc, m) => acc + m.expense, 0);
  const totalNet = totalIncome - totalExpense;
  const overallMargin = totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0;

  // Max value for scaling SVG chart
  const maxVal = Math.max(
    ...monthlyData.map(m => Math.max(m.income, m.expense, Math.abs(m.net))),
    500000 // minimum scale baseline
  );

  // Motor fleet breakdown
  const fleetBreakdown = useMemo(() => {
    return fleet.map(bike => {
      const bikeTrxs = transactions.filter(t => {
        const d = new Date(t.waktuStartSewa);
        const matchesYear = selectedYear === 'all' ? true : d.getFullYear() === selectedYear;
        return t.nopolMotor === bike.nopol && matchesYear;
      });

      const bikeExps = expenses.filter(e => {
        const d = new Date(e.tanggal);
        const matchesYear = selectedYear === 'all' ? true : d.getFullYear() === selectedYear;
        return e.nopolMotor === bike.nopol && matchesYear;
      });

      const income = bikeTrxs.reduce((sum, t) => sum + t.totalPemasukan, 0);
      const expense = bikeExps.reduce((sum, e) => sum + e.nominal, 0);
      const net = income - expense;
      const rates = bikeTrxs.map(t => t.hargaPerHari);
      const adr = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
      const share = totalIncome > 0 ? Math.round((income / totalIncome) * 100) : 0;

      return {
        namaUnit: bike.namaUnit,
        nopol: bike.nopol,
        tipeMotor: bike.tipeMotor,
        income,
        expense,
        net,
        adr,
        share,
        rentalsCount: bikeTrxs.length
      };
    }).sort((a, b) => b.income - a.income);
  }, [fleet, transactions, expenses, selectedYear, totalIncome]);

  // Best month
  const bestMonth = [...monthlyData].sort((a, b) => b.income - a.income)[0];

  // SVG dimensions for trend curve
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  // Generate SVG points for smooth curve
  const pointsIncome = monthlyData.map((m, i) => {
    const x = paddingX + (i / 11) * usableWidth;
    const y = chartHeight - paddingY - (m.income / maxVal) * usableHeight;
    return { x, y };
  });

  const pointsNet = monthlyData.map((m, i) => {
    const x = paddingX + (i / 11) * usableWidth;
    const yVal = Math.max(0, m.net);
    const y = chartHeight - paddingY - (yVal / maxVal) * usableHeight;
    return { x, y };
  });

  const pointsExpense = monthlyData.map((m, i) => {
    const x = paddingX + (i / 11) * usableWidth;
    const y = chartHeight - paddingY - (m.expense / maxVal) * usableHeight;
    return { x, y };
  });

  // SVG path builder for smooth spline
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const pathIncome = createSmoothPath(pointsIncome);
  const pathNet = createSmoothPath(pointsNet);
  const pathExpense = createSmoothPath(pointsExpense);

  const areaPathIncome = `${pathIncome} L ${pointsIncome[pointsIncome.length - 1].x} ${chartHeight - paddingY} L ${pointsIncome[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="space-y-6">
      
      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Pemasukan ({selectedYear === 'all' ? 'Semua Riwayat' : selectedYear})</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums mt-1">
            {formatRupiah(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Omset kotor seluruh rental</span>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Biaya Operasional</span>
            <Wallet className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-1">
            {formatRupiah(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Servis, oli, cuci &amp; perbaikan
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Laba Bersih Kumulatif</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            {formatRupiah(totalNet)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margin Bersih: <span className="font-mono text-white font-bold">{overallMargin}%</span>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Bulan Tertinggi</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {bestMonth ? bestMonth.name : 'Januari'}
          </div>
          <div className="text-[11px] text-amber-400 font-mono mt-1">
            {formatRupiah(bestMonth ? bestMonth.income : 0)} ({bestMonth?.trxCount || 0} sewa)
          </div>
        </div>

      </div>

      {/* Main Monthly Revenue Chart */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Grafik Pendapatan, Biaya &amp; Laba Bersih ({selectedYear === 'all' ? 'Seluruh Riwayat' : `Tahun ${selectedYear}`})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tren performa finansial 12 bulan dari seluruh armada sewa motor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-cyan-500"></span>
                <span className="text-slate-300">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                <span className="text-slate-300">Pengeluaran</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-400"></span>
                <span className="text-slate-300">Laba Bersih</span>
              </div>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartType === 'bar'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Grafik Batang
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartType === 'area'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Kurva Tren
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="relative pt-2">
          
          {chartType === 'bar' ? (
            /* Bar Chart Layout */
            <div className="h-64 flex items-end justify-between gap-1 sm:gap-3 px-2 pt-6">
              {monthlyData.map((m, idx) => {
                const incomeHeightPct = maxVal > 0 ? (m.income / maxVal) * 100 : 0;
                const expenseHeightPct = maxVal > 0 ? (m.expense / maxVal) * 100 : 0;
                const netHeightPct = maxVal > 0 ? (Math.max(0, m.net) / maxVal) * 100 : 0;
                const isHovered = hoveredMonth === idx;

                return (
                  <div
                    key={m.name}
                    onMouseEnter={() => setHoveredMonth(idx)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-24 z-30 bg-slate-950/95 border border-slate-700 p-2.5 rounded-lg shadow-xl text-[11px] whitespace-nowrap pointer-events-none min-w-[160px]">
                        <div className="font-bold text-white mb-1 border-b border-slate-800 pb-1">
                          Bulan: {m.name} {selectedYear}
                        </div>
                        <div className="text-cyan-400 flex justify-between gap-2">
                          <span>Pemasukan:</span>
                          <span className="font-mono font-bold">{formatRupiah(m.income)}</span>
                        </div>
                        <div className="text-rose-400 flex justify-between gap-2">
                          <span>Pengeluaran:</span>
                          <span className="font-mono font-bold">{formatRupiah(m.expense)}</span>
                        </div>
                        <div className="text-emerald-400 flex justify-between gap-2 font-bold pt-1 border-t border-slate-800/80">
                          <span>Laba Bersih:</span>
                          <span className="font-mono">{formatRupiah(m.net)}</span>
                        </div>
                      </div>
                    )}

                    {/* Bars cluster */}
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-48">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${Math.max(incomeHeightPct, 4)}%` }}
                        className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                          m.income > 0 ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-slate-800/60'
                        }`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expenseHeightPct, 4)}%` }}
                        className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                          m.expense > 0 ? 'bg-rose-500 hover:bg-rose-400' : 'bg-slate-800/60'
                        }`}
                      />
                      {/* Net Bar */}
                      <div
                        style={{ height: `${Math.max(netHeightPct, 4)}%` }}
                        className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                          m.net > 0 ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-slate-800/40'
                        }`}
                      />
                    </div>

                    {/* Month Label */}
                    <div className="mt-2 text-[11px] font-medium text-slate-400 group-hover:text-cyan-300 transition-colors">
                      {m.name}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Area / Spline Curve Chart Layout */
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-64 overflow-visible"
              >
                <defs>
                  <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="4 4" />
                <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#1e293b" strokeDasharray="4 4" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#334155" />

                {/* Area under Income curve */}
                <path d={areaPathIncome} fill="url(#incomeAreaGrad)" />

                {/* Income Line */}
                <path d={pathIncome} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />

                {/* Expense Line */}
                <path d={pathExpense} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />

                {/* Net Profit Line */}
                <path d={pathNet} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

                {/* Points on Income Line */}
                {pointsIncome.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredMonth === i ? 6 : 3.5}
                    className="cursor-pointer transition-all duration-150 fill-cyan-400 stroke-slate-950 stroke-2"
                    onMouseEnter={() => setHoveredMonth(i)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  />
                ))}

                {/* Month labels at bottom of SVG */}
                {monthlyData.map((m, i) => {
                  const x = paddingX + (i / 11) * usableWidth;
                  return (
                    <text
                      key={m.name}
                      x={x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 font-sans"
                    >
                      {m.name}
                    </text>
                  );
                })}
              </svg>

              {/* Tooltip for curve mode */}
              {hoveredMonth !== null && (
                <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Bulan: </span>
                    <span className="font-bold text-white">{monthlyData[hoveredMonth].name} {selectedYear}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Pemasukan: </span>
                    <span className="font-mono font-bold text-cyan-400">{formatRupiah(monthlyData[hoveredMonth].income)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Biaya: </span>
                    <span className="font-mono font-bold text-rose-400">{formatRupiah(monthlyData[hoveredMonth].expense)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Laba Bersih: </span>
                    <span className="font-mono font-bold text-emerald-400">{formatRupiah(monthlyData[hoveredMonth].net)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Margin: </span>
                    <span className="font-mono font-bold text-white">{monthlyData[hoveredMonth].margin}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Fleet Breakdown: Revenue Contribution Ranking by 13 Units */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">
              🏍️ Kontribusi Pendapatan per Unit Motor (13 Fleet)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Peringkat unit motor berdasarkan pendapatan kotor, laba bersih, dan rata-rata tarif harian (ADR).
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Diurutkan dari omset tertinggi
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fleetBreakdown.map((item, idx) => {
            const maxFleetIncome = fleetBreakdown[0]?.income || 1;
            const barPct = (item.income / maxFleetIncome) * 100;

            return (
              <div 
                key={item.nopol}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white text-xs">{item.namaUnit}</div>
                      <div className="font-mono text-[11px] text-slate-400">{item.nopol} · {item.tipeMotor}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-cyan-400 text-xs tabular-nums">
                      {formatRupiah(item.income)}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      Net: {formatRupiah(item.net)}
                    </div>
                  </div>
                </div>

                {/* Relative progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.max(barPct, 2)}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>{item.rentalsCount} kali sewa diselesaikan</span>
                  <span>ADR: <strong className="font-mono text-slate-200">{formatRupiah(item.adr)}</strong>/hari</span>
                  <span>Share: <strong className="font-mono text-white">{item.share}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
