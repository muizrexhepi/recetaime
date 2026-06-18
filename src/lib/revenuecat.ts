import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "pro";

type ConfigureArgs = {
  appUserId?: string | null;
};

export type RevenueCatSubscriptionState = {
  revenueCatUserId: string;
  hasActiveSubscription: boolean;
  subscriptionStatus: "inactive" | "trial" | "active" | "expired";
  productIdentifier?: string;
  subscriptionExpiresAt?: number;
};

export type RevenueCatPlans = {
  monthly?: PurchasesPackage;
  yearly?: PurchasesPackage;
  packages: PurchasesPackage[];
};

let isConfigured = false;
let configuredAppUserId: string | null = null;

function getPlatformApiKey() {
  if (process.env.EXPO_OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  }

  if (process.env.EXPO_OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  }

  return undefined;
}

export function hasRevenueCatApiKey() {
  return Boolean(getPlatformApiKey());
}

export async function configureRevenueCat({
  appUserId,
}: ConfigureArgs = {}) {
  const apiKey = getPlatformApiKey();

  if (!apiKey) {
    return false;
  }

  if (!isConfigured) {
    if (__DEV__) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    Purchases.configure({
      apiKey,
      appUserID: appUserId ?? undefined,
      preferredUILocaleOverride: "sq-AL",
    });

    isConfigured = true;
    configuredAppUserId = appUserId ?? null;
    return true;
  }

  if (appUserId && configuredAppUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    configuredAppUserId = appUserId;
  }

  return true;
}

export async function loadRevenueCatPlans(appUserId?: string | null) {
  const configured = await configureRevenueCat({ appUserId });

  if (!configured) {
    return null;
  }

  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];

  const monthly = packages.find(
    (item) =>
      item.packageType === Purchases.PACKAGE_TYPE.MONTHLY ||
      item.identifier.toLowerCase().includes("monthly"),
  );
  const yearly = packages.find(
    (item) =>
      item.packageType === Purchases.PACKAGE_TYPE.ANNUAL ||
      item.identifier.toLowerCase().includes("yearly") ||
      item.identifier.toLowerCase().includes("annual"),
  );

  return {
    monthly,
    yearly,
    packages,
  } satisfies RevenueCatPlans;
}

export async function purchaseRevenueCatPackage(
  aPackage: PurchasesPackage,
  appUserId?: string | null,
) {
  await configureRevenueCat({ appUserId });
  const result = await Purchases.purchasePackage(aPackage);

  return normalizeCustomerInfo(result.customerInfo);
}

export async function restoreRevenueCatPurchases(appUserId?: string | null) {
  await configureRevenueCat({ appUserId });
  const customerInfo = await Purchases.restorePurchases();

  return normalizeCustomerInfo(customerInfo);
}

export async function getRevenueCatSubscriptionState(
  appUserId?: string | null,
) {
  const configured = await configureRevenueCat({ appUserId });

  if (!configured) {
    return null;
  }

  const customerInfo = await Purchases.getCustomerInfo();

  return normalizeCustomerInfo(customerInfo);
}

export function normalizeCustomerInfo(
  customerInfo: CustomerInfo,
): RevenueCatSubscriptionState {
  const activeEntitlement =
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  const knownEntitlement =
    activeEntitlement ??
    customerInfo.entitlements.all[REVENUECAT_ENTITLEMENT_ID];
  const periodType = knownEntitlement?.periodType?.toLowerCase();
  const latestExpiration = customerInfo.latestExpirationDate
    ? Date.parse(customerInfo.latestExpirationDate)
    : undefined;
  const subscriptionExpiresAt =
    knownEntitlement?.expirationDateMillis ?? latestExpiration;
  const hasActiveSubscription = Boolean(activeEntitlement?.isActive);

  return {
    revenueCatUserId: customerInfo.originalAppUserId,
    hasActiveSubscription,
    subscriptionStatus: hasActiveSubscription
      ? periodType === "trial"
        ? "trial"
        : "active"
      : subscriptionExpiresAt && subscriptionExpiresAt < Date.now()
        ? "expired"
        : "inactive",
    productIdentifier:
      knownEntitlement?.productIdentifier ??
      customerInfo.activeSubscriptions[0] ??
      customerInfo.allPurchasedProductIdentifiers[0],
    subscriptionExpiresAt,
  };
}

export function isRevenueCatPurchaseCancelled(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "userCancelled" in error &&
      (error as { userCancelled?: boolean }).userCancelled,
  );
}
