// ─── SINGLE SOURCE OF TRUTH FOR ALL PRICING ───────────────────────────────
// Change prices here and they update everywhere in the app.

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceKobo: 0,
    uploads: 50,
    storageDays: 7,
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
    uploads: 500,
    storageDays: 60,
    activePageDays: 30,
    bulkDownload: true,
    basicReel: true,
    advancedReel: false,
    slideshow: true,
    contentModeration: false,
    paystackPlanCode: 'PLN_flex_guestvue', // set after creating plan in Paystack
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 59999,
    priceKobo: 5999900,
    uploads: Infinity,
    storageDays: 120,
    activePageDays: 90,
    bulkDownload: true,
    basicReel: true,
    advancedReel: true,
    slideshow: true,
    contentModeration: true,
    paystackPlanCode: 'PLN_pro_guestvue',
  },
} as const

export const BUSINESS_PLANS = {
  activation: {
    id: 'activation',
    name: 'Activation',
    price: 99999,
    priceKobo: 9999900,
    uploadsPerMonth: 2000,
    basicReel: true,
    advancedReel: false,
    paystackPlanCode: 'PLN_activation_guestvue',
  },
  tycoon: {
    id: 'tycoon',
    name: 'Tycoon',
    price: 149999,
    priceKobo: 14999900,
    uploadsPerMonth: Infinity,
    basicReel: true,
    advancedReel: true,
    paystackPlanCode: 'PLN_tycoon_guestvue',
  },
} as const

export const PLANNER_PLANS = {
  starter:  { id: 'starter',  name: 'Starter',           price: 99999,  priceKobo: 9999900,  activeEvents: 3,  paystackPlanCode: 'PLN_starter_guestvue' },
  growth:   { id: 'growth',   name: 'Growth',             price: 149999, priceKobo: 14999900, activeEvents: 5,  paystackPlanCode: 'PLN_growth_guestvue' },
  scale:    { id: 'scale',    name: 'Scale',              price: 249999, priceKobo: 24999900, activeEvents: 10, paystackPlanCode: 'PLN_scale_guestvue' },
  jagaban:  { id: 'jagaban',  name: 'Industry Jagaban',   price: 349999, priceKobo: 34999900, activeEvents: 20, paystackPlanCode: 'PLN_jagaban_guestvue' },
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
  pro:  { price: 44999, priceKobo: 4499900, retailPrice: 59999, margin: 15000 },
} as const

export const AFFILIATE = {
  standardRate: 0.20,
  loyaltyRate: 0.25,
  loyaltyThreshold: 15, // referrals to unlock 25%
  wholesaleDiscountAfterThreshold: 0.05,
  payoutMinimum: 5000,
  cookieDays: 30,
} as const

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}
