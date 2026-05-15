import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { onAuthChange, getUserById } from '../src/services/auth';
import { getPortfolio, getPortfolioHistory } from '../src/services/firebase';
import { useAppStore } from '../src/store/useAppStore';
import { Colors } from '../src/constants/theme';
import AchievementOverlay from '../src/components/AchievementOverlay';
import ModerationWarningModal, { ModerationWarning } from '../src/components/ModerationWarningModal';
import { signOut } from '../src/services/auth';
import { listenToUser } from '../src/services/firebase';
import { CURRENT_TERMS_VERSION } from '../src/constants/legal';

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface EBState { hasError: boolean; error: Error | null }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CapitalQuest] Uncaught error:', error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>
            {this.state.error?.message ?? 'An unexpected error occurred. Please try again.'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: Colors.brand.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

SplashScreen.preventAutoHideAsync().catch(() => {});

let splashHidden = false;
async function hideSplashOnce() {
  if (splashHidden) return;
  splashHidden = true;
  try {
    await SplashScreen.hideAsync();
  } catch {
    // Non-fatal. Expo throws if the native splash has already been hidden.
  }
}

// Global flag: when true, the auth listener skips navigation (registration flow is in progress)
export let isRegistrationInProgress = false;
export function setRegistrationInProgress(v: boolean) { isRegistrationInProgress = v; }

// Global flag: when true, login is in progress — prevent auth listener from navigating to welcome
export let isLoginInProgress = false;
export function setLoginInProgress(v: boolean) { isLoginInProgress = v; }


export default function RootLayout() {
  const { setUser, setAuthLoading, setShowWelcomePopup, setPortfolio, resetUserData } = useAppStore();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const replaceIfNeeded = (path: string) => {
    if (pathnameRef.current !== path) {
      router.replace(path as any);
    }
  };

  useEffect(() => {
    let previousUid: string | null = null;
    let currentCallId = 0; // guard against stale async callbacks
    const unsub = onAuthChange(async (session: unknown) => {
      const callId = ++currentCallId; // each invocation gets a unique ID
      const s = session as { uid?: string } | null;
      if (s?.uid) {
        const uid = s.uid;
        const navigationHandledByLogin = isLoginInProgress;
        // Clear login flag — auth confirmed
        isLoginInProgress = false;
        // Reset all user-specific data when switching to a different account
        if (previousUid && previousUid !== uid) {
          resetUserData();
        }
        previousUid = uid;
        let userData: unknown = null;
        try {
          userData = await getUserById(uid);
        } catch (err) {
          console.warn('[CQ] getUserById failed:', err);
        }
        if (!userData) {
          if (isRegistrationInProgress) {
            setAuthLoading(false);
            await hideSplashOnce();
            return;
          }
          console.warn('[CQ] Authenticated user has no Firestore profile:', uid);
          resetUserData();
          setUser(null);
          setAuthLoading(false);
          await signOut();
          await hideSplashOnce();
          replaceIfNeeded('/welcome');
          return;
        }
        // Ensure accountNumber exists — generate one if missing
        const ud2 = userData as Record<string, unknown>;
        if (!ud2.accountNumber || ud2.accountNumber === 'undefined' || ud2.accountNumber === '') {
          const generated = Math.floor(10000000 + Math.random() * 90000000).toString();
          ud2.accountNumber = generated;
          // Persist to Firestore
          import('../src/services/auth').then(({ updateUser: upd }) => {
            upd(uid, { accountNumber: generated }).catch(() => {});
          });
        }

        // ── Ban enforcement ──────────────────────────────────────────────
        // If the moderator system has flagged this account as banned, the
        // user STAYS signed in but is sent to a dedicated banned screen
        // that shows their ban reason + appeal instructions. They can't
        // do anything else in the app because every route guard checks
        // accountBanned and re-routes back to the banned screen.
        {
          const banFlag = (userData as Record<string, unknown>).accountBanned;
          if (banFlag) {
            setAuthLoading(false);
            await hideSplashOnce();
            try {
              if (typeof window !== 'undefined' && (window as any).location) {
                (window as any).location.href = '/banned.html';
                return;
              }
            } catch { /* non-web fallthrough */ }
            replaceIfNeeded('/banned');
            return;
          }
        }

        // Always set the user — even if a newer auth event fired while we were
        // awaiting, the user should never be left as null when authenticated.
        setUser(userData as import('../src/types').User);
        // If a newer auth event fired while we were awaiting, skip the rest
        // (settings, portfolio, navigation) — the newer call will handle those.
        if (callId !== currentCallId) return;
        // Load saved settings from Firestore
        const ud = userData as Record<string, unknown> | null;
        if (ud?.settings) {
          const saved = ud.settings as Record<string, unknown>;
          if (saved.appColorMode) useAppStore.setState({ appColorMode: saved.appColorMode as 'dark' | 'light' });
          if (saved.appAccentColor) useAppStore.setState({ appAccentColor: saved.appAccentColor as string });
          if (saved.appTileStyle) useAppStore.setState({ appTileStyle: saved.appTileStyle as 'default' | 'vivid' | 'glass' });
          if (saved.appTabColors) useAppStore.setState({ appTabColors: saved.appTabColors as Record<string, string> });
          if (saved.appLanguage) useAppStore.setState({ appLanguage: saved.appLanguage as string });
        }
        // Load portfolio from Firestore so holdings persist across sessions
        try {
          const portfolio = await getPortfolio(uid);
          if (callId !== currentCallId) return; // bail if stale
          if (portfolio) {
            const pRaw = portfolio as Record<string, unknown>;
            // Ensure holdings array exists even if missing from Firestore
            if (!pRaw.holdings) pRaw.holdings = [];
            // Load hourly history for the 30-day performance chart
            try {
              const history = await getPortfolioHistory(uid);
              if (history.length > 0) pRaw.history = history;
            } catch { /* non-critical */ }
            setPortfolio(pRaw as import('../src/types').Portfolio);
            // Save daily snapshot for weekly email chart + hourly for performance chart
            const p = pRaw as import('../src/types').Portfolio;
            import('../src/services/firebase').then(({ savePortfolioSnapshot, saveHourlySnapshot, save5MinSnapshot }) => {
              savePortfolioSnapshot(uid, p.totalValue, p.cashBalance, p.totalGainLoss ?? 0, p.totalGainLossPercent ?? 0).catch(() => {});
              saveHourlySnapshot(uid, p.totalValue).catch(() => {});
              save5MinSnapshot(uid, p.totalValue).catch(() => {});
            });
          }
        } catch (err) {
          console.warn('[CQ] Portfolio load failed, will retry via listener:', err);
        }
        // If registration flow is in progress, don't navigate — let register handle it
        if (isRegistrationInProgress) {
          setAuthLoading(false);
          return;
        }
        if (navigationHandledByLogin) {
          setAuthLoading(false);
          await hideSplashOnce();
          return;
        }

        if (ud?.acceptedTermsVersion !== CURRENT_TERMS_VERSION) {
          setAuthLoading(false);
          await hideSplashOnce();
          replaceIfNeeded('/terms');
          return;
        }

        // Always go to dashboard when user is authenticated
        // (setup screen is only reached from the registration flow)
        if (ud && !ud.onboardingComplete) {
          import('../src/services/auth').then(({ updateUser }) => {
            updateUser(uid, { onboardingComplete: true }).catch(() => {});
          });
        }
        // Mark welcomeShown for old users who never had it set
        if (ud && !ud.welcomeShown) {
          import('../src/services/auth').then(({ updateUser: upd }) => {
            upd(uid, { welcomeShown: true }).catch(() => {});
          });
        }
        replaceIfNeeded('/dashboard');
      } else {
        // No user session — but skip redirect to welcome if login is actively in progress
        // (the login screen will handle navigation on success/failure)
        if (isLoginInProgress || isRegistrationInProgress) {
          setAuthLoading(false);
          await hideSplashOnce();
          return;
        }
        resetUserData();
        setUser(null);
        previousUid = null;
        setAuthLoading(false);
        await hideSplashOnce();
        replaceIfNeeded('/welcome');
        return;
      }
      setAuthLoading(false);
      await hideSplashOnce();
    });
    return unsub as () => void;
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.primary }}>
        <StatusBar style="light" backgroundColor={Colors.bg.primary} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg.primary } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <Toast />
        <AchievementOverlay />
        <ModerationGate />
        <PortfolioSampler />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// ─── Portfolio Sampler ────────────────────────────────────────────────────────
// Records the signed-in user's portfolio.totalValue every 5 minutes so the
// 30-day performance chart has high-resolution data points (one per
// 5-min bucket) instead of being capped at one point per hour.
//
// The interval is short-circuited when no user / portfolio is loaded.
function PortfolioSampler() {
  const userId = useAppStore((s) => s.user?.id);
  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const sample = async () => {
      if (cancelled) return;
      const p = useAppStore.getState().portfolio;
      if (!p || typeof p.totalValue !== 'number') return;
      try {
        const { save5MinSnapshot } = await import('../src/services/firebase');
        if (cancelled) return;
        await save5MinSnapshot(userId, p.totalValue);
      } catch { /* non-critical */ }
    };
    // Fire once almost immediately to capture the value soon after load.
    const initialTimer = setTimeout(sample, 30_000);
    // Then sample every 5 minutes for as long as the user is signed in.
    const interval = setInterval(sample, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [userId]);
  return null;
}

// ─── Moderation Gate ──────────────────────────────────────────────────────────
// Subscribes to the signed-in user's Firestore doc in real time so any
// moderation action taken by the server-side trigger surfaces immediately
// — the player doesn't have to log out and back in.
//
// Behaviour:
//   - accountBanned:true → sign out + bounce to welcome with a banned flag
//     so the login screen shows the explanation.
//   - pendingModerationWarning present → render the (non-dismissable)
//     warning modal. On acknowledge, the modal clears the field in
//     Firestore.
function ModerationGate() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const resetUserData = useAppStore((s) => s.resetUserData);
  const [warning, setWarning] = React.useState<ModerationWarning | null>(null);

  // We identify each warning by its `detectedAt` timestamp (set server-side
  // in functions/index.js). Once the user clicks "I understand" we stash the
  // dismissed id here so any subsequent listener re-fire — e.g. a stale
  // offline-cache snapshot that still contains the pre-clear field, or a
  // re-render that replays the previous snapshot — is ignored. Without this,
  // the modal pops back as soon as the user dismisses it.
  const dismissedDetectedAtRef = React.useRef<number | null>(null);

  // Reset dismissal tracking whenever the user changes so brand-new
  // warnings on a different account always show.
  React.useEffect(() => { dismissedDetectedAtRef.current = null; }, [user?.id]);

  // Live subscription to the user doc — fires whenever moderation updates
  // it server-side. NOTE: must use a static import for `listenToUser` —
  // a dynamic import here gets code-split into a separate chunk file that
  // may not be deployed alongside the entry bundle, causing the listener
  // to silently never attach (which is exactly what was masking warnings).
  React.useEffect(() => {
    if (!user?.id) { setWarning(null); return; }
    let cancelled = false;
    let unsub: undefined | (() => void);
    try {
      // eslint-disable-next-line no-console
      console.log('[Moderation] Attaching live listener for uid=' + user.id);
      unsub = listenToUser(user.id, async (raw) => {
          if (cancelled) return;
          const data = raw as Record<string, unknown> | null;
          if (!data) return;
          // eslint-disable-next-line no-console
          console.log('[Moderation] User doc snapshot — banned:', !!data.accountBanned, 'hasWarning:', !!data.pendingModerationWarning);

          // 1. Hard ban — keep the user signed in but bounce them to the
          //    banned screen. They cannot reach any other route because
          //    every route guard (auth listener + this same gate) sends
          //    them back here.
          if (data.accountBanned) {
            try {
              if (typeof window !== 'undefined' && (window as any).location) {
                (window as any).location.href = '/banned.html';
                return;
              }
            } catch { /* non-web fallthrough */ }
            router.replace('/banned' as any);
            return;
          }

          // 2. Pending warning — keep the local user object in sync so
          //    other parts of the app see the latest fields, then surface
          //    the modal. If the user has already acknowledged this exact
          //    warning (matched by detectedAt) we ignore the re-fire so the
          //    modal can't pop back during the clear-and-resync window.
          const pmw = (data.pendingModerationWarning as unknown) as
            | ModerationWarning
            | undefined;
          if (pmw) {
            const stillDismissed =
              !!pmw.detectedAt && pmw.detectedAt === dismissedDetectedAtRef.current;
            if (stillDismissed) {
              setWarning(null);
            } else {
              setUser({ ...(user as any), ...data } as any);
              setWarning(pmw);
            }
          } else {
            setWarning(null);
          }
        });
    } catch (e) {
      // Non-fatal — moderation just won't be live in this session.
      // eslint-disable-next-line no-console
      console.warn('Moderation listener failed to attach:', e);
    }
    return () => {
      cancelled = true;
      try { if (unsub) unsub(); } catch { /* non-fatal */ }
    };
  }, [user?.id]);

  if (!warning) return null;

  return (
    <ModerationWarningModal
      visible={true}
      warning={warning}
      onAcknowledged={async () => {
        // Record the dismissed warning id so a later listener fire with a
        // stale snapshot can't re-show it. Then null out local state so the
        // modal hides immediately without waiting for the Firestore round-
        // trip in handleAcknowledge.
        if (warning.detectedAt) dismissedDetectedAtRef.current = warning.detectedAt;
        setWarning(null);
        if (warning.banned) {
          // Ban becomes effective immediately on acknowledge.
          try {
            if (typeof window !== 'undefined' && (window as any).sessionStorage) {
              (window as any).sessionStorage.setItem('cqAccountBanned', '1');
            }
          } catch { /* non-fatal */ }
          try { await signOut(); } catch { /* non-fatal */ }
          resetUserData();
          router.replace('/welcome');
        }
      }}
    />
  );
}
