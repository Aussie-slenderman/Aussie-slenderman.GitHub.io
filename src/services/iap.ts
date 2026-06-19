/**
 * In-App Purchase Service
 *
 * Rookie Markets in-app purchases.
 * Additional portfolio purchases use RevenueCat. The older app unlock helpers
 * still use expo-in-app-purchases until that legacy flow is removed.
 *
 * On iOS:  configure via App Store Connect
 * On Android: configure via Google Play Console
 *
 * Additional portfolio product ID: com.rookiemarkets.portfolio.unlock.v1
 */

import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PRODUCT_CATEGORY,
  PURCHASE_TYPE,
  PURCHASES_ERROR_CODE,
  PurchasesError,
} from "react-native-purchases";

export const APP_UNLOCK_PRODUCT_ID = "com.capitalquest.app.unlock";
export const ADDITIONAL_PORTFOLIO_PRODUCT_ID =
  "com.rookiemarkets.portfolio.unlock.v1";
export const REVENUECAT_IOS_API_KEY = "appl_zNGTFxOLChkGaDBlVwVvUaASnhz";

let revenueCatConfiguredForUserId: string | null = null;

type ExpoInAppPurchasesModule = typeof import("expo-in-app-purchases");

async function getExpoInAppPurchases(): Promise<ExpoInAppPurchasesModule | null> {
  if (Platform.OS === "web") return null;
  return import("expo-in-app-purchases");
}

export interface PortfolioPurchaseResult {
  success: boolean;
  productId: string;
  transactionId?: string;
  error?: "cancelled" | "deferred" | "unavailable" | "failed";
}

export async function configureRevenueCat(appUserID?: string | null) {
  if (Platform.OS === "web") return;
  if (revenueCatConfiguredForUserId === (appUserID ?? null)) return;

  await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: REVENUECAT_IOS_API_KEY,
    appUserID: appUserID ?? null,
  });
  revenueCatConfiguredForUserId = appUserID ?? null;
}

export async function initIAP() {
  const InAppPurchases = await getExpoInAppPurchases();
  if (!InAppPurchases) return;
  await InAppPurchases.connectAsync();
}

export async function getProducts() {
  const InAppPurchases = await getExpoInAppPurchases();
  if (!InAppPurchases) return [];
  const { results } = await InAppPurchases.getProductsAsync([
    APP_UNLOCK_PRODUCT_ID,
    ADDITIONAL_PORTFOLIO_PRODUCT_ID,
  ]);
  return results;
}

export async function purchaseApp(): Promise<boolean> {
  const InAppPurchases = await getExpoInAppPurchases();
  if (!InAppPurchases) return false;

  return new Promise((resolve) => {
    InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        const purchase = results?.find(
          (r) => r.productId === APP_UNLOCK_PRODUCT_ID,
        );
        if (purchase && !purchase.acknowledged) {
          InAppPurchases.finishTransactionAsync(purchase, false);
          resolve(true);
          return;
        }
      }
      if (
        responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED ||
        responseCode === InAppPurchases.IAPResponseCode.DEFERRED
      ) {
        resolve(false);
        return;
      }
      resolve(false);
    });

    InAppPurchases.purchaseItemAsync(APP_UNLOCK_PRODUCT_ID).catch(() =>
      resolve(false),
    );
  });
}

export async function purchaseAdditionalPortfolio(
  userId?: string,
): Promise<PortfolioPurchaseResult> {
  if (Platform.OS === "web") {
    return {
      success: true,
      productId: ADDITIONAL_PORTFOLIO_PRODUCT_ID,
      transactionId: `mock_portfolio_${Date.now()}`,
    };
  }

  try {
    await configureRevenueCat(userId);
    const products = await Purchases.getProducts(
      [ADDITIONAL_PORTFOLIO_PRODUCT_ID],
      PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    );
    const product = products.find(
      (p) => p.identifier === ADDITIONAL_PORTFOLIO_PRODUCT_ID,
    );
    if (!product) {
      return {
        success: false,
        productId: ADDITIONAL_PORTFOLIO_PRODUCT_ID,
        error: "unavailable",
      };
    }

    const result = await Purchases.purchaseProduct(
      ADDITIONAL_PORTFOLIO_PRODUCT_ID,
      null,
      PURCHASE_TYPE.INAPP,
    );
    return {
      success: true,
      productId: result.productIdentifier,
      transactionId:
        result.transaction?.transactionIdentifier ??
        `${result.productIdentifier}_${Date.now()}`,
    };
  } catch (error) {
    const purchasesError = error as Partial<PurchasesError>;
    if (
      purchasesError.userCancelled ||
      purchasesError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return {
        success: false,
        productId: ADDITIONAL_PORTFOLIO_PRODUCT_ID,
        error: "cancelled",
      };
    }
    if (purchasesError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return {
        success: false,
        productId: ADDITIONAL_PORTFOLIO_PRODUCT_ID,
        error: "deferred",
      };
    }
    return {
      success: false,
      productId: ADDITIONAL_PORTFOLIO_PRODUCT_ID,
      error:
        purchasesError.code ===
          PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR ||
        purchasesError.code === PURCHASES_ERROR_CODE.CONFIGURATION_ERROR
          ? "unavailable"
          : "failed",
    };
  }
}

export async function restorePurchases(): Promise<boolean> {
  const InAppPurchases = await getExpoInAppPurchases();
  if (!InAppPurchases) return false;
  const { results } = await InAppPurchases.getPurchaseHistoryAsync();
  return (results || []).some((p) => p.productId === APP_UNLOCK_PRODUCT_ID);
}

export async function disconnectIAP() {
  const InAppPurchases = await getExpoInAppPurchases();
  if (!InAppPurchases) return;
  await InAppPurchases.disconnectAsync();
}
