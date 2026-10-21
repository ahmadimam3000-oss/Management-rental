import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_FLEET,
  INITIAL_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_FREQUENT_RENTERS,
} from './src/data/initialFleetData.ts';
import { generateYearlyRecapSnapshot } from './src/utils/formatters.ts';
import type {
  MotorMaster,
  TransaksiSewa,
  PengeluaranMotor,
  FrequentRenter,
  YearlyRecapArchive,
  ConnectedSheetInfo,
} from './src/types/rental.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cloud_database.json');

export interface CloudDatabaseState {
  revision: number;
  updatedAt: string;
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  expenses: PengeluaranMotor[];
  renters: FrequentRenter[];
  activeBookYear: number;
  yearlyRecaps: YearlyRecapArchive[];
  connectedSheetInfo: ConnectedSheetInfo | null;
}

function getInitialDatabaseState(): CloudDatabaseState {
  return {
    revision: 1,
    updatedAt: new Date().toISOString(),
    fleet: INITIAL_FLEET,
    transactions: INITIAL_TRANSACTIONS,
    expenses: INITIAL_EXPENSES,
    renters: INITIAL_FREQUENT_RENTERS,
    activeBookYear: 2026,
    yearlyRecaps: [
      generateYearlyRecapSnapshot(
        2025,
        INITIAL_FLEET,
        INITIAL_TRANSACTIONS,
        INITIAL_EXPENSES,
        true,
        'Rekapitulasi tutup buku otomatis Tahun Anggaran 2025'
      ),
    ],
    connectedSheetInfo: null,
  };
}

function loadDatabase(): CloudDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.fleet) && Array.isArray(parsed.transactions)) {
        return {
          revision: Number(parsed.revision) || 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          fleet: parsed.fleet,
          transactions: parsed.transactions,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : INITIAL_EXPENSES,
          renters: Array.isArray(parsed.renters) ? parsed.renters : INITIAL_FREQUENT_RENTERS,
          activeBookYear: Number(parsed.activeBookYear) || 2026,
          yearlyRecaps: Array.isArray(parsed.yearlyRecaps)
            ? parsed.yearlyRecaps
            : getInitialDatabaseState().yearlyRecaps,
          connectedSheetInfo: parsed.connectedSheetInfo || null,
        };
      }
    }
  } catch (err) {
    console.error('Failed to load cloud_database.json, using initial seed:', err);
  }
  const initial = getInitialDatabaseState();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(state: CloudDatabaseState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write cloud_database.json:', err);
  }
}

let dbState: CloudDatabaseState = loadDatabase();

// Connected SSE Clients for real-time multi-device broadcast
const sseClients = new Set<express.Response>();

function broadcastStateUpdate(sourceAction = 'sync') {
  const payload = JSON.stringify({
    type: 'STATE_UPDATED',
    sourceAction,
    state: dbState,
    connectedClients: sseClients.size,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Allow cross-origin requests from GitHub Pages (*.github.io) and custom domains
  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // 1. Real-time SSE Stream Endpoint
  app.get('/api/cloud-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Send initial snapshot immediately upon connection
    const initPayload = JSON.stringify({
      type: 'INITIAL_STATE',
      state: dbState,
      connectedClients: sseClients.size,
    });
    res.write(`data: ${initPayload}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // 2. Get Current Authoritative Cloud State
  app.get('/api/cloud-state', (_req, res) => {
    res.json({
      ...dbState,
      connectedClients: sseClients.size,
    });
  });

  // 3. Update Authoritative Cloud State (Admin / Sync actions)
  app.post('/api/cloud-state', (req, res) => {
    const body = req.body || {};

    let changed = false;
    if (Array.isArray(body.fleet)) {
      dbState.fleet = body.fleet;
      changed = true;
    }
    if (Array.isArray(body.transactions)) {
      dbState.transactions = body.transactions;
      changed = true;
    }
    if (Array.isArray(body.expenses)) {
      dbState.expenses = body.expenses;
      changed = true;
    }
    if (Array.isArray(body.renters)) {
      dbState.renters = body.renters;
      changed = true;
    }
    if (typeof body.activeBookYear === 'number' && !isNaN(body.activeBookYear)) {
      dbState.activeBookYear = body.activeBookYear;
      changed = true;
    }
    if (Array.isArray(body.yearlyRecaps)) {
      dbState.yearlyRecaps = body.yearlyRecaps;
      changed = true;
    }
    if (body.connectedSheetInfo !== undefined) {
      dbState.connectedSheetInfo = body.connectedSheetInfo;
      changed = true;
    }

    if (changed) {
      dbState.revision += 1;
      dbState.updatedAt = new Date().toISOString();
      saveDatabase(dbState);
      broadcastStateUpdate(body.sourceAction || 'admin_update');
    }

    res.json({
      ...dbState,
      connectedClients: sseClients.size,
    });
  });

  // 4. Atomic Endpoint for Public Customer Self-Service QR Booking
  app.post('/api/cloud-booking', (req, res) => {
    const newTrx: TransaksiSewa | undefined = req.body?.transaction;
    if (!newTrx || !newTrx.id || !newTrx.nopolMotor) {
      res.status(400).json({ error: 'Data pesanan tidak valid.' });
      return;
    }

    const exists = dbState.transactions.some((t) => t.id === newTrx.id);
    if (!exists) {
      dbState.transactions = [newTrx, ...dbState.transactions];
    }

    dbState.fleet = dbState.fleet.map((b) =>
      b.nopol === newTrx.nopolMotor && b.status === 'Tersedia'
        ? { ...b, status: 'Booking' as const }
        : b
    );

    dbState.revision += 1;
    dbState.updatedAt = new Date().toISOString();
    saveDatabase(dbState);
    broadcastStateUpdate('customer_qr_booking');

    res.json({
      success: true,
      state: dbState,
    });
  });

  // 5. Reset Cloud State to Seed Data
  app.post('/api/cloud-reset', (_req, res) => {
    const currentSheet = dbState.connectedSheetInfo;
    dbState = {
      ...getInitialDatabaseState(),
      revision: dbState.revision + 1,
      updatedAt: new Date().toISOString(),
      connectedSheetInfo: currentSheet,
    };
    saveDatabase(dbState);
    broadcastStateUpdate('reset');

    res.json({
      ...dbState,
      connectedClients: sseClients.size,
    });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ai Rent Cloud Live Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
