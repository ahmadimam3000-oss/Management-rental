import React, { useState, useRef, useEffect } from 'react';
import {
  PlusCircle,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  Search,
  QrCode,
  Lock,
  Bike,
  CalendarCheck,
  CalendarDays,
  Github,
  SlidersHorizontal,
  ClipboardList,
  Users,
  Tag,
  Wrench,
  BarChart3,
  X,
  ChevronRight,
  Save,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { getCustomerWhatsAppChatUrl, RENTAL_CS_DISPLAY } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTabId =
  | 'fleet'
  | 'kalender'
  | 'transaksi'
  | 'pelanggan'
  | 'tarif'
  | 'pengeluaran'
  | 'laporan';

interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  fleetCount?: number;
  activeBookingsCount?: number;
  activeBookYear?: number;
  isCloudOnline?: boolean;
  isCloudSyncing?: boolean;
  lastCloudUpdated?: string | null;
  cloudRevision?: number;
  hasConnectedSheet?: boolean;
  onOpenNewRental: () => void;
  onManualSave?: () => void;
  onManualUpdate?: () => void;
  onQuickBackupDownload?: () => void;
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
  activeBookingsCount = 0,
  activeBookYear = 2026,
  isCloudOnline = true,
  isCloudSyncing = false,
  lastCloudUpdated = null,
  cloudRevision = 1,
  hasConnectedSheet = false,
  onOpenNewRental,
  onManualSave,
  onManualUpdate,
  onQuickBackupDownload,
  onOpenAppsScript,
  onOpenGitHubHosting,
  onResetData,
  onOpenSearch,
  onOpenQRCode,
  onOpenInvestorShare,
  onOpenManageFleet,
  onOpenYearRollover,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const formattedLastSync = lastCloudUpdated
    ? new Date(lastCloudUpdated).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Baru saja';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsToolsOpen(false);
      }
    };
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isToolsOpen]);

  const navItems: Array<{
    id: NavTabId;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'fleet',
      label: `Armada (${fleetCount})`,
      shortLabel: 'Armada',
      icon: <Bike className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'kalender',
      label: 'Kalender Jadwal',
      shortLabel: 'Kalender',
      icon: <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: activeBookingsCount > 0 ? activeBookingsCount : undefined,
    },
    {
      id: 'transaksi',
      label: 'Transaksi Sewa',
      shortLabel: 'Transaksi',
      icon: <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'pelanggan',
      label: 'Penyewa Setia',
      shortLabel: 'Pelanggan',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'tarif',
      label: 'Acuan Tarif',
      shortLabel: 'Tarif',
      icon: <Tag className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'pengeluaran',
      label: 'Pengeluaran',
      shortLabel: 'Biaya',
      icon: <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'laporan',
      label: 'Laporan & Laba',
      shortLabel: 'Laporan',
      icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <>
      {/* Clean 3-Zone Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Zone 1: Brand Wordmark & Book Year Indicator */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('fleet')}
              className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap flex items-center gap-2 cursor-pointer"
            >
              <span>🛵 Ai Rent</span>
            </button>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            {onOpenYearRollover && (
              <button
                onClick={onOpenYearRollover}
                title="Pergantian Tahun, Otomatis Rekap Data & Pembuatan Buku Tahun Baru"
                className="flex items-center gap-1 text-xs font-mono font-medium text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Buku {activeBookYear}</span>
              </button>
            )}
          </div>

          {/* Zone 2: Clean Single-Line Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions, Quick Save/Update Shortcuts & Grouped Tools Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" ref={menuRef}>
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                title="Cari Penyewa (Nama / WhatsApp) [Ctrl+K]"
                className="min-h-[40px] min-w-[40px] px-2.5 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="hidden xl:inline">Cari</span>
              </button>
            )}

            <button
              onClick={onOpenNewRental}
              className="min-h-[40px] px-3 sm:px-3.5 py-1.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Sewa Baru</span>
            </button>

            {/* Direct Quick-Access Manual Save & Manual Update Buttons on Main Interface */}
            {onManualSave && (
              <button
                onClick={onManualSave}
                disabled={isCloudSyncing}
                title="Simpan Data Manual Sekarang (Sinkronisasi otomatis tetap berjalan)"
                className="min-h-[40px] px-2.5 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-700/70 hover:border-emerald-400 rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Simpan</span>
              </button>
            )}

            {onManualUpdate && (
              <button
                onClick={onManualUpdate}
                disabled={isCloudSyncing}
                title="Update / Tarik Data Terbaru Sekarang (Sinkronisasi otomatis tetap berjalan)"
                className="min-h-[40px] px-2.5 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-cyan-300 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${
                    isCloudSyncing ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden md:inline">Update</span>
              </button>
            )}

            {/* Grouped Settings & Tools Button */}
            <div className="relative">
              <button
                onClick={() => setIsToolsOpen((prev) => !prev)}
                title="Menu Pintasan Simpan/Update, Google Sheets, Cloud, QR & Alat Sistem"
                aria-expanded={isToolsOpen}
                className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                  isToolsOpen
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/80'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline">Menu</span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isCloudOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  title={isCloudOnline ? 'Cloud Terhubung (Auto-Sync Aktif)' : 'Mode Lokal / Offline'}
                />
              </button>

              {/* Grouped Tools & System Popover / Sheet */}
              {isToolsOpen && (
                <div className="fixed sm:absolute inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-88 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">
                        Pintasan Data &amp; Alat Operasional
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>
                          {isCloudOnline
                            ? 'Auto-Update Aktif'
                            : 'Auto-Save Lokal Aktif'}
                        </span>
                        <span>·</span>
                        <span>Sync: {formattedLastSync}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsToolsOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-2.5 space-y-1.5 max-h-[78vh] overflow-y-auto">
                    {/* Quick Manual Save & Update Section right at the top of the Menu */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <span>Pintasan Simpan &amp; Perbarui Manual</span>
                        <span className="text-emerald-400 font-mono">
                          Rev #{cloudRevision}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {onManualSave && (
                          <button
                            onClick={() => {
                              onManualSave();
                              setIsToolsOpen(false);
                            }}
                            disabled={isCloudSyncing}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                          >
                            <Save className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Simpan Data</span>
                          </button>
                        )}

                        {onManualUpdate && (
                          <button
                            onClick={() => {
                              onManualUpdate();
                              setIsToolsOpen(false);
                            }}
                            disabled={isCloudSyncing}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw
                              className={`w-4 h-4 text-cyan-400 shrink-0 ${
                                isCloudSyncing ? 'animate-spin' : ''
                              }`}
                            />
                            <span>Update Data</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span>Update otomatis tetap berjalan</span>
                        {onQuickBackupDownload && (
                          <button
                            onClick={() => {
                              onQuickBackupDownload();
                              setIsToolsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Backup .JSON</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cloud & Google Sheets Integration */}
                    <div className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Sinkronisasi &amp; Deployment
                    </div>

                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenAppsScript();
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">
                            {hasConnectedSheet ? 'Google Sheets Live Aktif' : 'Google Sheets & Cloud'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Sinkronisasi spreadsheet &amp; cadangan data
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>

                    {onOpenGitHubHosting && (
                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          onOpenGitHubHosting();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            <Github className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              Hosting GitHub &amp; Actions
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Cek status deploy &amp; domain publik
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    )}

                    {/* Fleet & Book Year Management */}
                    <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-t border-slate-800/80">
                      Manajemen Armada &amp; Layanan
                    </div>

                    {onOpenManageFleet && (
                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          onOpenManageFleet();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0">
                            <Bike className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              Kelola Master Armada ({fleetCount} Unit)
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Tambah, ubah nopol, atau hapus unit motor
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    )}

                    {onOpenQRCode && (
                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          onOpenQRCode();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center shrink-0">
                            <QrCode className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              QR Code Pesanan HP Penyewa
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Formulir booking mandiri lewat scan HP
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    )}

                    {onOpenInvestorShare && (
                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          onOpenInvestorShare();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800/60 flex items-center justify-center shrink-0">
                            <Lock className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              Portal &amp; Link Laporan Investor
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Bagikan akses laporan bagi hasil owner
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    )}

                    {onOpenYearRollover && (
                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          onOpenYearRollover();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800/90 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center shrink-0">
                            <CalendarCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              Tahun Buku {activeBookYear} &amp; Tutup Buku
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Rekap tahunan otomatis &amp; arsip laporan
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    )}

                    <a
                      href={getCustomerWhatsAppChatUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsToolsOpen(false)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-800/90 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-emerald-300 truncate">
                            Chat WA CS: {RENTAL_CS_DISPLAY}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Hubungi layanan pelanggan langsung
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </a>

                    <div className="pt-2 mt-1 border-t border-slate-800/80 flex items-center justify-between gap-2 px-2 pb-1">
                      <PWAInstallButton defaultAppMode="admin" compact label="Install Aplikasi HP" />

                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          onResetData();
                        }}
                        title="Reset ke Data Awal"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Thumb-Zone Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi Utama Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800"
      >
        <div className="grid grid-cols-7 items-center h-16 max-w-lg mx-auto px-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer relative ${
                  isActive
                    ? 'text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors relative ${
                    isActive ? 'bg-cyan-500/15 text-cyan-400' : ''
                  }`}
                >
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] leading-none tracking-tight whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
