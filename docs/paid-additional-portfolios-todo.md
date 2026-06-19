# Paid Additional Portfolios TODO

## Product decision

- App name: Rookie Markets.
- Live iOS bundle ID: `com.rookiemarkets.app`.
- Payment method: Apple In-App Purchase, not Apple Pay or Stripe.
- Product model: consumable purchase, $1.00 for each additional simulated portfolio.
- App Store Connect product ID: `com.rookiemarkets.portfolio.unlock.v1`.
- Product display name: Additional Portfolio.
- Product description: Create one additional simulated portfolio in Rookie Markets.

## Implementation steps

- [x] Update app/native configuration so Expo and iOS use `com.rookiemarkets.app`.
- [x] Add IAP service constants for `com.rookiemarkets.portfolio.unlock.v1`.
- [x] Install `react-native-purchases` RevenueCat SDK.
- [x] Configure RevenueCat with the provided Test Store public SDK key for development.
- [x] Replace the Portfolio page placeholder alert with a purchase/create flow.
- [x] Add a durable portfolio-credit ledger so each verified consumable purchase creates exactly one additional portfolio.
- [x] Keep unused credits if portfolio creation fails after purchase.
- [x] Add Firestore helpers for additional portfolio creation and transaction recording.
- [x] Add mock/local helpers so the flow can be tested without live StoreKit.
- [x] Update Firestore rules for per-user additional portfolio and IAP transaction data.
- [x] Support multiple portfolios in app state and selection.
- [x] Migrate existing single portfolio data from `portfolios/{userId}` to the new per-user portfolio model.
- [x] Add Firestore ledger tests for migration, duplicate transaction grants, credit consumption, missing-credit refusal, and active portfolio switching.
- [ ] Add restore/sync behavior in Settings; consumable restore must use the backend ledger, not StoreKit alone.
- [ ] Test with sandbox/TestFlight after App Store Connect product setup.
- [ ] Submit app update and IAP together with review notes.
- [ ] Replace temporary client transaction grant with RevenueCat webhook or Firebase callable receipt validation before production release.
- [ ] Replace the RevenueCat Test Store key with the iOS public SDK key before App Store submission.
- [x] Create RevenueCat App Store app for `com.rookiemarkets.app`.
- [x] Create RevenueCat consumable product for `com.rookiemarkets.portfolio.unlock.v1`.
- [x] Attach RevenueCat App Store product to the current default offering package.
- [x] Create matching RevenueCat Test Store product for `com.rookiemarkets.portfolio.unlock.v1` at $1.00 USD so the current `test_` key can exercise the app flow before production-key testing.
- [ ] Connect App Store Connect API credentials in RevenueCat so store-state validation and product sync can run.

## RevenueCat development setup

- Installed SDK: `react-native-purchases`.
- Development API key: `test_OrQfPvOCRiafdQkGiQvHAYcxGQt`.
- RevenueCat project: `Rookie Markets` (`proj10a8d848`).
- RevenueCat App Store app: `Rookie Markets` (`appc723e4b6f0`), bundle ID `com.rookiemarkets.app`.
- RevenueCat App Store product: `Additional Portfolio` (`proddeef73810c`), store identifier `com.rookiemarkets.portfolio.unlock.v1`, type `consumable`.
- RevenueCat Test Store product: `Additional Portfolio Test` (`prod8d2c220f56`), store identifier `com.rookiemarkets.portfolio.unlock.v1`, price `$1.00 USD`.
- RevenueCat current offering: `default` (`ofrng72af06f3b4`), package `Additional Portfolio` (`pkge7d4d493b7f`) now points to both the Test Store and App Store versions of `com.rookiemarkets.portfolio.unlock.v1`.
- RevenueCat iOS public SDK key exists but is intentionally not wired into code until native E2E testing is ready.
- Current purchase path: `purchaseAdditionalPortfolio(userId)` configures RevenueCat with the Firebase user id, fetches `com.rookiemarkets.portfolio.unlock.v1` as a non-subscription product, purchases it as an in-app product, then creates one portfolio credit.
- Release warning: do not submit the app with the `test_` key. RevenueCat requires a platform-specific iOS public SDK key for App Store builds.

## Verification

- `npm test -- src/services/__tests__/firebasePortfolioLedger.test.ts`
  - 5 tests passing.
- `npx eslint src/services/__tests__/firebasePortfolioLedger.test.ts src/services/firebase.ts --ext .ts`
  - No errors. Existing warnings remain in `src/services/firebase.ts`.
- RevenueCat MCP verified:
  - Test Store app has a product matching the code product ID for local RevenueCat test-mode work.
  - App Store app/product now exist for the real iOS product path.
  - Store-state validation is blocked until App Store Connect API credentials are configured in RevenueCat.

## App Review notes draft

Rookie Markets uses In-App Purchase to let users buy one additional simulated portfolio at a time. Each $1.00 consumable purchase creates one additional paper-trading portfolio with virtual currency. No real-money trading, brokerage account, custody, or investment account is created.

## Information needed from App Store Connect

- Confirm the IAP product is created and cleared for sale.
- Confirm the product price tier maps to $1.00 USD.
- Confirm any RevenueCat API keys if RevenueCat is selected for production validation.
