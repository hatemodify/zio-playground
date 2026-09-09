import { PICTURE_THEMES, type PictureTheme } from '@/data/picture-content';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Picture from '@/components/games/Picture';
import { AdventureFrame, AdventureIntro, RoundProgress, type Difficulty } from '@/components/games/AdventureFrame';
import { DISCOVERY_GAMES, createDiscoveryQuestions, type DiscoveryId, type DiscoveryQuestion } from '@/data/discovery-games';
import { useGameLogic } from '@/hooks/use-game-logic';
import RewardCelebration from '@/components/features/RewardCelebration';

export default function DiscoveryGamePage() {
  const { pathname } = useLocation();
  const id = pathname.split('/').pop() as DiscoveryId;
  return <DiscoveryGame key={id} id={id} />;
}
function DiscoveryGame({ id }: { id: DiscoveryId }) {
  const config = DISCOVERY_GAMES[id];
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [theme, setTheme] = useState<PictureTheme>('vehicles');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [questions, setQuestions] = useState<DiscoveryQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [basket, setBasket] = useState(0);
  const [letters, setLetters] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('');
  const [correct, setCorrect] = useState(false);
  const [hadError, setHadError] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const game = useGameLogic({ gameId: id, category: id === 'picture-words' ? language === 'ko' ? 'hangul' : 'english' : ['animal-families', 'vehicle-missions'].includes(id) ? 'discovery' : 'numbers' });
  const q = questions[round];
  const answerWord = q?.tokens ? letters.map((index) => q.tokens!.find((token) => token.id === index)!.value).join('') : '';

  function clearRound() { setBasket(0); setLetters([]); setFeedback(''); setCorrect(false); setHadError(false); }
  function start() {
    const next = createDiscoveryQuestions(id, difficulty, language, theme);
    setQuestions(next); setRound(0); clearRound(); setShowReward(true); game.start(next.length);
  }
  function check(value: string) {
    if (correct || game.state !== 'playing') return;
    if (value === q.answer) {
      setCorrect(true); setFeedback(q.explanation);
      if (!hadError) game.addScore();
    } else {
      setHadError(true); game.wrongAnswer();
      setFeedback(id === 'little-market' ? Number(value) < Number(q.answer) ? '조금 더 담아 볼까요? 주문서와 하나씩 짝지어 봐요.' : '조금 많아요. 바구니 속 물건을 눌러 빼 보세요.'
        : id === 'vehicle-missions' ? '탈것의 모양과 맡은 일을 다시 살펴봐요.'
        : id === 'animal-families' ? '다시 관찰해 봐요. 깃털, 비늘, 새끼에게 젖을 먹이는 특징을 찾아요.'
        : id === 'picture-words' ? `그림의 이름은 ${q.word}예요. 한 칸씩 다시 이어 볼까요?` : '처음부터 같은 묶음이 다시 나오는 곳을 찾아봐요.');
    }
  }
  function next() {
    if (!correct) return;
    if (round + 1 === questions.length) game.finish();
    else { setRound((value) => value + 1); clearRound(); }
  }
  const finished = game.state === 'success' || game.state === 'reward';
  return <AdventureFrame title={config.title} subtitle={config.subtitle}>
    {game.state === 'ready' ? <AdventureIntro picture={config.picture} title={config.objective} instructions={[...config.instructions]}
      difficulty={difficulty} onDifficulty={setDifficulty} onStart={start}>
      {(id === 'picture-words' || id === 'pattern-garden') && <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="그림 주제">{PICTURE_THEMES.map((item) => <button key={item.id} className="adventure-secondary" aria-pressed={theme === item.id} onClick={() => setTheme(item.id)}>{item.label}</button>)}</div>}
      {id === 'picture-words' && <div className="mt-4 flex gap-2" role="group" aria-label="단어 언어">
        {(['ko', 'en'] as const).map((value) => <button className="adventure-secondary" aria-pressed={language === value} onClick={() => setLanguage(value)} key={value}>{value === 'ko' ? '한글 단어' : 'English 단어'}</button>)}
      </div>}
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <Picture id={config.picture} className="h-32 w-32" /><h2 className="mt-4 text-2xl font-extrabold">탐험을 마쳤어요!</h2>
      <p className="mt-3">{questions.length}개 중 {game.score}개를 첫 시도에 해결했어요.</p>
      <p className="mt-2 text-sm text-slate-500">다시 생각해 본 문제도 끝까지 잘 해냈어요.</p>
      <button className="adventure-primary mt-6" onClick={() => { game.reset(); clearRound(); }}>다른 난이도로 탐험하기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers}
        open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} />
    </section> : q && <>
      <RoundProgress round={round + 1} total={questions.length} />
      {id === 'little-market' && <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <section className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-3 text-center sm:p-5">
          <h2 className="text-base font-extrabold sm:text-lg">오늘의 주문서</h2>
          <Picture id={q.picture} label={q.name} className="my-3 h-20 w-20 sm:h-28 sm:w-28" />
          <p className="break-keep text-lg font-extrabold sm:text-2xl">{q.name} {q.left}{q.right ? ` + ${q.right}` : ''}개</p>
          <p className="mt-2 text-sm">{q.right ? '두 묶음을 합쳐 담아 주세요.' : '주문한 수만큼 담아 주세요.'}</p>
          <button className="adventure-primary mt-5" disabled={correct || basket >= 12} onClick={() => setBasket((n) => n + 1)}>한 개 담기</button>
        </section>
        <section className="rounded-3xl border-2 border-dashed border-teal-200 bg-white p-3 sm:p-5">
          <h2 className="font-bold">내 바구니 <span className="text-teal-700">{basket}개</span></h2>
          <div className="my-3 grid min-h-28 grid-cols-3 content-start gap-1 sm:grid-cols-4" aria-label="장바구니">
            {Array.from({ length: basket }, (_, index) => <button key={index} disabled={correct} aria-label={`${q.name} 한 개 빼기`} onClick={() => setBasket((n) => n - 1)} className="min-h-10 rounded-xl bg-amber-50"><Picture id={q.picture} className="h-10 w-10 max-w-full sm:h-16 sm:w-16" /></button>)}
          </div>
          <p className="mb-3 text-xs text-slate-500">바구니 속 그림을 누르면 한 개를 뺄 수 있어요.</p>
          <button className="adventure-primary w-full" disabled={correct} onClick={() => check(String(basket))}>주문 확인</button>
        </section>
      </div>}
      {id === 'vehicle-missions' && <>
        <section className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-center"><p className="text-sm font-bold text-amber-800">마을에서 온 부탁</p><h2 className="mx-auto mt-2 max-w-lg break-keep text-xl font-extrabold">{q.hint}</h2><Picture id={q.picture} className="my-3 h-28 w-48 brightness-0 opacity-25" /><p className="text-sm text-slate-600">이 일을 도와줄 탈것을 골라 주세요.</p></section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="출동할 탈것">{q.choices.map((choice) => <button className="picture-choice" disabled={correct} key={choice.value} onClick={() => check(choice.value)}><Picture id={choice.picture!} label={choice.label} className="h-24 w-full" /><span>{choice.label}</span></button>)}</div>
      </>}
      {id === 'animal-families' && <>
        <div className="scene-meadow rounded-3xl p-6 text-center"><Picture id={q.picture} label={q.name} className="h-36 w-36" />
          <h2 className="mt-3 text-xl font-extrabold">{q.name}는 어떤 동물 무리일까요?</h2>
          {difficulty === 'easy' && <p className="mt-2 text-sm">도움말: {q.hint}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{q.choices.map((choice) => <button className="picture-choice" key={choice.value} disabled={correct} onClick={() => check(choice.value)}>
          <Picture id={choice.picture!} /><span>{choice.value}</span><span className="text-xs font-normal text-slate-500">{choice.label}</span></button>)}</div>
      </>}
      {id === 'picture-words' && <>
        <div className="scene-meadow rounded-3xl p-5 text-center"><Picture id={q.picture} label={q.name} className="h-32 w-32" />
          <h2 className="mt-2 text-xl font-extrabold">그림의 이름을 이어 주세요</h2>
          {difficulty === 'easy' && <p className="mt-2 text-2xl font-extrabold text-teal-800">{q.word}</p>}
          {difficulty === 'normal' && <p className="mt-2 font-bold text-teal-800">첫 글자는 {q.word![0]} · {q.word!.length}글자예요</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2" aria-label="만든 단어">{[...q.word!].map((_, index) => <span key={index} className="flex h-14 min-w-12 items-center justify-center rounded-xl border-b-4 border-teal-600 bg-white px-2 text-2xl font-extrabold">{answerWord[index] || '·'}</span>)}</div>
        <div className="flex flex-wrap justify-center gap-2">{q.tokens!.map((token) => <button key={token.id} disabled={correct || letters.includes(token.id) || letters.length >= q.word!.length}
          className="adventure-secondary min-w-14 text-2xl" aria-label={`글자 ${token.value}`} onClick={() => setLetters((old) => [...old, token.id])}>{token.value}</button>)}</div>
        <div className="flex justify-center gap-3"><button className="adventure-secondary" disabled={correct || !letters.length} onClick={() => setLetters((old) => old.slice(0, -1))}>한 칸 지우기</button>
          <button className="adventure-primary" disabled={correct || letters.length !== q.word!.length} onClick={() => check(answerWord)}>단어 확인</button></div>
      </>}
      {id === 'pattern-garden' && <>
        <div className="scene-meadow rounded-3xl p-4"><h2 className="mb-4 text-center text-xl font-extrabold">다음에 올 그림은 무엇일까요?</h2>
          <div className="flex flex-wrap justify-center gap-2" aria-label="그림 규칙">{q.sequence!.map((animal, index) => <div key={index} className="rounded-2xl bg-white/80 p-1"><Picture id={animal} className="h-14 w-14 sm:h-20 sm:w-20" /></div>)}<div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-teal-600 bg-white text-3xl font-bold">?</div></div>
          {difficulty === 'easy' && <p className="mt-4 text-center text-sm">앞의 두 친구가 번갈아 나와요.</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">{q.choices.map((choice) => <button key={choice.value} className="picture-choice" disabled={correct} onClick={() => check(choice.value)}><Picture id={choice.picture!} /><span>{choice.label}</span></button>)}</div>
      </>}
      {feedback && <div className="feedback-card" role="status"><p className="font-bold">{correct ? '잘 찾았어요!' : '한 번 더 생각해 볼까요?'}</p><p className="mt-1 text-sm">{feedback}</p>
        {correct && <button className="adventure-primary mt-3" onClick={next}>{round + 1 === questions.length ? '탐험 마치기' : '다음 탐험'}</button>}</div>}
    </>}
  </AdventureFrame>;
}
