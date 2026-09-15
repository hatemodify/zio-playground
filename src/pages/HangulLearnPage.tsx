import Picture from '@/components/games/Picture';
import { PICTURE_WORDS } from '@/data/picture-content';
import { useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import LearningScreen from '@/components/features/LearningScreen';
import { HANGUL_DATA, getHangulByCharacter } from '@/data';
import { HANGUL_CONSONANTS, HANGUL_VOWELS, HANGUL_SYLLABLES } from '@/data/hangul';

export default function HangulLearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = useMemo(() => {
    if (!id) return undefined;
    return getHangulByCharacter(id);
  }, [id]);

  const picture = PICTURE_WORDS.find((word) => word.id === item?.wordImage);

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
        key={item.id}
        id={item.id}
        character={item.character}
        category="hangul"
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
            {item.type === 'syllable' ? <p className="hangul-equation" aria-label="글자 조합"><span>{item.consonant}</span> + <span>{item.vowel}</span> = <strong>{item.character}</strong></p> : <span className="text-base font-medium text-text-medium">{item.name}</span>}
          </div>
        }
        bottomContent={
          item.type === 'syllable' ? <section className="hangul-composer" aria-label="글자 만들기">
            <h2 className="mb-3 text-center font-bold text-hangul">자음과 모음을 바꿔 보세요</h2>
            <div className="grid grid-cols-7 gap-1" role="group" aria-label="자음 고르기">{HANGUL_CONSONANTS.map((part) => <button key={part.id} className="hangul-part" aria-label={`자음 ${part.character}`} aria-pressed={part.character === item.consonant} onClick={() => { const next = HANGUL_SYLLABLES.find((syllable) => syllable.consonant === part.character && syllable.vowel === item.vowel); if (next) navigate(`/hangul/${next.character}`, { replace: true }); }}>{part.character}</button>)}</div>
            <div className="mt-3 grid grid-cols-5 gap-1" role="group" aria-label="모음 고르기">{HANGUL_VOWELS.map((part) => <button key={part.id} className="hangul-part" aria-label={`모음 ${part.character}`} aria-pressed={part.character === item.vowel} onClick={() => { const next = HANGUL_SYLLABLES.find((syllable) => syllable.vowel === part.character && syllable.consonant === item.consonant); if (next) navigate(`/hangul/${next.character}`, { replace: true }); }}>{part.character}</button>)}</div>
            <Link className="mt-4 block text-center text-sm font-bold text-hangul underline" to="/hangul?tab=syllable">가나다 글자 목록</Link>
          </section> : <div className="flex items-center gap-4 rounded-2xl bg-bg-soft p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-hangul/15 text-2xl font-bold text-hangul">
              {picture ? <Picture id={picture.id} label={picture.name} className="h-16 w-16" /> : item.character}
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
