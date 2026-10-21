import React, { useState } from 'react';
import { PengeluaranMotor, MotorMaster, ExpenseCategory } from '../types/rental';
import { formatRupiah, formatIndonesianDateTime, exportExpensesToCSV } from '../utils/formatters';
import { Search, Download, Plus, Wrench, Trash2, ArrowUpDown, CalendarCheck } from 'lucide-react';

interface ExpensesTableProps {
  expenses: PengeluaranMotor[];
  fleet: MotorMaster[];
  activeBookYear?: number;
  onOpenNewExpense: (prefillNopol?: string) => void;
  onDeleteExpense: (id: string) => void;
  onOpenYearRollover?: () => void;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  fleet,
  activeBookYear = 2026,
  onOpenNewExpense,
  onDeleteExpense,
  onOpenYearRollover
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterNopol, setFilterNopol] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState(false);

  const availableYears = Array.from(
    new Set<number>([
      activeBookYear,
      2026,
      2025,
      ...expenses.map(e => new Date(e.tanggal).getFullYear()).filter(y => !isNaN(y))
    ])
  ).sort((a, b) => b - a);

  const filtered = expenses.filter(item => {
    if (filterYear !== 'all' && new Date(item.tanggal).getFullYear() !== parseInt(filterYear)) return false;
    if (filterCategory !== 'all' && item.kategoriBiaya !== filterCategory) return false;
    if (filterNopol !== 'all' && item.nopolMotor !== filterNopol) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNopol = item.nopolMotor.toLowerCase().includes(q);
      const matchKeterangan = item.keteranganBengkel.toLowerCase().includes(q);
      const matchPj = item.penanggungJawab.toLowerCase().includes(q);
      if (!matchNopol && !matchKeterangan && !matchPj) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const timeA = new Date(a.tanggal).getTime();
    const timeB = new Date(b.tanggal).getTime();
    return sortAsc ? timeA - timeB : timeB - timeA;
  });

  const totalExpenseSum = filtered.reduce((acc, curr) => acc + curr.nominal, 0);

  const bikeMap = new Map<string, MotorMaster>();
  fleet.forEach(b => bikeMap.set(b.nopol, b));

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bengkel, sparepart, penanggung jawab, nopol..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="bg-slate-950 border border-cyan-800/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
          >
            <option value="all">📅 Semua Tahun</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr.toString()}>
                📅 Tahun {yr} {yr === activeBookYear ? '(Aktif)' : ''}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="Service Rutin & Oli">Service Rutin & Oli</option>
            <option value="Sparepart & Ban">Sparepart & Ban</option>
            <option value="Cuci Motor">Cuci Motor</option>
            <option value="Pajak & STNK">Pajak & STNK</option>
            <option value="Bensin Operasional">Bensin Operasional</option>
            <option value="Lainnya">Lainnya</option>
          </select>

          {/* Nopol Filter */}
          <select
            value={filterNopol}
            onChange={e => setFilterNopol(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Motor</option>
            {fleet.map(b => (
              <option key={b.nopol} value={b.nopol}>
                {b.namaUnit} ({b.nopol})
              </option>
            ))}
          </select>

          {onOpenYearRollover && (
            <button
              onClick={onOpenYearRollover}
              title="Pergantian Tahun, Otomatis Rekap Data & Pembuatan Tahun Buku Baru"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/70 rounded-lg transition-colors whitespace-nowrap"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tutup Buku / Tahun Baru</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={() => exportExpensesToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {/* New Expense */}
          <button
            onClick={() => onOpenNewExpense()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Expense Stats Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
        <div className="text-slate-400">
          Total Pengeluaran Tercatat: <span className="font-mono text-white font-semibold">{filtered.length} transaksi</span>
        </div>
        <div className="text-slate-300">
          Akumulasi Nominal:{' '}
          <span className="font-mono text-rose-400 font-bold tabular-nums text-sm">
            {formatRupiah(totalExpenseSum)}
          </span>
        </div>
      </div>

      {/* Expenses Grid */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                <th 
                  onClick={() => setSortAsc(!sortAsc)}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal & Waktu</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Unit Motor</th>
                <th className="py-3 px-4">Kategori Biaya</th>
                <th className="py-3 px-4">Keterangan / Bengkel</th>
                <th className="py-3 px-4">Penanggung Jawab</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Belum ada catatan pengeluaran sesuai filter.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const bike = bikeMap.get(item.nopolMotor);

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                        {formatIndonesianDateTime(item.tanggal)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {bike ? bike.namaUnit : item.nopolMotor}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {item.nopolMotor}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {item.kategoriBiaya}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs">
                        {item.keteranganBengkel}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {item.penanggungJawab}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 tabular-nums whitespace-nowrap">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onDeleteExpense(item.id)}
                          title="Hapus Pengeluaran"
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
