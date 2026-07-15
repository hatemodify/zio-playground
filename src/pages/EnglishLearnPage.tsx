import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import LearningScreen from '@/components/features/LearningScreen';
import { ENGLISH_DATA, getEnglishByCharacter } from '@/data';

export default function EnglishLearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = useMemo(() => {
    if (!id) return undefined;
    return getEnglishByCharacter(id);
  }, [id]);

  const currentIndex = useMemo(() => {
    if (!item) return -1;
    return ENGLISH_DATA.findIndex((e) => e.id === item.id);
  }, [item]);

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < ENGLISH_DATA.length - 1) {
      navigate(`/english/${ENGLISH_DATA[currentIndex + 1].uppercase}`, { replace: true });
    } else {
      navigate('/english');
    }
  }, [currentIndex, navigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      navigate(`/english/${ENGLISH_DATA[currentIndex - 1].uppercase}`, { replace: true });
    }
  }, [currentIndex, navigate]);

  if (!item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-lg text-text-medium">알파벳을 찾을 수 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4 flex-1 h-full justify-center">
      <LearningScreen
        id={item.id}
        character={item.uppercase}
        category="english"
        onNext={currentIndex < ENGLISH_DATA.length - 1 ? handleNext : undefined}
        onPrev={currentIndex > 0 ? handlePrev : undefined}
        topContent={
          <div className="flex flex-col items-center gap-3 pt-2">
            <motion.div
              className="flex items-baseline gap-3"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              key={item.id}
            >
              <span className="font-display text-[100px] font-extrabold leading-none text-english">
                {item.uppercase}
              </span>
              <span className="font-display text-[60px] font-bold leading-none text-english/60">
                {item.lowercase}
              </span>
            </motion.div>
          </div>
        }
        bottomContent={
          <div className="flex w-full items-center gap-4 rounded-2xl bg-bg-soft p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-english/15 text-2xl font-bold text-english">
              {item.uppercase}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display text-lg font-bold text-text-dark">{item.word}</span>
              <span className="text-sm text-text-medium">{item.wordKorean}</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
