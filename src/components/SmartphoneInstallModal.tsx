import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  Check,
  Copy,
  Share2,
  X,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  MoreVertical,
  PlusSquare,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getPublicAppBaseUrl } from '../utils/formatters';

interface SmartphoneInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAppMode?: 'admin' | 'booking' | 'investor';
}

export const SmartphoneInstallModal: React.FC<SmartphoneInstallModalProps> = ({
  isOpen,
  onClose,
  defaultAppMode = 'admin',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [selectedMode, setSelectedMode] = useState<'admin' | 'booking' | 'investor'>(defaultAppMode);
  const [activeOSGuide, setActiveOSGuide] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    setSelectedMode(defaultAppMode);
  }, [defaultAppMode]);

  useEffect(() => {
    if (isIOS) setActiveOSGuide('ios');
    else if (isAndroid) setActiveOSGuide('android');
  }, [isIOS, isAndroid]);

  const baseUrl = getPublicAppBaseUrl();
  const targetUrl =
    selectedMode === 'booking'
      ? `${baseUrl}/?mode=booking`
      : selectedMode === 'investor'
      ? `${baseUrl}/?view=investor`
      : `${baseUrl}/`;

  const modeTitle =
    selectedMode === 'booking'
      ? 'Aplikasi Pesan Mandiri Pelanggan'
      : selectedMode === 'investor'
      ? 'Aplikasi Portal Laporan Investor'
      : 'Aplikasi Dashboard Admin Ai Rent';

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(targetUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation failed', err));
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    const accepted = await install();
    if (accepted) {
      setInstallSuccess(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    `🛵 *INSTALL APLIKASI AI RENT DI SMARTPHONE*\n\nKlik tautan publik berikut di HP Android (Chrome) atau iPhone (Safari) untuk membuka dan meng-install *${modeTitle}* ke Layar Utama HP:\n👉 ${targetUrl}\n\n📌 *Cara Install ke Home Screen HP:*\n• *Android (Chrome)*: Klik menu titik tiga (⋮) di kanan atas lalu pilih *"Install Aplikasi"* atau *"Tambahkan ke Layar Utama"*.\n• *iPhone (Safari)*: Klik tombol *Share* di bawah lalu pilih *"Tambah ke Layar Utama (Add to Home Screen)"*.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Install Aplikasi di Smartphone (Android &amp; iOS)
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="w-3 h-3" /> PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pasang Ai Rent di layar utama HP tanpa perlu lewat Play Store / App Store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Status Banner if Installed or Direct Install Available */}
          {isInstalled || installSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-300">
                  Aplikasi Ai Rent Sudah Ter-install di Perangkat Ini!
                </div>
                <p className="text-xs text-slate-300">
                  Anda dapat membuka aplikasi langsung dari ikon <strong>Ai Rent</strong> di Layar Utama (Home Screen) HP Anda.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/80 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Siap Di-install Langsung (1-Klik)
                </div>
                <p className="text-xs text-slate-300">
                  Browser Anda mendukung instalasi langsung ke layar utama smartphone/perangkat ini.
                </p>
              </div>
              <button
                onClick={handleDirectInstall}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Aplikasi Sekarang</span>
              </button>
            </div>
          ) : null}

          {/* Step 1: Pilih Mode Aplikasi yang Ingin Di-install */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              1. Pilih Mode Aplikasi untuk Smartphone:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMode('admin')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMode === 'admin'
                    ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-cyan-300">🛠️ Dashboard Admin</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Kelola 13 armada, transaksi, tarif &amp; keuangan penuh
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('booking')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMode === 'booking'
                    ? 'bg-emerald-950/50 border-emerald-400 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-emerald-300">🛵 Form Pesan Mandiri</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Aplikasi khusus pelanggan pesan motor dari HP
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('investor')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMode === 'investor'
                    ? 'bg-amber-950/50 border-amber-400 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-amber-300">📊 Portal Investor</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Pantau laporan laba bersih &amp; bagi hasil real-time
                </div>
              </button>
            </div>
          </div>

          {/* Main Grid: Left QR Scan for Smartphone + Right Step-by-step OS Guide */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Left Column: QR Code & Public Link */}
            <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Globe className="w-3 h-3" /> Link Publik Aktif
                </span>
                <h3 className="text-sm font-bold text-white">{modeTitle}</h3>
                <p className="text-[11px] text-slate-400">
                  Scan dengan kamera HP untuk membuka &amp; install aplikasi di smartphone:
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-cyan-500/30">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Install Smartphone"
                    className="w-40 h-40 object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                    Memuat QR...
                  </div>
                )}
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={targetUrl}
                    className="w-full bg-transparent text-[11px] font-mono text-cyan-300 px-2 focus:outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                      copied
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={whatsappShareHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Kirim ke WA</span>
                  </a>
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Buka Tab Baru</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Step-by-Step Instructions for Android & iPhone */}
            <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Panduan Install di Layar Utama HP:
                  </span>
                </div>

                {/* OS Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveOSGuide('android')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeOSGuide === 'android'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🤖 HP Android (Chrome)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOSGuide('ios')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeOSGuide === 'ios'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🍎 iPhone / iPad (Safari)
                  </button>
                </div>

                {activeOSGuide === 'android' ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Buka tautan publik di atas menggunakan aplikasi <strong>Google Chrome</strong> di HP Android Anda (bisa lewat Scan QR atau klik dari WhatsApp).
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Ketuk tombol <strong>&ldquo;Install Aplikasi&rdquo;</strong> di bagian atas halaman, atau ketuk ikon <strong>Titik Tiga (⋮)</strong> <MoreVertical className="w-3.5 h-3.5 inline text-cyan-400" /> di pojok kanan atas browser Chrome.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Pilih menu <strong>&ldquo;Install aplikasi&rdquo; (Install app)</strong> atau <strong>&ldquo;Tambahkan ke layar utama&rdquo; (Add to Home screen)</strong> lalu konfirmasi <strong>Install</strong>.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Buka tautan publik di atas menggunakan browser <strong>Safari</strong> di iPhone atau iPad Anda.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Ketuk ikon <strong>Share / Bagikan</strong> <Share2 className="w-3.5 h-3.5 inline text-cyan-400" /> pada bilah navigasi bawah Safari.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Gulir ke bawah dan pilih <strong>&ldquo;Tambah ke Layar Utama&rdquo; (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" /> kemudian ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-2.5 text-[11px] text-slate-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Aplikasi berjalan <strong>Layar Penuh (Standalone)</strong> seperti aplikasi native, hemat kuota, dan mendukung penyimpanan cache offline.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            🛵 <strong>Ai Rent</strong> · Progressive Web App (Android &amp; iOS)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
