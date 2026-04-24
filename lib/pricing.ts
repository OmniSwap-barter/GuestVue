// ─── SINGLE SOURCE OF TRUTH FOR ALL PRICING ───────────────────────────────
// Change prices here and they update everywhere in the app.

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceKobo: 0,
    uploads: 30,
    storageDays: 1,
    activePageHours: 24,
    bulkDownload: false,
    basicReel: false,
    advancedReel: false,
    slideshow: false,
    contentModeration: false,
    paystackPlanCode: null,
  },
  flex: {
    id: 'flex',
    name: 'Flex',
    price: 24999,
    priceKobo: 2499900,
    uploads: 300,
    storageDays: 7,
    activePageDays: 7,
    bulkDownload: true,
    basicReel: false,
    advancedReel: false,
    slideshow: true,
    contentModeration: false,
    paystackPlanCode: 'PLN_flex_guestvue',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49999,
    priceKobo: 4999900,
    uploads: 1000,
    storageDays: 30,
    activePageDays: 30,
    bulkDownload: true,
    basicReel: true,
    advancedReel: false,
    slideshow: true,
    contentModeration: false,
    paystackPlanCode: 'PLN_pro_guestvue',
  },
} as const

export const BUSINESS_PLANS = {
  activation_starter: {
    id: 'activation_starter',
    name: 'Activation Starter',
    price: 53997,
    priceKobo: 5399700,
    events: 1,
    uploadsPerEvent: 500,
    basicReel: false,
    advancedReel: false,
    paystackPlanCode: 'PLN_activation_starter_guestvue',
  },
  tycoon: {
    id: 'tycoon',
    name: 'Tycoon',
    price: 89995,
    priceKobo: 8999500,
    events: 3,
    uploadsPerEvent: 2000,
    basicReel: false,
    advancedReel: true,
    paystackPlanCode: 'PLN_tycoon_guestvue',
  },
} as const

// Monthly brand/business subscriptions — recurring billing
export const BRAND_MONTHLY = {
  starter: {
    id: 'brand_monthly_starter',
    name: 'Brand Starter',
    price: 49999,
    priceKobo: 4999900,
    eventsPerMonth: -1, // unlimited
    uploadsPerEvent: 300,
    whiteLabel: false,
    dedicatedSupport: false,
    paystackPlanCode: 'PLN_brand_starter_monthly',
  },
  growth: {
    id: 'brand_monthly_growth',
    name: 'Brand Growth',
    price: 99999,
    priceKobo: 9999900,
    eventsPerMonth: -1, // unlimited
    uploadsPerEvent: 600,
    whiteLabel: true,
    dedicatedSupport: false,
    paystackPlanCode: 'PLN_brand_growth_monthly',
  },
  enterprise: {
    id: 'brand_monthly_enterprise',
    name: 'Brand Enterprise',
    price: 199999,
    priceKobo: 19999900,
    eventsPerMonth: -1, // unlimited
    uploadsPerEvent: -1, // unlimited
    whiteLabel: true,
    dedicatedSupport: true,
    paystackPlanCode: 'PLN_brand_enterprise_monthly',
  },
} as const

// Vendor / Professional packages — one-time bundle for planners, photographers, agencies
export const PLANNER_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 53997,
    priceKobo: 5399700,
    activeEvents: 2,
    uploadsPerEvent: 300,
    paystackPlanCode: 'PLN_vendor_starter_guestvue',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 94999,
    priceKobo: 9499900,
    activeEvents: 5,
    uploadsPerEvent: 600,
    paystackPlanCode: 'PLN_vendor_growth_guestvue',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 179999,
    priceKobo: 17999900,
    activeEvents: 12,
    uploadsPerEvent: 1500,
    paystackPlanCode: 'PLN_vendor_scale_guestvue',
  },
  jagaban: {
    id: 'jagaban',
    name: 'Jagaban',
    price: 350000,
    priceKobo: 35000000,
    activeEvents: -1, // unlimited
    uploadsPerEvent: -1, // unlimited
    storageMonths: 12,
    paystackPlanCode: 'PLN_vendor_jagaban_guestvue',
  },
} as const

export const ADDONS = {
  basicReel:     { id: 'basic_reel',      name: 'Basic AI Reel',          price: 5000,  priceKobo: 500000 },
  advancedReel:  { id: 'advanced_reel',   name: 'Advanced AI Reel',       price: 14999, priceKobo: 1499900 },
  slideshow:     { id: 'slideshow',       name: 'Live Slideshow',         price: 3000,  priceKobo: 300000 },
  extendedPage:  { id: 'extended_page',   name: 'Extended Active Page',   price: 2000,  priceKobo: 200000 },
  extraStorage:  { id: 'extra_storage',   name: 'Extra Storage (1 month)',price: 1500,  priceKobo: 150000 },
  galleryArchive:{ id: 'gallery_archive', name: 'Gallery Archive 12mo',   price: 2000,  priceKobo: 200000 },
  removeLogo:    { id: 'remove_logo',     name: 'Remove GuestVue Logo',   price: 5000,  priceKobo: 500000 },
} as const

export const WHOLESALE = {
  flex: { price: 17999, priceKobo: 1799900, retailPrice: 24999, margin: 7000 },
  pro:  { price: 34999, priceKobo: 3499900, retailPrice: 49999, margin: 15000 },
} as const

export const AFFILIATE = {
  standardRate: 0.20,
  loyaltyRate: 0.25,
  loyaltyThreshold: 15,
  wholesaleDiscountAfterThreshold: 0.05,
  payoutMinimum: 5000,
  cookieDays: 30,
} as const

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}
