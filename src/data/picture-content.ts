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
export type PictureId = typeof COLLECTIBLE_PICTURES[number] | typeof PICTURE_WORDS[number]['id'] | 'rocket' | 'rocket-blue' | 'meteor' | 'star' | 'burger' | 'donut' | 'fish' | 'car-red' | 'car-blue' | 'car-green';
export const picturePath = (id: PictureId): string => {
  if (id === 'burger') return '/assets/illustrations/burger.svg';
  if ((COLLECTIBLE_PICTURES as readonly string[]).includes(id)) return `/assets/illustrations/${id}.svg`;
  if (FOODS.some((food) => food.id === id) || VEHICLES.some((vehicle) => vehicle.id === id)) return `/assets/illustrations/${id}.svg`;
  const folder = ANIMALS.some((animal) => animal.id === id) ? 'animals'
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
