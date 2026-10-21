import React, { useState } from 'react';
import { 
  Bike, 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  CheckCircle, 
  MessageSquare, 
  ArrowLeft, 
  Send,
  AlertTriangle,
  Sparkles,
  Info,
  Copy,
  Check,
  QrCode,
  Building2,
  Banknote,
  Maximize2,
  X
} from 'lucide-react';
import { 
  MotorMaster, 
  TransaksiSewa, 
  CustomerCategory, 
  GuaranteeIdType,
  PaymentMethod
} from '../types/rental';
import { 
  formatRupiah, 
  formatIndonesianDateTime, 
  getIndonesianDay, 
  calculateEstimatedReturnWithHours,
  calculateHourlyOvertimeFee,
  toInputDateTimeLocal,
  RENTAL_CUSTOMER_HOTLINE,
  RENTAL_CS_DISPLAY,
  PAYMENT_BRI_ACCOUNT,
  PAYMENT_BRI_HOLDER,
  PAYMENT_QRIS_IMAGE,
  PAYMENT_QRIS_MERCHANT,
  PAYMENT_QRIS_NMID,
  getPaymentMethodLabel
} from '../utils/formatters';
import { PWAInstallButton, OfflineIndicator } from './PWAInstallButton';

interface TenantBookingMobileViewProps {
  fleet: MotorMaster[];
  onBookingSubmit: (newTrx: TransaksiSewa) => void;
}

export const TenantBookingMobileView: React.FC<TenantBookingMobileViewProps> = ({
  fleet,
  onBookingSubmit
}) => {
  // Form States
  const [namaPenyewa, setNamaPenyewa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [alamatAsalKos, setAlamatAsalKos] = useState('');
  const [kategoriPelanggan, setKategoriPelanggan] = useState<CustomerCategory>('Mhs Malang');
  
  // Guarantee Identity
  const [identitasDijaminkan, setIdentitasDijaminkan] = useState<GuaranteeIdType>('KTM dan KTP');
  const [isCustomIdentitas, setIsCustomIdentitas] = useState(false);
  const [customIdentitasText, setCustomIdentitasText] = useState('');

  // Bike & Rental details
  const [nopolMotor, setNopolMotor] = useState(fleet[0]?.nopol || '');
  const [waktuStartSewa, setWaktuStartSewa] = useState(toInputDateTimeLocal(new Date()));
  const [lamaSewaHariInput, setLamaSewaHariInput] = useState<string>('1');
  const [paketKhusus, setPaketKhusus] = useState<'Harian' | 'Paket 12 Jam' | 'Per Jam'>('Harian');
  const [hargaPaket12JamInput, setHargaPaket12JamInput] = useState<string>('');
  const [durasiJam, setDurasiJam] = useState<number>(1);
  const [tambahanJam, setTambahanJam] = useState<number>(0);
  const [jumlahHelm, setJumlahHelm] = useState<'0' | '1' | '2'>('2');
  const [bensinAwal, setBensinAwal] = useState('1 Kotak');
  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>('Tunai');
  const [copiedBri, setCopiedBri] = useState(false);
  const [showQrisZoom, setShowQrisZoom] = useState(false);
  const [catatanKhusus, setCatatanKhusus] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const lamaSewaHari = lamaSewaHariInput.trim() === ''
    ? 0
    : Math.max(0, parseInt(lamaSewaHariInput, 10) || 0);

  const hargaPaket12Jam = hargaPaket12JamInput.trim() === ''
    ? 0
    : Math.max(0, parseInt(hargaPaket12JamInput, 10) || 0);

  // Success State
  const [submittedTrx, setSubmittedTrx] = useState<TransaksiSewa | null>(null);

  // Dynamic price calculation
  const selectedBike = fleet.find(b => b.nopol === nopolMotor) || fleet[0];
  const ratePerJam = calculateHourlyOvertimeFee(durasiJam);
  const biayaTambahanJam = calculateHourlyOvertimeFee(tambahanJam);

  const getEstimatedDailyRate = (nopol: string, category: CustomerCategory): number => {
    const isPremium = nopol.includes('NMAX') || nopol.includes('PCX') || nopol.includes('AEROX');
    if (category === 'Mhs Malang') {
      return isPremium ? 85000 : 55000;
    }
    return isPremium ? 110000 : 70000;
  };

  const hargaPerHari = getEstimatedDailyRate(nopolMotor, kategoriPelanggan);

  let basePrice = 0;
  let totalPemasukan = 0;
  let calculatedReturnIso = '';

  if (paketKhusus === 'Per Jam') {
    basePrice = ratePerJam;
    totalPemasukan = ratePerJam;
    calculatedReturnIso = calculateEstimatedReturnWithHours(
      new Date(waktuStartSewa).toISOString(),
      0,
      durasiJam
    );
  } else if (paketKhusus === 'Paket 12 Jam') {
    basePrice = (hargaPerHari * lamaSewaHari) + hargaPaket12Jam;
    totalPemasukan = basePrice + biayaTambahanJam;
    calculatedReturnIso = calculateEstimatedReturnWithHours(
      new Date(waktuStartSewa).toISOString(),
      lamaSewaHari,
      12 + tambahanJam
    );
  } else {
    basePrice = hargaPerHari * lamaSewaHari;
    totalPemasukan = basePrice + biayaTambahanJam;
    calculatedReturnIso = calculateEstimatedReturnWithHours(
      new Date(waktuStartSewa).toISOString(),
      lamaSewaHari,
      tambahanJam
    );
  }

  const calculatedDay = getIndonesianDay(new Date(waktuStartSewa));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaPenyewa.trim()) return alert('Silakan isi Nama Lengkap Anda.');
    if (!whatsapp.trim()) return alert('Silakan isi Nomor WhatsApp Anda.');
    if (!alamatAsalKos.trim()) return alert('Silakan isi Alamat Kos atau Domisili Anda di Malang.');
    if (isCustomIdentitas && !customIdentitasText.trim()) {
      return alert('Silakan tuliskan identitas yang Anda jaminkan.');
    }
    if (!agreedTerms) {
      return alert('Harap menyetujui syarat & ketentuan sewa sebelum mengirim.');
    }

    const finalIdentitas = isCustomIdentitas 
      ? customIdentitasText.trim() 
      : identitasDijaminkan;

    const newId = `TRX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const paket12Note = paketKhusus === 'Paket 12 Jam'
      ? ` [Paket 12 Jam: ${hargaPaket12Jam > 0 ? formatRupiah(hargaPaket12Jam) : 'Harga Opsional Rp 0'}]`
      : '';

    const newTrx: TransaksiSewa = {
      id: newId,
      namaPenyewa: namaPenyewa.trim(),
      whatsapp: whatsapp.trim().replace(/^0/, '62'),
      alamatAsalKos: alamatAsalKos.trim(),
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
        : hargaPerHari,
      totalPemasukan,
      statusBayar: 'Belum Bayar',
      metodePembayaran,
      statusUnit: 'Booking',
      jumlahHelm,
      levelBensin: bensinAwal as '1 Kotak' | '2 Kotak' | '3 Kotak' | '4 Kotak' | '5 Kotak' | 'Full Kotak',
      catatanJaminanTambahan: `${jumlahHelm === '0' ? '0 Helm (Bawa Sendiri)' : `${jumlahHelm} Helm SNI`}, Bensin: ${bensinAwal}, Bayar: ${metodePembayaran}${paketKhusus === 'Per Jam' ? ` [Sewa Per Jam: ${durasiJam} Jam]` : ''}${paket12Note}${tambahanJam > 0 && paketKhusus !== 'Per Jam' ? ` [Tambahan ${tambahanJam} Jam: +${formatRupiah(biayaTambahanJam)}]` : ''} (Order Mandiri HP)${catatanKhusus.trim() ? ` - ${catatanKhusus.trim()}` : ''}`
    };

    onBookingSubmit(newTrx);
    setSubmittedTrx(newTrx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateCustomerWAMessage = (trx: TransaksiSewa): string => {
    const bike = fleet.find(b => b.nopol === trx.nopolMotor);
    const bikeName = bike ? `${bike.namaUnit} (${bike.tipeMotor} - ${bike.nopol})` : trx.nopolMotor;
    const startFmt = formatIndonesianDateTime(trx.waktuStartSewa);
    const estFmt = formatIndonesianDateTime(trx.estWaktuKembali);
    const totalFmt = formatRupiah(trx.totalPemasukan);
    const helmDesc = jumlahHelm === '0' ? '0 Helm (Bawa Sendiri)' : `${jumlahHelm} Helm SNI`;
    const metodeDesc = getPaymentMethodLabel(trx.metodePembayaran || 'Tunai');

    let durasiText = `${trx.lamaSewaHari} Hari`;
    if (trx.paketKhusus === 'Per Jam') {
      durasiText = `Sewa Per Jam (${trx.durasiJam || 1} Jam)`;
    } else if (trx.paketKhusus === 'Paket 12 Jam') {
      const hariPart = trx.lamaSewaHari > 0 ? `${trx.lamaSewaHari} Hari + ` : '0 Hari / ';
      const harga12Part = typeof trx.hargaPaket12Jam === 'number' && trx.hargaPaket12Jam > 0
        ? ` (${formatRupiah(trx.hargaPaket12Jam)})`
        : ' (Harga Opsional)';
      durasiText = `${hariPart}Paket 12 Jam${harga12Part}${trx.tambahanJam ? ` + ${trx.tambahanJam} Jam` : ''}`;
    } else if (trx.tambahanJam && trx.tambahanJam > 0) {
      durasiText = `${trx.lamaSewaHari} Hari + Tambahan ${trx.tambahanJam} Jam`;
    }

    return `Halo Admin Ai Rent! 🛵
Saya baru saja mengisi formulir pemesanan sewa motor mandiri:

📋 *DETAIL PESANAN MANDIRI*
• No. Booking: *${trx.id}*
• Nama Penyewa: *${trx.namaPenyewa}*
• WhatsApp: +${trx.whatsapp.replace(/\D/g, '')}
• Alamat / Kos: ${trx.alamatAsalKos}
• Identitas Jaminan: *${trx.identitasDijaminkan}*
• Kategori: ${trx.kategoriPelanggan}

🏍️ *UNIT & WAKTU SEWA*
• Unit Motor: *${bikeName}*
• Waktu Mulai: ${startFmt} (${trx.hariSewa})
• Durasi: *${durasiText}*
• Estimasi Selesai: ${estFmt}
• Total Estimasi: *${totalFmt}*
• Metode Pembayaran: *${metodeDesc}*
• Kelengkapan: ${helmDesc} & Bensin: ${bensinAwal}

Mohon konfirmasi ketersediaan unit dan pengambilan kuncinya. Terima kasih! 🙏`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
                <span>Ai Rent</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded font-normal">
                  Resmi
                </span>
              </div>
              <div className="text-[10px] text-cyan-400">
                Form Pemesanan Sewa Mandiri
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton defaultAppMode="booking" label="Install App" />
            <a
              href={`https://wa.me/${RENTAL_CUSTOMER_HOTLINE}?text=${encodeURIComponent('Halo Admin Ai Rent, saya ingin bertanya seputar sewa motor.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 hover:bg-emerald-900 transition-colors text-[11px] font-semibold"
              title="Hotline WhatsApp CS Ai Rent"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>CS WhatsApp</span>
            </a>
          </div>
        </div>
      </header>
      <OfflineIndicator />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-5">
        
        {submittedTrx ? (
          /* Confirmation Success Screen */
          <div className="space-y-5 animate-fadeIn">
            
            <div className="bg-gradient-to-b from-emerald-950/70 to-slate-900 border border-emerald-700/60 rounded-2xl p-5 text-center space-y-3 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                  Pesanan Berhasil Dicatat
                </span>
                <h2 className="text-xl font-black text-white mt-2">
                  Terima Kasih, Kak {submittedTrx.namaPenyewa}!
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Nomor Booking: <strong className="text-cyan-400 font-mono">{submittedTrx.id}</strong>
                </p>
              </div>

              {/* Primary Forward WhatsApp Button */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/${RENTAL_CUSTOMER_HOTLINE}?text=${encodeURIComponent(generateCustomerWAMessage(submittedTrx))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-950"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim Konfirmasi ke WA Admin</span>
                </a>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Ketuk tombol di atas untuk meneruskan rincian pesanan ke WhatsApp Admin Ai Rent.
                </p>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs shadow-md">
              <div className="font-bold text-white text-xs uppercase tracking-wider text-cyan-400 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Ringkasan Booking Anda</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                  Status: Booking
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Motor:</span>
                  <span className="font-semibold text-white">{selectedBike.namaUnit} ({selectedBike.nopol})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Ambil:</span>
                  <span className="font-medium text-white">{formatIndonesianDateTime(submittedTrx.waktuStartSewa)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Durasi Sewa:</span>
                  <span className="font-medium text-white">
                    {submittedTrx.paketKhusus === 'Per Jam'
                      ? `Sewa Per Jam (${submittedTrx.durasiJam || 1} Jam)`
                      : submittedTrx.paketKhusus === 'Paket 12 Jam'
                      ? `${submittedTrx.lamaSewaHari} Hari + Paket 12 Jam${submittedTrx.tambahanJam ? ` + ${submittedTrx.tambahanJam} Jam` : ''}`
                      : `${submittedTrx.lamaSewaHari} Hari${submittedTrx.tambahanJam ? ` + ${submittedTrx.tambahanJam} Jam` : ''}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimasi Kembali:</span>
                  <span className="font-medium text-white">{formatIndonesianDateTime(submittedTrx.estWaktuKembali)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Identitas Jaminan:</span>
                  <span className="font-semibold text-cyan-300">{submittedTrx.identitasDijaminkan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fasilitas:</span>
                  <span className="text-slate-200">{jumlahHelm === '0' ? '0 Helm (Bawa Sendiri)' : `${jumlahHelm} Helm SNI`} &amp; Bensin: {bensinAwal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metode Pembayaran:</span>
                  <span className="font-semibold text-emerald-400">{submittedTrx.metodePembayaran || 'Tunai'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                  <span className="text-white">Estimasi Biaya:</span>
                  <span className="text-cyan-400 font-mono">{formatRupiah(submittedTrx.totalPemasukan)}</span>
                </div>
              </div>

              {/* Payment Instruction on Confirmation Screen */}
              {submittedTrx.metodePembayaran === 'Transfer BRI' && (
                <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/80 space-y-2 mt-2">
                  <div className="text-[11px] font-bold text-cyan-300 flex items-center justify-between">
                    <span>🏦 Rekening Transfer BRI Resmi:</span>
                    <span className="font-mono text-white">{PAYMENT_BRI_ACCOUNT}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    a.n. <strong className="text-white">{PAYMENT_BRI_HOLDER}</strong> (BRI)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(PAYMENT_BRI_ACCOUNT);
                      setCopiedBri(true);
                      setTimeout(() => setCopiedBri(false), 2000);
                    }}
                    className="w-full py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    {copiedBri ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBri ? 'Nomor Rekening Tersalin!' : 'Salin Nomor Rekening BRI'}</span>
                  </button>
                </div>
              )}

              {submittedTrx.metodePembayaran === 'QRIS' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/70 space-y-2.5 mt-2 text-center">
                  <div className="text-[11px] font-bold text-amber-300">
                    📱 Scan QRIS Resmi ({PAYMENT_QRIS_MERCHANT})
                  </div>
                  <div 
                    onClick={() => setShowQrisZoom(true)}
                    className="bg-white p-2 rounded-xl inline-block border-2 border-amber-400 cursor-pointer"
                  >
                    <img
                      src={PAYMENT_QRIS_IMAGE}
                      alt="QRIS AI RENT FOOD GROUP"
                      className="w-48 h-60 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Ketuk gambar QRIS untuk memperbesar layar penuh
                  </div>
                </div>
              )}
            </div>

            {/* Next Steps Guide */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Langkah Selanjutnya:</span>
              </div>
              <ul className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Tunjukkan layar ini atau chat WhatsApp ke petugas saat di lokasi.</li>
                <li>Serahkan identitas jaminan fisik asli (<strong>{submittedTrx.identitasDijaminkan}</strong>).</li>
                <li>Lakukan pengecekan fisik unit motor bersama petugas.</li>
                <li>Ambil kunci kontak &amp; helm SNI siap berkendara bersama Ai Rent!</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setSubmittedTrx(null);
                setAgreedTerms(false);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition-colors"
            >
              ← Buat Pesanan Baru Lainnya
            </button>

          </div>
        ) : (
          /* Form Input */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Intro Hero Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/40 space-y-1">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pesan Cepat Dari Handphone · Ai Rent</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Lengkapi formulir di bawah ini untuk sewa motor per jam (&lt; 12 jam) atau harian. Unit siap disiapkan dengan 0/1/2 Helm SNI &amp; Bensin.
              </p>
            </div>

            {/* Section 1: Tenant Information */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <User className="w-3.5 h-3.5" />
                <span>1. Data Diri Penyewa</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Lengkap Penyewa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dimas Arya Pratama"
                  value={namaPenyewa}
                  onChange={e => setNamaPenyewa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nomor WhatsApp / HP *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 081234567890"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alamat Kos / Domisili / Hotel di Malang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kos Sigura-gura Gg 3 / Hotel Santika Malang"
                  value={alamatAsalKos}
                  onChange={e => setAlamatAsalKos(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kategori Pelanggan
                  </label>
                  <select
                    value={kategoriPelanggan}
                    onChange={e => setKategoriPelanggan(e.target.value as CustomerCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-cyan-500 outline-none"
                  >
                    <option value="Mhs Malang">Mhs Malang (Diskon Khusus)</option>
                    <option value="Luar Malang / Wisatawan">Wisatawan / Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-cyan-500 outline-none"
                  >
                    <option value="KTM dan KTP">KTM dan KTP</option>
                    <option value="KTP Asli">KTP Asli</option>
                    <option value="KTM (Kartu Tanda Mahasiswa)">KTM (Kartu Tanda Mahasiswa)</option>
                    <option value="SIM C + KTP">SIM C + KTP</option>
                    <option value="Paspor / KITAS">Paspor / KITAS</option>
                    <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
                  </select>
                </div>
              </div>

              {isCustomIdentitas && (
                <div className="pt-1">
                  <label className="block text-cyan-400 text-[11px] font-semibold mb-1">
                    ✍️ Tuliskan Identitas Jaminan Anda: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SIM A / Ijazah Asli / Kartu Keluarga / BPJS"
                    value={customIdentitasText}
                    onChange={e => setCustomIdentitasText(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Section 2: Unit Motor & Schedule */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Bike className="w-3.5 h-3.5" />
                <span>2. Pilihan Motor &amp; Waktu Sewa</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Unit Motor Armada Ai Rent *
                </label>
                <select
                  value={nopolMotor}
                  onChange={e => setNopolMotor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-cyan-500 outline-none font-medium"
                >
                  {fleet.map(b => (
                    <option key={b.nopol} value={b.nopol}>
                      {b.namaUnit} ({b.tipeMotor}) - {b.nopol} [{b.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Paket Sewa */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaketKhusus('Per Jam')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    paketKhusus === 'Per Jam'
                      ? 'bg-emerald-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⏱️ Per Jam (&lt;12j)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaketKhusus('Paket 12 Jam');
                    if (lamaSewaHari === 1) {
                      setLamaSewaHariInput('0');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    paketKhusus === 'Paket 12 Jam'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🌗 Paket 12 Jam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaketKhusus('Harian');
                    if (lamaSewaHari === 0) {
                      setLamaSewaHariInput('1');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    paketKhusus === 'Harian'
                      ? 'bg-cyan-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📅 Harian (24j)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Waktu &amp; Jam Mulai Sewa *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={waktuStartSewa}
                    onChange={e => setWaktuStartSewa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                {paketKhusus === 'Per Jam' ? (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>⏱️ Durasi Jam (Min. 1 Jam) *</span>
                      <span className="text-emerald-400 font-mono font-bold text-[11px]">
                        {formatRupiah(ratePerJam)}
                      </span>
                    </label>
                    <select
                      value={durasiJam}
                      onChange={e => setDurasiJam(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
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
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-semibold">
                        Lama Sewa (Hari)
                      </label>
                      <button
                        type="button"
                        onClick={() => setLamaSewaHariInput('0')}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
                    />
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {[0, 1, 2, 3, 4, 5].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setLamaSewaHariInput(String(d))}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors ${
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
                )}
              </div>

              {/* Panel Paket 12 Jam (Harga Opsional) */}
              {paketKhusus !== 'Per Jam' && (
                <div className={`p-3 rounded-xl border space-y-2 ${
                  paketKhusus === 'Paket 12 Jam'
                    ? 'bg-amber-950/30 border-amber-500/60'
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPaketKhusus(paketKhusus === 'Paket 12 Jam' ? 'Harian' : 'Paket 12 Jam')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        paketKhusus === 'Paket 12 Jam'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {paketKhusus === 'Paket 12 Jam' ? '✓ Paket 12 Jam Aktif' : '🌗 Aktifkan Paket 12 Jam'}
                    </button>
                    <span className="text-[10px] font-mono text-amber-300">
                      {hargaPaket12Jam > 0 ? formatRupiah(hargaPaket12Jam) : 'Harga Opsional'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-1">
                      Harga Paket 12 Jam (Rp) — <span className="text-amber-300">Opsional</span>:
                    </label>
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
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-1.5 text-white outline-none font-mono text-xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: 'Rp 0 (Opsional)', val: '' },
                        { label: '30rb', val: '30000' },
                        { label: '35rb', val: '35000' },
                        { label: '40rb', val: '40000' },
                        { label: '45rb', val: '45000' },
                        { label: '50rb', val: '50000' },
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setPaketKhusus('Paket 12 Jam');
                            setHargaPaket12JamInput(p.val);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                            paketKhusus === 'Paket 12 Jam' && hargaPaket12JamInput === p.val
                              ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tambahan Jam Per Jam (untuk Sewa Harian / Paket 12 Jam) */}
              {paketKhusus !== 'Per Jam' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>⏱️ Tambahan Lama Sewa Per Jam (Opsional):</span>
                    {tambahanJam > 0 && (
                      <span className="text-cyan-400 font-mono font-bold text-[11px]">
                        +{formatRupiah(biayaTambahanJam)}
                      </span>
                    )}
                  </label>
                  <select
                    value={tambahanJam}
                    onChange={e => setTambahanJam(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value={0}>0 Jam (Tepat Waktu - Rp 0)</option>
                    <option value={1}>1 Jam (+Rp 10.000)</option>
                    <option value={2}>2 Jam (+Rp 15.000)</option>
                    <option value={3}>3 Jam (+Rp 20.000)</option>
                    <option value={4}>4 Jam (+Rp 25.000)</option>
                    <option value={5}>5 Jam (+Rp 30.000)</option>
                    <option value={6}>6 Jam (+Rp 35.000)</option>
                    <option value={7}>7 Jam (+Rp 40.000)</option>
                  </select>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Aturan: 1 jam Rp 10.000, di atas 1 jam kelipatan Rp 5.000/jam.
                  </div>
                </div>
              )}

              {/* Live Return Estimate & Rate Banner */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Estimasi Pengembalian:</span>
                  </span>
                  <span className="font-semibold text-white">
                    {formatIndonesianDateTime(calculatedReturnIso)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-t border-slate-850 pt-1.5">
                  <span>
                    Estimasi Biaya (
                    {paketKhusus === 'Per Jam'
                      ? `Sewa Per Jam (${durasiJam} Jam)`
                      : paketKhusus === 'Paket 12 Jam'
                      ? `${lamaSewaHari} Hari + Paket 12 Jam`
                      : `${lamaSewaHari} Hari`}
                    {tambahanJam > 0 && paketKhusus !== 'Per Jam' ? ` + ${tambahanJam} Jam` : ''}
                    ):
                  </span>
                  <span className="text-cyan-400 font-bold font-mono text-sm">
                    {formatRupiah(totalPemasukan)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Facilities Included */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>3. Fasilitas Sewa Termasuk</span>
                <span className="text-[10px] text-emerald-400 font-normal">Gratis</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-[11px] text-slate-300 font-semibold block">
                    🪖 Jumlah Helm (0/1/2)
                  </label>
                  <select
                    value={jumlahHelm}
                    onChange={e => setJumlahHelm(e.target.value as '0' | '1' | '2')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="2">2 Helm SNI</option>
                    <option value="1">1 Helm SNI</option>
                    <option value="0">0 Helm (Bawa Sendiri)</option>
                  </select>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-[11px] text-slate-300 font-semibold block">
                    ⛽ Bensin Awal (Kotak)
                  </label>
                  <select
                    value={bensinAwal}
                    onChange={e => setBensinAwal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500 font-medium"
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

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Catatan Permintaan Khusus (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Minta helm bogo / ambil jam 07.30 pagi"
                  value={catatanKhusus}
                  onChange={e => setCatatanKhusus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Section 4: Metode Pembayaran (3 Opsi) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>4. Metode Pembayaran (3 Opsi)</span>
                <span className="text-[10px] font-mono text-emerald-400">{metodePembayaran}</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {/* 1. Tunai */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('Tunai')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    metodePembayaran === 'Tunai'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${metodePembayaran === 'Tunai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">1. Tunai (Cash)</div>
                      <div className="text-[10px] text-slate-400">Bayar tunai langsung saat ambil motor</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    metodePembayaran === 'Tunai' ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-700'
                  }`}>
                    {metodePembayaran === 'Tunai' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                {/* 2. Transfer BRI */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('Transfer BRI')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    metodePembayaran === 'Transfer BRI'
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${metodePembayaran === 'Transfer BRI' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-500'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">2. Transfer BRI</div>
                      <div className="text-[11px] font-mono font-bold text-cyan-300">{PAYMENT_BRI_ACCOUNT}</div>
                      <div className="text-[10px] text-slate-300">An ({PAYMENT_BRI_HOLDER}) BRI</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    metodePembayaran === 'Transfer BRI' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700'
                  }`}>
                    {metodePembayaran === 'Transfer BRI' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                {/* 3. QRIS */}
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('QRIS')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    metodePembayaran === 'QRIS'
                      ? 'bg-amber-950/60 border-amber-400 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${metodePembayaran === 'QRIS' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-500'}`}>
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">3. QRIS ({PAYMENT_QRIS_MERCHANT})</div>
                      <div className="text-[10px] text-slate-300">Scan QRIS semua Bank &amp; E-Wallet (NMID: {PAYMENT_QRIS_NMID})</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    metodePembayaran === 'QRIS' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'
                  }`}>
                    {metodePembayaran === 'QRIS' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              </div>

              {/* Detail Box if Transfer BRI selected */}
              {metodePembayaran === 'Transfer BRI' && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-cyan-300 font-bold">Nomor Rekening BRI</div>
                      <div className="text-sm font-mono font-black text-white">{PAYMENT_BRI_ACCOUNT}</div>
                      <div className="text-[11px] text-slate-200">An (<strong>{PAYMENT_BRI_HOLDER}</strong>) BRI</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(PAYMENT_BRI_ACCOUNT);
                        setCopiedBri(true);
                        setTimeout(() => setCopiedBri(false), 2000);
                      }}
                      className="px-3 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      {copiedBri ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBri ? 'Tersalin!' : 'Salin Rek'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Detail Box if QRIS selected */}
              {metodePembayaran === 'QRIS' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-amber-700/70 text-center space-y-2.5">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS {PAYMENT_QRIS_MERCHANT}</span>
                  </div>
                  <div 
                    onClick={() => setShowQrisZoom(true)}
                    className="bg-white p-2 rounded-xl inline-block border-2 border-amber-400 cursor-pointer shadow-lg"
                  >
                    <img
                      src={PAYMENT_QRIS_IMAGE}
                      alt="QRIS AI RENT FOOD GROUP"
                      className="w-48 h-60 object-contain mx-auto rounded"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowQrisZoom(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px]"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Perbesar QRIS Layar Penuh</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Terms & Conditions Agreement */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>5. Syarat &amp; Ketentuan Sewa Motor</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                <div>1. Harap mengembalikan unit tepat waktu sesuai estimasi.</div>
                <div>2. Dilarang memindahtangankan unit sewa ke pihak lain tanpa izin.</div>
                <div className="text-amber-300 font-medium">
                  3. Membawa motor keluar kota tanpa izin, membawa ke area terlarang dan bonceng 3 dikenakan denda Rp 250.000.
                </div>
                <div>4. Jaminan identitas akan dikembalikan saat unit selesai diperiksa bersama kelengkapan (helm).</div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-[11px] text-slate-200">
                  Saya telah membaca dan menyetujui seluruh syarat &amp; ketentuan sewa motor di atas.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!agreedTerms}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                agreedTerms
                  ? 'bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 text-slate-950 shadow-cyan-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pesanan Sewa Motor Sekarang</span>
            </button>

          </form>
        )}

      </main>

      {/* Mobile Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-500">
        <div>© {new Date().getFullYear()} Ai Rent · Sistem Sewa Motor Mandiri</div>
        <div>Hotline CS WhatsApp: {RENTAL_CS_DISPLAY}</div>
      </footer>

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
                <div className="text-[10px] font-mono text-slate-500">NMID: {PAYMENT_QRIS_NMID}</div>
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
              Total Estimasi: <span className="font-mono text-sm text-emerald-700">{formatRupiah(submittedTrx ? submittedTrx.totalPemasukan : totalPemasukan)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
