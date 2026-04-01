# CapitalQuest Project Context

## Overview
CapitalQuest is a stock trading simulator for ages 10-15. Built with React Native/Expo for web, hosted on GitHub Pages at capitalquest.co.

## Tech Stack
- **Frontend**: React Native + Expo (web export)
- **Backend**: Firebase (Firestore + Auth) - project `capitalquest-4d20b`
- **Hosting**: GitHub Pages at `Aussie-slenderman/Aussie-slenderman.GitHub.io`
- **Stock Data**: Yahoo Finance via Cloudflare Worker proxy at `https://cq-yahoo-proxy.capitalquest.workers.dev`
- **Emails**: Resend (weekly performance emails) - domain `capitalquest.co` verified
- **Domain**: capitalquest.co (registered on GoDaddy)

## Critical Build & Deploy Process
After ANY code change, you MUST follow these steps:

```bash
# 1. Build
cd "/Users/theodoresmales/Applications/Stock trading app"
npx expo export --platform web --clear

# 2. Copy bundle with new version number (increment from last)
NEW_BUNDLE=$(ls dist/_expo/static/js/web/entry-*.js | head -1)
cp "$NEW_BUNDLE" _expo/static/js/web/entry-cq-vXX-live.js

# 3. Apply patches to bundle (these get lost on every rebuild):
#    - Remove 3M/6M from chart periods: v=['1D','1W','1M','3M','6M','1Y','5Y'] → v=['1D','1W','1M','1Y','5Y']
#    - Remove data point thinning: maxPoints:300 etc → maxPoints:9999
#    - Change "Markets" button to "Trade Here" on home screen
#    - Normalize trade screen chart data (Le normalization)
#    - Fix trade screen chart: curved:!1, adjustToWidth, initialSpacing, endSpacing
#    - Set straight lines on charts (curved:!1)

# 4. Update ALL HTML files to reference new bundle with cache bust
import time, re, glob
bust = str(int(time.time()))
pattern = re.compile(r'entry-cq-v\d+-live\.js(\?v=\d+)?')
for f in glob.glob('*.html'):
    # replace all references

# 5. Git add, commit, push
git add -A && git commit -m "message" && git push origin main
```

## Bundle Patching (CRITICAL)
Every rebuild produces a fresh bundle that loses these patches. They MUST be reapplied:

1. **Period buttons**: Replace `v=['1D','1W','1M','3M','6M','1Y','5Y']` with `v=['1D','1W','1M','1Y','5Y']`
2. **Data point thinning**: Replace all `maxPoints:300`, `maxPoints:200`, `maxPoints:150`, `maxPoints:100`, `maxPoints:60` with `maxPoints:9999`
3. **Home button text**: Replace `children:"Markets"` with `children:"Trade Here"` (in specific context)
4. **Trade screen chart normalization**: Replace `Le=(0,t.useMemo)(()=>ae.map(e=>({value:e.close})),[ae])` with normalization code that maps to 5-100 range
5. **Trade screen chart props**: Add `adjustToWidth:!0,initialSpacing:0,endSpacing:0` and ensure `curved:!1`

## Key Files
- `app/_layout.tsx` - Root layout, auth listener, navigation routing
- `app/(auth)/login.tsx` - Login screen (sends raw username, NOT username@capitalquest.app)
- `app/(auth)/register.tsx` - Registration (uses random email for Firebase Auth, sets isRegistrationInProgress flag)
- `app/(auth)/setup.tsx` - Portfolio setup (creates $10K portfolio, clears registration flag)
- `app/(app)/home.tsx` - Home/dashboard screen
- `app/(app)/trade.tsx` - Markets/trading screen with stock charts
- `app/(app)/portfolio.tsx` - Portfolio with holdings, orders, performance
- `app/(app)/leaderboard.tsx` - Rankings (global + local by country)
- `app/(app)/social.tsx` - Social tab with clubs, friends, messages
- `app/(app)/profile.tsx` - Profile with settings
- `src/services/firebase.ts` - All Firebase operations
- `src/services/tradingEngine.ts` - Buy/sell logic, portfolio updates
- `src/services/stockApi.ts` - Yahoo Finance data fetching
- `src/services/auth.ts` - Auth wrapper (mock vs Firebase)
- `src/store/useAppStore.ts` - Zustand state store
- `admin-dashboard.html` - Moderator panel
- `moderator-login.html` - Moderator login
- `scripts/send-weekly-emails.js` - Weekly email script (GitHub Actions)
- `yahoo-proxy/` - Cloudflare Worker proxy for Yahoo Finance

## Firebase Config
- Project: `capitalquest-4d20b`
- Auth: Email/password (emails are random like `abc123@capitalquest.app`)
- Firestore collections: users, portfolios, transactions, leaderboard, clubs, chatRooms, tradeProposals, clubInvites, friendRequests
- Admin email: theosmales1@gmail.com

## Registration Flow
1. register.tsx: Username + password + country → creates Firebase Auth account with RANDOM email → saves user doc to Firestore
2. Sets `isRegistrationInProgress = true` to prevent auth listener from navigating
3. avatar.tsx: Choose animal avatar
4. terms.tsx: Terms of service (must scroll + check box)
5. email.tsx: Optional real email entry (saved as `notificationEmail`)
6. setup.tsx: Creates portfolio with $10K, sets `onboardingComplete: true`, clears registration flag
7. Dashboard

## Sign-in Flow
- login.tsx sends raw username to `loginUser()`
- `loginUser()` looks up username in Firestore users collection to find the real Firebase Auth email
- Signs in with that email + password
- login.tsx navigates directly to `/(app)/dashboard` (does NOT rely on auth listener)

## Key Gotchas
- Multiple users can have the same username (Firebase Auth uses random emails)
- Login looks up real auth email from Firestore by username
- The auth listener in _layout.tsx has a `isRegistrationInProgress` flag to prevent it from navigating during signup
- All HTML files (not just index.html) must be updated with the new bundle reference
- CDN cache is 10 minutes - use cache-busting query params
- Yahoo Finance v7/quote endpoint is blocked (401) - use v8/chart instead
- Yahoo Finance requires Cloudflare Worker proxy for CORS

## GitHub Secrets
- `FIREBASE_SERVICE_ACCOUNT` - Firebase admin SDK JSON
- `RESEND_API_KEY` - Resend email API key (re_DiT2uzNr_6eFjrwBfxPTCTC1XyGxJU9N9)

## Remaining TODO Items
1. Fix 'insufficient permissions' when inviting friends/club members (Firestore rules need clubInvites/friendRequests collections)
2. Remove shop background options from profile settings
3. Remove Shop, AI Advisor, Settings from sidebar menu
4. Fix club entry - players can enter club page and communicate
5. Fix club leaderboard to rank only club members
6. Fix local leaderboard to filter by player's country (code exists, needs country data on users)
7. Top gainers/losers should update daily with real Yahoo Finance data
8. Weekly email: fix "this week" section accuracy, daily results, line graph
9. Add email button to sidebar for players who skipped email during signup
10. Fix admin dashboard delete account (insufficient permissions)
11. Sign-in still sometimes goes through signup flow (auth listener race condition)
12. Replace welcome page line graph SVG with Capital Quest logo (user needs to save image first)
13. Settings persistence to Firestore (implemented but needs testing)
14. Country notification for users who haven't set their country

## Current Bundle Version
v78 (entry-cq-v78-live.js)
