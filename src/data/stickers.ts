export type StickerTheme = 'cars' | 'construction' | 'aviation' | 'special-vehicles' | 'vehicles';

export interface StickerInfo {
  id: string;
  name: string;
  theme: StickerTheme;
  category: 'numbers' | 'hangul' | 'english' | 'special';
  unlockCondition: string;
  description: string;
}

/** Category theme: numbers=cars, hangul=construction, english=aviation */
export const STICKERS: StickerInfo[] = [
  // Numbers category — cars theme
  { id: 'sticker-num-puppy', name: '경찰차', theme: 'cars', category: 'numbers', unlockCondition: 'numbers-1-complete', description: '숫자 1 학습 완료' },
  { id: 'sticker-num-kitten', name: '소방차', theme: 'cars', category: 'numbers', unlockCondition: 'numbers-3-complete', description: '숫자 3 학습 완료' },
  { id: 'sticker-num-bunny', name: '구급차', theme: 'cars', category: 'numbers', unlockCondition: 'numbers-5-complete', description: '숫자 5 학습 완료' },
  { id: 'sticker-num-panda', name: '스포츠카', theme: 'cars', category: 'numbers', unlockCondition: 'numbers-7-complete', description: '숫자 7 학습 완료' },
  { id: 'sticker-num-lion', name: 'SUV', theme: 'cars', category: 'numbers', unlockCondition: 'numbers-10-complete', description: '숫자 10 학습 완료' },
  { id: 'sticker-num-trophy', name: '숫자 트로피', theme: 'cars', category: 'numbers', unlockCondition: 'numbers-all-complete', description: '숫자 전체 학습 완료' },

  // Hangul category — construction theme
  { id: 'sticker-han-cake', name: '포크레인', theme: 'construction', category: 'hangul', unlockCondition: 'hangul-5-complete', description: '자음 5개 학습 완료' },
  { id: 'sticker-han-cookie', name: '크레인', theme: 'construction', category: 'hangul', unlockCondition: 'hangul-10-complete', description: '자음 10개 학습 완료' },
  { id: 'sticker-han-donut', name: '덤프트럭', theme: 'construction', category: 'hangul', unlockCondition: 'hangul-consonants-complete', description: '자음 전체 학습 완료' },
  { id: 'sticker-han-icecream', name: '불도저', theme: 'construction', category: 'hangul', unlockCondition: 'hangul-vowels-5-complete', description: '모음 5개 학습 완료' },
  { id: 'sticker-han-candy', name: '콘크리트믹서', theme: 'construction', category: 'hangul', unlockCondition: 'hangul-vowels-complete', description: '모음 전체 학습 완료' },
  { id: 'sticker-han-trophy', name: '한글 트로피', theme: 'construction', category: 'hangul', unlockCondition: 'hangul-all-complete', description: '한글 전체 학습 완료' },

  // English category — aviation theme
  { id: 'sticker-eng-car', name: '비행기', theme: 'aviation', category: 'english', unlockCondition: 'english-5-complete', description: 'A-E 학습 완료' },
  { id: 'sticker-eng-bus', name: '헬리콥터', theme: 'aviation', category: 'english', unlockCondition: 'english-10-complete', description: 'A-J 학습 완료' },
  { id: 'sticker-eng-train', name: '경비행기', theme: 'aviation', category: 'english', unlockCondition: 'english-15-complete', description: 'A-O 학습 완료' },
  { id: 'sticker-eng-airplane', name: '로켓', theme: 'aviation', category: 'english', unlockCondition: 'english-20-complete', description: 'A-T 학습 완료' },
  { id: 'sticker-eng-rocket', name: 'UFO', theme: 'aviation', category: 'english', unlockCondition: 'english-all-complete', description: '영어 전체 학습 완료' },
  { id: 'sticker-eng-trophy', name: '영어 트로피', theme: 'aviation', category: 'english', unlockCondition: 'english-all-complete', description: '영어 전체 학습 완료' },

  // Special stickers — special vehicles
  { id: 'sticker-special-streak3', name: '기차', theme: 'special-vehicles', category: 'special', unlockCondition: 'streak-3', description: '3일 연속 학습' },
  { id: 'sticker-special-streak7', name: '고속열차', theme: 'special-vehicles', category: 'special', unlockCondition: 'streak-7', description: '7일 연속 학습' },
  { id: 'sticker-special-firstgame', name: '요트', theme: 'special-vehicles', category: 'special', unlockCondition: 'first-game-clear', description: '첫 미니 게임 클리어' },
  { id: 'sticker-special-allgames', name: '유람선', theme: 'special-vehicles', category: 'special', unlockCondition: 'all-games-played', description: '모든 게임 플레이' },

  // Water vehicles
  { id: 'sticker-space-rocket', name: '잠수함', theme: 'special-vehicles', category: 'special', unlockCondition: 'level-3', description: '레벨 3 달성' },
  { id: 'sticker-space-astronaut', name: '쾌속정', theme: 'special-vehicles', category: 'special', unlockCondition: 'level-5', description: '레벨 5 달성' },
  { id: 'sticker-space-ufo', name: '호버크래프트', theme: 'special-vehicles', category: 'special', unlockCondition: 'stars-50', description: '별 50개 획득' },

  // Rail vehicles
  { id: 'sticker-ocean-whale', name: '모노레일', theme: 'special-vehicles', category: 'special', unlockCondition: 'stars-30', description: '별 30개 획득' },
  { id: 'sticker-ocean-dolphin', name: '케이블카', theme: 'special-vehicles', category: 'special', unlockCondition: 'games-5-clear', description: '게임 5종 클리어' },
  { id: 'sticker-ocean-octopus', name: '트램', theme: 'special-vehicles', category: 'special', unlockCondition: 'streak-14', description: '14일 연속 학습' },

  // Two-wheelers & personal
  { id: 'sticker-dino-trex', name: '오토바이', theme: 'special-vehicles', category: 'special', unlockCondition: 'level-7', description: '레벨 7 달성' },
  { id: 'sticker-dino-tricera', name: '스쿠터', theme: 'special-vehicles', category: 'special', unlockCondition: 'stars-100', description: '별 100개 획득' },

  // Fun vehicles
  { id: 'sticker-insect-butterfly', name: '열기구', theme: 'special-vehicles', category: 'special', unlockCondition: 'hangul-10-complete', description: '한글 10개 학습 완료' },
  { id: 'sticker-insect-ladybug', name: '행글라이더', theme: 'special-vehicles', category: 'special', unlockCondition: 'english-10-complete', description: '영어 10개 학습 완료' },

  // Special purpose
  { id: 'sticker-music-guitar', name: '소형 잠수정', theme: 'special-vehicles', category: 'special', unlockCondition: 'games-10-clear', description: '게임 10종 클리어' },
  { id: 'sticker-music-drum', name: '집라인', theme: 'special-vehicles', category: 'special', unlockCondition: 'level-4', description: '레벨 4 달성' },
  { id: 'sticker-music-piano', name: '스노모빌', theme: 'special-vehicles', category: 'special', unlockCondition: 'streak-30', description: '30일 연속 학습' },

  // Achievement vehicles
  { id: 'sticker-sports-soccer', name: '전투기', theme: 'special-vehicles', category: 'special', unlockCondition: 'stars-200', description: '별 200개 획득' },
  { id: 'sticker-sports-medal', name: '우주왕복선', theme: 'special-vehicles', category: 'special', unlockCondition: 'level-10', description: '레벨 10 달성' },
];

export function getStickerById(id: string): StickerInfo | undefined {
  return STICKERS.find((s) => s.id === id);
}

export function getStickersByCategory(category: StickerInfo['category']): StickerInfo[] {
  return STICKERS.filter((s) => s.category === category);
}
