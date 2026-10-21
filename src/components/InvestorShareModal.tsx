import React, { useState } from 'react';
import { 
  Lock, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  X, 
  KeyRound, 
  ShieldCheck, 
  Globe
} from 'lucide-react';
import { getPublicAppBaseUrl } from '../utils/formatters';

interface InvestorShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInvestorPortal: () => void;
}

export const InvestorShareModal: React.FC<InvestorShareModalProps> = ({
  isOpen,
  onClose,
  onOpenInvestorPortal
}) => {
  const [pin, setPin] = useState<string>(() => {
    return localStorage.getItem('motorent_investor_pin') || '2026';
  });
  const [newPin, setNewPin] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedPublicAppLink, setCopiedPublicAppLink] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [requirePinOnLink, setRequirePinOnLink] = useState<boolean>(false);

  // Use Public Shared App URL (ais-pre) so anyone with the link can open it
  const baseUrl = getPublicAppBaseUrl();

  const investorUrl = requirePinOnLink
    ? `${baseUrl}?view=investor&requirePin=1`
    : `${baseUrl}?view=investor`;

  const publicMainAppUrl = baseUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(investorUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPublicAppLink = () => {
    navigator.clipboard.writeText(publicMainAppUrl);
    setCopiedPublicAppLink(true);
    setTimeout(() => setCopiedPublicAppLink(false), 2500);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) return;
    setPin(newPin.trim());
    localStorage.setItem('motorent_investor_pin', newPin.trim());
    setIsChangingPin(false);
    setNewPin('');
  };

  const generateWhatsAppShareLink = () => {
    const text = `Halo Bapak/Ibu Investor Ai Rent! 🤝

Berikut adalah link publik resmi untuk mengakses *Laporan Keuangan & Pembagian Laba (Investor Portal)*:
🔗 ${investorUrl}

${requirePinOnLink ? `🔑 *PIN Akses Keamanan*: *${pin}*\n` : '✅ *Akses Publik*: Siapa saja yang memiliki link ini dapat langsung membukanya.\n'}
Dokumen ini menyajikan omset real-time, biaya operasional bengkel, laba bersih, serta simulasi bagi hasil dividen.

Terima kasih atas kemitraan dan investasi Anda! 🙏
_Manajemen Ai Rent_`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-600/60 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Link Akses Publik &amp; Portal Investor</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Publik (Siapa Saja Bisa Buka)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Siapa saja yang memiliki tautan di bawah dapat langsung membukanya dari perangkat mana pun.
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

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Highlight Info Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-800/50 space-y-1">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>Akses Publik Aktif — Siapa Saja yang Memiliki Link Bisa Membukanya</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Seluruh link di bawah menggunakan alamat publik resmi (bukan alamat privat pengembang) sehingga siapa saja yang memiliki akses link dapat langsung membukanya di HP atau laptop.
            </p>
          </div>

          {/* Public Link 1: Main App Link */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <span>🌐 1. Link Publik Aplikasi Utama Ai Rent:</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Terbuka Untuk Umum</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicMainAppUrl}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 outline-none"
              />

              <button
                onClick={handleCopyPublicAppLink}
                className="flex items-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold shrink-0 transition-colors"
              >
                {copiedPublicAppLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPublicAppLink ? 'Tersalin!' : 'Salin Link'}</span>
              </button>
            </div>
          </div>

          {/* Public Link 2: Dedicated Shareable Investor Link Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <span>📊 2. Link Publik Portal Keuangan Investor:</span>
              </label>
              
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!requirePinOnLink}
                  onChange={e => setRequirePinOnLink(!e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Langsung Buka Tanpa PIN (Publik)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={investorUrl}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 outline-none"
              />

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold shrink-0 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* PIN Security Manager */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">
                  PIN Pengaman Portal: <strong className="font-mono text-amber-300 text-sm tracking-wider">{pin}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPin}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  {copiedPin ? 'PIN Tersalin!' : 'Salin PIN'}
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => setIsChangingPin(!isChangingPin)}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  {isChangingPin ? 'Batal' : 'Ganti PIN'}
                </button>
              </div>
            </div>

            {isChangingPin && (
              <form onSubmit={handleSaveNewPin} className="pt-2 border-t border-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="PIN baru (e.g. 7788)"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="bg-slate-900 border border-amber-500/70 rounded-lg px-3 py-1.5 text-xs text-white outline-none flex-1 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Simpan PIN
                </button>
              </form>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <a
              href={generateWhatsAppShareLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan Link via WhatsApp</span>
            </a>

            <button
              onClick={() => {
                onOpenInvestorPortal();
                onClose();
              }}
              className="w-full sm:flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Portal Investor Sekarang</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Menyajikan laporan omset, biaya operasional, laba bersih, dan bagi hasil 13 motor.</span>
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
