import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useVoice } from '@/hooks/use-voice';

interface SpeakButtonProps {
  /** Voice clip id from `voiceId` in data/voice-lines — or a few ids played back to back. */
  clip: string | string[];
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-16 w-16' } as const;
const ICONS = { sm: 18, md: 24, lg: 32 } as const;

/** A round speaker button that plays one pre-recorded line. Hidden entirely when voice is off. */
export default function SpeakButton({ clip, label = '소리 듣기', size = 'md', className }: SpeakButtonProps) {
  const { enabled, speak } = useVoice();
  const [playing, setPlaying] = useState(false);
  if (!enabled) return null;
  const icon = ICONS[size];
  return (
    <motion.button
      type="button"
      aria-label={label}
      data-voice-clip={Array.isArray(clip) ? clip.join(' ') : clip}
      className={cn('speak-button', SIZES[size], playing && 'speak-button-playing', className)}
      whileTap={{ scale: 0.9 }}
      onClick={async (event) => {
        event.stopPropagation();
        setPlaying(true);
        await speak(clip);
        setTimeout(() => setPlaying(false), 700);
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </motion.button>
  );
}
