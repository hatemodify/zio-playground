import { useRef, useState } from 'react';
import { AdventureFrame } from '@/components/games/AdventureFrame';
import Picture from '@/components/games/Picture';
import { ANIMALS, VEHICLES } from '@/data/picture-content';
import { usePlaygroundStore, PLAYGROUND_FRIENDS, type ToyId, type PlaygroundScene } from '@/stores/playground-store';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSound } from '@/hooks/use-sound';
import RewardCelebration from '@/components/features/RewardCelebration';

export default function AnimalPlaygroundPage() {
  const { scene, save } = usePlaygroundStore();
  const [selected, setSelected] = useState<ToyId | 'eraser'>('excavator');
  const [collection, setCollection] = useState<'vehicles' | 'animals'>('vehicles');
  const [previous, setPrevious] = useState<PlaygroundScene | null>(null);
  const [party, setParty] = useState(false);
  const [open, setOpen] = useState(false);
  const [stickers, setStickers] = useState<string[]>([]);
  const [celebrated, setCelebrated] = useState(false);
  const runId = useRef(crypto.randomUUID());
  const completeGame = useGamificationStore((s) => s.completeGame);
  const { play } = useSound();
  function change(next: PlaygroundScene) { setPrevious(scene); save(next); play('button_click'); }
  function place(index: number) { change({ ...scene, cells: scene.cells.map((cell, i) => i === index ? selected === 'eraser' ? null : selected : cell) }); }
  function complete() {
    if (!celebrated) { setStickers(completeGame({ gameId: 'animal-playground', category: 'play', runId: runId.current, score: scene.cells.filter(Boolean).length, stars: 2, duration: 0, completedAt: new Date().toISOString() })); setCelebrated(true); }
    setOpen(true); setParty(true); play('confetti');
  }
  const count = scene.cells.filter(Boolean).length;
  return <AdventureFrame title="상상 마을 놀이터" subtitle="탈것과 동물을 놓아 나만의 마을과 공사장을 만들어요">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex w-full gap-2 overflow-x-auto pb-1 [&>button]:shrink-0" role="group" aria-label="놀이터 배경">{([{ id: 'town', label: '우리 마을' }, { id: 'construction', label: '공사장' }, { id: 'meadow', label: '초록 들판' }, { id: 'beach', label: '바닷가' }, { id: 'night', label: '별빛 밤' }] as const).map((theme) => <button key={theme.id} className="adventure-secondary" aria-pressed={scene.theme === theme.id} onClick={() => change({ ...scene, theme: theme.id })}>{theme.label}</button>)}</div>
      <button className="adventure-secondary" aria-pressed={party} onClick={() => setParty((value) => !value)}>{party ? '춤 멈추기' : '다 같이 춤추기'}</button>
    </div>
    <div className={`${scene.theme === 'town' ? 'scene-town' : scene.theme === 'construction' ? 'scene-construction' : scene.theme === 'night' ? 'scene-night' : scene.theme === 'meadow' ? 'scene-meadow' : 'bg-gradient-to-b from-sky-200 via-cyan-100 to-amber-100'} grid h-[34dvh] max-h-80 min-h-52 grid-cols-5 grid-rows-3 gap-2 rounded-3xl p-3 sm:gap-3 sm:p-4`} aria-label="내 상상 마을">
      {scene.cells.map((animal, index) => <button key={index} onClick={() => place(index)} aria-label={`${index + 1}번 자리${animal ? ` ${PLAYGROUND_FRIENDS.find((item) => item.id === animal)!.name}` : ' 비어 있음'}`} className="flex min-h-0 min-w-0 items-center justify-center rounded-2xl border border-white/50 bg-white/20">
        {animal ? <div className={`flex h-full w-full items-center justify-center ${party ? 'animate-float' : ''}`} style={{ animationDelay: `${index * -0.2}s` }}><Picture id={animal} className="h-full max-h-20 w-full" /></div> : <span aria-hidden="true" className="text-2xl text-teal-800/30">+</span>}
      </button>)}
    </div>
    <p className="text-sm text-slate-500" role="status">{count}개의 그림으로 마을을 꾸몄어요. 만든 풍경은 이 기기에 자동 저장돼요.</p>
    <div className="flex gap-2" role="group" aria-label="놀이터 친구 종류">{([{ id: 'vehicles', label: '탈것 22종' }, { id: 'animals', label: '동물 20종' }] as const).map((item) => <button key={item.id} className="adventure-secondary" aria-pressed={collection === item.id} onClick={() => { setCollection(item.id); setSelected(item.id === 'vehicles' ? 'excavator' : 'rabbit'); }}>{item.label}</button>)}</div>
    <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="친구 고르기">{(collection === 'vehicles' ? VEHICLES : ANIMALS).map((animal) => <button className={`picture-choice !min-h-20 w-20 shrink-0 !p-2 ${selected === animal.id ? '!border-teal-600 !bg-teal-50' : ''}`} aria-pressed={selected === animal.id} key={animal.id} onClick={() => setSelected(animal.id)}><Picture id={animal.id} className="h-12 w-12 sm:h-16 sm:w-16" /><span className="text-xs">{animal.name}</span></button>)}</div>
    <div className="flex flex-wrap gap-2"><button className="adventure-secondary" aria-pressed={selected === 'eraser'} onClick={() => setSelected('eraser')}>그림 지우개</button>
      <button className="adventure-secondary" disabled={!previous} onClick={() => { if (previous) { save(previous); setPrevious(null); } }}>되돌리기</button>
      <button className="adventure-secondary" disabled={!count} onClick={() => change({ ...scene, cells: scene.cells.map(() => null) })}>모두 지우기</button>
      <button className="adventure-primary ml-auto" disabled={count < 3} onClick={complete}>작품 완성</button></div>
    {count < 3 && <p className="text-sm text-slate-500">그림을 3개 이상 놓으면 작품을 완성할 수 있어요.</p>}
    <RewardCelebration type="game_complete" stars={2} newStickers={stickers} open={open} onDismiss={() => setOpen(false)} />
  </AdventureFrame>;
}
