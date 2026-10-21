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
  AlertCircle, 
  RotateCcw, 
  ArrowUpDown,
  FileText,
  UserCheck,
  Star,
  CalendarCheck,
  X,
  CheckCircle2
} from 'lucide-react';

interface TransactionsTableProps {
  transactions: TransaksiSewa[];
  fleet: MotorMaster[];
  frequentRenters?: FrequentRenter[];
  activeBookYear?: number;
  onCheckInRow: (trxId: string) => void;
  onCheckOutRow: (trxId: string) => void;
  onOpenWhatsApp: (trx: TransaksiSewa) => void;
  onRefundTransaction: (trxId: string, nominalRefund: number, keteranganRefund: string) => void;
  onOpenNewRental: () => void;
  onSaveCustomerToDatabase?: (trx: TransaksiSewa) => void;
  onOpenYearRollover?: () => void;
}

const REFUND_REASON_PRESETS = [
  'Pembatalan booking oleh penyewa',
  'Perubahan jadwal / tanggal sewa',
  'Pengembalian unit lebih awal (potong hari)',
  'Ganti unit motor / kendala teknis armada',
  'Pengembalian kelebihan bayar / uang DP'
];

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  fleet,
  frequentRenters,
  activeBookYear = 2026,
  onCheckInRow,
  onCheckOutRow,
  onOpenWhatsApp,
  onRefundTransaction,
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

  // Refund Modal State
  const [refundTargetTrx, setRefundTargetTrx] = useState<TransaksiSewa | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundNominal, setRefundNominal] = useState<number>(0);
  const [refundDescription, setRefundDescription] = useState<string>('');
  const [refundError, setRefundError] = useState<string>('');

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

  const getOriginalAmount = (trx: TransaksiSewa): number => {
    if (typeof trx.pemasukanAwalSebelumRefund === 'number') {
      return trx.pemasukanAwalSebelumRefund;
    }
    return trx.totalPemasukan + (trx.nominalRefund || 0);
  };

  const handleOpenRefundModal = (trx: TransaksiSewa) => {
    const origAmount = getOriginalAmount(trx);
    setRefundTargetTrx(trx);
    if (trx.statusUnit === 'Refund' && typeof trx.nominalRefund === 'number') {
      setRefundNominal(trx.nominalRefund);
      setRefundType(trx.nominalRefund >= origAmount ? 'full' : 'partial');
      setRefundDescription(trx.keteranganRefund || '');
    } else {
      setRefundNominal(origAmount);
      setRefundType('full');
      setRefundDescription(trx.keteranganRefund || '');
    }
    setRefundError('');
  };

  const handleCloseRefundModal = () => {
    setRefundTargetTrx(null);
    setRefundError('');
  };

  const handleSubmitRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetTrx) return;

    const cleanDesc = refundDescription.trim();
    if (!cleanDesc) {
      setRefundError('Harap isi keterangan / alasan refund terlebih dahulu.');
      return;
    }

    const origAmount = getOriginalAmount(refundTargetTrx);
    const validNominal = Math.max(0, Math.min(origAmount, Number(refundNominal) || 0));

    onRefundTransaction(refundTargetTrx.id, validNominal, cleanDesc);
    handleCloseRefundModal();
  };

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
      const matchRefundDesc = (trx.keteranganRefund || '').toLowerCase().includes(q);
      if (!matchName && !matchWa && !matchNopol && !matchAlamat && !matchId && !matchRefundDesc) return false;
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
      case 'Refund':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold text-purple-300 bg-purple-950/70 border border-purple-700/70">Refund</span>;
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
            placeholder="Cari nama penyewa, WhatsApp, nopol, alamat, atau keterangan refund..."
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
            <option value="Refund">Refund</option>
          </select>

          {/* Nopol Motor Filter */}
          <select
            value={filterNopol}
            onChange={e => setFilterNopol(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Motor ({fleet.length} Unit)</option>
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
                    <span>Penyewa &amp; Kontak</span>
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
                    <span>Mulai &amp; Durasi</span>
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
                  const isRefunded = trx.statusUnit === 'Refund' || trx.statusBayar === 'Refund' || Boolean(trx.nominalRefund && trx.nominalRefund > 0);
                  const origAmount = getOriginalAmount(trx);

                  return (
                    <tr 
                      key={trx.id}
                      className={`transition-colors ${
                        isRefunded ? 'bg-purple-950/10 hover:bg-purple-950/20' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* ID & Hari Sewa (Auto-Day) */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="font-mono text-cyan-400 font-semibold">{trx.id}</div>
                        <div className="text-[11px] font-medium text-amber-300/90 mt-0.5">
                          📅 {trx.hariSewa || 'Otomatis'}
                        </div>
                      </td>

                      {/* Penyewa & Kontak & Alamat + Keterangan Refund */}
                      <td className="py-3 px-3 align-top max-w-[250px]">
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

                        {/* Keterangan Refund Box */}
                        {isRefunded && trx.keteranganRefund && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-purple-950/60 border border-purple-700/60 text-[10px] text-purple-200 leading-snug">
                            <div className="font-bold text-purple-300 flex items-center gap-1">
                              <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                              <span>Ket. Refund:</span>
                            </div>
                            <div className="mt-0.5 break-words">{trx.keteranganRefund}</div>
                            {trx.waktuRefund && (
                              <div className="text-[9px] text-purple-400/80 font-mono mt-0.5">
                                {formatIndonesianDateTime(trx.waktuRefund)}
                              </div>
                            )}
                          </div>
                        )}
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
                          ) : trx.paketKhusus === 'Paket 12 Jam' ? (
                            <>
                              {trx.lamaSewaHari > 0 && (
                                <span className="text-[11px] text-cyan-400 font-medium">
                                  {trx.lamaSewaHari} Hari +
                                </span>
                              )}
                              <span className="text-[10px] bg-amber-950/70 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-semibold">
                                🌗 Paket 12 Jam{typeof trx.hargaPaket12Jam === 'number' && trx.hargaPaket12Jam > 0 ? ` (${formatRupiah(trx.hargaPaket12Jam)})` : ''}
                              </span>
                            </>
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
                        {trx.statusUnit === 'Refund' && (
                          <div className="text-[10px] text-purple-300 font-medium mt-0.5">
                            Dibatalkan / Refund
                          </div>
                        )}
                      </td>

                      {/* Total Pemasukan, Metode Pembayaran & Status Bayar */}
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        {isRefunded && origAmount !== trx.totalPemasukan && (
                          <div className="text-[10px] font-mono text-slate-500 line-through tabular-nums">
                            {formatRupiah(origAmount)}
                          </div>
                        )}
                        <div className={`font-bold font-mono tabular-nums ${
                          isRefunded ? 'text-purple-300' : 'text-white'
                        }`}>
                          {formatRupiah(trx.totalPemasukan)}
                        </div>
                        {isRefunded && typeof trx.nominalRefund === 'number' && (
                          <div className="text-[10px] font-mono text-rose-400 font-semibold tabular-nums mt-0.5">
                            Refund: -{formatRupiah(trx.nominalRefund)}
                          </div>
                        )}
                        <div className={`text-[10px] font-medium font-mono mt-0.5 ${
                          trx.statusBayar === 'Lunas'
                            ? 'text-emerald-400'
                            : trx.statusBayar === 'Refund'
                            ? 'text-purple-300 font-bold'
                            : 'text-amber-400'
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

                      {/* Aksi Cepat: Check In, Check Out, WhatsApp, Refund */}
                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* If booking, show Check-In button */}
                          {trx.statusUnit === 'Booking' && (
                            <button
                              onClick={() => onCheckInRow(trx.id)}
                              title="📲 Check-In Unit Sekarang (Mulai Sewa)"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded transition-colors cursor-pointer"
                            >
                              Check-In
                            </button>
                          )}

                          {/* If disewa or overdue, show Check-Out button */}
                          {(trx.statusUnit === 'Disewa' || trx.statusUnit === 'Overdue') && (
                            <button
                              onClick={() => onCheckOutRow(trx.id)}
                              title="🏁 Check-Out Unit (Selesai)"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors cursor-pointer"
                            >
                              Check-Out
                            </button>
                          )}

                          {/* WhatsApp Invoice generator */}
                          <button
                            onClick={() => onOpenWhatsApp(trx)}
                            title="Kirim Nota / Chat WhatsApp ke Penyewa"
                            className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-900/60 rounded border border-emerald-800/40 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          {/* Refund Transaction with Description (Replaces Delete) */}
                          <button
                            onClick={() => handleOpenRefundModal(trx)}
                            title={
                              isRefunded
                                ? 'Lihat / Ubah Keterangan Refund Transaksi'
                                : 'Proses Refund & Beri Keterangan Alasan Refund'
                            }
                            className={`px-2 py-1 text-[11px] font-semibold rounded border flex items-center gap-1 transition-colors cursor-pointer ${
                              isRefunded
                                ? 'text-purple-200 bg-purple-950/70 hover:bg-purple-900/80 border-purple-700/70'
                                : 'text-amber-300 bg-slate-950 hover:bg-purple-950/60 hover:text-purple-200 border-slate-700 hover:border-purple-700/70'
                            }`}
                          >
                            <RotateCcw className="w-3 h-3 shrink-0" />
                            <span>{isRefunded ? 'Edit Refund' : 'Refund'}</span>
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

      {/* Refund Transaction Modal with Description */}
      {refundTargetTrx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          onClick={handleCloseRefundModal}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Refund Transaksi &amp; Keterangan
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ID <span className="font-mono text-cyan-400 font-semibold">{refundTargetTrx.id}</span> · Unit otomatis dikembalikan ke status Tersedia
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseRefundModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefund} className="p-5 space-y-4 text-xs">
              {/* Transaction Info Summary */}
              {(() => {
                const origAmount = getOriginalAmount(refundTargetTrx);
                const bike = bikeMap.get(refundTargetTrx.nopolMotor);
                const remainingNet = Math.max(0, origAmount - (Number(refundNominal) || 0));

                return (
                  <>
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Penyewa:</span>
                        <span className="font-bold text-white">{refundTargetTrx.namaPenyewa} (+{refundTargetTrx.whatsapp})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Unit Armada:</span>
                        <span className="font-semibold text-cyan-300">
                          {bike ? `${bike.namaUnit} (${bike.nopol})` : refundTargetTrx.nopolMotor}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Pemasukan Awal:</span>
                        <span className="font-mono font-bold text-white">{formatRupiah(origAmount)}</span>
                      </div>
                    </div>

                    {/* Jenis Refund Toggle */}
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-200">
                        Pilih Jenis Pengembalian Dana (Refund)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRefundType('full');
                            setRefundNominal(origAmount);
                          }}
                          className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            refundType === 'full'
                              ? 'bg-purple-600/25 border-purple-500 text-purple-200 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Refund Penuh (100%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRefundType('partial');
                            if (refundNominal === origAmount) {
                              setRefundNominal(Math.round(origAmount / 2));
                            }
                          }}
                          className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            refundType === 'partial'
                              ? 'bg-purple-600/25 border-purple-500 text-purple-200 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Refund Sebagian / Custom</span>
                        </button>
                      </div>
                    </div>

                    {/* Nominal Refund Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-200">
                          Nominal Uang Dikembalikan (Rp)
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRefundType('full');
                              setRefundNominal(origAmount);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 cursor-pointer"
                          >
                            100%
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRefundType('partial');
                              setRefundNominal(Math.round(origAmount * 0.5));
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 cursor-pointer"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRefundType('partial');
                              setRefundNominal(0);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
                          >
                            Rp 0 (Batal Belum Bayar)
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={origAmount}
                        step={1000}
                        value={refundNominal}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(origAmount, Number(e.target.value) || 0));
                          setRefundNominal(val);
                          setRefundType(val >= origAmount ? 'full' : 'partial');
                        }}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white outline-none"
                      />
                      <div className="flex items-center justify-between px-1 text-[11px]">
                        <span className="text-rose-400 font-mono">
                          Dana Refund: -{formatRupiah(refundNominal)}
                        </span>
                        <span className="text-emerald-400 font-mono font-semibold">
                          Sisa Pemasukan Bersih: {formatRupiah(remainingNet)}
                        </span>
                      </div>
                    </div>

                    {/* Keterangan / Alasan Refund (Wajib) */}
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-200">
                        Keterangan / Alasan Refund <span className="text-rose-400">*</span>
                      </label>
                      {/* Preset Reason Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {REFUND_REASON_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setRefundDescription(preset);
                              setRefundError('');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                              refundDescription === preset
                                ? 'bg-purple-950 border-purple-500 text-purple-200 font-semibold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        value={refundDescription}
                        onChange={(e) => {
                          setRefundDescription(e.target.value);
                          if (refundError) setRefundError('');
                        }}
                        placeholder="Tuliskan keterangan lengkap alasan refund (misal: Batal sewa karena jadwal kuliah berubah, dikembalikan via Transfer BRI)..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none"
                      />
                      {refundError && (
                        <div className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{refundError}</span>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleCloseRefundModal}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Simpan Refund &amp; Keterangan</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
