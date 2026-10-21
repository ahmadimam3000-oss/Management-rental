import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MotorMaster, TransaksiSewa, PengeluaranMotor, FrequentRenter, GuaranteeIdType, CustomerCategory, YearlyRecapArchive } from './types/rental';
import { ConnectedSheetInfo, getAccessToken, pushDataToGoogleSpreadsheet } from './services/googleSheetsService';
import { 
  INITIAL_FLEET, 
  INITIAL_TRANSACTIONS, 
  INITIAL_EXPENSES,
  INITIAL_FREQUENT_RENTERS
} from './data/initialFleetData';
import { 
  getIndonesianDay, 
  calculateEstimatedReturn, 
  generateYearlyRecapSnapshot, 
  exportYearlyRecapToCSV, 
  exportYearlyRecapToJSON,
  getCloudApiBaseUrl
} from './utils/formatters';
import { Navbar, NavTabId } from './components/Navbar';
import { FleetGrid } from './components/FleetGrid';
import { RentalScheduleCalendar } from './components/RentalScheduleCalendar';
import { TransactionsTable } from './components/TransactionsTable';
import { FrequentRentersDatabase } from './components/FrequentRentersDatabase';
import { TarifReferenceTable } from './components/TarifReferenceTable';
import { ExpensesTable } from './components/ExpensesTable';
import { PerformanceReport } from './components/PerformanceReport';
import { NewTransactionModal } from './components/NewTransactionModal';
import { NewExpenseModal } from './components/NewExpenseModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { TenantSearchModal } from './components/TenantSearchModal';
import { BookingQRCodeModal } from './components/BookingQRCodeModal';
import { TenantBookingMobileView } from './components/TenantBookingMobileView';
import { InvestorOwnerPortal } from './components/InvestorOwnerPortal';
import { InvestorShareModal } from './components/InvestorShareModal';
import { FleetManagementModal } from './components/FleetManagementModal';
import { YearEndRolloverModal } from './components/YearEndRolloverModal';
import { OfflineIndicator } from './components/PWAInstallButton';

// Static asset from generate_image
import fleetHeroBanner from './assets/images/fleet_hero_banner_1792514895754.jpg';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<NavTabId>('fleet');

  // Core Data States with LocalStorage support (clean v2 production-ready state)
  const [fleet, setFleet] = useState<MotorMaster[]>(() => {
    localStorage.removeItem('motorent_malang_fleet_v1');
    const saved = localStorage.getItem('motorent_malang_fleet_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_FLEET;
  });

  const [transactions, setTransactions] = useState<TransaksiSewa[]>(() => {
    localStorage.removeItem('motorent_malang_transactions_v1');
    const saved = localStorage.getItem('motorent_malang_transactions_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [expenses, setExpenses] = useState<PengeluaranMotor[]>(() => {
    localStorage.removeItem('motorent_malang_expenses_v1');
    const saved = localStorage.getItem('motorent_malang_expenses_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_EXPENSES;
  });

  const [renters, setRenters] = useState<FrequentRenter[]>(() => {
    localStorage.removeItem('motorent_malang_renters_v1');
    const saved = localStorage.getItem('motorent_malang_renters_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_FREQUENT_RENTERS;
  });

  // Active Operational Book Year (Tahun Buku Aktif)
  const [activeBookYear, setActiveBookYear] = useState<number>(() => {
    localStorage.removeItem('airent_active_book_year_v1');
    const saved = localStorage.getItem('airent_active_book_year_v2');
    if (saved && !isNaN(parseInt(saved))) {
      return parseInt(saved);
    }
    return 2026;
  });

  // Archived Yearly Recaps (Arsip Rekap Tahunan Otomatis)
  const [yearlyRecaps, setYearlyRecaps] = useState<YearlyRecapArchive[]>(() => {
    localStorage.removeItem('airent_yearly_recaps_v1');
    const saved = localStorage.getItem('airent_yearly_recaps_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Connected Google Spreadsheet Info
  const [connectedSheetInfo, setConnectedSheetInfo] = useState<ConnectedSheetInfo | null>(() => {
    const saved = localStorage.getItem('airent_connected_sheet_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  // Real-time Online Cloud Sync states
  const [cloudStatus, setCloudStatus] = useState({
    isOnline: true,
    isSyncing: false,
    lastUpdated: null as string | null,
    revision: 1,
    connectedClients: 1,
  });

  const lastServerRevisionRef = useRef<number>(0);
  const isApplyingRemoteStateRef = useRef<boolean>(false);
  const hasLoadedInitialCloudRef = useRef<boolean>(false);
  const pendingCloudPushRef = useRef<boolean>(false);
  const pendingSheetsPushRef = useRef<boolean>(false);
  const isPushingSheetsRef = useRef<boolean>(false);
  const latestStateRef = useRef({
    fleet,
    transactions,
    expenses,
    renters,
    activeBookYear,
    yearlyRecaps,
    connectedSheetInfo,
  });

  useEffect(() => {
    latestStateRef.current = {
      fleet,
      transactions,
      expenses,
      renters,
      activeBookYear,
      yearlyRecaps,
      connectedSheetInfo,
    };
  }, [fleet, transactions, expenses, renters, activeBookYear, yearlyRecaps, connectedSheetInfo]);

  const applyServerState = useCallback((remote: {
    revision?: number;
    updatedAt?: string;
    connectedClients?: number;
    fleet?: MotorMaster[];
    transactions?: TransaksiSewa[];
    expenses?: PengeluaranMotor[];
    renters?: FrequentRenter[];
    activeBookYear?: number;
    yearlyRecaps?: YearlyRecapArchive[];
    connectedSheetInfo?: ConnectedSheetInfo | null;
  }, forceApply = false) => {
    if (!remote || typeof remote.revision !== 'number') return;
    if (!forceApply && remote.revision <= lastServerRevisionRef.current && hasLoadedInitialCloudRef.current) {
      setCloudStatus(prev => ({
        ...prev,
        isOnline: true,
        connectedClients: remote.connectedClients ?? prev.connectedClients,
      }));
      return;
    }

    isApplyingRemoteStateRef.current = true;
    lastServerRevisionRef.current = remote.revision;
    hasLoadedInitialCloudRef.current = true;

    if (Array.isArray(remote.fleet)) setFleet(remote.fleet);
    if (Array.isArray(remote.transactions)) setTransactions(remote.transactions);
    if (Array.isArray(remote.expenses)) setExpenses(remote.expenses);
    if (Array.isArray(remote.renters)) setRenters(remote.renters);
    if (typeof remote.activeBookYear === 'number') setActiveBookYear(remote.activeBookYear);
    if (Array.isArray(remote.yearlyRecaps)) setYearlyRecaps(remote.yearlyRecaps);
    if (remote.connectedSheetInfo !== undefined) setConnectedSheetInfo(remote.connectedSheetInfo);

    setCloudStatus({
      isOnline: true,
      isSyncing: false,
      lastUpdated: remote.updatedAt || new Date().toISOString(),
      revision: remote.revision,
      connectedClients: remote.connectedClients || 1,
    });

    setTimeout(() => {
      isApplyingRemoteStateRef.current = false;
    }, 60);
  }, []);

  const isInternetConnected = useCallback((): boolean => {
    return typeof navigator === 'undefined' || navigator.onLine !== false;
  }, []);

  const pushStateToCloud = useCallback(async (sourceAction = 'auto_sync'): Promise<boolean> => {
    if (isApplyingRemoteStateRef.current) return false;
    if (!isInternetConnected()) {
      pendingCloudPushRef.current = true;
      setCloudStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
      return false;
    }
    try {
      setCloudStatus(prev => ({ ...prev, isSyncing: true }));
      const snap = latestStateRef.current;
      const res = await fetch(`${getCloudApiBaseUrl()}/api/cloud-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleet: snap.fleet,
          transactions: snap.transactions,
          expenses: snap.expenses,
          renters: snap.renters,
          activeBookYear: snap.activeBookYear,
          yearlyRecaps: snap.yearlyRecaps,
          connectedSheetInfo: snap.connectedSheetInfo,
          sourceAction,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        pendingCloudPushRef.current = false;
        if (typeof updated.revision === 'number') {
          lastServerRevisionRef.current = updated.revision;
          setCloudStatus({
            isOnline: true,
            isSyncing: false,
            lastUpdated: updated.updatedAt || new Date().toISOString(),
            revision: updated.revision,
            connectedClients: updated.connectedClients || 1,
          });
        }
        return true;
      }
      pendingCloudPushRef.current = true;
      return false;
    } catch {
      pendingCloudPushRef.current = true;
      setCloudStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
      return false;
    }
  }, [isInternetConnected]);

  const fetchLatestCloudState = useCallback(async (forceApply = false): Promise<boolean> => {
    if (!isInternetConnected()) {
      setCloudStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
      return false;
    }
    try {
      if (pendingCloudPushRef.current && !forceApply) {
        const pushed = await pushStateToCloud('periodic_retry_upload');
        if (pushed) return true;
      }
      setCloudStatus(prev => ({ ...prev, isSyncing: true }));
      const res = await fetch(`${getCloudApiBaseUrl()}/api/cloud-state`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data, forceApply);
        return true;
      }
      return false;
    } catch {
      setCloudStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
      return false;
    } finally {
      setCloudStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [applyServerState, pushStateToCloud, isInternetConnected]);

  // Real-time & Periodic Auto-Upload to Connected Google Spreadsheet (only when connected to internet & autoSyncEnabled is active)
  const syncToConnectedGoogleSheet = useCallback(async () => {
    if (!isInternetConnected()) {
      pendingSheetsPushRef.current = true;
      return;
    }
    const snap = latestStateRef.current;
    if (!snap.connectedSheetInfo?.spreadsheetId || !snap.connectedSheetInfo.autoSyncEnabled) return;
    if (isPushingSheetsRef.current) return;

    const token = await getAccessToken();
    if (!token) return;

    isPushingSheetsRef.current = true;
    try {
      await pushDataToGoogleSpreadsheet(token, snap.connectedSheetInfo.spreadsheetId, {
        fleet: snap.fleet,
        transactions: snap.transactions,
        expenses: snap.expenses,
        renters: snap.renters,
        yearlyRecaps: snap.yearlyRecaps,
        activeBookYear: snap.activeBookYear,
      });
      pendingSheetsPushRef.current = false;
    } catch {
      pendingSheetsPushRef.current = true;
    } finally {
      isPushingSheetsRef.current = false;
    }
  }, [isInternetConnected]);

  // Connect to Real-Time Cloud Stream (SSE) + periodic fallback check & periodic upload retry (only when online)
  useEffect(() => {
    let es: EventSource | null = null;

    const connectStream = () => {
      if (!isInternetConnected()) return;
      if (es) es.close();
      try {
        es = new EventSource(`${getCloudApiBaseUrl()}/api/cloud-stream`);
        es.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed && parsed.state) {
              applyServerState({
                ...parsed.state,
                connectedClients: parsed.connectedClients,
              });
            }
          } catch {
            // ignore malformed event
          }
        };
        es.onerror = () => {
          setCloudStatus(prev => ({ ...prev, isOnline: false }));
        };
      } catch {
        // SSE fallback handled by polling
      }
    };

    if (isInternetConnected()) {
      fetchLatestCloudState();
      connectStream();
    } else {
      setCloudStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
    }

    const handleOnline = () => {
      fetchLatestCloudState();
      connectStream();
      if (pendingSheetsPushRef.current) {
        syncToConnectedGoogleSheet();
      }
    };

    const handleOffline = () => {
      if (es) {
        es.close();
        es = null;
      }
      setCloudStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const pollInterval = setInterval(() => {
      if (isInternetConnected()) {
        fetchLatestCloudState();
      }
    }, 5000);

    return () => {
      if (es) es.close();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pollInterval);
    };
  }, [fetchLatestCloudState, applyServerState, isInternetConnected, syncToConnectedGoogleSheet]);

  // Push local changes to Cloud Server automatically in real-time (only when connected to internet)
  useEffect(() => {
    if (!hasLoadedInitialCloudRef.current || isApplyingRemoteStateRef.current) {
      return;
    }

    pendingCloudPushRef.current = true;
    if (!isInternetConnected()) {
      setCloudStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
      return;
    }

    const timer = setTimeout(() => {
      if (isInternetConnected()) {
        pushStateToCloud('realtime_local_save');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [fleet, transactions, expenses, renters, activeBookYear, yearlyRecaps, connectedSheetInfo, pushStateToCloud, isInternetConnected]);

  useEffect(() => {
    if (!hasLoadedInitialCloudRef.current || isApplyingRemoteStateRef.current) return;
    if (!connectedSheetInfo?.spreadsheetId || !connectedSheetInfo.autoSyncEnabled) return;

    pendingSheetsPushRef.current = true;
    if (!isInternetConnected()) return;

    const timer = setTimeout(() => {
      if (isInternetConnected()) {
        syncToConnectedGoogleSheet();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [fleet, transactions, expenses, renters, activeBookYear, yearlyRecaps, connectedSheetInfo, syncToConnectedGoogleSheet, isInternetConnected]);

  useEffect(() => {
    const sheetsInterval = setInterval(() => {
      if (isInternetConnected() && pendingSheetsPushRef.current) {
        syncToConnectedGoogleSheet();
      }
    }, 15000);
    return () => clearInterval(sheetsInterval);
  }, [syncToConnectedGoogleSheet, isInternetConnected]);

  // Save to localStorage on change as offline fallback
  useEffect(() => {
    localStorage.setItem('motorent_malang_fleet_v2', JSON.stringify(fleet));
  }, [fleet]);

  useEffect(() => {
    localStorage.setItem('motorent_malang_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('motorent_malang_expenses_v2', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('motorent_malang_renters_v2', JSON.stringify(renters));
  }, [renters]);

  useEffect(() => {
    localStorage.setItem('airent_active_book_year_v2', activeBookYear.toString());
  }, [activeBookYear]);

  useEffect(() => {
    localStorage.setItem('airent_yearly_recaps_v2', JSON.stringify(yearlyRecaps));
  }, [yearlyRecaps]);

  useEffect(() => {
    if (connectedSheetInfo) {
      localStorage.setItem('airent_connected_sheet_v1', JSON.stringify(connectedSheetInfo));
    } else {
      localStorage.removeItem('airent_connected_sheet_v1');
    }
  }, [connectedSheetInfo]);

  // Automatic detection of past years without recap
  useEffect(() => {
    const pastYears = new Set<number>();
    transactions.forEach(t => {
      const y = new Date(t.waktuStartSewa).getFullYear();
      if (!isNaN(y) && y < activeBookYear) pastYears.add(y);
    });
    if (pastYears.size > 0) {
      setYearlyRecaps(prev => {
        let changed = false;
        const next = [...prev];
        pastYears.forEach(yr => {
          if (!next.some(r => r.year === yr)) {
            next.push(
              generateYearlyRecapSnapshot(
                yr,
                fleet,
                transactions,
                expenses,
                true,
                `Rekapitulasi tahunan otomatis periode ${yr}`
              )
            );
            changed = true;
          }
        });
        return changed ? next.sort((a, b) => b.year - a.year) : prev;
      });
    }
  }, [activeBookYear, transactions, expenses, fleet]);

  // Modal States
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isAppsScriptOpen, setIsAppsScriptOpen] = useState(false);
  const [appsScriptInitialTab, setAppsScriptInitialTab] = useState<'sheets_live' | 'cloud_online' | 'github_hosting' | 'script' | 'backup'>('sheets_live');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isInvestorShareOpen, setIsInvestorShareOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [fleetModalInitialView, setFleetModalInitialView] = useState<'list' | 'form'>('list');
  const [editingBikeForModal, setEditingBikeForModal] = useState<MotorMaster | null>(null);
  const [isYearRolloverOpen, setIsYearRolloverOpen] = useState(false);
  const [yearRolloverInitialTab, setYearRolloverInitialTab] = useState<'rollover' | 'archives' | 'settings'>('rollover');

  // Dedicated Investor & Owner Financial Portal view
  const [isInvestorPortalView, setIsInvestorPortalView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'investor' || params.get('mode') === 'investor' || window.location.hash === '#/investor';
    }
    return false;
  });

  // Tenant Mobile Self-Service View toggle (triggered via QR scan url or preview button)
  const [isMobileBookingView, setIsMobileBookingView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'booking' || window.location.hash === '#/booking';
    }
    return false;
  });

  // Keyboard shortcut Ctrl+K / Cmd+K to open Tenant Search Tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal Prefills
  const [selectedTrxForWA, setSelectedTrxForWA] = useState<TransaksiSewa | null>(null);
  const [prefilledCustomer, setPrefilledCustomer] = useState<FrequentRenter | undefined>();
  const [prefilledNopol, setPrefilledNopol] = useState<string | undefined>();
  const [prefilledTipe, setPrefilledTipe] = useState<string | undefined>();
  const [prefilledKategori, setPrefilledKategori] = useState<string | undefined>();
  const [prefilledHarga, setPrefilledHarga] = useState<number | undefined>();
  const [prefilledLamaHari, setPrefilledLamaHari] = useState<number | undefined>();
  const [prefilledStartDate, setPrefilledStartDate] = useState<string | undefined>();
  const [prefilledStatusUnit, setPrefilledStatusUnit] = useState<'Disewa' | 'Booking' | undefined>();
  const [prefilledExpenseNopol, setPrefilledExpenseNopol] = useState<string | undefined>();

  // Flash notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenNewRentalWithInfo = (nama: string, wa: string) => {
    setPrefilledNopol(undefined);
    setPrefilledTipe(undefined);
    setPrefilledKategori(undefined);
    setPrefilledHarga(undefined);
    setPrefilledLamaHari(1);
    if (nama || wa) {
      setPrefilledCustomer({
        id: `TEMP-${Date.now()}`,
        nama: nama || '',
        whatsapp: wa || '',
        alamat: '',
        identitasDefault: 'KTM dan KTP',
        kategoriDefault: 'Mhs Malang',
        totalRentals: 1,
        totalSpent: 0,
        ratingTrust: 5
      });
    } else {
      setPrefilledCustomer(undefined);
    }
    setIsNewRentalOpen(true);
  };

  // Handle incoming mobile booking submitted by tenant via QR code
  const handleTenantBookingSubmit = async (newTrx: TransaksiSewa) => {
    setTransactions(prev => [newTrx, ...prev]);
    // Mark bike as Booking in fleet if currently Tersedia
    setFleet(prev => prev.map(b => b.nopol === newTrx.nopolMotor && b.status === 'Tersedia' ? { ...b, status: 'Booking' as const } : b));
    try {
      const res = await fetch(`${getCloudApiBaseUrl()}/api/cloud-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: newTrx }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) applyServerState(data.state);
      }
    } catch {
      // Fallback handled by state sync
    }
    showToast(`🎉 Pesanan Mandiri baru dari ${newTrx.namaPenyewa} (${newTrx.nopolMotor}) berhasil diterima & tersinkron online!`);
  };

  const handleExitMobileBooking = () => {
    setIsMobileBookingView(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.hash = '';
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleExitInvestorPortal = () => {
    setIsInvestorPortalView(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('pin');
      url.searchParams.delete('mode');
      url.hash = '';
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  // Check-In Unit Action (matching checkInActiveRow)
  const handleCheckInByNopol = (nopol: string) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const indonesianDay = getIndonesianDay(now);

    let updated = false;
    const newTrxs = transactions.map(t => {
      if (t.nopolMotor === nopol && (t.statusUnit === 'Booking' || t.statusUnit === 'Disewa')) {
        updated = true;
        const newEstReturn = calculateEstimatedReturn(nowIso, t.lamaSewaHari);
        return {
          ...t,
          waktuStartSewa: nowIso,
          hariSewa: indonesianDay,
          estWaktuKembali: newEstReturn,
          statusUnit: 'Disewa' as const
        };
      }
      return t;
    });

    if (updated) {
      setTransactions(newTrxs);
      setFleet(prev => prev.map(b => b.nopol === nopol ? { ...b, status: 'Disewa' } : b));
      showToast(`✅ Check-In Berhasil untuk plat ${nopol}! Waktu Mulai diset sekarang.`);
    } else {
      // If no pending booking found, open rental modal prefilled
      setPrefilledNopol(nopol);
      setIsNewRentalOpen(true);
    }
  };

  const handleCheckInByTrxId = (trxId: string) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const indonesianDay = getIndonesianDay(now);

    let targetNopol = '';
    const newTrxs = transactions.map(t => {
      if (t.id === trxId) {
        targetNopol = t.nopolMotor;
        const newEstReturn = calculateEstimatedReturn(nowIso, t.lamaSewaHari);
        return {
          ...t,
          waktuStartSewa: nowIso,
          hariSewa: indonesianDay,
          estWaktuKembali: newEstReturn,
          statusUnit: 'Disewa' as const
        };
      }
      return t;
    });

    setTransactions(newTrxs);
    if (targetNopol) {
      setFleet(prev => prev.map(b => b.nopol === targetNopol ? { ...b, status: 'Disewa' } : b));
    }
    showToast(`✅ Check-In Transaksi ${trxId} Berhasil! Status unit diset: Disewa.`);
  };

  // Check-Out Unit Action (matching checkOutActiveRow)
  const handleCheckOutByNopol = (nopol: string) => {
    const nowIso = new Date().toISOString();

    const newTrxs = transactions.map(t => {
      if (t.nopolMotor === nopol && (t.statusUnit === 'Disewa' || t.statusUnit === 'Overdue')) {
        return {
          ...t,
          statusUnit: 'Selesai' as const,
          waktuSelesai: nowIso
        };
      }
      return t;
    });

    setTransactions(newTrxs);
    setFleet(prev => prev.map(b => b.nopol === nopol ? { ...b, status: 'Tersedia' } : b));
    showToast(`🏁 Check-Out Unit ${nopol} Selesai! Unit kini berstatus Tersedia.`);
  };

  const handleCheckOutByTrxId = (trxId: string) => {
    const nowIso = new Date().toISOString();
    let targetNopol = '';

    const newTrxs = transactions.map(t => {
      if (t.id === trxId) {
        targetNopol = t.nopolMotor;
        return {
          ...t,
          statusUnit: 'Selesai' as const,
          waktuSelesai: nowIso
        };
      }
      return t;
    });

    setTransactions(newTrxs);
    if (targetNopol) {
      setFleet(prev => prev.map(b => b.nopol === targetNopol ? { ...b, status: 'Tersedia' } : b));
    }
    showToast(`🏁 Check-Out Transaksi ${trxId} Berhasil! Unit ${targetNopol} kembali Tersedia.`);
  };

  // New Rental Flow
  const handleOpenNewRental = (bikeNopol?: string, customer?: FrequentRenter) => {
    setPrefilledCustomer(customer);
    setPrefilledNopol(bikeNopol);
    setPrefilledTipe(undefined);
    setPrefilledKategori(customer ? customer.kategoriDefault : undefined);
    setPrefilledHarga(undefined);
    setPrefilledLamaHari(undefined);
    setPrefilledStartDate(undefined);
    setPrefilledStatusUnit('Disewa');
    setIsNewRentalOpen(true);
  };

  const handleOpenNewRentalOnDate = (params: {
    nopol?: string;
    startDateIso?: string;
    statusUnit?: 'Disewa' | 'Booking';
  }) => {
    setPrefilledCustomer(undefined);
    setPrefilledNopol(params.nopol);
    setPrefilledTipe(undefined);
    setPrefilledKategori(undefined);
    setPrefilledHarga(undefined);
    setPrefilledLamaHari(1);
    setPrefilledStartDate(params.startDateIso);
    setPrefilledStatusUnit(params.statusUnit || 'Booking');
    setIsNewRentalOpen(true);
  };

  const handleApplyTarifToNewRental = (
    tipe: string, 
    kategori: string, 
    hargaHari: number, 
    lamaHari: number
  ) => {
    // Find available bike of this type
    const candidate = fleet.find(b => b.tipeMotor.toLowerCase() === tipe.toLowerCase() && b.status === 'Tersedia');
    setPrefilledNopol(candidate ? candidate.nopol : undefined);
    setPrefilledTipe(tipe);
    setPrefilledKategori(kategori);
    setPrefilledHarga(hargaHari);
    setPrefilledLamaHari(lamaHari);
    setIsNewRentalOpen(true);
  };

  const handleSaveTransaction = (newTrx: TransaksiSewa) => {
    setTransactions(prev => [newTrx, ...prev]);

    // Update fleet unit status
    setFleet(prev => prev.map(b => {
      if (b.nopol === newTrx.nopolMotor) {
        return {
          ...b,
          status: newTrx.statusUnit === 'Booking' ? 'Booking' : 'Disewa'
        };
      }
      return b;
    }));

    showToast(`🎉 Transaksi ${newTrx.id} berhasil dicatat untuk ${newTrx.namaPenyewa}!`);
    
    // Auto-open WhatsApp receipt preview
    setSelectedTrxForWA(newTrx);
    setIsWhatsAppOpen(true);
  };

  const handleRefundTransaction = (trxId: string, nominalRefund: number, keteranganRefund: string) => {
    const nowIso = new Date().toISOString();
    let targetNopol = '';

    const updatedTransactions = transactions.map(t => {
      if (t.id === trxId) {
        targetNopol = t.nopolMotor;
        const origAmount = typeof t.pemasukanAwalSebelumRefund === 'number'
          ? t.pemasukanAwalSebelumRefund
          : t.totalPemasukan + (t.nominalRefund || 0);
        const validRefund = Math.max(0, Math.min(origAmount, nominalRefund));
        const netRemaining = Math.max(0, origAmount - validRefund);

        // Clean any old [REFUND ...] tag from catatanJaminanTambahan and append the new one
        const baseNotes = (t.catatanJaminanTambahan || '')
          .replace(/\s*\[REFUND[^\]]*\]/gi, '')
          .trim();
        const refundNoteTag = `[REFUND Rp ${validRefund.toLocaleString('id-ID')}: ${keteranganRefund}]`;

        return {
          ...t,
          pemasukanAwalSebelumRefund: origAmount,
          nominalRefund: validRefund,
          totalPemasukan: netRemaining,
          statusBayar: 'Refund' as const,
          statusUnit: 'Refund' as const,
          keteranganRefund,
          waktuRefund: nowIso,
          waktuSelesai: t.waktuSelesai || nowIso,
          catatanJaminanTambahan: baseNotes ? `${baseNotes} ${refundNoteTag}` : refundNoteTag,
        };
      }
      return t;
    });

    setTransactions(updatedTransactions);

    // If no other active transaction is using this bike, return the bike status to 'Tersedia'
    if (targetNopol) {
      const stillActiveForBike = updatedTransactions.some(
        t =>
          t.nopolMotor === targetNopol &&
          (t.statusUnit === 'Disewa' || t.statusUnit === 'Booking' || t.statusUnit === 'Overdue')
      );
      if (!stillActiveForBike) {
        setFleet(prev =>
          prev.map(b => (b.nopol === targetNopol && b.status !== 'Perawatan' ? { ...b, status: 'Tersedia' } : b))
        );
      }
    }

    showToast(
      `💸 Refund Transaksi ${trxId} (Rp ${nominalRefund.toLocaleString('id-ID')}) tercatat: "${keteranganRefund}"`
    );
  };

  // Expenses Flow
  const handleOpenNewExpense = (bikeNopol?: string) => {
    setPrefilledExpenseNopol(bikeNopol);
    setIsNewExpenseOpen(true);
  };

  const handleSaveExpense = (newExp: PengeluaranMotor) => {
    setExpenses(prev => [newExp, ...prev]);
    showToast(`🔧 Pengeluaran Rp ${(newExp.nominal).toLocaleString('id-ID')} berhasil dicatat.`);
  };

  const handleDeleteExpense = (expId: string) => {
    if (window.confirm('Hapus catatan pengeluaran ini?')) {
      setExpenses(prev => prev.filter(e => e.id !== expId));
      showToast('Catatan pengeluaran berhasil dihapus.');
    }
  };

  // Frequent Renters CRM Handlers
  const handleAddRenter = (newRenter: FrequentRenter) => {
    setRenters(prev => [newRenter, ...prev]);
    showToast(`✅ Pelanggan ${newRenter.nama} berhasil ditambahkan ke database!`);
  };

  const handleUpdateRenter = (updatedRenter: FrequentRenter) => {
    setRenters(prev => prev.map(r => r.id === updatedRenter.id ? updatedRenter : r));
    showToast(`✏️ Data pelanggan ${updatedRenter.nama} berhasil diperbarui.`);
  };

  const handleDeleteRenter = (id: string) => {
    const target = renters.find(r => r.id === id);
    if (window.confirm(`Hapus pelanggan ${target?.nama || id} dari database penyewa setia?`)) {
      setRenters(prev => prev.filter(r => r.id !== id));
      showToast(`🗑️ Data pelanggan telah dihapus.`);
    }
  };

  // Fleet Master CRUD Handlers (Tambah, Edit, Hapus Armada)
  const handleOpenAddBikeModal = () => {
    setEditingBikeForModal(null);
    setFleetModalInitialView('form');
    setIsFleetModalOpen(true);
  };

  const handleOpenEditBikeModal = (bike: MotorMaster) => {
    setEditingBikeForModal(bike);
    setFleetModalInitialView('form');
    setIsFleetModalOpen(true);
  };

  const handleOpenManageFleetModal = () => {
    setEditingBikeForModal(null);
    setFleetModalInitialView('list');
    setIsFleetModalOpen(true);
  };

  const handleAddBike = (newBikeData: Omit<MotorMaster, 'no'>) => {
    setFleet(prev => {
      const nextNo = prev.length > 0 ? Math.max(...prev.map(b => b.no)) + 1 : 1;
      return [...prev, { ...newBikeData, no: nextNo }];
    });
    showToast(`🛵 Armada baru ${newBikeData.namaUnit} (${newBikeData.nopol}) berhasil ditambahkan!`);
  };

  const handleUpdateBike = (oldNopol: string, updatedBike: MotorMaster) => {
    setFleet(prev => prev.map(b => b.nopol === oldNopol ? updatedBike : b));
    if (oldNopol !== updatedBike.nopol) {
      setTransactions(prev => prev.map(t => t.nopolMotor === oldNopol ? { ...t, nopolMotor: updatedBike.nopol } : t));
      setExpenses(prev => prev.map(e => e.nopolMotor === oldNopol ? { ...e, nopolMotor: updatedBike.nopol } : e));
    }
    showToast(`✏️ Data armada ${updatedBike.namaUnit} (${updatedBike.nopol}) berhasil diperbarui!`);
  };

  const handleDeleteBike = (nopol: string) => {
    const target = fleet.find(b => b.nopol === nopol);
    if (window.confirm(`Hapus unit armada ${target ? `${target.namaUnit} (${target.nopol})` : nopol} dari daftar armada?`)) {
      setFleet(prev => prev.filter(b => b.nopol !== nopol).map((b, idx) => ({ ...b, no: idx + 1 })));
      showToast(`🗑️ Unit armada ${target?.namaUnit || nopol} telah dihapus.`);
    }
  };

  const handleSyncFromTransactions = () => {
    const map = new Map<string, {
      nama: string;
      whatsapp: string;
      alamat: string;
      identitas: GuaranteeIdType;
      kategori: CustomerCategory;
      count: number;
      spent: number;
      lastDate: string;
    }>();

    transactions.forEach(t => {
      const key = t.whatsapp.replace(/\D/g, '') || t.namaPenyewa.toLowerCase().trim();
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.spent += t.totalPemasukan;
        if (new Date(t.waktuStartSewa).getTime() > new Date(existing.lastDate).getTime()) {
          existing.lastDate = t.waktuStartSewa;
          existing.alamat = t.alamatAsalKos;
          existing.identitas = t.identitasDijaminkan;
          existing.kategori = t.kategoriPelanggan;
        }
      } else {
        map.set(key, {
          nama: t.namaPenyewa,
          whatsapp: t.whatsapp.replace(/\D/g, ''),
          alamat: t.alamatAsalKos,
          identitas: t.identitasDijaminkan,
          kategori: t.kategoriPelanggan,
          count: 1,
          spent: t.totalPemasukan,
          lastDate: t.waktuStartSewa
        });
      }
    });

    let updatedCount = 0;
    let newCount = 0;
    const newRenters = [...renters];

    map.forEach((data, cleanWa) => {
      const existingIndex = newRenters.findIndex(
        r => r.whatsapp.replace(/\D/g, '') === cleanWa || r.nama.toLowerCase() === data.nama.toLowerCase()
      );
      if (existingIndex >= 0) {
        newRenters[existingIndex] = {
          ...newRenters[existingIndex],
          totalRentals: Math.max(newRenters[existingIndex].totalRentals, data.count),
          totalSpent: Math.max(newRenters[existingIndex].totalSpent, data.spent),
          lastRentalDate: data.lastDate
        };
        updatedCount++;
      } else {
        newRenters.push({
          id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
          nama: data.nama,
          whatsapp: data.whatsapp,
          alamat: data.alamat,
          identitasDefault: data.identitas,
          kategoriDefault: data.kategori,
          totalRentals: data.count,
          totalSpent: data.spent,
          ratingTrust: 5,
          lastRentalDate: data.lastDate,
          catatanKhusus: `Otomatis disinkronkan dari riwayat transaksi (${data.count}x sewa)`
        });
        newCount++;
      }
    });

    setRenters(newRenters);
    showToast(`🔄 Sinkronisasi selesai: ${updatedCount} diperbarui, ${newCount} pelanggan baru ditambahkan!`);
  };

  const handleSaveCustomerFromTrx = (trx: TransaksiSewa) => {
    const cleanWa = trx.whatsapp.replace(/\D/g, '');
    const existing = renters.find(
      r => r.whatsapp.replace(/\D/g, '') === cleanWa || r.nama.toLowerCase() === trx.namaPenyewa.toLowerCase()
    );
    if (existing) {
      showToast(`ℹ️ Pelanggan ${trx.namaPenyewa} sudah ada di database penyewa setia.`);
      return;
    }
    const newCustomer: FrequentRenter = {
      id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      nama: trx.namaPenyewa,
      whatsapp: cleanWa,
      alamat: trx.alamatAsalKos,
      identitasDefault: trx.identitasDijaminkan,
      kategoriDefault: trx.kategoriPelanggan,
      totalRentals: 1,
      totalSpent: trx.totalPemasukan,
      ratingTrust: 5,
      lastRentalDate: trx.waktuStartSewa,
      catatanKhusus: 'Disimpan langsung dari baris transaksi'
    };
    setRenters(prev => [newCustomer, ...prev]);
    showToast(`⭐ ${trx.namaPenyewa} berhasil disimpan ke Database Penyewa Setia!`);
  };

  const handleNewRentalForCustomer = (customer: FrequentRenter) => {
    setPrefilledCustomer(customer);
    setPrefilledNopol(undefined);
    setPrefilledTipe(undefined);
    setPrefilledKategori(customer.kategoriDefault);
    setPrefilledHarga(undefined);
    setPrefilledLamaHari(1);
    setIsNewRentalOpen(true);
  };

  // WhatsApp dialog open
  const handleOpenWhatsApp = (trx: TransaksiSewa) => {
    setSelectedTrxForWA(trx);
    setIsWhatsAppOpen(true);
  };

  // Year-End Rollover & Auto-Recap Handlers
  const handleOpenYearRollover = (tab: 'rollover' | 'archives' | 'settings' = 'rollover') => {
    setYearRolloverInitialTab(tab);
    setIsYearRolloverOpen(true);
  };

  const handleExecuteYearRollover = (params: {
    closingYear: number;
    newYear: number;
    clearCompletedOldYearData: boolean;
    autoDownloadCSV: boolean;
    autoDownloadJSON: boolean;
    notes: string;
  }) => {
    const recap = generateYearlyRecapSnapshot(
      params.closingYear,
      fleet,
      transactions,
      expenses,
      false,
      params.notes
    );

    setYearlyRecaps(prev => {
      const filtered = prev.filter(r => r.year !== params.closingYear);
      return [recap, ...filtered].sort((a, b) => b.year - a.year);
    });

    if (params.autoDownloadCSV) {
      exportYearlyRecapToCSV(recap);
    }
    if (params.autoDownloadJSON) {
      exportYearlyRecapToJSON(recap);
    }

    if (params.clearCompletedOldYearData) {
      // Keep active carry-over transactions (Disewa / Booking / Overdue) and transactions not from closingYear
      setTransactions(prev =>
        prev.filter(t => {
          const y = new Date(t.waktuStartSewa).getFullYear();
          const isActiveRental = t.statusUnit === 'Disewa' || t.statusUnit === 'Booking' || t.statusUnit === 'Overdue';
          return y !== params.closingYear || isActiveRental;
        })
      );
      setExpenses(prev =>
        prev.filter(e => new Date(e.tanggal).getFullYear() !== params.closingYear)
      );
    }

    setActiveBookYear(params.newYear);
    showToast(`🎉 Tutup Buku ${params.closingYear} terekap otomatis & Tahun Buku Baru ${params.newYear} siap digunakan!`);
  };

  const handleSaveRecapSnapshotOnly = (recap: YearlyRecapArchive) => {
    setYearlyRecaps(prev => {
      const filtered = prev.filter(r => r.year !== recap.year);
      return [recap, ...filtered].sort((a, b) => b.year - a.year);
    });
    showToast(`📊 Snapshot Rekap Tahunan ${recap.year} berhasil disimpan ke Arsip!`);
  };

  const handleRestoreArchivedYearTransactions = (recap: YearlyRecapArchive) => {
    if (recap.archivedTransactions && recap.archivedTransactions.length > 0) {
      setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const toAdd = recap.archivedTransactions!.filter(t => !existingIds.has(t.id));
        return [...toAdd, ...prev];
      });
    }
    if (recap.archivedExpenses && recap.archivedExpenses.length > 0) {
      setExpenses(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const toAdd = recap.archivedExpenses!.filter(e => !existingIds.has(e.id));
        return [...toAdd, ...prev];
      });
    }
    showToast(`✅ Data transaksi & pengeluaran arsip tahun ${recap.year} berhasil dipulihkan ke tabel utama!`);
  };

  // Reset to clean production-ready state (13 units Tersedia, empty transactions/expenses/renters)
  const handleResetData = async () => {
    if (window.confirm('Reset seluruh data transaksi, pelanggan, dan pengeluaran agar kembali bersih siap pakai (13 unit motor status Tersedia)?')) {
      setFleet(INITIAL_FLEET);
      setTransactions(INITIAL_TRANSACTIONS);
      setExpenses(INITIAL_EXPENSES);
      setRenters(INITIAL_FREQUENT_RENTERS);
      setYearlyRecaps([]);
      setActiveBookYear(2026);
      localStorage.removeItem('motorent_malang_fleet_v1');
      localStorage.removeItem('motorent_malang_transactions_v1');
      localStorage.removeItem('motorent_malang_expenses_v1');
      localStorage.removeItem('motorent_malang_renters_v1');
      localStorage.removeItem('airent_active_book_year_v1');
      localStorage.removeItem('airent_yearly_recaps_v1');
      localStorage.removeItem('motorent_malang_fleet_v2');
      localStorage.removeItem('motorent_malang_transactions_v2');
      localStorage.removeItem('motorent_malang_expenses_v2');
      localStorage.removeItem('motorent_malang_renters_v2');
      localStorage.removeItem('airent_active_book_year_v2');
      localStorage.removeItem('airent_yearly_recaps_v2');
      try {
        const res = await fetch(`${getCloudApiBaseUrl()}/api/cloud-reset`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          applyServerState(data);
        }
      } catch {
        // ignore
      }
      showToast('🔄 Aplikasi telah direset bersih dan siap pakai (13 unit Tersedia).');
    }
  };

  const handleRestoreData = (backup: {
    fleet: MotorMaster[];
    transactions: TransaksiSewa[];
    expenses: PengeluaranMotor[];
    renters?: FrequentRenter[];
  }) => {
    setFleet(backup.fleet);
    setTransactions(backup.transactions);
    setExpenses(backup.expenses);
    if (backup.renters && Array.isArray(backup.renters)) {
      setRenters(backup.renters);
    }
    showToast('✅ Berhasil memulihkan data dari cadangan!');
  };

  // Manual Save Shortcut (Lokal + Cloud Server + Google Sheets if connected)
  const handleManualSave = async () => {
    setCloudStatus(prev => ({ ...prev, isSyncing: true }));
    const timeLabel = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // 1. Save immediately to LocalStorage
    try {
      localStorage.setItem('motorent_malang_fleet_v2', JSON.stringify(fleet));
      localStorage.setItem('motorent_malang_transactions_v2', JSON.stringify(transactions));
      localStorage.setItem('motorent_malang_expenses_v2', JSON.stringify(expenses));
      localStorage.setItem('motorent_malang_renters_v2', JSON.stringify(renters));
      localStorage.setItem('airent_active_book_year_v2', activeBookYear.toString());
      localStorage.setItem('airent_yearly_recaps_v2', JSON.stringify(yearlyRecaps));
      if (connectedSheetInfo) {
        localStorage.setItem('airent_connected_sheet_v1', JSON.stringify(connectedSheetInfo));
      }
    } catch {
      // ignore storage quota errors
    }

    let cloudSaved = false;
    let sheetSaved = false;

    // 2. Push immediately to Cloud Server
    try {
      const res = await fetch(`${getCloudApiBaseUrl()}/api/cloud-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleet,
          transactions,
          expenses,
          renters,
          activeBookYear,
          yearlyRecaps,
          connectedSheetInfo,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        cloudSaved = true;
        if (typeof updated.revision === 'number') {
          lastServerRevisionRef.current = updated.revision;
          setCloudStatus({
            isOnline: true,
            isSyncing: false,
            lastUpdated: updated.updatedAt || new Date().toISOString(),
            revision: updated.revision,
            connectedClients: updated.connectedClients || 1,
          });
        }
      }
    } catch {
      setCloudStatus(prev => ({ ...prev, isOnline: false }));
    }

    // 3. Also push to Google Sheets if connected and session token is active
    if (connectedSheetInfo?.spreadsheetId) {
      try {
        const { getAccessToken, pushDataToGoogleSpreadsheet } = await import('./services/googleSheetsService');
        const token = await getAccessToken();
        if (token) {
          await pushDataToGoogleSpreadsheet(token, connectedSheetInfo.spreadsheetId, {
            fleet,
            transactions,
            expenses,
            renters,
            yearlyRecaps,
            activeBookYear,
          });
          sheetSaved = true;
          const nowIso = new Date().toISOString();
          setConnectedSheetInfo(prev => (prev ? { ...prev, lastSyncedAt: nowIso } : prev));
        }
      } catch {
        // non-blocking if Google token expired
      }
    }

    setCloudStatus(prev => ({ ...prev, isSyncing: false }));

    if (cloudSaved && sheetSaved) {
      showToast(`💾 Data berhasil disimpan manual ke Lokal, Cloud & Google Sheets (${timeLabel})`);
    } else if (cloudSaved) {
      showToast(`💾 Data berhasil disimpan manual ke Lokal & Cloud Server (${timeLabel})`);
    } else {
      showToast(`💾 Data berhasil disimpan ke perangkat lokal (${timeLabel})`);
    }
  };

  // Manual Update / Refresh Shortcut (Pull latest from Cloud Server & Google Sheets if active)
  const handleManualUpdate = async () => {
    setCloudStatus(prev => ({ ...prev, isSyncing: true }));
    const timeLabel = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const cloudUpdated = await fetchLatestCloudState(true);

    if (cloudUpdated) {
      showToast(`🔄 Data berhasil diperbarui dari Cloud Server (${timeLabel} · Rev #${lastServerRevisionRef.current})`);
    } else {
      showToast(`⚠️ Mode lokal aktif — menggunakan data terakhir di perangkat (${timeLabel})`);
    }
  };

  // Quick 1-click JSON Backup Download Shortcut
  const handleQuickBackupDownload = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      activeBookYear,
      fleet,
      transactions,
      expenses,
      renters,
      yearlyRecaps,
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `airent-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 File cadangan (.json) berhasil diunduh ke perangkat Anda.');
  };

  // If app is opened as the Authorized Cloud OAuth Bridge for GitHub Pages (?auth_bridge=<sessionId>)
  const authBridgeSessionId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('auth_bridge')
      : null;

  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeSuccess, setBridgeSuccess] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  if (authBridgeSessionId) {
    const handleRunBridgeAuth = async () => {
      setBridgeLoading(true);
      setBridgeError(null);
      try {
        const { googleSignIn } = await import('./services/googleSheetsService');
        const res = await googleSignIn();
        if (res) {
          const userPayload = {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
            photoURL: res.user.photoURL,
          };
          // 1. Send directly to opener window if available
          try {
            window.opener?.postMessage(
              {
                type: 'AIRENT_GOOGLE_AUTH_BRIDGE',
                sessionId: authBridgeSessionId,
                accessToken: res.accessToken,
                idToken: res.idToken,
                user: userPayload,
              },
              '*'
            );
          } catch {
            // ignore cross-window errors
          }
          // 2. Also relay via server memory endpoint so mobile tabs receive it automatically
          try {
            await fetch(`/api/auth-bridge/${encodeURIComponent(authBridgeSessionId)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: res.accessToken,
                idToken: res.idToken,
                user: userPayload,
              }),
            });
          } catch {
            // ignore network error
          }
          setBridgeSuccess(
            `Berhasil login sebagai ${res.user.email}! Mengalihkan kembali ke halaman utama Ai Rent...`
          );
          setTimeout(() => {
            try {
              window.close();
            } catch {
              // ignore
            }
          }, 900);
        }
      } catch (err: unknown) {
        setBridgeError(err instanceof Error ? err.message : String(err));
      } finally {
        setBridgeLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 font-black text-lg">
            AI
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-extrabold text-white">
              Jembatan Otentikasi Google Resmi · Ai Rent
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Halaman ini memproses login Google Workspace (Drive &amp; Sheets) pada domain server resmi yang sudah terotorisasi Firebase, lalu mengirimkan sesi login kembali ke halaman GitHub Pages Anda secara otomatis.
            </p>
          </div>

          {bridgeSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-semibold space-y-2">
              <div>✅ {bridgeSuccess}</div>
              <div className="text-[11px] text-emerald-300/80 font-normal">
                Silakan kembali ke tab GitHub Pages Ai Rent Anda jika jendela ini tidak tertutup otomatis.
              </div>
            </div>
          ) : (
            <button
              onClick={handleRunBridgeAuth}
              disabled={bridgeLoading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              {bridgeLoading
                ? 'Menghubungkan ke Akun Google...'
                : 'Lanjutkan Masuk dengan Google'}
            </button>
          )}

          {bridgeError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs">
              {bridgeError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If app is opened by owner/investor via dedicated financial report link
  if (isInvestorPortalView) {
    return (
      <InvestorOwnerPortal
        fleet={fleet}
        transactions={transactions}
        expenses={expenses}
        onExitToAdmin={handleExitInvestorPortal}
      />
    );
  }

  // If app is opened by tenant scanning QR code on phone
  if (isMobileBookingView) {
    return (
      <TenantBookingMobileView
        fleet={fleet}
        onBookingSubmit={handleTenantBookingSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <OfflineIndicator />
      {/* Top Bar with 3-Zone Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fleetCount={fleet.length}
        activeBookingsCount={transactions.filter(t => t.statusUnit === 'Booking').length}
        activeBookYear={activeBookYear}
        isCloudOnline={cloudStatus.isOnline}
        isCloudSyncing={cloudStatus.isSyncing}
        lastCloudUpdated={cloudStatus.lastUpdated}
        cloudRevision={cloudStatus.revision}
        hasConnectedSheet={Boolean(connectedSheetInfo)}
        onOpenNewRental={() => handleOpenNewRental()}
        onManualSave={handleManualSave}
        onManualUpdate={handleManualUpdate}
        onQuickBackupDownload={handleQuickBackupDownload}
        onOpenAppsScript={() => {
          setAppsScriptInitialTab('sheets_live');
          setIsAppsScriptOpen(true);
        }}
        onOpenGitHubHosting={() => {
          setAppsScriptInitialTab('github_hosting');
          setIsAppsScriptOpen(true);
        }}
        onResetData={handleResetData}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQRCode={() => setIsQRModalOpen(true)}
        onOpenInvestorShare={() => setIsInvestorShareOpen(true)}
        onOpenManageFleet={handleOpenManageFleetModal}
        onOpenYearRollover={() => handleOpenYearRollover('rollover')}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        
        {activeTab === 'fleet' && (
          <FleetGrid
            fleet={fleet}
            transactions={transactions}
            onCheckIn={handleCheckInByNopol}
            onCheckOut={handleCheckOutByNopol}
            onNewRentalForBike={handleOpenNewRental}
            onOpenWhatsApp={handleOpenWhatsApp}
            onNewExpenseForBike={handleOpenNewExpense}
            heroBannerImg={fleetHeroBanner}
            onOpenQRCode={() => setIsQRModalOpen(true)}
            onOpenAddBike={handleOpenAddBikeModal}
            onOpenEditBike={handleOpenEditBikeModal}
            onDeleteBike={handleDeleteBike}
            onOpenManageFleet={handleOpenManageFleetModal}
          />
        )}

        {activeTab === 'kalender' && (
          <RentalScheduleCalendar
            fleet={fleet}
            transactions={transactions}
            frequentRenters={renters}
            activeBookYear={activeBookYear}
            onCheckInRow={handleCheckInByTrxId}
            onCheckOutRow={handleCheckOutByTrxId}
            onOpenWhatsApp={handleOpenWhatsApp}
            onOpenNewRentalOnDate={handleOpenNewRentalOnDate}
          />
        )}

        {activeTab === 'transaksi' && (
          <TransactionsTable
            transactions={transactions}
            fleet={fleet}
            frequentRenters={renters}
            activeBookYear={activeBookYear}
            onCheckInRow={handleCheckInByTrxId}
            onCheckOutRow={handleCheckOutByTrxId}
            onOpenWhatsApp={handleOpenWhatsApp}
            onRefundTransaction={handleRefundTransaction}
            onOpenNewRental={() => handleOpenNewRental()}
            onSaveCustomerToDatabase={handleSaveCustomerFromTrx}
            onOpenYearRollover={() => handleOpenYearRollover('rollover')}
          />
        )}

        {activeTab === 'pelanggan' && (
          <FrequentRentersDatabase
            renters={renters}
            onAddRenter={handleAddRenter}
            onUpdateRenter={handleUpdateRenter}
            onDeleteRenter={handleDeleteRenter}
            onSyncFromTransactions={handleSyncFromTransactions}
            onNewRentalForCustomer={handleNewRentalForCustomer}
          />
        )}

        {activeTab === 'tarif' && (
          <TarifReferenceTable
            onApplyTarifToNewRental={handleApplyTarifToNewRental}
          />
        )}

        {activeTab === 'pengeluaran' && (
          <ExpensesTable
            expenses={expenses}
            fleet={fleet}
            activeBookYear={activeBookYear}
            onOpenNewExpense={handleOpenNewExpense}
            onDeleteExpense={handleDeleteExpense}
            onOpenYearRollover={() => handleOpenYearRollover('rollover')}
          />
        )}

        {activeTab === 'laporan' && (
          <PerformanceReport
            fleet={fleet}
            transactions={transactions}
            expenses={expenses}
            activeBookYear={activeBookYear}
            yearlyRecaps={yearlyRecaps}
            onOpenYearRollover={handleOpenYearRollover}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 pt-5 pb-24 lg:pb-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {activeBookYear} Ai Rent · Sistem Manajemen Rental Motor ({fleet.length} Fleet Unit · Tahun Buku {activeBookYear})
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => handleOpenYearRollover('rollover')}
              className="hover:text-emerald-400 transition-colors font-medium cursor-pointer"
            >
              Pergantian Tahun &amp; Rekap Otomatis
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAppsScriptOpen(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Google Apps Script Source
            </button>
            <span>·</span>
            <button
              onClick={handleResetData}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 border border-cyan-500/80 text-white text-xs px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <NewTransactionModal
        isOpen={isNewRentalOpen}
        onClose={() => setIsNewRentalOpen(false)}
        onSave={handleSaveTransaction}
        fleet={fleet}
        activeBookYear={activeBookYear}
        frequentRenters={renters}
        prefilledCustomer={prefilledCustomer}
        prefilledNopol={prefilledNopol}
        prefilledTipe={prefilledTipe}
        prefilledKategori={prefilledKategori}
        prefilledHarga={prefilledHarga}
        prefilledLamaHari={prefilledLamaHari}
        prefilledStartDate={prefilledStartDate}
        prefilledStatusUnit={prefilledStatusUnit}
      />

      <NewExpenseModal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        onSave={handleSaveExpense}
        fleet={fleet}
        activeBookYear={activeBookYear}
        prefilledNopol={prefilledExpenseNopol}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        transaction={selectedTrxForWA}
        fleet={fleet}
      />

      <AppsScriptModal
        isOpen={isAppsScriptOpen}
        onClose={() => setIsAppsScriptOpen(false)}
        initialTab={appsScriptInitialTab}
        fleet={fleet}
        transactions={transactions}
        expenses={expenses}
        renters={renters}
        yearlyRecaps={yearlyRecaps}
        activeBookYear={activeBookYear}
        connectedSheetInfo={connectedSheetInfo}
        onUpdateConnectedSheet={(info) => {
          setConnectedSheetInfo(info);
        }}
        cloudStatus={cloudStatus}
        onForceCloudSync={async () => {
          await fetchLatestCloudState(true);
        }}
        onRestoreData={handleRestoreData}
      />

      <TenantSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        renters={renters}
        transactions={transactions}
        fleet={fleet}
        onSelectCustomerForRental={handleNewRentalForCustomer}
        onOpenWhatsApp={handleOpenWhatsApp}
        onSaveCustomerToDatabase={handleSaveCustomerFromTrx}
        onOpenNewRentalWithInfo={handleOpenNewRentalWithInfo}
      />

      <BookingQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onOpenMobilePreview={() => setIsMobileBookingView(true)}
      />

      <InvestorShareModal
        isOpen={isInvestorShareOpen}
        onClose={() => setIsInvestorShareOpen(false)}
        onOpenInvestorPortal={() => setIsInvestorPortalView(true)}
      />

      <FleetManagementModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        fleet={fleet}
        initialEditBike={editingBikeForModal}
        initialView={fleetModalInitialView}
        onAddBike={handleAddBike}
        onUpdateBike={handleUpdateBike}
        onDeleteBike={handleDeleteBike}
      />

      <YearEndRolloverModal
        isOpen={isYearRolloverOpen}
        onClose={() => setIsYearRolloverOpen(false)}
        activeBookYear={activeBookYear}
        onChangeActiveBookYear={(yr) => {
          setActiveBookYear(yr);
          showToast(`📅 Tahun Buku Aktif berhasil diubah ke Tahun ${yr}.`);
        }}
        fleet={fleet}
        transactions={transactions}
        expenses={expenses}
        yearlyRecaps={yearlyRecaps}
        onExecuteYearRollover={handleExecuteYearRollover}
        onSaveRecapSnapshotOnly={handleSaveRecapSnapshotOnly}
        onRestoreArchivedYearTransactions={handleRestoreArchivedYearTransactions}
        initialTab={yearRolloverInitialTab}
      />

    </div>
  );
}
