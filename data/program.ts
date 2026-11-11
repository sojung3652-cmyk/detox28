/**
 * 28일 루틴 — 프로그램 데이터
 *
 * 이 파일만 고치면 앱 내용이 바뀝니다.
 * - 문구(텍스트)는 자유롭게 수정해도 됩니다.
 * - id 값은 체크 기록 저장에 쓰이니, 이미 사용 중이라면 바꾸지 않는 게 좋아요.
 * - 요일 번호: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
 */

export type DinnerType = 'lowcarb' | 'normal';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DINNER_LABEL: Record<DinnerType, string> = {
  lowcarb: '탄수화물 X',
  normal: '일반식',
};

export const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

// ───────────────────────── 기본 설정 ─────────────────────────

export const PROGRAM_DAYS = 28;

/** 온보딩 기본 식사 시간 (24시간제 HH:MM) */
export const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  lunch: '12:30',
  dinner: '19:00',
};

/** 단식 길이(시간) */
export const FAST_HOURS = 24;

/** 기본 단식 시작 시간 (설정에서 변경, 단식 당일 '오늘만 시간 바꾸기' 가능) */
export const DEFAULT_FAST_START = '20:00';

/** 물 마시기 목표(잔)와 알람 시간 */
export const WATER_GOAL = 8;
export const WATER_ALARM_TIMES = ['10:00', '14:00', '17:00'];

// ───────────────────────── 주차별 기본 루틴 ─────────────────────────
// 매일 체크리스트. 각 주차의 routine에 넣어요. id는 체크 기록에 쓰이니 바꾸지 마세요.

export type RoutineItem = { id: string; label: string; detail?: string };

const R = {
  broccoli: { id: 'broccoli', label: '브로콜리', detail: '데쳐서' },
  greenbean: { id: 'greenbean', label: '그린빈', detail: '데쳐서' },
  tomato: { id: 'tomato', label: '토마토' },
  avocado: { id: 'avocado', label: '아보카도' },
  cabbage: { id: 'cabbage', label: '양배추' },
  bellpepper: { id: 'bellpepper', label: '파프리카', detail: '벨페퍼' },
  cucumber: { id: 'cucumber', label: '오이' },
  carrot: { id: 'carrot', label: '당근', detail: '볶아서' },
  egg: { id: 'egg', label: '달걀', detail: '계란후라이 4개 또는 삶은 계란 2개' },
  tofu: { id: 'tofu', label: '두부' },
  nuts: { id: 'nuts', label: '견과류', detail: '아몬드, 브라질넛, 호두 등' },
  blueberry: { id: 'blueberry', label: '블루베리' },
  banana: { id: 'banana', label: '바나나' },
  apple: { id: 'apple', label: '사과' },
  walnut: { id: 'walnut', label: '호두' },
  sweetpotato: { id: 'sweetpotato', label: '고구마', detail: '삶아서' },
  berry: { id: 'berry', label: '베리류', detail: '미국 딸기도 OK' },
  natto: { id: 'natto', label: '낫토' },
  oliveoil: { id: 'oliveoil', label: '올리브오일', detail: '하루 합계 5스푼' },
} satisfies Record<string, RoutineItem>;

const ROUTINE_W1 = [R.broccoli, R.greenbean, R.tomato, R.avocado, R.bellpepper, R.carrot, R.egg, R.tofu, R.natto, R.oliveoil];
const ROUTINE_W2 = [R.broccoli, R.greenbean, R.tomato, R.avocado, R.cabbage, R.bellpepper, R.cucumber, R.carrot, R.egg, R.nuts, R.blueberry, R.natto, R.oliveoil];
const ROUTINE_W3 = [...ROUTINE_W2.slice(0, 11), R.banana, R.apple, R.natto, R.oliveoil];
const ROUTINE_W4 = [R.broccoli, R.greenbean, R.tomato, R.avocado, R.cabbage, R.bellpepper, R.carrot, R.egg, R.walnut, R.sweetpotato, R.berry, R.apple, R.natto, R.oliveoil];

// ───────────────────────── 주차별 플랜 ─────────────────────────

export type WeekPlan = {
  week: 1 | 2 | 3 | 4;
  /** 주차 이름 (예: 장내 환경 바꾸기) */
  title: string;
  /** 이번 주 목표 한 문장 (오늘 화면 '이번 주 목표' 카드, 새 주차 알람) */
  goal: string;
  ingredients: string[];
  /** 매일 체크리스트 (오늘 화면 "기본 루틴") */
  routine: RoutineItem[];
  /** "다음 할 일" 간식 추천 (이 목록에서만 랜덤) */
  snackPicks: string[];
  /** 저녁이 "탄수화물 X"인 요일. 나머지 요일은 일반식 */
  lowCarbDinnerDays: Weekday[];
  /** 이 요일 저녁 식사 후 FAST_HOURS 동안 단식 */
  fastDays: Weekday[];
  /** 주차 핵심 안내 (주차 카드에 표시) */
  summary: string;
  /** "오늘의 팁"으로 하루에 하나씩 돌아가며 표시 */
  tips: string[];
};

export const WEEKS: WeekPlan[] = [
  {
    week: 1,
    routine: ROUTINE_W1,
    snackPicks: ['요거트', '찐 닭가슴살', '생오이 + 쌈장'],
    title: '장내 환경 바꾸기',
    goal: '탄수화물을 줄이고 채소와 단백질로 몸을 리셋해요',
    ingredients: ['브로콜리', '그린빈', '토마토', '아보카도', '파프리카', '당근', '달걀', '두부'],
    lowCarbDinnerDays: [0, 1, 2],
    fastDays: [],
    summary: '간헐적 단식 없음. 첫 3일은 탄수화물 제한, 4일째부터 점심 한 끼 밥 허용.',
    tips: [
      '첫 3일은 탄수화물을 제한해요. 4일째부터는 점심 한 끼 밥이 허용돼요.',
      '단백질은 하루 4번에 나눠서 먹어요.',
      '채소를 먼저, 단백질 다음, 탄수화물은 마지막에 먹어 보세요.',
      '천천히 꼭꼭 씹어 먹는 것만으로도 속이 편해져요.',
      '올리브오일 5스푼은 하루 합계예요. 채소 위에 나눠 뿌려도 좋아요.',
      '낫토는 아침에 먹으면 하루가 든든해요.',
      '이번 주는 몸이 새 리듬에 적응하는 주예요. 무리하지 않아도 괜찮아요.',
    ],
  },
  {
    week: 2,
    routine: ROUTINE_W2,
    snackPicks: ['두유', '요거트', '두부', '카카오닙스', '아보카도 + 으깬 달걀'],
    title: '단식 시작',
    goal: '주 1회 24시간 단식에 적응해요',
    ingredients: [
      '브로콜리', '그린빈', '토마토', '아보카도', '파프리카', '당근', '달걀', '두부',
      '양배추', '오이', '견과류', '블루베리',
    ],
    lowCarbDinnerDays: [1, 3, 5],
    fastDays: [3],
    summary: '수요일 저녁 식사 후 24시간 단식. 견과류·콩 등 일부 탄수화물 허용.',
    tips: [
      '견과류, 콩 같은 일부 탄수화물은 괜찮아요.',
      '단식하는 날은 근력운동은 쉬고, 의식적으로 걸어 주세요.',
      '단식 중에는 물을 평소보다 자주 마셔요.',
      '단식 전 저녁은 단백질과 채소로 든든하게 드세요.',
      '단식이 끝나면 첫 끼는 가볍게, 천천히.',
      '양배추는 데치거나 볶으면 소화가 더 편해요.',
      '배가 고플 땐 물 한 잔 먼저 마셔 보세요.',
    ],
  },
  {
    week: 3,
    routine: ROUTINE_W3,
    snackPicks: ['두유', '찐 고구마', '요거트 + 베리류', '찐 감자', '다크초콜릿 85% 이상', '아몬드밀크 + 바닐라 아이스크림'],
    title: '효과가 보이는 주',
    goal: '주 2회 단식, 몸이 가벼워지는 걸 느껴봐요',
    ingredients: [
      '브로콜리', '그린빈', '토마토', '아보카도', '파프리카', '당근', '달걀', '두부',
      '양배추', '오이', '견과류', '블루베리', '바나나', '사과',
    ],
    lowCarbDinnerDays: [0, 2, 4, 6],
    fastDays: [2, 4],
    summary: '화·목 저녁 식사 후 24시간 단식 (연달아 하지 않기). 베리류·토마토·호박·밤 허용.',
    tips: [
      '베리류, 토마토, 호박, 밤은 먹어도 괜찮아요.',
      '단식은 연달아 하지 않아요. 화·목만!',
      '단식하는 날은 근력운동 대신 가볍게 걸어요.',
      '고구마나 감자는 찌거나 삶아서 드세요.',
      '다크초콜릿은 85% 이상으로 한두 조각만.',
      '아이스크림은 작은 한 스쿱이면 충분해요.',
      '벌써 3주차예요. 지금까지 정말 잘하고 있어요.',
    ],
  },
  {
    week: 4,
    routine: ROUTINE_W4,
    snackPicks: ['두유', '요거트 + 베리류', '키위', '배', '말린 망고', '다크초콜릿 85% 이상', '바나나칩', '무염 크래커 + 치즈 + 딸기', '아몬드밀크 + 바닐라 아이스크림'],
    title: '단단하게 마무리',
    goal: '주 3회 단식, 밀가루를 멀리하고 근육량을 지켜요',
    ingredients: [
      '브로콜리', '그린빈', '토마토', '아보카도', '양배추', '파프리카', '당근', '달걀',
      '호두', '삶은 고구마', '베리류', '사과',
    ],
    lowCarbDinnerDays: [1, 3, 5],
    fastDays: [1, 3, 5],
    summary: '월·수·금 저녁 식사 후 24시간 단식. 밀가루 멀리하기, 근육량 늘리기에 집중.',
    tips: [
      '밀가루 음식은 멀리해요.',
      '근육량 늘리기에 집중하는 주예요. 단식 없는 날엔 근력운동을.',
      '술이나 기름진 음식처럼 간에 부담 주는 음식은 조심해요.',
      '단식하는 날은 근력운동은 쉬고 걷기로.',
      '단백질은 끼니마다 손바닥 하나 크기로 챙겨요.',
      '말린 과일은 한 줌이면 충분해요.',
      '마지막 주예요. 끝까지 함께해요.',
    ],
  },
];

// ───────────────────────── 계절 팁 (북반구, 기기 날짜의 월 기준) ─────────────────────────

/** key: 월(1~12) */
export const SEASON_TIPS: { months: number[]; tip: string }[] = [
  { months: [12, 1, 2], tip: '겨울엔 생채소보다 데치거나 볶은 채소, 따뜻한 물, 채소수프가 좋아요.' },
  { months: [3, 4, 5], tip: '봄 제철 채소를 활용하고, 가볍게 산책해요.' },
  { months: [6, 7, 8], tip: '여름엔 수분을 충분히. 단식일엔 물을 더 자주 마셔요.' },
  { months: [9, 10, 11], tip: '가을엔 고구마, 단호박, 사과를 활용해 보세요.' },
];

// ───────────────────────── 안전 안내 ─────────────────────────

export const SAFETY_NOTICE =
  '어지럽거나 몸이 안 좋으면 단식을 멈추고 식사하세요. 지병이 있거나 약을 복용 중이라면 단식 전 의사와 상담하세요.';

// ───────────────────────── 단식 카드 응원 문구 (오늘 화면, 랜덤) ─────────────────────────

export const FAST_CHEERS = [
  '천천히 함께 가봐요. 물은 자주 마셔요.',
  '잘하고 있어요. 오늘은 가볍게 걸어봐요.',
  '배고픔은 파도처럼 지나가요. 물 한 잔 마셔봐요.',
  '조금씩 몸이 가벼워지고 있어요.',
  '어지러우면 언제든 멈춰도 괜찮아요.',
];

// ───────────────────────── 주차별 장보기 리스트 (미국 마트 기준) ─────────────────────────
// section: 마트 코너. id는 체크 기록에 쓰여요.

export type ShoppingItem = { id: string; ko: string; en: string; section: string };

const BASE_SHOPPING: ShoppingItem[] = [
  { id: 'broccoli', ko: '브로콜리', en: 'broccoli crowns', section: '채소 · 과일 (Produce)' },
  { id: 'greenbean', ko: '그린빈', en: 'green beans', section: '채소 · 과일 (Produce)' },
  { id: 'tomato', ko: '토마토', en: 'tomatoes / cherry tomatoes', section: '채소 · 과일 (Produce)' },
  { id: 'bellpepper', ko: '벨페퍼 (파프리카)', en: 'bell peppers', section: '채소 · 과일 (Produce)' },
  { id: 'carrot', ko: '당근', en: 'carrots', section: '채소 · 과일 (Produce)' },
  { id: 'avocado', ko: '아보카도', en: 'avocados', section: '채소 · 과일 (Produce)' },
  { id: 'blueberry', ko: '블루베리', en: 'blueberries', section: '채소 · 과일 (Produce)' },
  { id: 'eggs', ko: '달걀', en: 'eggs (2 dozen)', section: '단백질 (Meat · Eggs · Tofu)' },
  { id: 'tofu', ko: '두부', en: 'extra firm tofu', section: '단백질 (Meat · Eggs · Tofu)' },
  { id: 'chicken', ko: '닭가슴살', en: 'boneless skinless chicken breast', section: '단백질 (Meat · Eggs · Tofu)' },
  { id: 'salmon', ko: '연어', en: 'salmon fillet', section: '단백질 (Meat · Eggs · Tofu)' },
  { id: 'yogurt', ko: '플레인 그릭요거트', en: 'Greek yogurt plain, unsweetened', section: '유제품 (Dairy)' },
  { id: 'nuts', ko: '견과류', en: 'almonds, Brazil nuts, walnuts (unsalted)', section: '견과 · 기타 (Pantry)' },
  { id: 'oliveoil', ko: '올리브오일', en: 'extra virgin olive oil', section: '견과 · 기타 (Pantry)' },
  { id: 'natto', ko: '낫토', en: 'natto (frozen)', section: '아시안 마켓 (H Mart)' },
];

export const SHOPPING: Record<1 | 2 | 3 | 4, ShoppingItem[]> = {
  1: [
    ...BASE_SHOPPING,
    { id: 'cucumber', ko: '오이', en: 'Persian cucumbers', section: '채소 · 과일 (Produce)' },
    { id: 'ssamjang', ko: '쌈장', en: 'ssamjang', section: '아시안 마켓 (H Mart)' },
    { id: 'cauli-rice', ko: '콜리플라워 라이스', en: 'cauliflower rice (frozen)', section: '냉동 (Frozen)' },
  ],
  2: [
    ...BASE_SHOPPING,
    { id: 'cabbage', ko: '양배추', en: 'green cabbage', section: '채소 · 과일 (Produce)' },
    { id: 'cucumber', ko: '오이', en: 'Persian cucumbers', section: '채소 · 과일 (Produce)' },
    { id: 'soymilk', ko: '무가당 두유', en: 'unsweetened soy milk', section: '유제품 (Dairy)' },
    { id: 'cacao-nibs', ko: '카카오닙스', en: 'cacao nibs', section: '견과 · 기타 (Pantry)' },
    { id: 'broth', ko: '채소 육수 (단식 후 수프용)', en: 'low-sodium vegetable broth', section: '견과 · 기타 (Pantry)' },
  ],
  3: [
    ...BASE_SHOPPING,
    { id: 'cabbage', ko: '양배추', en: 'green cabbage', section: '채소 · 과일 (Produce)' },
    { id: 'banana', ko: '바나나', en: 'bananas', section: '채소 · 과일 (Produce)' },
    { id: 'apple', ko: '사과', en: 'apples (Honeycrisp, Fuji)', section: '채소 · 과일 (Produce)' },
    { id: 'sweet-potato', ko: '고구마', en: 'Japanese sweet potatoes', section: '채소 · 과일 (Produce)' },
    { id: 'potato', ko: '감자', en: 'baby potatoes / Yukon Gold', section: '채소 · 과일 (Produce)' },
    { id: 'kabocha', ko: '단호박', en: 'kabocha squash', section: '채소 · 과일 (Produce)' },
    { id: 'soymilk', ko: '무가당 두유', en: 'unsweetened soy milk', section: '유제품 (Dairy)' },
    { id: 'almondmilk', ko: '무가당 아몬드밀크', en: 'unsweetened almond milk', section: '유제품 (Dairy)' },
    { id: 'dark-choco', ko: '다크초콜릿 85%', en: 'dark chocolate 85% cacao', section: '견과 · 기타 (Pantry)' },
  ],
  4: [
    ...BASE_SHOPPING,
    { id: 'cabbage', ko: '양배추', en: 'green cabbage', section: '채소 · 과일 (Produce)' },
    { id: 'apple', ko: '사과', en: 'apples', section: '채소 · 과일 (Produce)' },
    { id: 'sweet-potato', ko: '고구마', en: 'Japanese sweet potatoes', section: '채소 · 과일 (Produce)' },
    { id: 'kiwi', ko: '키위', en: 'kiwi', section: '채소 · 과일 (Produce)' },
    { id: 'pear', ko: '배', en: 'Asian pears', section: '채소 · 과일 (Produce)' },
    { id: 'strawberry', ko: '딸기', en: 'strawberries', section: '채소 · 과일 (Produce)' },
    { id: 'soymilk', ko: '무가당 두유', en: 'unsweetened soy milk', section: '유제품 (Dairy)' },
    { id: 'cheese', ko: '치즈', en: 'cheddar cheese', section: '유제품 (Dairy)' },
    { id: 'crackers', ko: '무염 크래커', en: 'unsalted crackers', section: '견과 · 기타 (Pantry)' },
    { id: 'dried-mango', ko: '말린 망고', en: 'dried mango, no sugar added', section: '견과 · 기타 (Pantry)' },
    { id: 'banana-chips', ko: '바나나칩', en: 'banana chips', section: '견과 · 기타 (Pantry)' },
  ],
};
