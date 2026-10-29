import express from 'express';
import path from 'path';
import fs from 'fs';

export const apiApp = express();

// Ensure body parser for JSON requests
apiApp.use(express.json());

// -----------------------------------------------------------------------------
// AI Studio Internal Control Plane Status Endpoint
// -----------------------------------------------------------------------------
apiApp.get('/__aistudio_internal_control_plane/dev/status', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    ready: true,
    service: 'wonderland-arcade-management-dev',
    timestamp: new Date().toISOString()
  });
});

apiApp.get('/__aistudio_internal_control_plane/*', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    ready: true,
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// Data Persistence Directory
// -----------------------------------------------------------------------------
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const SHEET_LINKS_FILE = path.join(DATA_DIR, 'sheet_links.json');

export interface BackendLog {
  id: string;
  timestamp: string;
  entityName: string;
  action: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  staffId?: string;
  staffName?: string;
  message: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface SheetLinkRecord {
  id: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  tabs: string[];
  rowsCount: number;
  userEmail?: string;
  syncMode: 'OVERWRITE' | 'APPEND';
  lastSyncedAt: string;
  createdAt: string;
}

const getInitialLogs = (): BackendLog[] => {
  const now = new Date();
  const pastMinutes = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

  return [
    {
      id: 'log-seed-01',
      timestamp: pastMinutes(120),
      entityName: 'system',
      action: 'SERVER_BOOTSTRAP',
      level: 'INFO',
      staffId: 'system',
      staffName: 'Wonderland OS',
      message: 'Wonderland Arcade Management System server initialized on port 3000.',
      details: { environment: process.env.NODE_ENV || 'development', port: 3000 }
    },
    {
      id: 'log-seed-02',
      timestamp: pastMinutes(95),
      entityName: 'customers',
      action: 'CUSTOMER_CREATED',
      level: 'SUCCESS',
      staffId: 'desk-01',
      staffName: 'Priya Sharma',
      message: 'New customer profile registered: Aarav Patel (+91 98765 43210)',
      details: { name: 'Aarav Patel', phone: '9876543210' }
    },
    {
      id: 'log-seed-03',
      timestamp: pastMinutes(90),
      entityName: 'sessions',
      action: 'SESSION_STARTED',
      level: 'SUCCESS',
      staffId: 'desk-01',
      staffName: 'Priya Sharma',
      message: 'PlayStation 5 Console #1 session started for Aarav Patel (60 minutes)',
      details: { resourceName: 'PlayStation 5 — Console #1', durationMinutes: 60, price: 199 }
    },
    {
      id: 'log-seed-04',
      timestamp: pastMinutes(80),
      entityName: 'sheets',
      action: 'SHEET_SYNC_SUCCESS',
      level: 'SUCCESS',
      staffId: 'desk-01',
      staffName: 'Priya Sharma',
      message: 'Google Sheets sync completed for All Entities (Master 10-Tab Cloud Register)',
      details: {
        spreadsheetTitle: 'Wonderland Arcade — Live Operational Register',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1w0ndErLaNd_ArcAdE_0pErAtIoNs_2026/edit',
        tabs: ['Master Workbook', 'Invoices & Sales', 'Customers Directory', 'Game Sessions', 'UPI & Payments']
      }
    },
    {
      id: 'log-seed-05',
      timestamp: pastMinutes(45),
      entityName: 'invoices',
      action: 'INVOICE_CREATED',
      level: 'SUCCESS',
      staffId: 'desk-01',
      staffName: 'Priya Sharma',
      message: 'Invoice WND-20261027-4182 generated for Aarav Patel. Amount: ₹199 (PAID)',
      details: { invoiceNumber: 'WND-20261027-4182', totalAmount: 199, status: 'PAID' }
    },
    {
      id: 'log-seed-06',
      timestamp: pastMinutes(45),
      entityName: 'payments',
      action: 'PAYMENT_RECORDED',
      level: 'SUCCESS',
      staffId: 'desk-01',
      staffName: 'Priya Sharma',
      message: 'UPI payment of ₹199 confirmed for invoice WND-20261027-4182 (Ref: UPI-4102948271)',
      details: { amount: 199, method: 'UPI', referenceNumber: 'UPI-4102948271' }
    },
    {
      id: 'log-seed-07',
      timestamp: pastMinutes(30),
      entityName: 'sessions',
      action: 'SESSION_ENDED',
      level: 'INFO',
      staffId: 'desk-01',
      staffName: 'Priya Sharma',
      message: 'Session completed for Aarav Patel on PlayStation 5 Console #1. Hardware released.',
      details: { resourceName: 'PlayStation 5 — Console #1', totalDuration: 60 }
    }
  ];
};

const getInitialSheetLinks = (): SheetLinkRecord[] => {
  const now = new Date();
  return [
    {
      id: 'sheet-01',
      spreadsheetId: '1w0ndErLaNd_ArcAdE_0pErAtIoNs_2026',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1w0ndErLaNd_ArcAdE_0pErAtIoNs_2026/edit',
      title: 'Wonderland Arcade — Live Operational Register (MG Road)',
      tabs: [
        'Daily Summary',
        'Invoices & Sales',
        'Customers Directory',
        'Game Sessions',
        'UPI & Payments',
        'Games Catalogue',
        'Hardware Resources',
        'Packages & Balances',
        'Visits & Check-Ins',
        'Staff & Terminals'
      ],
      rowsCount: 142,
      userEmail: 'abu.s@kapturecrm.com',
      syncMode: 'OVERWRITE',
      lastSyncedAt: new Date(now.getTime() - 80 * 60000).toISOString(),
      createdAt: new Date(now.getTime() - 80 * 60000).toISOString()
    }
  ];
};

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Initialize seed data if not present
if (!fs.existsSync(LOGS_FILE)) {
  writeJsonFile(LOGS_FILE, getInitialLogs());
}
if (!fs.existsSync(SHEET_LINKS_FILE)) {
  writeJsonFile(SHEET_LINKS_FILE, getInitialSheetLinks());
}

// -----------------------------------------------------------------------------
// REST API Routes
// -----------------------------------------------------------------------------

// GET /api/health
apiApp.get('/api/health', (_req, res) => {
  const logs = readJsonFile<BackendLog[]>(LOGS_FILE, []);
  const sheets = readJsonFile<SheetLinkRecord[]>(SHEET_LINKS_FILE, []);

  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'ok',
    server: 'Wonderland Arcade Management Backend',
    port: 3000,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    totalLogs: logs.length,
    totalSheetLinks: sheets.length
  });
});

// GET /api/logs
apiApp.get('/api/logs', (req, res) => {
  try {
    const logs = readJsonFile<BackendLog[]>(LOGS_FILE, []);
    const { entity, action, level, search, limit = '150', offset = '0' } = req.query;

    let filtered = [...logs];

    if (entity && typeof entity === 'string' && entity !== 'ALL') {
      filtered = filtered.filter(
        (l) => l.entityName.toLowerCase() === entity.toLowerCase()
      );
    }

    if (action && typeof action === 'string') {
      filtered = filtered.filter((l) =>
        l.action.toLowerCase().includes(action.toLowerCase())
      );
    }

    if (level && typeof level === 'string' && level !== 'ALL') {
      filtered = filtered.filter((l) => l.level === level.toUpperCase());
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entityName.toLowerCase().includes(q) ||
          (l.staffName && l.staffName.toLowerCase().includes(q)) ||
          JSON.stringify(l.details || {}).toLowerCase().includes(q)
      );
    }

    // Sort newest first
    filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const parsedOffset = Math.max(0, parseInt(offset as string, 10) || 0);
    const parsedLimit = Math.max(1, Math.min(500, parseInt(limit as string, 10) || 150));
    const paginated = filtered.slice(parsedOffset, parsedOffset + parsedLimit);

    const stats: Record<string, number> = {
      all: logs.length,
      sessions: 0,
      invoices: 0,
      payments: 0,
      customers: 0,
      packages: 0,
      sheets: 0,
      resources: 0,
      system: 0
    };

    logs.forEach((l) => {
      const ent = l.entityName.toLowerCase();
      if (stats[ent] !== undefined) {
        stats[ent]++;
      } else {
        stats[ent] = 1;
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      total: filtered.length,
      offset: parsedOffset,
      limit: parsedLimit,
      logs: paginated,
      stats
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/logs
apiApp.post('/api/logs', (req, res) => {
  try {
    const { entityName, action, level = 'INFO', staffId, staffName, message, details } = req.body;

    if (!entityName || !action || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entityName, action, and message are required.'
      });
    }

    const logs = readJsonFile<BackendLog[]>(LOGS_FILE, []);
    const newLog: BackendLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      entityName: String(entityName).toLowerCase(),
      action: String(action).toUpperCase(),
      level: (level as 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR') || 'INFO',
      staffId: staffId || 'desk-terminal',
      staffName: staffName || 'Terminal Operator',
      message: String(message),
      details: details || {},
      ipAddress: req.ip || req.socket.remoteAddress
    };

    logs.unshift(newLog);

    if (logs.length > 2000) {
      logs.splice(2000);
    }

    writeJsonFile(LOGS_FILE, logs);

    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ success: true, log: newLog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/logs
apiApp.delete('/api/logs', (_req, res) => {
  try {
    const initialLogs = getInitialLogs();
    writeJsonFile(LOGS_FILE, initialLogs);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, message: 'Logs reset to clean operational baseline.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sheet-links
apiApp.get('/api/sheet-links', (_req, res) => {
  try {
    const sheetLinks = readJsonFile<SheetLinkRecord[]>(SHEET_LINKS_FILE, []);
    sheetLinks.sort(
      (a, b) => new Date(b.lastSyncedAt).getTime() - new Date(a.lastSyncedAt).getTime()
    );
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, sheetLinks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sheet-links
apiApp.post('/api/sheet-links', (req, res) => {
  try {
    const {
      spreadsheetId,
      spreadsheetUrl,
      title,
      tabs = [],
      rowsCount = 0,
      userEmail,
      syncMode = 'OVERWRITE'
    } = req.body;

    if (!spreadsheetId || !spreadsheetUrl || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing spreadsheetId, spreadsheetUrl, or title.'
      });
    }

    const sheetLinks = readJsonFile<SheetLinkRecord[]>(SHEET_LINKS_FILE, []);
    const existingIndex = sheetLinks.findIndex((s) => s.spreadsheetId === spreadsheetId);

    const now = new Date().toISOString();
    let record: SheetLinkRecord;

    if (existingIndex >= 0) {
      record = {
        ...sheetLinks[existingIndex],
        title,
        spreadsheetUrl,
        tabs: Array.isArray(tabs) ? tabs : [tabs],
        rowsCount,
        userEmail: userEmail || sheetLinks[existingIndex].userEmail,
        syncMode,
        lastSyncedAt: now
      };
      sheetLinks[existingIndex] = record;
    } else {
      record = {
        id: `sheet-${Date.now()}`,
        spreadsheetId,
        spreadsheetUrl,
        title,
        tabs: Array.isArray(tabs) ? tabs : [tabs],
        rowsCount,
        userEmail,
        syncMode,
        lastSyncedAt: now,
        createdAt: now
      };
      sheetLinks.unshift(record);
    }

    writeJsonFile(SHEET_LINKS_FILE, sheetLinks);

    const logs = readJsonFile<BackendLog[]>(LOGS_FILE, []);
    logs.unshift({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      entityName: 'sheets',
      action: 'SHEET_SYNC_SUCCESS',
      level: 'SUCCESS',
      staffName: userEmail || 'Terminal Staff',
      message: `Google Sheet updated: "${title}" (${rowsCount} rows synced across ${record.tabs.length} tabs)`,
      details: {
        spreadsheetId,
        spreadsheetUrl,
        tabs: record.tabs,
        syncMode,
        rowsCount
      }
    });
    writeJsonFile(LOGS_FILE, logs);

    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, sheetLink: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/sheet-links/:id
apiApp.delete('/api/sheet-links/:id', (req, res) => {
  try {
    const { id } = req.params;
    let sheetLinks = readJsonFile<SheetLinkRecord[]>(SHEET_LINKS_FILE, []);
    sheetLinks = sheetLinks.filter((s) => s.id !== id && s.spreadsheetId !== id);
    writeJsonFile(SHEET_LINKS_FILE, sheetLinks);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, message: 'Sheet link removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
