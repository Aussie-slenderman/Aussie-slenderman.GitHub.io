# CapitalQuest - Project Guide

## Overview
Risk-free stock trading simulator for ages 8-18. React Native + Expo app exported to web, hosted on GitHub Pages at capitalquest.co. Firebase backend for auth/data.

## Tech Stack
- **Framework**: React Native 0.74 + Expo 51 (web export)
- **Routing**: Expo Router (file-based)
- **State**: Zustand (`src/store/useAppStore.ts`)
- **Backend**: Firebase Auth + Firestore (`capitalquest-4d20b`)
- **Stock Data**: Yahoo Finance via Cloudflare Worker proxy
- **Charts**: react-native-gifted-charts
- **AI**: Claude API (`@anthropic-ai/sdk`) for advisor feature
- **Hosting**: GitHub Pages (repo: Aussie-slenderman/Capitalquest.co)
- **Emails**: Resend (weekly performance emails) - domain `capitalquest.co`

## Project Structure
```
app/
  (auth)/          # Login, register, forgot-password, setup, welcome
  (app)/           # Dashboard, home, portfolio, trade, leaderboard,
                   # social, profile, shop, trophy-road, tutorial,
                   # advisor, notifications, news-article, buy-bling
src/
  services/
    firebase.ts    # Firestore operations (users, portfolios, clubs, chat)
    auth.ts        # Auth wrapper (auto-switches mock vs Firebase)
    mockAuth.ts    # Fallback auth for testing (localStorage)
    stockApi.ts    # Yahoo Finance data fetching
    tradingEngine.ts # Order execution, portfolio P&L
    aiAdvisor.ts   # Claude API integration
  store/
    useAppStore.ts # Single Zustand store (auth, portfolio, UI, social)
  constants/
    theme.ts       # Colors, Spacing, FontSize, Radius, Shadow, FontWeight
    achievements.ts # 20+ achievements, 10 levels, XP system
    translations.ts # i18n (50+ languages, ~800KB)
    stocks.ts      # Popular stocks seed list
    shopItems.ts   # Cosmetic items
  types/
    index.ts       # All TypeScript interfaces
  components/
    Sidebar.tsx    # Settings drawer (wardrobe, email, username, appearance)
    AppHeader.tsx  # Top navigation bar
    AchievementToast.tsx # Achievement unlock notification
    common/StockCard.tsx # Reusable stock row
  utils/
    formatters.ts  # formatCurrency, formatPercent, formatShares, etc.
  hooks/
    useStockPrices.ts # 15-sec polling for real-time quotes
```

## Notable Quirks

- **Usernames aren't unique** — Firebase Auth uses random `@capitalquest.app` emails. Login looks up the real Firebase Auth email by username in Firestore. Multiple users can share the same username.
- **Bundle patching required after every `expo export`** — the JS bundle must be hand-patched to: remove 3M/6M chart periods, remove data point thinning (`maxPoints`), change "Markets" to "Trade Here", fix trade screen chart normalization, set `curved:!1` on charts. See `PROJECT_CONTEXT.md` for exact patches.
- **40+ HTML files** — each route has its own HTML file (`home.html`, `dashboard.html`, `(app)/home.html`, etc.). ALL must reference the same bundle version. Missing even one causes that route to load old code.
- **Standalone HTML pages** — `forgot-password.html` and `admin-dashboard.html` are plain HTML (not React). Navigate to them with `window.location.href`, NOT `router.push()`.
- **Yahoo Finance** — v7/quote endpoint is blocked (401). Use v8/chart via the Cloudflare Worker proxy at `https://cq-yahoo-proxy.capitalquest.workers.dev`.
- **Auth listener race conditions** — `isRegistrationInProgress` and `isLoginInProgress` flags in `app/_layout.tsx` prevent the auth listener from navigating during sign-up/sign-in flows.

## Theme Colors
```
Dark (default):
  bg: #0A0E1A / #111827 / #1A2235
  brand: #00B3E6 (primary) / #00D4AA (accent) / #F5C518 (gold)
  market: #00C853 (gain) / #FF3D57 (loss)
  text: #F1F5F9 / #94A3B8 / #64748B
  border: #1E2940

Light mode available (LightColors in theme.ts)
```

## Auth Flow
1. Registration creates Firebase Auth with user's real email (new accounts) or auto-generated email (`{random}@capitalquest.app` for older accounts)
2. Login looks up Firebase Auth email from Firestore by username, then signs in
3. Auth listener in `app/_layout.tsx` uses `isRegistrationInProgress` / `isLoginInProgress` flags to prevent navigation races
4. Setup screen initializes portfolio with $10,000 virtual cash
5. Forgot password: standalone HTML page at `/forgot-password.html` with 6-digit code verification via Firestore

## Key Patterns
- **State updates**: `useAppStore().setUser(updatedUser)` for local, `updateUser(id, data)` for Firebase
- **Styles**: Inline `StyleSheet.create()` per component, using theme constants
- **Navigation**: `router.push()` / `router.replace()` for React routes; `window.location.href` for standalone HTML pages
- **Real-time**: Firestore `onSnapshot` listeners for portfolio, chat, invites
- **Stock data**: `useStockPrices(symbols)` hook polls every 15 seconds

## Web Deployment (CRITICAL)
The site runs on GitHub Pages, NOT Firebase Hosting. Current live bundle: `entry-cq-v96-live.js`.

**Deploy process:**
1. Make source changes in `app/` and `src/`
2. If possible, run `npx expo export --platform web` to rebuild `dist/`
3. If Node unavailable, patch the bundle directly (minified JS)
4. **Apply required patches** (see PROJECT_CONTEXT.md for exact strings):
   - Remove 3M/6M from chart period array
   - Set `maxPoints:9999` (remove data thinning)
   - Change "Markets" to "Trade Here"
   - Normalize trade screen chart data
   - Set `curved:!1`, `adjustToWidth:!0` on charts
5. Copy patched bundle as `entry-cq-vXX-live.js` (increment version)
6. Update ALL route HTML files (40+ files: `*.html`, `(app)/*.html`, `(auth)/*.html`) to reference new bundle
7. `git add -A && git commit && git push origin main`

**Bundle patching rules:**
- Variable names are minified. Find components by landmark strings (e.g. 'Add Email', 'Welcome Back')
- NEVER add new `useState` hooks — breaks React hook reconciliation
- Use `window.location.href` for navigating to standalone HTML pages (not `router.push`)
- Verify syntax after patching: `node -e 'new Function(require("fs").readFileSync("file","utf8"))'`
- Rename bundle file to bust browser cache (e.g. v96 -> v97)
- GitHub Pages CDN cache is `max-age=600` (10 min). Use new filenames to bypass.

**HTML files**: Each route has its own HTML file. ALL must reference the same bundle version. Use `find . -name "*.html" -exec sed -i '' 's/old/new/g' {} +` to update them all.

## Firebase Structure
- `users/` — Profiles (username, displayName, email, userEmail, level, xp, achievements)
- `portfolios/` — Holdings, cash, orders
- `transactions/` — Trade history
- `clubs/` — Investment clubs
- `chatRooms/` + subcollection `messages/`
- `clubInvites/` — Club and friend requests
- `tradeProposals/` — Friend trade offers
- `passwordResets/` — 6-digit verification codes for forgot password
- `passwordResetRequests/` — Pending password reset requests

## NPM Scripts
```bash
npm start           # Expo dev server
npm run web         # Web dev (Metro)
npm run build:web   # Export to dist/
npm run build:ios   # EAS iOS build
npm run build:android # EAS Android build
```

## Environment Notes
- Node.js is at `/usr/local/bin/node` but may not be in PATH. Use full path.
- npx is at `/Users/theodoresmales/.local/bin/npx`
- Stock data proxy: `https://cq-yahoo-proxy.capitalquest.workers.dev`
- Fractional shares are supported (dollar-amount purchases)
- Username and displayName are separate fields but updated together on username change
- Admin email: theosmales1@gmail.com

## Open TODOs (from PROJECT_CONTEXT.md)
See `PROJECT_CONTEXT.md` for the full list of ~14 remaining tasks including club permissions, leaderboard filtering, weekly email fixes, etc.
