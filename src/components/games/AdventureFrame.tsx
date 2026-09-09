import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Picture from './Picture';
import type { PictureId } from '@/data/picture-content';

export type Difficulty = 'easy' | 'normal' | 'hard';
const DIFFICULTIES = [
  { id: 'easy' as const, label: '처음 해요', description: '그림과 도움을 보며 천천히' },
  { id: 'normal' as const, label: '할 수 있어요', description: '조금 더 다양하게 도전' },
  { id: 'hard' as const, label: '자신 있어요', description: '혼자 생각하며 해결' },
];

export function AdventureFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="adventure-page">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-bold tracking-widest text-teal-700">또리의 발견 놀이터</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-800">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p></div>
      <Link className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold" to="/games">게임 목록</Link>
    </div>
    {children}
  </div>;
}

export function AdventureIntro({ picture, title, instructions, difficulty, onDifficulty, onStart, children, showDifficulty = true }:
  { picture: PictureId; title: string; instructions: string[]; difficulty: Difficulty; onDifficulty: (value: Difficulty) => void; onStart: () => void; children?: ReactNode; showDifficulty?: boolean }) {
  return <section className="adventure-intro">
    <div className="scene-meadow flex min-h-52 flex-col items-center justify-center gap-4 rounded-3xl p-4 sm:flex-row sm:gap-6 sm:p-6">
      <Picture id={picture} className="h-24 w-24 shrink-0 animate-float sm:h-36 sm:w-36" /><div className="w-full max-w-md rounded-3xl bg-white/95 p-5 shadow-sm">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">{instructions.map((text, i) => <li key={text}>{i + 1}. {text}</li>)}</ol>
      </div>
    </div>
    {children}
    {showDifficulty && <fieldset className="mt-5"><legend className="mb-3 text-sm font-bold text-slate-600">오늘은 어떻게 놀까요?</legend>
      <div className="grid grid-cols-3 gap-2">{DIFFICULTIES.map((item) => <button type="button" key={item.id}
        aria-pressed={difficulty === item.id} onClick={() => onDifficulty(item.id)}
        className={`rounded-2xl border-2 p-4 text-left ${difficulty === item.id ? 'border-teal-600 bg-teal-50' : 'border-slate-100 bg-white'}`}>
        <span className="block break-keep text-sm font-bold sm:text-base">{item.label}</span><span className="hidden text-xs text-slate-500 sm:inline">{item.description}</span>
      </button>)}</div>
    </fieldset>}
    <button className="adventure-primary mt-5 w-full" onClick={onStart}>같이 시작하기</button>
  </section>;
}

export function RoundProgress({ round, total }: { round: number; total: number }) {
  return <div className="flex items-center gap-3"><span className="shrink-0 text-sm font-bold text-teal-800">{round} / {total} 탐험</span>
    <progress aria-label="탐험 진행" value={round - 1} max={total} className="h-3 w-full accent-teal-600" /></div>;
}
