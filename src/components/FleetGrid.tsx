import React, { useState } from 'react';
import { MotorMaster, TransaksiSewa, BikeStatus } from '../types/rental';
import { formatIndonesianDateTime, formatRupiah, checkIsOverdue, getCustomerWhatsAppChatUrl } from '../utils/formatters';
import { CheckCircle2, Clock, AlertTriangle, KeyRound, Wrench, Calendar, Phone, ArrowUpRight, ShieldCheck, QrCode, Plus, Edit3, Trash2, Settings } from 'lucide-react';

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
  onOpenManageFleet
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Map active transaction per bike
  const activeTrxMap = new Map<string, TransaksiSewa>();
  transactions.forEach(t => {
    if (t.statusUnit === 'Disewa' || t.statusUnit === 'Booking' || t.statusUnit === 'Overdue') {
      activeTrxMap.set(t.nopolMotor, t);
    }
  });

  const counts = {
    total: fleet.length,
    tersedia: fleet.filter(b => b.status === 'Tersedia').length,
    disewa: fleet.filter(b => b.status === 'Disewa').length,
    booking: fleet.filter(b => b.status === 'Booking').length,
    overdue: fleet.filter(b => b.status === 'Overdue').length,
  };

  const filteredFleet = fleet.filter(b => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const getStatusColor = (status: BikeStatus) => {
    switch (status) {
      case 'Tersedia':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'Disewa':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
      case 'Booking':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'Overdue':
        return 'text-rose-400 bg-rose-950/50 border-rose-800/80 animate-pulse';
      case 'Perawatan':
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Visual & Fleet Stats Strip */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
          <img
            src={heroBannerImg}
            alt="Armada Rental Motor Malang 13 Unit"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center brightness-60 filter"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-4 sm:right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-1">
                Sistem Operasional Ai Rent
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Status {fleet.length} Armada Motor
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                Pantau ketersediaan armada, tambah/edit/hapus unit motor, batas waktu pengembalian, dan eksekusi cepat Check-In &amp; Check-Out.
              </p>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-center">
              <div className="px-2">
                <div className="text-xs text-slate-400">Total</div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">{counts.total}</div>
              </div>
              <div className="px-2 border-l border-slate-800">
                <div className="text-xs text-emerald-400">Tersedia</div>
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">{counts.tersedia}</div>
              </div>
              <div className="px-2 border-l border-slate-800">
                <div className="text-xs text-cyan-400">Disewa</div>
                <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">{counts.disewa}</div>
              </div>
              <div className="px-2 border-l border-slate-800">
                <div className="text-xs text-rose-400">Overdue</div>
                <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">{counts.overdue}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer WhatsApp Chat & Rental Inclusions Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              Fasilitas &amp; Inklusi Resmi Rental
            </span>
            <span className="text-[11px] text-slate-400 font-medium">· Sudah termasuk di setiap sewa:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-200">
              <span className="text-sm">🪖</span>
              <span><strong>0 / 1 / 2 Helm SNI</strong> (Bersih &amp; Wangi / Bawa Sendiri)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-200">
              <span className="text-sm">⛽</span>
              <span><strong>Bensin: 1/2/3/4/5/Full Kotak</strong> (Sesuai Posisi Ambil)</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2">
          {onOpenQRCode && (
            <button
              onClick={onOpenQRCode}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-slate-950 hover:bg-slate-800 border border-cyan-700/60 rounded-xl transition-all shadow-md"
              title="Tampilkan QR Code untuk dipindai penyewa lewat handphone"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>QR Pesanan Mandiri</span>
            </button>
          )}

          <a
            href={getCustomerWhatsAppChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-950/40"
          >
            <Phone className="w-4 h-4" />
            <span>Chat WhatsApp Pelanggan</span>
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            onClick={() => setFilterStatus('Tersedia')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'Tersedia'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tersedia ({counts.tersedia})
          </button>
          <button
            onClick={() => setFilterStatus('Disewa')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'Disewa'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Disewa ({counts.disewa})
          </button>
          <button
            onClick={() => setFilterStatus('Booking')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'Booking'
                ? 'bg-amber-950 text-amber-400 border border-amber-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Booking ({counts.booking})
          </button>
          <button
            onClick={() => setFilterStatus('Overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'Overdue'
                ? 'bg-rose-950 text-rose-400 border border-rose-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">
            Menampilkan <span className="text-white font-mono">{filteredFleet.length}</span> dari {fleet.length} unit
          </span>

          {onOpenManageFleet && (
            <button
              onClick={onOpenManageFleet}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors shadow-sm"
              title="Kelola Daftar Master Armada (Edit / Hapus / Tambah)"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kelola Armada</span>
            </button>
          )}

          {onOpenAddBike && (
            <button
              onClick={onOpenAddBike}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
              title="Tambah Unit Motor Armada Baru"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Armada</span>
            </button>
          )}
        </div>
      </div>

      {/* 13 Units Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFleet.map(bike => {
          const activeTrx = activeTrxMap.get(bike.nopol);
          const overdueInfo = activeTrx ? checkIsOverdue(activeTrx) : { isOverdue: false, hoursLate: 0 };
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
                    {/* Indonesian Plate Tag */}
                    <div className="inline-block mt-1 px-2.5 py-0.5 bg-black border border-slate-700 rounded text-xs font-mono font-bold tracking-widest text-white shadow-inner">
                      {bike.nopol}
                    </div>
                  </div>

                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getStatusColor(bike.status)}`}>
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
                      <span className="font-mono tabular-nums">{bike.kilometer.toLocaleString('id-ID')} km</span>
                    </>
                  )}
                </div>

                {/* Active Rental Details (if currently Disewa / Booking / Overdue) */}
                {activeTrx ? (
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-medium text-white truncate max-w-[140px]">
                        👤 {activeTrx.namaPenyewa}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {activeTrx.kategoriPelanggan}
                      </span>
                    </div>

                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Kembali:</span>
                      <span className={`font-mono tabular-nums ${isLate ? 'text-rose-400 font-semibold' : 'text-slate-200'}`}>
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
                      <span className="text-cyan-400 font-medium font-mono">{activeTrx.statusBayar}</span>
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
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Sewa Unit Ini</span>
                  </button>
                ) : bike.status === 'Booking' ? (
                  <button
                    onClick={() => onCheckIn(bike.nopol)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>📲 Check-In Sekarang</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onCheckOut(bike.nopol)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>🏁 Check-Out (Selesai)</span>
                  </button>
                )}

                {activeTrx && (
                  <button
                    onClick={() => onOpenWhatsApp(activeTrx)}
                    title="Kirim Nota / Chat WhatsApp"
                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-emerald-800/40 rounded-lg transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onNewExpenseForBike(bike.nopol)}
                  title="Catat Servis / Pengeluaran"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                </button>

                {onOpenEditBike && (
                  <button
                    onClick={() => onOpenEditBike(bike)}
                    title={`Edit Armada ${bike.namaUnit} (${bike.nopol})`}
                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 border border-cyan-800/50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {onDeleteBike && (
                  <button
                    onClick={() => onDeleteBike(bike.nopol)}
                    title={`Hapus Armada ${bike.namaUnit} (${bike.nopol})`}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-rose-800/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
