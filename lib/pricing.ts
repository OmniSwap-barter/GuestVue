// ─── SINGLE SOURCE OF TRUTH FOR ALL PRICING ───────────────────────────────
// Change prices here and they update everywhere in the app.

// ── Personal / Per-event Plans ──────────────────────────────────────────────
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceKobo: 0,
    uploads: 50,              // 50 photos & videos
    quality: 'good',          // saved in good quality
    storageDays: 7,           // 7 days storage
    activePageHours: 24,      // 24-hour active guest page
    bulkDownload: false,
    basicReel: false,         // add-on only
    advancedReel: false,
    slideshow: false,         // add-on only
    contentModeration: false,
    customization: 'basic',
    paystackPlanCode: null,
  },
  flex: {
    id: 'flex',
    name: 'Flex',
    price: 24999,
    priceKobo: 2499900,
    uploads: 500,             // 500 photos & videos
    quality: 'high',          // saved in high quality
    storageDays: 60,          // 2 months storage
    activePageDays: 30,       // 1-month active guest page
    bulkDownload: true,
    basicReel: true,          // basic AI reel included
    advancedReel: false,
    slideshow: true,          // live slideshow included
    contentModeration: false,
    customization: 'better',
    paystackPlanCode: 'PLN_flex_guestvue',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49999,
    priceKobo: 4999900,
    uploads: 999999,          // unlimited uploads
    quality: 'high',          // high quality
    storageDays: 120,         // 120 days storage
    activePageDays: 90,       // 3-month active guest page
    bulkDownload: true,
    basicReel: true,
    advancedReel: true,       // professional advanced AI reel
    slideshow: true,
    contentModeration: true,  // AI content moderation
    customization: 'advanced',
    paystackPlanCode: 'PLN_pro_guestvue',
  },
} as const

// ── Business / Brand Monthly Subscriptions ───────────────────────────────────
// Recurring monthly plans for brands, corporates, restaurants, clubs, etc.
// Features permanent QR code + rolling gallery for as long as subscription is active.
export const BUSINESS_PLANS = {
  activation: {
    id: 'activation',
    name: 'Activation',
    price: 53997,             // per month
    priceKobo: 5399700,
    uploadsPerMonth: 2000,    // 2,000 uploads/month
    quality: 'good',
    permanentPage: true,      // active for life of subscription
    bulkDownload: true,
    basicReel: true,          // basic AI reel generation
    advancedReel: false,
    slideshow: true,
    contentModeration: true,  // AI moderation
    customization: 'better',
    paystackPlanCode: 'PLN_activation_monthly',
  },
  tycoon: {
    id: 'tycoon',
    name: 'Tycoon',
    price: 89995,             // per month
    priceKobo: 8999500,
    uploadsPerMonth: 999999,  // unlimited uploads
    quality: 'high',
    permanentPage: true,
    bulkDownload: true,
    basicReel: true,
    advancedReel: true,       // advanced AI reel generation
    slideshow: true,
    contentModeration: true,  // AI moderation
    customization: 'advanced',
    paystackPlanCode: 'PLN_tycoon_monthly',
  },
} as const

// ── Vendor / Professional Bundles ─────────────────────────────────────────────
// One-time purchase for event planners, photographers, videographers, agencies.
// Buy once, run multiple events from the account balance.
export const PLANNER_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 53999,
    priceKobo: 5399900,
    activeEvents: 3,          // 3 active events per month
    totalUploads: 2000,       // 2,000 combined across all events
    uploadsPerEvent: -1,      // flexible across the pool
    welcomeFormPrice: 7000,   // add-on: welcome form
    removeLogoPrice: 5000,    // add-on: remove GuestVue watermark
    whiteLabel: false,
    paystackPlanCode: 'PLN_vendor_starter_guestvue',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 94999,
    priceKobo: 9499900,
    activeEvents: 5,          // 5 active events per month
    totalUploads: 999999,     // unlimited uploads
    uploadsPerEvent: 999999,  // unlimited per event
    welcomeFormPrice: 4600,   // add-on: welcome form (discounted)
    removeLogoPrice: 5000,
    whiteLabel: false,
    paystackPlanCode: 'PLN_vendor_growth_guestvue',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 179999,
    priceKobo: 17999900,
    activeEvents: 10,         // 10 active events per month
    totalUploads: 999999,     // unlimited uploads
    uploadsPerEvent: 999999,  // unlimited per event
    welcomeFormPrice: 0,      // welcome forms FREE on Scale
    removeLogoPrice: 5000,
    whiteLabel: false,
    paystackPlanCode: 'PLN_vendor_scale_guestvue',
  },
  jagaban: {
    id: 'jagaban',
    name: 'Industry Jagaban',
    price: 350000,
    priceKobo: 35000000,
    activeEvents: 20,         // up to 20 active events per month
    totalUploads: 999999,     // unlimited
    uploadsPerEvent: 999999,  // unlimited
    welcomeFormPrice: 0,      // advanced welcome forms included
    removeLogoPrice: 5000,
    whiteLabel: true,         // white-label solutions available
    paystackPlanCode: 'PLN_vendor_jagaban_guestvue',
  },
} as const

// ── Add-ons ────────────────────────────────────────────────────────────────────
export const ADDONS = {
  basicReel:      { id: 'basic_reel',       name: 'Basic AI Reel',            price: 5000,  priceKobo: 500000  },
  advancedReel:   { id: 'advanced_reel',    name: 'Advanced AI Reel',         price: 14999, priceKobo: 1499900 },
  slideshow:      { id: 'slideshow',        name: 'Live Slideshow',           price: 3000,  priceKobo: 300000  },
  extendedPage:   { id: 'extended_page',    name: 'Extended Active Page',     price: 2000,  priceKobo: 200000  },
  extraStorage:   { id: 'extra_storage',    name: 'Extra Storage (1 month)',  price: 1500,  priceKobo: 150000  },
  galleryArchive: { id: 'gallery_archive',  name: 'Gallery Archive 12mo',     price: 2000,  priceKobo: 200000  },
  removeLogo:     { id: 'remove_logo',      name: 'Remove GuestVue Logo',     price: 5000,  priceKobo: 500000  },
  welcomeForm:    { id: 'welcome_form',     name: 'Welcome Form',             price: 7000,  priceKobo: 700000  },
} as const

// ── Wholesale (for loyalty-tier affiliates) ────────────────────────────────────
export const WHOLESALE = {
  flex: { price: 17999, priceKobo: 1799900, retailPrice: 24999, margin: 7000 },
  pro:  { price: 34999, priceKobo: 3499900, retailPrice: 49999, margin: 15000 },
} as const

// ── Affiliate Programme ────────────────────────────────────────────────────────
export const AFFILIATE = {
  standardRate: 0.20,                  // 20% commission
  loyaltyRate: 0.25,                   // 25% after 15 paid referrals
  loyaltyThreshold: 15,
  wholesaleDiscountAfterThreshold: 0.05,
  payoutMinimum: 5000,
  cookieDays: 30,
} as const

// ── Helpers ────────────────────────────────────────────────────────────────────
export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}

export function isUnlimited(n: number): boolean {
  return n >= 999999 || n === -1
}
