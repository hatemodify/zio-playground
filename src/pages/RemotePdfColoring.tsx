import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import Button from '@/components/ui/Button';
import { UndoRedoControls } from '@/components/features';
import { useSettingsStore } from '@/stores/settings-store';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const PDF_URL = 'https://resources.homemade-gifts-made-easy.com/elsa-coloring-pages/elsa-coloring-pages-easy-snowflake-ice-princess.pdf';
const SOURCE_URL = 'https://www.homemade-gifts-made-easy.com/elsa-coloring-pages.html';
const COLORS = [
  { ko: '하늘색', en: 'Sky blue', value: '#4A90D9' },
  { ko: '보라색', en: 'Purple', value: '#9B7AE5' },
  { ko: '분홍색', en: 'Pink', value: '#F37BA9' },
  { ko: '노란색', en: 'Yellow', value: '#F7CE46' },
  { ko: '초록색', en: 'Green', value: '#69BE91' },
  { ko: '주황색', en: 'Orange', value: '#F59B65' },
  { ko: '갈색', en: 'Brown', value: '#9F745B' },
];

type FillAction = { pixels: Uint32Array; color: string };

/** Find one light area bounded by the PDF's dark outline. */
function findFillRegion(source: Uint8ClampedArray, width: number, height: number, startX: number, startY: number): Uint32Array {
  const length = width * height;
  const start = startY * width + startX;
  if (start < 0 || start >= length) return new Uint32Array();
  const isLine = (index: number) => {
    const offset = index * 4;
    return source[offset] + source[offset + 1] + source[offset + 2] < 630;
  };
  if (isLine(start)) return new Uint32Array();

  const seen = new Uint8Array(length);
  const queue = new Uint32Array(length);
  let head = 0;
  let tail = 1;
  queue[0] = start;
  seen[start] = 1;
  while (head < tail) {
    const index = queue[head++];
    if (isLine(index)) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0 && !seen[index - 1]) { seen[index - 1] = 1; queue[tail++] = index - 1; }
    if (x < width - 1 && !seen[index + 1]) { seen[index + 1] = 1; queue[tail++] = index + 1; }
    if (y > 0 && !seen[index - width]) { seen[index - width] = 1; queue[tail++] = index - width; }
    if (y < height - 1 && !seen[index + width]) { seen[index + width] = 1; queue[tail++] = index + width; }
  }
  // Queue also contains outline pixels. Keep only the area itself.
  const region = new Uint32Array(head);
  let count = 0;
  for (let i = 0; i < head; i++) if (!isLine(queue[i])) region[count++] = queue[i];
  return region.slice(0, count);
}

function colorChannels(hex: string): [number, number, number] {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
}

export default function RemotePdfColoring({ onBack, onComplete }: { onBack: () => void; onComplete: (image: string) => void }) {
  const language = useSettingsStore((state) => state.language);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const sourcePixelsRef = useRef<Uint8ClampedArray | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState(false);
  const [color, setColor] = useState(COLORS[0].value);
  const [history, setHistory] = useState<FillAction[]>([]);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let task: import('pdfjs-dist').PDFDocumentLoadingTask | undefined;
    let renderTask: import('pdfjs-dist').RenderTask | undefined;
    async function loadPdf() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        task = pdfjs.getDocument({ url: PDF_URL });
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.4 });
        const source = document.createElement('canvas');
        source.width = Math.ceil(viewport.width);
        source.height = Math.ceil(viewport.height);
        renderTask = page.render({ canvas: source, viewport });
        await renderTask.promise;
        if (cancelled) return;
        sourceRef.current = source;
        sourcePixelsRef.current = source.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, source.width, source.height).data ?? null;
        setSize({ width: source.width, height: source.height });
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void loadPdf();
    return () => { cancelled = true; renderTask?.cancel(); void task?.destroy(); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    if (!canvas || !source || !size) return;
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixels = ctx.createImageData(size.width, size.height);
    pixels.data.fill(255);
    for (const action of history.slice(0, cursor)) {
      const [red, green, blue] = colorChannels(action.color);
      for (const index of action.pixels) {
        const offset = index * 4;
        pixels.data[offset] = red;
        pixels.data[offset + 1] = green;
        pixels.data[offset + 2] = blue;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }, [size, history, cursor]);

  const fillAt = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const source = sourcePixelsRef.current;
    if (!canvas || !source || !size) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(size.width - 1, Math.floor((event.clientX - rect.left) * size.width / rect.width)));
    const y = Math.max(0, Math.min(size.height - 1, Math.floor((event.clientY - rect.top) * size.height / rect.height)));
    const pixels = findFillRegion(source, size.width, size.height, x, y);
    if (pixels.length === 0) return;
    setHistory((current) => [...current.slice(0, cursor), { pixels, color }].slice(-40));
    setCursor((current) => Math.min(current + 1, 40));
  }, [size, cursor, color]);

  const saveImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'elsa-coloring.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return <div className="art-studio flex flex-col gap-4 px-4 pb-6 pt-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <button type="button" onClick={onBack} className="mb-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-teal-700">{language === 'en' ? '← Other pictures' : '← 다른 그림'}</button>
        <h1 className="text-2xl font-extrabold text-slate-800">{language === 'en' ? '❄️ Elsa Snowflake' : '❄️ 엘사 눈꽃 도안'}</h1>
        <p className="text-sm text-slate-600">{language === 'en' ? 'Choose a color and tap an area to fill it.' : '색을 고르고 원하는 영역을 톡 눌러 채워 보세요.'}</p>
      </div>
      <UndoRedoControls canUndo={cursor > 0} canRedo={cursor < history.length} onUndo={() => setCursor((value) => value - 1)} onRedo={() => setCursor((value) => value + 1)} />
    </div>
    {error && <div role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
      {language === 'en' ? 'The source PDF could not be loaded. Check your internet connection or ' : '원본 PDF를 불러오지 못했어요. 인터넷 연결을 확인하거나 '}
      <a href={PDF_URL} target="_blank" rel="noreferrer" className="font-bold underline">{language === 'en' ? 'open the source PDF' : '원본 PDF 열기'}</a>.
    </div>}
    {!size && !error && <div role="status" className="rounded-2xl bg-white p-8 text-center text-slate-600">{language === 'en' ? 'Loading the coloring page…' : '도안을 불러오는 중이에요…'}</div>}
    {size && <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div role="group" aria-label={language === 'en' ? 'Choose a color' : '색 고르기'} className="flex flex-wrap justify-center gap-3">
        {COLORS.map((option) => <button key={option.value} type="button" aria-label={language === 'en' ? option.en : option.ko} aria-pressed={color === option.value} onClick={() => setColor(option.value)}
          className={`h-11 w-11 rounded-full border-4 ${color === option.value ? 'scale-110 border-slate-700' : 'border-white'}`} style={{ backgroundColor: option.value }} />)}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => { setHistory([]); setCursor(0); }}>{language === 'en' ? 'Start Over' : '처음부터'}</Button>
        <Button size="sm" onClick={saveImage}>{language === 'en' ? 'Save Picture' : '그림 저장'}</Button>
        <Button variant="accent" size="sm" disabled={cursor === 0} onClick={() => { if (canvasRef.current) onComplete(canvasRef.current.toDataURL('image/png')); }}>{language === 'en' ? "I'm Done!" : '완성했어요!'}</Button>
      </div>
    </div>}
    <div className={size ? 'mx-auto w-full max-w-[720px] overflow-hidden rounded-2xl bg-white shadow-card' : 'hidden'}>
      <canvas ref={canvasRef} aria-label={language === 'en' ? 'Elsa coloring page' : '엘사 도안 색칠 화면'}
        className="block w-full cursor-pointer" style={{ aspectRatio: size ? `${size.width} / ${size.height}` : undefined, touchAction: 'manipulation' }}
        onPointerDown={fillAt} />
    </div>
    <p className="text-center text-xs text-slate-500">
      {language === 'en' ? 'The original PDF loads directly from ' : '원본 PDF는 '}
      <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="underline">Homemade Gifts Made Easy</a>
      {language === 'en' ? '. An internet connection is required.' : '에서 직접 불러옵니다. 인터넷 연결이 필요해요.'}
    </p>
  </div>;
}
