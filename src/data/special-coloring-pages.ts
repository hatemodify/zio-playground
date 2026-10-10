type SpecialCollection = 'elsa-coloring-pages' | 'spiderman-coloring-pages' | 'paw-patrol-coloring-pages';

export interface SpecialColoringPage {
  id: string;
  nameKo: string;
  nameEn: string;
  group: SpecialCollection;
  icon: string;
  pdfUrl: string;
  previewUrl: string;
  sourceUrl: string;
}

const RESOURCE_ORIGIN = 'https://resources.homemade-gifts-made-easy.com';
const SOURCE_ORIGIN = 'https://www.homemade-gifts-made-easy.com';

const pages: Array<{
  slug: string;
  group: SpecialCollection;
  nameKo: string;
  nameEn: string;
  previewSize: '400x518' | '400x309';
  icon: string;
}> = [
  { slug: 'elsa-coloring-pages-easy-snowflake-ice-princess', group: 'elsa-coloring-pages', nameKo: '엘사 눈꽃', nameEn: 'Elsa Snowflake', previewSize: '400x518', icon: '❄️' },
  { slug: 'elsa-coloring-pages-with-anna-and-olaf', group: 'elsa-coloring-pages', nameKo: '엘사·안나·올라프', nameEn: 'Elsa, Anna & Olaf', previewSize: '400x518', icon: '❄️' },
  { slug: 'elsa-coloring-pages-young-elsa-and-anna-ice-skating', group: 'elsa-coloring-pages', nameKo: '엘사와 안나의 스케이트', nameEn: 'Elsa & Anna Skating', previewSize: '400x309', icon: '⛸️' },
  { slug: 'elsa-coloring-pages-easy-cartoon-snowball-fight-snowman-olaf', group: 'elsa-coloring-pages', nameKo: '올라프 눈싸움', nameEn: 'Olaf Snowball Fight', previewSize: '400x309', icon: '⛄' },
  { slug: 'elsa-coloring-pages-easy-elsa-dress-arms-crossed-smirking-outline', group: 'elsa-coloring-pages', nameKo: '팔짱 낀 엘사', nameEn: 'Elsa with Arms Crossed', previewSize: '400x518', icon: '❄️' },
  { slug: 'elsa-coloring-pages-easy-elsa-waving-outline-to-color', group: 'elsa-coloring-pages', nameKo: '손 흔드는 엘사', nameEn: 'Elsa Waving', previewSize: '400x518', icon: '❄️' },
  { slug: 'spiderman-coloring-pages-cute-spiderman-with-balloons', group: 'spiderman-coloring-pages', nameKo: '풍선을 든 스파이더맨', nameEn: 'Spider-Man with Balloons', previewSize: '400x518', icon: '🕸️' },
  { slug: 'spiderman-coloring-pages-kawaii-spiderman-pretending-cptAmerica', group: 'spiderman-coloring-pages', nameKo: '방패 든 스파이더맨', nameEn: 'Spider-Man with a Shield', previewSize: '400x518', icon: '🕸️' },
  { slug: 'paw-patrol-coloring-pages-chase-standing-proudly', group: 'paw-patrol-coloring-pages', nameKo: '퍼피 구조대 체이스', nameEn: 'PAW Patrol Chase', previewSize: '400x518', icon: '🐾' },
  { slug: 'paw-patrol-coloring-pages-marshall-sitting-panting', group: 'paw-patrol-coloring-pages', nameKo: '퍼피 구조대 마셜', nameEn: 'PAW Patrol Marshall', previewSize: '400x518', icon: '🐾' },
];

// The PDFs and preview images stay on their original site; the app requests them when needed.
export const SPECIAL_COLORING_PAGES: SpecialColoringPage[] = pages.map(({ slug, group, nameKo, nameEn, previewSize, icon }) => ({
  id: slug,
  group,
  nameKo,
  nameEn,
  icon,
  pdfUrl: `${RESOURCE_ORIGIN}/${group}/${slug}.pdf`,
  previewUrl: `${SOURCE_ORIGIN}/image-files/${slug}-${previewSize}.png`,
  sourceUrl: `${SOURCE_ORIGIN}/${group}.html#${slug}`,
}));
