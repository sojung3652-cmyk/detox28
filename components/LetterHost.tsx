import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { InboxEntry, letterRef, popupQueue } from '../lib/letters';
import { useApp } from '../lib/store';
import { envelope as E } from '../theme';
import { LetterPopup } from './Envelope';

type Ctx = { openLetter: (e: InboxEntry) => void };
const LetterCtx = createContext<Ctx>({ openLetter: () => {} });
export const useLetters = () => useContext(LetterCtx);

/**
 * Shows envelope popups:
 *  - when the app opens (or returns to the foreground) with letters not yet offered
 *  - when a notification is tapped (that letter first), including a cold start from the tap
 *  - when an alarm arrives while the app is open
 *  - when a letter is picked from the inbox (same motion)
 * At most 3 per batch; the rest stay in the inbox.
 */
export function LetterHost({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;
  const [queue, setQueue] = useState<InboxEntry[]>([]);
  const tapped = useRef<string | null>(null);
  const scrim = useSharedValue(0);

  const showBatch = useCallback(() => {
    const a = appRef.current;
    if (!a.loaded || !a.settings) return;
    const { queue: q, markPopped } = popupQueue(a.inbox, tapped.current);
    tapped.current = null;
    if (markPopped.length) a.markLetters(markPopped, { popped: true });
    if (q.length) setQueue((cur) => (cur.length ? cur : q));
  }, []);

  // New un-popped letters (after sync on open/resume, or arrival) → popups.
  const unpopped = app.inbox.filter((e) => !e.popped).length;
  useEffect(() => {
    if (unpopped > 0 && queue.length === 0 && AppState.currentState !== 'background') showBatch();
  }, [unpopped, queue.length, showBatch]);

  // Notification taps (default action) and arrivals while the app is open.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const openFrom = async (res: Notifications.NotificationResponse | null) => {
      if (!res || res.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const data = res.notification.request.content.data as { id?: string; at?: number } | undefined;
      if (!data?.id) return;
      await appRef.current.syncInbox();
      const hit = [...appRef.current.inbox].reverse().find((e) => e.id === data.id);
      if (hit && hit.popped) setQueue((cur) => [hit, ...cur.filter((x) => letterRef(x) !== letterRef(hit))].slice(0, 3));
      else tapped.current = data.id; // not synced into the batch yet: put it first
      showBatch();
    };
    Notifications.getLastNotificationResponseAsync()
      .then(async (res) => {
        await openFrom(res);
        await Notifications.clearLastNotificationResponseAsync().catch(() => {});
      })
      .catch(() => {});
    const tapSub = Notifications.addNotificationResponseReceivedListener((res) => openFrom(res));
    const recvSub = Notifications.addNotificationReceivedListener(() => appRef.current.syncInbox());
    return () => {
      tapSub.remove();
      recvSub.remove();
    };
  }, [showBatch]);

  useEffect(() => {
    scrim.value = withTiming(queue.length ? 1 : 0, { duration: 220 });
  }, [queue.length, scrim]);
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  const current = queue[0];
  const next = () => setQueue((q) => q.slice(1));

  return (
    <LetterCtx.Provider value={{ openLetter: (e) => setQueue((q) => (q.length ? [...q, e] : [e])) }}>
      {children}
      <Modal visible={!!current} transparent animationType="none" statusBarTranslucent onRequestClose={next}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: E.scrim }, scrimStyle]} />
        {current ? (
          <LetterPopup
            key={letterRef(current) + queue.length}
            entry={current}
            onOpened={() => appRef.current.markLetters([letterRef(current)], { opened: true, popped: true })}
            onClosed={next}
          />
        ) : null}
      </Modal>
    </LetterCtx.Provider>
  );
}

