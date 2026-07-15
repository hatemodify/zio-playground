/**
 * SVG line-art coloring pages with separate fillable regions.
 *
 * Each page is drawn on a 0 0 200 200 viewBox. `regions` are the areas a child
 * taps to fill; `details` are the non-fillable overlay lines (eyes, mouths,
 * window frames) painted on top in dark ink.
 *
 * These are original vector line art authored for this project and released as
 * CC0 (public domain) — free to reuse, swap, or extend. Because they are plain
 * SVG paths, dropping in any other open-licensed coloring SVG only means adding
 * another entry here with its region paths.
 */

export type ColoringCategory = 'animals' | 'vehicles' | 'nature' | 'objects';

export interface ColoringRegion {
  id: string;
  label: string;
  d: string;
}

export interface ColoringDetail {
  d: string;
  /** Filled dot (eye/nose) vs. a stroked line (mouth/whisker). */
  filled?: boolean;
}

export interface ColoringPage {
  id: string;
  name: string;
  emoji: string;
  category: ColoringCategory;
  viewBox: string;
  regions: ColoringRegion[];
  details?: ColoringDetail[];
}

export const COLORING_CATEGORIES: { key: ColoringCategory; label: string; emoji: string }[] = [
  { key: 'animals', label: '동물', emoji: '🐾' },
  { key: 'vehicles', label: '탈것', emoji: '🚗' },
  { key: 'nature', label: '자연', emoji: '🌿' },
  { key: 'objects', label: '기타', emoji: '🎈' },
];

const VIEWBOX = '0 0 200 200';

export const COLORING_PAGES: ColoringPage[] = [
  // ── Animals ──────────────────────────────────────────────
  {
    id: 'fish',
    name: '물고기',
    emoji: '🐟',
    category: 'animals',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '몸', d: 'M30 100 C30 72 120 58 148 88 C154 94 154 106 148 112 C120 142 30 128 30 100 Z' },
      { id: 'tail', label: '꼬리', d: 'M146 90 L188 64 L182 100 L188 136 L146 110 Z' },
      { id: 'fin', label: '지느러미', d: 'M78 70 L102 46 L118 76 Z' },
    ],
    details: [
      { d: 'M62 90 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', filled: true },
      { d: 'M50 108 Q62 118 78 110' },
    ],
  },
  {
    id: 'cat',
    name: '고양이',
    emoji: '🐱',
    category: 'animals',
    viewBox: VIEWBOX,
    regions: [
      { id: 'face', label: '얼굴', d: 'M52 104 a48 48 0 1 0 96 0 a48 48 0 1 0 -96 0 Z' },
      { id: 'earL', label: '왼쪽 귀', d: 'M62 70 L50 30 L94 56 Z' },
      { id: 'earR', label: '오른쪽 귀', d: 'M138 70 L150 30 L106 56 Z' },
    ],
    details: [
      { d: 'M82 98 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', filled: true },
      { d: 'M118 98 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', filled: true },
      { d: 'M100 112 L94 120 L106 120 Z', filled: true },
      { d: 'M100 120 Q92 130 82 126 M100 120 Q108 130 118 126' },
      { d: 'M60 108 L38 104 M60 116 L38 118 M140 108 L162 104 M140 116 L162 118' },
    ],
  },
  {
    id: 'butterfly',
    name: '나비',
    emoji: '🦋',
    category: 'animals',
    viewBox: VIEWBOX,
    regions: [
      { id: 'wingUL', label: '왼쪽 위 날개', d: 'M100 100 C62 42 22 52 32 92 C36 112 72 110 100 100 Z' },
      { id: 'wingUR', label: '오른쪽 위 날개', d: 'M100 100 C138 42 178 52 168 92 C164 112 128 110 100 100 Z' },
      { id: 'wingLL', label: '왼쪽 아래 날개', d: 'M100 100 C72 150 34 160 42 122 C48 108 78 104 100 100 Z' },
      { id: 'wingLR', label: '오른쪽 아래 날개', d: 'M100 100 C128 150 166 160 158 122 C152 108 122 104 100 100 Z' },
      { id: 'body', label: '몸', d: 'M100 52 C106 52 106 148 100 152 C94 148 94 52 100 52 Z' },
    ],
    details: [
      { d: 'M100 56 C90 40 82 34 74 32 M100 56 C110 40 118 34 126 32' },
    ],
  },

  // ── Vehicles ─────────────────────────────────────────────
  {
    id: 'car',
    name: '자동차',
    emoji: '🚗',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '차체', d: 'M18 122 L30 96 L62 96 L78 74 L136 74 L152 96 L184 102 L184 122 Z' },
      { id: 'window', label: '창문', d: 'M80 78 L130 78 L144 96 L66 96 Z' },
      { id: 'wheelL', label: '왼쪽 바퀴', d: 'M44 124 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 Z' },
      { id: 'wheelR', label: '오른쪽 바퀴', d: 'M124 124 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 Z' },
    ],
    details: [
      { d: 'M105 78 L105 96' },
    ],
  },
  {
    id: 'rocket',
    name: '로켓',
    emoji: '🚀',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '몸체', d: 'M100 28 C122 54 124 112 116 142 L84 142 C76 112 78 54 100 28 Z' },
      { id: 'finL', label: '왼쪽 날개', d: 'M85 118 L58 162 L85 146 Z' },
      { id: 'finR', label: '오른쪽 날개', d: 'M115 118 L142 162 L115 146 Z' },
      { id: 'window', label: '창문', d: 'M85 76 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
      { id: 'flame', label: '불꽃', d: 'M86 144 Q100 190 114 144 Q100 160 86 144 Z' },
    ],
  },
  {
    id: 'boat',
    name: '배',
    emoji: '⛵',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'hull', label: '배', d: 'M32 122 L168 122 L146 156 L54 156 Z' },
      { id: 'sailR', label: '큰 돛', d: 'M102 30 L102 114 L154 114 Z' },
      { id: 'sailL', label: '작은 돛', d: 'M94 48 L94 114 L54 114 Z' },
    ],
    details: [
      { d: 'M100 24 L100 122' },
    ],
  },

  // ── Vehicles: cars & heavy equipment ─────────────────────
  {
    id: 'fire-truck',
    name: '소방차',
    emoji: '🚒',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '차체', d: 'M12 138 L12 92 L118 92 L118 138 Z' },
      { id: 'cab', label: '운전석', d: 'M118 138 L118 104 L150 104 L168 128 L168 138 Z' },
      { id: 'ladder', label: '사다리', d: 'M16 90 L18 80 L114 60 L116 70 Z' },
      { id: 'window', label: '창문', d: 'M124 108 L146 108 L146 124 L124 124 Z' },
      { id: 'wheelL', label: '왼쪽 바퀴', d: 'M33 142 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
      { id: 'wheelR', label: '오른쪽 바퀴', d: 'M123 142 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
    ],
    details: [
      { d: 'M32 78 L36 88 M47 75 L51 85 M62 72 L66 82 M77 69 L81 79 M92 66 L96 76' },
    ],
  },
  {
    id: 'excavator',
    name: '굴착기',
    emoji: '🚜',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'track', label: '바퀴', d: 'M18 168 L18 148 Q18 140 28 140 L118 140 Q128 140 128 148 L128 168 Q128 174 118 174 L28 174 Q18 174 18 168 Z' },
      { id: 'cab', label: '운전실', d: 'M44 140 L44 98 L100 98 L100 140 Z' },
      { id: 'arm', label: '팔', d: 'M98 122 L140 88 L152 98 L112 134 Z' },
      { id: 'bucket', label: '삽', d: 'M138 86 L166 80 L172 100 L150 108 Z' },
      { id: 'window', label: '창문', d: 'M51 104 L74 104 L74 126 L51 126 Z' },
    ],
    details: [
      { d: 'M40 157 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M90 157 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0' },
    ],
  },
  {
    id: 'bulldozer',
    name: '불도저',
    emoji: '🚜',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'track', label: '바퀴', d: 'M32 168 L32 148 Q32 140 42 140 L120 140 Q130 140 130 148 L130 168 Q130 174 120 174 L42 174 Q32 174 32 168 Z' },
      { id: 'body', label: '몸체', d: 'M56 140 L56 104 L120 104 L120 140 Z' },
      { id: 'cab', label: '운전실', d: 'M72 104 L72 80 L110 80 L110 104 Z' },
      { id: 'blade', label: '삽날', d: 'M16 172 L16 118 L34 118 L34 172 Z' },
    ],
    details: [
      { d: 'M34 150 L56 132' },
    ],
  },
  {
    id: 'dump-truck',
    name: '덤프트럭',
    emoji: '🚛',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'bed', label: '짐칸', d: 'M74 120 L182 120 L172 76 L96 90 Z' },
      { id: 'cab', label: '운전석', d: 'M30 120 L30 86 L70 86 L70 120 Z' },
      { id: 'chassis', label: '차대', d: 'M20 120 L182 120 L182 132 L20 132 Z' },
      { id: 'window', label: '창문', d: 'M37 92 L60 92 L60 112 L37 112 Z' },
      { id: 'wheelF', label: '앞 바퀴', d: 'M36 135 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
      { id: 'wheelB', label: '뒤 바퀴', d: 'M134 135 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
    ],
  },
  {
    id: 'crane',
    name: '크레인',
    emoji: '🏗️',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '차체', d: 'M14 140 L14 108 L112 108 L112 140 Z' },
      { id: 'cab', label: '운전석', d: 'M18 108 L18 88 L52 88 L52 108 Z' },
      { id: 'arm', label: '팔', d: 'M60 114 L150 40 L160 50 L70 124 Z' },
      { id: 'wheelL', label: '왼쪽 바퀴', d: 'M26 144 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
      { id: 'wheelR', label: '오른쪽 바퀴', d: 'M76 144 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
    ],
    details: [
      { d: 'M150 46 L150 70 M144 70 L156 70 L153 80 L147 80 Z' },
    ],
  },
  {
    id: 'cement-mixer',
    name: '레미콘',
    emoji: '🚚',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'drum', label: '통', d: 'M70 118 C70 94 96 82 122 82 C152 82 174 96 174 112 C174 122 150 130 122 130 C96 130 70 128 70 118 Z' },
      { id: 'cab', label: '운전석', d: 'M24 130 L24 90 L64 90 L64 130 Z' },
      { id: 'chassis', label: '차대', d: 'M16 130 L180 130 L180 142 L16 142 Z' },
      { id: 'window', label: '창문', d: 'M31 96 L56 96 L56 116 L31 116 Z' },
      { id: 'wheelF', label: '앞 바퀴', d: 'M33 145 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z' },
      { id: 'wheelB', label: '뒤 바퀴', d: 'M137 145 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z' },
    ],
  },
  {
    id: 'forklift',
    name: '지게차',
    emoji: '🚜',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '몸체', d: 'M50 146 L50 100 L112 100 L112 146 Z' },
      { id: 'cab', label: '지붕', d: 'M52 100 L52 58 L60 58 L60 100 Z M104 100 L104 58 L112 58 L112 100 Z M52 58 L112 58 L112 68 L52 68 Z' },
      { id: 'mast', label: '기둥', d: 'M30 42 L44 42 L44 150 L30 150 Z' },
      { id: 'fork', label: '포크', d: 'M12 148 L44 148 L44 160 L12 160 Z' },
      { id: 'wheelF', label: '앞 바퀴', d: 'M53 150 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z' },
      { id: 'wheelB', label: '뒤 바퀴', d: 'M87 150 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z' },
    ],
  },
  {
    id: 'police-car',
    name: '경찰차',
    emoji: '🚓',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '차체', d: 'M14 138 L28 112 L60 112 L78 92 L134 92 L152 112 L184 116 L184 138 Z' },
      { id: 'window', label: '창문', d: 'M82 96 L128 96 L142 112 L66 112 Z' },
      { id: 'light', label: '경광등', d: 'M88 82 L118 82 L118 92 L88 92 Z' },
      { id: 'wheelL', label: '왼쪽 바퀴', d: 'M37 141 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
      { id: 'wheelR', label: '오른쪽 바퀴', d: 'M127 141 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
    ],
  },
  {
    id: 'ambulance',
    name: '구급차',
    emoji: '🚑',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '차체', d: 'M60 136 L60 76 L166 76 L166 136 Z' },
      { id: 'cab', label: '운전석', d: 'M20 136 L20 98 L60 98 L60 136 Z' },
      { id: 'cross', label: '십자 표시', d: 'M104 86 L122 86 L122 100 L136 100 L136 118 L122 118 L122 132 L104 132 L104 118 L90 118 L90 100 L104 100 Z' },
      { id: 'window', label: '창문', d: 'M27 104 L54 104 L54 122 L27 122 Z' },
      { id: 'wheelF', label: '앞 바퀴', d: 'M28 140 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
      { id: 'wheelB', label: '뒤 바퀴', d: 'M121 140 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
    ],
  },
  {
    id: 'bus',
    name: '버스',
    emoji: '🚌',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '차체', d: 'M14 140 L14 76 Q14 68 22 68 L178 68 Q186 68 186 76 L186 140 Z' },
      { id: 'windows', label: '창문', d: 'M28 82 L52 82 L52 102 L28 102 Z M60 82 L84 82 L84 102 L60 102 Z M92 82 L116 82 L116 102 L92 102 Z M124 82 L148 82 L148 102 L124 102 Z' },
      { id: 'door', label: '문', d: 'M156 104 L178 104 L178 138 L156 138 Z' },
      { id: 'wheelL', label: '왼쪽 바퀴', d: 'M37 143 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
      { id: 'wheelR', label: '오른쪽 바퀴', d: 'M135 143 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
    ],
  },
  {
    id: 'tractor',
    name: '트랙터',
    emoji: '🚜',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '몸체', d: 'M58 132 L58 96 L118 96 L118 132 Z' },
      { id: 'cab', label: '운전실', d: 'M84 96 L84 66 L118 66 L118 96 Z' },
      { id: 'window', label: '창문', d: 'M91 72 L112 72 L112 92 L91 92 Z' },
      { id: 'wheelSmall', label: '앞 바퀴', d: 'M34 142 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z' },
      { id: 'wheelBig', label: '뒤 바퀴', d: 'M103 128 a32 32 0 1 0 64 0 a32 32 0 1 0 -64 0 Z' },
    ],
  },
  {
    id: 'helicopter',
    name: '헬리콥터',
    emoji: '🚁',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '몸체', d: 'M42 132 C42 102 82 92 122 102 C142 107 152 120 152 130 C152 137 120 140 82 140 C56 140 42 140 42 132 Z' },
      { id: 'cockpit', label: '조종석', d: 'M50 120 C52 106 74 102 92 106 L92 130 L54 130 C50 130 48 126 50 120 Z' },
      { id: 'tail', label: '꼬리', d: 'M150 118 L194 108 L194 118 L156 128 Z' },
      { id: 'rotor', label: '날개', d: 'M28 74 L172 74 L172 82 L28 82 Z' },
    ],
    details: [
      { d: 'M100 82 L100 100 M60 140 L60 152 L150 152 M70 152 L140 152' },
    ],
  },
  {
    id: 'tank',
    name: '탱크',
    emoji: '🪖',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'track', label: '바퀴', d: 'M18 158 Q18 138 40 138 L150 138 Q172 138 172 158 Q172 176 150 176 L40 176 Q18 176 18 158 Z' },
      { id: 'body', label: '몸체', d: 'M34 138 L46 116 L150 116 L162 138 Z' },
      { id: 'turret', label: '포탑', d: 'M74 116 L74 96 L126 96 L126 116 Z' },
      { id: 'cannon', label: '포신', d: 'M126 102 L188 98 L188 108 L126 112 Z' },
    ],
    details: [
      { d: 'M40 157 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M75 157 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M110 157 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M145 157 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0' },
    ],
  },
  {
    id: 'race-car',
    name: '경주용차',
    emoji: '🏎️',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '차체', d: 'M14 136 L38 120 L70 112 L96 100 L132 100 L152 114 L186 120 L186 136 Z' },
      { id: 'cockpit', label: '좌석', d: 'M96 100 L120 100 L126 114 L100 114 Z' },
      { id: 'spoiler', label: '날개', d: 'M168 90 L188 90 L188 100 L168 100 Z' },
      { id: 'wheelL', label: '왼쪽 바퀴', d: 'M36 139 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 Z' },
      { id: 'wheelR', label: '오른쪽 바퀴', d: 'M134 139 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 Z' },
    ],
  },
  {
    id: 'train',
    name: '기차',
    emoji: '🚂',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '몸체', d: 'M20 138 L20 90 L120 90 L120 138 Z' },
      { id: 'cabin', label: '운전실', d: 'M120 138 L120 74 L166 74 L166 138 Z' },
      { id: 'funnel', label: '굴뚝', d: 'M35 90 L35 64 L55 64 L55 90 Z' },
      { id: 'window', label: '창문', d: 'M128 82 L158 82 L158 108 L128 108 Z' },
      { id: 'wheelL', label: '왼쪽 바퀴', d: 'M31 144 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
      { id: 'wheelM', label: '가운데 바퀴', d: 'M76 144 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
      { id: 'wheelR', label: '오른쪽 바퀴', d: 'M131 144 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z' },
    ],
  },
  {
    id: 'airplane',
    name: '비행기',
    emoji: '✈️',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'fuselage', label: '몸체', d: 'M20 100 C20 90 30 86 45 86 L150 86 L186 100 L150 114 L45 114 C30 114 20 110 20 100 Z' },
      { id: 'wing', label: '날개', d: 'M78 100 L110 142 L128 142 L108 100 Z M78 100 L110 58 L128 58 L108 100 Z' },
      { id: 'tail', label: '꼬리날개', d: 'M20 100 L32 66 L48 66 L44 92 Z' },
    ],
    details: [
      { d: 'M58 96 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M78 96 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M98 96 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0', filled: true },
    ],
  },
  {
    id: 'motorcycle',
    name: '오토바이',
    emoji: '🏍️',
    category: 'vehicles',
    viewBox: VIEWBOX,
    regions: [
      { id: 'body', label: '몸체', d: 'M48 135 L78 100 L120 100 L138 118 L152 135 Z' },
      { id: 'seat', label: '안장', d: 'M104 100 L150 100 L150 110 L112 112 Z' },
      { id: 'wheelFront', label: '앞 바퀴', d: 'M24 135 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 Z' },
      { id: 'wheelBack', label: '뒤 바퀴', d: 'M128 135 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 Z' },
    ],
    details: [
      { d: 'M78 100 L70 84 M62 84 L84 84' },
    ],
  },

  // ── Nature ───────────────────────────────────────────────
  {
    id: 'flower',
    name: '꽃',
    emoji: '🌸',
    category: 'nature',
    viewBox: VIEWBOX,
    regions: [
      {
        id: 'petals',
        label: '꽃잎',
        d: 'M80 55 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 '
          + 'M108 78 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 '
          + 'M97 112 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 '
          + 'M63 112 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 '
          + 'M52 78 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 Z',
      },
      { id: 'center', label: '가운데', d: 'M84 88 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 Z' },
      { id: 'stem', label: '줄기', d: 'M96 120 L96 178 L104 178 L104 120 Z' },
      { id: 'leaf', label: '잎', d: 'M102 148 C134 130 146 158 106 158 Z' },
    ],
  },
  {
    id: 'tree',
    name: '나무',
    emoji: '🌳',
    category: 'nature',
    viewBox: VIEWBOX,
    regions: [
      { id: 'leaves', label: '잎', d: 'M100 22 C54 28 44 84 76 96 C50 112 72 144 100 130 C128 144 152 112 124 96 C156 84 146 28 100 22 Z' },
      { id: 'trunk', label: '줄기', d: 'M88 122 L88 176 L112 176 L112 122 Z' },
    ],
  },
  {
    id: 'star',
    name: '별',
    emoji: '⭐',
    category: 'nature',
    viewBox: VIEWBOX,
    regions: [
      { id: 'star', label: '별', d: 'M100 22 L120 76 L178 78 L132 114 L148 170 L100 136 L52 170 L68 114 L22 78 L80 76 Z' },
    ],
  },

  // ── Objects ──────────────────────────────────────────────
  {
    id: 'house',
    name: '집',
    emoji: '🏠',
    category: 'objects',
    viewBox: VIEWBOX,
    regions: [
      { id: 'wall', label: '벽', d: 'M42 92 L158 92 L158 166 L42 166 Z' },
      { id: 'roof', label: '지붕', d: 'M30 94 L100 40 L170 94 Z' },
      { id: 'door', label: '문', d: 'M86 166 L86 122 L114 122 L114 166 Z' },
      { id: 'window', label: '창문', d: 'M56 106 L82 106 L82 132 L56 132 Z' },
    ],
    details: [
      { d: 'M69 106 L69 132 M56 119 L82 119' },
    ],
  },
  {
    id: 'heart',
    name: '하트',
    emoji: '❤️',
    category: 'objects',
    viewBox: VIEWBOX,
    regions: [
      { id: 'heart', label: '하트', d: 'M100 166 C40 122 30 72 60 56 C84 43 98 64 100 72 C102 64 116 43 140 56 C170 72 160 122 100 166 Z' },
    ],
  },
  {
    id: 'icecream',
    name: '아이스크림',
    emoji: '🍦',
    category: 'objects',
    viewBox: VIEWBOX,
    regions: [
      { id: 'cone', label: '콘', d: 'M74 108 L126 108 L100 178 Z' },
      { id: 'scoopBottom', label: '아래 아이스크림', d: 'M70 96 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0 Z' },
      { id: 'scoopTop', label: '위 아이스크림', d: 'M74 64 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 Z' },
    ],
    details: [
      { d: 'M84 108 L90 96 M100 108 L100 94 M116 108 L110 96' },
    ],
  },
];

export function pagesByCategory(category: ColoringCategory): ColoringPage[] {
  return COLORING_PAGES.filter((p) => p.category === category);
}
