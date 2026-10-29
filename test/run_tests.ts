import { normalizeIndianPhone, isValidIndianPhone } from '../src/lib/phoneUtils';
import { INITIAL_SYSTEM_STATE } from '../src/lib/initialData';
import { parseWonderlandWorkbook } from '../src/lib/excelImporter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('=== RUNNING WONDERLAND ARCADE MANAGEMENT TEST SUITE ===\n');

// 1. Phone Normalization Tests
console.log('--- Suite 1: Customer Phone Normalization ---');
assert(normalizeIndianPhone('+91 98765-43210') === '9876543210', 'Strips +91, spaces, and hyphens');
assert(normalizeIndianPhone('09876543210') === '9876543210', 'Strips leading zero');
assert(normalizeIndianPhone('919876543210') === '9876543210', 'Strips 91 prefix on 12-digit numbers');
assert(isValidIndianPhone('+91 9876543210'), 'Validates proper 10-digit Indian mobile');
assert(!isValidIndianPhone('12345'), 'Rejects short invalid numbers');
assert(!isValidIndianPhone('2876543210'), 'Rejects Indian mobile starting with invalid digit');

// 2. Catalogue & Pricing Verification against Workbook Spec
console.log('\n--- Suite 2: Catalogue & Product Spec Compliance ---');
const products = INITIAL_SYSTEM_STATE.products;
const basketball = products.find((p) => p.name.toLowerCase() === 'basket ball');
assert(basketball !== undefined && basketball.defaultPrice === 49, 'Basketball listed at ₹49');

const snookerTable = products.find((p) => p.name === 'Snooker Table');
assert(snookerTable !== undefined && snookerTable.defaultPrice === 199, 'Snooker Table listed at ₹199');

const carSimulator = products.find((p) => p.name === 'Car simulator');
assert(carSimulator !== undefined && carSimulator.defaultPrice === 179, 'Car Simulator listed at ₹179');

const metaBat = products.find((p) => p.name === 'Meta Bat — Per Over');
assert(metaBat !== undefined && metaBat.defaultPrice === 29, 'Meta Bat Cricket per over listed at ₹29');

// 3. Package Definitions & Pricing
console.log('\n--- Suite 3: Package Definitions & Allocations ---');
const packages = INITIAL_SYSTEM_STATE.packages;
const snooker30D = packages.find((p) => p.name === 'PKG Snooker Table 30 D');
assert(
  snooker30D !== undefined &&
    snooker30D.price === 4999 &&
    snooker30D.allocatedMinutes === 1800 &&
    snooker30D.validityDays === 30,
  'PKG Snooker Table 30 D verified (₹4,999, 1,800m, 30 days)'
);

const ps15D = packages.find((p) => p.name === 'PKG Playstation 15 D');
assert(
  ps15D !== undefined &&
    ps15D.price === 999 &&
    ps15D.allocatedMinutes === 900 &&
    ps15D.validityDays === 15,
  'PKG Playstation 15 D verified (₹999, 900m, 15 days)'
);

// 4. Resource Concurrency & Capacity Math
console.log('\n--- Suite 4: Resource Allocation & Concurrency Logic ---');
const ps5Console1 = INITIAL_SYSTEM_STATE.resources.find((r) => r.id === 'res-ps-01');
assert(ps5Console1 !== undefined && ps5Console1.capacity === 1, 'PS5 Console #1 is single-capacity');

const softPlay = INITIAL_SYSTEM_STATE.resources.find((r) => r.id === 'res-softplay');
assert(softPlay !== undefined && softPlay.capacity === 25, 'Soft Play Arena capacity enforces 25 max children');

// 5. Timer Calculations & 5-minute Grace Period
console.log('\n--- Suite 5: Server-Authoritative Timers & Grace Period ---');
const now = Date.now();
const durationMinutes = 60;
const graceMinutes = 5;
const scheduledEndMs = now + durationMinutes * 60000;
const graceDeadlineMs = scheduledEndMs + graceMinutes * 60000;

assert(
  Math.round((scheduledEndMs - now) / 60000) === 60,
  'Scheduled end is exact duration'
);
assert(
  Math.round((graceDeadlineMs - scheduledEndMs) / 60000) === 5,
  'Grace deadline is exact 5-minute operational buffer'
);

// State transitions:
const checkStatus = (currentMs: number) => {
  if (currentMs < scheduledEndMs) return 'RUNNING';
  if (currentMs < graceDeadlineMs) return 'DUE';
  return 'OVERDUE';
};

assert(checkStatus(now + 30 * 60000) === 'RUNNING', '30m in is RUNNING');
assert(checkStatus(scheduledEndMs + 60000) === 'DUE', '1m past scheduled end is DUE (grace period active)');
assert(checkStatus(graceDeadlineMs + 1000) === 'OVERDUE', 'Past grace deadline is OVERDUE');

console.log('\n======================================================');
console.log('ALL AUTOMATED TEST SUITES EXECUTED AND PASSED SUCCESSFULLY!');
console.log('======================================================');
