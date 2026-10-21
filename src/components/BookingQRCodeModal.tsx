import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Printer, 
  X, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  Globe,
  Share2,
  RefreshCw
} from 'lucide-react';
import { getPublicAppBaseUrl } from '../utils/formatters';

interface BookingQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMobilePreview?: () => void;
}

export const BookingQRCodeModal: React.FC<BookingQRCodeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'qr' | 'standee'>('qr');
  
  // Default URL uses the Public Shared App URL (ais-pre) so anyone with the link can open it
  const defaultUrl = `${getPublicAppBaseUrl()}?mode=booking`;

  const [bookingUrl, setBookingUrl] = useState<string>(defaultUrl);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    const livePublicUrl = `${getPublicAppBaseUrl()}?mode=booking`;
    setBookingUrl(livePublicUrl);
  }, [isOpen]);

  // Generate QR Code image when bookingUrl changes
  useEffect(() => {
    if (!bookingUrl) return;

    QRCode.toDataURL(bookingUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#030712', // Deep slate-950 for high contrast
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR Code', err);
      });
  }, [bookingUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Code_Booking_Ai_Rent_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppPublicBookingShare = () => {
    const text = `Halo Kak! 🛵
Silakan isi formulir pemesanan sewa motor *Ai Rent* secara mandiri melalui link publik resmi berikut:

🔗 ${bookingUrl}

✅ *Akses Publik*: Siapa saja yang memiliki link ini dapat langsung membukanya dari HP tanpa login.
✅ Pilih motor, durasi sewa (per jam / harian), serta metode pembayaran (Tunai / Transfer BRI / QRIS).

Terima kasih! 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      
      {/* Print Specific CSS for Standee */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-standee, #printable-qr-standee * {
            visibility: visible !important;
          }
          #printable-qr-standee {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 30px !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>QR &amp; Link Publik Pesanan Mandiri</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Akses Publik (Siapa Saja Bisa Buka)</span>
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Siapa saja yang memiliki link atau memindai QR ini dapat langsung mengisi form sewa mandiri (tanpa menu Dashboard Admin).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 pt-3 pb-0 flex items-center justify-between border-b border-slate-800/80 bg-slate-900 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('qr')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeView === 'qr'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Kode QR &amp; Link Publik
            </button>
            <button
              onClick={() => setActiveView('standee')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeView === 'standee'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Poster Meja Siap Cetak (Standee)</span>
            </button>
          </div>

          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline pb-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Form Publik</span>
          </a>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {activeView === 'qr' ? (
            <div className="space-y-5">
              
              {/* Public Access Status Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-2.5 text-xs">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-300">
                    Link Publik Aktif — Siapa Saja yang Memiliki Akses Bisa Membukanya
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Tautan di bawah menggunakan domain publik resmi sehingga pelanggan dapat langsung membukanya dari HP mana pun tanpa login, dan tombol Dashboard Admin telah dihapus dari tampilan pelanggan.
                  </div>
                </div>
              </div>

              {/* QR Centerpiece Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-4 shadow-inner">
                
                {/* QR Code Canvas/Image */}
                <div className="relative p-3.5 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/20 max-w-[240px] sm:max-w-[260px] mx-auto group">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="QR Code Booking Ai Rent" 
                      className="w-full h-auto rounded-lg block"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                  )}

                  {/* Ai Rent Brand Stamp in QR */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-950 text-cyan-400 border border-cyan-500 font-bold px-2 py-0.5 rounded text-[10px] shadow-lg">
                      🛵 Ai Rent
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Arahkan Kamera HP ke QR Code Publik</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Kamera HP penyewa akan langsung membuka formulir sewa motor resmi Ai Rent tanpa perlu login dan tanpa akses ke halaman Admin.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Unduh Gambar QR (.PNG)</span>
                  </button>

                  <button
                    onClick={() => setActiveView('standee')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Format Siap Cetak (Standee)</span>
                  </button>

                  <a
                    href={generateWhatsAppPublicBookingShare()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Bagikan Link via WA</span>
                  </a>

                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Buka Link Publik</span>
                  </a>
                </div>
              </div>

              {/* Target Link Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tautan Publik Form Pemesanan Mandiri (Siapa Saja Bisa Buka):</span>
                  </label>
                  <button
                    onClick={() => setIsCustomizing(!isCustomizing)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {isCustomizing ? 'Selesai Kustomisasi' : 'Ubah URL / Link Kustom'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly={!isCustomizing}
                    value={bookingUrl}
                    onChange={e => setBookingUrl(e.target.value)}
                    className={`flex-1 bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono outline-none ${
                      isCustomizing 
                        ? 'border-cyan-500 text-cyan-300' 
                        : 'border-slate-800 text-emerald-300'
                    }`}
                  />

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold shrink-0 transition-colors"
                    title="Salin Link Publik"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Link Publik'}</span>
                  </button>

                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg shrink-0 transition-colors"
                    title="Buka Link di Tab Baru"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {isCustomizing && (
                  <p className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                    💡 Anda dapat mengganti tautan di atas jika ingin mengarahkan penyewa ke domain khusus, Google Form, atau link WhatsApp tertentu. QR Code otomatis diperbarui secara instan.
                  </p>
                )}
              </div>

              {/* Step instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-center font-bold text-[11px] leading-5">
                    1
                  </div>
                  <div className="font-semibold text-white">Scan dari Kamera HP</div>
                  <div className="text-[11px] text-slate-400">
                    Penyewa membuka kamera smartphone atau Google Lens lalu memindai kode QR di meja kasir.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-center font-bold text-[11px] leading-5">
                    2
                  </div>
                  <div className="font-semibold text-white">Isi Formulir Mandiri</div>
                  <div className="text-[11px] text-slate-400">
                    Penyewa mengisi nama, no WA, identitas jaminan (KTM, KTP, dll), durasi, dan memilih motor.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-center font-bold text-[11px] leading-5">
                    3
                  </div>
                  <div className="font-semibold text-white">Konfirmasi &amp; Ambil Unit</div>
                  <div className="text-[11px] text-slate-400">
                    Data masuk ke sistem rental &amp; terkirim ke WhatsApp Admin untuk verifikasi kunci &amp; helm.
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Standee Printable Poster Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between no-print">
                <div className="text-xs text-slate-400">
                  Pratinjau poster meja (Standee Akrilik A5/A4). Tekan tombol cetak untuk mencetak langsung.
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Standee Ini</span>
                </button>
              </div>

              {/* Printable Standee Sheet */}
              <div 
                id="printable-qr-standee"
                className="bg-white text-slate-950 rounded-2xl p-8 border-4 border-slate-200 shadow-2xl text-center space-y-6 max-w-md mx-auto"
              >
                {/* Standee Header */}
                <div className="border-b-2 border-slate-100 pb-4 space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-cyan-800 text-xs font-bold tracking-wide uppercase">
                    <span>🛵 AI RENT</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                    SCAN UNTUK PESAN MOTOR
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Isi pesanan &amp; data sewa langsung lewat handphone Anda
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt="QR Code Standee" 
                      className="w-56 h-56 mx-auto block"
                    />
                  )}
                </div>

                {/* Step Instructions */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
                  <div className="font-bold text-slate-800 text-center text-xs pb-1 border-b border-slate-200">
                    3 Langkah Cepat Sewa Motor:
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <span className="text-slate-700">Arahkan kamera HP ke QR Code di atas</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <span className="text-slate-700">Lengkapi nama, jaminan (KTM/KTP), dan pilih motor</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <span className="text-slate-700">Tunjukkan bukti ke kasir &amp; ambil kunci motor + helm SNI</span>
                  </div>
                </div>

                {/* Facilities & Hotline Footer */}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-800">
                    ✨ Termasuk Fasilitas: 0 / 1 / 2 Helm SNI &amp; Bensin (1-5/Full Kotak)
                  </div>
                  <div className="text-[10px] text-slate-600">
                    💳 Pembayaran: Tunai · Transfer BRI (603201007355508 An Ahmad imam makhali) · QRIS
                  </div>
                  <div>
                    Hotline CS WhatsApp: <strong>082245508680</strong> · Ai Rent
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 no-print">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Formulir ramah ponsel otomatis menyesuaikan layar smartphone penyewa.</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white underline text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
