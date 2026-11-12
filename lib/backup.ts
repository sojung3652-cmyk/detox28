import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { loadState } from './persist';
import { dateKey } from './plan';

const FORMAT = 'detox28-backup';

/** Writes all records to a JSON file and opens the share sheet (save to Files/Drive, send to self, ...). */
export async function exportBackup() {
  const state = await loadState();
  const payload = { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), state: { ...state, debugOffsetDays: 0 } };
  const file = new File(Paths.cache, `28일루틴-기록-${dateKey(new Date())}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));
  if (!(await Sharing.isAvailableAsync())) throw new Error('이 기기에서는 공유를 사용할 수 없어요.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: '기록 내보내기' });
}

/** Lets the user pick a backup file. Returns the raw state object, or null if cancelled. */
export async function importBackup(): Promise<unknown | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const text = await new File(res.assets[0].uri).text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON 파일이 아니에요.');
  }
  if (parsed?.format !== FORMAT || typeof parsed.state !== 'object') throw new Error('Detox28 백업 파일이 아니에요.');
  return parsed.state;
}
