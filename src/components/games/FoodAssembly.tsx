import { motion } from 'motion/react';
import BurgerStack, { IngredientPicture } from './BurgerStack';
import { INGREDIENTS, type FoodKind, type IngredientId } from '@/data/recipes';

export default function FoodAssembly({ layers, kind, compact = false }: { layers: IngredientId[]; kind: FoodKind; compact?: boolean }) {
  if (kind !== 'pizza') return <BurgerStack layers={layers} compact={compact} />;
  return <div className="pizza-stage" role="list" aria-label="쌓은 재료">
    <div className="pizza-plate" />
    {layers.map((id, index) => <motion.div key={`${index}-${id}`} className="pizza-layer" role="listitem" aria-label={`${index + 1}번째 ${INGREDIENTS[id].label}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      {id === 'dough' ? <div className="pizza-dough" /> : id === 'sauce' ? <div className="pizza-sauce" /> : id === 'cheese' ? <div className="pizza-cheese" /> : <div className="pizza-toppings">{[0, 1, 2, 3, 4].map((spot) => <IngredientPicture key={spot} id={id} className={`pizza-topping pizza-spot-${spot} ${id === 'lettuce' ? 'pizza-herb' : ''}`} />)}</div>}
    </motion.div>)}
    {!layers.length && <p className="relative pt-28 text-center text-sm text-amber-900/60">도우부터 놓아볼까요?</p>}
  </div>;
}
