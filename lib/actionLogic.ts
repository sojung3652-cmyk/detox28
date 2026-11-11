// Pure parts of the notification-button handling (no native imports, so they can be unit-checked in Node).
import type { Persisted } from './persist';

export const ACTION_ATE = 'ate';
export const ACTION_DRANK = 'drank';

export type ParsedAction = { action: typeof ACTION_ATE | typeof ACTION_DRANK; day: string; meal?: string; notificationId?: string };

/**
 * Accepts either a NotificationResponse (foreground listener) or the headless task payload
 * ({ actionIdentifier, notification: { request: { content: { data | dataString } } } }, possibly nested under
 * `data`). Tolerant on purpose: a bad payload must never crash a headless task.
 */
export function parseAction(payload: any): ParsedAction | null {
  try {
    const root = payload?.actionIdentifier ? payload : payload?.data?.actionIdentifier ? payload.data : payload;
    const action = root?.actionIdentifier;
    if (action !== ACTION_ATE && action !== ACTION_DRANK) return null;
    const request = root?.notification?.request;
    const content = request?.content ?? {};
    let data = content.data;
    if ((!data || typeof data !== 'object') && typeof content.dataString === 'string') {
      try {
        data = JSON.parse(content.dataString);
      } catch {
        data = null;
      }
    }
    if (!data?.day || typeof data.day !== 'string') return null;
    return { action, day: data.day, meal: typeof data.meal === 'string' ? data.meal : undefined, notificationId: request?.identifier };
  } catch {
    return null;
  }
}

/** Pure state change for an action. Water caps at 20 so a stuck button can't run away. */
export function applyAction(s: Persisted, a: ParsedAction): Persisted {
  if (a.action === ACTION_DRANK) {
    return { ...s, water: { ...s.water, [a.day]: Math.min(20, (s.water[a.day] ?? 0) + 1) } };
  }
  const cur = s.meals[a.day] ?? [];
  const meal = a.meal ?? 'meal';
  return cur.includes(meal) ? s : { ...s, meals: { ...s.meals, [a.day]: [...cur, meal] } };
}

