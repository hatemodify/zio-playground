import { useState } from 'react';
import { AdventureFrame, AdventureIntro, type Difficulty } from '@/components/games/AdventureFrame';
import { IngredientPicture } from '@/components/games/BurgerStack';
import FoodAssembly from '@/components/games/FoodAssembly';
import { RewardCelebration } from '@/components/features';
import { useSound } from '@/hooks/use-sound';
import { useGameLogic } from '@/hooks/use-game-logic';
import { INGREDIENTS, RECIPES, FOOD_KINDS, paletteFor, type Recipe, type IngredientId, type FoodKind } from '@/data/recipes';
import { shuffled } from '@/data/picture-content';

export default function FoodStackGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [foodKind, setFoodKind] = useState<FoodKind | 'all'>('all');
  const [mode, setMode] = useState<'orders' | 'creative'>('orders');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [round, setRound] = useState(0);
  const [layers, setLayers] = useState<IngredientId[]>([]);
  const [feedback, setFeedback] = useState('');
  const [hadError, setHadError] = useState(false);
  const [showReward, setShowReward] = useState(true);
  const game = useGameLogic({ gameId: 'food-stack', category: mode === 'creative' ? 'play' : 'discovery' });
  const { play } = useSound();
  const recipe = recipes[round];
  const creative = mode === 'creative';
  const complete = creative ? layers.length >= 3 : !!recipe && layers.length === recipe.layers.length;
  const finished = game.state === 'success' || game.state === 'reward';
  const kind = creative ? foodKind === 'all' ? 'burger' : foodKind : recipe?.kind ?? 'burger';
  const creativePalette = [...new Set(RECIPES.filter((item) => item.kind === kind).flatMap((item) => item.layers))].map((id) => INGREDIENTS[id]);
  const palette = !creative && difficulty === 'easy' && recipe ? paletteFor(recipe) : creativePalette;

  function start() {
    const pool = RECIPES.filter((item) => foodKind === 'all' || item.kind === foodKind).filter((item) => difficulty === 'easy' ? item.layers.length <= 5 : difficulty === 'normal' ? item.layers.length >= 5 && item.layers.length <= 6 : item.layers.length >= 5);
    const mixed = shuffled(FOOD_KINDS).flatMap((food) => shuffled(pool.filter((item) => item.kind === food.id)).slice(0, 1));
    const ordered = foodKind === 'all' ? [...mixed, ...shuffled(pool.filter((item) => !mixed.includes(item)))] : shuffled(pool);
    const chosen = ordered.slice(0, difficulty === 'easy' ? 3 : difficulty === 'normal' ? 4 : 5);
    setRecipes(chosen); setRound(0); setLayers([]); setFeedback(''); setHadError(false); setShowReward(true);
    game.start(creative ? 1 : chosen.length);
  }
  function place(id: IngredientId) {
    if (game.state !== 'playing' || (creative ? layers.length >= 10 : complete)) return;
    if (!creative && recipe.layers[layers.length] !== id) {
      setHadError(true); game.wrongAnswer();
      setFeedback(`${INGREDIENTS[id].label} 차례는 아직이에요. 주문서 ${layers.length + 1}번을 살펴봐요.`); return;
    }
    play('drag_drop'); setLayers((old) => [...old, id]); setFeedback('');
  }
  function serve() {
    if (!complete || game.state !== 'playing') return;
    if (creative || !hadError) game.addScore();
    if (creative || round + 1 === recipes.length) game.finish();
    else {
      play('confetti'); setRound((value) => value + 1); setLayers([]); setHadError(false);
      setFeedback('손님께 전달했어요! 다음 주문도 만들어 볼까요?');
    }
  }

  return <AdventureFrame title="맛있는 음식 만들기" subtitle="피자부터 팬케이크까지, 오늘은 내가 요리사!">
    {game.state === 'ready' ? <AdventureIntro picture="burger" title="또리의 작은 키친에 어서 와요!"
      instructions={creative ? ['좋아하는 재료를 마음대로 골라 쌓아요.', '한 칸 되돌리기로 모양을 바꿀 수 있어요.', '재료를 3개 이상 올리면 나만의 음식 완성!'] : ['주문서의 숫자를 따라 재료 그림을 살펴봐요.', '피자, 샌드위치, 팬케이크를 순서대로 만들어요.', '완성한 음식을 손님께 드려요. 시간 제한은 없어요.']}
      difficulty={difficulty} onDifficulty={setDifficulty} onStart={start} showDifficulty={!creative}>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="음식 메뉴">{FOOD_KINDS.map((food) => <button key={food.id} className={`food-menu-card ${foodKind === food.id ? 'food-menu-selected' : ''}`} aria-pressed={foodKind === food.id} onClick={() => setFoodKind(food.id)}><img src={food.image} alt="" className="h-20 w-20" /><span>{food.name}</span></button>)}</div>
      {!creative && <button className="adventure-secondary mt-3 w-full" aria-pressed={foodKind === 'all'} onClick={() => setFoodKind('all')}>모든 메뉴 골고루 만들기</button>}
      <div className="mt-4 flex gap-2" role="group" aria-label="요리 방법"><button className="adventure-secondary" aria-pressed={!creative} onClick={() => setMode('orders')}>주문대로 만들기</button><button className="adventure-secondary" aria-pressed={creative} onClick={() => { setMode('creative'); if (foodKind === 'all') setFoodKind('burger'); }}>내 마음대로 만들기</button></div>
    </AdventureIntro> : finished ? <section className="adventure-intro text-center">
      <FoodAssembly layers={layers} kind={kind} compact /><h2 className="text-2xl font-extrabold">{creative ? '나만의 음식이 완성됐어요!' : `${recipes.length}개의 주문을 모두 완성했어요!`}</h2>
      <p className="mt-3 text-slate-600">{creative ? '재료를 쌓아 멋진 모양을 만들었어요.' : '재료 고르기 → 차례대로 담기 → 손님께 드리기! 끝까지 잘 만들었어요.'}</p>
      <button className="adventure-primary mt-5" onClick={() => game.reset()}>다시 요리하기</button>
      <RewardCelebration type="game_complete" stars={game.calculateStars(game.score)} newStickers={game.earnedStickers} open={game.state === 'reward' && showReward} onDismiss={() => setShowReward(false)} />
    </section> : recipe && <section className="burger-shop overflow-hidden rounded-[28px] border border-orange-100 bg-[#fff9ed]">
      <div className="burger-awning" aria-hidden="true" />
      <div className="flex items-center justify-between gap-2 px-4 py-3"><p className="text-sm font-extrabold tracking-wide text-amber-950">또리 키친 · 주문을 부탁해!</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-800">{creative ? '자유 요리' : `${round + 1} / ${recipes.length} 주문`}</span></div>
      <div className={`grid gap-3 px-3 sm:px-5 ${creative ? '' : 'grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'}`}>
        {!creative && <section className="burger-ticket rounded-2xl bg-white p-3 sm:p-4" aria-label="주문서">
          <p className="text-xs font-bold tracking-wider text-teal-700">ORDER {String(round + 1).padStart(2, '0')}</p><h2 className="mt-1 text-lg font-extrabold text-amber-950">{recipe.name}</h2>
          <p className="mb-3 mt-1 text-xs text-slate-500">1번부터 순서대로 넣어요</p>
          <ol className="space-y-1.5">{recipe.layers.map((id, index) => <li key={index} aria-current={index === layers.length ? 'step' : undefined}
            className={`flex items-center gap-1.5 rounded-lg px-1 py-0.5 ${index < layers.length ? 'bg-teal-50 text-teal-800' : difficulty === 'easy' && index === layers.length ? 'bg-amber-100 ring-2 ring-amber-300' : 'text-slate-700'}`}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold">{index + 1}</span><IngredientPicture id={id} className="h-6 w-9 sm:w-12" /><span className="break-keep text-xs font-bold sm:text-sm">{INGREDIENTS[id].label}</span><span className="ml-auto text-xs" aria-label={index < layers.length ? '놓았어요' : undefined}>{index < layers.length ? '✓' : ''}</span>
          </li>)}</ol>
        </section>}
        <div className="flex min-w-0 flex-col justify-end rounded-2xl bg-[#f9ebd4] p-2"><p className="pt-2 text-center text-xs font-bold text-amber-900">{creative ? '내가 만드는 새로운 메뉴' : '나의 요리대'}</p><FoodAssembly layers={layers} kind={kind} /><p className="pb-2 text-center text-xs font-bold text-amber-900">{complete ? creative ? '아직 더 쌓아도 좋아요!' : '맛있는 음식 완성!' : `${layers.length}개 재료를 쌓았어요`}</p></div>
      </div>
      <p role="status" className={`mx-4 my-3 min-h-10 content-center rounded-xl px-3 py-2 text-center text-sm font-bold ${feedback ? 'bg-white text-amber-900' : 'text-teal-800'}`}>{feedback || (creative ? '좋아하는 재료를 골라요. 최대 10개까지 쌓을 수 있어요.' : complete ? '이제 손님께 드릴 차례예요!' : difficulty === 'easy' ? `다음은 ${layers.length + 1}번 ${INGREDIENTS[recipe.layers[layers.length]].label}!` : '주문서에서 다음 재료를 찾아요.')}</p>
      <div className="burger-counter p-3 sm:p-5"><p className="mb-2 text-xs font-bold text-amber-950">신선한 재료 · 그림을 눌러 담아요</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="group" aria-label="재료 고르기">{palette.map((ingredient) => <button key={ingredient.id} aria-label={`${ingredient.label} 놓기`} disabled={creative ? layers.length >= 10 : complete} className="burger-ingredient" onClick={() => place(ingredient.id)}><IngredientPicture id={ingredient.id} className="h-9 w-full" /><span className="text-xs font-bold">{ingredient.label}</span></button>)}</div>
        <div className="mt-3 flex gap-2"><button className="adventure-secondary" disabled={!layers.length} onClick={() => { setLayers((old) => old.slice(0, -1)); setFeedback('한 칸 되돌렸어요. 다시 골라요.'); }}>한 칸 되돌리기</button><button className="adventure-primary flex-1" disabled={!complete} onClick={serve}>{creative ? '내 음식 완성' : '손님께 드리기'}</button></div>
      </div>
    </section>}
  </AdventureFrame>;
}
