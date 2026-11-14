/**
 * 알람 문구
 *
 * MESSAGES: 종류별 문구. 여러 개면 랜덤으로 보내되, 직전에 보낸 문구는 연속으로 나오지 않아요.
 *   {종료시간} → "오후 8시" 형식으로 채워져요.
 * TITLES: 일상 알람의 알림 제목 (본문은 문구 그대로)
 * LABELS: 편지지 위에 작게 보이는 알람 이름 (예: "물 마실 시간 · 14:00")
 * 물 알람은 알림만 오고 편지(팝업·받은 편지함)로 남지 않아요.
 * SPECIAL: 특별한 날 알람. 알림창에는 "편지가 도착했어요 / 열어서 확인해보세요"만 보이고 내용은 앱에서만 보여요.
 */

export const MESSAGES = {
  breakfast: [
    '모닝, 좋은아침? 오늘도 신나는 디톡스 시작, 즐거운 하루 되세요!',
    '좋은아침! 오늘도 가벼운 몸으로 행복한 하루, 화이팅!',
    '모닝, 오늘 하루도 편안하게 행복하게 즐겁게 보내요!',
  ],
  lunch: [
    '점심 드실 시간이에요. 많이 많이 맛있게 드세요, 즐거운 시간!',
    '점심 드셔요! 부족하게 드시지 말고 건강하게 맛있게, 화이팅!',
    '점심 시간이에요, 끼니는 거르지 말고 언제나 건강하게, 오늘도 화이팅!',
  ],
  dinnerNoCarb: [
    '오늘 저녁은 탄수화물이 없는 식사로 드세요, 힘들어도 조금만 힘내기!',
    '오늘은 가볍게 무탄수화물 식사로, 맛있게 드세요!',
    '오늘은 탄수화물 없이 가볍게 드세요, 즐거운 식사시간!',
  ],
  dinnerNormal: [
    '오늘 저녁은 일반식으로 드셔요, 맛있게! 즐거운 시간',
    '오늘 저녁밥은 일반식! 정말 기다렸습니다. 맛있게 드세요!',
    '오늘 저녁은 일반식이에요! 뭘 드실지 궁금하네요, 맛있게!',
  ],
  week1Day4Lunch: [
    '오늘부터 점심 한 끼는 밥과 드셔요, 지난 3일 정말 고생하셨어요. 조금만 더 화이팅!',
  ],
  water: [
    '똑똑! 물 한 잔 마셔주세요, 화이팅!',
    '안녕! 물 한 잔 마셔주세요, 오늘도 정말 힘들죠? 화이팅!',
    '물 한 잔 마실 시간이에요, 오늘도 화이팅!',
    '물 한 잔 마시셔요, 목마르겠다. 화이팅!',
    '물 한 잔 쭈욱- 이쁘다, 화이팅 하세요!',
  ],
  fastStart: [
    '오늘 밥 잘 챙겨드셨나요? 24시 단식을 시작합니다. 내일 {종료시간}까지 천천히 함께 가봐요!',
    '오늘 하루는 어떠셨나요? 24시 단식시간이 시작될 예정이에요, 남은 하루도 같이 화이팅 해봐요!',
    '24시간 단식 시작! 힘들더라도 같이 버텨봐요, 할 수 있다. 내일 {종료시간}까지 함께 화이팅!',
  ],
  fastEnd: [
    '24시간 종료! 가볍게 두유나 계란으로 다시 시작해 봅시다, 즐거운 하루 마무리 되세요!',
    '24시간 정말 고생 많으셨습니다. 함께 해서 덜 힘들었네요! 오늘 남은 식사 부디 즐겁게!',
    '24시간 단식 끝! 저녁은 뭘 드실지 기대가 되는걸요? 행복한 시간 되셔요!',
  ],
  fastTomorrow: [
    '내일은 단식을 하는 날입니다! 원하는 시간에 맞춰 설정을 해주세요, 남은 하루도 화이팅!',
  ],
  start: [
    '즐거운 디톡스 여정의 시작! 28일간 더 멋진 나로 거듭나 보기로 해요, 저도 같이 할게요. 할 수 있다, 화이팅!',
  ],
  day1: [
    '즐거운 디톡스 플랜, 다시 시작하신 것을 축하합니다. 28일 디톡스 함께라면 걱정 없다! 같이 하루하루 즐겁게 해봐요, 화이팅!',
  ],
  week2Start: [
    '시간이 정말 느렸던 지난 1주죠? 너무 고생 많으셨어요. 이제 견과류도 드실 수 있어요. 2주차도같이 가보자구요. 화이팅!',
  ],
  week3Start: [
    '오늘 몇 킬로? 2주차 정말 고생많으셨습니다, 이제 슬슬 몸이 가벼워졌죠? 즐거운 3주차도 시작! 화이팅 해봐요!',
  ],
  week4Start: [
    '거의 다 왔습니다. 드디어 마지막 주! 이틀을 남기고 간장게장을 먹지 않도록 주의하기로 해요. 남은 7일간 화이팅! 할 수 있다!',
  ],
  complete: [
    '지난 28일 하루하루 당신의 도전, 모두 감동이었습니다! 저도 즐겁게 할 수 있었어요, 완주 축하드립니다! 함께 해주어 감사합니다, 우리 내일부터 갑자기 폭주하지 않기예요. 오늘 하루도 화이팅!',
  ],
  streak7: [
    '정말 멋있네요, 벌써 연속으로 7일을 달려왔습니다! 저도 더 열심히 해야겠어요. 같이 화이팅해요!',
  ],
  streak14: [
    '연속 14일 달성! 정말 멋있는데요? 힘들지는 않으신가요? 오늘도 행복하게 디톡스타임, 화이팅!',
  ],
  streak21: [
    '연속 21일이라니 정말 놀라워요! 저도 더 열심히 해야겠습니다. 오늘도 즐거운 하루 되세요!',
  ],
  dMinus3: [
    '즐거운 디톡스까지 D-3! 너무 긴장하지 말아요. 함께 다시 달려봅시다 화이팅!',
  ],
  noCheckToday: [
    '혹시 디톡스를 잊으셨나요? 오늘 베이비슈를 드셨더라도 용서해 드릴테니 다시 오세요, 웰컴!',
    '혹시 디톡스를 잊으셨나요? 오늘 엄마손파이를 드셨더라도 모른 척해 드릴테니 다시 오세요, 웰컴!',
    '혹시 디톡스를 잊으셨나요? 오늘 에끌레어를 드셨더라도 흐린 눈해 드릴테니 다시 오세요, 웰컴!',
    '혹시 디톡스를 잊으셨나요? 오늘 바닐라쉐이크를 드셨더라도 못본 척해 드릴테니 다시 오세요, 웰컴!',
  ],
} as const;

export type MessageKind = keyof typeof MESSAGES;

/**
 * 알람 종류별 type
 *  - letter: 편지. 알림창엔 "편지가 도착했어요"만 보이고, 앱에서 봉투로 열어요. 받은 편지함에 남아요.
 *  - simple: 단순 알람. 알림창에 문구가 그대로 보이고, 누르면 오늘 화면으로 가요. 편지함에 남지 않아요.
 * (start는 알람이 아니라 '시작하기'를 누르는 순간 앱 안에서 바로 열리는 편지예요.)
 */
export const TYPES: Record<MessageKind, 'letter' | 'simple'> = {
  breakfast: 'simple',
  lunch: 'simple',
  dinnerNoCarb: 'simple',
  dinnerNormal: 'simple',
  week1Day4Lunch: 'simple',
  water: 'simple',
  fastStart: 'simple',
  fastEnd: 'simple',
  fastTomorrow: 'simple',
  start: 'letter',
  day1: 'letter',
  week2Start: 'letter',
  week3Start: 'letter',
  week4Start: 'letter',
  complete: 'letter',
  streak7: 'simple',
  streak14: 'simple',
  streak21: 'simple',
  dMinus3: 'simple',
  noCheckToday: 'simple',
};

export const isLetterKind = (k: string): boolean => TYPES[k as MessageKind] === 'letter';

/** 편지 종류 (알림창엔 내용 없이 편지 도착만 알려요) */
export const SPECIAL: MessageKind[] = (Object.keys(TYPES) as MessageKind[]).filter((k) => TYPES[k] === 'letter');

export const SPECIAL_NOTICE = { title: '편지가 도착했어요', body: '열어서 확인해보세요' };

/** 일상 알람의 알림 제목 */
export const TITLES: Record<MessageKind, string> = {
  breakfast: '아침 식사',
  lunch: '점심 식사',
  dinnerNoCarb: '저녁 식사 · 탄수화물 X',
  dinnerNormal: '저녁 식사 · 일반식',
  week1Day4Lunch: '점심 식사',
  water: '물 한 잔',
  fastStart: '24시간 단식 시작',
  fastEnd: '24시간 단식 끝',
  fastTomorrow: '내일은 단식하는 날',
  noCheckToday: '오늘의 디톡스',
  dMinus3: '디톡스 D-3',
  start: SPECIAL_NOTICE.title,
  day1: SPECIAL_NOTICE.title,
  week2Start: SPECIAL_NOTICE.title,
  week3Start: SPECIAL_NOTICE.title,
  week4Start: SPECIAL_NOTICE.title,
  complete: SPECIAL_NOTICE.title,
  streak7: '연속 7일 달성',
  streak14: '연속 14일 달성',
  streak21: '연속 21일 달성',
};

/** 편지지 위 작은 글씨 (알람 종류) */
export const LABELS: Record<MessageKind, string> = {
  breakfast: '아침 식사 시간',
  lunch: '점심 식사 시간',
  dinnerNoCarb: '저녁 식사 시간',
  dinnerNormal: '저녁 식사 시간',
  week1Day4Lunch: '점심 식사 시간',
  water: '물 마실 시간',
  fastStart: '단식 시작',
  fastEnd: '단식 끝',
  fastTomorrow: '내일 단식 예고',
  noCheckToday: '오늘의 디톡스',
  dMinus3: '디톡스 D-3',
  start: '디톡스 시작 편지',
  day1: '1일차 편지',
  week2Start: '2주차 시작 편지',
  week3Start: '3주차 시작 편지',
  week4Start: '4주차 시작 편지',
  complete: '28일 완주 편지',
  streak7: '연속 7일 달성',
  streak14: '연속 14일 달성',
  streak21: '연속 21일 달성',
};

/** 알림 버튼 이름 */
export const ACTION_LABELS = { ate: '먹었어요', drank: '마셨어요' };
