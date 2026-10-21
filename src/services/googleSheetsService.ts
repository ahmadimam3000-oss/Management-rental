import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  MotorMaster,
  TransaksiSewa,
  PengeluaranMotor,
  FrequentRenter,
  YearlyRecapArchive,
  BikeStatus,
  CustomerCategory,
  GuaranteeIdType,
  PaymentStatus,
  PaymentMethod,
  ExpenseCategory,
  ConnectedSheetInfo,
} from '../types/rental';

export type { ConnectedSheetInfo };

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'promising-chord-bw2pc',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:141628390228:web:3b0951fc176a2d49b1e6c1',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAOBv61EkWEG9vMVFgBbX_4ckr5iHJAjwc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'promising-chord-bw2pc.firebaseapp.com',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'promising-chord-bw2pc.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '141628390228',
  measurementId: '',
};

// Workspace OAuth Scopes configured for Google Drive & Google Sheets
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory ONLY (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google Auth.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SpreadsheetMetadataInfo {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheetTitles: string[];
}

// Standard tab names used by Ai Rent
export const SHEET_TABS = {
  ARMADA: 'Master_Armada',
  TRANSAKSI: 'Transaksi_Sewa',
  PENGELUARAN: 'Pengeluaran_Servis',
  PELANGGAN: 'Database_Pelanggan',
  REKAP: 'Rekap_Keuangan',
};

/**
 * Extract spreadsheetId from either a full Google Sheets URL or a raw ID string.
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * List existing Google Spreadsheets from the user's Google Drive.
 */
export async function listUserSpreadsheets(
  accessToken: string
): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent(
    "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  const fields = encodeURIComponent(
    'files(id,name,modifiedTime,webViewLink)'
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=25`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal memuat daftar Google Sheets dari Drive: ${errText}`);
  }

  const data = await res.json();
  return (data.files || []) as DriveSpreadsheetFile[];
}

/**
 * Fetch spreadsheet metadata to inspect actual sheet tab names (never assume 'Sheet1').
 */
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadataInfo> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tidak dapat membaca metadata Google Sheets: ${errText}`);
  }

  const data = await res.json();
  const sheetTitles: string[] = (data.sheets || []).map(
    (s: { properties?: { title?: string } }) => s.properties?.title || ''
  ).filter(Boolean);

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Ai Rent Database',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheetTitles,
  };
}

/**
 * Create a brand-new Google Spreadsheet with the 5 standard Ai Rent tabs and populate initial data.
 */
export async function createAiRentSpreadsheet(
  accessToken: string,
  customTitle: string,
  payload: {
    fleet: MotorMaster[];
    transactions: TransaksiSewa[];
    expenses: PengeluaranMotor[];
    renters: FrequentRenter[];
    yearlyRecaps: YearlyRecapArchive[];
    activeBookYear: number;
  }
): Promise<SpreadsheetMetadataInfo> {
  const createRes = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title:
            customTitle.trim() ||
            `Ai Rent - Database & Keuangan Live (${payload.activeBookYear})`,
        },
        sheets: [
          {
            properties: {
              title: SHEET_TABS.ARMADA,
              gridProperties: { frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: SHEET_TABS.TRANSAKSI,
              gridProperties: { frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: SHEET_TABS.PENGELUARAN,
              gridProperties: { frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: SHEET_TABS.PELANGGAN,
              gridProperties: { frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: SHEET_TABS.REKAP,
              gridProperties: { frozenRowCount: 1 },
            },
          },
        ],
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Google Spreadsheet baru: ${errText}`);
  }

  const created = await createRes.json();
  const spreadsheetId: string = created.spreadsheetId;

  // Populate all 5 sheets with current data
  await pushDataToGoogleSpreadsheet(accessToken, spreadsheetId, payload);

  return {
    spreadsheetId,
    title: created.properties?.title || customTitle,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTitles: [
      SHEET_TABS.ARMADA,
      SHEET_TABS.TRANSAKSI,
      SHEET_TABS.PENGELUARAN,
      SHEET_TABS.PELANGGAN,
      SHEET_TABS.REKAP,
    ],
  };
}

/**
 * Ensure all 5 required tabs exist in an existing spreadsheet (by checking metadata first).
 */
async function ensureRequiredTabsExist(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadataInfo> {
  const metadata = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const requiredTabs = [
    SHEET_TABS.ARMADA,
    SHEET_TABS.TRANSAKSI,
    SHEET_TABS.PENGELUARAN,
    SHEET_TABS.PELANGGAN,
    SHEET_TABS.REKAP,
  ];

  const missingTabs = requiredTabs.filter(
    (tab) => !metadata.sheetTitles.includes(tab)
  );

  if (missingTabs.length > 0) {
    const requests = missingTabs.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!batchRes.ok) {
      const errText = await batchRes.text();
      throw new Error(`Gagal menambahkan tab sheet baru: ${errText}`);
    }

    return await getSpreadsheetMetadata(accessToken, spreadsheetId);
  }

  return metadata;
}

/**
 * Push all current application data (Fleet, Transactions, Expenses, Renters, Yearly Recaps)
 * to the connected Google Spreadsheet.
 */
export async function pushDataToGoogleSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  payload: {
    fleet: MotorMaster[];
    transactions: TransaksiSewa[];
    expenses: PengeluaranMotor[];
    renters: FrequentRenter[];
    yearlyRecaps: YearlyRecapArchive[];
    activeBookYear: number;
  }
): Promise<SpreadsheetMetadataInfo> {
  const metadata = await ensureRequiredTabsExist(accessToken, spreadsheetId);

  // 1. Prepare Master Armada rows
  const armadaRows: (string | number)[][] = [
    [
      'No',
      'Nama Unit',
      'Nopol',
      'Tipe Motor',
      'Status',
      'Tahun',
      'Warna',
      'Kilometer',
    ],
    ...payload.fleet.map((b) => [
      b.no,
      b.namaUnit,
      b.nopol,
      b.tipeMotor,
      b.status,
      b.tahun ?? 2024,
      b.warna ?? '-',
      b.kilometer ?? 0,
    ]),
  ];

  // 2. Prepare Transaksi Sewa rows
  const transaksiRows: (string | number)[][] = [
    [
      'ID Transaksi',
      'Nama Penyewa',
      'WhatsApp',
      'Alamat / Kos',
      'Jaminan ID',
      'Nopol Motor',
      'Kategori Pelanggan',
      'Hari Sewa',
      'Waktu Mulai (ISO)',
      'Lama Sewa (Hari)',
      'Durasi Jam',
      'Paket Khusus',
      'Estimasi Kembali (ISO)',
      'Waktu Selesai (ISO)',
      'Harga Acuan',
      'Total Pemasukan (Rp)',
      'Status Bayar',
      'Metode Pembayaran',
      'Status Unit',
      'Jumlah Helm',
      'Level Bensin',
      'Catatan Jaminan',
    ],
    ...payload.transactions.map((t) => [
      t.id,
      t.namaPenyewa,
      t.whatsapp,
      t.alamatAsalKos,
      t.identitasDijaminkan,
      t.nopolMotor,
      t.kategoriPelanggan,
      t.hariSewa,
      t.waktuStartSewa,
      t.lamaSewaHari,
      t.durasiJam ?? '',
      t.paketKhusus ?? 'Harian',
      t.estWaktuKembali,
      t.waktuSelesai ?? '',
      t.hargaPerHari,
      t.totalPemasukan,
      t.statusBayar,
      t.metodePembayaran ?? 'Tunai',
      t.statusUnit,
      t.jumlahHelm ?? '2',
      t.levelBensin ?? 'Full Kotak',
      t.catatanJaminanTambahan ?? '',
    ]),
  ];

  // 3. Prepare Pengeluaran Servis rows
  const pengeluaranRows: (string | number)[][] = [
    [
      'ID Pengeluaran',
      'Tanggal (ISO)',
      'Nopol Motor',
      'Kategori Biaya',
      'Nominal (Rp)',
      'Keterangan Bengkel / Servis',
      'Penanggung Jawab',
    ],
    ...payload.expenses.map((e) => [
      e.id,
      e.tanggal,
      e.nopolMotor,
      e.kategoriBiaya,
      e.nominal,
      e.keteranganBengkel,
      e.penanggungJawab,
    ]),
  ];

  // 4. Prepare Database Pelanggan rows
  const pelangganRows: (string | number)[][] = [
    [
      'ID Pelanggan',
      'Nama Lengkap',
      'WhatsApp',
      'Alamat / Instansi',
      'Jaminan Default',
      'Kategori Default',
      'Total Kali Sewa',
      'Total Transaksi (Rp)',
      'Rating Trust (1-5)',
      'Sewa Terakhir',
      'Catatan Khusus',
    ],
    ...payload.renters.map((r) => [
      r.id,
      r.nama,
      r.whatsapp,
      r.alamat,
      r.identitasDefault,
      r.kategoriDefault,
      r.totalRentals,
      r.totalSpent,
      r.ratingTrust,
      r.lastRentalDate ?? '',
      r.catatanKhusus ?? '',
    ]),
  ];

  // 5. Prepare Rekap Keuangan rows
  const totalIn = payload.transactions.reduce(
    (acc, t) => acc + (Number(t.totalPemasukan) || 0),
    0
  );
  const totalOut = payload.expenses.reduce(
    (acc, e) => acc + (Number(e.nominal) || 0),
    0
  );
  const netProfit = totalIn - totalOut;

  const rekapRows: (string | number)[][] = [
    ['RINGKASAN KEUANGAN LIVE AI RENT', `Tahun Buku Aktif: ${payload.activeBookYear}`, `Terakhir Diperbarui: ${new Date().toLocaleString('id-ID')}`],
    ['Total Armada (Unit)', payload.fleet.length, ''],
    ['Total Transaksi Tercatat', payload.transactions.length, ''],
    ['Total Pemasukan Kotor (Rp)', totalIn, ''],
    ['Total Pengeluaran Operasional (Rp)', totalOut, ''],
    ['Laba Bersih / Net Profit (Rp)', netProfit, ''],
    [],
    [
      'Tahun Buku Arsip',
      'Tanggal Tutup Buku',
      'Total Pemasukan (Rp)',
      'Total Pengeluaran (Rp)',
      'Laba Bersih (Rp)',
      'Margin (%)',
      'Jumlah Transaksi',
      'Unit Terbaik',
      'Catatan',
    ],
    ...payload.yearlyRecaps.map((rec) => [
      rec.year,
      rec.closedAt,
      rec.totalIncome,
      rec.totalExpense,
      rec.totalNetProfit,
      Number(rec.profitMargin.toFixed(1)),
      rec.totalTransactions,
      `${rec.topMotorUnit} (${rec.topMotorNopol})`,
      rec.notes ?? '',
    ]),
  ];

  // Clear existing ranges first so old trailing rows are removed cleanly
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: [
          `${SHEET_TABS.ARMADA}!A1:Z1000`,
          `${SHEET_TABS.TRANSAKSI}!A1:Z5000`,
          `${SHEET_TABS.PENGELUARAN}!A1:Z5000`,
          `${SHEET_TABS.PELANGGAN}!A1:Z2000`,
          `${SHEET_TABS.REKAP}!A1:Z500`,
        ],
      }),
    }
  );

  // Batch update all 5 tabs
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `${SHEET_TABS.ARMADA}!A1`,
            values: armadaRows,
          },
          {
            range: `${SHEET_TABS.TRANSAKSI}!A1`,
            values: transaksiRows,
          },
          {
            range: `${SHEET_TABS.PENGELUARAN}!A1`,
            values: pengeluaranRows,
          },
          {
            range: `${SHEET_TABS.PELANGGAN}!A1`,
            values: pelangganRows,
          },
          {
            range: `${SHEET_TABS.REKAP}!A1`,
            values: rekapRows,
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Gagal menulis data ke Google Sheets: ${errText}`);
  }

  return metadata;
}

/**
 * Pull / Import data from a connected Google Spreadsheet back into Ai Rent.
 * Always inspects spreadsheet metadata first to verify which tabs exist.
 */
export async function pullDataFromGoogleSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  metadata: SpreadsheetMetadataInfo;
  fleet?: MotorMaster[];
  transactions?: TransaksiSewa[];
  expenses?: PengeluaranMotor[];
  renters?: FrequentRenter[];
}> {
  const metadata = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const availableTabs = new Set(metadata.sheetTitles);

  const rangesToFetch: string[] = [];
  if (availableTabs.has(SHEET_TABS.ARMADA)) {
    rangesToFetch.push(`${SHEET_TABS.ARMADA}!A2:H500`);
  }
  if (availableTabs.has(SHEET_TABS.TRANSAKSI)) {
    rangesToFetch.push(`${SHEET_TABS.TRANSAKSI}!A2:V5000`);
  }
  if (availableTabs.has(SHEET_TABS.PENGELUARAN)) {
    rangesToFetch.push(`${SHEET_TABS.PENGELUARAN}!A2:G5000`);
  }
  if (availableTabs.has(SHEET_TABS.PELANGGAN)) {
    rangesToFetch.push(`${SHEET_TABS.PELANGGAN}!A2:K2000`);
  }

  if (rangesToFetch.length === 0) {
    throw new Error(
      `Spreadsheet "${metadata.title}" belum memiliki tab standar Ai Rent (${SHEET_TABS.ARMADA}, ${SHEET_TABS.TRANSAKSI}, dll). Silakan gunakan tombol "Export / Sinkronkan ke Google Sheets" terlebih dahulu untuk menginisialisasi struktur tab.`
    );
  }

  const queryParams = rangesToFetch
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join('&');
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membaca baris data dari Google Sheets: ${errText}`);
  }

  const batchData = await res.json();
  const valueRanges: { range: string; values?: string[][] }[] =
    batchData.valueRanges || [];

  let fleet: MotorMaster[] | undefined;
  let transactions: TransaksiSewa[] | undefined;
  let expenses: PengeluaranMotor[] | undefined;
  let renters: FrequentRenter[] | undefined;

  for (const vr of valueRanges) {
    const rows = vr.values || [];
    if (vr.range.includes(SHEET_TABS.ARMADA) && rows.length > 0) {
      fleet = rows
        .filter((r) => r[1] && r[2])
        .map((r, idx) => ({
          no: Number(r[0]) || idx + 1,
          namaUnit: String(r[1] || '').trim(),
          nopol: String(r[2] || '').trim(),
          tipeMotor: String(r[3] || '').trim(),
          status: (r[4] as BikeStatus) || 'Tersedia',
          tahun: Number(r[5]) || 2024,
          warna: String(r[6] || '-'),
          kilometer: Number(r[7]) || 0,
        }));
    } else if (vr.range.includes(SHEET_TABS.TRANSAKSI) && rows.length > 0) {
      transactions = rows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          id: String(r[0] || '').trim(),
          namaPenyewa: String(r[1] || '').trim(),
          whatsapp: String(r[2] || '').trim(),
          alamatAsalKos: String(r[3] || '').trim(),
          identitasDijaminkan: (r[4] as GuaranteeIdType) || 'KTM dan KTP',
          nopolMotor: String(r[5] || '').trim(),
          kategoriPelanggan: (r[6] as CustomerCategory) || 'Mhs Malang',
          hariSewa: String(r[7] || 'Senin'),
          waktuStartSewa: String(r[8] || new Date().toISOString()),
          lamaSewaHari: Number(r[9]) || 1,
          durasiJam: r[10] ? Number(r[10]) : undefined,
          paketKhusus: r[11] || 'Harian',
          estWaktuKembali: String(r[12] || new Date().toISOString()),
          waktuSelesai: r[13] ? String(r[13]) : undefined,
          hargaPerHari: Number(String(r[14] || '0').replace(/[^\d.-]/g, '')) || 0,
          totalPemasukan: Number(String(r[15] || '0').replace(/[^\d.-]/g, '')) || 0,
          statusBayar: (r[16] as PaymentStatus) || 'Lunas',
          metodePembayaran: (r[17] as PaymentMethod) || 'Tunai',
          statusUnit:
            (r[18] as 'Disewa' | 'Selesai' | 'Booking' | 'Overdue') || 'Disewa',
          jumlahHelm: (r[19] as '0' | '1' | '2') || '2',
          levelBensin:
            (r[20] as
              | '1 Kotak'
              | '2 Kotak'
              | '3 Kotak'
              | '4 Kotak'
              | '5 Kotak'
              | 'Full Kotak') || 'Full Kotak',
          catatanJaminanTambahan: String(r[21] || ''),
        }));
    } else if (vr.range.includes(SHEET_TABS.PENGELUARAN) && rows.length > 0) {
      expenses = rows
        .filter((r) => r[0] && r[2])
        .map((r) => ({
          id: String(r[0] || '').trim(),
          tanggal: String(r[1] || new Date().toISOString()),
          nopolMotor: String(r[2] || '').trim(),
          kategoriBiaya: (r[3] as ExpenseCategory) || 'Service Rutin & Oli',
          nominal: Number(String(r[4] || '0').replace(/[^\d.-]/g, '')) || 0,
          keteranganBengkel: String(r[5] || ''),
          penanggungJawab: String(r[6] || 'Admin'),
        }));
    } else if (vr.range.includes(SHEET_TABS.PELANGGAN) && rows.length > 0) {
      renters = rows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          id: String(r[0] || '').trim(),
          nama: String(r[1] || '').trim(),
          whatsapp: String(r[2] || '').trim(),
          alamat: String(r[3] || '').trim(),
          identitasDefault: (r[4] as GuaranteeIdType) || 'KTM dan KTP',
          kategoriDefault: (r[5] as CustomerCategory) || 'Mhs Malang',
          totalRentals: Number(r[6]) || 1,
          totalSpent: Number(String(r[7] || '0').replace(/[^\d.-]/g, '')) || 0,
          ratingTrust: Number(r[8]) || 5,
          lastRentalDate: r[9] ? String(r[9]) : undefined,
          catatanKhusus: r[10] ? String(r[10]) : undefined,
        }));
    }
  }

  return {
    metadata,
    fleet,
    transactions,
    expenses,
    renters,
  };
}
