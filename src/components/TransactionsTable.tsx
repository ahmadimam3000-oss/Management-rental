import React, { useState } from 'react';
import { TransaksiSewa, MotorMaster, FrequentRenter } from '../types/rental';
import { 
  formatRupiah, 
  formatIndonesianDateTime, 
  checkIsOverdue, 
  exportTransactionsToCSV 
} from '../utils/formatters';
import { 
  Search, 
  Download, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ArrowUpDown,
  FileText,
  UserCheck,
  Star,
  CalendarCheck
} from 'lucide-react';

interface TransactionsTableProps {
  transactions: TransaksiSewa[];
  fleet: MotorMaster[];
  frequentRenters?: FrequentRenter[];
  activeBookYear?: number;
  onCheckInRow: (trxId: string) => void;
  onCheckOutRow: (trxId: string) => void;
  onOpenWhatsApp: (trx: TransaksiSewa) => void;
  onDeleteTransaction: (trxId: string) => void;
  onOpenNewRental: () => void;
  onSaveCustomerToDatabase?: (trx: TransaksiSewa) => void;
  onOpenYearRollover?: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  fleet,
  frequentRenters,
  activeBookYear = 2026,
  onCheckInRow,
  onCheckOutRow,
  onOpenWhatsApp,
  onDeleteTransaction,
  onOpenNewRental,
  onSaveCustomerToDatabase,
  onOpenYearRollover
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterNopol, setFilterNopol] = useState<string>('all');
  const [filterHelm, setFilterHelm] = useState<string>('all');
  const [filterBensin, setFilterBensin] = useState<string>('all');
  const [filterMetodeBayar, setFilterMetodeBayar] = useState<string>('all');
  const [sortField, setSortField] = useState<'waktuStartSewa' | 'totalPemasukan' | 'namaPenyewa'>('waktuStartSewa');
  const [sortAsc, setSortAsc] = useState(false);

  const availableYears = Array.from(
    new Set<number>([
      activeBookYear,
      2026,
      2025,
      ...transactions.map(t => new Date(t.waktuStartSewa).getFullYear()).filter(y => !isNaN(y))
    ])
  ).sort((a, b) => b - a);

  // Bike map for quick model lookups
  const bikeMap = new Map<string, MotorMaster>();
  fleet.forEach(b => bikeMap.set(b.nopol, b));

  const resolveHelm = (trx: TransaksiSewa): string => {
    if (trx.jumlahHelm) return trx.jumlahHelm;
    const cat = (trx.catatanJaminanTambahan || '').toLowerCase();
    if (cat.includes('0 helm') || cat.includes('tanpa helm')) return '0';
    if (cat.includes('1 helm') || cat.includes('1 pc')) return '1';
    return '2';
  };

  const resolveBensin = (trx: TransaksiSewa): string => {
    if (trx.levelBensin) return trx.levelBensin;
    const cat = (trx.catatanJaminanTambahan || '').toLowerCase();
    if (cat.includes('full') || cat.includes('penuh')) return 'Full Kotak';
    if (cat.includes('5 kotak')) return '5 Kotak';
    if (cat.includes('4 kotak')) return '4 Kotak';
    if (cat.includes('3 kotak')) return '3 Kotak';
    if (cat.includes('2 kotak')) return '2 Kotak';
    return '1 Kotak';
  };

  const filtered = transactions.filter(trx => {
    if (filterYear !== 'all') {
      const trxYear = new Date(trx.waktuStartSewa).getFullYear();
      const isCarryOverActive = trx.statusUnit === 'Disewa' || trx.statusUnit === 'Booking' || trx.statusUnit === 'Overdue';
      if (trxYear !== parseInt(filterYear) && !isCarryOverActive) return false;
    }
    if (filterStatus !== 'all' && trx.statusUnit !== filterStatus) return false;
    if (filterNopol !== 'all' && trx.nopolMotor !== filterNopol) return false;
    if (filterHelm !== 'all' && resolveHelm(trx) !== filterHelm) return false;
    if (filterBensin !== 'all' && resolveBensin(trx) !== filterBensin) return false;
    if (filterMetodeBayar !== 'all' && (trx.metodePembayaran || 'Tunai') !== filterMetodeBayar) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const qDigits = searchQuery.replace(/\D/g, '');
      const matchName = trx.namaPenyewa.toLowerCase().includes(q);
      const trxDigits = trx.whatsapp.replace(/\D/g, '');
      const matchWa = trx.whatsapp.includes(q) || (qDigits.length > 0 && trxDigits.includes(qDigits));
      const matchNopol = trx.nopolMotor.toLowerCase().includes(q);
      const matchAlamat = trx.alamatAsalKos.toLowerCase().includes(q);
      const matchId = trx.id.toLowerCase().includes(q);
      if (!matchName && !matchWa && !matchNopol && !matchAlamat && !matchId) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'waktuStartSewa') {
      comparison = new Date(a.waktuStartSewa).getTime() - new Date(b.waktuStartSewa).getTime();
    } else if (sortField === 'totalPemasukan') {
      comparison = a.totalPemasukan - b.totalPemasukan;
    } else if (sortField === 'namaPenyewa') {
      comparison = a.namaPenyewa.localeCompare(b.namaPenyewa);
    }
    return sortAsc ? comparison : -comparison;
  });

  const handleSort = (field: 'waktuStartSewa' | 'totalPemasukan' | 'namaPenyewa') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getHelmBadge = (trx: TransaksiSewa) => {
    const count = resolveHelm(trx);
    if (count === '0') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap" title="0 Helm (Bawa Sendiri / Tanpa Helm)">
          <span>🪖</span>
          <span>0 Helm</span>
        </span>
      );
    }
    if (count === '1') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 whitespace-nowrap" title="1 Helm SNI">
          <span>🪖</span>
          <span>1 Helm</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 whitespace-nowrap" title="2 Helm SNI">
        <span>🪖</span>
        <span>2 Helm</span>
      </span>
    );
  };

  const getBensinIndicator = (trx: TransaksiSewa) => {
    const level = resolveBensin(trx);
    let filled = 1;
    if (level === '2 Kotak') filled = 2;
    else if (level === '3 Kotak') filled = 3;
    else if (level === '4 Kotak') filled = 4;
    else if (level === '5 Kotak') filled = 5;
    else if (level === 'Full Kotak') filled = 5;

    const isFull = level === 'Full Kotak';

    return (
      <div className="inline-flex flex-col gap-1 items-start" title={`Bensin Awal: ${level}`}>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(bar => (
            <span
              key={bar}
              className={`w-2.5 h-3.5 rounded-xs transition-all ${
                bar <= filled
                  ? isFull
                    ? 'bg-emerald-400 shadow-xs shadow-emerald-500/50'
                    : bar >= 4
                    ? 'bg-amber-400 shadow-xs shadow-amber-500/50'
                    : 'bg-cyan-400'
                  : 'bg-slate-800 border border-slate-700/60'
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-mono font-medium ${isFull ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
          ⛽ {level}
        </span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disewa':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60">Disewa</span>;
      case 'Selesai':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60">Selesai</span>;
      case 'Booking':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60">Booking</span>;
      case 'Overdue':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/80 animate-pulse">Overdue</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold text-slate-400 bg-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters, CSV Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama penyewa, nomor WhatsApp (08... / 62...), nopol, alamat..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Status</option>
            <option value="Disewa">Disewa</option>
            <option value="Booking">Booking</option>
            <option value="Overdue">Overdue</option>
            <option value="Selesai">Selesai</option>
          </select>

          {/* Nopol Motor Filter */}
          <select
            value={filterNopol}
            onChange={e => setFilterNopol(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Motor (13 Unit)</option>
            {fleet.map(b => (
              <option key={b.nopol} value={b.nopol}>
                {b.namaUnit} - {b.nopol} ({b.tipeMotor})
              </option>
            ))}
          </select>

          {/* Helm Filter */}
          <select
            value={filterHelm}
            onChange={e => setFilterHelm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">🪖 Semua Helm</option>
            <option value="0">0 Helm (Bawa Sendiri)</option>
            <option value="1">1 Helm SNI</option>
            <option value="2">2 Helm SNI</option>
          </select>

          {/* Bensin Filter */}
          <select
            value={filterBensin}
            onChange={e => setFilterBensin(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">⛽ Semua Bensin</option>
            <option value="1 Kotak">1 Kotak</option>
            <option value="2 Kotak">2 Kotak</option>
            <option value="3 Kotak">3 Kotak</option>
            <option value="4 Kotak">4 Kotak</option>
            <option value="5 Kotak">5 Kotak</option>
            <option value="Full Kotak">Full Kotak</option>
          </select>

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

          {/* Metode Pembayaran Filter */}
          <select
            value={filterMetodeBayar}
            onChange={e => setFilterMetodeBayar(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">💳 Semua Pembayaran</option>
            <option value="Tunai">💵 1. Tunai</option>
            <option value="Transfer BRI">🏦 2. Transfer BRI</option>
            <option value="QRIS">📱 3. QRIS</option>
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

          {/* Export to CSV button */}
          <button
            onClick={() => exportTransactionsToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {/* New Rental Button */}
          <button
            onClick={onOpenNewRental}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>+ Catat Sewa</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                <th className="py-3 px-3">ID / Hari</th>
                <th 
                  onClick={() => handleSort('namaPenyewa')} 
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Penyewa & Kontak</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Unit Motor</th>
                <th className="py-3 px-3">🪖 Helm</th>
                <th className="py-3 px-3">⛽ Bensin</th>
                <th className="py-3 px-3">Kategori</th>
                <th 
                  onClick={() => handleSort('waktuStartSewa')} 
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Mulai & Durasi</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Est. Kembali</th>
                <th 
                  onClick={() => handleSort('totalPemasukan')} 
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total (Rp)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status Unit</th>
                <th className="py-3 px-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Tidak ada transaksi sewa yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                sorted.map((trx) => {
                  const bike = bikeMap.get(trx.nopolMotor);
                  const overdue = checkIsOverdue(trx);

                  return (
                    <tr 
                      key={trx.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID & Hari Sewa (Auto-Day) */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="font-mono text-cyan-400 font-semibold">{trx.id}</div>
                        <div className="text-[11px] font-medium text-amber-300/90 mt-0.5">
                          📅 {trx.hariSewa || 'Otomatis'}
                        </div>
                      </td>

                      {/* Penyewa & Kontak & Alamat */}
                      <td className="py-3 px-3 align-top max-w-[220px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white truncate">{trx.namaPenyewa}</span>
                          {(() => {
                            const cleanPhone = trx.whatsapp.replace(/\D/g, '');
                            const isFrequent = frequentRenters?.some(
                              r => r.whatsapp.replace(/\D/g, '') === cleanPhone || r.nama.toLowerCase() === trx.namaPenyewa.toLowerCase()
                            );
                            if (isFrequent) {
                              return (
                                <span className="text-[10px] bg-amber-950/70 border border-amber-800/80 text-amber-300 px-1 py-0.2 rounded inline-flex items-center gap-0.5 font-medium shrink-0" title="Pelanggan Terdaftar di Database Penyewa Setia">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  <span>Setia</span>
                                </span>
                              );
                            }
                            if (onSaveCustomerToDatabase) {
                              return (
                                <button
                                  onClick={() => onSaveCustomerToDatabase(trx)}
                                  title="Simpan ke Database Penyewa Setia (CRM)"
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-0.5 shrink-0"
                                >
                                  + CRM
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] truncate flex items-center gap-1 mt-0.5">
                          <span>+{trx.whatsapp}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5" title={trx.alamatAsalKos}>
                          {trx.alamatAsalKos}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 inline-flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Jaminan: {trx.identitasDijaminkan}</span>
                        </div>
                      </td>

                      {/* Unit Motor */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="font-semibold text-slate-200">
                          {bike ? bike.namaUnit : trx.nopolMotor}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {trx.nopolMotor}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {bike ? bike.tipeMotor : '-'}
                        </div>
                      </td>

                      {/* Kolom Helm (0/1/2 Helm) */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {getHelmBadge(trx)}
                      </td>

                      {/* Kolom Bensin (1/2/3/4/5/Full Kotak) */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {getBensinIndicator(trx)}
                      </td>

                      {/* Kategori Pelanggan */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <span className="text-[11px] text-slate-300 font-medium">
                          {trx.kategoriPelanggan}
                        </span>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                          {formatRupiah(trx.hargaPerHari)}/hr
                        </div>
                      </td>

                      {/* Waktu Start Sewa & Durasi */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="text-slate-200 font-mono tabular-nums text-[11px]">
                          {formatIndonesianDateTime(trx.waktuStartSewa)}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {trx.paketKhusus === 'Per Jam' ? (
                            <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded font-semibold">
                              ⏱️ {trx.durasiJam || 1} Jam (Per Jam)
                            </span>
                          ) : (
                            <span className="text-[11px] text-cyan-400 font-medium">
                              {trx.lamaSewaHari} Hari
                            </span>
                          )}
                          {trx.tambahanJam && trx.tambahanJam > 0 && trx.paketKhusus !== 'Per Jam' && (
                            <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-1 py-0.2 rounded font-mono font-medium" title={`Tambahan ${trx.tambahanJam} Jam`}>
                              +{trx.tambahanJam} Jam
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Est Waktu Kembali */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className={`font-mono tabular-nums text-[11px] ${
                          overdue.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}>
                          {formatIndonesianDateTime(trx.estWaktuKembali)}
                        </div>
                        {overdue.isOverdue && (
                          <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Telat {overdue.hoursLate} Jam</span>
                          </div>
                        )}
                        {trx.statusUnit === 'Selesai' && trx.waktuSelesai && (
                          <div className="text-[10px] text-emerald-400 mt-0.5">
                            Kembali: {formatIndonesianDateTime(trx.waktuSelesai)}
                          </div>
                        )}
                      </td>

                      {/* Total Pemasukan, Metode Pembayaran & Status Bayar */}
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="font-bold font-mono text-white tabular-nums">
                          {formatRupiah(trx.totalPemasukan)}
                        </div>
                        <div className={`text-[10px] font-medium font-mono mt-0.5 ${
                          trx.statusBayar === 'Lunas' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {trx.statusBayar}
                        </div>
                        <div className="mt-1">
                          {trx.metodePembayaran === 'Transfer BRI' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/70" title="Transfer BRI 603201007355508 An Ahmad imam makhali">
                              🏦 Transfer BRI
                            </span>
                          ) : trx.metodePembayaran === 'QRIS' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/70" title="QRIS AI RENT FOOD GROUP">
                              📱 QRIS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              💵 Tunai
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Unit */}
                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        {getStatusBadge(trx.statusUnit)}
                      </td>

                      {/* Aksi Cepat: Check In, Check Out, WhatsApp, Delete */}
                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* If booking, show Check-In button (matching checkInActiveRow) */}
                          {trx.statusUnit === 'Booking' && (
                            <button
                              onClick={() => onCheckInRow(trx.id)}
                              title="📲 Check-In Unit Sekarang (Mulai Sewa)"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded transition-colors"
                            >
                              Check-In
                            </button>
                          )}

                          {/* If disewa or overdue, show Check-Out button (matching checkOutActiveRow) */}
                          {(trx.statusUnit === 'Disewa' || trx.statusUnit === 'Overdue') && (
                            <button
                              onClick={() => onCheckOutRow(trx.id)}
                              title="🏁 Check-Out Unit (Selesai)"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                            >
                              Check-Out
                            </button>
                          )}

                          {/* WhatsApp Invoice generator */}
                          <button
                            onClick={() => onOpenWhatsApp(trx)}
                            title="Kirim Nota / Chat WhatsApp ke Penyewa"
                            className="p-1 text-emerald-400 hover:text-white hover:bg-emerald-900/60 rounded border border-emerald-800/40 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete transaction */}
                          <button
                            onClick={() => onDeleteTransaction(trx.id)}
                            title="Hapus baris transaksi"
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
