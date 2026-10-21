import React, { useState } from 'react';
import { FrequentRenter, GuaranteeIdType, CustomerCategory, TransaksiSewa } from '../types/rental';
import { formatRupiah, formatIndonesianDateOnly } from '../utils/formatters';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Star, 
  ShieldCheck, 
  KeyRound, 
  Trash2, 
  Edit3, 
  Download, 
  RefreshCw, 
  X,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface FrequentRentersDatabaseProps {
  renters: FrequentRenter[];
  onAddRenter: (renter: FrequentRenter) => void;
  onUpdateRenter: (renter: FrequentRenter) => void;
  onDeleteRenter: (id: string) => void;
  onSyncFromTransactions: () => void;
  onNewRentalForCustomer: (customer: FrequentRenter) => void;
}

export const FrequentRentersDatabase: React.FC<FrequentRentersDatabaseProps> = ({
  renters,
  onAddRenter,
  onUpdateRenter,
  onDeleteRenter,
  onSyncFromTransactions,
  onNewRentalForCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rentals' | 'spent' | 'name'>('rentals');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRenter, setEditingRenter] = useState<FrequentRenter | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const STANDARD_IDENTITAS_OPTIONS = [
    'KTM dan KTP',
    'KTP Asli',
    'KTM (Kartu Tanda Mahasiswa)',
    'SIM C + KTP',
    'Paspor / KITAS'
  ];

  const [formIdentitas, setFormIdentitas] = useState<GuaranteeIdType>('KTM dan KTP');
  const [isCustomFormIdentitas, setIsCustomFormIdentitas] = useState(false);
  const [customFormIdentitasText, setCustomFormIdentitasText] = useState('');
  const [formKategori, setFormKategori] = useState<CustomerCategory>('Mhs Malang');
  const [formRating, setFormRating] = useState(5);
  const [formCatatan, setFormCatatan] = useState('');

  const openAddModal = () => {
    setEditingRenter(null);
    setFormNama('');
    setFormWhatsapp('');
    setFormAlamat('');
    setFormIdentitas('KTM dan KTP');
    setIsCustomFormIdentitas(false);
    setCustomFormIdentitasText('');
    setFormKategori('Mhs Malang');
    setFormRating(5);
    setFormCatatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (renter: FrequentRenter) => {
    setEditingRenter(renter);
    setFormNama(renter.nama);
    setFormWhatsapp(renter.whatsapp);
    setFormAlamat(renter.alamat);
    if (STANDARD_IDENTITAS_OPTIONS.includes(renter.identitasDefault)) {
      setFormIdentitas(renter.identitasDefault);
      setIsCustomFormIdentitas(false);
      setCustomFormIdentitasText('');
    } else {
      setFormIdentitas('Lainnya');
      setIsCustomFormIdentitas(true);
      setCustomFormIdentitasText(renter.identitasDefault);
    }
    setFormKategori(renter.kategoriDefault);
    setFormRating(renter.ratingTrust);
    setFormCatatan(renter.catatanKhusus || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formWhatsapp.trim()) {
      alert('Nama dan No. WhatsApp wajib diisi.');
      return;
    }
    if (isCustomFormIdentitas && !customFormIdentitasText.trim()) {
      alert('Silakan tuliskan identitas jaminan.');
      return;
    }

    const cleanWa = formWhatsapp.trim().replace(/\D/g, '').replace(/^0/, '62');
    const finalIdentitas = isCustomFormIdentitas 
      ? customFormIdentitasText.trim() 
      : formIdentitas;

    if (editingRenter) {
      const updated: FrequentRenter = {
        ...editingRenter,
        nama: formNama.trim(),
        whatsapp: cleanWa,
        alamat: formAlamat.trim() || 'Malang',
        identitasDefault: finalIdentitas,
        kategoriDefault: formKategori,
        ratingTrust: formRating,
        catatanKhusus: formCatatan.trim()
      };
      onUpdateRenter(updated);
    } else {
      const newCustomer: FrequentRenter = {
        id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        nama: formNama.trim(),
        whatsapp: cleanWa,
        alamat: formAlamat.trim() || 'Malang',
        identitasDefault: finalIdentitas,
        kategoriDefault: formKategori,
        totalRentals: 1,
        totalSpent: 0,
        ratingTrust: formRating,
        lastRentalDate: new Date().toISOString(),
        catatanKhusus: formCatatan.trim()
      };
      onAddRenter(newCustomer);
    }

    setIsModalOpen(false);
  };

  // Filter & Sorting
  const filteredRenters = renters.filter(r => {
    if (filterCategory !== 'all' && r.kategoriDefault !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const qDigits = searchQuery.replace(/\D/g, '');
      const matchName = r.nama.toLowerCase().includes(q);
      const rDigits = r.whatsapp.replace(/\D/g, '');
      const matchWa = r.whatsapp.includes(q) || (qDigits.length > 0 && rDigits.includes(qDigits));
      const matchAlamat = r.alamat.toLowerCase().includes(q);
      if (!matchName && !matchWa && !matchAlamat) return false;
    }
    return true;
  });

  const sortedRenters = [...filteredRenters].sort((a, b) => {
    if (sortBy === 'rentals') {
      return b.totalRentals - a.totalRentals;
    } else if (sortBy === 'spent') {
      return b.totalSpent - a.totalSpent;
    } else {
      return a.nama.localeCompare(b.nama);
    }
  });

  // KPI Metrics
  const totalCustomers = renters.length;
  const topRenter = [...renters].sort((a, b) => b.totalRentals - a.totalRentals)[0];
  const totalRevenueFromLoyal = renters.reduce((sum, r) => sum + r.totalSpent, 0);
  const averageRentals = renters.length > 0
    ? (renters.reduce((sum, r) => sum + r.totalRentals, 0) / renters.length).toFixed(1)
    : '0';

  const exportRentersToCSV = () => {
    const headers = ['ID', 'Nama Penyewa', 'WhatsApp', 'Alamat', 'Identitas Default', 'Kategori Default', 'Frekuensi Sewa', 'Total Transaksi (Rp)', 'Rating', 'Catatan'];
    const rows = sortedRenters.map(r => [
      `"${r.id}"`,
      `"${r.nama}"`,
      `"${r.whatsapp}"`,
      `"${r.alamat.replace(/"/g, '""')}"`,
      `"${r.identitasDefault}"`,
      `"${r.kategoriDefault}"`,
      r.totalRentals,
      r.totalSpent,
      r.ratingTrust,
      `"${(r.catatanKhusus || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Database_Penyewa_Setia_Malang_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Introduction Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
              CRM &amp; Loyalitas Pelanggan
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              Frequent Renters Database
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Database Penyewa Paling Sering (Frequent Renters)
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Penyimpanan data nama, kontak WhatsApp, dan riwayat penyewa setia di Malang. Memudahkan pembuatan transaksi sewa baru dalam 1-klik tanpa perlu mengetik ulang data penyewa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onSyncFromTransactions}
            title="Sinkronkan nama dan nomor HP penyewa secara otomatis dari riwayat transaksi sewa"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sinkron dari Transaksi</span>
          </button>

          <button
            onClick={exportRentersToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Pelanggan Terdaftar</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums mt-1">
            {totalCustomers} Orang
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tersimpan di database lokal
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Penyewa Paling Sering</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 truncate mt-1">
            {topRenter ? topRenter.nama : '-'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            {topRenter ? `${topRenter.totalRentals} kali sewa` : '-'}
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Omset dari Pelanggan Setia</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums mt-1">
            {formatRupiah(totalRevenueFromLoyal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Akumulasi nilai transaksi
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Rata-rata Frekuensi Sewa</span>
            <RefreshCw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums mt-1">
            {averageRentals}x
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tingkat sewa berulang (Repeat Rate)
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama penyewa, nomor WhatsApp (08... / 62...), kos / domisili..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="Mhs Malang">Mhs Malang</option>
            <option value="Luar Malang / Wisatawan">Luar Malang / Wisatawan</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'rentals' | 'spent' | 'name')}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="rentals">Urut: Frekuensi Sewa Terbanyak</option>
            <option value="spent">Urut: Total Belanja Terbesar</option>
            <option value="name">Urut: Nama (A-Z)</option>
          </select>

          <span className="text-xs text-slate-400 pl-2">
            Total <strong className="text-white font-mono">{sortedRenters.length}</strong> pelanggan
          </span>
        </div>
      </div>

      {/* Renters Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedRenters.length === 0 ? (
          <div className="col-span-full bg-slate-900 rounded-xl border border-slate-800 p-12 text-center text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>Tidak ada penyewa yang sesuai dengan pencarian Anda.</p>
          </div>
        ) : (
          sortedRenters.map((renter, index) => {
            const cleanWa = renter.whatsapp.replace(/\D/g, '');
            const waChatUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
              `Halo Kak ${renter.nama}, kami dari Rental Motor Malang. Mau sewa motor lagi untuk agenda hari ini? Unit siap kami siapkan (Helm 0/1/2, Bensin 1-5/Full Kotak). 🙏`
            )}`;

            return (
              <div
                key={renter.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-4 transition-colors"
              >
                <div className="space-y-3">
                  {/* Card Header: Name, Rank, and Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-cyan-400 flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <h3 className="font-bold text-white text-sm">
                          {renter.nama}
                        </h3>
                      </div>
                      <div className="font-mono text-cyan-400 text-xs mt-1 flex items-center gap-1">
                        <span>📱 +{cleanWa}</span>
                      </div>
                    </div>

                    {/* Trust Rating Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: renter.ratingTrust }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Address & Default Guarantee */}
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="truncate" title={renter.alamat}>
                      📍 {renter.alamat}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300">
                        🪪 {renter.identitasDefault}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-medium">
                        {renter.kategoriDefault}
                      </span>
                    </div>
                  </div>

                  {/* Stats Ribbon: Frequency & Total Spent */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Frekuensi Sewa</div>
                      <div className="font-bold font-mono text-emerald-400 text-sm">
                        {renter.totalRentals}x Rental
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Total Transaksi</div>
                      <div className="font-bold font-mono text-white text-sm tabular-nums">
                        {formatRupiah(renter.totalSpent)}
                      </div>
                    </div>
                  </div>

                  {/* Special Notes / Preferences */}
                  {renter.catatanKhusus && (
                    <div className="p-2 rounded bg-slate-950/40 text-[11px] text-slate-300 italic border-l-2 border-cyan-500">
                      "{renter.catatanKhusus}"
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNewRentalForCustomer(renter)}
                    title="Buat transaksi sewa baru untuk pelanggan ini"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Buat Sewa Baru</span>
                  </button>

                  <a
                    href={waChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat WhatsApp ke Penyewa"
                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-emerald-800/60 rounded-lg transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => openEditModal(renter)}
                    title="Edit Data Pelanggan"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteRenter(renter.id)}
                    title="Hapus Pelanggan"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>{editingRenter ? 'Edit Data Penyewa Setia' : 'Tambah Penyewa Setia Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nama Lengkap Penyewa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dimas Arya Pratama"
                  value={formNama}
                  onChange={e => setFormNama(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nomor HP / WhatsApp (Format: 08... atau 62...) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 081234567890"
                  value={formWhatsapp}
                  onChange={e => setFormWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Alamat Kos / Domisili di Malang
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kos Sigura-gura Gg 3 / Hotel Santika"
                  value={formAlamat}
                  onChange={e => setFormAlamat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Jaminan Biasa Digunakan
                  </label>
                  <select
                    value={isCustomFormIdentitas ? 'Lainnya' : formIdentitas}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Lainnya') {
                        setIsCustomFormIdentitas(true);
                      } else {
                        setIsCustomFormIdentitas(false);
                        setFormIdentitas(val as GuaranteeIdType);
                        setCustomFormIdentitasText('');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="KTM dan KTP">KTM dan KTP</option>
                    <option value="KTP Asli">KTP Asli</option>
                    <option value="KTM (Kartu Tanda Mahasiswa)">KTM (Kartu Tanda Mahasiswa)</option>
                    <option value="SIM C + KTP">SIM C + KTP</option>
                    <option value="Paspor / KITAS">Paspor / KITAS</option>
                    <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
                  </select>

                  {isCustomFormIdentitas && (
                    <div className="mt-2">
                      <input
                        type="text"
                        required
                        placeholder="Tuliskan identitas (e.g. SIM A / BPJS / Ijazah)..."
                        value={customFormIdentitasText}
                        onChange={e => setCustomFormIdentitasText(e.target.value)}
                        className="w-full bg-slate-950 border border-cyan-500/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Kategori Pelanggan
                  </label>
                  <select
                    value={formKategori}
                    onChange={e => setFormKategori(e.target.value as CustomerCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="Mhs Malang">Mhs Malang</option>
                    <option value="Luar Malang / Wisatawan">Luar Malang / Wisatawan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tingkat Kepercayaan (Rating 1 - 5 Bintang)
                </label>
                <select
                  value={formRating}
                  onChange={e => setFormRating(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ 5 Bintang (Sangat Terpercaya / VIP)</option>
                  <option value={4}>⭐⭐⭐⭐ 4 Bintang (Baik / Terpercaya)</option>
                  <option value={3}>⭐⭐⭐ 3 Bintang (Standar)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Catatan Khusus / Preferensi Motor
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mahasiswa UB, selalu minta helm 2 pcs, preferensi motor Fazzio atau Beat"
                  value={formCatatan}
                  onChange={e => setFormCatatan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
                >
                  Simpan Data Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
