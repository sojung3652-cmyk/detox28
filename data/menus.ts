/**
 * 메뉴 데이터 (메뉴 탭, 오늘 화면 "다음 할 일")
 *
 * - category: 'lowcarb' 탄수화물 X 저녁 / 'normal' 일반식 저녁 / 'snack' 간식 / 'postfast' 단식 후 첫 끼
 * - ingredients: 주요 재료 (한국어 + 미국 마트 표기)
 * - steps: 만드는 법 2~3줄
 * - minutes: 대략 걸리는 시간(분)
 * - fromWeek: 이 주차부터 가능 (2 이상이면 "2주차~" 배지)
 * - weeks: 간식만 사용. 이 간식이 추천되는 주차 목록 (간식 탭은 현재 주차 간식만 보여줘요)
 */

export type MenuCategory = 'lowcarb' | 'normal' | 'snack' | 'postfast';

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  ingredients: string[];
  steps: string[];
  minutes: number;
  fromWeek: 1 | 2 | 3 | 4;
  weeks?: number[];
};

export const MENUS: MenuItem[] = [
  // ───────────── 탄수화물 X 저녁 ─────────────
  {
    id: 'salmon-avocado',
    name: '연어구이 + 아보카도 + 데친 브로콜리',
    category: 'lowcarb',
    ingredients: ['연어 (salmon fillet)', '아보카도 (avocado)', '브로콜리 (broccoli florets)'],
    steps: [
      '연어에 소금·후추를 뿌리고 올리브오일 두른 팬에 껍질부터 4분, 뒤집어 3분 구워요.',
      '브로콜리는 끓는 물에 1~2분 데쳐요.',
      '아보카도를 썰어 곁들이고 올리브오일 한 스푼 둘러요.',
    ],
    minutes: 15,
    fromWeek: 1,
  },
  {
    id: 'tofu-steak',
    name: '두부 스테이크 + 그린빈 + 볶은 당근',
    category: 'lowcarb',
    ingredients: ['단단한 두부 (extra firm tofu)', '그린빈 (green beans)', '당근 (carrots)'],
    steps: [
      '두부는 물기를 빼고 1.5cm 두께로 썰어 앞뒤 노릇하게 구워요.',
      '그린빈은 2분 데치고, 당근은 채 썰어 올리브오일에 볶아요.',
      '간장 반 스푼을 두부에 살짝 둘러 마무리해요.',
    ],
    minutes: 20,
    fromWeek: 1,
  },
  {
    id: 'chicken-cabbage',
    name: '닭가슴살 양배추볶음',
    category: 'lowcarb',
    ingredients: ['닭가슴살 (boneless skinless chicken breast)', '양배추 (green cabbage)', '마늘 (garlic)'],
    steps: [
      '닭가슴살을 한입 크기로 썰어 올리브오일에 마늘과 함께 익혀요.',
      '양배추를 넣고 숨이 죽을 때까지 볶아요.',
      '간장 조금, 후추로 간해요.',
    ],
    minutes: 15,
    fromWeek: 1,
  },
  {
    id: 'pepper-omelet',
    name: '벨페퍼 · 토마토 오믈렛',
    category: 'lowcarb',
    ingredients: ['달걀 (eggs)', '벨페퍼 (bell pepper)', '방울토마토 (cherry tomatoes)'],
    steps: ['벨페퍼와 토마토를 잘게 썰어 올리브오일에 1분 볶아요.', '풀어 둔 달걀 3개를 붓고 약불에서 익히다 반으로 접어요.'],
    minutes: 10,
    fromWeek: 1,
  },
  {
    id: 'cauli-rice',
    name: '콜리플라워 라이스 채소볶음',
    category: 'lowcarb',
    ingredients: ['콜리플라워 라이스 (cauliflower rice, 냉동 코너)', '당근 (carrots)', '벨페퍼 (bell pepper)', '달걀 (eggs)'],
    steps: [
      '당근·벨페퍼를 먼저 볶고 콜리플라워 라이스를 넣어 5분 볶아요.',
      '한쪽에 달걀을 스크램블해서 섞어요.',
      '간장이나 소금으로 가볍게 간해요.',
    ],
    minutes: 15,
    fromWeek: 1,
  },
  {
    id: 'shrimp-zucchini',
    name: '새우 주키니 볶음',
    category: 'lowcarb',
    ingredients: ['새우 (peeled & deveined shrimp)', '주키니 (zucchini)', '마늘 (garlic)'],
    steps: ['마늘을 올리브오일에 볶다가 새우를 넣고 색이 변할 때까지 익혀요.', '반달로 썬 주키니를 넣고 2~3분 더 볶아요.', '소금·후추, 레몬즙 조금 뿌려요.'],
    minutes: 15,
    fromWeek: 1,
  },
  {
    id: 'beef-veggie',
    name: '소고기 채소볶음',
    category: 'lowcarb',
    ingredients: ['소고기 (flank steak 또는 sirloin)', '브로콜리 (broccoli)', '벨페퍼 (bell pepper)'],
    steps: ['소고기를 얇게 썰어 센 불에 빠르게 볶아 덜어 둬요.', '채소를 볶다가 소고기를 다시 넣고 간장 조금으로 마무리해요.'],
    minutes: 20,
    fromWeek: 1,
  },
  {
    id: 'natto-bowl',
    name: '낫토 계란 채소볼',
    category: 'lowcarb',
    ingredients: ['낫토 (natto, H Mart 냉동)', '달걀 (eggs)', '데친 채소 (broccoli, green beans, cabbage)'],
    steps: ['그릇에 데친 브로콜리·그린빈·양배추를 담아요.', '낫토를 잘 저어 올리고 반숙 계란이나 계란후라이를 올려요.', '올리브오일 한 스푼, 김가루 조금 뿌려요.'],
    minutes: 10,
    fromWeek: 1,
  },
  {
    id: 'cod-cabbage',
    name: '대구 양배추찜',
    category: 'lowcarb',
    ingredients: ['대구 (cod fillet)', '양배추 (green cabbage)', '레몬 (lemon)'],
    steps: ['팬에 양배추를 깔고 대구를 올려 소금·후추를 뿌려요.', '물 3스푼을 넣고 뚜껑 덮어 8분 쪄요.', '레몬즙과 올리브오일을 둘러요.'],
    minutes: 15,
    fromWeek: 2,
  },

  // ───────────── 일반식 저녁 ─────────────
  {
    id: 'rice-doenjang-fish',
    name: '현미밥 + 된장국 + 생선구이',
    category: 'normal',
    ingredients: ['현미 (brown rice)', '된장 (H Mart)', '두부 (firm tofu)', '고등어·대구 (mackerel / cod)'],
    steps: ['현미밥은 반 공기 정도로 담아요.', '된장국은 두부·애호박·양파를 넣고 끓여요.', '생선은 소금 살짝 뿌려 팬이나 에어프라이어에 구워요.'],
    minutes: 30,
    fromWeek: 1,
  },
  {
    id: 'sweetpotato-chicken',
    name: '고구마 + 닭가슴살 + 샐러드',
    category: 'normal',
    ingredients: ['고구마 (Japanese sweet potato)', '닭가슴살 (chicken breast)', '샐러드 채소 (spring mix)'],
    steps: ['고구마는 찌거나 에어프라이어 200°C에 25분 구워요.', '닭가슴살은 소금·후추로 구워 썰어요.', '샐러드에 올리브오일과 레몬즙을 뿌려요.'],
    minutes: 30,
    fromWeek: 3,
  },
  {
    id: 'bibimbap',
    name: '현미 비빔밥',
    category: 'normal',
    ingredients: ['현미 (brown rice)', '시금치 (spinach)', '콩나물 (bean sprouts, H Mart)', '달걀 (eggs)'],
    steps: ['현미밥 반 공기에 데친 나물과 볶은 당근을 올려요.', '계란후라이 하나, 고추장은 반 스푼만 넣어요.'],
    minutes: 20,
    fromWeek: 1,
  },
  {
    id: 'quinoa-bowl',
    name: '퀴노아 볼',
    category: 'normal',
    ingredients: ['퀴노아 (quinoa)', '병아리콩 (canned chickpeas)', '오이 (Persian cucumbers)', '아보카도 (avocado)'],
    steps: ['퀴노아를 물 2배에 15분 삶아요.', '병아리콩, 오이, 토마토, 아보카도를 올리고 올리브오일·레몬즙을 뿌려요.'],
    minutes: 20,
    fromWeek: 1,
  },
  {
    id: 'ww-pasta',
    name: '통밀 파스타 토마토소스 (소량)',
    category: 'normal',
    ingredients: ['통밀 파스타 (whole wheat pasta)', '토마토소스 (marinara, no sugar added)', '새우 또는 닭가슴살'],
    steps: ['파스타는 평소의 절반 양만 삶아요.', '토마토소스에 단백질과 채소를 넉넉히 넣어 비율을 맞춰요.'],
    minutes: 20,
    fromWeek: 1,
  },
  {
    id: 'salmon-rice',
    name: '연어 현미 덮밥',
    category: 'normal',
    ingredients: ['연어 (salmon fillet)', '현미 (brown rice)', '오이 (Persian cucumbers)', '아보카도 (avocado)'],
    steps: ['연어를 구워 결대로 찢어요.', '현미밥 반 공기에 연어, 오이, 아보카도를 올리고 간장 조금 둘러요.'],
    minutes: 20,
    fromWeek: 1,
  },
  {
    id: 'kabocha-tofu',
    name: '단호박 두부 한 그릇',
    category: 'normal',
    ingredients: ['단호박 (kabocha squash)', '두부 (firm tofu)', '시금치 (spinach)'],
    steps: ['단호박은 한입 크기로 썰어 전자레인지에 6~7분 익혀요.', '두부는 구워서 곁들이고, 시금치는 살짝 데쳐 올리브오일에 무쳐요.'],
    minutes: 20,
    fromWeek: 3,
  },

  // ───────────── 간식 (weeks: 추천 주차) ─────────────
  { id: 'yogurt', name: '플레인 요거트', category: 'snack', ingredients: ['플레인 그릭요거트 (Greek yogurt plain, unsweetened)'], steps: ['작은 그릇 하나 분량으로 먹어요.'], minutes: 1, fromWeek: 1, weeks: [1, 2] },
  { id: 'steamed-chicken', name: '찐 닭가슴살', category: 'snack', ingredients: ['닭가슴살 (boneless skinless chicken breast)'], steps: ['소금 살짝 뿌려 15분 쪄서 한 덩이씩 나눠 둬요.'], minutes: 15, fromWeek: 1, weeks: [1] },
  { id: 'cucumber-ssamjang', name: '생오이 + 쌈장', category: 'snack', ingredients: ['오이 (Persian cucumbers)', '쌈장 (H Mart)'], steps: ['오이를 길게 썰어 쌈장 조금 찍어 먹어요.'], minutes: 2, fromWeek: 1, weeks: [1] },
  { id: 'soymilk', name: '두유 (무가당)', category: 'snack', ingredients: ['무가당 두유 (unsweetened soy milk)'], steps: ['한 컵 천천히 마셔요.'], minutes: 1, fromWeek: 2, weeks: [2, 3, 4] },
  { id: 'tofu-snack', name: '두부', category: 'snack', ingredients: ['두부 (silken 또는 firm tofu)'], steps: ['간장 몇 방울, 김가루 조금 올려 먹어요.'], minutes: 2, fromWeek: 2, weeks: [2] },
  { id: 'cacao-nibs', name: '카카오닙스', category: 'snack', ingredients: ['카카오닙스 (cacao nibs)'], steps: ['한 스푼, 요거트에 뿌려도 좋아요.'], minutes: 1, fromWeek: 2, weeks: [2] },
  { id: 'avocado-egg', name: '아보카도 + 으깬 달걀', category: 'snack', ingredients: ['아보카도 (avocado)', '삶은 달걀 (hard-boiled eggs)'], steps: ['삶은 달걀과 아보카도를 으깨 소금·후추로 간해요.'], minutes: 5, fromWeek: 2, weeks: [2] },
  { id: 'sweet-potato', name: '찐 고구마', category: 'snack', ingredients: ['고구마 (Japanese sweet potato)'], steps: ['작은 것 하나를 쪄서 먹어요.'], minutes: 25, fromWeek: 3, weeks: [3] },
  { id: 'yogurt-berry', name: '요거트 + 베리류', category: 'snack', ingredients: ['그릭요거트 (Greek yogurt plain)', '블루베리 (blueberries)'], steps: ['요거트에 블루베리 한 줌을 올려요.'], minutes: 2, fromWeek: 3, weeks: [3, 4] },
  { id: 'potato', name: '찐 감자', category: 'snack', ingredients: ['감자 (baby potatoes / Yukon Gold)'], steps: ['작은 감자 2~3알을 쪄서 먹어요.'], minutes: 20, fromWeek: 3, weeks: [3] },
  { id: 'dark-choco', name: '다크초콜릿 (85% 이상)', category: 'snack', ingredients: ['다크초콜릿 (dark chocolate 85% cacao)'], steps: ['한두 조각만 천천히 녹여 먹어요.'], minutes: 1, fromWeek: 3, weeks: [3, 4] },
  { id: 'almond-icecream', name: '아몬드밀크 + 바닐라 아이스크림', category: 'snack', ingredients: ['무가당 아몬드밀크 (unsweetened almond milk)', '바닐라 아이스크림 (vanilla ice cream)'], steps: ['아몬드밀크 한 컵에 아이스크림 작은 한 스쿱을 띄워요.'], minutes: 2, fromWeek: 3, weeks: [3, 4] },
  { id: 'kiwi', name: '키위', category: 'snack', ingredients: ['키위 (kiwi)'], steps: ['한두 개, 반 갈라 숟가락으로 떠먹어요.'], minutes: 2, fromWeek: 4, weeks: [4] },
  { id: 'asian-pear', name: '배', category: 'snack', ingredients: ['배 (Asian pear)'], steps: ['4분의 1쪽 정도 깎아 먹어요.'], minutes: 3, fromWeek: 4, weeks: [4] },
  { id: 'dried-mango', name: '말린 망고', category: 'snack', ingredients: ['말린 망고 (dried mango, no sugar added)'], steps: ['두세 조각만 먹어요.'], minutes: 1, fromWeek: 4, weeks: [4] },
  { id: 'banana-chips', name: '바나나칩', category: 'snack', ingredients: ['바나나칩 (banana chips)'], steps: ['작은 한 줌만 먹어요.'], minutes: 1, fromWeek: 4, weeks: [4] },
  { id: 'cracker-cheese', name: '무염 크래커 + 치즈 + 딸기', category: 'snack', ingredients: ['무염 크래커 (unsalted crackers)', '치즈 (cheddar)', '딸기 (strawberries)'], steps: ['크래커 3~4개에 치즈와 딸기를 올려요.'], minutes: 3, fromWeek: 4, weeks: [4] },

  // ───────────── 단식 후 첫 끼 ─────────────
  { id: 'pf-soymilk-veg', name: '두유 + 데친 채소', category: 'postfast', ingredients: ['무가당 두유 (unsweetened soy milk)', '브로콜리 (broccoli)', '양배추 (cabbage)'], steps: ['두유 한 컵을 천천히 먼저 마셔요.', '10~20분 뒤 데친 채소를 꼭꼭 씹어 먹어요.'], minutes: 10, fromWeek: 2 },
  { id: 'pf-egg-veg', name: '계란 + 데친 채소', category: 'postfast', ingredients: ['달걀 (eggs)', '브로콜리 (broccoli)', '그린빈 (green beans)'], steps: ['삶은 계란 1~2개와 데친 채소로 가볍게 시작해요.', '천천히 먹고, 1~2시간 뒤 평소 식사를 해요.'], minutes: 12, fromWeek: 2 },
  { id: 'pf-veg-soup', name: '채소 수프', category: 'postfast', ingredients: ['채소 육수 (low-sodium vegetable broth)', '당근 (carrots)', '양배추 (cabbage)', '주키니 (zucchini)'], steps: ['채소를 잘게 썰어 육수에 15분 끓여요.', '따뜻하게 한 그릇, 천천히 떠먹어요.'], minutes: 20, fromWeek: 2 },
  { id: 'pf-tofu-soup', name: '순두부 계란탕', category: 'postfast', ingredients: ['순두부 (silken tofu, H Mart)', '달걀 (eggs)', '대파 (green onions)'], steps: ['물에 순두부를 넣고 끓으면 달걀을 풀어 넣어요.', '소금 조금, 대파를 올려 순하게 먹어요.'], minutes: 10, fromWeek: 2 },
  { id: 'pf-yogurt', name: '플레인 요거트 반 컵', category: 'postfast', ingredients: ['플레인 그릭요거트 (Greek yogurt plain, unsweetened)'], steps: ['반 컵 정도를 천천히 먹어요.', '속이 괜찮으면 30분 뒤 데친 채소를 먹어요.'], minutes: 2, fromWeek: 2 },
  { id: 'pf-avocado-egg', name: '아보카도 + 반숙 계란', category: 'postfast', ingredients: ['아보카도 (avocado)', '달걀 (eggs)'], steps: ['반숙 계란 1개와 아보카도 반 개를 소금 살짝 뿌려 먹어요.'], minutes: 10, fromWeek: 2 },
];

export const POST_FAST_NOTE = '단식 후 첫 끼는 가볍게, 천천히. 기름지거나 단 음식은 피해요.';

export function menusOf(category: MenuCategory) {
  return MENUS.filter((m) => m.category === category);
}

export function snacksForWeek(week: number) {
  return MENUS.filter((m) => m.category === 'snack' && m.weeks?.includes(week));
}
