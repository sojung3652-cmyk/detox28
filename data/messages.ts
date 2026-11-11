/**
 * 특별 메시지
 *
 * 해당 날짜에 오늘 화면 맨 위에 카드로 표시되고, 아침 알람으로도 알려 줘요.
 * - title: 알람 제목과 카드 제목
 * - body: 카드에 보이는 본문 (줄바꿈은 \n)
 *
 * 지금은 자리만 만들어 둔 상태예요. 직접 써 주세요.
 */

export type SpecialMessage = { title: string; body: string };

export const SPECIAL_MESSAGES: Record<number, SpecialMessage> = {
  1: {
    title: '1일차 메시지',
    body: '(여기에 1일차 메시지를 써 주세요)',
  },
  7: {
    title: '7일차 메시지',
    body: '(여기에 7일차 메시지를 써 주세요)',
  },
  14: {
    title: '14일차 메시지',
    body: '(여기에 14일차 메시지를 써 주세요)',
  },
  21: {
    title: '21일차 메시지',
    body: '(여기에 21일차 메시지를 써 주세요)',
  },
  28: {
    title: '28일차 메시지',
    body: '(여기에 28일차 메시지를 써 주세요)',
  },
};
