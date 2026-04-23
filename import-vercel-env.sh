#!/bin/bash
# ─── GuestVue → Import all env vars to Vercel ────────────────────────────────
# Run this ONCE from your project folder:
#   cd ~/Desktop/COWORK\ HOMEBASE/guestvue-app
#   bash import-vercel-env.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Make sure Vercel CLI is available
if ! command -v vercel &>/dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

echo ""
echo "┌─────────────────────────────────────────────────────┐"
echo "│  GuestVue → Vercel Environment Variable Importer    │"
echo "└─────────────────────────────────────────────────────┘"
echo ""
echo "This script will import all required env vars into your"
echo "Vercel project (all environments: production, preview, dev)."
echo ""

# Link project if not already linked
if [ ! -f ".vercel/project.json" ]; then
  echo "Linking to Vercel project..."
  vercel link --yes
  echo ""
fi

# ── Helper function ───────────────────────────────────────────────────────────
add_var() {
  local NAME="$1"
  local VALUE="$2"
  echo "  → Adding $NAME"
  # Add to all three environments
  echo "$VALUE" | vercel env add "$NAME" production --force 2>/dev/null || true
  echo "$VALUE" | vercel env add "$NAME" preview   --force 2>/dev/null || true
  echo "$VALUE" | vercel env add "$NAME" development --force 2>/dev/null || true
}

echo "Importing variables..."
echo ""

# ── Supabase ──────────────────────────────────────────────────────────────────
add_var "NEXT_PUBLIC_SUPABASE_URL" "https://tlefiyfkhlufkxojqebt.supabase.co"
add_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZWZpeWZraGx1Zmt4b2pxZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzgwNzcsImV4cCI6MjA5MjQ1NDA3N30.uoeZM9y_I_PWFAmWPMjW2u4qCYF5sgmJ2nBVv4CsCKQ"
add_var "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZWZpeWZraGx1Zmt4b2pxZWJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg3ODA3NywiZXhwIjoyMDkyNDU0MDc3fQ.BZD2SowNM0Z4gCNTyjfS1sNg2DLPNihqOlDDzBJ8DNE"

# ── App URL ───────────────────────────────────────────────────────────────────
add_var "NEXT_PUBLIC_APP_URL" "https://theguestvue.com"

# ── Paystack ──────────────────────────────────────────────────────────────────
add_var "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY" "pk_test_05f0668e51b7f73154efbfa44d1684d45cd02e75"
add_var "PAYSTACK_SECRET_KEY" "sk_test_2f61c3420ab057329174321cd833798d09947afb"
add_var "PAYSTACK_WEBHOOK_SECRET" "sk_test_2f61c3420ab057329174321cd833798d09947afb"

# ── Cloudflare R2 ─────────────────────────────────────────────────────────────
add_var "R2_ACCOUNT_ID" "de1d4f350fe0447f943b04d461a9df9a"
add_var "R2_ACCESS_KEY_ID" "fabf00b2d9917661a07107e565110623"
add_var "R2_SECRET_ACCESS_KEY" "536b223b195307e6bfca9a28712500fb99a1f13c31c29dd1ab0ca3a46d529eb5"
add_var "R2_BUCKET_NAME" "claude-guestvue"
add_var "R2_ENDPOINT" "https://de1d4f350fe0447f943b04d461a9df9a.eu.r2.cloudflarestorage.com"
add_var "R2_PUBLIC_URL" "https://pub-81436af2ca3a49feb0bc7261118c4f17.r2.dev"

# ── Resend (email) ────────────────────────────────────────────────────────────
add_var "RESEND_API_KEY" "re_2De2i8iP_PFXYpvb6i2Bz3xyxef8mtjgv"
add_var "EMAIL_FROM" "GuestVue <hello@theguestvue.com>"

# ── Railway worker ────────────────────────────────────────────────────────────
add_var "RAILWAY_WORKER_URL" "https://guestvue-production.up.railway.app"
add_var "WORKER_SECRET" "11e2cc612a8f5c4b6960f8933b1dafa088fb53f72a92913c04d92fa1b8cc3037"

echo ""
echo "✅  All environment variables imported!"
echo ""
echo "Next steps:"
echo "  1. Go to https://vercel.com → your guest-vue project → Deployments"
echo "  2. Click ··· on the latest deployment → Redeploy"
echo "  3. Log in at https://guest-vue.vercel.app/auth/login"
echo "     Email:    guestvueapp@outlook.com"
echo "     Password: GuestVue2025!"
echo ""
