import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import LearningScreen from '@/components/features/LearningScreen';
import SpeakButton from '@/components/ui/SpeakButton';
import Picture from '@/components/games/Picture';
import ShapeFigure from '@/components/games/ShapeFigure';
import { SHAPES_DATA, getShapeBySlug } from '@/data';
import { voiceId } from '@/data/voice-lines';
import { useAutoSpeak } from '@/hooks/use-voice';

/** 을/를 follows the noun's final consonant: 별을, 타원을, but 세모를. */
const objectOf = (word: string) => `${word}${(word.charCodeAt(word.length - 1) - 0xac00) % 28 ? '을' : '를'}`;

export default function ShapeLearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const shape = useMemo(() => (id ? getShapeBySlug(id) : undefined), [id]);
  const index = shape ? SHAPES_DATA.indexOf(shape) : -1;
  const next = index >= 0 ? SHAPES_DATA[index + 1] : undefined;
  const prev = index > 0 ? SHAPES_DATA[index - 1] : undefined;
  useAutoSpeak(shape ? voiceId.shape('ko', shape.slug) : null);

  const handleNext = useCallback(() => {
    if (next) navigate(`/shapes/${next.slug}`, { replace: true });
  }, [next, navigate]);
  const handlePrev = useCallback(() => {
    if (prev) navigate(`/shapes/${prev.slug}`, { replace: true });
  }, [prev, navigate]);

  if (!shape) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-lg text-text-medium">도형을 찾을 수 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col justify-center gap-2 pb-4">
      <LearningScreen
        id={shape.id}
        character={shape.character}
        category="shapes"
        guideStyle="outline"
        onNext={next ? handleNext : undefined}
        onPrev={prev ? handlePrev : undefined}
        topContent={
          <div className="flex flex-col items-center gap-3 pt-2">
            <motion.div
              key={shape.id}
              initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <ShapeFigure shape={shape} size={150} className="shape-hero" />
            </motion.div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-extrabold text-text-dark">{shape.name}</h2>
              <SpeakButton clip={voiceId.shape('ko', shape.slug)} label={`${shape.name} 듣기`} size="sm" />
            </div>
            <div className="flex items-center gap-1.5 text-lg font-medium text-text-medium">
              {shape.english}
              <SpeakButton clip={voiceId.shape('en', shape.slug)} label={`${shape.english} 듣기`} size="sm" />
            </div>
            <p className="text-center text-sm text-text-medium">{shape.description}</p>
            <span className="rounded-full bg-shapes/12 px-3 py-1 text-sm font-bold text-shapes">
              {shape.corners === 0 ? '뾰족한 꼭짓점이 없어요' : `꼭짓점 ${shape.corners}개`}
            </span>
          </div>
        }
        bottomContent={
          <section className="flex flex-col items-center gap-3 rounded-2xl bg-bg-soft p-4" aria-label="생활 속에서 찾기">
            <span className="text-sm font-medium text-text-medium">생활 속에서 {objectOf(shape.name)} 찾아봐요!</span>
            <ul className="grid w-full grid-cols-3 gap-2">
              {shape.everyday.map((item) => (
                <li key={item.picture} className="shape-everyday">
                  <Picture id={item.picture} label={item.name} className="h-14 w-14" />
                  <span className="text-sm font-bold text-text-dark">{item.name}</span>
                </li>
              ))}
            </ul>
          </section>
        }
      />
    </div>
  );
}
