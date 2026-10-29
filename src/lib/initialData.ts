import { SystemState } from '../types';

export const INITIAL_SYSTEM_STATE: SystemState = {
  locations: [
    {
      id: 'loc-01',
      name: 'Wonderland Entertainment Arcade',
      code: 'WND-01',
      address: 'Shop 12-16, City Mall, MG Road',
      timezone: 'Asia/Kolkata',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  profiles: [
    {
      id: 'usr-owner-01',
      locationId: 'loc-01',
      email: 'owner@wonderland.com',
      fullName: 'Vikram Sethi (Owner)',
      role: 'owner',
      phone: '9820011223',
      pin: '1234',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr-desk-01',
      locationId: 'loc-01',
      email: 'desk@wonderland.com',
      fullName: 'Pooja Sharma (Front Desk)',
      role: 'receptionist',
      phone: '9820044556',
      pin: '1234',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  gameCategories: [
    { id: 'cat-ps', name: 'PlayStation', slug: 'playstation', icon: 'Gamepad2', sortOrder: 1 },
    { id: 'cat-snooker', name: 'Snooker & Pool', slug: 'snooker-pool', icon: 'CircleDot', sortOrder: 2 },
    { id: 'cat-arcade', name: 'Arcade Machines', slug: 'arcade', icon: 'Joystick', sortOrder: 3 },
    { id: 'cat-vr', name: 'Virtual Reality', slug: 'vr', icon: 'Glasses', sortOrder: 4 },
    { id: 'cat-cricket', name: 'Meta Bat Cricket', slug: 'cricket', icon: 'Flame', sortOrder: 5 },
    { id: 'cat-massage', name: 'Chair Massager', slug: 'massage', icon: 'Armchair', sortOrder: 6 },
    { id: 'cat-softplay', name: 'Soft Play Zone', slug: 'soft-play', icon: 'Sparkles', sortOrder: 7 }
  ],
  products: [
    // Arcade Products (Quantity / Unit based)
    { id: 'prod-arc-basket', categoryId: 'cat-arcade', name: 'Basket ball', pricingType: 'UNIT_BASED', defaultPrice: 49, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-airhockey', categoryId: 'cat-arcade', name: 'Air Hockey', pricingType: 'UNIT_BASED', defaultPrice: 49, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-carrace', categoryId: 'cat-arcade', name: 'Car racing', pricingType: 'UNIT_BASED', defaultPrice: 79, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-horse', categoryId: 'cat-arcade', name: 'Kiddie horse', pricingType: 'UNIT_BASED', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-kcar', categoryId: 'cat-arcade', name: 'Kiddie car', pricingType: 'UNIT_BASED', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-frog', categoryId: 'cat-arcade', name: 'Frog hitting', pricingType: 'UNIT_BASED', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-gun', categoryId: 'cat-arcade', name: 'Kiddie gun firing', pricingType: 'UNIT_BASED', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-kcarrace', categoryId: 'cat-arcade', name: 'Kiddie car racing', pricingType: 'UNIT_BASED', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-kbike', categoryId: 'cat-arcade', name: 'Kiddie bike racing', pricingType: 'UNIT_BASED', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-arc-fishing', categoryId: 'cat-arcade', name: 'Kiddie fishing', pricingType: 'UNIT_BASED', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

    // Snooker & Pool
    { id: 'prod-snk-8ball', categoryId: 'cat-snooker', name: '8-Ball Table', pricingType: 'TIME_BASED', defaultPrice: 199, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-snk-snooker', categoryId: 'cat-snooker', name: 'Snooker Table', pricingType: 'TIME_BASED', defaultPrice: 199, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

    // PlayStation Products
    { id: 'prod-ps-1p', categoryId: 'cat-ps', name: 'PS 1 Player', pricingType: 'TIME_BASED', defaultPrice: 89, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-ps-2p', categoryId: 'cat-ps', name: 'PS 2 Player', pricingType: 'TIME_BASED', defaultPrice: 159, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-ps-3p', categoryId: 'cat-ps', name: 'PS 3 Player', pricingType: 'TIME_BASED', defaultPrice: 199, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-ps-4p', categoryId: 'cat-ps', name: 'PS 4 Player', pricingType: 'TIME_BASED', defaultPrice: 239, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-ps-sim', categoryId: 'cat-ps', name: 'Car simulator', pricingType: 'TIME_BASED', defaultPrice: 179, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

    // VR Products
    { id: 'prod-vr-vid', categoryId: 'cat-vr', name: 'VR Video Experience', pricingType: 'UNIT_BASED', defaultPrice: 69, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-vr-game', categoryId: 'cat-vr', name: 'VR Gaming Experience', pricingType: 'UNIT_BASED', defaultPrice: 149, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

    // Meta Bat Cricket
    { id: 'prod-cric-metabat', categoryId: 'cat-cricket', name: 'Meta Bat — Per Over', pricingType: 'PER_OVER', defaultPrice: 29, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

    // Chair Massager
    { id: 'prod-msg-full', categoryId: 'cat-massage', name: 'Full Body Massage', pricingType: 'TIME_BASED', defaultPrice: 99, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-msg-leg', categoryId: 'cat-massage', name: 'Leg Only Massage', pricingType: 'TIME_BASED', defaultPrice: 39, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-msg-stand', categoryId: 'cat-massage', name: 'Stand/Sit Massage', pricingType: 'TIME_BASED', defaultPrice: 39, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

    // Soft Play
    { id: 'prod-sp-half', categoryId: 'cat-softplay', name: 'Soft Play Half Hour', pricingType: 'TIME_BASED', defaultPrice: 99, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-sp-hour', categoryId: 'cat-softplay', name: 'Soft Play One Hour', pricingType: 'TIME_BASED', defaultPrice: 149, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'prod-sp-day', categoryId: 'cat-softplay', name: 'Soft Play Unlimited Day Pass', pricingType: 'DAY_PASS', defaultPrice: 249, isActive: true, createdAt: '2026-01-01T00:00:00Z' }
  ],
  productVariants: [
    // Snooker & 8-Ball
    { id: 'var-snk-8ball-60', productId: 'prod-snk-8ball', name: '60 Minutes (4 Players)', durationMinutes: 60, playerCount: 4, price: 199, isActive: true },
    { id: 'var-snk-snooker-60', productId: 'prod-snk-snooker', name: '60 Minutes (4 Players)', durationMinutes: 60, playerCount: 4, price: 199, isActive: true },

    // PlayStation Variants
    { id: 'var-ps-1p-60', productId: 'prod-ps-1p', name: '60 Minutes', durationMinutes: 60, playerCount: 1, price: 89, isActive: true },
    { id: 'var-ps-1p-30', productId: 'prod-ps-1p', name: '30 Minutes', durationMinutes: 30, playerCount: 1, price: 59, isActive: true },

    { id: 'var-ps-2p-60', productId: 'prod-ps-2p', name: '60 Minutes', durationMinutes: 60, playerCount: 2, price: 159, isActive: true },
    { id: 'var-ps-2p-30', productId: 'prod-ps-2p', name: '30 Minutes', durationMinutes: 30, playerCount: 2, price: 99, isActive: true },

    { id: 'var-ps-3p-60', productId: 'prod-ps-3p', name: '60 Minutes', durationMinutes: 60, playerCount: 3, price: 199, isActive: true },
    { id: 'var-ps-3p-30', productId: 'prod-ps-3p', name: '30 Minutes', durationMinutes: 30, playerCount: 3, price: 119, isActive: true },

    { id: 'var-ps-4p-60', productId: 'prod-ps-4p', name: '60 Minutes', durationMinutes: 60, playerCount: 4, price: 239, isActive: true },
    { id: 'var-ps-4p-30', productId: 'prod-ps-4p', name: '30 Minutes', durationMinutes: 30, playerCount: 4, price: 139, isActive: true },

    { id: 'var-ps-sim-60', productId: 'prod-ps-sim', name: '60 Minutes', durationMinutes: 60, playerCount: 1, price: 179, isActive: true },
    { id: 'var-ps-sim-30', productId: 'prod-ps-sim', name: '30 Minutes', durationMinutes: 30, playerCount: 1, price: 109, isActive: true },

    // Chair Massager Variants
    { id: 'var-msg-full-10', productId: 'prod-msg-full', name: '10 Minutes', durationMinutes: 10, playerCount: 1, price: 99, isActive: true },
    { id: 'var-msg-full-20', productId: 'prod-msg-full', name: '20 Minutes', durationMinutes: 20, playerCount: 1, price: 149, isActive: true },
    { id: 'var-msg-full-30', productId: 'prod-msg-full', name: '30 Minutes', durationMinutes: 30, playerCount: 1, price: 199, isActive: true },
    { id: 'var-msg-leg-10', productId: 'prod-msg-leg', name: '10 Minutes', durationMinutes: 10, playerCount: 1, price: 39, isActive: true },
    { id: 'var-msg-stand-10', productId: 'prod-msg-stand', name: '10 Minutes', durationMinutes: 10, playerCount: 1, price: 39, isActive: true },

    // Soft Play Variants
    { id: 'var-sp-half-30', productId: 'prod-sp-half', name: '30 Minutes', durationMinutes: 30, playerCount: 1, price: 99, isActive: true },
    { id: 'var-sp-hour-60', productId: 'prod-sp-hour', name: '60 Minutes', durationMinutes: 60, playerCount: 1, price: 149, isActive: true },
    { id: 'var-sp-day-pass', productId: 'prod-sp-day', name: 'Day Pass (Till Close)', durationMinutes: 480, playerCount: 1, price: 249, isActive: true }
  ],
  resources: [
    { id: 'res-ps-01', locationId: 'loc-01', categoryId: 'cat-ps', name: 'PS5 Console #1', resourceType: 'PlayStation 5', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-ps-02', locationId: 'loc-01', categoryId: 'cat-ps', name: 'PS5 Console #2', resourceType: 'PlayStation 5', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-ps-03', locationId: 'loc-01', categoryId: 'cat-ps', name: 'PS5 Console #3', resourceType: 'PlayStation 5', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-ps-04', locationId: 'loc-01', categoryId: 'cat-ps', name: 'PS5 Console #4', resourceType: 'PlayStation 5', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-ps-05', locationId: 'loc-01', categoryId: 'cat-ps', name: 'PS5 Console #5', resourceType: 'PlayStation 5', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-ps-sim', locationId: 'loc-01', categoryId: 'cat-ps', name: 'Car Simulator Rig', resourceType: 'Simulator Rig', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },

    { id: 'res-snk-01', locationId: 'loc-01', categoryId: 'cat-snooker', name: 'Snooker Table #1', resourceType: 'Snooker Table', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-snk-02', locationId: 'loc-01', categoryId: 'cat-snooker', name: 'Snooker Table #2', resourceType: 'Snooker Table', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-pool-01', locationId: 'loc-01', categoryId: 'cat-snooker', name: '8-Ball Pool Table #1', resourceType: 'Pool Table', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },

    { id: 'res-vr-01', locationId: 'loc-01', categoryId: 'cat-vr', name: 'VR Station #1', resourceType: 'VR Headset', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-vr-02', locationId: 'loc-01', categoryId: 'cat-vr', name: 'VR Station #2', resourceType: 'VR Headset', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },

    { id: 'res-msg-01', locationId: 'loc-01', categoryId: 'cat-massage', name: 'Massager Chair #1', resourceType: 'Massage Chair', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-msg-02', locationId: 'loc-01', categoryId: 'cat-massage', name: 'Massager Chair #2', resourceType: 'Massage Chair', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'res-msg-03', locationId: 'loc-01', categoryId: 'cat-massage', name: 'Massager Chair #3', resourceType: 'Massage Chair', status: 'AVAILABLE', capacity: 1, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' },

    { id: 'res-softplay', locationId: 'loc-01', categoryId: 'cat-softplay', name: 'Soft Play Adventure Arena', resourceType: 'Shared Zone', status: 'AVAILABLE', capacity: 25, currentOccupancy: 0, updatedAt: '2026-01-01T00:00:00Z' }
  ],
  packages: [
    { id: 'pkg-snk-30d', name: 'PKG Snooker Table 30 D', price: 4999, allocatedMinutes: 1800, validityDays: 30, eligibleCategoryId: 'cat-snooker', maxPlayers: 4, isActive: true },
    { id: 'pkg-snk-15d', name: 'PKG Snooker Table 15 D', price: 2499, allocatedMinutes: 900, validityDays: 15, eligibleCategoryId: 'cat-snooker', maxPlayers: 4, isActive: true },
    { id: 'pkg-ps-30d', name: 'PKG Playstation 30 D', price: 1799, allocatedMinutes: 1800, validityDays: 30, eligibleCategoryId: 'cat-ps', maxPlayers: 1, isActive: true },
    { id: 'pkg-ps-15d', name: 'PKG Playstation 15 D', price: 999, allocatedMinutes: 900, validityDays: 15, eligibleCategoryId: 'cat-ps', maxPlayers: 1, isActive: true }
  ],
  customers: [
    { id: 'cust-01', locationId: 'loc-01', name: 'Rahul Verma', phone: '9820192831', notes: 'Prefers PS5 Console 1 with FIFA', totalVisits: 5, createdAt: '2026-01-10T11:00:00Z' },
    { id: 'cust-02', locationId: 'loc-01', name: 'Ananya Sen', phone: '9811234567', notes: 'Has 30D Snooker package', totalVisits: 8, createdAt: '2026-01-12T14:30:00Z' },
    { id: 'cust-03', locationId: 'loc-01', name: 'Rohit Sharma', phone: '9876543210', notes: 'Regular weekend visitor with 2 kids', totalVisits: 3, createdAt: '2026-01-15T16:00:00Z' },
    { id: 'cust-04', locationId: 'loc-01', name: 'Karthik Raja', phone: '9940123987', notes: 'Plays 8-ball pool', totalVisits: 2, createdAt: '2026-01-20T17:15:00Z' }
  ],
  visits: [],
  sessions: [],
  sessionExtensions: [],
  customerPackages: [
    {
      id: 'cpkg-01',
      customerId: 'cust-02',
      packageId: 'pkg-snk-30d',
      allocatedMinutes: 1800,
      remainingMinutes: 1320,
      purchasedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
      status: 'ACTIVE'
    }
  ],
  packageUsages: [],
  invoices: [],
  invoiceItems: [],
  payments: [],
  paymentAllocations: [],
  notifications: [],
  auditLogs: [
    {
      id: 'log-seed-01',
      staffId: 'usr-owner-01',
      staffName: 'Vikram Sethi (Owner)',
      action: 'SYSTEM_INITIALIZED',
      entityName: 'system',
      details: { version: '1.0.0', catalogueCount: 23, packageCount: 4 },
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  settings: {
    defaultGracePeriodMinutes: 5,
    businessOpeningTime: '10:00',
    businessClosingTime: '23:00',
    businessTimezone: 'Asia/Kolkata',
    currencySymbol: '₹',
    softPlayMaxCapacity: 25,
    allowOverdueExtensions: true,
    enableSoundAlerts: true,
    whatsAppNotificationsEnabled: false
  }
};
