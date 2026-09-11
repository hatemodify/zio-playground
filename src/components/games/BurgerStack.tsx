import { motion } from 'motion/react';
import { INGREDIENTS, type IngredientId } from '@/data/recipes';

export function IngredientPicture({ id, className = '' }: { id: IngredientId; className?: string }) {
  const added = ['bread', 'dough', 'sauce', 'mushroom', 'pancake', 'cream', 'strawberry', 'banana', 'syrup'].includes(id);
  return <img src={`/assets/illustrations/${added ? 'food' : 'burger'}-${id}.svg`} alt="" draggable={false} className={`select-none object-contain ${className}`} />;
}
export default function BurgerStack({ layers, compact = false }: { layers: IngredientId[]; compact?: boolean }) {
  return <div className={`burger-stage ${compact ? 'burger-stage-compact' : ''}`}>
    <div className="burger-plate" />
    <div className="burger-layers" role="list" aria-label="쌓은 재료">
      {layers.map((id, index) => <motion.div key={`${index}-${id}`} role="listitem" aria-label={`${index + 1}번째 ${INGREDIENTS[id].label}`}
        initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className={`burger-layer ${id === 'bun-top' ? 'burger-layer-top' : ''}`} style={{ zIndex: index + 1 }}><IngredientPicture id={id} /></motion.div>)}
    </div>
    {!layers.length && <p className="absolute inset-x-0 bottom-16 text-center text-sm text-amber-900/50">첫 번째 재료를 놓아봐요!</p>}
  </div>;
}
