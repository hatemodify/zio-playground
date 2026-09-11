import type { ColoringPage } from '@/data/coloring-pages';

export default function ColoringArtwork({ page, fills = {}, onFill, className = '' }: {
  page: ColoringPage; fills?: Record<string, string>; onFill?: (id: string) => void; className?: string;
}) {
  return <svg viewBox={page.viewBox} className={className} aria-label={`${page.name} 그림`}>
    {page.artwork.map((part, index) => {
      const region = page.regions.find((item) => item.id === part.regionId);
      return <path key={index} d={part.d} transform={part.transform}
        fill={part.regionId ? fills[part.regionId] ?? '#FFFDF8' : part.color}
        stroke={part.regionId && !fills[part.regionId] ? '#B9ADA0' : 'none'} strokeWidth={0.15} strokeLinejoin="round"
        className={onFill && region ? 'cursor-pointer transition-[fill] duration-200 focus:outline-none focus:stroke-teal-600' : undefined}
        role={onFill && region ? 'button' : undefined} tabIndex={onFill && region ? 0 : undefined}
        aria-label={onFill && region ? `${region.label} 칠하기` : undefined}
        onClick={onFill && region ? () => onFill(region.id) : undefined}
        onKeyDown={onFill && region ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onFill(region.id); }
        } : undefined}
        pointerEvents={!region ? 'none' : undefined} />;
    })}
  </svg>;
}
