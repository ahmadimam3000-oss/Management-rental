import React, { useState, useEffect } from 'react';
import { 
  MotorMaster, 
  TransaksiSewa, 
  CustomerCategory, 
  GuaranteeIdType, 
  PaymentStatus,
  PaymentMethod,
  FrequentRenter
} from '../types/rental';
import { TARIF_STANDAR } from '../data/initialFleetData';
import { 
  formatRupiah, 
  getIndonesianDay, 
  toInputDateTimeLocal, 
  calculateEstimatedReturnWithHours,
  calculateHourlyOvertimeFee,
  formatIndonesianDateTime,
  PAYMENT_BRI_ACCOUNT,
  PAYMENT_BRI_HOLDER,
  PAYMENT_QRIS_IMAGE,
  PAYMENT_QRIS_MERCHANT,
  PAYMENT_QRIS_NMID
} from '../utils/formatters';
import { X, Calendar, KeyRound, Sparkles, AlertCircle, Users, Clock, Copy, Check, QrCode, Building2, Banknote, Maximize2 } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTrx: TransaksiSewa) => void;
  fleet: MotorMaster[];
  activeBookYear?: number;
  frequentRenters?: FrequentRenter[];
  prefilledCustomer?: FrequentRenter;
  prefilledNopol?: string;
  prefilledTipe?: string;
  prefilledKategori?: string;
  prefilledHarga?: number;
  prefilledLamaHari?: number;
  prefilledStartDate?: string;
  prefilledStatusUnit?: 'Disewa' | 'Booking';
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fleet,
  activeBookYear = 2026,
  frequentRenters,
  prefilledCustomer,
  prefilledNopol,
  prefilledTipe,
  prefilledKategori,
  prefilledHarga,
  prefilledLamaHari,
  prefilledStartDate,
  prefilledStatusUnit
}) => {
  const [namaPenyewa, setNamaPenyewa] = useState(prefilledCustomer?.nama || '');
  const [whatsapp, setWhatsapp] = useState(prefilledCustomer?.whatsapp || '');
  const [alamatAsalKos, setAlamatAsalKos] = useState(prefilledCustomer?.alamat || '');
  const STANDARD_IDENTITAS_OPTIONS = [
    'KTM dan KTP',
    'KTP Asli',
    'KTM (Kartu Tanda Mahasiswa)',
    'SIM C + KTP',
    'Paspor / KITAS'
  ];

  const [identitasDijaminkan, setIdentitasDijaminkan] = useState<GuaranteeIdType>(
    prefilledCustomer?.identitasDefault || 'KTM dan KTP'
  );
  const [isCustomIdentitas, setIsCustomIdentitas] = useState(false);
  const [customIdentitasText, setCustomIdentitasText] = useState('');
  const [nopolMotor, setNopolMotor] = useState(prefilledNopol || fleet[0]?.nopol || '');
  const [kategoriPelanggan, setKategoriPelanggan] = useState<CustomerCategory>('Mhs Malang');
  const [waktuStartSewa, setWaktuStartSewa] = useState(prefilledStartDate || toInputDateTimeLocal(new Date()));
  const [lamaSewaHariInput, setLamaSewaHariInput] = useState<string>('1');
  const [paketKhusus, setPaketKhusus] = useState<'Harian' | 'Paket 12 Jam' | 'Per Jam'>('Harian');
  const [hargaPaket12JamInput, setHargaPaket12JamInput] = useState<string>('');
  const [durasiJam, setDurasiJam] = useState<number>(1);
  const [tambahanJam, setTambahanJam] = useState<number>(0);
  const [hargaPerHariInput, setHargaPerHariInput] = useState<string>('55000');
  const [statusBayar, setStatusBayar] = useState<PaymentStatus>('Lunas');
  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>('Tunai');
  const [copiedBri, setCopiedBri] = useState(false);
  const [showQrisZoom, setShowQrisZoom] = useState(false);
  const [statusUnit, setStatusUnit] = useState<'Disewa' | 'Booking'>(prefilledStatusUnit || 'Disewa');
  
  // Specific rental inclusions: 0/1/2 helmets, bensin 1/2/3/4/5/Full kotak
  const [jumlahHelm, setJumlahHelm] = useState<'0' | '1' | '2'>('2');
  const [bensinAwal, setBensinAwal] = useState('1 Kotak');
  const [catatanJaminanTambahan, setCatatanJaminanTambahan] = useState('');

  const lamaSewaHari = lamaSewaHariInput.trim() === ''
    ? 0
    : Math.max(0, parseInt(lamaSewaHariInput, 10) || 0);

  const hargaPerHari = hargaPerHariInput.trim() === ''
    ? 0
    : Math.max(0, parseInt(hargaPerHariInput, 10) || 0);

  const hargaPaket12Jam = hargaPaket12JamInput.trim() === ''
    ? 0
    : Math.max(0, parseInt(hargaPaket12JamInput, 10) || 0);

  const applyIdentitasValue = (val: string) => {
    if (STANDARD_IDENTITAS_OPTIONS.includes(val)) {
      setIdentitasDijaminkan(val as GuaranteeIdType);
      setIsCustomIdentitas(false);
      setCustomIdentitasText('');
    } else if (val === 'Lainnya') {
      setIdentitasDijaminkan('Lainnya');
      setIsCustomIdentitas(true);
    } else {
      setIdentitasDijaminkan('Lainnya');
      setIsCustomIdentitas(true);
      setCustomIdentitasText(val);
    }
  };

  // Handle prefill updates when modal opens or prefill changes
  useEffect(() => {
    if (prefilledCustomer) {
      setNamaPenyewa(prefilledCustomer.nama);
      setWhatsapp(prefilledCustomer.whatsapp);
      setAlamatAsalKos(prefilledCustomer.alamat);
      applyIdentitasValue(prefilledCustomer.identitasDefault);
      setKategoriPelanggan(prefilledCustomer.kategoriDefault);
      applyRecommendedRate(nopolMotor, prefilledCustomer.kategoriDefault);
    }
    if (prefilledNopol) {
      setNopolMotor(prefilledNopol);
      applyRecommendedRate(prefilledNopol, prefilledKategori ? (prefilledKategori as CustomerCategory) : kategoriPelanggan);
    }
    if (prefilledKategori) setKategoriPelanggan(prefilledKategori as CustomerCategory);
    if (prefilledHarga !== undefined) setHargaPerHariInput(String(prefilledHarga));
    if (prefilledLamaHari !== undefined) setLamaSewaHariInput(String(prefilledLamaHari));
    if (prefilledStartDate) setWaktuStartSewa(prefilledStartDate);
    if (prefilledStatusUnit) setStatusUnit(prefilledStatusUnit);
  }, [prefilledCustomer, prefilledNopol, prefilledKategori, prefilledHarga, prefilledLamaHari, prefilledStartDate, prefilledStatusUnit, isOpen]);

  // Auto calculate tariff recommendation when motor or category changes
  const applyRecommendedRate = (nopol: string, kategori: CustomerCategory) => {
    const bike = fleet.find(b => b.nopol === nopol);
    if (!bike) return;
    const tarif = TARIF_STANDAR.find(t => t.tipeMotor.toLowerCase() === bike.tipeMotor.toLowerCase());
    if (!tarif) return;

    if (kategori === 'Mhs Malang') {
      setHargaPerHariInput(String(tarif.mhsMalang24Jam));
    } else if (kategori === 'Luar Malang / Wisatawan') {
      setHargaPerHariInput(String(tarif.luarMalang24Jam));
    }
  };

  const handleNopolChange = (newNopol: string) => {
    setNopolMotor(newNopol);
    applyRecommendedRate(newNopol, kategoriPelanggan);
  };

  const handleKategoriChange = (newKategori: CustomerCategory) => {
    setKategoriPelanggan(newKategori);
    applyRecommendedRate(nopolMotor, newKategori);
  };

  // Calculations & Pricing with Hourly Rental (<12h), Paket 12 Jam (Optional Price), & Hourly Overtime
  const ratePerJam = calculateHourlyOvertimeFee(durasiJam);
  const biayaTambahanJam = calculateHourlyOvertimeFee(tambahanJam);

  const calculatedDay = getIndonesianDay(waktuStartSewa);

  let calculatedReturnIso = '';
  let basePrice = 0;
  let totalPemasukan = 0;

  if (paketKhusus === 'Per Jam') {
    calculatedReturnIso = calculateEstimatedReturnWithHours(waktuStartSewa, 0, durasiJam);
    basePrice = ratePerJam;
    totalPemasukan = ratePerJam;
  } else if (paketKhusus === 'Paket 12 Jam') {
    calculatedReturnIso = calculateEstimatedReturnWithHours(waktuStartSewa, lamaSewaHari, 12 + tambahanJam);
    basePrice = (lamaSewaHari * hargaPerHari) + hargaPaket12Jam;
    totalPemasukan = basePrice + biayaTambahanJam;
  } else {
    calculatedReturnIso = calculateEstimatedReturnWithHours(waktuStartSewa, lamaSewaHari, tambahanJam);
    basePrice = lamaSewaHari * hargaPerHari;
    totalPemasukan = basePrice + biayaTambahanJam;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPenyewa.trim()) return alert('Silakan masukkan Nama Penyewa.');
    if (!whatsapp.trim()) return alert('Silakan masukkan No. WhatsApp.');
    if (!nopolMotor) return alert('Silakan pilih unit motor.');
    if (isCustomIdentitas && !customIdentitasText.trim()) {
      return alert('Silakan tuliskan identitas yang dijaminkan.');
    }

    const finalIdentitas = isCustomIdentitas 
      ? customIdentitasText.trim() 
      : identitasDijaminkan;

    const startObj = new Date(waktuStartSewa);
    const idYear = !isNaN(startObj.getFullYear()) ? startObj.getFullYear() : activeBookYear;
    const newId = `TRX-${idYear}-${Math.floor(100 + Math.random() * 900)}`;

    const paket12Note = paketKhusus === 'Paket 12 Jam'
      ? ` [Paket 12 Jam: ${hargaPaket12Jam > 0 ? formatRupiah(hargaPaket12Jam) : 'Harga Opsional Rp 0'}]`
      : '';

    const newTrx: TransaksiSewa = {
      id: newId,
      namaPenyewa: namaPenyewa.trim(),
      whatsapp: whatsapp.trim().replace(/^0/, '62'),
      alamatAsalKos: alamatAsalKos.trim() || 'Malang',
      identitasDijaminkan: finalIdentitas,
      nopolMotor,
      kategoriPelanggan,
      hariSewa: calculatedDay,
      waktuStartSewa: new Date(waktuStartSewa).toISOString(),
      lamaSewaHari: paketKhusus === 'Per Jam' 
        ? Number((durasiJam / 24).toFixed(2)) 
        : Number(lamaSewaHari),
      durasiJam: paketKhusus === 'Per Jam' ? durasiJam : paketKhusus === 'Paket 12 Jam' ? 12 : undefined,
      tambahanJam: paketKhusus !== 'Per Jam' && tambahanJam > 0 ? tambahanJam : undefined,
      paketKhusus: paketKhusus,
      hargaPaket12Jam: paketKhusus === 'Paket 12 Jam' ? hargaPaket12Jam : undefined,
      estWaktuKembali: calculatedReturnIso,
      hargaPerHari: paketKhusus === 'Per Jam' 
        ? ratePerJam 
        : paketKhusus === 'Paket 12 Jam' && lamaSewaHari === 0 && hargaPaket12Jam > 0
        ? hargaPaket12Jam
        : Number(hargaPerHari),
      totalPemasukan: Number(totalPemasukan),
      statusBayar,
      metodePembayaran,
      statusUnit,
      jumlahHelm,
      levelBensin: bensinAwal as '1 Kotak' | '2 Kotak' | '3 Kotak' | '4 Kotak' | '5 Kotak' | 'Full Kotak',
      catatanJaminanTambahan: `${jumlahHelm === '0' ? '0 Helm (Bawa Sendiri)' : `${jumlahHelm} Helm SNI`}, Bensin: ${bensinAwal}, Bayar: ${metodePembayaran}${paketKhusus === 'Per Jam' ? ` [Sewa Per Jam: ${durasiJam} Jam]` : ''}${paket12Note}${tambahanJam > 0 && paketKhusus !== 'Per Jam' ? ` [Tambahan ${tambahanJam} Jam: +${formatRupiah(biayaTambahanJam)}]` : ''}${catatanJaminanTambahan.trim() ? ` (${catatanJaminanTambahan.trim()})` : ''}`
    };

    onSave(newTrx);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Pencatatan Transaksi Sewa Baru</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Buku {activeBookYear}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Otomatis menghitung hari sewa, estimasi kembali, dan nominal pendapatan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Section 1: Tenant Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
                1. Identitas Penyewa
              </div>
              {frequentRenters && frequentRenters.length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {frequentRenters.length} Penyewa Terdaftar di CRM
                </span>
              )}
            </div>

            {/* Quick Picker from Frequent Renters Database */}
            {frequentRenters && frequentRenters.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-medium">Pilih dari Database Penyewa Setia:</span>
                </div>
                <select
                  defaultValue=""
                  onChange={e => {
                    const sel = frequentRenters.find(r => r.id === e.target.value);
                    if (sel) {
                      setNamaPenyewa(sel.nama);
                      setWhatsapp(sel.whatsapp);
                      setAlamatAsalKos(sel.alamat);
                      applyIdentitasValue(sel.identitasDefault);
                      setKategoriPelanggan(sel.kategoriDefault);
                      applyRecommendedRate(nopolMotor, sel.kategoriDefault);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-cyan-300 outline-none focus:border-cyan-500 max-w-full sm:max-w-xs"
                >
                  <option value="" disabled>-- Pilih Pelanggan (Autofill Cepat) --</option>
                  {frequentRenters.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nama} ({r.whatsapp}) - {r.totalRentals}x sewa
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nama Lengkap Penyewa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dimas Arya Pratama"
                  value={namaPenyewa}
                  onChange={e => setNamaPenyewa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  No. WhatsApp / HP (62...) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 081234567890"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Alamat Asal / Alamat Kos di Malang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kos Sigura-gura Gg 3 / Asal Surabaya"
                  value={alamatAsalKos}
                  onChange={e => setAlamatAsalKos(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Identitas Dijaminkan *
                </label>
                <select
                  value={isCustomIdentitas ? 'Lainnya' : identitasDijaminkan}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Lainnya') {
                      setIsCustomIdentitas(true);
                    } else {
                      setIsCustomIdentitas(false);
                      setIdentitasDijaminkan(val as GuaranteeIdType);
                      setCustomIdentitasText('');
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

                {isCustomIdentitas && (
                  <div className="mt-2">
                    <label className="block text-slate-400 text-[11px] mb-1">
                      ✍️ Tuliskan Identitas Jaminan: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SIM A / Ijazah Asli / Kartu Keluarga / BPJS"
                      value={customIdentitasText}
                      onChange={e => setCustomIdentitasText(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
              2. Unit Motor & Kategori Sewa
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Pilih Unit Armada (13 Motor) *
                </label>
                <select
                  value={nopolMotor}
                  onChange={e => handleNopolChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
                >
                  {fleet.map(b => (
                    <option key={b.nopol} value={b.nopol}>
                      {b.namaUnit} · {b.nopol} ({b.tipeMotor}) - [{b.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Kategori Pelanggan *
                </label>
                <select
                  value={kategoriPelanggan}
                  onChange={e => handleKategoriChange(e.target.value as CustomerCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                >
                  <option value="Mhs Malang">Mhs Malang (Mahasiswa Malang)</option>
                  <option value="Luar Malang / Wisatawan">Luar Malang / Wisatawan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
                3. Jadwal &amp; Durasi Sewa
              </div>
              <span className="text-[11px] text-slate-400">
                Per Jam (&lt; 12 Jam), Paket 12 Jam, atau Harian
              </span>
            </div>

            {/* Pilihan Paket Sewa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPaketKhusus('Per Jam')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  paketKhusus === 'Per Jam'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⏱️ Sewa Per Jam (&lt; 12 Jam)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaketKhusus('Paket 12 Jam');
                  if (lamaSewaHari === 1) {
                    setLamaSewaHariInput('0');
                  }
                }}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  paketKhusus === 'Paket 12 Jam'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌗 Paket Sewa 12 Jam
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaketKhusus('Harian');
                  if (lamaSewaHari === 0) {
                    setLamaSewaHariInput('1');
                  }
                }}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  paketKhusus === 'Harian'
                    ? 'bg-cyan-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📅 Sewa Harian (24 Jam)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Waktu Mulai Sewa *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={waktuStartSewa}
                  onChange={e => setWaktuStartSewa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
                />
              </div>

              {paketKhusus === 'Per Jam' ? (
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                    <span>⏱️ Durasi Jam (Start Min. 1 Jam - Di Bawah 12 Jam) *</span>
                    <span className="text-emerald-400 font-mono font-bold text-xs">
                      {formatRupiah(ratePerJam)}
                    </span>
                  </label>
                  <select
                    value={durasiJam}
                    onChange={e => setDurasiJam(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-2 text-white outline-none font-medium"
                  >
                    <option value={1}>1 Jam — Rp 10.000</option>
                    <option value={2}>2 Jam — Rp 15.000</option>
                    <option value={3}>3 Jam — Rp 20.000</option>
                    <option value={4}>4 Jam — Rp 25.000</option>
                    <option value={5}>5 Jam — Rp 30.000</option>
                    <option value={6}>6 Jam — Rp 35.000</option>
                    <option value={7}>7 Jam — Rp 40.000</option>
                    <option value={8}>8 Jam — Rp 45.000</option>
                    <option value={9}>9 Jam — Rp 50.000</option>
                    <option value={10}>10 Jam — Rp 55.000</option>
                    <option value={11}>11 Jam — Rp 60.000</option>
                  </select>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Aturan: 1 jam Rp 10.000, di atas 1 jam kelipatan Rp 5.000/jam (minimal 1 jam).
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-medium">
                        Lama Sewa (Hari)
                      </label>
                      <button
                        type="button"
                        onClick={() => setLamaSewaHariInput('0')}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700 transition-colors cursor-pointer"
                        title="Hapus menjadi 0 Hari"
                      >
                        Hapus / 0 Hari
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      placeholder="0"
                      value={lamaSewaHariInput}
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setLamaSewaHariInput('');
                        } else {
                          const parsed = parseInt(raw, 10);
                          setLamaSewaHariInput(isNaN(parsed) ? '' : String(Math.max(0, parsed)));
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
                    />
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {[0, 1, 2, 3, 4, 5].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setLamaSewaHariInput(String(d))}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                            lamaSewaHari === d
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {d} Hr
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                      <span>⏱️ Tambahan Jam</span>
                      {tambahanJam > 0 && (
                        <span className="text-cyan-400 font-mono font-bold text-[10px]">
                          +{formatRupiah(biayaTambahanJam)}
                        </span>
                      )}
                    </label>
                    <select
                      value={tambahanJam}
                      onChange={e => setTambahanJam(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-2 text-white outline-none font-medium"
                    >
                      <option value={0}>0 Jam (Rp 0)</option>
                      <option value={1}>1 Jam (+Rp 10.000)</option>
                      <option value={2}>2 Jam (+Rp 15.000)</option>
                      <option value={3}>3 Jam (+Rp 20.000)</option>
                      <option value={4}>4 Jam (+Rp 25.000)</option>
                      <option value={5}>5 Jam (+Rp 30.000)</option>
                      <option value={6}>6 Jam (+Rp 35.000)</option>
                      <option value={7}>7 Jam (+Rp 40.000)</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Panel Paket Sewa 12 Jam dengan Harga Opsional */}
            {paketKhusus !== 'Per Jam' && (
              <div className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                paketKhusus === 'Paket 12 Jam'
                  ? 'bg-amber-950/30 border-amber-500/60'
                  : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (paketKhusus === 'Paket 12 Jam') {
                          setPaketKhusus('Harian');
                        } else {
                          setPaketKhusus('Paket 12 Jam');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        paketKhusus === 'Paket 12 Jam'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span>🌗</span>
                      <span>
                        {paketKhusus === 'Paket 12 Jam'
                          ? '✓ Paket Sewa 12 Jam Aktif (+12 Jam)'
                          : 'Aktifkan Paket Sewa 12 Jam'}
                      </span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {lamaSewaHari === 0
                        ? 'Sewa 12 Jam (0 Hari)'
                        : `${lamaSewaHari} Hari + 12 Jam`}
                    </span>
                  </div>
                  {paketKhusus === 'Paket 12 Jam' && (
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Tarif 12 Jam: {hargaPaket12Jam > 0 ? formatRupiah(hargaPaket12Jam) : 'Rp 0 (Opsional)'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center pt-1">
                  <div>
                    <label className="block text-slate-300 text-[11px] font-medium mb-1">
                      Harga Paket 12 Jam (Rp) — <span className="text-amber-300 font-semibold">Opsional</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        placeholder="Opsional (Misal: 35000 / 40000 atau kosongkan)"
                        value={hargaPaket12JamInput}
                        onChange={e => {
                          const val = e.target.value;
                          setHargaPaket12JamInput(val);
                          if (val.trim() !== '' && paketKhusus !== 'Paket 12 Jam') {
                            setPaketKhusus('Paket 12 Jam');
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-1.5 text-white outline-none font-mono text-xs"
                      />
                      {hargaPaket12JamInput !== '' && (
                        <button
                          type="button"
                          onClick={() => setHargaPaket12JamInput('')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium shrink-0 cursor-pointer"
                          title="Kosongkan harga paket 12 jam"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 mb-1">
                      Pilihan Cepat Harga Paket 12 Jam (Opsional):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Rp 0 (Opsional)', val: '' },
                        { label: '30rb', val: '30000' },
                        { label: '35rb', val: '35000' },
                        { label: '40rb', val: '40000' },
                        { label: '45rb', val: '45000' },
                        { label: '50rb', val: '50000' },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setPaketKhusus('Paket 12 Jam');
                            setHargaPaket12JamInput(preset.val);
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                            paketKhusus === 'Paket 12 Jam' && hargaPaket12JamInput === preset.val
                              ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated return banner */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-slate-400">
                Estimasi Pengembalian ({calculatedDay}, {
                  paketKhusus === 'Per Jam' 
                    ? `${durasiJam} Jam` 
                    : paketKhusus === 'Paket 12 Jam'
                    ? `${lamaSewaHari} Hari + Paket 12 Jam`
                    : `${lamaSewaHari} Hari`
                }{tambahanJam > 0 && paketKhusus !== 'Per Jam' ? ` + ${tambahanJam} Jam` : ''}):
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {formatIndonesianDateTime(calculatedReturnIso)}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
              4. Tarif &amp; Pembayaran
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">
                    Harga / Hari (Rp)
                  </label>
                  {lamaSewaHari === 0 && paketKhusus !== 'Per Jam' && (
                    <span className="text-[10px] font-mono text-amber-300">
                      0 Hari = Rp 0
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="0"
                  value={hargaPerHariInput}
                  onChange={e => setHargaPerHariInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Status Pembayaran *
                </label>
                <select
                  value={statusBayar}
                  onChange={e => setStatusBayar(e.target.value as PaymentStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="DP / Sebagian">DP / Sebagian</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Status Saat Ini *
                </label>
                <select
                  value={statusUnit}
                  onChange={e => setStatusUnit(e.target.value as 'Disewa' | 'Booking')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                >
                  <option value="Disewa">Langsung Check-In (Disewa)</option>
                  <option value="Booking">Booking (Jadwal Mendatang)</option>
                </select>
              </div>
            </div>

            {/* 3 Opsi Metode Pembayaran: 1. Tunai, 2. Transfer BRI, 3. QRIS */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                  <span>💳 Metode Pembayaran (Pilih 1 dari 3 Opsi) *</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/70">
                  Terpilih: {metodePembayaran}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Opsi 1: Tunai */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('Tunai')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    metodePembayaran === 'Tunai'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-[11px] font-bold flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span>1. Tunai</span>
                    </span>
                    {metodePembayaran === 'Tunai' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 leading-snug">
                    Pembayaran uang tunai (Cash) langsung di kasir Ai Rent.
                  </div>
                </button>

                {/* Opsi 2: Transfer BRI */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('Transfer BRI')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    metodePembayaran === 'Transfer BRI'
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-[11px] font-bold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>2. Transfer BRI</span>
                    </span>
                    {metodePembayaran === 'Transfer BRI' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 leading-snug">
                    <span className="font-mono font-bold text-cyan-300 block">{PAYMENT_BRI_ACCOUNT}</span>
                    <span>An ({PAYMENT_BRI_HOLDER}) BRI</span>
                  </div>
                </button>

                {/* Opsi 3: QRIS */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('QRIS')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    metodePembayaran === 'QRIS'
                      ? 'bg-amber-950/60 border-amber-400 text-white shadow-md shadow-amber-950/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-[11px] font-bold flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>3. QRIS</span>
                    </span>
                    {metodePembayaran === 'QRIS' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 leading-snug">
                    <span className="font-semibold text-amber-300 block">{PAYMENT_QRIS_MERCHANT}</span>
                    <span>Scan Semua Bank &amp; E-Wallet</span>
                  </div>
                </button>
              </div>

              {/* Detail Panel for Transfer BRI */}
              {metodePembayaran === 'Transfer BRI' && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold">
                      Rekening Tujuan Transfer Bank BRI
                    </div>
                    <div className="text-sm font-mono font-black text-white tracking-wide">
                      {PAYMENT_BRI_ACCOUNT}
                    </div>
                    <div className="text-xs text-slate-200">
                      a.n. <strong className="text-cyan-300">{PAYMENT_BRI_HOLDER}</strong> (Bank BRI)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(PAYMENT_BRI_ACCOUNT);
                      setCopiedBri(true);
                      setTimeout(() => setCopiedBri(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors shrink-0 self-start sm:self-center"
                  >
                    {copiedBri ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>No. Rek Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin No. Rek BRI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Detail Panel for QRIS Image */}
              {metodePembayaran === 'QRIS' && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-700/60 flex flex-col sm:flex-row items-center gap-4">
                  <div 
                    onClick={() => setShowQrisZoom(true)}
                    className="relative group cursor-pointer bg-white p-2 rounded-xl border-2 border-amber-400 shadow-lg shrink-0"
                    title="Klik untuk memperbesar QRIS"
                  >
                    <img
                      src={PAYMENT_QRIS_IMAGE}
                      alt="QRIS AI RENT FOOD GROUP"
                      className="w-36 h-48 object-contain rounded"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <span className="bg-slate-950/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-amber-400" />
                        <span>Perbesar</span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/80 text-amber-300 text-[10px] font-bold">
                      <QrCode className="w-3 h-3" />
                      <span>QRIS STANDAR PEMBAYARAN NASIONAL (GPN)</span>
                    </div>
                    <div className="text-sm font-black text-white">
                      {PAYMENT_QRIS_MERCHANT}
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      NMID: {PAYMENT_QRIS_NMID} (A01)
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Menerima pembayaran dari seluruh Mobile Banking (BRI, BCA, Mandiri, BNI, BSI) dan E-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja).
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQrisZoom(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Tampilkan QRIS Layar Penuh</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fasilitas & Inklusi Bawaan: 0/1/2 Helm, 1/5 Bensin */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="font-semibold text-cyan-400 text-[11px] flex items-center justify-between">
                <span>Fasilitas &amp; Inklusi Resmi Rental:</span>
                <span className="text-slate-400 font-normal">Termasuk dalam harga sewa</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">🪖 Jumlah Helm (0/1/2):</label>
                  <select
                    value={jumlahHelm}
                    onChange={e => setJumlahHelm(e.target.value as '0' | '1' | '2')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="2">2 Helm SNI (Standar)</option>
                    <option value="1">1 Helm SNI (Single)</option>
                    <option value="0">0 Helm (Bawa Sendiri / Tanpa Helm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">⛽ Bensin Awal (1/2/3/4/5/Full Kotak):</label>
                  <select
                    value={bensinAwal}
                    onChange={e => setBensinAwal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="1 Kotak">1 Kotak</option>
                    <option value="2 Kotak">2 Kotak</option>
                    <option value="3 Kotak">3 Kotak</option>
                    <option value="4 Kotak">4 Kotak</option>
                    <option value="5 Kotak">5 Kotak</option>
                    <option value="Full Kotak">Full Kotak</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Catatan / Kelengkapan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="e.g. Holder HP, Kunci Cakram Tambahan, Antar ke Stasiun Kotabaru"
                value={catatanJaminanTambahan}
                onChange={e => setCatatanJaminanTambahan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Total Highlight */}
            <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/60 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-cyan-300">Total Pemasukan Sewa</div>
                <div className="text-xs text-slate-400">
                  {paketKhusus === 'Per Jam'
                    ? `Sewa Per Jam (${durasiJam} Jam: ${formatRupiah(ratePerJam)})`
                    : paketKhusus === 'Paket 12 Jam'
                    ? `${lamaSewaHari} Hari (${formatRupiah(lamaSewaHari * hargaPerHari)}) + Paket 12 Jam (${hargaPaket12Jam > 0 ? formatRupiah(hargaPaket12Jam) : 'Rp 0 Opsional'})`
                    : `${lamaSewaHari} Hari x ${formatRupiah(hargaPerHari)}`}
                  {tambahanJam > 0 && paketKhusus !== 'Per Jam' && ` + Tambahan ${tambahanJam} Jam (${formatRupiah(biayaTambahanJam)})`}
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
                {formatRupiah(totalPemasukan)}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
            >
              Simpan & Cetak Transaksi
            </button>
          </div>

        </form>

      </div>

      {/* Fullscreen QRIS Zoom Modal */}
      {showQrisZoom && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setShowQrisZoom(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-2xl p-4 shadow-2xl text-center space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-left">
                <div className="text-xs font-black text-slate-900">{PAYMENT_QRIS_MERCHANT}</div>
                <div className="text-[10px] font-mono text-slate-500">NMID: {PAYMENT_QRIS_NMID} · Total: {formatRupiah(totalPemasukan)}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrisZoom(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={PAYMENT_QRIS_IMAGE}
              alt="QRIS AI RENT FOOD GROUP"
              className="w-full max-h-[72vh] object-contain mx-auto rounded-lg"
            />
            <div className="text-xs font-bold text-slate-800 bg-amber-100 py-2 px-3 rounded-xl">
              Nominal Bayar: <span className="font-mono text-sm text-emerald-700">{formatRupiah(totalPemasukan)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
