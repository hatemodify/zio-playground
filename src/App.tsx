import { useLayoutEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useSettingsStore } from './stores/settings-store';
import { startDomTranslation } from './i18n/dom-translator';

export default function App() {
  const language = useSettingsStore((state) => state.language);
  useLayoutEffect(() => startDomTranslation(language), [language]);
  return <RouterProvider router={router} />;
}
