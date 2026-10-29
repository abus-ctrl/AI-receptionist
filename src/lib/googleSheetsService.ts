import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  SystemState,
  Customer,
  Invoice,
  Session,
  Product,
  Resource,
  Payment,
  PackageDefinition,
  CustomerPackage,
  Visit,
  Profile,
  GameCategory
} from '../types';

// The configured scopes for Google Drive and Google Sheets
export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const googleAuth = getAuth(app);

// Provider with full Workspace scopes requested
const provider = new GoogleAuthProvider();
GOOGLE_WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent'
});

// In-memory token cache (NEVER stored in localStorage or sessionStorage)
let inMemoryAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export type EntitySyncKey =
  | 'ALL_ENTITIES'
  | 'DAILY_SUMMARY'
  | 'INVOICES'
  | 'CUSTOMERS'
  | 'SESSIONS'
  | 'PAYMENTS'
  | 'PRODUCTS'
  | 'RESOURCES'
  | 'PACKAGES'
  | 'VISITS'
  | 'STAFF';

export interface EntitySyncOption {
  key: EntitySyncKey;
  label: string;
  tabName: string;
  description: string;
  getRowsCount: (state: SystemState) => number;
}

export const ENTITY_SYNC_OPTIONS: EntitySyncOption[] = [
  {
    key: 'ALL_ENTITIES',
    label: 'All Entities (Master 10-Tab Cloud Workbook)',
    tabName: 'Master Workbook',
    description: 'Complete sync of all 10 system entities into dedicated tabs with summary KPIs',
    getRowsCount: (state) =>
      state.invoices.length +
      state.customers.length +
      state.sessions.length +
      state.payments.length +
      state.products.length +
      state.resources.length +
      state.packages.length +
      state.visits.length +
      state.profiles.length +
      12
  },
  {
    key: 'DAILY_SUMMARY',
    label: 'Daily Summary & KPIs',
    tabName: 'Daily Summary',
    description: 'Executive overview: Total sales, collections, cash/UPI splits, active timers',
    getRowsCount: () => 12
  },
  {
    key: 'INVOICES',
    label: 'Invoices & Sales Register',
    tabName: 'Invoices & Sales',
    description: 'POS bills with invoice number, date, customer name, mobile, subtotal, tax, paid, balance, status',
    getRowsCount: (state) => state.invoices.length
  },
  {
    key: 'CUSTOMERS',
    label: 'Customer Directory',
    tabName: 'Customers Directory',
    description: 'Registered customer profiles, normalized 10-digit mobile numbers, lifetime visits & spend',
    getRowsCount: (state) => state.customers.length
  },
  {
    key: 'SESSIONS',
    label: 'Game Sessions & Timers',
    tabName: 'Game Sessions',
    description: 'Active and completed floor sessions with start time, duration, game, resource, fee, and status',
    getRowsCount: (state) => state.sessions.length
  },
  {
    key: 'PAYMENTS',
    label: 'Payments Ledger & Reconciliation',
    tabName: 'Payments Ledger',
    description: 'Cash, UPI, Card transactions with reference/UTR numbers, timestamps, and staff details',
    getRowsCount: (state) => state.payments.length
  },
  {
    key: 'PRODUCTS',
    label: 'Games & Product Catalogue',
    tabName: 'Games Catalogue',
    description: 'Complete price list: PlayStation, Snooker, Soft Play, VR, Meta Bat Cricket, Chair Massager',
    getRowsCount: (state) => state.products.length
  },
  {
    key: 'RESOURCES',
    label: 'Resources & Floor Hardware',
    tabName: 'Resources & Floor',
    description: 'Hardware consoles (PS5 #1-#5, Simulator, Snooker #1-#2, Pool, VR, Soft Play 25-cap) status',
    getRowsCount: (state) => state.resources.length
  },
  {
    key: 'PACKAGES',
    label: 'Package Definitions & Balances',
    tabName: 'Packages & Balances',
    description: 'Package catalogue and active customer subscriptions with remaining minutes & expiry',
    getRowsCount: (state) => state.packages.length + state.customerPackages.length
  },
  {
    key: 'VISITS',
    label: 'Check-In Visits Log',
    tabName: 'Visits & Check-Ins',
    description: 'Customer check-in and check-out logs with duration and terminal operator',
    getRowsCount: (state) => state.visits.length
  },
  {
    key: 'STAFF',
    label: 'Staff Profiles & Terminals',
    tabName: 'Staff & Terminals',
    description: 'Front desk receptionists and owner terminal accounts with roles and branches',
    getRowsCount: (state) => state.profiles.length
  }
];

/**
 * Initialize Firebase Auth listener.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(googleAuth, async (user: User | null) => {
    if (user && inMemoryAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, inMemoryAccessToken);
    } else {
      inMemoryAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google using Firebase Auth popup to obtain OAuth access token
 */
export const signInWithGoogleSheets = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(googleAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token from authentication response.');
    }

    inMemoryAccessToken = credential.accessToken;
    return { user: result.user, accessToken: inMemoryAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getGoogleAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

/**
 * Sign out and clear in-memory tokens
 */
export const signOutGoogleSheets = async (): Promise<void> => {
  await signOut(googleAuth);
  inMemoryAccessToken = null;
};

/**
 * List recent spreadsheets from Google Drive
 */
export const listDriveSpreadsheets = async (
  accessToken: string
): Promise<DriveSpreadsheetFile[]> => {
  const query = encodeURIComponent(
    "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false"
  );
  const fields = encodeURIComponent('files(id, name, webViewLink, modifiedTime)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=20&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Spreadsheets: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Fetch spreadsheet metadata to get existing sheet tabs
 * (Best practice per Workspace references: never assume "Sheet1" exists)
 */
export const getSpreadsheetMetadata = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: { sheetId: number; title: string }[] }> => {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch spreadsheet metadata: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return {
    title: data.properties?.title || 'Spreadsheet',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title
    }))
  };
};

/**
 * Ensure required tab names exist in the spreadsheet; creates missing ones via batchUpdate.
 */
export const ensureSheetTabs = async (
  accessToken: string,
  spreadsheetId: string,
  requiredTabNames: string[]
): Promise<string[]> => {
  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const existingTabTitles = new Set(meta.sheets.map((s) => s.title));

  const tabsToCreate = requiredTabNames.filter((t) => !existingTabTitles.has(t));

  if (tabsToCreate.length > 0) {
    const requests = tabsToCreate.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    }));

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!res.ok) {
      console.warn('Failed to add some tabs, will fallback to available tabs:', await res.text());
    }
  }

  return requiredTabNames;
};

/**
 * Create a new Google Spreadsheet in Google Drive with named tabs
 */
export const createGoogleSpreadsheet = async (
  accessToken: string,
  title: string,
  sheetTitles: string[] = ['Sheet1']
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const body = {
    properties: {
      title
    },
    sheets: sheetTitles.map((tabTitle) => ({
      properties: {
        title: tabTitle,
        gridProperties: {
          frozenRowCount: 1
        }
      }
    }))
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create Google Spreadsheet: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
};

/**
 * Clear a sheet range
 */
export const clearSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<void> => {
  const encodedRange = encodeURIComponent(range);
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
};

/**
 * Update / write values to a range
 */
export const updateSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<any> => {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update sheet values: ${res.status} ${errorText}`);
  }

  return await res.json();
};

/**
 * Append rows to a range
 */
export const appendSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<any> => {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to append sheet values: ${res.status} ${errorText}`);
  }

  return await res.json();
};

// ==========================================
// DATA BUILDERS FOR ALL 10 WONDERLAND ENTITIES
// ==========================================

export const buildSummaryData = (state: SystemState): (string | number)[][] => {
  const totalSales = state.invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalCollected = state.payments.reduce((acc, p) => (p.status === 'CONFIRMED' ? acc + p.amount : acc), 0);
  const totalCash = state.payments.reduce((acc, p) => (p.status === 'CONFIRMED' && p.paymentMethod === 'CASH' ? acc + p.amount : acc), 0);
  const totalUpi = state.payments.reduce((acc, p) => (p.status === 'CONFIRMED' && p.paymentMethod === 'UPI' ? acc + p.amount : acc), 0);
  const totalCard = state.payments.reduce((acc, p) => (p.status === 'CONFIRMED' && p.paymentMethod === 'CARD' ? acc + p.amount : acc), 0);
  const activeSessions = state.sessions.filter((s) => s.status === 'RUNNING' || s.status === 'DUE' || s.status === 'OVERDUE').length;

  return [
    ['WONDERLAND ARCADE MANAGEMENT SYSTEM — OPERATIONAL SUMMARY'],
    ['Last Synchronized', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
    ['Branch', state.locations[0]?.name || 'MG Road Terminal'],
    [],
    ['Entity / Performance Indicator', 'Current Value (INR / Records Count)'],
    ['Total Invoiced Sales (₹)', totalSales],
    ['Total Confirmed Collections (₹)', totalCollected],
    ['Total Cash Collections (₹)', totalCash],
    ['Total UPI Collections (₹)', totalUpi],
    ['Total Card Collections (₹)', totalCard],
    ['Outstanding Customer Balances (₹)', state.invoices.reduce((sum, i) => sum + i.balanceAmount, 0)],
    ['Active Floor Sessions Right Now', activeSessions],
    ['Total Lifetime Sessions Logged', state.sessions.length],
    ['Total Invoices Issued', state.invoices.length],
    ['Total Registered Customers', state.customers.length],
    ['Available Resources / Consoles', state.resources.filter((r) => r.status === 'AVAILABLE').length],
    ['Active Member Packages', state.customerPackages.filter((cp) => cp.status === 'ACTIVE').length]
  ];
};

export const buildInvoicesData = (invoices: Invoice[], customers: Customer[]): (string | number)[][] => {
  const headers = [
    'Invoice Number',
    'Date & Time',
    'Customer Name',
    'Mobile Number',
    'Subtotal (₹)',
    'Discount (₹)',
    'Tax (₹)',
    'Total Amount (₹)',
    'Paid Amount (₹)',
    'Balance Due (₹)',
    'Status',
    'Staff Terminal'
  ];

  const rows = invoices.map((inv) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    return [
      inv.invoiceNumber,
      new Date(inv.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      cust?.name || 'Walk-in Guest',
      cust?.phone ? `+91 ${cust.phone}` : 'N/A',
      inv.subtotal,
      inv.discount,
      inv.tax,
      inv.totalAmount,
      inv.paidAmount,
      inv.balanceAmount,
      inv.status,
      inv.staffId
    ];
  });

  return [headers, ...rows];
};

export const buildCustomersData = (customers: Customer[], invoices: Invoice[]): (string | number)[][] => {
  const headers = [
    'Customer Name',
    'Mobile Number',
    'Total Visits',
    'Lifetime Spend (₹)',
    'Joined Date',
    'Customer Notes'
  ];

  const rows = customers.map((c) => {
    const custInvoices = invoices.filter((inv) => inv.customerId === c.id);
    const totalSpend = custInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    return [
      c.name,
      `+91 ${c.phone}`,
      c.totalVisits || 1,
      totalSpend,
      new Date(c.createdAt).toLocaleDateString('en-IN'),
      c.notes || ''
    ];
  });

  return [headers, ...rows];
};

export const buildSessionsData = (
  sessions: Session[],
  customers: Customer[],
  products: Product[],
  resources: Resource[]
): (string | number)[][] => {
  const headers = [
    'Session ID',
    'Start Time',
    'Scheduled End Time',
    'Duration (Min)',
    'Customer Name',
    'Mobile Number',
    'Game / Attraction',
    'Assigned Resource',
    'Fee (₹)',
    'Status',
    'Package Minutes Used'
  ];

  const rows = sessions.map((s) => {
    const cust = customers.find((c) => c.id === s.customerId);
    const prod = products.find((p) => p.id === s.productId);
    const res = resources.find((r) => r.id === s.resourceId);

    return [
      s.id,
      new Date(s.startTime).toLocaleTimeString('en-IN'),
      new Date(s.scheduledEndTime).toLocaleTimeString('en-IN'),
      s.durationMinutes,
      cust?.name || 'Guest',
      cust?.phone ? `+91 ${cust.phone}` : '',
      prod?.name || 'Game',
      res?.name || 'General Floor',
      s.price,
      s.status,
      s.packageMinutesUsed || 0
    ];
  });

  return [headers, ...rows];
};

export const buildPaymentsData = (payments: Payment[], customers: Customer[]): (string | number)[][] => {
  const headers = [
    'Payment ID',
    'Timestamp',
    'Customer Name',
    'Payment Method',
    'UTR / Bank Ref Number',
    'Amount (₹)',
    'Reconciliation Status',
    'Cashier / Staff'
  ];

  const rows = payments.map((p) => {
    const cust = customers.find((c) => c.id === p.customerId);
    return [
      p.id,
      new Date(p.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      cust?.name || 'Walk-in Guest',
      p.paymentMethod,
      p.referenceNumber || 'N/A',
      p.amount,
      p.status,
      p.receivedBy
    ];
  });

  return [headers, ...rows];
};

export const buildProductsData = (
  products: Product[],
  gameCategories: GameCategory[]
): (string | number)[][] => {
  const headers = [
    'Product ID',
    'Game Name',
    'Category',
    'Pricing Type',
    'Default Price (₹)',
    'Active Status'
  ];

  const rows = products.map((p) => {
    const cat = gameCategories.find((c) => c.id === p.categoryId);
    return [
      p.id,
      p.name,
      cat?.name || 'General',
      p.pricingType,
      p.defaultPrice,
      p.isActive ? 'ACTIVE' : 'INACTIVE'
    ];
  });

  return [headers, ...rows];
};

export const buildResourcesData = (
  resources: Resource[],
  gameCategories: GameCategory[]
): (string | number)[][] => {
  const headers = [
    'Resource ID',
    'Hardware / Table Name',
    'Category',
    'Hardware Type',
    'Capacity',
    'Current Occupancy',
    'Operational Status',
    'Last Updated'
  ];

  const rows = resources.map((r) => {
    const cat = gameCategories.find((c) => c.id === r.categoryId);
    return [
      r.id,
      r.name,
      cat?.name || 'General',
      r.resourceType,
      r.capacity,
      r.currentOccupancy,
      r.status,
      new Date(r.updatedAt).toLocaleString('en-IN')
    ];
  });

  return [headers, ...rows];
};

export const buildPackagesData = (
  packages: PackageDefinition[],
  customerPackages: CustomerPackage[],
  customers: Customer[]
): (string | number)[][] => {
  const headers = [
    'Package / Subscription ID',
    'Type',
    'Package Name',
    'Customer Name',
    'Phone',
    'Price / Total Mins',
    'Remaining Mins',
    'Status',
    'Expiry / Validity'
  ];

  // Section A: Package Definitions
  const defRows = packages.map((pkg) => [
    pkg.id,
    'CATALOGUE_DEFINITION',
    pkg.name,
    'All Eligible Customers',
    'N/A',
    `₹${pkg.price} (${pkg.allocatedMinutes}m)`,
    pkg.allocatedMinutes,
    pkg.isActive ? 'ACTIVE' : 'INACTIVE',
    `${pkg.validityDays} Days`
  ]);

  // Section B: Customer Active Subscriptions
  const subRows = customerPackages.map((cp) => {
    const pkg = packages.find((p) => p.id === cp.packageId);
    const cust = customers.find((c) => c.id === cp.customerId);
    return [
      cp.id,
      'CUSTOMER_SUBSCRIPTION',
      pkg?.name || 'Package',
      cust?.name || 'Customer',
      cust?.phone ? `+91 ${cust.phone}` : '',
      `${cp.allocatedMinutes} mins allocated`,
      cp.remainingMinutes,
      cp.status,
      new Date(cp.expiresAt).toLocaleDateString('en-IN')
    ];
  });

  return [headers, ...defRows, ...subRows];
};

export const buildVisitsData = (visits: Visit[], customers: Customer[]): (string | number)[][] => {
  const headers = [
    'Visit ID',
    'Customer Name',
    'Mobile Number',
    'Check-In Time',
    'Check-Out Time',
    'Visit Status',
    'Created By Terminal'
  ];

  const rows = visits.map((v) => {
    const cust = customers.find((c) => c.id === v.customerId);
    return [
      v.id,
      cust?.name || 'Guest',
      cust?.phone ? `+91 ${cust.phone}` : '',
      new Date(v.checkInTime).toLocaleString('en-IN'),
      v.checkOutTime ? new Date(v.checkOutTime).toLocaleString('en-IN') : 'Ongoing',
      v.status,
      v.createdBy
    ];
  });

  return [headers, ...rows];
};

export const buildStaffData = (profiles: Profile[]): (string | number)[][] => {
  const headers = [
    'Staff ID',
    'Full Name',
    'Email Address',
    'Mobile Number',
    'Role & Permissions',
    'Active Status'
  ];

  const rows = profiles.map((p) => [
    p.id,
    p.fullName,
    p.email,
    `+91 ${p.phone}`,
    p.role.toUpperCase(),
    p.isActive ? 'ACTIVE' : 'SUSPENDED'
  ]);

  return [headers, ...rows];
};

/**
 * Universal Entity Updater to Google Sheets
 * Supports updating a specific entity tab or the entire Master Workbook.
 */
export const updateEntityInGoogleSheet = async (
  accessToken: string,
  targetSpreadsheetId: string | null,
  sheetTitle: string,
  entityKey: EntitySyncKey,
  state: SystemState,
  writeMode: 'OVERWRITE' | 'APPEND' = 'OVERWRITE'
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  tabsUpdated: string[];
  totalRowsSynced: number;
}> => {
  let spreadsheetId = targetSpreadsheetId;
  let spreadsheetUrl = '';

  if (entityKey === 'ALL_ENTITIES') {
    // 10 Tabs Master Sync
    const tabNames = [
      'Daily Summary',
      'Invoices & Sales',
      'Customers Directory',
      'Game Sessions',
      'Payments Ledger',
      'Games Catalogue',
      'Resources & Floor',
      'Packages & Balances',
      'Visits & Check-Ins',
      'Staff & Terminals'
    ];

    if (!spreadsheetId) {
      const created = await createGoogleSpreadsheet(accessToken, sheetTitle, tabNames);
      spreadsheetId = created.spreadsheetId;
      spreadsheetUrl = created.spreadsheetUrl;
    } else {
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      await ensureSheetTabs(accessToken, spreadsheetId, tabNames);
    }

    // Write all 10 tabs
    const summaryData = buildSummaryData(state);
    const invoicesData = buildInvoicesData(state.invoices, state.customers);
    const customersData = buildCustomersData(state.customers, state.invoices);
    const sessionsData = buildSessionsData(state.sessions, state.customers, state.products, state.resources);
    const paymentsData = buildPaymentsData(state.payments, state.customers);
    const productsData = buildProductsData(state.products, state.gameCategories);
    const resourcesData = buildResourcesData(state.resources, state.gameCategories);
    const packagesData = buildPackagesData(state.packages, state.customerPackages, state.customers);
    const visitsData = buildVisitsData(state.visits, state.customers);
    const staffData = buildStaffData(state.profiles);

    await updateSheetValues(accessToken, spreadsheetId, "'Daily Summary'!A1", summaryData);
    await updateSheetValues(accessToken, spreadsheetId, "'Invoices & Sales'!A1", invoicesData);
    await updateSheetValues(accessToken, spreadsheetId, "'Customers Directory'!A1", customersData);
    await updateSheetValues(accessToken, spreadsheetId, "'Game Sessions'!A1", sessionsData);
    await updateSheetValues(accessToken, spreadsheetId, "'Payments Ledger'!A1", paymentsData);
    await updateSheetValues(accessToken, spreadsheetId, "'Games Catalogue'!A1", productsData);
    await updateSheetValues(accessToken, spreadsheetId, "'Resources & Floor'!A1", resourcesData);
    await updateSheetValues(accessToken, spreadsheetId, "'Packages & Balances'!A1", packagesData);
    await updateSheetValues(accessToken, spreadsheetId, "'Visits & Check-Ins'!A1", visitsData);
    await updateSheetValues(accessToken, spreadsheetId, "'Staff & Terminals'!A1", staffData);

    const totalRows =
      summaryData.length +
      invoicesData.length +
      customersData.length +
      sessionsData.length +
      paymentsData.length +
      productsData.length +
      resourcesData.length +
      packagesData.length +
      visitsData.length +
      staffData.length;

    return {
      spreadsheetId,
      spreadsheetUrl,
      tabsUpdated: tabNames,
      totalRowsSynced: totalRows
    };
  }

  // Single Entity Target
  const option = ENTITY_SYNC_OPTIONS.find((o) => o.key === entityKey) || ENTITY_SYNC_OPTIONS[1];
  const tabName = option.tabName;

  let dataset: (string | number)[][] = [];
  if (entityKey === 'DAILY_SUMMARY') dataset = buildSummaryData(state);
  else if (entityKey === 'INVOICES') dataset = buildInvoicesData(state.invoices, state.customers);
  else if (entityKey === 'CUSTOMERS') dataset = buildCustomersData(state.customers, state.invoices);
  else if (entityKey === 'SESSIONS') dataset = buildSessionsData(state.sessions, state.customers, state.products, state.resources);
  else if (entityKey === 'PAYMENTS') dataset = buildPaymentsData(state.payments, state.customers);
  else if (entityKey === 'PRODUCTS') dataset = buildProductsData(state.products, state.gameCategories);
  else if (entityKey === 'RESOURCES') dataset = buildResourcesData(state.resources, state.gameCategories);
  else if (entityKey === 'PACKAGES') dataset = buildPackagesData(state.packages, state.customerPackages, state.customers);
  else if (entityKey === 'VISITS') dataset = buildVisitsData(state.visits, state.customers);
  else if (entityKey === 'STAFF') dataset = buildStaffData(state.profiles);

  if (!spreadsheetId) {
    const created = await createGoogleSpreadsheet(accessToken, sheetTitle, [tabName]);
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl;
    await updateSheetValues(accessToken, spreadsheetId, `'${tabName}'!A1`, dataset);
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    await ensureSheetTabs(accessToken, spreadsheetId, [tabName]);

    if (writeMode === 'APPEND') {
      // Append only data rows (skip headers)
      const dataRows = dataset.slice(1);
      if (dataRows.length > 0) {
        await appendSheetValues(accessToken, spreadsheetId, `'${tabName}'!A1`, dataRows);
      }
    } else {
      // Clear and Overwrite
      await clearSheetValues(accessToken, spreadsheetId, `'${tabName}'!A1:Z5000`);
      await updateSheetValues(accessToken, spreadsheetId, `'${tabName}'!A1`, dataset);
    }
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    tabsUpdated: [tabName],
    totalRowsSynced: dataset.length
  };
};
