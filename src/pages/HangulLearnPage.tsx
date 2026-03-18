import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import LearningScreen from '@/components/features/LearningScreen';
import { HANGUL_DATA, getHangulByCharacter } from '@/data';

export default function HangulLearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = useMemo(() => {
    if (!id) return undefined;
    return getHangulByCharacter(id);
  }, [id]);

  const currentIndex = useMemo(() => {
    if (!item) return -1;
    return HANGUL_DATA.findIndex((h) => h.id === item.id);
  }, [item]);

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < HANGUL_DATA.length - 1) {
      navigate(`/hangul/${HANGUL_DATA[currentIndex + 1].character}`, { replace: true });
    } else {
      navigate('/hangul');
    }
  }, [currentIndex, navigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      navigate(`/hangul/${HANGUL_DATA[currentIndex - 1].character}`, { replace: true });
    }
  }, [currentIndex, navigate]);

  if (!item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-lg text-text-medium">글자를 찾을 수 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4 flex-1 h-full justify-center">
      <LearningScreen
        id={item.id}
        character={item.character}
        category="hangul"
        ttsText={item.name}
        ttsLang="ko-KR"
        onNext={currentIndex < HANGUL_DATA.length - 1 ? handleNext : undefined}
        onPrev={currentIndex > 0 ? handlePrev : undefined}
        topContent={
          <div className="flex flex-col items-center gap-3 pt-2">
            <motion.span
              className="text-[100px] font-bold leading-none text-hangul"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              key={item.id}
            >
              {item.character}
            </motion.span>
            <span className="text-base font-medium text-text-medium">{item.name}</span>
          </div>
        }
        bottomContent={
          <div className="flex items-center gap-4 rounded-2xl bg-bg-soft p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-hangul/15 text-2xl font-bold text-hangul">
              {item.character}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-text-dark">{item.representativeWord}</span>
              <span className="text-sm text-text-medium">
                &ldquo;{item.name}&rdquo;이(가) 들어가는 단어
              </span>
            </div>
          </div>
        }
      />
    </div>
  );
}
