// EAS Update (over-the-air JS updates on the "preview" channel).
//
// Native config (app.json → updates): checkAutomatically ON_LOAD + fallbackToCacheTimeout 0, so every
// launch starts immediately on the version already on the phone, checks/downloads in the background,
// and a downloaded update is applied automatically on the NEXT launch even if the user ignores the card.
//
// Every call here is wrapped: an update failure (offline, server error, bad bundle) must never break the
// app — it keeps running the current version. Don't remove the try/catch blocks to "simplify".
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

/** Updates only exist in release builds (not Expo Go / dev client / web preview). */
export const updatesEnabled = Platform.OS !== 'web' && !__DEV__ && Updates.isEnabled;

export type CheckResult = 'disabled' | 'latest' | 'downloaded' | 'error';

/** Check the channel and download a newer update if there is one. Never throws. */
export async function checkAndFetch(): Promise<CheckResult> {
  if (!updatesEnabled) return 'disabled';
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return 'latest';
    const res = await Updates.fetchUpdateAsync();
    return res.isNew ? 'downloaded' : 'latest';
  } catch (e) {
    console.warn('update check failed; staying on the current version', e);
    return 'error';
  }
}

/** Restart into the downloaded update. If that fails, the current version just keeps running. */
export async function applyNow() {
  try {
    await Updates.reloadAsync();
  } catch (e) {
    console.warn('reload failed; staying on the current version', e);
  }
}

export function versionInfo() {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  if (!updatesEnabled) return { appVersion, label: '개발 모드', detail: '이 빌드는 업데이트를 받지 않아요.' };
  const created = Updates.createdAt;
  const when = created ? `${created.getFullYear()}.${created.getMonth() + 1}.${created.getDate()} ${String(created.getHours()).padStart(2, '0')}:${String(created.getMinutes()).padStart(2, '0')}` : '';
  const label = Updates.isEmbeddedLaunch ? '설치된 기본 버전' : `업데이트 ${when}`;
  const id = Updates.updateId ? Updates.updateId.slice(0, 8) : '';
  const runtime = Updates.runtimeVersion ? Updates.runtimeVersion.slice(0, 8) : '-';
  const detail = `채널 ${Updates.channel ?? '-'} · 런타임 ${runtime}${id ? ` · ${id}` : ''}`;
  return { appVersion, label, detail, emergency: Updates.isEmergencyLaunch };
}
