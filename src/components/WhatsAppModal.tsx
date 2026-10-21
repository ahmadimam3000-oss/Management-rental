import React, { useState } from 'react';
import { TransaksiSewa, MotorMaster } from '../types/rental';
import { 
  generateWhatsAppMessage, 
  getWhatsAppUrl,
  PAYMENT_BRI_ACCOUNT,
  PAYMENT_BRI_HOLDER,
  PAYMENT_QRIS_IMAGE,
  PAYMENT_QRIS_MERCHANT,
  PAYMENT_QRIS_NMID,
  formatRupiah
} from '../utils/formatters';
import { X, Send, Copy, Check, QrCode, Building2 } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransaksiSewa | null;
  fleet: MotorMaster[];
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  transaction,
  fleet
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedBri, setCopiedBri] = useState(false);
  const [showQrisPreview, setShowQrisPreview] = useState(false);

  if (!isOpen || !transaction) return null;

  const bike = fleet.find(b => b.nopol === transaction.nopolMotor);
  const messageText = generateWhatsAppMessage(transaction, bike);
  const waUrl = getWhatsAppUrl(transaction.whatsapp, messageText);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBri = () => {
    navigator.clipboard.writeText(PAYMENT_BRI_ACCOUNT);
    setCopiedBri(true);
    setTimeout(() => setCopiedBri(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">📲</span>
              <span>Kirim Nota &amp; Bukti Sewa WhatsApp</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Penyewa: {transaction.namaPenyewa} (+{transaction.whatsapp}) · Metode: <strong className="text-cyan-400">{transaction.metodePembayaran || 'Tunai'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          <div className="text-slate-400 text-[11px]">
            Teks pesan otomatis diformat dengan detail penyewa, plat nomor, metode pembayaran (Tunai / BRI / QRIS), dan hotline CS:
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto select-all">
            {messageText}
          </div>

          {/* Quick Payment Reference (BRI & QRIS) */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <span className="text-[11px] font-bold text-white">Transfer BRI: </span>
                  <span className="font-mono font-bold text-cyan-300">{PAYMENT_BRI_ACCOUNT}</span>
                  <span className="text-[10px] text-slate-400 block">An ({PAYMENT_BRI_HOLDER}) BRI</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyBri}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1"
              >
                {copiedBri ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedBri ? 'Tersalin' : 'Salin BRI'}</span>
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <span className="text-[11px] font-bold text-white">QRIS Resmi: {PAYMENT_QRIS_MERCHANT}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">NMID: {PAYMENT_QRIS_NMID}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrisPreview(!showQrisPreview)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-700/60 text-[11px] font-semibold flex items-center gap-1"
              >
                <QrCode className="w-3 h-3" />
                <span>{showQrisPreview ? 'Tutup QRIS' : 'Lihat QRIS'}</span>
              </button>
            </div>

            {showQrisPreview && (
              <div className="pt-2 text-center">
                <div className="bg-white p-2.5 rounded-xl inline-block border-2 border-amber-400 shadow-lg">
                  <img
                    src={PAYMENT_QRIS_IMAGE}
                    alt="QRIS AI RENT FOOD GROUP"
                    className="w-48 h-60 object-contain mx-auto"
                  />
                  <div className="text-[11px] font-bold text-slate-900 mt-1">
                    Total: {formatRupiah(transaction.totalPemasukan)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks Nota</span>
                </>
              )}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka Chat WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
