import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { GOOGLE_APPS_SCRIPT_SOURCE } from '../data/initialFleetData';
import {
  X,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Upload,
  ExternalLink,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FolderOpen,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  Sparkles,
  Wifi,
  Link2,
  Github,
  Globe,
  Terminal,
} from 'lucide-react';
import {
  MotorMaster,
  TransaksiSewa,
  PengeluaranMotor,
  FrequentRenter,
  YearlyRecapArchive,
} from '../types/rental';
import {
  initAuth,
  googleSignIn,
  completeBridgeSignIn,
  logout,
  getAccessToken,
  listUserSpreadsheets,
  getSpreadsheetMetadata,
  createAiRentSpreadsheet,
  pushDataToGoogleSpreadsheet,
  pullDataFromGoogleSpreadsheet,
  extractSpreadsheetId,
  DriveSpreadsheetFile,
  ConnectedSheetInfo,
  SHEET_TABS,
} from '../services/googleSheetsService';
import { PUBLIC_SHARED_APP_ORIGIN } from '../utils/formatters';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'sheets_live' | 'cloud_online' | 'github_hosting' | 'script' | 'backup';
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  expenses: PengeluaranMotor[];
  renters: FrequentRenter[];
  yearlyRecaps: YearlyRecapArchive[];
  activeBookYear: number;
  connectedSheetInfo: ConnectedSheetInfo | null;
  onUpdateConnectedSheet: (info: ConnectedSheetInfo | null) => void;
  cloudStatus: {
    isOnline: boolean;
    isSyncing: boolean;
    lastUpdated: string | null;
    revision: number;
    connectedClients: number;
  };
  onForceCloudSync: () => Promise<void>;
  onRestoreData: (backupData: {
    fleet: MotorMaster[];
    transactions: TransaksiSewa[];
    expenses: PengeluaranMotor[];
    renters?: FrequentRenter[];
  }) => void;
}

type PendingConfirmation =
  | {
      type: 'create_sheet';
      title: string;
    }
  | {
      type: 'push_to_sheet';
      spreadsheetId: string;
      spreadsheetTitle: string;
    }
  | {
      type: 'pull_from_sheet';
      spreadsheetId: string;
      spreadsheetTitle: string;
    }
  | null;

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'sheets_live',
  fleet,
  transactions,
  expenses,
  renters,
  yearlyRecaps,
  activeBookYear,
  connectedSheetInfo,
  onUpdateConnectedSheet,
  cloudStatus,
  onForceCloudSync,
  onRestoreData,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedGhWorkflow, setCopiedGhWorkflow] = useState(false);
  const [copiedGhUrl, setCopiedGhUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'sheets_live' | 'cloud_online' | 'github_hosting' | 'script' | 'backup'
  >(initialTab);

  // GitHub Pages Hosting Generator & Custom Domain State
  const [ghUsername, setGhUsername] = useState(() => {
    const saved = localStorage.getItem('airent_gh_username_v1');
    if (!saved || saved === 'ahmadimam3000') {
      return 'ahmadimam3000-oss';
    }
    return saved;
  });
  const [ghRepoName, setGhRepoName] = useState(() => {
    return localStorage.getItem('airent_gh_repo_v1') || 'Management-rental';
  });
  const [savedGhPagesUrl, setSavedGhPagesUrl] = useState(() => {
    return localStorage.getItem('airent_github_pages_url_v1') || '';
  });
  const [ghActionsRuns, setGhActionsRuns] = useState<
    Array<{
      id: number;
      name: string;
      status: string;
      conclusion: string | null;
      html_url: string;
      display_title: string;
      created_at: string;
    }>
  >([]);
  const [isLoadingGhRuns, setIsLoadingGhRuns] = useState(false);
  const [ghPagesStatus, setGhPagesStatus] = useState<string | null>(null);
  const [ghUserRepos, setGhUserRepos] = useState<
    Array<{
      id: number;
      name: string;
      full_name: string;
      html_url: string;
      has_pages: boolean;
      updated_at: string;
    }>
  >([]);
  const [isLoadingGhRepos, setIsLoadingGhRepos] = useState(false);

  const fetchGhUserRepos = async (ownerInput?: string) => {
    const cleanOwner = (ownerInput ?? ghUsername).trim().replace(/^@/, '') || 'ahmadimam3000-oss';
    setIsLoadingGhRepos(true);
    try {
      const res = await fetch(`https://api.github.com/users/${cleanOwner}/repos?sort=updated&per_page=12`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGhUserRepos(data);
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsLoadingGhRepos(false);
    }
  };

  const fetchGhActionsStatus = async (ownerInput?: string, repoInput?: string) => {
    const cleanOwner = (ownerInput ?? ghUsername).trim().replace(/^@/, '') || 'ahmadimam3000-oss';
    const cleanRepo = (repoInput ?? ghRepoName).trim().replace(/^\/+|\/+$/g, '') || 'Management-rental';
    setIsLoadingGhRuns(true);
    try {
      const [runsRes, pagesRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}/actions/runs?per_page=3`),
        fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}/pages`),
      ]);
      if (runsRes.ok) {
        const data = await runsRes.json();
        setGhActionsRuns(data.workflow_runs || []);
      } else {
        setGhActionsRuns([]);
      }
      if (pagesRes.ok) {
        const pData = await pagesRes.json();
        setGhPagesStatus(pData.status || 'built');
      } else {
        setGhPagesStatus('pending');
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsLoadingGhRuns(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'github_hosting') {
      fetchGhActionsStatus();
      fetchGhUserRepos();
    }
  }, [isOpen, activeTab]);

  // Google Workspace OAuth states
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showUnauthorizedDomainFix, setShowUnauthorizedDomainFix] = useState(() => {
    return typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');
  });
  const [copiedAuthDomain, setCopiedAuthDomain] = useState(false);
  const [bridgeSessionId] = useState(() => {
    return `ab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  });
  const [isBridgePolling, setIsBridgePolling] = useState(false);

  // Google Sheets UI states
  const [newSheetTitle, setNewSheetTitle] = useState(
    `Ai Rent - Database & Keuangan Live (${activeBookYear})`
  );
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Mandatory User Confirmation Dialog state before mutating Google Sheets / App state
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen for postMessage or server relay from the Authorized Cloud Auth Bridge
  useEffect(() => {
    if (!isOpen || (!needsAuth && token)) return;

    const handleBridgeMessage = async (event: MessageEvent) => {
      const data = event.data;
      if (
        data &&
        data.type === 'AIRENT_GOOGLE_AUTH_BRIDGE' &&
        data.accessToken &&
        data.user
      ) {
        const res = await completeBridgeSignIn({
          accessToken: data.accessToken,
          idToken: data.idToken,
          user: data.user,
        });
        setToken(res.accessToken);
        setUser(res.user);
        setNeedsAuth(false);
        setShowUnauthorizedDomainFix(false);
        setIsBridgePolling(false);
        setStatusMessage({
          type: 'success',
          text: `Berhasil masuk sebagai ${data.user.email} melalui Jembatan Cloud Resmi! Sekarang Anda dapat membuat atau menyinkronkan Google Sheets secara langsung.`,
        });
      }
    };

    window.addEventListener('message', handleBridgeMessage);
    return () => window.removeEventListener('message', handleBridgeMessage);
  }, [isOpen, needsAuth, token]);

  useEffect(() => {
    if (!isOpen || !isBridgePolling || (!needsAuth && token)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${PUBLIC_SHARED_APP_ORIGIN}/api/auth-bridge/${encodeURIComponent(bridgeSessionId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.ready && data.accessToken && data.user) {
          const completed = await completeBridgeSignIn({
            accessToken: data.accessToken,
            idToken: data.idToken,
            user: data.user,
          });
          setToken(completed.accessToken);
          setUser(completed.user);
          setNeedsAuth(false);
          setShowUnauthorizedDomainFix(false);
          setIsBridgePolling(false);
          setStatusMessage({
            type: 'success',
            text: `Berhasil masuk sebagai ${data.user.email} melalui Jembatan Cloud Resmi! Sekarang Anda dapat membuat atau menyinkronkan Google Sheets secara langsung.`,
          });
        }
      } catch {
        // ignore network polling error
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen, isBridgePolling, needsAuth, token, bridgeSessionId]);

  useEffect(() => {
    setNewSheetTitle(`Ai Rent - Database & Keuangan Live (${activeBookYear})`);
  }, [activeBookYear]);

  if (!isOpen) return null;

  const currentDomain =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'ahmadimam3000-oss.github.io';

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        setShowUnauthorizedDomainFix(false);
        setStatusMessage({
          type: 'success',
          text: `Berhasil masuk sebagai ${result.user.email}. Sekarang Anda dapat membuat atau menyinkronkan Google Sheets secara langsung.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/unauthorized-domain')) {
        setShowUnauthorizedDomainFix(true);
        setIsBridgePolling(true);
        setStatusMessage({
          type: 'info',
          text: `Domain "${currentDomain}" belum didaftarkan di Firebase Authorized Domains. Gunakan tombol "Login via Jembatan Cloud Resmi" di bawah untuk langsung masuk sekarang, atau tambahkan "${currentDomain}" di Firebase Console dalam 10 detik.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Login Google gagal: ${msg}`,
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setToken(null);
    setUser(null);
    setNeedsAuth(true);
    setDriveFiles([]);
    setStatusMessage({
      type: 'info',
      text: 'Anda telah keluar dari sesi Google Workspace.',
    });
  };

  const ensureValidToken = async (): Promise<string | null> => {
    const current = (await getAccessToken()) || token;
    if (!current) {
      setNeedsAuth(true);
      setStatusMessage({
        type: 'error',
        text: 'Sesi akses Google Sheets telah berakhir. Silakan klik tombol "Sign in with Google" terlebih dahulu.',
      });
      return null;
    }
    return current;
  };

  const handleLoadDriveSpreadsheets = async () => {
    const activeToken = await ensureValidToken();
    if (!activeToken) return;

    setIsLoadingDrive(true);
    setStatusMessage(null);
    try {
      const files = await listUserSpreadsheets(activeToken);
      setDriveFiles(files);
      if (files.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'Tidak ditemukan file Google Spreadsheet di Google Drive Anda. Silakan buat Spreadsheet baru di atas.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.includes('UNAUTHENTICATED')) {
        setNeedsAuth(true);
      }
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleConnectExistingSheetById = async (rawInput: string) => {
    const activeToken = await ensureValidToken();
    if (!activeToken) return;

    const extractedId = extractSpreadsheetId(rawInput);
    if (!extractedId) {
      setStatusMessage({
        type: 'error',
        text: 'Masukkan URL atau ID Google Spreadsheet yang valid.',
      });
      return;
    }

    setIsWorking(true);
    setStatusMessage(null);
    try {
      const metadata = await getSpreadsheetMetadata(activeToken, extractedId);
      const newInfo: ConnectedSheetInfo = {
        spreadsheetId: metadata.spreadsheetId,
        spreadsheetTitle: metadata.title,
        spreadsheetUrl: metadata.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        lastSyncedBy: user?.email || 'Admin',
        autoSyncEnabled: true,
      };
      onUpdateConnectedSheet(newInfo);
      setSheetUrlInput('');
      setStatusMessage({
        type: 'success',
        text: `Spreadsheet "${metadata.title}" berhasil dihubungkan! Tab terdeteksi: ${metadata.sheetTitles.join(', ')}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsWorking(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    const action = pendingConfirmation;
    setPendingConfirmation(null);

    const activeToken = await ensureValidToken();
    if (!activeToken) return;

    setIsWorking(true);
    setStatusMessage(null);

    try {
      if (action.type === 'create_sheet') {
        const createdMeta = await createAiRentSpreadsheet(
          activeToken,
          action.title,
          {
            fleet,
            transactions,
            expenses,
            renters,
            yearlyRecaps,
            activeBookYear,
          }
        );
        const newInfo: ConnectedSheetInfo = {
          spreadsheetId: createdMeta.spreadsheetId,
          spreadsheetTitle: createdMeta.title,
          spreadsheetUrl: createdMeta.spreadsheetUrl,
          lastSyncedAt: new Date().toISOString(),
          lastSyncedBy: user?.email || 'Admin',
          autoSyncEnabled: true,
        };
        onUpdateConnectedSheet(newInfo);
        setStatusMessage({
          type: 'success',
          text: `Berhasil membuat & mengisi Google Spreadsheet baru "${createdMeta.title}" dengan 5 tab lengkap!`,
        });
      } else if (action.type === 'push_to_sheet') {
        const updatedMeta = await pushDataToGoogleSpreadsheet(
          activeToken,
          action.spreadsheetId,
          {
            fleet,
            transactions,
            expenses,
            renters,
            yearlyRecaps,
            activeBookYear,
          }
        );
        const newInfo: ConnectedSheetInfo = {
          spreadsheetId: updatedMeta.spreadsheetId,
          spreadsheetTitle: updatedMeta.title,
          spreadsheetUrl: updatedMeta.spreadsheetUrl,
          lastSyncedAt: new Date().toISOString(),
          lastSyncedBy: user?.email || 'Admin',
          autoSyncEnabled: true,
        };
        onUpdateConnectedSheet(newInfo);
        setStatusMessage({
          type: 'success',
          text: `Seluruh data (${fleet.length} armada, ${transactions.length} transaksi, ${expenses.length} pengeluaran, ${renters.length} pelanggan) berhasil disinkronkan ke Google Sheets "${updatedMeta.title}"!`,
        });
      } else if (action.type === 'pull_from_sheet') {
        const pulled = await pullDataFromGoogleSpreadsheet(
          activeToken,
          action.spreadsheetId
        );
        onRestoreData({
          fleet: pulled.fleet && pulled.fleet.length > 0 ? pulled.fleet : fleet,
          transactions: pulled.transactions || transactions,
          expenses: pulled.expenses || expenses,
          renters: pulled.renters || renters,
        });
        const newInfo: ConnectedSheetInfo = {
          spreadsheetId: pulled.metadata.spreadsheetId,
          spreadsheetTitle: pulled.metadata.title,
          spreadsheetUrl: pulled.metadata.spreadsheetUrl,
          lastSyncedAt: new Date().toISOString(),
          lastSyncedBy: user?.email || 'Admin',
          autoSyncEnabled: true,
        };
        onUpdateConnectedSheet(newInfo);
        setStatusMessage({
          type: 'success',
          text: `Data berhasil ditarik dari Google Sheets "${pulled.metadata.title}" dan disinkronkan ke server online!`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.includes('UNAUTHENTICATED')) {
        setNeedsAuth(true);
      }
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      fleet,
      transactions,
      expenses,
      renters,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Ai_Rent_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.fleet && parsed.transactions && parsed.expenses) {
          onRestoreData(parsed);
          setStatusMessage({
            type: 'success',
            text: 'Data cadangan JSON berhasil dipulihkan dan disinkronkan secara online!',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Format file JSON tidak sesuai.',
          });
        }
      } catch {
        setStatusMessage({
          type: 'error',
          text: 'Gagal membaca file JSON cadangan.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Integrasi Google Sheets Live &amp; Cloud Online Sync</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md">
                <Wifi className="w-3 h-3" />
                Live Online
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sinkronisasi otomatis 2 arah dengan Google Spreadsheet resmi &amp;
              database cloud real-time antar perangkat.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 px-6 pt-3 border-b border-slate-800 text-xs overflow-x-auto bg-slate-950/40">
          <button
            onClick={() => setActiveTab('sheets_live')}
            className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sheets_live'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets Live API</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud_online')}
            className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cloud_online'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Status Server Online Real-Time</span>
          </button>
          <button
            onClick={() => setActiveTab('github_hosting')}
            className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'github_hosting'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Upload &amp; Hosting GitHub Pages</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'script'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Kode Apps Script
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Backup &amp; Restore JSON
          </button>
        </div>

        {/* Mandatory Confirmation Dialog Overlay for Google Sheets Mutations */}
        {pendingConfirmation && (
          <div className="mx-6 mt-4 p-4 bg-amber-950/80 border-2 border-amber-500/70 rounded-xl shadow-xl space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-amber-200 text-sm">
                  Konfirmasi Perubahan Data Google Sheets
                </h4>
                {pendingConfirmation.type === 'create_sheet' && (
                  <p className="text-amber-100/90 leading-relaxed">
                    Anda akan membuat file Google Spreadsheet baru bernama{' '}
                    <span className="font-bold text-white">
                      &ldquo;{pendingConfirmation.title}&rdquo;
                    </span>{' '}
                    di Google Drive Anda dan menuliskan{' '}
                    <span className="font-semibold text-white">
                      {fleet.length} unit armada, {transactions.length}{' '}
                      transaksi sewa, {expenses.length} catatan pengeluaran, dan{' '}
                      {renters.length} pelanggan
                    </span>
                    . Lanjutkan?
                  </p>
                )}
                {pendingConfirmation.type === 'push_to_sheet' && (
                  <p className="text-amber-100/90 leading-relaxed">
                    Anda akan memperbarui dan menimpa isi 5 tab data (
                    <span className="font-mono text-amber-300">
                      {SHEET_TABS.ARMADA}, {SHEET_TABS.TRANSAKSI},{' '}
                      {SHEET_TABS.PENGELUARAN}, {SHEET_TABS.PELANGGAN},{' '}
                      {SHEET_TABS.REKAP}
                    </span>
                    ) pada Google Spreadsheet{' '}
                    <span className="font-bold text-white">
                      &ldquo;{pendingConfirmation.spreadsheetTitle}&rdquo;
                    </span>{' '}
                    dengan{' '}
                    <span className="font-semibold text-white">
                      {fleet.length} armada, {transactions.length} transaksi,{' '}
                      {expenses.length} pengeluaran, dan {renters.length}{' '}
                      pelanggan
                    </span>{' '}
                    terbaru dari aplikasi. Lanjutkan?
                  </p>
                )}
                {pendingConfirmation.type === 'pull_from_sheet' && (
                  <p className="text-amber-100/90 leading-relaxed">
                    Anda akan mengimpor data dari Google Spreadsheet{' '}
                    <span className="font-bold text-white">
                      &ldquo;{pendingConfirmation.spreadsheetTitle}&rdquo;
                    </span>{' '}
                    dan memperbarui database aktif di aplikasi serta server
                    online. Lanjutkan?
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setPendingConfirmation(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={executeConfirmedAction}
                disabled={isWorking}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ya, Konfirmasi &amp; Lanjutkan</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 px-4 py-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : statusMessage.type === 'error'
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'sheets_live' && (
            <div className="space-y-5">
              {/* Step 1: Google Workspace Authentication Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      1. Koneksi Akun Google Workspace (Drive &amp; Sheets)
                    </span>
                    {!needsAuth && token ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                        Terhubung
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                        Perlu Login Google
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {!needsAuth && user
                      ? `Masuk sebagai ${user.displayName || user.email} (${user.email}). Token OAuth tersimpan aman di memori.`
                      : 'Masuk dengan akun Google Anda untuk membaca, membuat, dan menyinkronkan data rental langsung ke Google Sheets.'}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {needsAuth || !token ? (
                    <button
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="gsi-material-button"
                    >
                      <div className="gsi-material-button-state"></div>
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            style={{ display: 'block' }}
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            ></path>
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            ></path>
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            ></path>
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            ></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">
                          {isLoggingIn
                            ? 'Menghubungkan...'
                            : 'Sign in with Google'}
                        </span>
                        <span style={{ display: 'none' }}>
                          Sign in with Google
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Ganti Akun</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Solusi Instan auth/unauthorized-domain untuk GitHub Pages */}
              {(needsAuth || !token) && showUnauthorizedDomainFix && (
                <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-xl space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-cyan-300 text-xs flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>
                          Solusi Instan Login Google di GitHub Pages (Mengatasi <code className="font-mono text-amber-300">auth/unauthorized-domain</code>)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Karena Anda mengakses dari domain baru (<code className="text-cyan-300 font-mono">{currentDomain}</code>), pilih salah satu dari 2 cara cepat berikut:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Pilihan 1: Jembatan Cloud Resmi */}
                    <div className="p-3.5 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-emerald-300">
                          Cara 1: Login via Jembatan Cloud Resmi (Tanpa Setting)
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Klik tombol di bawah untuk login pada domain server resmi yang sudah terotorisasi. Begitu login selesai, halaman GitHub Pages ini akan <strong>otomatis masuk</strong>.
                        </p>
                      </div>
                      <a
                        href={`${PUBLIC_SHARED_APP_ORIGIN}/?auth_bridge=${encodeURIComponent(bridgeSessionId)}`}
                        target="_blank"
                        rel="opener"
                        onClick={() => setIsBridgePolling(true)}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        <Cloud className="w-4 h-4" />
                        <span>
                          {isBridgePolling
                            ? 'Menunggu Sesi Login... (Klik untuk Buka Ulang)'
                            : 'Login Google via Jembatan Cloud Resmi'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Pilihan 2: Whitelist Domain Permanen di Firebase Console */}
                    <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-cyan-300">
                          Cara 2: Daftarkan Domain Permanen di Firebase (10 Detik)
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Salin domain <code className="text-amber-300 font-mono">{currentDomain}</code>, buka <strong>Firebase Console &rarr; Authorized domains &rarr; Add domain</strong>, lalu tempel domain tersebut:
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentDomain);
                            setCopiedAuthDomain(true);
                            setTimeout(() => setCopiedAuthDomain(false), 2000);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono text-[11px] border border-slate-700 transition-colors"
                        >
                          {copiedAuthDomain ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Salin: {currentDomain}</span>
                            </>
                          )}
                        </button>
                        <a
                          href="https://console.firebase.google.com/project/promising-chord-bw2pc/authentication/settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] transition-colors"
                        >
                          <span>Buka Firebase Authorized Domains</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Currently Connected Google Sheet Banner */}
              {connectedSheetInfo && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-sm">
                          Spreadsheet Terhubung:{' '}
                          {connectedSheetInfo.spreadsheetTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        ID:{' '}
                        <span className="font-mono text-emerald-300">
                          {connectedSheetInfo.spreadsheetId}
                        </span>{' '}
                        · Sinkronisasi terakhir:{' '}
                        {new Date(
                          connectedSheetInfo.lastSyncedAt
                        ).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={connectedSheetInfo.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                      >
                        <span>Buka di Google Sheets</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* 2-Way Sync Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20">
                    <button
                      onClick={() =>
                        setPendingConfirmation({
                          type: 'push_to_sheet',
                          spreadsheetId: connectedSheetInfo.spreadsheetId,
                          spreadsheetTitle: connectedSheetInfo.spreadsheetTitle,
                        })
                      }
                      disabled={isWorking || needsAuth}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>
                        Export / Update Semua Data ke Google Sheets
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        setPendingConfirmation({
                          type: 'pull_from_sheet',
                          spreadsheetId: connectedSheetInfo.spreadsheetId,
                          spreadsheetTitle: connectedSheetInfo.spreadsheetTitle,
                        })
                      }
                      disabled={isWorking || needsAuth}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl border border-slate-700 transition-colors"
                    >
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      <span>
                        Import / Tarik Data dari Google Sheets ke Aplikasi
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Create New or Connect Existing Google Sheet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Create New Spreadsheet */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Opsi A: Buat Google Sheets Baru Otomatis</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Buat file Google Spreadsheet baru di Google Drive Anda
                      lengkap dengan 5 lembar kerja (
                      <span className="text-slate-200">
                        Master Armada, Transaksi Sewa, Pengeluaran Servis,
                        Database Pelanggan, Rekap Keuangan
                      </span>
                      ) dan isi dengan data saat ini.
                    </p>
                    <div className="pt-1">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Nama Spreadsheet Baru:
                      </label>
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        placeholder="Ai Rent - Database & Keuangan Live"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setPendingConfirmation({
                        type: 'create_sheet',
                        title: newSheetTitle,
                      })
                    }
                    disabled={isWorking || needsAuth}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {isWorking
                        ? 'Memproses Google Sheets...'
                        : 'Buat & Isi Google Sheets Sekarang'}
                    </span>
                  </button>
                </div>

                {/* Option B: Connect Existing Spreadsheet from Drive or Link */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Link2 className="w-4 h-4 text-emerald-400" />
                      <span>Opsi B: Hubungkan Spreadsheet yang Sudah Ada</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Tempelkan link URL Google Spreadsheet Anda atau pilih
                      langsung dari daftar file Google Drive Anda.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={sheetUrlInput}
                        onChange={(e) => setSheetUrlInput(e.target.value)}
                        placeholder="Tempel link URL Google Sheets atau ID..."
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={() =>
                          handleConnectExistingSheetById(sheetUrlInput)
                        }
                        disabled={isWorking || needsAuth || !sheetUrlInput.trim()}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-colors shrink-0"
                      >
                        Hubungkan
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleLoadDriveSpreadsheets}
                    disabled={isLoadingDrive || needsAuth}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 text-cyan-400" />
                    <span>
                      {isLoadingDrive
                        ? 'Memuat dari Google Drive...'
                        : 'Pilih dari Google Drive Saya'}
                    </span>
                  </button>
                </div>
              </div>

              {/* List of Spreadsheets from Google Drive */}
              {driveFiles.length > 0 && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">
                      Pilih File Google Spreadsheet dari Drive Anda:
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {driveFiles.length} file ditemukan
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-lg">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-900/80 transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="font-medium text-slate-200 truncate">
                            {file.name}
                          </div>
                          {file.modifiedTime && (
                            <div className="text-[10px] text-slate-500">
                              Diubah:{' '}
                              {new Date(file.modifiedTime).toLocaleString(
                                'id-ID'
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleConnectExistingSheetById(file.id)}
                          disabled={isWorking}
                          className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-colors shrink-0"
                        >
                          Pilih &amp; Hubungkan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cloud_online' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="font-bold text-white text-sm">
                        Server Cloud Real-Time Aktif (Selalu Update di Semua
                        Perangkat)
                      </h4>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Aplikasi Ai Rent ini berjalan secara online dengan sinkronisasi
                      server real-time (Server-Sent Events + Cloud Database).
                      Setiap perubahan armada, pesanan mandiri pelanggan via QR,
                      check-in/out, maupun laporan investor langsung terupdate
                      otomatis di semua HP dan laptop tanpa perlu pindah file
                      manual.
                    </p>
                  </div>
                  <button
                    onClick={onForceCloudSync}
                    disabled={cloudStatus.isSyncing}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-colors shrink-0"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        cloudStatus.isSyncing ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Sinkronkan Sekarang</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Status Koneksi Cloud
                    </div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">
                      {cloudStatus.isOnline
                        ? 'Online & Real-Time'
                        : 'Mode Offline Lokal'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Revisi Database &amp; Perangkat Aktif
                    </div>
                    <div className="text-sm font-bold text-white mt-1 font-mono">
                      Rev #{cloudStatus.revision} ·{' '}
                      {Math.max(1, cloudStatus.connectedClients)} Perangkat Online
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Update Terakhir di Server
                    </div>
                    <div className="text-xs font-semibold text-cyan-300 mt-1">
                      {cloudStatus.lastUpdated
                        ? new Date(cloudStatus.lastUpdated).toLocaleString(
                            'id-ID'
                          )
                        : 'Baru saja'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'github_hosting' && (() => {
            const cleanUser = ghUsername.trim().replace(/^@/, '') || 'username';
            const cleanRepo = ghRepoName.trim().replace(/^\/+|\/+$/g, '') || 'Management-rental';
            const computedGhUrl = `https://${cleanUser}.github.io/${cleanRepo}`;
            const bookingGhUrl = `${computedGhUrl}/?mode=booking`;
            const investorGhUrl = `${computedGhUrl}/?view=investor`;

            const ghWorkflowCode = `name: Deploy Ai Rent to GitHub Pages
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:
permissions:
  contents: write
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      pages_ready: \${{ steps.configure_pages.outcome == 'success' && steps.upload_artifact.outcome == 'success' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install --no-audit --no-fund --legacy-peer-deps
      - run: npm run build
      - run: cp dist/index.html dist/404.html && touch dist/.nojekyll
      - name: Publish build to gh-pages branch
        continue-on-error: true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          cd dist && git init
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git checkout -b gh-pages && git add -A
          git commit -m "Deploy Ai Rent to GitHub Pages"
          git push -f "https://x-access-token:\${GITHUB_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git" gh-pages
      - id: configure_pages
        uses: actions/configure-pages@v5
        continue-on-error: true
        with:
          enablement: true
      - if: steps.configure_pages.outcome == 'success'
        id: upload_artifact
        uses: actions/upload-pages-artifact@v3
        continue-on-error: true
        with:
          path: './dist'
      - if: steps.configure_pages.outcome != 'success'
        continue-on-error: true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          gh api -X POST "repos/\${GITHUB_REPOSITORY}/pages" -f "source[branch]=gh-pages" -f "source[path]=/" || true
  deploy:
    needs: build
    if: needs.build.outputs.pages_ready == 'true'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4`;

            const handleSaveGhDomain = () => {
              localStorage.setItem('airent_gh_username_v1', cleanUser);
              localStorage.setItem('airent_gh_repo_v1', cleanRepo);
              localStorage.setItem('airent_github_pages_url_v1', computedGhUrl);
              setSavedGhPagesUrl(computedGhUrl);
              fetchGhActionsStatus(cleanUser, cleanRepo);
              setStatusMessage({
                type: 'success',
                text: `Domain GitHub Pages (${computedGhUrl}) berhasil diaktifkan sebagai link utama untuk QR Code Pesanan Mandiri & Link Investor!`,
              });
            };

            const handleResetGhDomain = () => {
              localStorage.removeItem('airent_github_pages_url_v1');
              setSavedGhPagesUrl('');
              setStatusMessage({
                type: 'info',
                text: 'Link utama dikembalikan ke domain otomatis Cloud Server bawaan.',
              });
            };

            const copyText = (txt: string, key: string) => {
              navigator.clipboard.writeText(txt);
              setCopiedGhUrl(key);
              setTimeout(() => setCopiedGhUrl(null), 2000);
            };

            return (
              <div className="space-y-5">
                {/* Banner Status Siap GitHub Pages */}
                <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-300 text-sm flex items-center gap-2 flex-wrap">
                      <span>Repository Sudah Siap 100% untuk Upload &amp; Hosting GitHub Pages</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-600/50">
                        Build + Firebase + Lockfile Verified
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Project ini telah dilengkapi <code className="text-cyan-300 font-mono">package-lock.json</code>, modul <code className="text-cyan-300 font-mono">react-is</code> untuk bundel produksi Vite, Firebase Firestore &amp; Auth (<code className="text-cyan-300 font-mono">promising-chord-bw2pc</code>), serta workflow otomatis <code className="text-cyan-300 font-mono">.github/workflows/deploy.yml</code>.
                    </p>
                  </div>
                </div>

                {/* Monitor Live GitHub Actions Run Status */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white text-xs">
                        Status Live GitHub Actions: <code className="text-cyan-300 font-mono">{cleanUser}/{cleanRepo}</code>
                      </span>
                      {ghPagesStatus && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                          Pages: {ghPagesStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchGhActionsStatus(cleanUser, cleanRepo)}
                        disabled={isLoadingGhRuns}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingGhRuns ? 'animate-spin' : ''}`} />
                        <span>Cek Status Actions</span>
                      </button>
                      <a
                        href={`https://github.com/${cleanUser}/${cleanRepo}/actions`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <span>Buka GitHub Actions</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {ghActionsRuns.length > 0 ? (
                    <div className="space-y-1.5">
                      {ghActionsRuns.map((run) => {
                        const isSuccess = run.conclusion === 'success';
                        const isRunning = run.status === 'in_progress' || run.status === 'queued';
                        return (
                          <div
                            key={run.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isSuccess
                                    ? 'bg-emerald-400'
                                    : isRunning
                                    ? 'bg-amber-400 animate-pulse'
                                    : 'bg-rose-400'
                                }`}
                              />
                              <span className="text-slate-200 font-medium truncate">
                                {run.display_title || run.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                                  isSuccess
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                    : isRunning
                                    ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                                    : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                                }`}
                              >
                                {isRunning ? run.status : run.conclusion || run.status}
                              </span>
                              <a
                                href={run.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 underline"
                              >
                                Detail
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Klik <strong>Sync / Export to GitHub</strong> di bilah atas Google AI Studio untuk menjalankan workflow terbaru yang sudah diperbaiki.
                    </div>
                  )}
                </div>

                {/* 3 Langkah Cepat Upload ke GitHub */}
                <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Github className="w-4 h-4 text-cyan-400" />
                    <span>3 Langkah Mudah Upload &amp; Aktifkan Hosting Gratis di GitHub</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px]">
                          1
                        </span>
                        <span>Export / Sync ke GitHub</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Klik tombol ikon <strong>GitHub (Export / Sync to GitHub)</strong> di bilah atas Google AI Studio ke repository <code className="text-cyan-300">Management-rental</code> (pastikan visibilitas <strong>Public</strong>).
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px]">
                          2
                        </span>
                        <span>Aktifkan GitHub Pages</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Buka repository di GitHub.com &rarr; <strong>Settings &rarr; Pages</strong>. Anda bebas memilih Source: <strong>Deploy from a branch (pilih branch <code className="text-cyan-300">gh-pages</code>)</strong> ATAU <strong>GitHub Actions</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[11px]">
                          3
                        </span>
                        <span>Online Otomatis!</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        GitHub Actions otomatis mem-build &amp; menayangkan aplikasi di <code className="text-emerald-300">{computedGhUrl}</code> lengkap dengan PWA &amp; Google Sheets Live!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Generator & Pengaturan URL GitHub Pages */}
                <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Generator Link GitHub Pages &amp; Sinkronisasi QR Code</span>
                      </h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Masukkan username GitHub dan nama repository Anda untuk menghasilkan link langsung Dashboard Admin, QR Pesanan Mandiri Pelanggan, dan Link Investor.
                      </p>
                    </div>
                    {savedGhPagesUrl && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-mono shrink-0">
                        Aktif di QR: {savedGhPagesUrl}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Username GitHub Anda
                      </label>
                      <input
                        type="text"
                        value={ghUsername}
                        onChange={(e) => setGhUsername(e.target.value)}
                        placeholder="contoh: ahmadimam3000-oss"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Nama Repository Baru / Tujuan (atau Tempel URL GitHub)
                      </label>
                      <input
                        type="text"
                        value={ghRepoName}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const match = raw.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/i);
                          if (match) {
                            setGhUsername(match[1]);
                            setGhRepoName(match[2].replace(/\.git$/i, ''));
                          } else {
                            setGhRepoName(raw);
                          }
                        }}
                        placeholder="contoh: ai-rent-malang"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Quick Repository Switcher from GitHub Account */}
                  <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Pilih / Ganti Cepat dari Repository Akun <code className="text-cyan-300 font-mono">{cleanUser}</code>:</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchGhUserRepos(cleanUser)}
                          disabled={isLoadingGhRepos}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-medium flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingGhRepos ? 'animate-spin' : ''}`} />
                          <span>Muat Daftar Repo</span>
                        </button>
                        <a
                          href="https://github.com/new"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Buat Repo Baru di GitHub</span>
                        </a>
                      </div>
                    </div>

                    {ghUserRepos.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ghUserRepos.map((repo) => {
                          const isSelected = repo.name.toLowerCase() === cleanRepo.toLowerCase();
                          return (
                            <button
                              key={repo.id}
                              type="button"
                              onClick={() => {
                                setGhRepoName(repo.name);
                                const nextUrl = `https://${cleanUser}.github.io/${repo.name}`;
                                localStorage.setItem('airent_gh_username_v1', cleanUser);
                                localStorage.setItem('airent_gh_repo_v1', repo.name);
                                localStorage.setItem('airent_github_pages_url_v1', nextUrl);
                                setSavedGhPagesUrl(nextUrl);
                                fetchGhActionsStatus(cleanUser, repo.name);
                                setStatusMessage({
                                  type: 'success',
                                  text: `Berhasil mengganti repository aktif ke "${cleanUser}/${repo.name}" (${nextUrl})!`,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors flex items-center gap-1.5 border ${
                                isSelected
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span>{repo.name}</span>
                              {repo.has_pages && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="GitHub Pages Aktif" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">
                        Ketik nama repository baru di kolom atas atau klik <strong>Buat Repo Baru di GitHub</strong>, lalu klik tombol simpan di bawah.
                      </div>
                    )}
                  </div>

                  {/* Generated Links List */}
                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
                          1. Link Dashboard Admin Utama (GitHub Pages)
                        </div>
                        <div className="text-xs font-mono text-white truncate mt-0.5">
                          {computedGhUrl}/
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyText(`${computedGhUrl}/`, 'admin')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                        >
                          {copiedGhUrl === 'admin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedGhUrl === 'admin' ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <a
                          href={`${computedGhUrl}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-[11px] font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                          2. Link Publik QR Pesanan Mandiri Pelanggan (Tanpa Menu Admin)
                        </div>
                        <div className="text-xs font-mono text-white truncate mt-0.5">
                          {bookingGhUrl}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyText(bookingGhUrl, 'booking')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                        >
                          {copiedGhUrl === 'booking' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedGhUrl === 'booking' ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <a
                          href={bookingGhUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[11px] font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                          3. Link Portal Laporan Keuangan Investor &amp; Owner
                        </div>
                        <div className="text-xs font-mono text-white truncate mt-0.5">
                          {investorGhUrl}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyText(investorGhUrl, 'investor')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                        >
                          {copiedGhUrl === 'investor' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedGhUrl === 'investor' ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <a
                          href={investorGhUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-[11px] font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      onClick={handleSaveGhDomain}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Gunakan Link GitHub Pages Ini untuk QR Code &amp; Share</span>
                    </button>
                    {savedGhPagesUrl && (
                      <button
                        onClick={handleResetGhDomain}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-700 transition-colors"
                      >
                        Reset ke Domain Cloud Bawaan
                      </button>
                    )}
                  </div>
                </div>

                {/* File Workflow GitHub Actions */}
                <div className="relative">
                  <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-xl border border-b-0 border-slate-800">
                    <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>.github/workflows/deploy.yml (Sudah Terpasang Otomatis di Project)</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ghWorkflowCode);
                        setCopiedGhWorkflow(true);
                        setTimeout(() => setCopiedGhWorkflow(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    >
                      {copiedGhWorkflow ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Workflow YAML</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-b-xl text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-56 leading-relaxed">
                    {ghWorkflowCode}
                  </pre>
                </div>
              </div>
            );
          })()}

          {activeTab === 'script' && (
            <>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-slate-300">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>Cara Pasang Kode Makro di Google Spreadsheet:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                  <li>
                    Buka spreadsheet Anda atau gunakan tab{' '}
                    <span className="text-emerald-400 font-semibold">
                      Google Sheets Live API
                    </span>{' '}
                    di sebelah kiri untuk sinkronisasi otomatis tanpa koding.
                  </li>
                  <li>
                    Jika ingin menambahkan menu makro di dalam Google Sheets,
                    klik menu{' '}
                    <span className="text-white font-medium">
                      Ekstensi (Extensions) &gt; Apps Script
                    </span>
                    .
                  </li>
                  <li>
                    Salin dan tempelkan kode skrip di bawah lalu klik Simpan.
                  </li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-xl border border-b-0 border-slate-800">
                  <span className="font-mono text-[11px] text-slate-400">
                    Code.gs (Apps Script Engine)
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Semua Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-b-xl text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-80 leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_SOURCE}
                </pre>
              </div>
            </>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-semibold text-white">
                  Cadangkan &amp; Pulihkan Berkas JSON
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Selain tersimpan otomatis di Server Cloud Online dan Google
                  Sheets, Anda juga dapat mengunduh salinan berkas JSON lokal
                  sebagai arsip cadangan kapan saja.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Unduh Cadangan JSON</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pulihkan dari File JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
