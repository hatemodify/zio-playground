import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import { RewardCelebration, UndoRedoControls } from '@/components/features';
import ColoringArtwork from '@/components/games/ColoringArtwork';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { COLORING_CATEGORIES, COLORING_PAGES, pagesByCategory, type ColoringCategory, type ColoringPage } from '@/data';

const COLORS = [
  { name: '체리 레드', value: '#E6495B' },
  { name: '산호 핑크', value: '#FF7B7B' },
  { name: '살구 오렌지', value: '#FF9F43' },
  { name: '레몬 옐로', value: '#FFD93D' },
  { name: '민트 그린', value: '#53D39B' },
  { name: '숲 그린', value: '#2F9E70' },
  { name: '하늘 블루', value: '#74C9F5' },
  { name: '바다 블루', value: '#4A90D9' },
  { name: '라벤더', value: '#A29BFE' },
  { name: '보라', value: '#7950F2' },
  { name: '사랑 핑크', value: '#FF9FF3' },
  { name: '장미 핑크', value: '#E64980' },
  { name: '코코아 브라운', value: '#8B5E3C' },
  { name: '머드 브라운', value: '#A9825A' },
  { name: '크림', value: '#FFF1C1' },
  { name: '구름 회색', value: '#D7DEE8' },
  { name: '차콜', value: '#495057' },
  { name: '눈꽃 흰색', value: '#FFFFFF' },
];
type Fills = Record<string, string>;
export default function ColoringGamePage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const game = useGameLogic({ gameId: 'coloring', category: 'play' });
  const [category, setCategory] = useState<ColoringCategory>('animals');
  const [page, setPage] = useState<ColoringPage | null>(null);
  const [color, setColor] = useState(COLORS[0].value);
  const [history, setHistory] = useState<Fills[]>([{}]);
  const [cursor, setCursor] = useState(0);
  const [showReward, setShowReward] = useState(true);
  const fills = history[cursor];
  const finished = game.state === 'success' || game.state === 'reward';
  const filled = page?.regions.filter((region) => fills[region.id]).length ?? 0;

  function select(next: ColoringPage) {
    setPage(next); setHistory([{}]); setCursor(0); setShowReward(true); game.start(1); play('card_flip');
  }
  function paint(id: string) {
    if (!page || game.state !== 'playing' || fills[id] === color) return;
    const next = { ...fills, [id]: color };
    setHistory([...history.slice(0, cursor + 1), next]); setCursor(cursor + 1); play('drag_drop');
    if (page.regions.every((region) => next[region.id])) game.finish(1);
  }
  function back() { game.reset(); setPage(null); }

  if (!page) return <div className="art-studio flex flex-col gap-5 px-4 pb-6 pt-3">
    <header className="studio-heading"><p className="text-xs font-extrabold tracking-widest text-teal-700">또리의 아트 스튜디오</p><h1 className="mt-1 text-2xl font-extrabold text-slate-800">색칠하기</h1><p className="mt-1 text-sm text-slate-600">그림을 골라봐!</p><span className="studio-badge">{COLORING_PAGES.length}개의 컬러 도안</span></header>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{COLORING_CATEGORIES.map((item) => <button key={item.key} aria-label={`${item.label} 카테고리`} aria-pressed={category === item.key} onClick={() => setCategory(item.key)} className={`min-h-11 flex-1 rounded-2xl text-sm font-bold ${category === item.key ? 'bg-teal-700 text-white shadow-md' : 'bg-white text-slate-600'}`}>{item.emoji} {item.label}</button>)}</div>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{pagesByCategory(category).map((item, index) => <motion.button key={item.id} whileTap={{ scale: 0.96 }} className="art-card" aria-label={`${item.name} 색칠하기`} onClick={() => select(item)}>
      <div className={`art-thumbnail art-tone-${index % 4}`}><img src={item.source} alt="" className="h-28 w-28 p-2 sm:h-36 sm:w-36" /></div>
      <div className="flex w-full items-center justify-between p-4"><span className="font-extrabold text-slate-700">{item.name}</span><span className="text-xs font-bold text-teal-700">{item.regions.length}칸</span></div>
    </motion.button>)}</div>
    <p className="text-center text-sm text-slate-500">좋아하는 색으로 나만의 작품을 만들어요.</p>
    <a className="text-center text-xs text-slate-400 underline" href="/assets/twemoji/CREDITS.md" target="_blank" rel="noreferrer">그림: Twemoji · CC BY 4.0</a>
  </div>;

  if (finished) return <div className="art-studio flex flex-col items-center gap-4 px-4 py-6">
    <span className="studio-pill">MY LITTLE GALLERY</span><h1 className="text-2xl font-extrabold text-slate-800">나만의 {page.name} 완성!</h1>
    <div className="finished-art"><ColoringArtwork page={page} fills={fills} className="w-full" /><p className="mt-3 text-center text-sm font-bold text-slate-500">세상에 하나뿐인 나의 작품</p></div>
    <div className="flex gap-3"><Button variant="secondary" onClick={back}>다시 하기</Button><Button onClick={() => navigate('/games')}>게임 목록</Button></div>
    <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={showReward} onDismiss={() => setShowReward(false)} message="멋진 작품이 탄생했어요!" />
  </div>;

  return <div className="art-studio flex flex-col gap-4 px-4 pb-6 pt-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-teal-700" aria-label="다른 그림 선택" onClick={back}>← 다른 그림</button><h1 className="text-xl font-extrabold text-slate-800">{page.name}</h1></div><UndoRedoControls canUndo={cursor > 0} canRedo={cursor < history.length - 1} onUndo={() => setCursor(cursor - 1)} onRedo={() => setCursor(cursor + 1)} /></div>
    <div className="flex items-center gap-3"><progress aria-label="색칠 진행" value={filled} max={page.regions.length} className="h-2 flex-1 accent-teal-600" /><span className="text-sm font-bold text-teal-700">{filled}/{page.regions.length}</span></div>
    <div className="painting-stage"><div className="art-reference"><img src={page.source} alt={`${page.name} 완성 예시`} /><span>이렇게 칠해도 좋아요</span></div><ColoringArtwork page={page} fills={fills} onFill={paint} className="coloring-canvas" /></div>
    <div className="paint-toolbox"><p className="mb-3 text-center text-sm font-bold text-slate-600">원하는 색을 골라 그림을 톡!</p><div className="paint-color-grid">{COLORS.map((item) => <button key={item.value} className={`paint-color ${item.value === color ? 'paint-color-selected' : ''}`} style={{ background: item.value }} onClick={() => setColor(item.value)} aria-label={`색상 ${item.name}`} aria-pressed={item.value === color}><span className="sr-only">{item.name}</span></button>)}<label className={`paint-custom-color ${!COLORS.some((item) => item.value === color) ? 'paint-color-selected' : ''}`}>
      <input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="내 색 만들기" />
      <span aria-hidden="true">＋</span><small>내 색</small>
    </label></div><p className="mt-3 text-center text-xs font-semibold text-slate-400">파스텔부터 진한 색까지 {COLORS.length}가지 + 내 색 만들기</p></div>
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="작은 영역 칠하기">{page.regions.map((region) => <button key={region.id} onClick={() => paint(region.id)} className="region-chip" aria-label={`${region.label} 색 채우기`}><span style={{ background: fills[region.id] ?? '#E7E5E4' }} />{region.label}{fills[region.id] && ' ✓'}</button>)}</div>
    <Button variant="ghost" size="sm" onClick={() => { setHistory([{}]); setCursor(0); }}>다시 칠하기</Button>
  </div>;
}
