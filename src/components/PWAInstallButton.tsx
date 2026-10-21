import React, { useState } from 'react';
import { Smartphone, Download, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { SmartphoneInstallModal } from './SmartphoneInstallModal';

interface PWAInstallButtonProps {
  defaultAppMode?: 'admin' | 'booking' | 'investor';
  compact?: boolean;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  defaultAppMode = 'admin',
  compact = false,
  label = 'Install HP',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hide button when already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Install Aplikasi Ai Rent di Smartphone (Android & iPhone)"
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shadow-sm cursor-pointer ${
          isInstallable
            ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950'
            : 'text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-cyan-500/60 hover:border-cyan-400'
        }`}
      >
        {isInstallable ? (
          <Download className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        )}
        <span className={compact ? 'hidden sm:inline' : ''}>
          {isInstallable ? 'Install Aplikasi' : label}
        </span>
        {compact && <span className="sm:hidden">Install</span>}
      </button>

      <SmartphoneInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultAppMode={defaultAppMode}
      />
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xl">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline — Menggunakan data tersimpan di HP</span>
    </div>
  );
};
