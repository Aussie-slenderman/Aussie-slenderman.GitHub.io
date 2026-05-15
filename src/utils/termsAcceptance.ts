import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_TERMS_VERSION } from '../constants/legal';

const PRE_AUTH_TERMS_KEY = 'cq:preAuthTermsAcceptance';

type PreAuthTermsAcceptance = {
  version: string;
  acceptedAt: number;
};

export async function markPreAuthTermsAccepted(version = CURRENT_TERMS_VERSION) {
  const payload: PreAuthTermsAcceptance = {
    version,
    acceptedAt: Date.now(),
  };
  await AsyncStorage.setItem(PRE_AUTH_TERMS_KEY, JSON.stringify(payload));
}

export async function hasPreAuthTermsAcceptance(version = CURRENT_TERMS_VERSION): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PRE_AUTH_TERMS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<PreAuthTermsAcceptance>;
    return parsed.version === version;
  } catch {
    return false;
  }
}

export async function clearPreAuthTermsAcceptance() {
  await AsyncStorage.removeItem(PRE_AUTH_TERMS_KEY);
}
