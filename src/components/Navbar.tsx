import React from 'react';
import { PlusCircle, FileSpreadsheet, RefreshCw, Phone, Search, QrCode, Lock, Bike, CalendarCheck, Github } from 'lucide-react';
import { getCustomerWhatsAppChatUrl, RENTAL_CS_DISPLAY } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'fleet' | 'transaksi' | 'pelanggan' | 'tarif' | 'pengeluaran' | 'laporan';
  setActiveTab: (tab: 'fleet' | 'transaksi' | 'pelanggan' | 'tarif' | 'pengeluaran' | 'laporan') => void;
  fleetCount?: number;
  activeBookYear?: number;
  isCloudOnline?: boolean;
  hasConnectedSheet?: boolean;
  onOpenNewRental: () => void;
  onOpenAppsScript: () => void;
  onOpenGitHubHosting?: () => void;
  onResetData: () => void;
  onOpenSearch?: () => void;
  onOpenQRCode?: () => void;
  onOpenInvestorShare?: () => void;
  onOpenManageFleet?: () => void;
  onOpenYearRollover?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  fleetCount = 13,
  activeBookYear = 2026,
  isCloudOnline = true,
  hasConnectedSheet = false,
  onOpenNewRental,
  onOpenAppsScript,
  onOpenGitHubHosting,
  onResetData,
  onOpenSearch,
  onOpenQRCode,
  onOpenInvestorShare,
  onOpenManageFleet,
  onOpenYearRollover
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            🛵 Ai Rent
          </span>
          <span className="hidden sm:inline-block text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
            {fleetCount} FLEET
          </span>
          {onOpenYearRollover && (
            <button
              onClick={onOpenYearRollover}
              title="Pergantian Tahun, Otomatis Rekap Data & Pembuatan Buku Tahun Baru"
              className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/70 hover:border-emerald-400 px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-3 h-3 text-emerald-400" />
              <span>Buku {activeBookYear}</span>
            </button>
          )}
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'fleet'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Armada ({fleetCount} Unit)
          </button>
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'transaksi'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transaksi Sewa
          </button>
          <button
            onClick={() => setActiveTab('pelanggan')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pelanggan'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Penyewa Setia</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
              Database
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tarif')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'tarif'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Acuan Tarif
          </button>
          <button
            onClick={() => setActiveTab('pengeluaran')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'pengeluaran'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pengeluaran Unit
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'laporan'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Laporan ADR &amp; Laba
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={getCustomerWhatsAppChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title={`Chat WhatsApp CS Hotline Ai Rent (${RENTAL_CS_DISPLAY})`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WA CS: {RENTAL_CS_DISPLAY}</span>
          </a>

          <button
            onClick={onOpenAppsScript}
            title="Integrasi Google Sheets Live API & Sinkronisasi Cloud Online"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/80 hover:border-emerald-400 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {hasConnectedSheet ? 'Google Sheets Live' : 'Google Sheets & Cloud'}
            </span>
            <span className="sm:hidden">Sheets</span>
          </button>

          {onOpenGitHubHosting && (
            <button
              onClick={onOpenGitHubHosting}
              title="Upload & Hosting Gratis di GitHub Pages"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 hover:border-cyan-400 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Github className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Hosting GitHub</span>
              <span className="sm:hidden">GitHub</span>
            </button>
          )}

          <button
            onClick={onResetData}
            title="Reset ke Data Awal"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              title="Alat Pencari Penyewa (Nama / WhatsApp) [Ctrl+K]"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-slate-800/90 hover:bg-slate-800 border border-cyan-800/80 hover:border-cyan-400 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cari Penyewa</span>
              <span className="sm:hidden">Cari</span>
            </button>
          )}

          {onOpenQRCode && (
            <button
              onClick={onOpenQRCode}
              title="QR Code Scan Pemesanan Handphone Penyewa"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-slate-900 hover:bg-slate-800 border border-emerald-800/80 hover:border-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">QR Pesanan HP</span>
              <span className="sm:hidden">QR</span>
            </button>
          )}

          <PWAInstallButton defaultAppMode="admin" compact label="Install HP" />

          {onOpenInvestorShare && (
            <button
              onClick={onOpenInvestorShare}
              title="Link Khusus Investor & Owner (Laporan Keuangan)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-slate-900 hover:bg-slate-800 border border-amber-700/80 hover:border-amber-400 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Link Investor</span>
              <span className="sm:hidden">Investor</span>
            </button>
          )}

          {onOpenManageFleet && (
            <button
              onClick={onOpenManageFleet}
              title="Kelola Armada (Tambah, Edit, Hapus Unit Motor)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Bike className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Kelola Armada</span>
              <span className="sm:hidden">Armada</span>
            </button>
          )}

          <button
            onClick={onOpenNewRental}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Sewa Baru</span>
          </button>
        </div>

      </div>

      {/* Mobile Nav row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'fleet' ? 'text-cyan-400 font-semibold bg-slate-800' : 'text-slate-400'
          }`}
        >
          Armada
        </button>
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'transaksi' ? 'text-cyan-400 font-semibold bg-slate-800' : 'text-slate-400'
          }`}
        >
          Transaksi
        </button>
        <button
          onClick={() => setActiveTab('pelanggan')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'pelanggan' ? 'text-cyan-400 font-semibold bg-slate-800' : 'text-slate-400'
          }`}
        >
          Penyewa Setia
        </button>
        <button
          onClick={() => setActiveTab('tarif')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'tarif' ? 'text-cyan-400 font-semibold bg-slate-800' : 'text-slate-400'
          }`}
        >
          Tarif
        </button>
        <button
          onClick={() => setActiveTab('pengeluaran')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'pengeluaran' ? 'text-cyan-400 font-semibold bg-slate-800' : 'text-slate-400'
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('laporan')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'laporan' ? 'text-cyan-400 font-semibold bg-slate-800' : 'text-slate-400'
          }`}
        >
          Laporan ADR
        </button>
      </div>
    </header>
  );
};
