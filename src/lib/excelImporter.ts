import * as XLSX from 'xlsx';
import { Customer, Invoice, InvoiceItem, PackageDefinition, Product } from '../types';
import { normalizeIndianPhone } from './phoneUtils';

export interface WorkbookValidationReport {
  fileName: string;
  sheetsFound: string[];
  expectedSheets: string[];
  totalRowsProcessed: number;
  validSalesCount: number;
  duplicateInvoicesCount: number;
  invalidDatesCount: number;
  unknownGamesCount: number;
  warnings: string[];
  errors: string[];
  previewData: {
    sales: Array<{
      invoiceNo: string;
      customerName: string;
      phone: string;
      gameName: string;
      amount: number;
      date: string;
      status: 'VALID' | 'DUPLICATE' | 'ERROR';
      errorReason?: string;
    }>;
    gameList: Array<{
      name: string;
      price: number;
      category?: string;
    }>;
    packages: Array<{
      name: string;
      price: number;
      minutes: number;
      validity: string;
    }>;
  };
}

export function parseWonderlandWorkbook(
  fileBuffer: ArrayBuffer,
  fileName: string,
  existingInvoices: Invoice[],
  catalogProducts: Product[]
): WorkbookValidationReport {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  const expectedSheets = [
    'SALE',
    'GAME LIST',
    'SUMMARY',
    'Package',
    'Package History',
    'Dashboard',
    'Dashboard_Data',
    'DASH_HELPER',
    'DashboardData'
  ];

  const report: WorkbookValidationReport = {
    fileName,
    sheetsFound: sheetNames,
    expectedSheets,
    totalRowsProcessed: 0,
    validSalesCount: 0,
    duplicateInvoicesCount: 0,
    invalidDatesCount: 0,
    unknownGamesCount: 0,
    warnings: [],
    errors: [],
    previewData: {
      sales: [],
      gameList: [],
      packages: []
    }
  };

  const existingInvoiceSet = new Set(existingInvoices.map((inv) => inv.invoiceNumber.toLowerCase()));
  const seenInBatchInvoiceSet = new Set<string>();
  const validProductNames = new Set(catalogProducts.map((p) => p.name.trim().toLowerCase()));

  // 1. Process 'GAME LIST' sheet if present
  const gameListSheetName = sheetNames.find((s) => s.toUpperCase() === 'GAME LIST');
  if (gameListSheetName) {
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[gameListSheetName]);
    rawRows.forEach((row) => {
      const name = String(row['Game Name'] || row['Game'] || row['Product'] || row['Name'] || '').trim();
      const priceVal = Number(row['Price'] || row['Listed Price'] || row['Rate'] || 0);
      if (name) {
        report.previewData.gameList.push({
          name,
          price: isNaN(priceVal) ? 0 : priceVal,
          category: String(row['Category'] || '')
        });
      }
    });
  } else {
    report.warnings.push('GAME LIST worksheet not found in file. Using application standard catalogue.');
  }

  // 2. Process 'Package' sheet if present
  const packageSheetName = sheetNames.find((s) => s.toUpperCase() === 'PACKAGE');
  if (packageSheetName) {
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[packageSheetName]);
    rawRows.forEach((row) => {
      const name = String(row['Package Name'] || row['Package'] || row['Name'] || '').trim();
      const priceVal = Number(row['Price'] || row['Rate'] || 0);
      const minutesVal = Number(row['Allocated Minutes'] || row['Minutes'] || 0);
      const validityVal = String(row['Validity'] || row['Days'] || '30 D');
      if (name) {
        report.previewData.packages.push({
          name,
          price: isNaN(priceVal) ? 0 : priceVal,
          minutes: isNaN(minutesVal) ? 0 : minutesVal,
          validity: validityVal
        });
      }
    });
  }

  // 3. Process 'SALE' sheet if present
  const saleSheetName = sheetNames.find((s) => s.toUpperCase() === 'SALE');
  if (saleSheetName) {
    const rawSales = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[saleSheetName]);
    report.totalRowsProcessed = rawSales.length;

    rawSales.forEach((row, index) => {
      const rowNum = index + 2;
      const invoiceNo = String(
        row['Invoice No'] || row['Invoice'] || row['Bill No'] || row['Inv No'] || `WND-IMP-${rowNum}`
      ).trim();
      const customerName = String(row['Customer Name'] || row['Customer'] || row['Name'] || 'Walk-in Guest').trim();
      const rawPhone = String(row['Mobile'] || row['Phone'] || row['Contact'] || '').trim();
      const phone = normalizeIndianPhone(rawPhone) || '9800000000';
      const gameName = String(row['Game Name'] || row['Game'] || row['Product'] || row['Item'] || '').trim();
      const rawAmount = Number(row['Amount'] || row['Total'] || row['Net'] || row['Price'] || 0);
      const rawDate = row['Date'] || row['Time'] || row['Created At'];

      let parsedDate = new Date().toISOString();
      let hasDateError = false;

      if (rawDate) {
        if (typeof rawDate === 'number') {
          // Excel serial date format
          parsedDate = new Date((rawDate - (25567 + 2)) * 86400 * 1000).toISOString();
        } else {
          const d = new Date(String(rawDate));
          if (!isNaN(d.getTime())) {
            parsedDate = d.toISOString();
          } else {
            hasDateError = true;
            report.invalidDatesCount++;
            report.warnings.push(`Row ${rowNum}: Malformed date '${rawDate}', defaulting to current timestamp.`);
          }
        }
      }

      let status: 'VALID' | 'DUPLICATE' | 'ERROR' = 'VALID';
      let errorReason: string | undefined;

      const normInvoice = invoiceNo.toLowerCase();
      if (existingInvoiceSet.has(normInvoice) || seenInBatchInvoiceSet.has(normInvoice)) {
        status = 'DUPLICATE';
        errorReason = 'Invoice identifier already exists in system or batch';
        report.duplicateInvoicesCount++;
      } else {
        seenInBatchInvoiceSet.add(normInvoice);
      }

      if (gameName && !validProductNames.has(gameName.toLowerCase())) {
        report.unknownGamesCount++;
        if (status === 'VALID') {
          report.warnings.push(`Row ${rowNum}: Unknown game '${gameName}'. Will be mapped as Custom Activity.`);
        }
      }

      if (isNaN(rawAmount) || rawAmount < 0) {
        status = 'ERROR';
        errorReason = 'Invalid or negative amount';
        report.errors.push(`Row ${rowNum}: Invalid transaction amount '${rawAmount}'`);
      }

      if (status === 'VALID') {
        report.validSalesCount++;
      }

      report.previewData.sales.push({
        invoiceNo,
        customerName,
        phone,
        gameName: gameName || 'General Arcade Play',
        amount: isNaN(rawAmount) ? 0 : rawAmount,
        date: parsedDate,
        status,
        errorReason
      });
    });
  } else {
    report.warnings.push("SALE worksheet not found in file. Supported sheets: 'SALE', 'GAME LIST', 'Package'.");
  }

  return report;
}
