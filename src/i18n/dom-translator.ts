import english from './english.json';
import reviewedEnglish from './reviewed-english.json';
import type { AppLanguage } from '@/stores/settings-store';
import { PICTURE_WORDS } from '@/data/picture-content';
import { NUMBERS_DATA } from '@/data/numbers';
import { SHAPES_DATA } from '@/data/shapes';

const translations = english as Record<string, string>;
const reviewed = reviewedEnglish as Record<string, string>;
const translatedText = new WeakMap<Text, { original: string; rendered: string }>();
const translatedAttributes = new WeakMap<Element, Map<string, { original: string; rendered: string }>>();
const attributes = ['aria-label', 'aria-description', 'title', 'placeholder', 'alt'];
const korean = /[가-힣]/;
let currentLanguage: AppLanguage = 'ko';
const lessonWords: Record<string, string> = Object.fromEntries([
  ...PICTURE_WORDS.map((item) => [item.name, item.english]),
  ...NUMBERS_DATA.map((item) => [item.koreanName, item.englishName]),
  ...SHAPES_DATA.map((item) => [item.name, item.english]),
]);

const manual: Record<string, string> = {
  '한글': 'Korean', '영어': 'English', '숫자': 'Numbers', '도형': 'Shapes', '게임': 'Games',
  '홈': 'Home', '설정': 'Settings', '색칠하기': 'Coloring', '다시 하기': 'Try Again',
  '다시 놀기': 'Play Again', '게임 목록': 'Game List', '다른 그림': 'Other Pictures',
  '뒤로 가기': 'Go Back', '확인': 'OK', '취소': 'Cancel', '저장': 'Save', '완료': 'Done',
  '시작하기': 'Start', '다음': 'Next', '계속하기': 'Continue', '처음부터': 'Start Over',
  '쉬움': 'Easy', '보통': 'Medium', '어려움': 'Hard', '포유류': 'Mammals',
  '사과': 'Apple', '토끼': 'Rabbit', '나비': 'Butterfly', '고양이': 'Cat',
  '강아지': 'Puppy', '기린': 'Giraffe', '코끼리': 'Elephant', '우산': 'Umbrella',
  '돼지': 'Pig', '소': 'Cow', '특별': 'Special',
  '몸통과 다리': 'Body and legs', '뿔': 'Horns', '머리와 목': 'Head and neck',
  '무늬': 'Pattern', '귀': 'Ears', '얼굴': 'Face', '이마': 'Forehead',
  '코': 'Nose', '몸통과 코': 'Body and trunk', '입': 'Mouth',
  '노란색': 'Yellow', '빨강': 'Red', '초록': 'Green', '파랑': 'Blue', '보라': 'Purple',
  '좋은 아침!': 'Good morning!', '즐거운 오후!': 'Good afternoon!', '좋은 저녁!': 'Good evening!',
  '신나는 오후!': 'Have a fun afternoon!', '오늘도 잘했어!': 'Great job today!',
  '안녕! 나는 또리야!': "Hi! I'm Ddori!", '함께 재미있게 공부하자!': "Let's learn and play together!",
  '이름이 뭐야?': "What's your name?", '또리가 불러줄 이름을 알려줘!': 'Tell Ddori your name!',
  '오늘도 같이 놀자!': "Let's play together today!", '오늘의 추천 학습': "Today's picks",
  '스티커북': 'Sticker Book', '모은 스티커를 확인해 보세요!': 'See the stickers you collected!',
  '읽어주기': 'Read Aloud', '효과음': 'Sound Effects', '학습 통계': 'Learning Stats',
  '프로필': 'Profile', '데이터 관리': 'Data Management', '데이터 초기화': 'Reset Data',
  '도안은': 'The picture is', '색을 고르고 그림 위를 손가락으로 칠해 보세요.': 'Pick a color and draw on the picture.',
  '포도': 'Grapes', '딸기': 'Strawberry', '풍선': 'Balloon', '별': 'Star',
  '개': 'items', '분': 'minutes', '일': 'days', '초': 'seconds',
  '안': 'Inside', '뒤': 'Behind', '앞': 'In Front', '위': 'Above', '아래': 'Below', '옆': 'Beside',
};

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function translateKorean(source: string): string {
  if (!korean.test(source)) return source;
  const value = normalize(source);
  if (value.length === 1 && !reviewed[value] && !manual[value] && !lessonWords[value]) return source;
  const curated = reviewed[value] ?? manual[value] ?? lessonWords[value];
  const dynamic = curated ? null : translateDynamic(value);
  const translated = curated ?? (dynamic && !korean.test(dynamic) ? dynamic : translations[value]);
  if (!translated || korean.test(translated)) return source;
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  return leading + translated + trailing;
}

function translateDynamic(value: string): string | null {
  let match = value.match(/^(.*)아, 오늘도 같이 놀자!$/);
  if (match) return `${match[1]}, let's play together today!`;
  match = value.match(/^(Pose 처리 오류|Pose 워커 오류|영상 프레임 오류): (.+)$/);
  if (match) return `${reviewed[`${match[1]}:`] ?? match[1]} ${match[2]}`;
  match = value.match(/^연속 (\d+)일째 학습 중!$/);
  if (match) return `${match[1]}-day learning streak!`;
  match = value.match(/^획득한 별 (\d+) \/ 3$/);
  if (match) return `${match[1]} of 3 stars earned`;
  match = value.match(/^(\d+)문제 · (.+) · 시간 제한 없음$/);
  if (match) return `${match[1]} questions · ${translateKorean(match[2])} · No time limit`;
  match = value.match(/^(\d+)잔 주문$/);
  if (match) return `${match[1]} juice orders`;
  match = value.match(/^(\d+)문제 빙고$/);
  if (match) return `${match[1]} bingo questions`;
  match = value.match(/^(\d+)번 자리 비어 있음$/);
  if (match) return `Space ${match[1]}: Empty`;
  match = value.match(/^(\d+)번 자리 (.+)$/);
  if (match) return `Space ${match[1]}: ${translateKorean(match[2])}`;
  match = value.match(/^(.+) 스탬프$/);
  if (match) return `${translateKorean(match[1])} stamp`;
  match = value.match(/^브러시 (\d+)px$/);
  if (match) return `Brush ${match[1]}px`;
  match = value.match(/^구멍 (\d+)$/);
  if (match) return `Hole ${match[1]}`;
  match = value.match(/^숫자 (\d+)$/);
  if (match) return `Number ${match[1]}`;
  match = value.match(/^10개 묶음 (\d+)$/);
  if (match) return `${match[1]} group${match[1] === '1' ? '' : 's'} of ten`;
  match = value.match(/^낱개 (\d+)개$/);
  if (match) return `${match[1]} one${match[1] === '1' ? '' : 's'}`;
  match = value.match(/^(.+) 듣기$/);
  if (match) return `Listen to ${translateKorean(match[1])}`;
  match = value.match(/^(.+) (\d+)$/);
  if (match) return `${translateKorean(match[1])} ${match[2]}`;
  match = value.match(/^(\d+)곳 중 (\d+)곳이 매번 새로 뽑혀요\. 순서와 블록 색도 달라져요\.$/);
  if (match) return `${match[2]} of ${match[1]} stages are chosen each time. Their order and block colors change too.`;
  match = value.match(/^(\d+)일$/);
  if (match) return `${match[1]} day${match[1] === '1' ? '' : 's'}`;
  match = value.match(/^(.+) - (\d+)\/(\d+) 완료$/);
  if (match) return `${translateKorean(match[1])} - ${match[2]}/${match[3]} complete`;
  match = value.match(/^(.+) 색칠하기$/);
  if (match) return `Color ${translateKorean(match[1])}`;
  match = value.match(/^(.+) 완성 예시$/);
  if (match) return `Finished ${translateKorean(match[1])} example`;
  match = value.match(/^(.+) 그림$/);
  if (match) return `${translateKorean(match[1])} picture`;
  match = value.match(/^(.+) 색 채우기$/);
  if (match) return `Fill ${translateKorean(match[1])} with color`;
  match = value.match(/^(.+) 칠하기$/);
  if (match) return `Color ${translateKorean(match[1])}`;
  match = value.match(/^(.+) 카테고리$/);
  if (match) return `${translateKorean(match[1])} category`;
  match = value.match(/^색상 (.+)$/);
  if (match) return `${translateKorean(match[1])} color`;
  match = value.match(/^(\d+)개$/);
  if (match) return `${match[1]} items`;
  match = value.match(/^(\d+)칸$/);
  if (match) return `${match[1]} areas`;
  match = value.match(/^Lv\.(\d+) · 별 (\d+)개 · 연속 (\d+)일$/);
  if (match) return `Level ${match[1]} · ${match[2]} stars · ${match[3]}-day streak`;
  return null;
}

function shouldIgnore(element: Element | null): boolean {
  return !!element?.closest('[data-i18n-ignore], script, style, textarea, [contenteditable="true"]');
}

function translateTextNode(node: Text) {
  if (shouldIgnore(node.parentElement)) return;
  const current = node.nodeValue ?? '';
  const entry = translatedText.get(node) ?? { original: current, rendered: current };
  if (current !== entry.rendered) entry.original = current;
  const next = currentLanguage === 'en' ? translateKorean(entry.original) : entry.original;
  entry.rendered = next;
  translatedText.set(node, entry);
  if (current !== next) node.nodeValue = next;
}

function translateElement(element: Element) {
  if (shouldIgnore(element)) return;
  const saved = translatedAttributes.get(element) ?? new Map<string, { original: string; rendered: string }>();
  for (const name of attributes) {
    const current = element.getAttribute(name);
    if (current === null) continue;
    const entry = saved.get(name) ?? { original: current, rendered: current };
    if (current !== entry.rendered) entry.original = current;
    const next = currentLanguage === 'en' ? translateKorean(entry.original) : entry.original;
    entry.rendered = next;
    saved.set(name, entry);
    if (current !== next) element.setAttribute(name, next);
  }
  translatedAttributes.set(element, saved);
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const element = root as Element;
  translateElement(element);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode.nodeType === Node.TEXT_NODE) translateTextNode(walker.currentNode as Text);
    else translateElement(walker.currentNode as Element);
  }
}

export function startDomTranslation(language: AppLanguage): () => void {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.title = language === 'en' ? 'KidsEdu - Early Learning' : '키즈에듀 - 유아 학습';
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', language === 'en'
    ? 'Early learning games for children ages 4 to 5: numbers, Korean, English, and more.'
    : '4~5세 유아를 위한 숫자, 한글, 영어 학습 앱');
  document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', language === 'en' ? 'KidsEdu' : '키즈에듀');
  translateTree(document.body);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateTree(record.target);
      if (record.type === 'attributes') translateElement(record.target as Element);
      for (const node of record.addedNodes) translateTree(node);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: attributes,
  });
  return () => observer.disconnect();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    currentLanguage = 'ko';
    translateTree(document.body);
  });
}
