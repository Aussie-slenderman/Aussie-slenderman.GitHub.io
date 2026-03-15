# StockQuest — Complete Setup Guide

## Overview
StockQuest is a cross-platform (iOS & Android) virtual stock trading app built with:
- **React Native + Expo** (cross-platform)
- **Expo Router** (file-based navigation)
- **Firebase** (auth, Firestore DB, real-time)
- **Finnhub API** (real-time stock prices via WebSocket + REST)
- **Zustand** (global state)

---

## Prerequisites

Install these first:
```bash
# Install Node.js (v20 LTS recommended)
# Download from https://nodejs.org

# Install Expo CLI
npm install -g expo-cli eas-cli

# Install Bun (optional, faster package manager)
npm install -g bun
```

---

## Step 1: Install Dependencies

```bash
cd "/Users/theodoresmales/Applications/Stock trading app"
npm install
# or: bun install
```

---

## Step 2: Set Up Firebase

1. Go to https://console.firebase.google.com
2. Create a new project: **StockQuest**
3. Enable these services:
   - **Authentication** → Email/Password
   - **Cloud Firestore** → Production mode
   - **Realtime Database** → Production mode (for live price cache if needed)
4. Get your config from: Project Settings → Your Apps → Web App
5. Paste the config into `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  ...
};
```

6. Upload Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

---

## Step 3: Get Stock API Keys

### Finnhub (PRIMARY — Free tier: 60 calls/min)
1. Go to https://finnhub.io
2. Sign up for free
3. Copy your API key
4. Replace `YOUR_FINNHUB_API_KEY` in `src/services/stockApi.ts`

### Alpha Vantage (BACKUP — Free: 500 calls/day)
1. Go to https://alphavantage.co
2. Get a free API key
3. Replace `YOUR_ALPHAVANTAGE_API_KEY` in `src/services/stockApi.ts`

---

## Step 4: Run the App

```bash
# Start Expo development server
npx expo start

# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR code with Expo Go app on your phone
```

---

## Step 5: Build for App Stores

### Set up EAS Build
```bash
# Login to Expo account
eas login

# Configure project
eas build:configure
```

### Build iOS (requires Mac + Apple Developer account — $99/year)
```bash
eas build --platform ios --profile production
```

Then submit to App Store:
```bash
eas submit --platform ios
```

In App Store Connect:
- Set price to **$4.99 (Tier 5)**
- Age rating: **4+** (no mature content, suitable for all ages)
- Description: mention recommended ages 8-18
- Category: **Games → Simulation** or **Finance**

### Build Android
```bash
eas build --platform android --profile production
eas submit --platform android
```

In Google Play Console:
- Set price to **$4.99**
- Content rating: **Everyone**
- Target age: **8-18** (set in target audience section)

---

## Step 6: Configure In-App Purchase (Backup unlock)

Create a product in both stores with ID: `com.stockquest.app.unlock`
- Price: $4.99
- Type: Non-consumable (one-time purchase)

Update `src/services/iap.ts` if you use a different product ID.

---

## App Architecture

```
app/
├── _layout.tsx              # Root layout (auth listener)
├── (auth)/
│   ├── welcome.tsx          # Landing page
│   ├── register.tsx         # Sign up
│   ├── login.tsx            # Sign in
│   ├── tutorial.tsx         # 8-slide stock education
│   └── setup.tsx            # Choose starting balance
└── (app)/
    ├── _layout.tsx          # Tab navigation + real-time listeners
    ├── home.tsx             # Markets dashboard
    ├── portfolio.tsx        # Portfolio & performance
    ├── trade.tsx            # Stock detail + order panel
    ├── leaderboard.tsx      # Rankings + achievements
    ├── social.tsx           # Chat, clubs, friend trading
    └── profile.tsx          # User profile + settings

src/
├── services/
│   ├── firebase.ts          # All Firebase operations
│   ├── stockApi.ts          # Finnhub REST + WebSocket
│   ├── tradingEngine.ts     # Order execution + P&L
│   └── iap.ts               # In-app purchase
├── store/
│   └── useAppStore.ts       # Zustand global state
├── constants/
│   ├── theme.ts             # Colors, fonts, spacing
│   ├── achievements.ts      # Achievements + level system
│   └── stocks.ts            # Popular stocks seed list
├── types/
│   └── index.ts             # All TypeScript interfaces
├── utils/
│   └── formatters.ts        # Currency, %, date formatting
├── hooks/
│   └── useStockPrices.ts    # Real-time price polling hook
└── components/
    ├── common/
    │   └── StockCard.tsx    # Reusable stock row card
    └── Sidebar.tsx          # Right-side suggestion drawer
```

---

## Key Features Summary

| Feature | Implementation |
|---------|---------------|
| Real-time prices | Finnhub WebSocket + 15s REST polling |
| Fractional shares | Dollar amount ÷ price = fractional shares |
| Starting balance | User picks $1K–$100K (or custom) |
| Tutorial | 8-slide education before trading starts |
| Charles Schwab UI | Dark theme, professional layout |
| Leaderboards | Global + local by % gain, updated after every trade |
| Level system | 10 levels, XP every 5% portfolio gain |
| Achievements | 20+ achievements with XP rewards |
| Clubs | Create/join clubs with shared chat |
| Chat | Real-time DMs and club chat rooms |
| Trade proposals | Send friend trade offers by account number |
| App price | $4.99 one-time on iOS and Android |
| Age recommendation | 8-18 (no real money, educational) |

---

## Firestore Collections

| Collection | Description |
|-----------|-------------|
| `users` | User profiles, XP, achievements |
| `portfolios` | Cash, holdings, order history |
| `transactions` | All trade records |
| `leaderboard` | Global ranking data |
| `clubs` | Club info and members |
| `chatRooms` | DMs and club chats |
| `chatRooms/{id}/messages` | Individual messages |
| `tradeProposals` | Friend-to-friend trade offers |

---

## Content Rating Guidance

For Apple App Store (Ages 4+):
- No real money / gambling ✅
- No mature content ✅
- Educational focus ✅
- Recommended ages 8-18 (mention in description)

For Google Play (Everyone):
- Target audience: 13-17 (you can add 8-12 range)
- No in-app purchases beyond the one-time unlock ✅
- No chat with strangers in uncontrolled ways — clubs are invite-based ✅
