import { useEffect, useRef, useState } from 'react';
import RewardCelebration from '@/components/features/RewardCelebration';
import { RaceReadyCountdown, RaceSidestepDetector } from '@/motion/raceControl';
import { PoseClassifier, type Landmark, type PoseSnapshot } from '@/motion/poseClassifier';
import { TiltRace, type RaceEvent, type RaceStats } from '@/motion/TiltRace';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSettingsStore } from '@/stores/settings-store';
import { soundManager } from '@/lib/sound-manager';

type CameraStatus = 'idle' | 'loading' | 'running' | 'error';
type RunMode = 'none' | 'practice' | 'pose';
type WorkerMessage = { type: 'ready' } | { type: 'error'; message: string } | { type: 'pose'; landmarks: Landmark[]; capturedAt: number; inferenceMs: number };
type Notice = 'ready' | 'cameraReady' | 'calibrating' | 'countdown' | 'racing' | 'practice' | 'bodyLost' | 'paused' | 'won' | 'lost' | 'stage';

const BONES = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 6], [5, 7]] as const;
const EMPTY: PoseSnapshot = { state: 'NO_BODY', action: 'NONE', bodyDetected: false, confidence: 0, hipDeltaY: 0, shoulderDeltaY: 0, centerDeltaX: 0, calibrationProgress: 0, lastActionAt: null, message: '카메라를 시작하고 전신이 보이도록 서 주세요.' };
const INITIAL_STATS: RaceStats = { phase: 'ready', distance: 0, finish: 1800, score: 0, hearts: 3, stage: 1, speed: 0, coins: 0, fps: 0, lane: 2 };
const primary = 'min-h-12 rounded-2xl bg-[#56e3c5] px-5 py-3 font-black text-[#14223a] shadow-[0_5px_0_#319d89] transition active:translate-y-1 active:shadow-none disabled:opacity-45';
const secondary = 'min-h-12 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 disabled:opacity-45';
const noticeText: Record<Notice, { ko: string; en: string }> = {
  ready: { ko: '카메라를 켜고 화면 중앙에서 보정해 주세요.', en: 'Start the camera and stand in the center to calibrate.' },
  cameraReady: { ko: '전신이 보이도록 서 주세요.', en: 'Stand where your full body is visible.' },
  calibrating: { ko: '중앙에서 2~3초 동안 가만히 서 주세요.', en: 'Stand still in the center for 2–3 seconds.' },
  countdown: { ko: '인식됐어요! 잠시 후 자동으로 출발해요.', en: 'Body detected! The race starts automatically.' },
  racing: { ko: '옆으로 한 번 움직일 때마다 한 차선 이동해요. 중앙에 돌아와도 차는 그대로예요!', en: 'Each sidestep changes one lane. Returning to center keeps the car in its lane!' },
  practice: { ko: '방향키나 화면 버튼을 한 번 누를 때마다 한 차선 이동해요.', en: 'Each arrow key or button press changes one lane.' },
  bodyLost: { ko: '몸이 보이지 않아 멈췄어요. 중앙에 다시 서면 자동으로 이어서 달려요.', en: 'Race paused. Stand in the center again to resume automatically.' },
  paused: { ko: '레이스를 일시정지했어요.', en: 'Race paused.' },
  won: { ko: '완주 성공! 다시 달려 볼까요?', en: 'You finished! Race again?' },
  lost: { ko: '하트를 모두 잃었어요. 다시 도전해 보세요.', en: 'No hearts left. Try again!' },
  stage: { ko: '새 스테이지! 차량이 조금 더 빨라졌어요.', en: 'New stage! Traffic is a little faster.' },
};

export default function TiltRacePage() {
  const language = useSettingsStore((state) => state.language);
  const en = language === 'en';
  const bestScore = useGamificationStore((state) => state.gameRecords.filter((record) => record.gameId === 'tilt-race').reduce((best, record) => Math.max(best, record.score), 0));
  const [notice, setNotice] = useState<Notice>('ready');
  const [error, setError] = useState('');
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [pose, setPose] = useState<PoseSnapshot>(EMPTY);
  const [points, setPoints] = useState<Landmark[]>([]);
  const [stats, setStats] = useState<RaceStats>(INITIAL_STATS);
  const [cameraFps, setCameraFps] = useState(0);
  const [poseFps, setPoseFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [preview, setPreview] = useState(true);
  const [skeleton, setSkeleton] = useState(true);
  const [debug, setDebug] = useState(true);
  const [earned, setEarned] = useState<string[]>([]);
  const [showReward, setShowReward] = useState(false);
  const [lastMove, setLastMove] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gameRef = useRef<TiltRace | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gameFrameRef = useRef(0);
  const cameraFrameRef = useRef(0);
  const classifierRef = useRef(new PoseClassifier({ minBodyHeight: 0.20, minVisibility: 0.45, lostGraceMs: 900 }));
  const sidestepRef = useRef(new RaceSidestepDetector({ centerThreshold: 0.08, stepThreshold: 0.18 }));
  const countdownRef = useRef(new RaceReadyCountdown());
  const poseRef = useRef<PoseSnapshot>(EMPTY);
  const runModeRef = useRef<RunMode>('none');
  const pauseReasonRef = useRef<'body' | 'manual' | null>(null);
  const zoomedRef = useRef(false);
  const lastDetectedRef = useRef(0);
  const lastScanSwitchRef = useRef(0);
  const cameraRunningRef = useRef(false);
  const cameraStartingRef = useRef(false);
  const workerReadyRef = useRef(false);
  const inFlightRef = useRef(false);
  const cameraRunIdRef = useRef(0);
  const lastPoseRef = useRef(0);
  const lastValidBodyRef = useRef(0);
  const lastCaptureRef = useRef(0);
  const lastUiRef = useRef(0);
  const lastPublishedPoseStateRef = useRef<PoseSnapshot['state']>('NO_BODY');
  const lastVideoTimeRef = useRef(-1);
  const lastVideoFramesRef = useRef(0);
  const cameraCountRef = useRef(0);
  const poseCountRef = useRef(0);
  const metricStartRef = useRef(0);
  const raceStartedRef = useRef(0);

  function stopCamera() {
    cameraRunIdRef.current++;
    cameraRunningRef.current = false;
    cameraStartingRef.current = false;
    workerReadyRef.current = false;
    inFlightRef.current = false;
    cancelAnimationFrame(cameraFrameRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    classifierRef.current.reset();
    sidestepRef.current.reset(false);
    countdownRef.current.reset();
    setCountdown(null);
    zoomedRef.current = false;
    setZoomed(false);
    poseRef.current = EMPTY;
    lastPublishedPoseStateRef.current = 'NO_BODY';
    setPose(EMPTY);
    setPoints([]);
    setCameraStatus('idle');
    setCameraFps(0);
    setPoseFps(0);
    if (runModeRef.current === 'pose' && gameRef.current?.stats.phase === 'running') {
      gameRef.current?.pause();
      pauseReasonRef.current = 'body';
      setNotice('bodyLost');
    }
  }
  const stopCameraRef = useRef(stopCamera);
  stopCameraRef.current = stopCamera;
  useEffect(() => () => stopCameraRef.current(), []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden && cameraRunningRef.current) stopCameraRef.current(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!gameCanvasRef.current) return;
    const onEvent = (event: RaceEvent) => {
      if (useSettingsStore.getState().sfxEnabled) {
        const sound = event === 'coin' ? 'star_earned' : event === 'stage' ? 'level_up' : event === 'won' ? 'confetti' : 'wrong';
        void soundManager.play(sound);
      }
      if (event === 'won') {
        const result = gameRef.current?.stats;
        if (!result) return;
        const stars = result.hearts === 3 ? 3 : result.hearts === 2 ? 2 : 1;
        setEarned(useGamificationStore.getState().completeGame({
          runId: crypto.randomUUID(), gameId: 'tilt-race', category: 'play', score: result.score,
          stars, completedAt: new Date().toISOString(), duration: Math.round((performance.now() - raceStartedRef.current) / 1000),
        }));
        setShowReward(true);
        setNotice('won');
      } else if (event === 'lost') setNotice('lost');
      else if (event === 'stage') setNotice('stage');
    };
    const game = new TiltRace(gameCanvasRef.current, onEvent);
    gameRef.current = game;
    let lastUi = performance.now();
    const loop = (now: number) => {
      if (runModeRef.current === 'pose' && game.stats.phase === 'running' && now - lastValidBodyRef.current > 650) {
        game.pause();
        pauseReasonRef.current = 'body';
        countdownRef.current.reset();
        setCountdown(null);
        setStats(game.stats);
        setNotice('bodyLost');
      }
      game.draw(now);
      if (now - lastUi >= 150) { setStats(game.stats); lastUi = now; }
      gameFrameRef.current = requestAnimationFrame(loop);
    };
    gameFrameRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(gameFrameRef.current); gameRef.current = null; };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (!event.repeat && runModeRef.current === 'practice') {
          const direction = event.key === 'ArrowLeft' ? -1 : 1;
          if (gameRef.current?.moveLane(direction)) setLastMove(direction < 0 ? 'LEFT' : 'RIGHT');
        }
      }
    };
    window.addEventListener('keydown', down);
    return () => { window.removeEventListener('keydown', down); };
  }, []);

  async function startCamera() {
    if (cameraStartingRef.current || cameraRunningRef.current || !videoRef.current) return;
    cameraStartingRef.current = true;
    const runId = ++cameraRunIdRef.current;
    setError('');
    setCameraStatus('loading');
    if (!navigator.mediaDevices?.getUserMedia || !window.Worker || !window.createImageBitmap) {
      cameraStartingRef.current = false;
      setError(en ? 'Camera or video processing is unavailable. Use HTTPS or localhost in a current browser.' : '이 브라우저에서는 카메라 또는 영상 처리를 사용할 수 없습니다. HTTPS나 localhost에서 최신 브라우저로 열어 주세요.');
      setCameraStatus('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
      if (cameraRunIdRef.current !== runId) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach(track => track.stop()); return; }
      video.srcObject = stream;
      await video.play();
      if (cameraRunIdRef.current !== runId) return;
      classifierRef.current.reset();
      sidestepRef.current.reset();
      poseRef.current = EMPTY;
      lastValidBodyRef.current = 0;
      lastDetectedRef.current = 0;
      lastScanSwitchRef.current = performance.now();
      zoomedRef.current = false;
      setZoomed(false);
      countdownRef.current.reset();
      setCountdown(null);
      const worker = new Worker(new URL('../motion/pose.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      cameraStartingRef.current = false;
      cameraRunningRef.current = true;
      lastPoseRef.current = performance.now();
      metricStartRef.current = performance.now();
      lastVideoTimeRef.current = -1;
      lastVideoFramesRef.current = video.getVideoPlaybackQuality?.().totalVideoFrames ?? 0;
      cameraCountRef.current = 0;
      poseCountRef.current = 0;
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        if (!cameraRunningRef.current || cameraRunIdRef.current !== runId) return;
        const data = event.data;
        if (data.type === 'error') {
          stopCameraRef.current();
          setError(`Pose: ${data.message}`);
          setCameraStatus('error');
          return;
        }
        if (data.type === 'ready') {
          workerReadyRef.current = true;
          setCameraStatus('running');
          setNotice('cameraReady');
          return;
        }
        inFlightRef.current = false;
        const now = performance.now();
        lastPoseRef.current = now;
        poseCountRef.current++;
        const next = classifierRef.current.update(data.landmarks, now);
        poseRef.current = next;
        if (next.bodyDetected) lastDetectedRef.current = now;
        if (next.bodyDetected && next.calibrationProgress === 1) {
          lastValidBodyRef.current = now;
          const game = gameRef.current;
          const awaitingStart = game?.stats.phase === 'ready' && runModeRef.current === 'none';
          const awaitingResume = game?.stats.phase === 'paused' && runModeRef.current === 'pose' && pauseReasonRef.current === 'body';
          if (awaitingStart || awaitingResume) {
            const result = countdownRef.current.update(Math.abs(next.centerDeltaX) < 0.12, now);
            setCountdown(result.seconds);
            if (result.seconds !== null) setNotice('countdown');
            if (result.complete) {
              if (awaitingStart) {
                runModeRef.current = 'pose';
                game?.start();
                raceStartedRef.current = now;
                setLastMove(null);
                setShowReward(false);
                setEarned([]);
              } else game?.resume();
              pauseReasonRef.current = null;
              sidestepRef.current.reset(false);
              setCountdown(null);
              setStats(game?.stats ?? INITIAL_STATS);
              setNotice('racing');
            }
          } else {
            countdownRef.current.reset();
            setCountdown(null);
          }
          if (runModeRef.current === 'pose' && game?.stats.phase === 'running' && !awaitingStart) {
            const direction = sidestepRef.current.update(next.centerDeltaX, now);
            if (direction !== 0 && game?.moveLane(direction, data.capturedAt)) setLastMove(direction < 0 ? 'LEFT' : 'RIGHT');
          }
        } else if (now - lastValidBodyRef.current > 350) {
          countdownRef.current.reset();
          setCountdown(null);
        }
        if (now - lastUiRef.current >= 90 || next.state !== lastPublishedPoseStateRef.current) {
          setPose(next);
          setPoints(data.landmarks);
          setInferenceMs(Math.round(data.inferenceMs));
          lastUiRef.current = now;
          lastPublishedPoseStateRef.current = next.state;
        }
      };
      worker.onerror = event => {
        stopCameraRef.current();
        setError(`Pose worker: ${event.message}`);
        setCameraStatus('error');
      };
      worker.postMessage({ type: 'init', baseUrl: new URL(import.meta.env.BASE_URL, location.href).href, childMode: true });
      const loop = (now: number) => {
        if (!cameraRunningRef.current || cameraRunIdRef.current !== runId) return;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const totalFrames = video.getVideoPlaybackQuality?.().totalVideoFrames;
          if (totalFrames === undefined) cameraCountRef.current++;
          else {
            cameraCountRef.current += Math.max(0, totalFrames - lastVideoFramesRef.current);
            lastVideoFramesRef.current = totalFrames;
          }
          if (workerReadyRef.current && !inFlightRef.current && now - lastCaptureRef.current >= 40) {
            inFlightRef.current = true;
            lastCaptureRef.current = now;
            const capturedAt = performance.now();
            const sourceWidth = video.videoWidth;
            const sourceHeight = video.videoHeight;
            if (now - lastDetectedRef.current > 1500 && now - lastScanSwitchRef.current > 1500) {
              zoomedRef.current = !zoomedRef.current;
              setZoomed(zoomedRef.current);
              lastScanSwitchRef.current = now;
            }
            const width = Math.round(sourceWidth / 1.4);
            const height = Math.round(sourceHeight / 1.4);
            const crop = zoomedRef.current ? { x: Math.round((sourceWidth - width) / 2), y: Math.round((sourceHeight - height) / 2), width, height, sourceWidth, sourceHeight } : undefined;
            const bitmapPromise = crop ? createImageBitmap(video, crop.x, crop.y, crop.width, crop.height) : createImageBitmap(video);
            bitmapPromise.then(bitmap => {
              if (!cameraRunningRef.current || cameraRunIdRef.current !== runId || !workerRef.current) { bitmap.close(); return; }
              workerRef.current.postMessage({ type: 'frame', bitmap, capturedAt, crop }, [bitmap]);
            }).catch(cause => {
              if (cameraRunIdRef.current !== runId) return;
              stopCameraRef.current();
              setError(`Video frame: ${String(cause)}`);
              setCameraStatus('error');
            });
          }
        }
        if (workerReadyRef.current && now - lastPoseRef.current > 600) {
          poseRef.current = classifierRef.current.update([], now);
          setPose(poseRef.current);
          setPoints([]);
          lastPoseRef.current = now;
        }
        if (now - metricStartRef.current >= 1000) {
          const seconds = (now - metricStartRef.current) / 1000;
          setCameraFps(Math.round(cameraCountRef.current / seconds));
          setPoseFps(Math.round(poseCountRef.current / seconds));
          setLatencyMs(gameRef.current?.poseLatencyMs ?? null);
          cameraCountRef.current = 0;
          poseCountRef.current = 0;
          metricStartRef.current = now;
        }
        cameraFrameRef.current = requestAnimationFrame(loop);
      };
      cameraFrameRef.current = requestAnimationFrame(loop);
    } catch (cause) {
      if (cameraRunIdRef.current !== runId) return;
      stopCameraRef.current();
      const message = cause instanceof DOMException && cause.name === 'NotAllowedError'
        ? (en ? 'Allow camera access.' : '카메라 권한을 허용해 주세요.')
        : cause instanceof DOMException && cause.name === 'NotFoundError'
          ? (en ? 'No camera was found.' : '카메라를 찾을 수 없습니다.')
          : cause instanceof Error ? cause.message : String(cause);
      setError(message);
      setCameraStatus('error');
    }
  }

  const poseReady = cameraStatus === 'running' && pose.bodyDetected && pose.calibrationProgress === 1;
  const poseCentered = poseReady && Math.abs(pose.centerDeltaX) < 0.12;

  function startPractice() {
    runModeRef.current = 'practice';
    pauseReasonRef.current = null;
    countdownRef.current.reset();
    setCountdown(null);
    gameRef.current?.start();
    setLastMove(null);
    raceStartedRef.current = performance.now();
    setShowReward(false);
    setEarned([]);
    setStats(gameRef.current?.stats ?? INITIAL_STATS);
    setNotice('practice');
  }

  function resumeRace() {
    if (runModeRef.current === 'pose' && !poseReady) return;
    if (runModeRef.current === 'pose') {
      lastValidBodyRef.current = performance.now();
      sidestepRef.current.reset(false);
    }
    pauseReasonRef.current = null;
    countdownRef.current.reset();
    setCountdown(null);
    gameRef.current?.resume();
    setStats(gameRef.current?.stats ?? INITIAL_STATS);
    setNotice(runModeRef.current === 'pose' ? 'racing' : 'practice');
  }

  function recalibrate() {
    classifierRef.current.reset();
    sidestepRef.current.reset(false);
    poseRef.current = EMPTY;
    lastPublishedPoseStateRef.current = 'NO_BODY';
    setPose(EMPTY);
    setPoints([]);
    if (runModeRef.current === 'pose') {
      gameRef.current?.pause();
      pauseReasonRef.current = 'body';
    }
    countdownRef.current.reset();
    setCountdown(null);
    setNotice('calibrating');
  }

  function movePracticeLane(direction: -1 | 1) {
    if (runModeRef.current === 'practice' && gameRef.current?.moveLane(direction)) setLastMove(direction < 0 ? 'LEFT' : 'RIGHT');
  }

  const guidance = en
    ? pose.state === 'CALIBRATING'
      ? 'Stand still in the center until calibration finishes.'
      : pose.bodyDetected
        ? pose.calibrationProgress === 1 && !poseCentered
          ? 'Return to the center for automatic start.'
          : 'Ready! The race starts automatically. Step sideways to change lanes.'
        : 'Step back until your full body, including ankles, is visible.'
    : pose.message || (poseReady && !poseCentered ? '화면 중앙으로 돌아오면 자동 출발해요.' : '인식됐어요! 곧 자동 출발해요. 옆으로 움직이면 차선이 바뀝니다.');

  return <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-8 pt-4 text-slate-800 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-black tracking-[.22em] text-[#bd6b6e]">BODY RACE · MEDIAPIPE</p><h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">{en ? "Ddori's Driving Challenge" : '또리의 드라이브 챌린지'}</h1><p className="mt-2 text-sm text-slate-600">{en ? 'Step sideways in front of a fixed camera to change lanes. The car stays in its new lane.' : '고정된 카메라 앞에서 옆으로 움직이면 차선이 바뀌고, 자동차는 그 차선에 머물러요.'}</p></div>
      <div className="flex flex-wrap gap-2"><div className="rounded-full bg-[#172b4d] px-4 py-2 text-sm font-black text-[#8ff0d7]">3 STAGES · 1,800m</div><div className="rounded-full bg-[#fce1b0] px-4 py-2 text-sm font-black text-[#8b5225]">{en ? 'BEST' : '최고 기록'} {bestScore.toLocaleString()}</div></div>
    </header>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
      <section className="overflow-hidden rounded-[30px] border-[5px] border-[#86dce8] bg-[#2b558f] p-2 shadow-[0_20px_60px_rgba(23,73,129,.22)] sm:p-4" aria-label={en ? 'Racing game' : '레이싱 게임'}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 font-black text-white"><span className="text-sm tracking-widest text-[#8ff0d7]">BODY RACE</span><span className="text-sm">STAGE {stats.stage} / 3</span><span className="text-sm" aria-label={en ? `${stats.hearts} hearts left` : `남은 하트 ${stats.hearts}개`}>{'♥'.repeat(stats.hearts)}{'♡'.repeat(3 - stats.hearts)}</span></div>
        <div className="relative overflow-hidden rounded-2xl"><canvas ref={gameCanvasRef} className="block w-full" style={{ aspectRatio: '800 / 480' }} aria-label={en ? 'Avoid traffic and collect stars' : '교통 차량을 피하며 달리는 레이싱 게임'} />{countdown !== null && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#17213e]/45 text-center text-white"><div><div className="text-7xl font-black drop-shadow-lg">{countdown}</div><p className="text-lg font-black">{en ? 'Get ready!' : '출발 준비!'}</p></div></div>}<div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-[#17213e]/70 px-2 py-1 text-xs font-bold text-white sm:bottom-4 sm:left-4 sm:text-sm">{stats.distance} / {stats.finish} m</div></div>
        <div className="grid grid-cols-4 gap-2 p-3 text-center text-white"><Metric label={en ? 'Score' : '점수'} value={stats.score.toLocaleString()} /><Metric label={en ? 'Speed' : '속도'} value={`${stats.speed} km/h`} /><Metric label={en ? 'Lane' : '차선'} value={`${stats.lane} / 3`} /><Metric label={en ? 'Stars' : '별'} value={en ? String(stats.coins) : `${stats.coins}개`} /></div>
        <div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#56e3c5] transition-[width] duration-150" style={{ width: `${Math.min(100, stats.distance / stats.finish * 100)}%` }} /></div>
        <p role="status" className="mt-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white">{noticeText[notice][language]}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.phase === 'paused' && pauseReasonRef.current === 'manual' && <button className={secondary} onClick={resumeRace} disabled={runModeRef.current === 'pose' && !poseReady}>{en ? 'Resume' : '계속하기'}</button>}
          {stats.phase === 'running' && <button className={secondary} onClick={() => { gameRef.current?.pause(); pauseReasonRef.current = 'manual'; setStats(gameRef.current?.stats ?? INITIAL_STATS); setNotice('paused'); }}>{en ? 'Pause' : '일시정지'}</button>}
          {(stats.phase === 'won' || stats.phase === 'lost') && <button className={primary} onClick={() => { runModeRef.current = 'none'; gameRef.current?.reset(); setStats(gameRef.current?.stats ?? INITIAL_STATS); setNotice('ready'); }}>{en ? 'Race again' : '다시 달리기'}</button>}
          <button className={secondary} onClick={startPractice}>{en ? 'Keyboard practice' : '키보드 연습'}</button>
        </div>
      </section>
      <section className="space-y-3 rounded-[30px] border-[4px] border-[#86dce8] bg-[#2b558f] p-3 text-white shadow-lg" aria-label={en ? 'Camera preview' : '카메라 화면'}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-800">
          <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-fill" style={{ transform: 'scaleX(-1)', opacity: preview ? 1 : 0 }} />
          {skeleton && <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={en ? 'Body landmarks' : '몸 관절 위치'}>
            {BONES.map(([a, b]) => points[a]?.visibility > 0.45 && points[b]?.visibility > 0.45 && <line key={`${a}-${b}`} x1={points[a].x * 100} y1={points[a].y * 100} x2={points[b].x * 100} y2={points[b].y * 100} stroke="#5ff4d0" strokeWidth="0.6" />)}
            {points.map((point, index) => point.visibility > 0.45 && <circle key={index} cx={point.x * 100} cy={point.y * 100} r="1.1" fill="#fff7a1" />)}
          </svg>}
          {zoomed && <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-slate-900/75 px-2 py-1 text-xs font-bold text-teal-200">{en ? 'Small body detection' : '작은 체구 확대 인식'}</div>}
          {cameraStatus === 'idle' && <div className="absolute inset-0 grid place-items-center text-center text-sm text-slate-300">{en ? 'Start the camera' : '카메라를 시작해 주세요'}</div>}
        </div>
        <p className="min-h-10 text-sm text-amber-200" role="status">{cameraStatus === 'loading' ? (en ? 'Preparing the camera and pose model…' : '카메라와 Pose 모델을 준비하고 있어요…') : guidance}</p>
        {pose.state === 'CALIBRATING' && <div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full bg-teal-300" style={{ width: `${pose.calibrationProgress * 100}%` }} /></div>}
        <div className="flex flex-wrap gap-2"><button className={primary} onClick={startCamera} disabled={cameraStatus === 'loading' || cameraStatus === 'running'}>{en ? 'Start camera' : '카메라 시작'}</button><button className={secondary} onClick={stopCamera} disabled={cameraStatus === 'idle'}>{en ? 'Stop' : '중지'}</button><button className={secondary} onClick={recalibrate} disabled={cameraStatus !== 'running'}>{en ? 'Recalibrate' : '다시 보정'}</button></div>
        <div className="flex flex-wrap gap-2"><Toggle label={en ? 'Preview' : '미리보기'} checked={preview} onClick={() => setPreview(value => !value)} /><Toggle label={en ? 'Skeleton' : '관절선'} checked={skeleton} onClick={() => setSkeleton(value => !value)} /><Toggle label={en ? 'Debug' : '측정값'} checked={debug} onClick={() => setDebug(value => !value)} /></div>
        <p className="text-xs text-white/65">{en ? 'Keep the camera fixed. Stand where your full body fits in the frame; small bodies are detected with a closer crop.' : '카메라를 고정하고 전신이 화면에 들어오도록 서 주세요. 작게 보이는 몸은 중앙을 확대해 인식합니다.'}</p>
      </section>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-800">{error}</p>}
    {debug && <section className="rounded-3xl border border-slate-200 bg-white p-4" aria-label={en ? 'Live measurements' : '실시간 측정값'}>
      <h2 className="font-black">{en ? 'Live measurements' : '실시간 측정'}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <DebugMetric label={en ? 'Body' : '몸 인식'} value={pose.bodyDetected ? (en ? 'Detected' : '인식됨') : (en ? 'Missing' : '없음')} />
        <DebugMetric label={en ? 'Pose state' : '자세 상태'} value={pose.state} />
        <DebugMetric label={en ? 'Last move' : '최근 이동'} value={lastMove ?? '—'} />
        <DebugMetric label={en ? 'Confidence' : '관절 신뢰도'} value={pose.confidence.toFixed(2)} />
        <DebugMetric label={en ? 'Camera FPS' : '카메라 FPS'} value={cameraFps} />
        <DebugMetric label="Pose FPS" value={poseFps} />
        <DebugMetric label={en ? 'Render FPS' : '렌더링 FPS'} value={stats.fps} />
        <DebugMetric label={en ? 'Inference' : '추론 시간'} value={`${inferenceMs} ms`} />
        <DebugMetric label="Center ΔX" value={pose.centerDeltaX.toFixed(3)} />
        <DebugMetric label={en ? 'Capture → render' : '캡처→렌더 평균'} value={latencyMs === null ? '—' : `${latencyMs} ms`} />
      </div>
      <p className="mt-3 text-xs text-slate-500">{en ? 'Capture-to-render is a browser-side estimate. It excludes camera exposure and TV mirroring delay.' : '캡처→렌더는 브라우저 내부 근사값이며 카메라 노출·TV 미러링 지연은 포함하지 않습니다.'}</p>
    </section>}
    <div className="grid grid-cols-2 gap-3 sm:hidden"><button className="min-h-16 rounded-2xl bg-[#172b4d] text-2xl font-black text-white touch-none" onPointerDown={() => movePracticeLane(-1)}>← {en ? 'Left' : '왼쪽'}</button><button className="min-h-16 rounded-2xl bg-[#172b4d] text-2xl font-black text-white touch-none" onPointerDown={() => movePracticeLane(1)}>{en ? 'Right' : '오른쪽'} →</button></div>
    <RewardCelebration type="game_complete" stars={stats.hearts} newStickers={earned} open={showReward} onDismiss={() => setShowReward(false)} message={en ? 'You made it to the finish line!' : '결승선까지 멋지게 달렸어요!'} />
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/10 px-2 py-2"><p className="text-[11px] text-white/60">{label}</p><p className="font-black tabular-nums text-white">{value}</p></div>;
}

function DebugMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-black tabular-nums">{value}</p></div>;
}

function Toggle({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return <button className="min-h-10 rounded-xl border border-white/25 px-3 py-2 text-xs font-bold text-white" aria-pressed={checked} onClick={onClick}>{label} {checked ? 'ON' : 'OFF'}</button>;
}
