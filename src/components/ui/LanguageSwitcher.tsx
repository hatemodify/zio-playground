import { useSettingsStore } from '@/stores/settings-store';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  if (compact) return <button
    type="button"
    data-i18n-ignore
    onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
    aria-label={language === 'ko' ? 'Switch to English' : '한국어로 전환'}
    className="min-h-9 min-w-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700"
  >{language === 'ko' ? 'EN' : '한'}</button>;

  return <div data-i18n-ignore role="group" aria-label="Language / 언어" className="inline-flex rounded-xl bg-slate-100 p-1">
    <button type="button" aria-pressed={language === 'ko'} onClick={() => setLanguage('ko')} className={`min-h-11 rounded-lg px-4 text-sm font-bold ${language === 'ko' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'}`}>한국어</button>
    <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')} className={`min-h-11 rounded-lg px-4 text-sm font-bold ${language === 'en' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'}`}>English</button>
  </div>;
}
