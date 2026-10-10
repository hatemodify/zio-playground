import { useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useSettingsStore, type StickerBookTheme } from '@/stores/settings-store';
import { useProgressStore } from '@/stores/progress-store';
import { cn } from '@/lib/cn';

type OnboardingStep = 'welcome' | 'name' | 'done';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const setNickname = useProgressStore((s) => s.setNickname);
  const onboarded = useSettingsStore((s) => s.onboarded);
  const language = useSettingsStore((s) => s.language);
  const setStickerBookTheme = useSettingsStore((s) => s.setStickerBookTheme);

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<StickerBookTheme | null>(null);

  const handleNameSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError('이름을 입력해주세요!');
      return;
    }
    if (trimmed.length > 10) {
      setError('10글자 이하로 입력해주세요!');
      return;
    }
    setNickname(trimmed);
    setStep('done');
  }, [name, setNickname]);

  const handleComplete = useCallback(() => {
    completeOnboarding();
    navigate('/', { replace: true });
  }, [completeOnboarding, navigate]);

  // If already onboarded, redirect to home
  if (onboarded) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-cream p-6">
      <div className="absolute right-4 top-4 z-10"><LanguageSwitcher /></div>
      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            className="flex flex-col items-center gap-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Mascot Ddori */}
            <motion.div
              className="flex h-32 w-32 items-center justify-center rounded-full bg-accent-yellow shadow-reward"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="36" r="28" fill="#FFD93D" />
                <circle cx="30" cy="30" r="5" fill="#2D3436" />
                <circle cx="50" cy="30" r="5" fill="#2D3436" />
                <circle cx="30" cy="27" r="2" fill="white" />
                <circle cx="50" cy="27" r="2" fill="white" />
                <path d="M30 44 Q40 54 50 44" stroke="#2D3436" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="22" cy="18" r="10" fill="#FFD93D" />
                <circle cx="58" cy="18" r="10" fill="#FFD93D" />
                <ellipse cx="20" cy="40" rx="4" ry="3" fill="#FF9FF3" opacity="0.5" />
                <ellipse cx="60" cy="40" rx="4" ry="3" fill="#FF9FF3" opacity="0.5" />
              </svg>
            </motion.div>

            <div className="flex flex-col gap-3">
              <h1 className="font-display text-3xl font-bold text-text-dark">
                안녕! 나는 또리야!
              </h1>
              <p className="text-lg text-text-medium">
                함께 재미있게 공부하자!
              </p>
            </div>

            <div className="w-full max-w-sm">
              <p className="mb-3 text-base font-bold text-text-dark">{language === 'en' ? 'Choose your sticker book' : '스티커북을 골라줘!'}</p>
              <div className="grid grid-cols-2 gap-3">
                {([['boy', '🚗', '남아용', 'Boys', '탈것과 탐험', 'Vehicles and adventures'], ['girl', '🦊', '여아용', 'Girls', '동물과 꽃', 'Animals and flowers']] as const).map(([theme, icon, ko, en, koDetail, enDetail]) => (
                  <button key={theme} type="button" aria-pressed={selectedTheme === theme} onClick={() => { setSelectedTheme(theme); setStickerBookTheme(theme); }}
                    className={cn('min-h-32 rounded-3xl border-4 bg-white p-4 text-center shadow-card transition-transform active:scale-95', selectedTheme === theme ? 'border-primary' : 'border-transparent')}>
                    <span className="block text-4xl" aria-hidden="true">{icon}</span>
                    <span className="mt-1 block text-lg font-extrabold text-text-dark">{language === 'en' ? en : ko}</span>
                    <span className="block text-xs text-text-medium">{language === 'en' ? enDetail : koDetail}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-text-medium">{language === 'en' ? 'You can change this anytime in your sticker book.' : '스티커북에서 언제든 바꿀 수 있어요.'}</p>
            </div>

            <Button
              variant="primary"
              size="xl"
              onClick={() => selectedTheme && setStep('name')}
              disabled={!selectedTheme}
              className="min-w-[200px]"
            >
              시작하기
            </Button>
          </motion.div>
        )}

        {/* Step 2: Name Input */}
        {step === 'name' && (
          <motion.div
            key="name"
            className="flex w-full max-w-[360px] flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Small mascot */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-yellow/60">
              <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="36" r="28" fill="#FFD93D" />
                <circle cx="30" cy="30" r="5" fill="#2D3436" />
                <circle cx="50" cy="30" r="5" fill="#2D3436" />
                <circle cx="30" cy="27" r="2" fill="white" />
                <circle cx="50" cy="27" r="2" fill="white" />
                <path d="M32 42 Q40 48 48 42" stroke="#2D3436" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="22" cy="18" r="10" fill="#FFD93D" />
                <circle cx="58" cy="18" r="10" fill="#FFD93D" />
              </svg>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-bold text-text-dark">
                이름이 뭐야?
              </h2>
              <p className="text-base text-text-medium">
                또리가 불러줄 이름을 알려줘!
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                }}
                placeholder="이름을 입력해줘"
                maxLength={10}
                className={cn(
                  'h-14 w-full rounded-radius-xl border-2 bg-white px-5 text-center text-xl font-semibold text-text-dark',
                  'placeholder:text-text-light/60',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30',
                  'transition-colors',
                  error
                    ? 'border-error focus:border-error'
                    : 'border-primary-light/30 focus:border-primary',
                )}
                autoFocus
                aria-label="이름 입력"
              />
              {error && (
                <motion.p
                  className="text-sm font-medium text-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </div>

            <Button
              variant="primary"
              size="xl"
              onClick={handleNameSubmit}
              disabled={name.trim().length === 0}
              className="min-w-[200px]"
            >
              다음
            </Button>
          </motion.div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <motion.div
            key="done"
            className="flex flex-col items-center gap-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Celebrating mascot */}
            <motion.div
              className="flex h-32 w-32 items-center justify-center rounded-full bg-accent-yellow shadow-reward"
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="36" r="28" fill="#FFD93D" />
                <circle cx="30" cy="28" r="5" fill="#2D3436" />
                <circle cx="50" cy="28" r="5" fill="#2D3436" />
                <circle cx="30" cy="25" r="2" fill="white" />
                <circle cx="50" cy="25" r="2" fill="white" />
                <ellipse cx="40" cy="46" rx="10" ry="7" fill="#2D3436" />
                <ellipse cx="40" cy="44" rx="7" ry="4" fill="#FF6B81" opacity="0.3" />
                <circle cx="22" cy="18" r="10" fill="#FFD93D" />
                <circle cx="58" cy="18" r="10" fill="#FFD93D" />
                <ellipse cx="20" cy="38" rx="4" ry="3" fill="#FF9FF3" opacity="0.5" />
                <ellipse cx="60" cy="38" rx="4" ry="3" fill="#FF9FF3" opacity="0.5" />
                {/* Star decorations */}
                <path d="M12 8L13 11L16 11L14 13L15 16L12 14L9 16L10 13L8 11L11 11Z" fill="#FFD93D" />
                <path d="M68 8L69 11L72 11L70 13L71 16L68 14L65 16L66 13L64 11L67 11Z" fill="#FFD93D" />
              </svg>
            </motion.div>

            {/* Confetti stars */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="pointer-events-none absolute"
                initial={{
                  opacity: 0,
                  x: 0,
                  y: 0,
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  x: (i % 2 === 0 ? 1 : -1) * (40 + i * 20),
                  y: -(60 + i * 15),
                  scale: [0, 1.2, 0.8],
                  rotate: [0, 180 + i * 30],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.2 + i * 0.1,
                  ease: 'easeOut',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1L9.8 5.7L15 6.3L11 9.2L12 14L8 11.5L4 14L5 9.2L1 6.3L6.2 5.7Z"
                    fill={['#FFD93D', '#FF6B81', '#4A90D9', '#2ED573', '#A29BFE', '#FF9FF3'][i]}
                  />
                </svg>
              </motion.div>
            ))}

            <div className="flex flex-col gap-3">
              <h2 className="font-display text-3xl font-bold text-text-dark">
                {language === 'en' ? 'Nice to meet you, ' : '반가워, '}<span data-i18n-ignore>{name.trim()}</span>!
              </h2>
              <p className="text-lg text-text-medium">
                또리와 함께 신나는 학습을 시작하자!
              </p>
            </div>

            <Button
              variant="accent"
              size="xl"
              onClick={handleComplete}
              className="min-w-[200px]"
            >
              학습 시작!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
