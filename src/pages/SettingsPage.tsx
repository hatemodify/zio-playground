import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ParentGate } from '@/components/features';
import { useSettingsStore } from '@/stores/settings-store';
import { useProgressStore } from '@/stores/progress-store';
import { useGamificationStore } from '@/stores/gamification-store';
import { CATEGORY_TOTALS, CATEGORY_LABELS } from '@/types/learning';
import { cn } from '@/lib/cn';

type SettingsSection = 'gate' | 'main';

const TIME_LIMIT_OPTIONS = [
  { value: 15, label: '15분' },
  { value: 30, label: '30분' },
  { value: 0, label: '무제한' },
] as const;

export default function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>('gate');
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  // Settings store
  const sfxEnabled = useSettingsStore((s) => s.sfxEnabled);
  const dailyTimeLimit = useSettingsStore((s) => s.dailyTimeLimit);
  const toggleSfx = useSettingsStore((s) => s.toggleSfx);
  const setDailyTimeLimit = useSettingsStore((s) => s.setDailyTimeLimit);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  // Progress store
  const nickname = useProgressStore((s) => s.nickname);
  const setNickname = useProgressStore((s) => s.setNickname);
  const getCategoryProgress = useProgressStore((s) => s.getCategoryProgress);
  const resetProgress = useProgressStore((s) => s.resetProgress);

  // Gamification store
  const totalStars = useGamificationStore((s) => s.totalStars);
  const level = useGamificationStore((s) => s.level);
  const streak = useGamificationStore((s) => s.streak);
  const stickers = useGamificationStore((s) => s.stickers);
  const gameRecords = useGamificationStore((s) => s.gameRecords);
  const resetGamification = useGamificationStore((s) => s.resetGamification);

  const handleGateSuccess = useCallback(() => {
    setSection('main');
  }, []);

  const handleGateCancel = useCallback(() => {
    window.history.back();
  }, []);

  const handleResetAll = useCallback(() => {
    resetProgress();
    resetGamification();
    resetSettings();
    setShowResetModal(false);
    setSection('gate');
  }, [resetProgress, resetGamification, resetSettings]);

  const handleNicknameEdit = useCallback(() => {
    setNicknameInput(nickname);
    setEditingNickname(true);
  }, [nickname]);

  const handleNicknameSave = useCallback(() => {
    const trimmed = nicknameInput.trim();
    if (trimmed.length > 0 && trimmed.length <= 10) {
      setNickname(trimmed);
    }
    setEditingNickname(false);
  }, [nicknameInput, setNickname]);

  // Category progress data
  const numbersProgress = getCategoryProgress('numbers');
  const hangulProgress = getCategoryProgress('hangul');
  const englishProgress = getCategoryProgress('english');

  const totalCompleted = numbersProgress.completed + hangulProgress.completed + englishProgress.completed;
  const totalItems = CATEGORY_TOTALS.numbers + CATEGORY_TOTALS.hangul + CATEGORY_TOTALS.english;

  // Parent gate screen
  if (section === 'gate') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <ParentGate
          open={true}
          onSuccess={handleGateSuccess}
          onCancel={handleGateCancel}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6 p-4 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Profile Section */}
      <section className="rounded-radius-card bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-text-dark">프로필</h2>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-yellow shadow-sm">
            <svg width="40" height="40" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="36" r="28" fill="#FFD93D" />
              <circle cx="30" cy="30" r="5" fill="#2D3436" />
              <circle cx="50" cy="30" r="5" fill="#2D3436" />
              <circle cx="30" cy="27" r="2" fill="white" />
              <circle cx="50" cy="27" r="2" fill="white" />
              <path d="M30 44 Q40 54 50 44" stroke="#2D3436" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="22" cy="18" r="10" fill="#FFD93D" />
              <circle cx="58" cy="18" r="10" fill="#FFD93D" />
            </svg>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            {editingNickname ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNicknameSave(); }}
                  maxLength={10}
                  className="h-10 flex-1 rounded-radius-md border-2 border-primary-light/30 bg-bg-warm px-3 text-base font-semibold text-text-dark focus:border-primary focus:outline-none"
                  autoFocus
                  aria-label="이름 수정"
                />
                <Button variant="primary" size="sm" onClick={handleNicknameSave}>
                  저장
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-dark">
                  {nickname || '이름 없음'}
                </span>
                <button
                  onClick={handleNicknameEdit}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-light hover:bg-bg-warm hover:text-text-medium transition-colors"
                  aria-label="이름 수정"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
            <span className="text-sm text-text-medium">
              Lv.{level} · 별 {totalStars}개 · 연속 {streak}일
            </span>
          </div>
        </div>
      </section>

      {/* Learning Statistics */}
      <section className="rounded-radius-card bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-text-dark">학습 통계</h2>

        {/* Overall Progress */}
        <div className="mb-4 flex items-center gap-3 rounded-radius-lg bg-bg-warm p-3">
          <ProgressCircle
            progress={totalItems > 0 ? totalCompleted / totalItems : 0}
            size={56}
            strokeWidth={5}
            color="var(--color-primary)"
          />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-text-dark">
              전체 진행도
            </span>
            <span className="text-sm text-text-medium">
              {totalCompleted} / {totalItems} 완료
            </span>
          </div>
        </div>

        {/* Category Progress */}
        <div className="flex flex-col gap-3">
          <CategoryProgressBar
            label={CATEGORY_LABELS.numbers}
            completed={numbersProgress.completed}
            total={numbersProgress.total}
            color="var(--color-numbers)"
          />
          <CategoryProgressBar
            label={CATEGORY_LABELS.hangul}
            completed={hangulProgress.completed}
            total={hangulProgress.total}
            color="var(--color-hangul)"
          />
          <CategoryProgressBar
            label={CATEGORY_LABELS.english}
            completed={englishProgress.completed}
            total={englishProgress.total}
            color="var(--color-english)"
          />
        </div>

        {/* Game & Sticker stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-radius-md bg-bg-soft p-3 text-center">
            <span className="block text-2xl font-bold text-games">{gameRecords.length}</span>
            <span className="text-xs text-text-medium">게임 기록</span>
          </div>
          <div className="rounded-radius-md bg-bg-soft p-3 text-center">
            <span className="block text-2xl font-bold text-accent-yellow">{stickers.length}</span>
            <span className="text-xs text-text-medium">수집 스티커</span>
          </div>
        </div>
      </section>

      {/* Sound Settings */}
      <section className="rounded-radius-card bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-text-dark">사운드 설정</h2>

        {/* SFX Toggle */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-warm text-primary">
              {sfxEnabled ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 8V12H6L10 16V4L6 8H3Z" fill="currentColor" />
                  <path d="M13 7C13.6 7.7 14 8.8 14 10C14 11.2 13.6 12.3 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M15 5C16.2 6.2 17 8 17 10C17 12 16.2 13.8 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 8V12H6L10 16V4L6 8H3Z" fill="currentColor" opacity="0.4" />
                  <path d="M14 8L18 12M18 8L14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <span className="text-base font-medium text-text-dark">효과음</span>
          </div>
          <ToggleSwitch checked={sfxEnabled} onChange={toggleSfx} label="효과음 켜기/끄기" />
        </div>
      </section>

      {/* Time Limit */}
      <section className="rounded-radius-card bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-text-dark">학습 시간 제한</h2>
        <p className="mb-3 text-sm text-text-medium">
          하루 학습 시간을 설정해주세요
        </p>
        <div className="flex gap-3">
          {TIME_LIMIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDailyTimeLimit(option.value)}
              className={cn(
                'flex-1 rounded-radius-lg py-3.5 text-base font-semibold transition-colors',
                'min-h-[56px] touch-manipulation',
                dailyTimeLimit === option.value
                  ? 'bg-accent-orange text-white shadow-button'
                  : 'bg-bg-warm text-text-medium hover:bg-bg-soft',
              )}
              aria-pressed={dailyTimeLimit === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Data Reset */}
      <section className="rounded-radius-card bg-white p-5 shadow-card">
        <h2 className="mb-3 text-lg font-bold text-text-dark">데이터 관리</h2>
        <p className="mb-4 text-sm text-text-medium">
          모든 학습 기록, 별, 스티커가 초기화됩니다. 되돌릴 수 없습니다.
        </p>
        <Button
          variant="ghost"
          size="md"
          onClick={() => setShowResetModal(true)}
          className="!text-error hover:!bg-error/5"
        >
          데이터 초기화
        </Button>
      </section>

      {/* Reset Confirmation Modal */}
      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="정말 초기화할까요?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-text-medium">
            모든 학습 기록, 별 {totalStars}개, 스티커 {stickers.length}개가 영구 삭제됩니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setShowResetModal(false)}
            >
              취소
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1 !bg-error hover:!bg-error/90"
              onClick={handleResetAll}
            >
              초기화
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// --- Sub-components ---

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-8 w-14 rounded-full transition-colors duration-200',
        'touch-manipulation',
        checked ? 'bg-success' : 'bg-text-light/30',
      )}
    >
      <motion.div
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </button>
  );
}

interface CategoryProgressBarProps {
  label: string;
  completed: number;
  total: number;
  color: string;
}

function CategoryProgressBar({ label, completed, total, color }: CategoryProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-sm font-medium text-text-dark">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-bg-soft">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="w-16 text-right text-xs font-medium text-text-medium">
        {completed}/{total}
      </span>
    </div>
  );
}

interface ProgressCircleProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}

function ProgressCircle({ progress, size, strokeWidth, color }: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}
