import React, { useState } from 'react';
import { MotorMaster, TransaksiSewa, BikeStatus } from '../types/rental';
import {
  formatIndonesianDateTime,
  formatRupiah,
  checkIsOverdue,
  getCustomerWhatsAppChatUrl,
} from '../utils/formatters';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  KeyRound,
  Wrench,
  Phone,
  QrCode,
  Plus,
  Edit3,
  Trash2,
  Settings,
  LayoutList,
  LayoutGrid,
  Search,
  X,
} from 'lucide-react';

interface FleetGridProps {
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  onCheckIn: (nopol: string) => void;
  onCheckOut: (nopol: string) => void;
  onNewRentalForBike: (nopol: string) => void;
  onOpenWhatsApp: (trx: TransaksiSewa) => void;
  onNewExpenseForBike: (nopol: string) => void;
  heroBannerImg: string;
  onOpenQRCode?: () => void;
  onOpenAddBike?: () => void;
  onOpenEditBike?: (bike: MotorMaster) => void;
  onDeleteBike?: (nopol: string) => void;
  onOpenManageFleet?: () => void;
}

export const FleetGrid: React.FC<FleetGridProps> = ({
  fleet,
  transactions,
  onCheckIn,
  onCheckOut,
  onNewRentalForBike,
  onOpenWhatsApp,
  onNewExpenseForBike,
  heroBannerImg,
  onOpenQRCode,
  onOpenAddBike,
  onOpenEditBike,
  onDeleteBike,
  onOpenManageFleet,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [quickQuery, setQuickQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'compact' | 'cards'>(() => {
    const saved = localStorage.getItem('airent_fleet_view_mode_v1');
    if (saved === 'cards' || saved === 'compact') return saved;
    return 'compact';
  });

  const handleSetViewMode = (mode: 'compact' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('airent_fleet_view_mode_v1', mode);
    } catch {
      // ignore storage errors
    }
  };

  // Map active transaction per bike
  const activeTrxMap = new Map<string, TransaksiSewa>();
  transactions.forEach((t) => {
    if (
      t.statusUnit === 'Disewa' ||
      t.statusUnit === 'Booking' ||
      t.statusUnit === 'Overdue'
    ) {
      activeTrxMap.set(t.nopolMotor, t);
    }
  });

  const counts = {
    total: fleet.length,
    tersedia: fleet.filter((b) => b.status === 'Tersedia').length,
    disewa: fleet.filter((b) => b.status === 'Disewa').length,
    booking: fleet.filter((b) => b.status === 'Booking').length,
    overdue: fleet.filter((b) => b.status === 'Overdue').length,
  };

  const filteredFleet = fleet.filter((b) => {
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    if (!matchesStatus) return false;
    if (!quickQuery.trim()) return true;
    const q = quickQuery.toLowerCase();
    const activeTrx = activeTrxMap.get(b.nopol);
    return (
      b.nopol.toLowerCase().includes(q) ||
      b.namaUnit.toLowerCase().includes(q) ||
      b.tipeMotor.toLowerCase().includes(q) ||
      (activeTrx && activeTrx.namaPenyewa.toLowerCase().includes(q))
    );
  });

  const getStatusTextStyle = (status: BikeStatus, isLate: boolean) => {
    if (isLate || status === 'Overdue') {
      return 'text-rose-400 font-bold';
    }
    switch (status) {
      case 'Tersedia':
        return 'text-emerald-400 font-semibold';
      case 'Disewa':
        return 'text-cyan-400 font-semibold';
      case 'Booking':
        return 'text-amber-400 font-semibold';
      case 'Perawatan':
        return 'text-slate-400 font-medium';
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Operational Summary Strip (Default in Compact Mode, Full Hero in Cards Mode) */}
      {viewMode === 'cards' ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="relative h-48 sm:h-56 w-full overflow-hidden">
            <img
              src={heroBannerImg}
              alt="Armada Rental Motor Malang 13 Unit"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center brightness-60 filter"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-4 sm:right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs text-cyan-400 font-semibold mb-1">
                  Sistem Operasional Ai Rent
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Status {fleet.length} Armada Motor
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Pantau ketersediaan armada, batas waktu pengembalian, dan eksekusi cepat Check-In &amp; Check-Out.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-center">
                <div className="px-2">
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    {counts.total}
                  </div>
                </div>
                <div className="px-2 border-l border-slate-800">
                  <div className="text-xs text-emerald-400">Tersedia</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    {counts.tersedia}
                  </div>
                </div>
                <div className="px-2 border-l border-slate-800">
                  <div className="text-xs text-cyan-400">Disewa</div>
                  <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                    {counts.disewa}
                  </div>
                </div>
                <div className="px-2 border-l border-slate-800">
                  <div className="text-xs text-rose-400">Overdue</div>
                  <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                    {counts.overdue}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Title & Inclusions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-start gap-2 sm:gap-4">
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Status {fleet.length} Unit Armada</span>
                <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                  · Helm SNI &amp; Bensin Sesuai Ambil
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {onOpenQRCode && (
                <button
                  onClick={onOpenQRCode}
                  className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-cyan-300 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  title="Tampilkan QR Code untuk dipindai penyewa lewat handphone"
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>QR Mandiri</span>
                </button>
              )}
              <a
                href={getCustomerWhatsAppChatUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>WA CS</span>
              </a>
            </div>
          </div>

          {/* Right: Interactive 5-Metric Strip */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 text-center">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-slate-800' : 'hover:bg-slate-900'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-slate-400">Total</div>
              <div className="text-sm sm:text-base font-bold font-mono text-white tabular-nums">
                {counts.total}
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('Tersedia')}
              className={`px-2 py-1 rounded-lg border-l border-slate-800/80 transition-colors cursor-pointer ${
                filterStatus === 'Tersedia' ? 'bg-emerald-950/60' : 'hover:bg-slate-900'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-emerald-400">Ready</div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 tabular-nums">
                {counts.tersedia}
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('Disewa')}
              className={`px-2 py-1 rounded-lg border-l border-slate-800/80 transition-colors cursor-pointer ${
                filterStatus === 'Disewa' ? 'bg-cyan-950/60' : 'hover:bg-slate-900'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-cyan-400">Disewa</div>
              <div className="text-sm sm:text-base font-bold font-mono text-cyan-400 tabular-nums">
                {counts.disewa}
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('Booking')}
              className={`px-2 py-1 rounded-lg border-l border-slate-800/80 transition-colors cursor-pointer ${
                filterStatus === 'Booking' ? 'bg-amber-950/60' : 'hover:bg-slate-900'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-amber-400">Booking</div>
              <div className="text-sm sm:text-base font-bold font-mono text-amber-400 tabular-nums">
                {counts.booking}
              </div>
            </button>
            <button
              onClick={() => setFilterStatus('Overdue')}
              className={`px-2 py-1 rounded-lg border-l border-slate-800/80 transition-colors cursor-pointer ${
                filterStatus === 'Overdue' ? 'bg-rose-950/60' : 'hover:bg-slate-900'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-rose-400">Telat</div>
              <div className="text-sm sm:text-base font-bold font-mono text-rose-400 tabular-nums">
                {counts.overdue}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs, Search Input & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Scrollable Single-Line Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            onClick={() => setFilterStatus('Tersedia')}
            className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterStatus === 'Tersedia'
                ? 'bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tersedia ({counts.tersedia})
          </button>
          <button
            onClick={() => setFilterStatus('Disewa')}
            className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterStatus === 'Disewa'
                ? 'bg-cyan-950 text-cyan-400 font-semibold border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Disewa ({counts.disewa})
          </button>
          <button
            onClick={() => setFilterStatus('Booking')}
            className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterStatus === 'Booking'
                ? 'bg-amber-950 text-amber-400 font-semibold border border-amber-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Booking ({counts.booking})
          </button>
          <button
            onClick={() => setFilterStatus('Overdue')}
            className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterStatus === 'Overdue'
                ? 'bg-rose-950 text-rose-400 font-semibold border border-rose-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
        </div>

        {/* Right Controls: Quick Filter Input, View Toggle & Add Unit */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
          <div className="relative flex-1 sm:flex-initial sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Filter nopol / unit..."
              className="w-full min-h-[36px] pl-8 pr-7 py-1 text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-white placeholder-slate-500 outline-none transition-colors"
            />
            {quickQuery && (
              <button
                onClick={() => setQuickQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher: Tabel Padat vs Kartu */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
            <button
              onClick={() => handleSetViewMode('compact')}
              title="Tampilan Tabel Padat (Semua 13 unit terlihat sekaligus)"
              className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'compact'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Tabel Padat</span>
            </button>
            <button
              onClick={() => handleSetViewMode('cards')}
              title="Tampilan Kartu Detail"
              className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>

          {onOpenManageFleet && (
            <button
              onClick={onOpenManageFleet}
              className="min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Kelola Daftar Master Armada"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Kelola</span>
            </button>
          )}

          {onOpenAddBike && (
            <button
              onClick={onOpenAddBike}
              className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              title="Tambah Unit Motor Armada Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty Search / Filter State */}
      {filteredFleet.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="text-sm font-semibold text-white">
            Tidak ada unit motor yang sesuai dengan filter
          </div>
          <p className="text-xs text-slate-400">
            Coba tampilkan semua status atau hapus kata kunci pencarian.
          </p>
          <button
            onClick={() => {
              setFilterStatus('all');
              setQuickQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
          >
            Tampilkan Semua ({counts.total} Unit)
          </button>
        </div>
      ) : viewMode === 'compact' ? (
        /* =====================================================================
           MODE 1: COMPACT HIGH-DENSITY VIEW (ALL 13 UNITS VISIBLE AT ONCE)
           ===================================================================== */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Desktop High-Density Operational Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Pelat Nomor</th>
                  <th className="py-2.5 px-3">Unit Armada &amp; Spek</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Penyewa Aktif</th>
                  <th className="py-2.5 px-3">Jadwal Kembali</th>
                  <th className="py-2.5 px-3 text-right">Tarif / Status</th>
                  <th className="py-2.5 pl-3 pr-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredFleet.map((bike, idx) => {
                  const activeTrx = activeTrxMap.get(bike.nopol);
                  const overdueInfo = activeTrx
                    ? checkIsOverdue(activeTrx)
                    : { isOverdue: false, hoursLate: 0 };
                  const isLate = bike.status === 'Overdue' || overdueInfo.isOverdue;

                  return (
                    <tr
                      key={bike.nopol}
                      className={`transition-colors ${
                        isLate
                          ? 'bg-rose-950/25 hover:bg-rose-950/40'
                          : bike.status === 'Disewa'
                          ? 'bg-slate-900/90 hover:bg-slate-800/60'
                          : bike.status === 'Booking'
                          ? 'bg-amber-950/10 hover:bg-amber-950/20'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Row Number */}
                      <td className="py-2 pl-4 pr-2 text-center font-mono text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>

                      {/* Plate Number */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 bg-slate-950 border border-slate-700 rounded font-mono font-bold text-white tracking-wider tabular-nums">
                          {bike.nopol}
                        </span>
                      </td>

                      {/* Unit Name & Specs */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{bike.namaUnit}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300">{bike.tipeMotor}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 font-mono tabular-nums">
                            {bike.tahun || 2023}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={getStatusTextStyle(bike.status, isLate)}>
                          {isLate ? `Overdue (+${overdueInfo.hoursLate || 4}j)` : bike.status}
                        </span>
                      </td>

                      {/* Active Renter */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {activeTrx ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white truncate max-w-[150px]">
                              {activeTrx.namaPenyewa}
                            </span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400 text-[11px]">
                              {activeTrx.kategoriPelanggan}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Siap disewakan</span>
                        )}
                      </td>

                      {/* Return Schedule */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono tabular-nums">
                        {activeTrx ? (
                          <span className={isLate ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                            {formatIndonesianDateTime(activeTrx.estWaktuKembali)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Rate & Payment Status */}
                      <td className="py-2 px-3 whitespace-nowrap text-right font-mono tabular-nums">
                        {activeTrx ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-200">
                              {formatRupiah(activeTrx.hargaPerHari)}/hr
                            </span>
                            <span className="text-slate-500">·</span>
                            <span className="text-cyan-400 font-semibold">
                              {activeTrx.statusBayar}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-2 pl-3 pr-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {bike.status === 'Tersedia' ? (
                            <button
                              onClick={() => onNewRentalForBike(bike.nopol)}
                              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Sewa</span>
                            </button>
                          ) : bike.status === 'Booking' ? (
                            <button
                              onClick={() => onCheckIn(bike.nopol)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Check-In</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onCheckOut(bike.nopol)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Check-Out</span>
                            </button>
                          )}

                          {activeTrx && (
                            <button
                              onClick={() => onOpenWhatsApp(activeTrx)}
                              title="Kirim Nota / Chat WhatsApp"
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onNewExpenseForBike(bike.nopol)}
                            title="Catat Servis / Pengeluaran"
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          {onOpenEditBike && (
                            <button
                              onClick={() => onOpenEditBike(bike)}
                              title={`Edit Armada ${bike.namaUnit}`}
                              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteBike && (
                            <button
                              onClick={() => onDeleteBike(bike.nopol)}
                              title={`Hapus Armada ${bike.namaUnit}`}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile One-Handed Ergonomic Compact List (Thumb-Zone Friendly) */}
          <div className="md:hidden divide-y divide-slate-800/80">
            {filteredFleet.map((bike) => {
              const activeTrx = activeTrxMap.get(bike.nopol);
              const overdueInfo = activeTrx
                ? checkIsOverdue(activeTrx)
                : { isOverdue: false, hoursLate: 0 };
              const isLate = bike.status === 'Overdue' || overdueInfo.isOverdue;

              return (
                <div
                  key={bike.nopol}
                  className={`p-3 flex items-center justify-between gap-2.5 transition-colors ${
                    isLate ? 'bg-rose-950/25' : ''
                  }`}
                >
                  {/* Left: Plate, Unit Name, Status & Renter Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-[11px] font-mono font-bold text-white tracking-wider tabular-nums shrink-0">
                        {bike.nopol}
                      </span>
                      <span className="font-bold text-sm text-white truncate">
                        {bike.namaUnit}
                      </span>
                      <span className="text-[11px] text-slate-400">· {bike.tipeMotor}</span>
                    </div>

                    <div className="text-xs flex items-center gap-1.5 flex-wrap">
                      <span className={getStatusTextStyle(bike.status, isLate)}>
                        {isLate ? `Telat ±${overdueInfo.hoursLate || 4}j` : bike.status}
                      </span>
                      {activeTrx ? (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-200 font-medium truncate max-w-[110px]">
                            {activeTrx.namaPenyewa}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                            {formatIndonesianDateTime(activeTrx.estWaktuKembali)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400">Siap disewakan</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right (Thumb Zone): Primary Action + Quick Icons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeTrx && (
                      <button
                        onClick={() => onOpenWhatsApp(activeTrx)}
                        title="Chat WhatsApp Penyewa"
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-emerald-400 bg-slate-950 hover:bg-emerald-950/60 border border-slate-700 rounded-xl transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onNewExpenseForBike(bike.nopol)}
                      title="Catat Servis / Biaya"
                      className="min-h-[40px] min-w-[38px] flex items-center justify-center text-slate-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>

                    {bike.status === 'Tersedia' ? (
                      <button
                        onClick={() => onNewRentalForBike(bike.nopol)}
                        className="min-h-[40px] px-3 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] rounded-xl transition-all flex items-center gap-1 whitespace-nowrap shadow-sm"
                      >
                        <KeyRound className="w-3.5 h-3.5 shrink-0" />
                        <span>Sewa</span>
                      </button>
                    ) : bike.status === 'Booking' ? (
                      <button
                        onClick={() => onCheckIn(bike.nopol)}
                        className="min-h-[40px] px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-[0.98] rounded-xl transition-all flex items-center gap-1 whitespace-nowrap shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Check-In</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onCheckOut(bike.nopol)}
                        className="min-h-[40px] px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl transition-all flex items-center gap-1 whitespace-nowrap shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Selesai</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* =====================================================================
           MODE 2: DETAILED CARD GRID VIEW
           ===================================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFleet.map((bike) => {
            const activeTrx = activeTrxMap.get(bike.nopol);
            const overdueInfo = activeTrx
              ? checkIsOverdue(activeTrx)
              : { isOverdue: false, hoursLate: 0 };
            const isLate = bike.status === 'Overdue' || overdueInfo.isOverdue;

            return (
              <div
                key={bike.nopol}
                className={`rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isLate
                    ? 'border-rose-700/80 bg-rose-950/20 shadow-lg shadow-rose-950/30'
                    : bike.status === 'Disewa'
                    ? 'border-cyan-800/60 bg-slate-900/90'
                    : bike.status === 'Booking'
                    ? 'border-amber-800/60 bg-slate-900/90'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* Header: Unit Name & Indonesian Plate Number */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white tracking-wide">
                          {bike.namaUnit}
                        </h3>
                        <span className="text-xs text-slate-400">· {bike.tipeMotor}</span>
                      </div>
                      <div className="inline-block mt-1 px-2.5 py-0.5 bg-black border border-slate-700 rounded text-xs font-mono font-bold tracking-widest text-white shadow-inner tabular-nums">
                        {bike.nopol}
                      </div>
                    </div>

                    <span className={`text-xs ${getStatusTextStyle(bike.status, isLate)}`}>
                      {bike.status}
                    </span>
                  </div>

                  {/* Bike Specs info */}
                  <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                    <span>Thn {bike.tahun || 2023}</span>
                    <span>·</span>
                    <span>{bike.warna || 'Standar'}</span>
                    {bike.kilometer && (
                      <>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          {bike.kilometer.toLocaleString('id-ID')} km
                        </span>
                      </>
                    )}
                  </div>

                  {/* Active Rental Details */}
                  {activeTrx ? (
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-medium text-white truncate max-w-[140px]">
                          {activeTrx.namaPenyewa}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {activeTrx.kategoriPelanggan}
                        </span>
                      </div>

                      <div className="text-slate-400 flex items-center justify-between">
                        <span>Kembali:</span>
                        <span
                          className={`font-mono tabular-nums ${
                            isLate ? 'text-rose-400 font-semibold' : 'text-slate-200'
                          }`}
                        >
                          {formatIndonesianDateTime(activeTrx.estWaktuKembali)}
                        </span>
                      </div>

                      {isLate && (
                        <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px] bg-rose-950/60 p-1.5 rounded border border-rose-800/50">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Telat ±{overdueInfo.hoursLate || 4} Jam! Hubungi penyewa.</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Tarif: {formatRupiah(activeTrx.hargaPerHari)}/hr</span>
                        <span className="text-cyan-400 font-medium font-mono">
                          {activeTrx.statusBayar}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-950/40 border border-dashed border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2 py-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Unit siap disewakan kapan saja</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons Footer */}
                <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-2">
                  {bike.status === 'Tersedia' ? (
                    <button
                      onClick={() => onNewRentalForBike(bike.nopol)}
                      className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Sewa Unit Ini</span>
                    </button>
                  ) : bike.status === 'Booking' ? (
                    <button
                      onClick={() => onCheckIn(bike.nopol)}
                      className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Check-In Sekarang</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onCheckOut(bike.nopol)}
                      className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Check-Out (Selesai)</span>
                    </button>
                  )}

                  {activeTrx && (
                    <button
                      onClick={() => onOpenWhatsApp(activeTrx)}
                      title="Kirim Nota / Chat WhatsApp"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-emerald-800/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onNewExpenseForBike(bike.nopol)}
                    title="Catat Servis / Pengeluaran"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                  </button>

                  {onOpenEditBike && (
                    <button
                      onClick={() => onOpenEditBike(bike)}
                      title={`Edit Armada ${bike.namaUnit} (${bike.nopol})`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 border border-cyan-800/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {onDeleteBike && (
                    <button
                      onClick={() => onDeleteBike(bike.nopol)}
                      title={`Hapus Armada ${bike.namaUnit} (${bike.nopol})`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-rose-800/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
