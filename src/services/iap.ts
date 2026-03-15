/**
 * In-App Purchase Service
 *
 * CapitalQuest is a paid app ($4.99 one-time purchase).
 * This module handles the purchase flow using expo-in-app-purchases.
 *
 * On iOS:  configure via App Store Connect
 * On Android: configure via Google Play Console
 *
 * Product ID (set in both stores): com.capitalquest.app.unlock
 */

import * as InAppPurchases from 'expo-in-app-purchases';

const PRODUCT_ID = 'com.capitalquest.app.unlock';

export async function initIAP() {
  await InAppPurchases.connectAsync();
}

export async function getProducts() {
  const { results } = await InAppPurchases.getProductsAsync([PRODUCT_ID]);
  return results;
}

export async function purchaseApp(): Promise<boolean> {
  return new Promise((resolve) => {
    InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        const purchase = results?.find(r => r.productId === PRODUCT_ID);
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

    InAppPurchases.purchaseItemAsync(PRODUCT_ID).catch(() => resolve(false));
  });
}

export async function restorePurchases(): Promise<boolean> {
  const { results } = await InAppPurchases.getPurchaseHistoryAsync();
  return (results || []).some(p => p.productId === PRODUCT_ID);
}

export async function disconnectIAP() {
  await InAppPurchases.disconnectAsync();
}
