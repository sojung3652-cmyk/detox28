// Letters = the texts our alarms carry.
//
// Local alarms fire while the app may be closed, and no JS runs at that moment — so there is no
// "on delivered" hook to record what arrived. Instead, every scheduled alarm (with its exact text)
// is kept in an OUTBOX when it is scheduled; whenever the app becomes active, outbox entries whose
// time has passed are moved into the INBOX. That way the inbox is complete even if a notification
// was swiped away, and the app shows exactly the text the notification carried.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageKind, isLetterKind } from '../data/notifications';

export type Letter = {
  id: string; // alarm id, e.g. "water-12-1"
  at: number; // delivery time (epoch ms)
  kind: MessageKind;
  key: string; // `${kind}.${index}`
  text: string;
  special: boolean;
};

export type InboxEntry = Letter & {
  opened: boolean; // the user opened the envelope
  popped: boolean; // already offered as a popup (or skipped past the 3-popup limit)
};

const OUTBOX_KEY = '@detox28/outbox/v1';

export async function loadOutbox(): Promise<Letter[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    const v = raw ? JSON.parse(raw) : [];
    // Only letters live in the outbox (older versions also kept simple alarms there).
    return Array.isArray(v) ? v.filter((l) => isLetterKind(l?.kind)) : [];
  } catch {
    return [];
  }
}

export async function saveOutbox(list: Letter[]) {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
}

/** Dedupe key: which text, on which day. A letter is delivered at most once per key+day. */
export const deliveryKey = (l: { key: string; at: number }) => {
  const d = new Date(l.at);
  return `${l.key}@${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** Adds letters not delivered yet (by messageKey + date). Pure. */
export function addMissing(inbox: InboxEntry[], letters: Letter[]) {
  const have = new Set(inbox.map(deliveryKey));
  const added = letters.filter((l) => !have.has(deliveryKey(l))).map((l): InboxEntry => ({ ...l, opened: false, popped: false }));
  return { inbox: added.length ? [...inbox, ...added].sort((a, b) => a.at - b.at) : inbox, added: added.length };
}

/** Moves due outbox letters into the inbox. Pure; never adds the same messageKey + date twice. */
export function moveDue(inbox: InboxEntry[], outbox: Letter[], now: number) {
  const due = outbox.filter((l) => l.at <= now);
  const rest = outbox.filter((l) => l.at > now);
  const r = addMissing(inbox, due);
  return { inbox: r.inbox, outbox: rest, added: r.added };
}

/** Most recent key per kind, so new random picks don't repeat the last delivered text. */
export function lastKeysFrom(letters: Letter[]) {
  const out: Partial<Record<MessageKind, string>> = {};
  [...letters].sort((a, b) => a.at - b.at).forEach((l) => (out[l.kind] = l.key));
  return out;
}

export const POPUP_LIMIT = 3;

/**
 * Popup queue: the tapped letter first, then un-popped special letters, then the newest others;
 * at most 3. Everything un-popped is returned in `skip` so it goes quietly to the inbox.
 */
export function popupQueue(inbox: InboxEntry[], tappedId?: string | null) {
  const fresh = inbox.filter((e) => !e.popped);
  const tapped = tappedId ? inbox.filter((e) => e.id === tappedId).slice(-1) : [];
  const others = fresh
    .filter((e) => !tapped.some((t) => t.id === e.id && t.at === e.at))
    .sort((a, b) => Number(b.special) - Number(a.special) || b.at - a.at);
  const queue = [...tapped, ...others].slice(0, POPUP_LIMIT);
  return { queue, markPopped: fresh.map((e) => `${e.id}@${e.at}`) };
}

export const letterRef = (e: { id: string; at: number }) => `${e.id}@${e.at}`;
