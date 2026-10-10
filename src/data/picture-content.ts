export const ANIMALS = [
  { id: 'rabbit', name: '토끼', english: 'Rabbit', group: '포유류', fact: '토끼는 긴 귀가 있고 새끼에게 젖을 먹여요.' },
  { id: 'elephant', name: '코끼리', english: 'Elephant', group: '포유류', fact: '코끼리는 긴 코로 물을 마시고 먹이를 집어요.' },
  { id: 'giraffe', name: '기린', english: 'Giraffe', group: '포유류', fact: '기린은 긴 목으로 높은 나뭇잎을 먹어요.' },
  { id: 'monkey', name: '원숭이', english: 'Monkey', group: '포유류', fact: '원숭이는 손으로 가지를 잡고 나무를 타요.' },
  { id: 'panda', name: '판다', english: 'Panda', group: '포유류', fact: '판다는 대나무를 아주 좋아해요.' },
  { id: 'hippo', name: '하마', english: 'Hippo', group: '포유류', fact: '하마는 물에서 쉬지만 공기로 숨을 쉬어요.' },
  { id: 'pig', name: '돼지', english: 'Pig', group: '포유류', fact: '돼지는 코로 냄새를 잘 맡아요.' },
  { id: 'parrot', name: '앵무새', english: 'Parrot', group: '새', fact: '앵무새는 깃털과 부리가 있고 알을 낳아요.' },
  { id: 'penguin', name: '펭귄', english: 'Penguin', group: '새', fact: '펭귄은 날지 못하지만 깃털과 날개가 있는 새예요.' },
  { id: 'snake', name: '뱀', english: 'Snake', group: '파충류', fact: '뱀은 다리가 없고 몸이 비늘로 덮여 있어요.' },
  { id: 'bear', name: '곰', english: 'Bear', group: '포유류', fact: '곰은 두꺼운 털이 있고 새끼에게 젖을 먹여요.' },
  { id: 'dog', name: '강아지', english: 'Dog', group: '포유류', fact: '강아지는 코로 냄새를 맡으며 세상을 알아가요.' },
  { id: 'duck', name: '오리', english: 'Duck', group: '새', fact: '오리는 깃털과 부리가 있고 물갈퀴로 헤엄쳐요.' },
  { id: 'cow', name: '소', english: 'Cow', group: '포유류', fact: '소는 풀을 먹고 새끼에게 젖을 먹여요.' },
  { id: 'horse', name: '말', english: 'Horse', group: '포유류', fact: '말은 단단한 발굽으로 힘차게 달려요.' },
  { id: 'zebra', name: '얼룩말', english: 'Zebra', group: '포유류', fact: '얼룩말의 줄무늬는 한 마리마다 달라요.' },
  { id: 'owl', name: '부엉이', english: 'Owl', group: '새', fact: '부엉이는 깃털과 부리가 있고 밤에 잘 볼 수 있어요.' },
  { id: 'crocodile', name: '악어', english: 'Crocodile', group: '파충류', fact: '악어는 단단한 비늘이 있고 알을 낳아요.' },
  { id: 'goat', name: '염소', english: 'Goat', group: '포유류', fact: '염소는 풀을 먹고 새끼에게 젖을 먹여요.' },
  { id: 'whale', name: '고래', english: 'Whale', group: '포유류', fact: '고래는 물속에 살지만 공기로 숨 쉬고 새끼에게 젖을 먹여요.' },
] as const;

export const FOODS = [
  { id: 'apple', name: '사과', english: 'Apple' },
  { id: 'banana', name: '바나나', english: 'Banana' },
  { id: 'carrot', name: '당근', english: 'Carrot' },
  { id: 'broccoli', name: '브로콜리', english: 'Broccoli' },
  { id: 'corn', name: '옥수수', english: 'Corn' },
  { id: 'tomato', name: '토마토', english: 'Tomato' },
  { id: 'pumpkin', name: '호박', english: 'Pumpkin' },
  { id: 'grapes', name: '포도', english: 'Grapes' },
  { id: 'strawberry', name: '딸기', english: 'Strawberry' },
  { id: 'orange', name: '오렌지', english: 'Orange' },
  { id: 'cheese', name: '치즈', english: 'Cheese' },
  { id: 'bread', name: '빵', english: 'Bread' },
  { id: 'mushroom', name: '버섯', english: 'Mushroom' },
  { id: 'egg', name: '달걀', english: 'Egg' },
] as const;

export const VEHICLES = [
  { id: 'car', name: '자동차', english: 'Car', group: '도로', job: '가족과 함께 가까운 곳으로 이동해요.' },
  { id: 'suv', name: '승용차', english: 'SUV', group: '도로', job: '넓은 짐칸에 여행 가방을 싣고 가족과 떠나요.' },
  { id: 'race-car', name: '경주차', english: 'Racecar', group: '도로', job: '경주장에서 정해진 길을 빠르게 달려요.' },
  { id: 'police-car', name: '경찰차', english: 'Police car', group: '긴급', job: '경찰관이 타고 마을을 순찰해요.' },
  { id: 'taxi', name: '택시', english: 'Taxi', group: '도로', job: '손님이 원하는 곳까지 태워다 줘요.' },
  { id: 'ambulance', name: '구급차', english: 'Ambulance', group: '긴급', job: '아픈 사람을 병원으로 안전하게 데려가요.' },
  { id: 'fire-truck', name: '소방차', english: 'Fire truck', group: '긴급', job: '소방관이 물과 장비로 불을 끄도록 도와요.' },
  { id: 'pickup', name: '픽업트럭', english: 'Pickup', group: '도로', job: '뒤쪽의 열린 짐칸에 물건을 실어요.' },
  { id: 'bus', name: '버스', english: 'Bus', group: '도로', job: '정류장에서 여러 사람을 태우고 정해진 길을 다녀요.' },
  { id: 'truck', name: '화물차', english: 'Truck', group: '도로', job: '큰 짐칸에 많은 상자를 싣고 배달해요.' },
  { id: 'excavator', name: '굴착기', english: 'Excavator', group: '중장비', job: '긴 팔 끝에 달린 삽으로 땅을 파요.' },
  { id: 'crane', name: '크레인', english: 'Crane', group: '중장비', job: '높이 뻗은 팔과 갈고리로 무거운 물건을 들어 올려요.' },
  { id: 'dump-truck', name: '덤프트럭', english: 'Dump truck', group: '중장비', job: '짐칸을 기울여 모래와 흙을 쏟아 내려요.' },
  { id: 'bulldozer', name: '불도저', english: 'Bulldozer', group: '중장비', job: '앞의 넓은 삽날로 흙을 밀어 땅을 고르게 해요.' },
  { id: 'cement-mixer', name: '레미콘', english: 'Mixer', group: '중장비', job: '큰 통을 돌려 콘크리트가 굳지 않게 섞어요.' },
  { id: 'forklift', name: '지게차', english: 'Forklift', group: '중장비', job: '앞의 두 갈래 포크로 상자가 쌓인 받침대를 들어요.' },
  { id: 'tractor', name: '트랙터', english: 'Tractor', group: '중장비', job: '밭에서 농기구를 끌며 농사일을 도와요.' },
  { id: 'roller', name: '도로 롤러', english: 'Roller', group: '중장비', job: '무거운 둥근 바퀴로 새로 만든 도로를 꾹 눌러요.' },
  { id: 'train', name: '기차', english: 'Train', group: '여행', job: '철길을 따라 많은 사람과 짐을 나르며 달려요.' },
  { id: 'airplane', name: '비행기', english: 'Plane', group: '여행', job: '날개로 하늘을 날아 먼 나라까지 사람을 태워요.' },
  { id: 'helicopter', name: '헬리콥터', english: 'Helicopter', group: '여행', job: '머리 위의 날개를 돌려 제자리에서 떠올라요.' },
  { id: 'boat', name: '돛단배', english: 'Boat', group: '여행', job: '바람을 받는 돛을 펴고 물 위를 나아가요.' },
] as const;

export const PICTURE_WORDS = [...ANIMALS, ...FOODS, ...VEHICLES];
export const COLLECTIBLE_PICTURES = ['high-speed-train', 'monorail', 'tram', 'submarine', 'submersible', 'speedboat', 'hovercraft', 'cruise-ship', 'cable-car', 'motorcycle', 'scooter', 'hot-air-balloon', 'hang-glider', 'zipline', 'snowmobile', 'ufo', 'light-plane', 'fighter', 'shuttle', 'trophy'] as const;
/**
 * Twemoji SVGs under public/assets/twemoji (CC BY 4.0, see CREDITS.md there).
 * Only ids that no illustration or Kenney asset already claims live here, so a
 * PictureId always resolves to exactly one file.
 */
export const TWEMOJI_PICTURES = {
  // animals & nature
  cat: { name: '고양이', english: 'Cat' }, lion: { name: '사자', english: 'Lion' }, octopus: { name: '문어', english: 'Octopus' },
  butterfly: { name: '나비', english: 'Butterfly' }, turtle: { name: '거북이', english: 'Turtle' }, squirrel: { name: '다람쥐', english: 'Squirrel' },
  fox: { name: '여우', english: 'Fox' }, unicorn: { name: '유니콘', english: 'Unicorn' }, jellyfish: { name: '해파리', english: 'Jellyfish' },
  koala: { name: '코알라', english: 'Koala' }, tiger: { name: '호랑이', english: 'Tiger' }, raccoon: { name: '너구리', english: 'Raccoon' },
  shell: { name: '조개', english: 'Shell' }, nest: { name: '둥지', english: 'Nest' }, seedling: { name: '새싹', english: 'Seedling' },
  sunflower: { name: '해바라기', english: 'Sunflower' }, tulip: { name: '튤립', english: 'Tulip' }, cactus: { name: '선인장', english: 'Cactus' },
  'cherry-blossom': { name: '벚꽃', english: 'Cherry blossom' }, 'maple-leaf': { name: '단풍잎', english: 'Maple leaf' }, 'palm-tree': { name: '야자나무', english: 'Palm tree' },
  'christmas-tree': { name: '크리스마스트리', english: 'Christmas tree' }, earth: { name: '지구', english: 'Earth' },
  // sky & weather
  rainbow: { name: '무지개', english: 'Rainbow' }, sun: { name: '해', english: 'Sun' }, moon: { name: '달', english: 'Moon' },
  cloud: { name: '구름', english: 'Cloud' }, 'rain-cloud': { name: '비', english: 'Rain' }, 'snow-cloud': { name: '눈', english: 'Snow' },
  snowman: { name: '눈사람', english: 'Snowman' }, 'glowing-star': { name: '반짝별', english: 'Glowing star' }, sparkles: { name: '반짝이', english: 'Sparkles' },
  // food
  'ice-cream': { name: '아이스크림', english: 'Ice cream' }, pizza: { name: '피자', english: 'Pizza' }, sandwich: { name: '샌드위치', english: 'Sandwich' },
  pancakes: { name: '팬케이크', english: 'Pancakes' }, cupcake: { name: '머핀', english: 'Cupcake' }, doughnut: { name: '도넛', english: 'Doughnut' },
  cookie: { name: '쿠키', english: 'Cookie' }, watermelon: { name: '수박', english: 'Watermelon' }, cherries: { name: '체리', english: 'Cherries' },
  'birthday-cake': { name: '생일 케이크', english: 'Birthday cake' }, pineapple: { name: '파인애플', english: 'Pineapple' }, lemon: { name: '레몬', english: 'Lemon' },
  kiwi: { name: '키위', english: 'Kiwi' }, chocolate: { name: '초콜릿', english: 'Chocolate' }, juice: { name: '주스', english: 'Juice' },
  coffee: { name: '커피', english: 'Coffee' }, bowl: { name: '시리얼', english: 'Cereal' }, beans: { name: '콩', english: 'Beans' },
  // things
  robot: { name: '로봇', english: 'Robot' }, kite: { name: '연', english: 'Kite' }, balloon: { name: '풍선', english: 'Balloon' },
  'teddy-bear': { name: '곰인형', english: 'Teddy bear' }, 'soccer-ball': { name: '축구공', english: 'Soccer ball' }, baseball: { name: '야구공', english: 'Baseball' },
  football: { name: '럭비공', english: 'Football' }, gift: { name: '선물', english: 'Gift' }, castle: { name: '성', english: 'Castle' },
  umbrella: { name: '우산', english: 'Umbrella' }, 'umbrella-rain': { name: '우산', english: 'Umbrella' }, hat: { name: '모자', english: 'Hat' },
  violin: { name: '바이올린', english: 'Violin' }, xylophone: { name: '실로폰', english: 'Xylophone' }, tooth: { name: '이빨', english: 'Tooth' },
  tongue: { name: '혀', english: 'Tongue' }, chef: { name: '요리사', english: 'Chef' }, child: { name: '어린이', english: 'Child' },
  queen: { name: '여왕', english: 'Queen' }, grin: { name: '웃는 얼굴', english: 'Grin' },
  faucet: { name: '수도꼭지', english: 'Faucet' }, soap: { name: '비누', english: 'Soap' }, bubbles: { name: '거품', english: 'Bubbles' },
  droplet: { name: '물방울', english: 'Water drop' }, 'toilet-paper': { name: '휴지', english: 'Tissue' }, toothbrush: { name: '칫솔', english: 'Toothbrush' },
  bathtub: { name: '욕조', english: 'Bathtub' }, shower: { name: '샤워기', english: 'Shower' }, 't-shirt': { name: '티셔츠', english: 'T-shirt' },
  book: { name: '책', english: 'Book' }, 'blue-book': { name: '공책', english: 'Notebook' }, bed: { name: '침대', english: 'Bed' },
  'alarm-clock': { name: '시계', english: 'Clock' }, backpack: { name: '가방', english: 'Backpack' }, school: { name: '학교', english: 'School' },
  'white-circle': { name: '눈뭉치', english: 'Snowball' }, tent: { name: '텐트', english: 'Tent' }, 'triangle-ruler': { name: '삼각자', english: 'Triangle ruler' },
  dice: { name: '주사위', english: 'Dice' }, window: { name: '창문', english: 'Window' }, door: { name: '문', english: 'Door' },
  phone: { name: '휴대폰', english: 'Phone' }, 'red-heart': { name: '하트', english: 'Heart' }, 'heart-ribbon': { name: '리본 하트', english: 'Heart with ribbon' },
  gem: { name: '보석', english: 'Gem' }, 'orange-diamond': { name: '마름모', english: 'Diamond' }, radio: { name: '라디오', english: 'Radio' },
  microphone: { name: '마이크', english: 'Microphone' }, camera: { name: '카메라', english: 'Camera' }, circus: { name: '서커스', english: 'Circus' },
  'music-note': { name: '노래', english: 'Music note' }, ribbon: { name: '리본', english: 'Ribbon' }, ski: { name: '스키', english: 'Ski' },
  crayon: { name: '크레파스', english: 'Crayon' }, sailboat: { name: '요트', english: 'Yacht' },
} as const;
export type TwemojiId = keyof typeof TWEMOJI_PICTURES;
export type PictureId = typeof COLLECTIBLE_PICTURES[number] | typeof PICTURE_WORDS[number]['id'] | 'rocket' | 'rocket-blue' | 'meteor' | 'star' | 'burger' | 'donut' | 'fish' | 'car-red' | 'car-blue' | 'car-green' | TwemojiId;
const EXTRA_PICTURES = ['rocket', 'rocket-blue', 'meteor', 'star', 'burger', 'donut', 'fish', 'car-red', 'car-blue', 'car-green'];
/** Whether a free-form id (a data file's wordImage, say) names a picture we ship. */
export function hasPicture(id: string | undefined | null): id is PictureId {
  if (!id) return false;
  return (COLLECTIBLE_PICTURES as readonly string[]).includes(id) || PICTURE_WORDS.some((w) => w.id === id)
    || EXTRA_PICTURES.includes(id) || id in TWEMOJI_PICTURES;
}
/** Korean display name for any picture, whichever asset set it comes from. */
export function pictureName(id: PictureId): string {
  return PICTURE_WORDS.find((w) => w.id === id)?.name ?? (TWEMOJI_PICTURES as Record<string, { name: string }>)[id]?.name ?? id;
}
export function pictureEnglishName(id: PictureId): string {
  return PICTURE_WORDS.find((w) => w.id === id)?.english ?? (TWEMOJI_PICTURES as Record<string, { english: string }>)[id]?.english ?? id;
}
export const picturePath = (id: PictureId): string => {
  if (id === 'burger') return '/assets/illustrations/burger.svg';
  if ((COLLECTIBLE_PICTURES as readonly string[]).includes(id)) return `/assets/illustrations/${id}.svg`;
  if (FOODS.some((food) => food.id === id) || VEHICLES.some((vehicle) => vehicle.id === id)) return `/assets/illustrations/${id}.svg`;
  const isAnimal = ANIMALS.some((animal) => animal.id === id);
  if (!isAnimal && id in TWEMOJI_PICTURES) return `/assets/twemoji/${id}.svg`;
  const folder = isAnimal ? 'animals'
    : ['rocket', 'rocket-blue', 'meteor', 'star'].includes(id) ? 'space'
    : id.startsWith('car-') ? 'cars' : 'food';
  return `/assets/kenney/${folder}/${id}.png`;
};
export function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type PictureTheme = 'all' | 'vehicles' | 'animals' | 'food';
export const PICTURE_THEMES = [{ id: 'all', label: '모두' }, { id: 'vehicles', label: '탈것' }, { id: 'animals', label: '동물' }, { id: 'food', label: '음식' }] as const;
export function picturesForTheme(theme: PictureTheme) {
  return theme === 'vehicles' ? [...VEHICLES] : theme === 'animals' ? [...ANIMALS] : theme === 'food' ? [...FOODS] : PICTURE_WORDS;
}
