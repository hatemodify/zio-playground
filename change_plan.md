# 변경 계획서 (Change Plan)

> **프로젝트**: KidsEdu (키즈에듀)
> **경로**: `/Users/jaehyuc/git/edu/aa/git/zio-edu`
> **작성일**: 2026-03-18
> **기반**: analysis.json 분석 결과 + 사용자 수정 요청 4건
> **이전 상태**: React 19 + Vite 6 + Tailwind 4 PWA, 85개 소스 파일, 23개 게임, 35개 스티커

---

## 1. 변경 요약

| # | 요청 | 우선순위 | 복잡도 | 영향 파일 수 |
|---|------|----------|--------|-------------|
| A | 소리 듣기(TTS)가 안 됨 → 소리가 나오도록 수정 | P0 (CRITICAL) | HIGH | 4 수정 |
| B | 두더지 잡기 게임 무반응 → 정상 동작하도록 수정 | P0 (CRITICAL) | MEDIUM | 1 수정 |
| C | 게임 완료 시 스티커 보상 부여 | P1 | MEDIUM-HIGH | 3 수정 |
| D | 색칠하기에 스케치 그림 지원 (숫자/글자 외) | P1 | HIGH | 2 수정 + 1 신규 |

**총 영향**: 수정 ~8개 파일 + 신규 1개 파일 = **~9개 파일**

---

## 2. 상세 변경 계획

### 2.1 [P0-CRITICAL] 소리 듣기(TTS) 무음 수정 (A)

#### 2.1.1 근본 원인 분석 (4가지 문제)

**문제 1 — iOS Safari TTS unlock 실패**

`AppLayout.tsx:64`에서 빈 문자열 `''`로 TTS unlock 시도:

```typescript
const utterance = new SpeechSynthesisUtterance('');
utterance.volume = 0;
window.speechSynthesis.speak(utterance);
```

빈 문자열 utterance는 iOS Safari 일부 버전에서 TTS 세션을 제대로 활성화하지 못함.
또한 `soundManager.unlock()`은 `ctx.resume()`만 호출하고 실제 오디오 버퍼를 재생하지 않아 AudioContext가 완전히 unlock되지 않을 수 있음.

**문제 2 — 자동 TTS가 사용자 제스처 없이 호출**

`QuizGamePage.tsx:81-86`:
```typescript
useEffect(() => {
  if (gameState === 'playing' && questions[currentQ] && isCorrect === null) {
    const q = questions[currentQ];
    setTimeout(() => speak(q.ttsText, q.ttsLang), 300);
  }
}, [currentQ, gameState, questions, speak, isCorrect]);
```

`setTimeout` 내에서 `speak()` 호출 시 사용자 제스처 컨텍스트가 소실됨.
동일 패턴이 `BalloonGamePage.tsx:81`과 `SpeakGamePage.tsx:76`에도 존재.

**문제 3 — speak() 내 cancel→speak 타이밍 이슈**

`use-tts.ts:60`:
```typescript
window.speechSynthesis.cancel();
// 바로 다음 줄에서 voice 조회 → utterance 생성 → speak()
```

`cancel()` 호출 직후 동기적으로 `speak()`을 호출하면 일부 브라우저에서 취소 처리가 완료되지 않아 새 utterance도 무시될 수 있음.

**문제 4 — voice 미로드 시 무음**

`tts-utils.ts:27-41`의 `getBestVoice()`가 동기적으로 `getVoices()` 호출.
첫 로드 시 voices가 빈 배열 → `null` 반환. `use-tts.ts:62-66`에서 voice가 null이면 `getAvailableVoices()` 후 재시도하지만, `voiceschanged` 이벤트가 발생하지 않는 환경에서는 3초 타임아웃 후 여전히 `null`. voice가 `null`인 utterance는 일부 브라우저에서 무음.

#### 2.1.2 수정 방법

**Fix 1 — AppLayout iOS unlock 개선** (`src/components/ui/AppLayout.tsx:56-83`)

```typescript
// Before
const utterance = new SpeechSynthesisUtterance('');

// After — 공백 문자 사용 + 무음 AudioContext 버퍼 재생
const utterance = new SpeechSynthesisUtterance(' ');

// soundManager.unlock() 내부에서도 무음 버퍼 실제 재생
```

`sound-manager.ts`의 `unlock()` 메서드도 개선하여 `ctx.resume()` 후 짧은 무음 버퍼(0.01초, gain 0)를 실제로 재생:

```typescript
// Before (sound-manager.ts:87-94)
unlock(): void {
  if (this.unlocked) return;
  const ctx = this.getContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  this.unlocked = true;
}

// After
unlock(): void {
  if (this.unlocked) return;
  const ctx = this.getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  // 무음 버퍼 재생으로 완전 unlock
  try {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch { /* ignore */ }
  this.unlocked = true;
}
```

**Fix 2 — speak() cancel 후 딜레이 추가** (`src/hooks/use-tts.ts:58-91`)

```typescript
// Before
window.speechSynthesis.cancel();
// 즉시 voice 조회 및 speak()

// After
window.speechSynthesis.cancel();
await new Promise<void>(r => setTimeout(r, 50)); // cancel 완료 대기
// voice 조회 및 speak()
```

**Fix 3 — voice null 시 utterance.lang으로 fallback 보장** (`src/hooks/use-tts.ts:69-74`)

```typescript
// Before
const utterance = createUtterance(text, lang, { rate: ttsSpeed, pitch: 1.1, volume, voice });

// After — voice가 null이어도 lang이 설정되어 있으면 브라우저 기본 voice 사용
const utterance = createUtterance(text, lang, { rate: ttsSpeed, pitch: 1.1, volume, voice });
// utterance.lang은 createUtterance에서 이미 설정됨 → 추가 처리 불필요
// 다만 voice가 null인 경우를 명시적으로 허용하고 console.warn 제거
```

**Fix 4 — QuizGamePage TTS 자동재생 방식 개선** (`src/pages/QuizGamePage.tsx:80-86`)

게임 페이지 로드 시 첫 문제 TTS가 자동 재생되어야 하지만, 사용자 제스처 없이는 동작하지 않는 문제.
사용자가 앱을 이미 터치(AppLayout unlock)한 이후이므로 TTS는 일반적으로 동작하지만, 안정성을 높이기 위해:

1. 스피커 버튼에 펄스 애니메이션을 추가하여 사용자가 탭하도록 유도
2. `setTimeout` 대신 직접 `speak()` 호출 (300ms 딜레이 제거로 제스처 컨텍스트 최대한 보존)
3. 그래도 자동 TTS가 실패하면 스피커 버튼이 빛나며 "터치해서 들어봐!" 안내

```typescript
// Before
useEffect(() => {
  if (gameState === 'playing' && questions[currentQ] && isCorrect === null) {
    const q = questions[currentQ];
    setTimeout(() => speak(q.ttsText, q.ttsLang), 300);
  }
}, [currentQ, gameState, questions, speak, isCorrect]);

// After
const [ttsAutoFailed, setTtsAutoFailed] = useState(false);

useEffect(() => {
  if (gameState === 'playing' && questions[currentQ] && isCorrect === null) {
    const q = questions[currentQ];
    speak(q.ttsText, q.ttsLang).catch(() => setTtsAutoFailed(true));
  }
}, [currentQ, gameState, questions, speak, isCorrect]);
```

BalloonGamePage.tsx (line 81)와 SpeakGamePage.tsx (line 76)에도 동일 패턴 적용.

#### 2.1.3 변경 파일 목록

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `src/components/ui/AppLayout.tsx` | TTS unlock: `''` → `' '` (공백 문자 사용) |
| 2 | `src/lib/sound-manager.ts` | `unlock()`: 무음 버퍼 실제 재생으로 완전 unlock |
| 3 | `src/hooks/use-tts.ts` | `speak()`: cancel 후 50ms 딜레이, voice null fallback 개선 |
| 4 | `src/pages/QuizGamePage.tsx` | TTS 자동재생: setTimeout 제거, 실패 시 UX 가이드 |

**참고**: BalloonGamePage, SpeakGamePage의 TTS 패턴도 동일 방식으로 개선하나, 핵심 로직은 `use-tts.ts`에서 처리되므로 게임 페이지별 변경은 최소화.

---

### 2.2 [P0-CRITICAL] 두더지 잡기 게임 무반응 수정 (B)

#### 2.2.1 근본 원인 분석

**핵심 버그 — spawnMole의 stale closure**

`WhackAMoleGamePage.tsx:43-63`:

```typescript
const spawnMole = useCallback(() => {
  if (gameState !== 'playing') return;  // ← gameState는 'ready' 시점의 클로저
  // ... 두더지 생성 로직
  spawnRef.current = setTimeout(spawnMole, nextDelay);  // ← 재귀 호출도 stale
}, [gameState]);
```

`startGame()` (line 65-85)에서:
1. `start(30)` 호출 → `useGameLogic` 내부에서 `setState('playing')` (비동기 상태 업데이트)
2. `setTimeout(spawnMole, 500)` 호출 → 이 시점의 `spawnMole`은 `gameState === 'ready'`를 캡처
3. 500ms 후 `spawnMole` 실행 → `if (gameState !== 'playing') return;`에서 `'ready' !== 'playing'`이므로 즉시 반환
4. 두더지가 한 마리도 생성되지 않음 → 게임이 완전히 무반응

또한 재귀적 `setTimeout(spawnMole, nextDelay)` (line 62)도 같은 stale 참조를 사용하여, 설령 첫 호출이 성공하더라도 이후 체인이 끊어질 수 있음.

#### 2.2.2 수정 방법

`useRef`로 gameState를 추적하여 stale closure 문제 해결:

```typescript
// 추가
const gameStateRef = useRef(gameState);
useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

// spawnMole 수정
const spawnMole = useCallback(() => {
  if (gameStateRef.current !== 'playing') return;  // ← ref 사용

  const id = ++moleIdRef.current;
  const holeIndex = Math.floor(Math.random() * HOLE_COUNT);
  const isBomb = Math.random() < 0.15;
  const emoji = isBomb ? BOMB : VEHICLE_EMOJIS[Math.floor(Math.random() * VEHICLE_EMOJIS.length)];

  const mole: MoleState = { holeIndex, emoji, isBomb, id };
  setActiveMoles((prev) => [...prev.filter((m) => m.holeIndex !== holeIndex), mole]);

  // Auto-hide
  const hideDelay = 800 + Math.random() * 700;
  setTimeout(() => {
    setActiveMoles((prev) => prev.filter((m) => m.id !== id));
  }, hideDelay);

  // Schedule next spawn — spawnMoleRef 사용으로 최신 함수 참조
  const nextDelay = 400 + Math.random() * 600;
  spawnRef.current = setTimeout(() => spawnMole(), nextDelay);
}, []);  // ← 의존성에서 gameState 제거

// startGame에서도 spawnMole 대신 직접 호출
const startGame = useCallback(() => {
  setTimeLeft(GAME_DURATION);
  setActiveMoles([]);
  setWhackedIds(new Set());
  moleIdRef.current = 0;
  start(30);

  timerRef.current = setInterval(/* ... */);

  // gameStateRef.current는 start() 호출 후 바로 'playing'으로 업데이트됨
  // useEffect에서 동기화하므로 setTimeout으로 약간 지연
  setTimeout(() => spawnMole(), 500);
}, [start, spawnMole, clearTimers]);
```

**추가 수정**: `gameState`가 `useEffect`로 동기화되기 전에 `spawnMole`이 호출될 수 있으므로, `startGame`에서 `gameStateRef.current = 'playing'`을 명시적으로 설정:

```typescript
const startGame = useCallback(() => {
  // ... reset
  start(30);
  gameStateRef.current = 'playing';  // ← 즉시 ref 업데이트
  // ... timer + spawn
}, [start, spawnMole, clearTimers]);
```

#### 2.2.3 변경 파일 목록

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `src/pages/WhackAMoleGamePage.tsx` | gameStateRef 추가, spawnMole에서 ref 사용, startGame에서 ref 즉시 업데이트 |

---

### 2.3 [P1] 게임 완료 시 스티커 보상 연결 (C)

#### 2.3.1 현재 상태

- `gamification-store.ts:114-118`에 `addSticker(stickerId)` 액션 존재
- `stickers.ts`에 35개 스티커 정의 — unlockCondition 포함:
  - 게임 관련: `first-game-clear`, `all-games-played`, `games-5-clear`, `games-10-clear`
  - 별 관련: `stars-30`, `stars-50`, `stars-100`, `stars-200`
  - 레벨 관련: `level-3`, `level-4`, `level-5`, `level-7`, `level-10`
  - 스트릭 관련: `streak-3`, `streak-7`, `streak-14`, `streak-30`
  - 학습 관련: `numbers-*-complete`, `hangul-*-complete`, `english-*-complete`
- **`addSticker()`를 호출하는 코드가 프로젝트 어디에도 없음** — 스티커가 절대 부여되지 않음
- 모든 게임 페이지는 동일 패턴: `RewardCelebration.onDismiss` → `recordGameScore()` 호출

#### 2.3.2 수정 방법

**Step 1 — gamification-store에 `checkAndGrantStickers` 액션 추가**

`gamification-store.ts`에 스티커 조건 체크 함수를 추가:

```typescript
checkAndGrantStickers: () => {
  const state = get();
  const { totalStars, level, streak, gameRecords, stickers } = state;
  const newStickers: string[] = [];

  // 유니크 게임 종류 계산
  const uniqueGames = new Set(gameRecords.map(r => r.gameId));

  // 게임 관련 스티커
  if (gameRecords.length >= 1 && !stickers.includes('sticker-special-firstgame')) {
    newStickers.push('sticker-special-firstgame');
  }
  if (uniqueGames.size >= 5 && !stickers.includes('sticker-ocean-dolphin')) {
    newStickers.push('sticker-ocean-dolphin');
  }
  if (uniqueGames.size >= 10 && !stickers.includes('sticker-music-guitar')) {
    newStickers.push('sticker-music-guitar');
  }
  // 모든 게임 플레이 (23종)
  if (uniqueGames.size >= 23 && !stickers.includes('sticker-special-allgames')) {
    newStickers.push('sticker-special-allgames');
  }

  // 별 관련 스티커
  if (totalStars >= 30 && !stickers.includes('sticker-ocean-whale')) {
    newStickers.push('sticker-ocean-whale');
  }
  if (totalStars >= 50 && !stickers.includes('sticker-space-ufo')) {
    newStickers.push('sticker-space-ufo');
  }
  if (totalStars >= 100 && !stickers.includes('sticker-dino-tricera')) {
    newStickers.push('sticker-dino-tricera');
  }
  if (totalStars >= 200 && !stickers.includes('sticker-sports-soccer')) {
    newStickers.push('sticker-sports-soccer');
  }

  // 레벨 관련 스티커
  const levelStickerMap: Record<number, string> = {
    3: 'sticker-space-rocket',
    4: 'sticker-music-drum',
    5: 'sticker-space-astronaut',
    7: 'sticker-dino-trex',
    10: 'sticker-sports-medal',
  };
  for (const [lvl, id] of Object.entries(levelStickerMap)) {
    if (level >= Number(lvl) && !stickers.includes(id)) {
      newStickers.push(id);
    }
  }

  // 스트릭 관련 스티커
  const streakStickerMap: Record<number, string> = {
    3: 'sticker-special-streak3',
    7: 'sticker-special-streak7',
    14: 'sticker-ocean-octopus',
    30: 'sticker-music-piano',
  };
  for (const [days, id] of Object.entries(streakStickerMap)) {
    if (streak >= Number(days) && !stickers.includes(id)) {
      newStickers.push(id);
    }
  }

  // 새로운 스티커가 있으면 일괄 추가
  if (newStickers.length > 0) {
    set((s) => ({
      stickers: [...s.stickers, ...newStickers],
    }));
  }

  return newStickers; // 새로 획득한 스티커 ID 목록 반환
},
```

**Step 2 — useGameLogic의 finish()에서 자동 호출**

`use-game-logic.ts:51-70`의 `finish()` 함수에서 `addStars()` 호출 직후 `checkAndGrantStickers()` 호출:

```typescript
// Before (use-game-logic.ts:51-70)
const finish = useCallback(
  (finalScore?: number) => {
    const stars = calculateStars(actualScore);
    setState('success');
    addStars(stars);
    play('level_up');
    options?.onComplete?.(stars);
    setTimeout(() => setState('reward'), 1500);
  },
  [score, calculateStars, addStars, play, options],
);

// After
const { addStars, checkAndGrantStickers } = useGamificationStore();

const finish = useCallback(
  (finalScore?: number) => {
    const actualScore = finalScore ?? score;
    const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    setElapsed(duration);

    const stars = calculateStars(actualScore);
    setState('success');
    addStars(stars);
    play('level_up');

    // 스티커 조건 체크 — addStars 이후 호출하여 최신 totalStars 반영
    const newStickers = checkAndGrantStickers();

    options?.onComplete?.(stars);
    setTimeout(() => setState('reward'), 1500);
  },
  [score, calculateStars, addStars, checkAndGrantStickers, play, options],
);
```

**Step 3 — RewardCelebration에 스티커 획득 표시 (선택적 개선)**

새로 획득한 스티커가 있으면 RewardCelebration에 스티커 아이콘을 추가 표시.
이를 위해 `useGameLogic`에서 `newStickers` 상태를 노출:

```typescript
const [earnedStickers, setEarnedStickers] = useState<string[]>([]);

// finish() 내부에서
const newStickers = checkAndGrantStickers();
setEarnedStickers(newStickers);
```

`RewardCelebration` props에 `newStickers?: string[]` 추가:
- 스티커가 있으면 별 아래에 "새 스티커 획득!" + 스티커 이름 표시

#### 2.3.3 학습 완료 스티커는 별도 처리

학습 관련 스티커 (`numbers-*-complete`, `hangul-*-complete`, `english-*-complete`)는 학습 페이지의 진행도 추적과 연동해야 하므로, 이번 수정 범위에서는 **게임 완료 관련 스티커만** 처리.
학습 완료 스티커는 `progress-store`의 상태를 체크해야 하며, `checkAndGrantStickers`에서 해당 로직을 추가할 수 있으나 별도 이슈로 분리 가능.

#### 2.3.4 변경 파일 목록

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `src/stores/gamification-store.ts` | `checkAndGrantStickers()` 액션 추가 — 게임/별/레벨/스트릭 조건 체크 |
| 2 | `src/hooks/use-game-logic.ts` | `finish()`에서 `checkAndGrantStickers()` 호출, `earnedStickers` 상태 노출 |
| 3 | `src/components/features/RewardCelebration.tsx` | `newStickers` prop 추가, 새 스티커 획득 시 표시 UI |

---

### 2.4 [P1] 색칠하기 스케치 그림 지원 (D)

#### 2.4.1 현재 상태

`ColoringGamePage.tsx`:
- 숫자/한글/영어 카테고리 탭으로 랜덤 글자를 선택 (line 197-211)
- `drawCharacterOutline()` (line 49-59): `ctx.fillText(char)` 로 글자 윤곽선 표시 (opacity 0.15)
- 300x300px 캔버스, 8색 팔레트
- 면적 8% 이상 색칠 시 완료

#### 2.4.2 수정 방법

**Step 1 — 스케치 그림 데이터 파일 생성** (`src/data/sketches.ts` 신규)

최소 20종의 간단한 스케치 그림을 Canvas 2D 드로잉 함수로 정의.
SVG path 방식 대신, **Canvas 2D API 직접 드로잉 함수** 방식 사용 (기존 프로젝트 패턴과 일관됨):

```typescript
export type SketchCategory = 'animals' | 'vehicles' | 'nature' | 'objects';

export interface SketchData {
  id: string;
  name: string;
  category: SketchCategory;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}

export const SKETCHES: SketchData[] = [
  // 동물 (7종)
  { id: 'sketch-dog', name: '강아지', category: 'animals', draw: drawDog },
  { id: 'sketch-cat', name: '고양이', category: 'animals', draw: drawCat },
  { id: 'sketch-rabbit', name: '토끼', category: 'animals', draw: drawRabbit },
  { id: 'sketch-bear', name: '곰', category: 'animals', draw: drawBear },
  { id: 'sketch-fish', name: '물고기', category: 'animals', draw: drawFish },
  { id: 'sketch-bird', name: '새', category: 'animals', draw: drawBird },
  { id: 'sketch-butterfly', name: '나비', category: 'animals', draw: drawButterfly },

  // 탈것 (5종)
  { id: 'sketch-car', name: '자동차', category: 'vehicles', draw: drawCar },
  { id: 'sketch-airplane', name: '비행기', category: 'vehicles', draw: drawAirplane },
  { id: 'sketch-boat', name: '배', category: 'vehicles', draw: drawBoat },
  { id: 'sketch-rocket', name: '로켓', category: 'vehicles', draw: drawRocket },
  { id: 'sketch-train', name: '기차', category: 'vehicles', draw: drawTrain },

  // 자연 (5종)
  { id: 'sketch-flower', name: '꽃', category: 'nature', draw: drawFlower },
  { id: 'sketch-tree', name: '나무', category: 'nature', draw: drawTree },
  { id: 'sketch-sun', name: '태양', category: 'nature', draw: drawSun },
  { id: 'sketch-rainbow', name: '무지개', category: 'nature', draw: drawRainbow },
  { id: 'sketch-star', name: '별', category: 'nature', draw: drawStar },

  // 기타 (3종)
  { id: 'sketch-heart', name: '하트', category: 'objects', draw: drawHeart },
  { id: 'sketch-house', name: '집', category: 'objects', draw: drawHouse },
  { id: 'sketch-cake', name: '케이크', category: 'objects', draw: drawCake },
];
```

각 `draw` 함수는 Canvas 2D API를 사용하여 간단한 윤곽선 그림을 그림:
- `ctx.strokeStyle` = 연한 회색 (opacity 0.3)
- `ctx.lineWidth` = 2-3px
- `ctx.beginPath()` + `moveTo/lineTo/arc/quadraticCurveTo` + `ctx.stroke()`
- 그림 크기는 `size` 파라미터에 맞춰 스케일링

예시 — `drawHeart`:
```typescript
function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.7);
  ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.2, cx - s * 0.5, cy - s * 1.2, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 1.2, cx + s * 1.5, cy - s * 0.2, cx, cy + s * 0.7);
  ctx.stroke();
}
```

**Step 2 — ColoringGamePage 리팩토링** (`src/pages/ColoringGamePage.tsx`)

기존 카테고리 탭(숫자/한글/영어)을 **스케치 카테고리 탭(동물/탈것/자연/기타)**으로 교체.
캐릭터 기반 그리기를 스케치 기반으로 전환:

```typescript
// 기존 imports 유지 + 추가
import { SKETCHES, type SketchCategory, type SketchData } from '@/data/sketches';

// 상태 변경
const [sketchCategory, setSketchCategory] = useState<SketchCategory>('animals');
const [selectedSketch, setSelectedSketch] = useState<SketchData | null>(null);
const [showPicker, setShowPicker] = useState(true); // 스케치 선택 화면

// 스케치 선택 UI (기존 카테고리 탭 대체)
{showPicker ? (
  <>
    {/* 카테고리 탭 */}
    <div className="flex gap-2">
      {(['animals', 'vehicles', 'nature', 'objects'] as SketchCategory[]).map(cat => (
        <button key={cat} onClick={() => setSketchCategory(cat)} ...>
          {cat === 'animals' ? '동물' : cat === 'vehicles' ? '탈것' : cat === 'nature' ? '자연' : '기타'}
        </button>
      ))}
    </div>

    {/* 스케치 썸네일 그리드 */}
    <div className="grid grid-cols-4 gap-2">
      {SKETCHES.filter(s => s.category === sketchCategory).map(sketch => (
        <button key={sketch.id} onClick={() => { setSelectedSketch(sketch); setShowPicker(false); startGameWithSketch(sketch); }}>
          <SketchThumbnail sketch={sketch} />
          <span>{sketch.name}</span>
        </button>
      ))}
    </div>
  </>
) : (
  {/* 기존 캔버스 + 팔레트 UI (drawCharacterOutline → drawSketchOutline으로 변경) */}
)}
```

`drawCharacterOutline` → `drawSketchOutline` 변경:

```typescript
// Before
const drawCharacterOutline = useCallback((ctx, char) => {
  ctx.globalAlpha = 0.15;
  ctx.fillText(char, canvasSize / 2, canvasSize / 2);
}, []);

// After
const drawSketchOutline = useCallback((ctx: CanvasRenderingContext2D, sketch: SketchData) => {
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  sketch.draw(ctx, canvasSize);
  ctx.restore();
}, [canvasSize, dpr]);
```

**Step 3 — data/index.ts 업데이트**

```typescript
export { SKETCHES } from './sketches';
export type { SketchData, SketchCategory } from './sketches';
```

#### 2.4.3 스케치 썸네일 컴포넌트

스케치 선택 UI에서 각 스케치의 미리보기를 작은 캔버스(60x60px)로 표시:

```typescript
function SketchThumbnail({ sketch }: { sketch: SketchData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 120; canvas.height = 120; // 2x for retina
    ctx.scale(2, 2);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    sketch.draw(ctx, 60);
  }, [sketch]);

  return <canvas ref={canvasRef} className="h-[60px] w-[60px]" />;
}
```

#### 2.4.4 변경 파일 목록

| # | 파일 | 변경 내용 | 신규/수정 |
|---|------|-----------|-----------|
| 1 | `src/data/sketches.ts` | 20종 스케치 그림 데이터 (Canvas 2D 드로잉 함수) | **신규** |
| 2 | `src/data/index.ts` | sketches export 추가 | 수정 |
| 3 | `src/pages/ColoringGamePage.tsx` | 스케치 선택 UI + 스케치 기반 캔버스 드로잉으로 전면 리팩토링 | 수정 |

---

## 3. 변경 파일 총 목록

### 3.1 수정 파일 (기존)

| # | 파일 | 변경 사유 | 항목 |
|---|------|-----------|------|
| 1 | `src/components/ui/AppLayout.tsx` | TTS unlock 개선: `''` → `' '` | A |
| 2 | `src/lib/sound-manager.ts` | `unlock()` 무음 버퍼 재생 추가 | A |
| 3 | `src/hooks/use-tts.ts` | `speak()` cancel 후 딜레이, voice fallback | A |
| 4 | `src/pages/QuizGamePage.tsx` | TTS 자동재생 방식 개선 | A |
| 5 | `src/pages/WhackAMoleGamePage.tsx` | spawnMole stale closure 버그 수정 (gameStateRef) | B |
| 6 | `src/stores/gamification-store.ts` | `checkAndGrantStickers()` 액션 추가 | C |
| 7 | `src/hooks/use-game-logic.ts` | `finish()`에서 스티커 체크, `earnedStickers` 노출 | C |
| 8 | `src/components/features/RewardCelebration.tsx` | 새 스티커 획득 표시 UI | C |
| 9 | `src/pages/ColoringGamePage.tsx` | 스케치 선택 UI + 스케치 기반 캔버스 드로잉 | D |
| 10 | `src/data/index.ts` | sketches export 추가 | D |

### 3.2 신규 파일

| # | 파일 | 설명 | 항목 |
|---|------|------|------|
| 1 | `src/data/sketches.ts` | 20종 스케치 그림 데이터 (Canvas 2D 드로잉 함수) | D |

### 3.3 변경 없는 파일

- `src/App.tsx`, `src/main.tsx`, `src/router.tsx` — 변경 없음
- `src/data/stickers.ts` — 기존 스티커 데이터 유지 (조건만 체크 로직 추가)
- `src/stores/progress-store.ts`, `src/stores/settings-store.ts` — 변경 없음
- 기존 23개 게임 페이지 (WhackAMole, Quiz, Coloring 제외) — 변경 없음
  - `use-game-logic.ts`의 `finish()` 수정으로 모든 게임에 자동 적용됨
- `src/components/ui/BottomNav.tsx`, `TopBar.tsx`, `Button.tsx` 등 — 변경 없음
- `e2e/` 디렉토리 — 기존 테스트 유지 (셀렉터 변경 시 업데이트 필요)

---

## 4. 추가 의존성

**추가 필요 없음.**

모든 구현이 기존 의존성으로 가능:
- TTS: Web Speech API (이미 사용 중)
- Audio: Web Audio API (이미 사용 중, SoundManager)
- Canvas: HTML5 Canvas 2D API (이미 사용 중)
- 상태관리: `zustand` (이미 설치)
- 애니메이션: `motion` (이미 설치)

---

## 5. 영향 범위 분석

### 5.1 고위험 변경

| 변경 | 위험 | 완화 방법 |
|------|------|-----------|
| TTS speak() cancel 후 딜레이 추가 | 모든 TTS 호출에 50ms 추가 지연 | 50ms는 사용자에게 인식 불가. cancel 없이 새 utterance를 speak하면 이전 발화가 겹칠 수 있으므로 cancel 유지 필수 |
| ColoringGamePage 전면 리팩토링 | 기존 글자 색칠 기능 제거 | 사용자 요청이 "숫자, 글자 색칠하기 말고" 이므로 기존 기능 교체가 요청 의도에 부합 |

### 5.2 중위험 변경

| 변경 | 위험 | 완화 방법 |
|------|------|-----------|
| useGameLogic.finish()에서 checkAndGrantStickers 호출 | 모든 23개 게임에 영향 | 기존 로직(addStars, setState) 이후 추가 호출이므로 기존 동작에 영향 없음. 새 스티커가 없으면 빈 배열 반환 |
| WhackAMole gameStateRef 패턴 | 기존 상태 관리 패턴 변경 | useRef + useEffect 동기화는 React 공식 권장 패턴. 기존 setState 흐름 유지 |

### 5.3 저위험 변경

| 변경 | 이유 |
|------|------|
| AppLayout TTS unlock 문자 변경 | 1문자 변경, 기존 동작 방식 동일 |
| SoundManager unlock 무음 버퍼 | 추가 로직만, 기존 코드 수정 없음 |
| data/index.ts export 추가 | 1줄 추가 |
| data/sketches.ts 신규 파일 | 순수 데이터 파일, 기존 코드에 영향 없음 |

---

## 6. 구현 순서 (권장)

### Phase 1: 핵심 버그 수정 (dev1 담당) — 최우선

**A. TTS/오디오 수정:**
1. `src/lib/sound-manager.ts` — unlock() 무음 버퍼 재생 추가
2. `src/hooks/use-tts.ts` — speak() cancel 후 50ms 딜레이, voice fallback
3. `src/components/ui/AppLayout.tsx` — TTS unlock `''` → `' '`
4. `src/pages/QuizGamePage.tsx` — TTS 자동재생 방식 개선

**B. 두더지 잡기 수정:**
5. `src/pages/WhackAMoleGamePage.tsx` — gameStateRef로 stale closure 해결

**C. 스티커 보상 연결:**
6. `src/stores/gamification-store.ts` — checkAndGrantStickers() 추가
7. `src/hooks/use-game-logic.ts` — finish()에서 스티커 체크 호출

### Phase 2: UI/콘텐츠 변경 (dev2 담당)

**D. 색칠하기 스케치 지원:**
8. `src/data/sketches.ts` — 20종 스케치 데이터 생성
9. `src/data/index.ts` — export 추가
10. `src/pages/ColoringGamePage.tsx` — 스케치 선택 UI + 드로잉 리팩토링

**C. 스티커 UI:**
11. `src/components/features/RewardCelebration.tsx` — 스티커 획득 표시

---

## 7. 테스트 계획

| 테스트 | 검증 항목 | 예상 결과 |
|--------|-----------|-----------|
| 타입 체크 | `tsc --noEmit` 통과 | PASS |
| 린트 | `eslint src/` 통과 | PASS |
| 빌드 | `vite build` 성공 | PASS |
| **TTS 소리 퀴즈** | 소리 퀴즈 진입 시 TTS 재생 | PASS |
| **TTS 풍선 터뜨리기** | 풍선 게임 진입 시 "~을 찾아서 터뜨려봐!" TTS 재생 | PASS |
| **TTS 따라 말하기** | 따라 말하기 진입 시 TTS 재생 | PASS |
| **TTS 다시 듣기 버튼** | 스피커 버튼 탭 시 TTS 재생 | PASS |
| **두더지 잡기 플레이** | 게임 시작 → 두더지(탈것) 등장 → 터치 → 점수 증가 | PASS |
| **두더지 잡기 폭탄** | 폭탄 터치 시 점수 감소 + 흔들림 피드백 | PASS |
| **두더지 잡기 종료** | 30초 경과 → 보상 화면 표시 | PASS |
| **스티커 첫 게임** | 첫 번째 게임 완료 → 'first-game-clear' 스티커 획득 | PASS |
| **스티커 별 30개** | 별 30개 이상 → 해당 스티커 자동 획득 | PASS |
| **스티커 중복 방지** | 이미 획득한 스티커 재부여 시도 → 중복 없음 | PASS |
| **스티커 보상 표시** | RewardCelebration에 새 스티커 표시 | PASS |
| **색칠하기 스케치 선택** | 카테고리(동물/탈것/자연/기타) 탭 전환 | PASS |
| **색칠하기 스케치 그리기** | 스케치 선택 → 캔버스에 윤곽선 표시 → 색칠 | PASS |
| **색칠하기 완료** | 면적 8% 이상 색칠 → 게임 완료 | PASS |
| **색칠하기 다시 칠하기** | "다시 칠하기" 버튼 → 캔버스 초기화 | PASS |
| 기존 E2E | 기존 E2E 테스트 통과 | PASS |

---

## 8. 주의사항

1. **TTS cancel 유지**: `speak()` 내부의 `speechSynthesis.cancel()`은 유지 (이전 발화 정리). cancel 후 50ms 대기 추가로 안정성 확보.
2. **스티커 조건 매핑 정확성**: `stickers.ts`의 `unlockCondition` 문자열과 `checkAndGrantStickers()`의 조건 분기가 정확히 매핑되어야 함. 특히 학습 완료 관련 스티커는 이번 범위에서 제외하므로 누락이 아님을 명시.
3. **스케치 데이터 품질**: Canvas 2D 드로잉 함수의 좌표/곡선이 정확해야 스케치가 자연스러움. 각 draw 함수를 개별 테스트 필요.
4. **기존 게임 패턴 준수**: 모든 변경은 기존 `useGameLogic` + `RewardCelebration` + `CharacterDdori` 패턴 유지.
5. **기존 E2E 보존**: `e2e/` 디렉토리의 기존 테스트가 깨지지 않도록 주의. ColoringGamePage의 셀렉터가 변경되므로 관련 E2E 업데이트 필요.
6. **접근성 유지**: 스케치 선택 버튼에 `aria-label` 추가. 모든 터치 타겟 최소 56px.
7. **성능 유지**: sketches.ts의 draw 함수는 간단한 Canvas API 호출만 사용. 복잡한 Path2D 피하고 기본 도형 조합.
8. **gameStateRef 패턴**: WhackAMoleGamePage에서 `useRef`와 `useEffect` 동기화 시 `startGame` 내에서 `gameStateRef.current = 'playing'`을 명시적으로 설정하여 경쟁 조건 방지.
