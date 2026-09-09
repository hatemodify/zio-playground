import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GameCard from '@/components/features/GameCard';
import Picture from '@/components/games/Picture';
import { useGamificationStore } from '@/stores/gamification-store';
import { GAME_CONFIGS } from '@/data/game-configs';

const FILTERS = [{ id: 'all', label: '모두 보기' }, { id: 'learning', label: '배우며 놀기' }, { id: 'play', label: '신나게 놀기' }, { id: 'new', label: '새로운 탐험' }] as const;
type Filter = typeof FILTERS[number]['id'];
export default function GamesListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const records = useGamificationStore((s) => s.gameRecords);
  const isLearning = (game: typeof GAME_CONFIGS[number]) => game.kind ? game.kind === 'learning' : game.categories.length > 0;
  const visible = GAME_CONFIGS.filter((game) => filter === 'all' || (filter === 'new' ? game.isNew : filter === 'learning' ? isLearning(game) : !isLearning(game)));
  return <div className="game-library mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-8 pt-3 sm:px-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-extrabold text-slate-800">미니 게임</h1><span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-teal-700">{GAME_CONFIGS.length}개 게임</span></div>
    <section className="scene-meadow relative overflow-hidden rounded-[32px] p-6 sm:p-8">
      <div className="relative z-10 max-w-[65%]"><p className="text-xs font-extrabold tracking-wider text-teal-700">PLAY · DISCOVER · GROW</p>
        <h2 className="mt-3 text-2xl font-extrabold leading-snug text-slate-800 sm:text-3xl">놀다 보면,<br />새로운 발견!</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">그림을 보고, 직접 만지고,<br />스스로 알아가는 또리의 놀이터</p>
        <Link className="adventure-primary mt-5 inline-block text-sm" to="/games/vehicle-missions">오늘의 탐험 시작 →</Link></div>
      <Picture id="excavator" className="absolute -bottom-3 right-3 h-40 w-32 rotate-6 sm:right-16 sm:h-64 sm:w-48" />
      <Picture id="police-car" className="absolute bottom-5 right-24 hidden h-32 w-32 -rotate-12 lg:right-56 lg:block" />
    </section>
    <div className="flex flex-wrap gap-2" role="group" aria-label="게임 종류">{FILTERS.map((item) => <button key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}
      className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-bold ${filter === item.id ? 'bg-teal-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}</div>
    {(['learning', 'play'] as const).map((kind) => {
      const games = visible.filter((game) => isLearning(game) === (kind === 'learning'));
      if (!games.length) return null;
      return <section key={kind}><div className="mb-4 flex flex-wrap items-baseline gap-3"><h2 className="text-xl font-extrabold text-slate-800">{kind === 'learning' ? '학습 게임' : '놀이 게임'}</h2><p className="text-sm text-slate-500">{kind === 'learning' ? '작은 도전으로 생각하는 힘을 키워요' : '정답 걱정 없이 마음껏 즐겨요'}</p></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">{games.map((game) => <GameCard key={game.id} gameId={game.id} name={game.name} description={game.description} focus={game.focus ?? (kind === 'learning' ? '관찰 · 사고력' : '표현 · 즐거움')} isNew={game.isNew}
          bestScore={records.filter((record) => record.gameId === game.id).reduce((best, record) => Math.max(best, record.stars), 0)} onClick={() => navigate(`/games/${game.id}`)} />)}</div>
      </section>;
    })}
  </div>;
}
