# Korean and English UI

The app starts in Korean. Use the language control in the top bar, onboarding, or Settings to switch to English. The choice is stored in `kidsedu-settings` and survives reloads. The document language, title, and description also follow the choice.

Most existing screens contain Korean text directly in components and data. `src/i18n/dom-translator.ts` translates visible text and common accessibility attributes as they appear. `src/i18n/english.json` covers the existing static phrases. Add corrections and new user-facing phrases to `src/i18n/reviewed-english.json`; reviewed entries take priority. For text assembled with changing numbers or user data, render the complete sentence for each language in the component instead of relying on phrase fragments.

Keep Korean letters, example words, and user-entered names unchanged with `data-i18n-ignore`. This lets children study Korean while the surrounding instructions use English. Canvas text needs an explicit language branch, as in `src/motion/runner.ts`.

Run `pnpm exec playwright test e2e/language-switching.spec.ts` to check switching and persistence. Review new screens in both languages before release, especially game feedback and accessible names.
