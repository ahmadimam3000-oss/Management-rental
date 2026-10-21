import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Phone, 
  User, 
  Calendar, 
  Bike, 
  ShieldCheck, 
  PlusCircle, 
  MessageSquare, 
  UserPlus, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { FrequentRenter, TransaksiSewa, MotorMaster } from '../types/rental';
import { formatRupiah, formatIndonesianDateTime } from '../utils/formatters';

interface TenantSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  renters: FrequentRenter[];
  transactions: TransaksiSewa[];
  fleet: MotorMaster[];
  onSelectCustomerForRental: (customer: FrequentRenter) => void;
  onOpenWhatsApp: (trx: TransaksiSewa) => void;
  onSaveCustomerToDatabase?: (trx: TransaksiSewa) => void;
  onOpenNewRentalWithInfo?: (nama: string, wa: string) => void;
}

export const TenantSearchModal: React.FC<TenantSearchModalProps> = ({
  isOpen,
  onClose,
  renters,
  transactions,
  fleet,
  onSelectCustomerForRental,
  onOpenWhatsApp,
  onSaveCustomerToDatabase,
  onOpenNewRentalWithInfo
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'renters' | 'transactions'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveFilter('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bike lookup map
  const bikeMap = useMemo(() => {
    const map = new Map<string, MotorMaster>();
    fleet.forEach(b => map.set(b.nopol, b));
    return map;
  }, [fleet]);

  // Normalize phone for flexible search
  const cleanPhone = (val: string) => val.replace(/\D/g, '');

  // Filter matching renters
  const matchedRenters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If empty query, show top 4 frequent renters as suggestions
      return [...renters].sort((a, b) => b.totalRentals - a.totalRentals).slice(0, 4);
    }
    const qClean = cleanPhone(q);
    return renters.filter(r => {
      const matchName = r.nama.toLowerCase().includes(q);
      const matchAlamat = r.alamat.toLowerCase().includes(q);
      const rClean = cleanPhone(r.whatsapp);
      const matchWa = rClean.includes(qClean || q);
      return matchName || matchWa || matchAlamat;
    });
  }, [renters, query]);

  // Filter matching transactions
  const matchedTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If empty query, show latest 4 transactions
      return [...transactions]
        .sort((a, b) => new Date(b.waktuStartSewa).getTime() - new Date(a.waktuStartSewa).getTime())
        .slice(0, 4);
    }
    const qClean = cleanPhone(q);
    return transactions.filter(t => {
      const matchName = t.namaPenyewa.toLowerCase().includes(q);
      const matchAlamat = t.alamatAsalKos.toLowerCase().includes(q);
      const matchNopol = t.nopolMotor.toLowerCase().includes(q);
      const tClean = cleanPhone(t.whatsapp);
      const matchWa = tClean.includes(qClean || q);
      const matchId = t.id.toLowerCase().includes(q);
      return matchName || matchWa || matchAlamat || matchNopol || matchId;
    });
  }, [transactions, query]);

  if (!isOpen) return null;

  const isQuerying = query.trim().length > 0;
  const totalFound = matchedRenters.length + matchedTransactions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden mt-6 sm:mt-12 mb-12 flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header with Search Input Tool */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Alat Pencarian Penyewa</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    Tenant Search Tool
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cari cepat berdasarkan <strong>Nama Penyewa</strong> atau <strong>Nomor WhatsApp</strong>
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ketik nama penyewa (e.g. Dimas, Arya) atau nomor WhatsApp (e.g. 0812, 628...)"
              className="w-full bg-slate-900 border border-cyan-500/50 focus:border-cyan-400 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-500 outline-none shadow-inner focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Semua Hasil ({totalFound})
              </button>
              <button
                onClick={() => setActiveFilter('renters')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'renters'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Database Penyewa ({matchedRenters.length})
              </button>
              <button
                onClick={() => setActiveFilter('transactions')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'transactions'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Riwayat Transaksi ({matchedTransactions.length})
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              ESC untuk menutup
            </span>
          </div>
        </div>

        {/* Results Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {!isQuerying && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Menampilkan data teratas. Mulai ketik nama atau nomor telepon untuk menyaring secara spesifik.
              </span>
            </div>
          )}

          {isQuerying && totalFound === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-white font-medium text-sm">
                Tidak ada data penyewa atau transaksi dengan kata kunci &quot;{query}&quot;
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Pastikan nama penyewa atau format nomor WhatsApp sudah benar, atau langsung buat transaksi baru dengan data ini.
              </p>
              {onOpenNewRentalWithInfo && (
                <button
                  onClick={() => {
                    onOpenNewRentalWithInfo(
                      isNaN(Number(query.replace(/\D/g, ''))) || query.length < 8 ? query : '',
                      query.replace(/\D/g, '').length >= 8 ? query : ''
                    );
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-semibold rounded-lg text-xs transition-colors shadow-sm mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Transaksi Baru Menggunakan Kata Kunci Ini</span>
                </button>
              )}
            </div>
          )}

          {/* Section 1: Matched Frequent Renters (CRM) */}
          {(activeFilter === 'all' || activeFilter === 'renters') && matchedRenters.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Database Pelanggan Tetap / CRM ({matchedRenters.length})</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Data pelanggan terverifikasi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedRenters.map(renter => {
                  const cleanWa = renter.whatsapp.replace(/\D/g, '').replace(/^0/, '62');
                  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
                    `Halo Kak ${renter.nama}, kami dari Rental Motor Malang. Ada kebutuhan sewa motor lagi untuk hari ini? Unit siap kami siapkan (Helm 0/1/2, Bensin 1-5/Full Kotak). 🙏`
                  )}`;

                  return (
                    <div 
                      key={renter.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3.5 space-y-3 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{renter.nama}</span>
                              <span className="text-[10px] text-amber-400 font-normal">
                                {'⭐'.repeat(renter.ratingTrust || 5)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                {renter.whatsapp}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                {renter.kategoriDefault}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                              {renter.totalRentals}x Sewa
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-900 pt-2">
                          <div className="truncate">
                            <span className="text-slate-500">Alamat:</span> {renter.alamat}
                          </div>
                          <div>
                            <span className="text-slate-500">Jaminan:</span>{' '}
                            <span className="text-slate-200 font-medium">{renter.identitasDefault}</span>
                          </div>
                          {renter.totalSpent > 0 && (
                            <div>
                              <span className="text-slate-500">Total Belanja:</span>{' '}
                              <span className="text-cyan-300 font-mono font-medium">{formatRupiah(renter.totalSpent)}</span>
                            </div>
                          )}
                          {renter.catatanKhusus && (
                            <div className="text-slate-400 italic text-[10px] bg-slate-900/80 p-1.5 rounded mt-1 border border-slate-800">
                              💬 &quot;{renter.catatanKhusus}&quot;
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>Chat WhatsApp</span>
                        </a>

                        <button
                          onClick={() => {
                            onSelectCustomerForRental(renter);
                            onClose();
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
                        >
                          <Bike className="w-3 h-3" />
                          <span>Sewa Baru</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Matched Transactions (All Rentals History) */}
          {(activeFilter === 'all' || activeFilter === 'transactions') && matchedTransactions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Riwayat Transaksi Sewa ({matchedTransactions.length})</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Semua transaksi aktif &amp; riwayat sewa
                </span>
              </div>

              <div className="space-y-2">
                {matchedTransactions.map(trx => {
                  const bike = bikeMap.get(trx.nopolMotor);
                  const isInFrequentRenters = renters.some(
                    r => r.whatsapp.replace(/\D/g, '') === trx.whatsapp.replace(/\D/g, '') ||
                         r.nama.toLowerCase() === trx.namaPenyewa.toLowerCase()
                  );

                  return (
                    <div
                      key={trx.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {trx.namaPenyewa}
                          </span>
                          <span className="font-mono text-cyan-300 text-xs">
                            {trx.whatsapp}
                          </span>
                          
                          {/* Unit Status Badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            trx.statusUnit === 'Disewa'
                              ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800'
                              : trx.statusUnit === 'Booking'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                              : trx.statusUnit === 'Overdue'
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse'
                              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          }`}>
                            {trx.statusUnit}
                          </span>

                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {trx.id}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Bike className="w-3 h-3 text-cyan-400" />
                            <strong>{trx.nopolMotor}</strong> ({bike?.tipeMotor || 'Motor'})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatIndonesianDateTime(trx.waktuStartSewa)} ({trx.lamaSewaHari} Hari)
                          </span>
                          <span className="text-slate-300 font-mono">
                            {formatRupiah(trx.totalPemasukan)} ({trx.statusBayar})
                          </span>
                          <span>
                            Jaminan: <strong className="text-slate-200">{trx.identitasDijaminkan}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Direct Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onOpenWhatsApp(trx);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg text-xs font-medium transition-colors"
                          title="Buka Pesan Nota WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Nota WA</span>
                        </button>

                        {!isInFrequentRenters && onSaveCustomerToDatabase && (
                          <button
                            onClick={() => {
                              onSaveCustomerToDatabase(trx);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                            title="Simpan ke Database Penyewa Setia"
                          >
                            <UserPlus className="w-3 h-3 text-cyan-400" />
                            <span className="hidden sm:inline">Simpan CRM</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pencarian mencakup database pelanggan tetap &amp; seluruh riwayat sewa armada Malang.</span>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white underline text-xs"
          >
            Tutup Dialog
          </button>
        </div>

      </div>
    </div>
  );
};
