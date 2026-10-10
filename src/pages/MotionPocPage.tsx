import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PoseClassifier, type Landmark, type PoseSnapshot } from '@/motion/poseClassifier';
import { Runner } from '@/motion/runner';

const BONES = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 6], [5, 7]] as const;
const MIN_INFERENCE_INTERVAL_MS = 33;
const EMPTY: PoseSnapshot = { state: 'NO_BODY', action: 'NONE', bodyDetected: false, confidence: 0, hipDeltaY: 0, shoulderDeltaY: 0, centerDeltaX: 0, calibrationProgress: 0, lastActionAt: null, message: '카메라를 시작하고 전신이 보이도록 서 주세요.' };
type WorkerMessage = { type: 'ready' } | { type: 'error'; message: string } | { type: 'pose'; landmarks: Landmark[]; capturedAt: number; inferenceMs: number };

export default function MotionPocPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef(0);
  const runnerRef = useRef<Runner | null>(null);
  const classifierRef = useRef(new PoseClassifier());
  const inFlightRef = useRef(false);
  const readyRef = useRef(false);
  const runningRef = useRef(false);
  const runIdRef = useRef(0);
  const lastPoseRef = useRef(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'error'>('idle');
  const [error, setError] = useState('');
  const [pose, setPose] = useState<PoseSnapshot>(EMPTY);
  const [points, setPoints] = useState<Landmark[]>([]);
  const [cameraFps, setCameraFps] = useState(0);
  const [poseFps, setPoseFps] = useState(0);
  const [renderFps, setRenderFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [preview, setPreview] = useState(true);
  const [skeleton, setSkeleton] = useState(true);
  const [debug, setDebug] = useState(true);
  const cameraCountRef = useRef(0);
  const poseCountRef = useRef(0);
  const metricStartRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const lastVideoFramesRef = useRef(0);
  const lastCaptureRef = useRef(0);
  const lastUiRef = useRef(0);
  const lastPublishedPoseRef = useRef<PoseSnapshot>(EMPTY);

  function stop() {
    runIdRef.current++;
    runningRef.current = false;
    readyRef.current = false;
    inFlightRef.current = false;
    cancelAnimationFrame(frameRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    classifierRef.current.reset();
    runnerRef.current = null;
    setStatus('idle');
    setPose(EMPTY);
    lastPublishedPoseRef.current = EMPTY;
    setPoints([]);
  }
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => () => stopRef.current(), []);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden && runningRef.current) stopRef.current(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  async function start() {
    if (runningRef.current || !videoRef.current || !canvasRef.current) return;
    const runId = ++runIdRef.current;
    setError(''); setStatus('loading');
    if (!navigator.mediaDevices?.getUserMedia || !window.Worker || !window.createImageBitmap) {
      setError('이 브라우저에서는 카메라 또는 영상 처리를 사용할 수 없습니다. HTTPS나 localhost에서 최신 브라우저로 열어 주세요.');
      setStatus('error'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
      if (runIdRef.current !== runId) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach(track => track.stop()); return; }
      video.srcObject = stream;
      await video.play();
      if (runIdRef.current !== runId) return;
      classifierRef.current.reset();
      runnerRef.current = new Runner(canvasRef.current);
      const worker = new Worker(new URL('../motion/pose.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      runningRef.current = true;
      metricStartRef.current = performance.now();
      lastPoseRef.current = performance.now();
      lastVideoTimeRef.current = -1;
      lastVideoFramesRef.current = video.getVideoPlaybackQuality?.().totalVideoFrames ?? 0;
      cameraCountRef.current = 0;
      poseCountRef.current = 0;
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        if (!runningRef.current || runIdRef.current !== runId) return;
        const data = event.data;
        if (data.type === 'error') {
          setError(`Pose 처리 오류: ${data.message}`); stop(); setStatus('error'); return;
        }
        if (data.type === 'ready') { readyRef.current = true; setStatus('running'); return; }
        inFlightRef.current = false;
        lastPoseRef.current = performance.now();
        poseCountRef.current++;
        const next = classifierRef.current.update(data.landmarks, lastPoseRef.current);
        runnerRef.current?.setPose(next, data.capturedAt);
        if (next.state !== lastPublishedPoseRef.current.state || next.action !== lastPublishedPoseRef.current.action || lastPoseRef.current - lastUiRef.current >= 90 || !next.bodyDetected) {
          setPose(next); setPoints(data.landmarks); setInferenceMs(Math.round(data.inferenceMs));
          lastUiRef.current = lastPoseRef.current;
          lastPublishedPoseRef.current = next;
        }
      };
      worker.onerror = event => { setError(`Pose 워커 오류: ${event.message}`); stop(); setStatus('error'); };
      worker.postMessage({ type: 'init', baseUrl: new URL(import.meta.env.BASE_URL, location.href).href });
      const loop = (now: number) => {
        if (!runningRef.current || runIdRef.current !== runId) return;
        runnerRef.current?.draw(now);
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const totalFrames = video.getVideoPlaybackQuality?.().totalVideoFrames;
          if (totalFrames === undefined) cameraCountRef.current++;
          else {
            cameraCountRef.current += Math.max(0, totalFrames - lastVideoFramesRef.current);
            lastVideoFramesRef.current = totalFrames;
          }
          if (readyRef.current && !inFlightRef.current && now - lastCaptureRef.current >= MIN_INFERENCE_INTERVAL_MS) {
            inFlightRef.current = true;
            lastCaptureRef.current = now;
            const capturedAt = performance.now();
            createImageBitmap(video).then(bitmap => {
              if (!runningRef.current || runIdRef.current !== runId || !workerRef.current) { bitmap.close(); return; }
              workerRef.current.postMessage({ type: 'frame', bitmap, capturedAt }, [bitmap]);
            }).catch(cause => { if (runIdRef.current === runId) { inFlightRef.current = false; setError(`영상 프레임 오류: ${String(cause)}`); stop(); setStatus('error'); } });
          }
        }
        if (readyRef.current && now - lastPoseRef.current > 500) {
          const missing = classifierRef.current.update([], now);
          runnerRef.current?.setPose(missing, now);
          setPose(missing); setPoints([]);
          lastPublishedPoseRef.current = missing;
          lastUiRef.current = now;
          lastPoseRef.current = now;
        }
        if (now - metricStartRef.current >= 1000) {
          const seconds = (now - metricStartRef.current) / 1000;
          setCameraFps(Math.round(cameraCountRef.current / seconds));
          setPoseFps(Math.round(poseCountRef.current / seconds));
          setRenderFps(runnerRef.current?.fps ?? 0);
          setLatencyMs(runnerRef.current?.latencyMs ?? null);
          cameraCountRef.current = 0; poseCountRef.current = 0; metricStartRef.current = now;
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch (cause) {
      if (runIdRef.current !== runId) return;
      streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
      const message = cause instanceof DOMException && cause.name === 'NotAllowedError' ? '카메라 권한을 허용해 주세요.' : cause instanceof DOMException && cause.name === 'NotFoundError' ? '카메라를 찾을 수 없습니다.' : cause instanceof Error ? cause.message : String(cause);
      setError(message); setStatus('error');
    }
  }

  const toggleClass = 'min-h-11 rounded-xl border border-slate-500 px-3 py-2 text-sm font-bold text-white';
  return <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 text-slate-800 sm:px-6">
    <header><p className="text-xs font-black tracking-[.2em] text-teal-700">CAMERA MOTION · TECH POC</p><h1 className="mt-1 text-2xl font-black">몸으로 달리는 실험실</h1><p className="mt-2 text-sm text-slate-600">스마트폰을 세워 두고 2~3걸음 뒤에서 전신을 비춰 주세요. 점프·앉기·좌우 이동으로 캐릭터를 조작합니다.</p><Link to="/games/motion-poc/remote" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 font-bold text-white">공기계 점프 전송 실험 →</Link></header>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
      <section className="overflow-hidden rounded-3xl bg-slate-900 p-3 text-white shadow-lg" aria-label="모션 게임">
        <canvas ref={canvasRef} className="w-full rounded-2xl" style={{ aspectRatio: '640 / 260' }} aria-label="장애물을 피하는 러너 게임" />
        <div className="mt-3 flex items-center justify-between gap-3"><div><p className="text-xs text-teal-200">현재 상태</p><p className="font-black">{pose.bodyDetected ? 'BODY_DETECTED · ' : ''}{pose.state}</p></div><span className="rounded-full bg-teal-300 px-3 py-1 text-xs font-black text-slate-900">{pose.action}</span></div>
        <p className="mt-2 min-h-5 text-sm text-amber-200" role="status">{status === 'loading' ? '카메라와 Pose 모델을 준비하고 있어요…' : pose.message}</p>
        {pose.state === 'CALIBRATING' && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full bg-teal-300" style={{ width: `${pose.calibrationProgress * 100}%` }} /></div>}
      </section>
      <section className="space-y-3 rounded-3xl bg-slate-900 p-3 text-white shadow-lg" aria-label="카메라 화면">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-800">
          <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-fill" style={{ transform: 'scaleX(-1)', opacity: preview ? 1 : 0 }} />
          {skeleton && <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="몸 관절 위치">
            {BONES.map(([a, b]) => points[a]?.visibility > 0.55 && points[b]?.visibility > 0.55 && <line key={`${a}-${b}`} x1={points[a].x * 100} y1={points[a].y * 100} x2={points[b].x * 100} y2={points[b].y * 100} stroke="#5ff4d0" strokeWidth="0.6" />)}
            {points.map((point, index) => point.visibility > 0.55 && <circle key={index} cx={point.x * 100} cy={point.y * 100} r="1.1" fill="#fff7a1" />)}
          </svg>}
          {status === 'idle' && <div className="absolute inset-0 grid place-items-center text-center text-sm text-slate-300">카메라 시작을 눌러 주세요</div>}
        </div>
        <div className="flex flex-wrap gap-2"><button className="min-h-11 rounded-xl bg-teal-300 px-5 py-2 font-black text-slate-900 disabled:opacity-50" onClick={start} disabled={status === 'loading' || status === 'running'}>카메라 시작</button><button className={toggleClass} onClick={stop} disabled={status === 'idle'}>중지</button></div>
        <div className="flex flex-wrap gap-2">{([['preview', preview, setPreview, '미리보기'], ['skeleton', skeleton, setSkeleton, '관절선'], ['debug', debug, setDebug, '측정값']] as const).map(([key, checked, setter, label]) => <button key={key} className={toggleClass} aria-pressed={checked} onClick={() => setter(!checked)}>{label} {checked ? 'ON' : 'OFF'}</button>)}</div>
      </section>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-800">{error}</p>}
    {debug && <section className="rounded-3xl border border-slate-200 bg-white p-4" aria-label="성능 측정값"><h2 className="font-black">실시간 측정</h2><div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <Metric label="카메라 FPS" value={cameraFps} /><Metric label="Pose FPS" value={poseFps} /><Metric label="렌더링 FPS" value={renderFps} /><Metric label="추론 시간" value={`${inferenceMs} ms`} />
      <Metric label="관절 신뢰도" value={pose.confidence.toFixed(2)} /><Metric label="Hip ΔY" value={pose.hipDeltaY.toFixed(3)} /><Metric label="Shoulder ΔY" value={pose.shoulderDeltaY.toFixed(3)} /><Metric label="Center ΔX" value={pose.centerDeltaX.toFixed(3)} />
      <Metric label="최근 동작 시각" value={pose.lastActionAt ? new Date(performance.timeOrigin + pose.lastActionAt).toLocaleTimeString('ko-KR') : '—'} /><Metric label="캡처→렌더 평균" value={latencyMs === null ? '—' : `${latencyMs} ms`} />
    </div><p className="mt-3 text-xs text-slate-500">캡처→렌더는 브라우저 안에서 측정한 근사값입니다. 실제 몸 움직임 시작·TV 미러링 지연은 포함하지 않습니다.</p></section>}
  </div>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-black tabular-nums">{value}</p></div>; }
