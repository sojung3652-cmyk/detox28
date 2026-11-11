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

/** 저녁 식사 알람 후 몇 분 뒤를 "단식 시작"으로 볼지 (저녁 먹는 시간) */
export const FAST_START_AFTER_DINNER_MIN = 60;

/** 물 마시기 목표(잔)와 알람 시간 */
export const WATER_GOAL = 8;
export const WATER_ALARM_TIMES = ['10:00', '14:00', '17:00'];

// ───────────────────────── 매일 기본 루틴 ─────────────────────────

export type RoutineItem = { id: string; label: string; detail?: string };

/** 4주 내내 공통으로 매일 체크하는 항목 */
export const DAILY_ROUTINE: RoutineItem[] = [
  { id: 'broccoli', label: '데친 브로콜리' },
  { id: 'greenbean', label: '데친 그린빈' },
  { id: 'tomato', label: '토마토' },
  { id: 'bellpepper', label: '벨페퍼' },
  { id: 'carrot', label: '볶은 당근' },
  { id: 'egg', label: '계란', detail: '계란후라이 4개 또는 삶은 계란 2개' },
  { id: 'nuts', label: '견과류', detail: '아몬드, 브라질넛, 호두 등' },
  { id: 'berry', label: '베리류', detail: '주로 블루베리 · 미국 딸기는 OK' },
  { id: 'natto', label: '낫토' },
  { id: 'oliveoil', label: '올리브오일 5스푼', detail: '하루 합계' },
];

// ───────────────────────── 주차별 플랜 ─────────────────────────

/** name: 한국어 이름, store: 미국 마트에서 찾을 때 쓰는 이름 */
export type Snack = { name: string; store: string };

export type WeekPlan = {
  week: 1 | 2 | 3 | 4;
  theme: string;
  ingredients: string[];
  snacks: Snack[];
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
    theme: '장내 환경 바꾸기',
    ingredients: ['브로콜리', '그린빈', '토마토', '아보카도', '파프리카', '당근', '달걀', '두부'],
    snacks: [
      { name: '플레인 요거트', store: 'plain Greek yogurt (unsweetened)' },
      { name: '찐 닭가슴살', store: 'boneless skinless chicken breast' },
      { name: '생오이 + 쌈장', store: 'Persian cucumbers · 쌈장은 H Mart' },
    ],
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
    theme: '간헐적 단식 시작',
    ingredients: [
      '브로콜리', '그린빈', '토마토', '아보카도', '파프리카', '당근', '달걀', '두부',
      '양배추', '오이', '견과류', '블루베리',
    ],
    snacks: [
      { name: '두유 (무가당)', store: 'unsweetened soy milk' },
      { name: '요거트', store: 'plain Greek yogurt' },
      { name: '두부', store: 'firm tofu' },
      { name: '카카오닙스', store: 'cacao nibs' },
      { name: '아보카도 + 으깬 달걀', store: 'avocado + eggs' },
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
    theme: '리듬 익히기',
    ingredients: [
      '브로콜리', '그린빈', '토마토', '아보카도', '파프리카', '당근', '달걀', '두부',
      '양배추', '오이', '견과류', '블루베리', '바나나', '사과',
    ],
    snacks: [
      { name: '두유', store: 'unsweetened soy milk' },
      { name: '찐 고구마', store: 'Japanese sweet potato' },
      { name: '요거트 + 베리류', store: 'plain Greek yogurt + blueberries' },
      { name: '찐 감자', store: 'baby potatoes / Yukon Gold' },
      { name: '다크초콜릿 (85% 이상)', store: 'dark chocolate 85% cacao' },
      { name: '아몬드밀크 + 바닐라 아이스크림', store: 'unsweetened almond milk + vanilla ice cream' },
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
    theme: '근육과 마무리',
    ingredients: [
      '브로콜리', '그린빈', '토마토', '아보카도', '양배추', '파프리카', '당근', '달걀',
      '호두', '삶은 고구마', '베리류', '사과',
    ],
    snacks: [
      { name: '두유', store: 'unsweetened soy milk' },
      { name: '요거트 + 베리류', store: 'plain Greek yogurt + berries' },
      { name: '키위', store: 'kiwi' },
      { name: '배', store: 'Asian pear' },
      { name: '말린 망고', store: 'dried mango (no sugar added)' },
      { name: '다크초콜릿 (85% 이상)', store: 'dark chocolate 85% cacao' },
      { name: '바나나칩', store: 'banana chips' },
      { name: '무염 크래커 + 치즈 + 딸기', store: 'unsalted crackers + cheese + strawberries' },
      { name: '아몬드밀크 + 바닐라 아이스크림', store: 'unsweetened almond milk + vanilla ice cream' },
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

// ───────────────────────── 메뉴 추천 ─────────────────────────

export type Menu = {
  name: string;
  /** 간단한 재료 (미국 마트 기준) */
  ingredients: string;
  /** 조리법 2~3줄 */
  steps: string[];
};

export const LOW_CARB_DINNERS: Menu[] = [
  {
    name: '연어구이 + 아보카도 + 데친 브로콜리',
    ingredients: 'salmon fillet, avocado, broccoli, 올리브오일, 소금·후추',
    steps: [
      '연어에 소금·후추를 뿌리고 올리브오일 두른 팬에 껍질부터 4분, 뒤집어 3분 굽기.',
      '브로콜리는 끓는 물에 1~2분 데치기.',
      '아보카도를 썰어 곁들이고 올리브오일 한 스푼.',
    ],
  },
  {
    name: '두부 스테이크 + 그린빈 + 볶은 당근',
    ingredients: 'firm tofu, green beans, carrots, 간장 조금',
    steps: [
      '두부는 물기를 빼고 1.5cm 두께로 썰어 앞뒤 노릇하게 굽기.',
      '그린빈은 2분 데치고, 당근은 채 썰어 올리브오일에 볶기.',
      '간장 반 스푼을 두부에 살짝 둘러 마무리.',
    ],
  },
  {
    name: '닭가슴살 양배추볶음',
    ingredients: 'chicken breast, green cabbage, 마늘, 간장',
    steps: [
      '닭가슴살을 한입 크기로 썰어 올리브오일에 마늘과 함께 익히기.',
      '양배추를 넣고 숨이 죽을 때까지 볶기.',
      '간장 조금, 후추로 간하기.',
    ],
  },
  {
    name: '벨페퍼 · 토마토 오믈렛',
    ingredients: 'eggs, bell pepper, cherry tomatoes',
    steps: [
      '벨페퍼와 토마토를 잘게 썰어 올리브오일에 1분 볶기.',
      '풀어 둔 달걀 3개를 붓고 약불에서 익히다 반 접기.',
    ],
  },
  {
    name: '콜리플라워 라이스 채소볶음',
    ingredients: 'riced cauliflower (냉동 코너), 당근, 벨페퍼, 달걀',
    steps: [
      '당근·벨페퍼를 먼저 볶고 콜리플라워 라이스를 넣어 5분 볶기.',
      '한쪽에 달걀을 스크램블해서 섞기.',
      '간장이나 소금으로 가볍게 간.',
    ],
  },
  {
    name: '새우 주키니 볶음',
    ingredients: 'shrimp (peeled), zucchini, 마늘',
    steps: [
      '마늘을 올리브오일에 볶다가 새우를 넣고 색이 변할 때까지 익히기.',
      '반달 썬 주키니를 넣고 2~3분 더 볶기.',
      '소금·후추, 레몬즙 조금.',
    ],
  },
  {
    name: '소고기 채소볶음',
    ingredients: 'flank steak 또는 sirloin, 브로콜리, 벨페퍼, 양파 조금',
    steps: [
      '소고기를 얇게 썰어 센 불에 빠르게 볶아 덜어 두기.',
      '채소를 볶다가 소고기를 다시 넣고 간장 조금으로 마무리.',
    ],
  },
  {
    name: '낫토 계란 채소볼',
    ingredients: 'natto (H Mart 냉동), 달걀, 데친 채소',
    steps: [
      '그릇에 데친 브로콜리·그린빈·양배추를 담기.',
      '낫토를 잘 저어 올리고 반숙 계란이나 계란후라이 올리기.',
      '올리브오일 한 스푼, 김가루 조금.',
    ],
  },
];

export const NORMAL_DINNERS: Menu[] = [
  {
    name: '현미밥 + 된장국 + 생선구이',
    ingredients: 'brown rice, 된장 (H Mart), tofu, cod 또는 mackerel',
    steps: [
      '현미밥은 반 공기.',
      '된장국은 두부·애호박·양파를 넣고 끓이기.',
      '생선은 소금 살짝 뿌려 팬이나 에어프라이어에 굽기.',
    ],
  },
  {
    name: '고구마 + 닭가슴살 + 샐러드',
    ingredients: 'sweet potato, chicken breast, mixed greens',
    steps: [
      '고구마는 찌거나 에어프라이어 200°C에 25분.',
      '닭가슴살은 소금·후추로 구워 썰기.',
      '샐러드에 올리브오일과 레몬즙.',
    ],
  },
  {
    name: '현미 비빔밥',
    ingredients: 'brown rice, 시금치, 당근, 콩나물, 달걀, 고추장 조금',
    steps: [
      '현미밥 반 공기에 데친 나물과 볶은 당근 올리기.',
      '계란후라이 하나, 고추장은 반 스푼만.',
    ],
  },
  {
    name: '퀴노아 볼',
    ingredients: 'quinoa, chickpeas, cucumber, cherry tomatoes, avocado',
    steps: [
      '퀴노아를 물 2배에 15분 삶기.',
      '병아리콩, 오이, 토마토, 아보카도를 올리고 올리브오일·레몬즙.',
    ],
  },
  {
    name: '통밀 파스타 토마토소스 (소량)',
    ingredients: 'whole wheat pasta, marinara (no sugar added), 닭가슴살 또는 새우',
    steps: [
      '파스타는 평소의 절반 양으로 삶기.',
      '토마토소스에 단백질과 채소를 넉넉히 넣어 비율 맞추기.',
    ],
  },
];

export const POST_FAST_MEALS: Menu[] = [
  {
    name: '두유 + 데친 채소',
    ingredients: 'unsweetened soy milk, 브로콜리, 양배추',
    steps: [
      '두유 한 컵을 천천히 먼저 마시기.',
      '10~20분 뒤 데친 채소를 꼭꼭 씹어 먹기.',
    ],
  },
  {
    name: '계란 + 데친 채소',
    ingredients: 'eggs, 브로콜리, 그린빈',
    steps: [
      '삶은 계란 1~2개와 데친 채소로 가볍게 시작.',
      '천천히 먹고, 1~2시간 뒤 평소 식사.',
    ],
  },
];

export const POST_FAST_NOTE = '단식 후 첫 끼는 가볍게, 천천히. 기름지거나 단 음식은 피해요.';

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

// ───────────────────────── 알람 문구 (여러 개 중 랜덤) ─────────────────────────
// {dinner} 는 "탄수화물 X" 또는 "일반식", {week} 는 주차 번호, {theme} 는 주차 테마로 바뀌어요.

export const ALARM_TEXTS = {
  breakfast: {
    title: ['좋은 아침이에요', '아침 먹을 시간', '오늘도 시작해 볼까요'],
    body: [
      '낫토랑 계란으로 든든하게 시작해요.',
      '천천히, 따뜻하게 아침 챙겨 먹어요.',
      '오늘 하루도 응원할게요.',
      '물 한 잔 먼저 마시고 아침 먹어요.',
    ],
  },
  lunch: {
    title: ['점심 시간이에요', '점심 챙겨 먹어요'],
    body: [
      '채소 먼저, 천천히 꼭꼭.',
      '바빠도 점심은 거르지 말아요.',
      '오후도 힘내라고 점심 알림 보내요.',
    ],
  },
  dinner: {
    title: ['저녁 시간 · 오늘은 {dinner}', '오늘 저녁은 {dinner}'],
    body: [
      '오늘 하루도 수고했어요.',
      '맛있게, 천천히 먹어요.',
      '메뉴 탭에서 {dinner} 메뉴를 골라 봐요.',
    ],
  },
  dinnerBeforeFast: {
    title: ['저녁 시간 · 오늘은 {dinner}'],
    body: [
      '저녁 먹고 나면 24시간 단식이 시작돼요. 든든하게 드세요.',
      '오늘 저녁 후 단식 시작이에요. 단백질 꼭 챙겨요.',
    ],
  },
  water: {
    title: ['물 한 잔 마실 시간', '물 마셔요', '수분 충전 시간'],
    body: ['한 잔 마시고 카운터도 눌러 줘요.', '목마르기 전에 한 잔.', '물 한 잔이 컨디션을 지켜 줘요.'],
  },
  waterFasting: {
    title: ['물 한 잔 마실 시간'],
    body: ['단식 중엔 물을 더 자주 마셔요.', '단식 중이니까 물 한 잔 꼭.'],
  },
  fastStart: {
    title: ['단식 시작', '지금부터 24시간 단식'],
    body: ['오늘 밤도 편하게 쉬어요. 내일 같은 시간에 끝나요.', '물은 자주 마셔도 괜찮아요. 응원할게요.'],
  },
  fastHalf: {
    title: ['12시간 지났어요', '벌써 절반!'],
    body: ['잘하고 있어요. 오늘은 근력운동 대신 가볍게 걸어요.', '절반 왔어요. 물 한 잔 마시고 힘내요.'],
  },
  fastAlmost: {
    title: ['단식 2시간 남았어요', '거의 다 왔어요'],
    body: ['조금만 더! 첫 끼는 두유나 계란으로 가볍게 준비해 둬요.', '2시간만 버티면 끝이에요.'],
  },
  fastEnd: {
    title: ['단식 끝! 수고했어요', '단식 완료'],
    body: ['가볍게 첫 끼 드세요. 천천히, 꼭꼭.', '가볍게 첫 끼 드세요. 두유나 계란, 데친 채소부터.'],
  },
  newWeek: {
    title: ['{week}주차 시작', '새로운 한 주, {week}주차'],
    body: ['이번 주 테마는 "{theme}". 오늘 화면에서 확인해요.', '{theme}. 이번 주도 함께해요.'],
  },
};

/** 28일이 끝나는 날 저녁 이후 보내는 마지막 알람 */
export const FINISH_ALARM = {
  title: '28일 완주!',
  body: '4주 동안 정말 수고 많았어요.',
};
