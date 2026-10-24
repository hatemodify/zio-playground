import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RewardCelebration from '@/components/features/RewardCelebration';
import { CookieRunner, type CookieRunnerEvent, type CookieRunnerStats } from '@/motion/CookieRunner';
import { acceptAnswer, createOffer, createPeer, parsePacket } from '@/motion/directLink';
import { PoseClassifier, type Landmark, type PoseSnapshot } from '@/motion/poseClassifier';
import { RaceReadyCountdown } from '@/motion/raceControl';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSettingsStore } from '@/stores/settings-store';
import { soundManager } from '@/lib/sound-manager';

type CameraStatus = 'idle' | 'loading' | 'running' | 'error';
type InputMode = 'camera' | 'keyboard' | 'remote' | null;
type Notice = 'ready' | 'looking' | 'calibrating' | 'countdown' | 'running' | 'bodyLost' | 'paused' | 'won' | 'lost' | 'keyboard' | 'remoteWaiting' | 'remoteLost';
type WorkerMessage = { type: 'ready' } | { type: 'error'; message: string } | { type: 'pose'; landmarks: Landmark[]; capturedAt: number; inferenceMs: number };
const EMPTY_POSE: PoseSnapshot = { state: 'NO_BODY', action: 'NONE', bodyDetected: false, confidence: 0, hipDeltaY: 0, shoulderDeltaY: 0, centerDeltaX: 0, calibrationProgress: 0, lastActionAt: null, message: '' };
const INITIAL_STATS: CookieRunnerStats = { phase: 'ready', distance: 0, finish: 1200, score: 0, hearts: 3, treats: 0, stage: 1, fps: 0 };
const BONES = [[0, 1], [0, 2], [1, 3], [2, 3], [4, 6], [5, 7], [2, 4], [3, 5]] as const;
const NOTICES: Record<Notice, { ko: string; en: string }> = {
  ready: { ko: '카메라 앞에 서면 보정 후 자동으로 출발해요. 키보드로도 놀 수 있어요.', en: 'Stand in front of the camera to start automatically, or use the keyboard.' },
  looking: { ko: '전신이 보이도록 화면 중앙에 서 주세요.', en: 'Stand in the center with your full body in view.' },
  calibrating: { ko: '잠깐 가만히 서서 몸을 보정하고 있어요.', en: 'Stand still while the camera calibrates your pose.' },
  countdown: { ko: '준비됐어요! 곧 자동 출발해요.', en: 'Ready! The run starts automatically.' },
  running: { ko: '점프해서 통나무를 넘고, 앉아서 낮은 가지를 피하세요!', en: 'Jump over logs and crouch under candy branches!' },
  bodyLost: { ko: '몸이 보이지 않아 잠깐 멈췄어요. 다시 중앙에 서면 자동으로 이어 달려요.', en: 'Paused while your body is out of view. Return to the center to resume.' },
  paused: { ko: '잠깐 쉬는 중이에요.', en: 'Taking a short break.' },
  won: { ko: '달콤한 숲 완주! 별을 받았어요.', en: 'You finished the sweet forest course!' },
  lost: { ko: '괜찮아요! 다시 달리면 더 멀리 갈 수 있어요.', en: 'Try again and see how far you can run!' },
  keyboard: { ko: '스페이스로 점프, 아래 방향키로 슬라이드해요.', en: 'Press Space to jump and Arrow Down to slide.' },
  remoteWaiting: { ko: '공기계 센서 보정이 끝나면 자동으로 달리기 시작해요.', en: 'The run begins automatically when the phone sensor is calibrated.' },
  remoteLost: { ko: '공기계 연결이 끊겨 잠깐 멈췄어요. 다시 연결해 주세요.', en: 'The phone controller disconnected. Reconnect to continue.' },
};
const primary = 'min-h-12 rounded-2xl bg-[#ffca68] px-5 py-3 font-black text-[#533653] shadow-[0_5px_0_#cf8c51] transition active:translate-y-1 active:shadow-none disabled:opacity-45';
const secondary = 'min-h-12 rounded-2xl border border-white/35 bg-white/15 px-5 py-3 font-black text-white transition hover:bg-white/25 disabled:opacity-45';

export default function CookieRunnerPage() {
  const language = useSettingsStore(state => state.language);
  const en = language === 'en';
  const bestScore = useGamificationStore(state => state.gameRecords.filter(item => item.gameId === 'cookie-runner').reduce((best, item) => Math.max(best, item.score), 0));
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [notice, setNotice] = useState<Notice>('ready');
  const [error, setError] = useState('');
  const [pose, setPose] = useState<PoseSnapshot>(EMPTY_POSE);
  const [points, setPoints] = useState<Landmark[]>([]);
  const [stats, setStats] = useState<CookieRunnerStats>(INITIAL_STATS);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [cameraFps, setCameraFps] = useState(0);
  const [poseFps, setPoseFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [earned, setEarned] = useState<string[]>([]);
  const [showReward, setShowReward] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [theater, setTheater] = useState(false);
  const [remoteOffer, setRemoteOffer] = useState('');
  const [remoteAnswer, setRemoteAnswer] = useState('');
  const [remoteConnected, setRemoteConnected] = useState(false);
  const gameSectionRef = useRef<HTMLElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const remoteSequenceRef = useRef(0);
  const remoteStartTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gameRef = useRef<CookieRunner | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef(0);
  const cameraFrameRef = useRef(0);
  const cameraRunRef = useRef(0);
  const cameraRunningRef = useRef(false);
  const cameraStartingRef = useRef(false);
  const workerReadyRef = useRef(false);
  const inFlightRef = useRef(false);
  const modeRef = useRef<InputMode>(null);
  const pauseReasonRef = useRef<'body' | 'manual' | null>(null);
  const classifierRef = useRef(new PoseClassifier({ minBodyHeight: .20, minVisibility: .45, lostGraceMs: 900 }));
  const readyRef = useRef(new RaceReadyCountdown());
  const lastValidRef = useRef(0);
  const lastDetectedRef = useRef(0);
  const lastScanSwitchRef = useRef(0);
  const zoomRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const lastVideoFramesRef = useRef(0);
  const lastCaptureRef = useRef(0);
  const lastPoseRef = useRef(0);
  const metricStartRef = useRef(0);
  const cameraCountRef = useRef(0);
  const poseCountRef = useRef(0);
  const lastUiRef = useRef(0);
  const startedAtRef = useRef(0);

  useEffect(() => {
    const onFullscreen = () => { if (!document.fullscreenElement) setTheater(false); };
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.fullscreenElement) setTheater(false); };
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('keydown', onEscape);
    return () => { document.removeEventListener('fullscreenchange', onFullscreen); window.removeEventListener('keydown', onEscape); };
  }, []);

  async function toggleTheater() {
    if (theater) {
      if (document.fullscreenElement) await document.exitFullscreen();
      setTheater(false);
    } else {
      setTheater(true);
      try { await gameSectionRef.current?.requestFullscreen?.(); } catch { /* Fixed layout remains usable where fullscreen is unavailable. */ }
    }
  }

  function stopCamera() {
    cameraRunRef.current++;
    cameraRunningRef.current = false; cameraStartingRef.current = false; workerReadyRef.current = false; inFlightRef.current = false;
    cancelAnimationFrame(cameraFrameRef.current);
    workerRef.current?.terminate(); workerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    classifierRef.current.reset(); readyRef.current.reset();
    setCameraStatus('idle'); setPose(EMPTY_POSE); setPoints([]); setCountdown(null); setZoomed(false);
    setCameraFps(0); setPoseFps(0);
    if (modeRef.current === 'camera' && gameRef.current?.stats.phase === 'running') {
      gameRef.current.pause(); pauseReasonRef.current = 'body'; setStats(gameRef.current.stats); setNotice('bodyLost');
    }
  }
  const stopCameraRef = useRef(stopCamera);
  stopCameraRef.current = stopCamera;

  function clearRemoteCountdown() {
    if (remoteStartTimerRef.current !== null) window.clearInterval(remoteStartTimerRef.current);
    remoteStartTimerRef.current = null;
    setCountdown(null);
  }
  function stopRemote() {
    clearRemoteCountdown();
    if (channelRef.current) { channelRef.current.onopen = null; channelRef.current.onclose = null; channelRef.current.onmessage = null; channelRef.current.close(); }
    if (peerRef.current) { peerRef.current.onconnectionstatechange = null; peerRef.current.close(); }
    channelRef.current = null; peerRef.current = null; remoteSequenceRef.current = 0;
    setRemoteConnected(false); setRemoteOffer(''); setRemoteAnswer('');
    if (modeRef.current === 'remote' && gameRef.current?.stats.phase === 'running') {
      gameRef.current.pause(); pauseReasonRef.current = 'body'; setStats(gameRef.current.stats); setNotice('remoteLost');
    }
  }
  const stopRemoteRef = useRef(stopRemote);
  stopRemoteRef.current = stopRemote;
  useEffect(() => () => stopRemoteRef.current(), []);

  function armRemoteStart() {
    if (gameRef.current?.stats.phase === 'running') return;
    clearRemoteCountdown();
    let remaining = 2;
    setCountdown(remaining); setNotice('remoteWaiting');
    remoteStartTimerRef.current = window.setInterval(() => {
      remaining--;
      if (remaining > 0) { setCountdown(remaining); return; }
      clearRemoteCountdown();
      if (channelRef.current?.readyState !== 'open') return;
      const game = gameRef.current;
      if (game?.stats.phase === 'paused' && modeRef.current === 'remote') game.resume();
      else { game?.setJumpOnly(true); game?.start(); startedAtRef.current = performance.now(); setShowReward(false); setEarned([]); }
      modeRef.current = 'remote'; setInputMode('remote'); pauseReasonRef.current = null;
      setStats(game?.stats ?? INITIAL_STATS); setNotice('running');
    }, 1000);
  }

  async function startRemoteDisplay() {
    stopRemoteRef.current();
    if (cameraRunningRef.current) stopCameraRef.current();
    gameRef.current?.reset(); modeRef.current = null; setInputMode(null); setStats(gameRef.current?.stats ?? INITIAL_STATS);
    setError(''); setNotice('remoteWaiting');
    try {
      const peer = createPeer(); peerRef.current = peer;
      peer.onconnectionstatechange = () => {
        if (peerRef.current !== peer) return;
        if (peer.connectionState === 'connected' && channelRef.current?.readyState === 'open') {
          setRemoteConnected(true);
          if (modeRef.current === 'remote' && gameRef.current?.stats.phase === 'paused' && pauseReasonRef.current === 'body') armRemoteStart();
          else setNotice('remoteWaiting');
        }
        if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
          setRemoteConnected(false); clearRemoteCountdown();
          if (modeRef.current === 'remote' && gameRef.current?.stats.phase === 'running') { gameRef.current.pause(); pauseReasonRef.current = 'body'; setStats(gameRef.current.stats); setNotice('remoteLost'); }
        }
      };
      const result = await createOffer(peer);
      if (peerRef.current !== peer) return;
      const channel = result.channel; channelRef.current = channel;
      channel.onopen = () => { if (peerRef.current !== peer) return; setRemoteConnected(true); setNotice('remoteWaiting'); };
      channel.onmessage = event => {
        const packet = parsePacket(event.data);
        if (packet?.type === 'ready') { armRemoteStart(); return; }
        if (!packet || packet.type !== 'jump' || packet.sequence <= remoteSequenceRef.current) return;
        remoteSequenceRef.current = packet.sequence;
        if (modeRef.current === 'remote') gameRef.current?.jump();
        if (channel.readyState === 'open') channel.send(JSON.stringify({ type: 'echo', sequence: packet.sequence, sentAt: packet.sentAt }));
      };
      channel.onclose = () => { if (peerRef.current !== peer) return; setRemoteConnected(false); clearRemoteCountdown(); if (modeRef.current === 'remote') { gameRef.current?.pause(); setStats(gameRef.current?.stats ?? INITIAL_STATS); setNotice('remoteLost'); } };
      setRemoteOffer(result.offer);
    } catch (cause) { stopRemoteRef.current(); setError(cause instanceof Error ? cause.message : String(cause)); }
  }
  async function finishRemoteDisplay() {
    if (!peerRef.current) return;
    try { await acceptAnswer(peerRef.current, remoteAnswer); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }
  async function copyRemoteOffer() {
    try { await navigator.clipboard.writeText(remoteOffer); }
    catch { setError(en ? 'Copy failed. Select the connection text manually.' : '복사하지 못했어요. 연결 정보를 직접 선택해 주세요.'); }
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    const onEvent = (event: CookieRunnerEvent) => {
      if (useSettingsStore.getState().sfxEnabled) {
        const sound = event === 'treat' ? 'star_earned' : event === 'stage' ? 'level_up' : event === 'won' ? 'confetti' : 'wrong';
        void soundManager.play(sound);
      }
      if (event === 'won') {
        const result = gameRef.current?.stats;
        if (!result) return;
        const stars = result.hearts;
        setEarned(useGamificationStore.getState().completeGame({ runId: crypto.randomUUID(), gameId: 'cookie-runner', category: 'play', score: result.score, stars, completedAt: new Date().toISOString(), duration: Math.round((performance.now() - startedAtRef.current) / 1000) }));
        setShowReward(true); setNotice('won'); setStats(result);
      } else if (event === 'lost') { setNotice('lost'); setStats(gameRef.current?.stats ?? INITIAL_STATS); }
    };
    const game = new CookieRunner(canvasRef.current, onEvent);
    gameRef.current = game;
    let lastUi = 0;
    const loop = (now: number) => {
      if (modeRef.current === 'camera' && game.stats.phase === 'running' && now - lastValidRef.current > 700) {
        game.pause(); pauseReasonRef.current = 'body'; readyRef.current.reset(); setCountdown(null); setStats(game.stats); setNotice('bodyLost');
      }
      game.draw(now);
      if (now - lastUi > 120) { setStats(game.stats); lastUi = now; }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    const keydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.repeat) return;
      if (modeRef.current !== 'keyboard') return;
      if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); game.jump(); }
      if (event.code === 'ArrowDown') { event.preventDefault(); game.slide(performance.now()); }
    };
    window.addEventListener('keydown', keydown);
    const onVisibility = () => { if (document.hidden && cameraRunningRef.current) stopCameraRef.current(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('keydown', keydown); document.removeEventListener('visibilitychange', onVisibility); cancelAnimationFrame(frameRef.current); stopCameraRef.current(); gameRef.current = null; };
  }, []);

  function startKeyboard() {
    if (peerRef.current) stopRemoteRef.current();
    readyRef.current.reset(); setCountdown(null);
    modeRef.current = 'keyboard'; setInputMode('keyboard'); pauseReasonRef.current = null;
    gameRef.current?.setJumpOnly(false);
    gameRef.current?.start(); startedAtRef.current = performance.now();
    setStats(gameRef.current?.stats ?? INITIAL_STATS); setShowReward(false); setEarned([]); setNotice('keyboard');
  }
  function restart() {
    if (peerRef.current) stopRemoteRef.current();
    gameRef.current?.reset(); modeRef.current = null; setInputMode(null); pauseReasonRef.current = null;
    readyRef.current.reset(); setCountdown(null); setShowReward(false); setEarned([]);
    setStats(gameRef.current?.stats ?? INITIAL_STATS); setNotice(cameraRunningRef.current ? 'looking' : 'ready');
  }
  function replayRemote() {
    if (channelRef.current?.readyState !== 'open') return;
    gameRef.current?.reset(); gameRef.current?.setJumpOnly(true);
    modeRef.current = 'remote'; setInputMode('remote');
    setStats(gameRef.current?.stats ?? INITIAL_STATS);
    armRemoteStart();
  }
  function togglePause() {
    const game = gameRef.current;
    if (!game) return;
    if (game.stats.phase === 'running') { game.pause(); pauseReasonRef.current = 'manual'; setNotice('paused'); }
    else if (game.stats.phase === 'paused' && pauseReasonRef.current === 'manual') {
      if (modeRef.current === 'camera' && (!pose.bodyDetected || pose.calibrationProgress !== 1)) return;
      game.resume(); pauseReasonRef.current = null; lastValidRef.current = performance.now(); setNotice(modeRef.current === 'keyboard' ? 'keyboard' : 'running');
    }
    setStats(game.stats);
  }
  function recalibrate() {
    classifierRef.current.reset(); readyRef.current.reset(); setPose(EMPTY_POSE); setPoints([]); setCountdown(null);
    if (modeRef.current === 'camera' && gameRef.current?.stats.phase === 'running') { gameRef.current.pause(); pauseReasonRef.current = 'body'; setStats(gameRef.current.stats); }
    setNotice('calibrating');
  }

  async function startCamera() {
    if (cameraStartingRef.current || cameraRunningRef.current || !videoRef.current) return;
    if (peerRef.current) { stopRemoteRef.current(); gameRef.current?.reset(); modeRef.current = null; setInputMode(null); setStats(gameRef.current?.stats ?? INITIAL_STATS); }
    cameraStartingRef.current = true;
    const runId = ++cameraRunRef.current;
    setError(''); setCameraStatus('loading');
    if (!navigator.mediaDevices?.getUserMedia || !window.Worker || !window.createImageBitmap) {
      cameraStartingRef.current = false; setCameraStatus('error'); setError(en ? 'Camera processing needs HTTPS or localhost in a current browser.' : '카메라 처리는 최신 브라우저의 HTTPS 또는 localhost에서 사용할 수 있어요.'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
      if (cameraRunRef.current !== runId) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach(track => track.stop()); return; }
      video.srcObject = stream; await video.play();
      if (cameraRunRef.current !== runId) return;
      classifierRef.current.reset(); readyRef.current.reset();
      lastValidRef.current = 0; lastDetectedRef.current = 0; lastScanSwitchRef.current = performance.now(); zoomRef.current = false; setZoomed(false);
      const worker = new Worker(new URL('../motion/pose.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker; cameraRunningRef.current = true; cameraStartingRef.current = false;
      metricStartRef.current = performance.now(); lastPoseRef.current = performance.now(); lastVideoTimeRef.current = -1;
      lastVideoFramesRef.current = video.getVideoPlaybackQuality?.().totalVideoFrames ?? 0;
      cameraCountRef.current = 0; poseCountRef.current = 0;
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        if (!cameraRunningRef.current || cameraRunRef.current !== runId) return;
        const data = event.data;
        if (data.type === 'error') { stopCameraRef.current(); setCameraStatus('error'); setError(data.message); return; }
        if (data.type === 'ready') { workerReadyRef.current = true; setCameraStatus('running'); if (modeRef.current !== 'keyboard') setNotice('looking'); return; }
        inFlightRef.current = false;
        const now = performance.now(); lastPoseRef.current = now; poseCountRef.current++;
        const next = classifierRef.current.update(data.landmarks, now);
        if (next.bodyDetected) lastDetectedRef.current = now;
        if (now - lastUiRef.current > 90 || next.state === 'CALIBRATING') { setPose(next); setPoints(data.landmarks); setInferenceMs(Math.round(data.inferenceMs)); lastUiRef.current = now; }
        if (next.bodyDetected && next.calibrationProgress === 1) {
          lastValidRef.current = now;
          const game = gameRef.current;
          const awaitingStart = game?.stats.phase === 'ready' && modeRef.current === null;
          const awaitingResume = game?.stats.phase === 'paused' && modeRef.current === 'camera' && pauseReasonRef.current === 'body';
          if (awaitingStart || awaitingResume) {
            const result = readyRef.current.update(Math.abs(next.centerDeltaX) < .12, now);
            setCountdown(result.seconds);
            if (result.seconds !== null) setNotice('countdown');
            if (result.complete) {
              if (awaitingStart) {
                modeRef.current = 'camera'; setInputMode('camera'); game?.setJumpOnly(false); game?.start(); startedAtRef.current = now;
                setShowReward(false); setEarned([]);
              } else game?.resume();
              pauseReasonRef.current = null; setCountdown(null); setStats(game?.stats ?? INITIAL_STATS); setNotice('running');
            }
          } else { readyRef.current.reset(); setCountdown(null); }
          if (modeRef.current === 'camera' && game?.stats.phase === 'running' && !awaitingStart) {
            if (next.action === 'JUMP') game.jump();
            else if (next.action === 'CROUCH') game.slide(now);
          }
        } else if (now - lastValidRef.current > 350) { readyRef.current.reset(); setCountdown(null); if (next.state === 'CALIBRATING' && modeRef.current !== 'keyboard') setNotice('calibrating'); }
      };
      worker.onerror = event => { stopCameraRef.current(); setCameraStatus('error'); setError(event.message); };
      worker.postMessage({ type: 'init', baseUrl: new URL(import.meta.env.BASE_URL, location.href).href, childMode: true });
      const loop = (now: number) => {
        if (!cameraRunningRef.current || cameraRunRef.current !== runId) return;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const frames = video.getVideoPlaybackQuality?.().totalVideoFrames;
          if (frames === undefined) cameraCountRef.current++;
          else { cameraCountRef.current += Math.max(0, frames - lastVideoFramesRef.current); lastVideoFramesRef.current = frames; }
          if (workerReadyRef.current && !inFlightRef.current && now - lastCaptureRef.current >= 40) {
            inFlightRef.current = true; lastCaptureRef.current = now;
            const capturedAt = performance.now();
            const sourceWidth = video.videoWidth; const sourceHeight = video.videoHeight;
            if (now - lastDetectedRef.current > 1500 && now - lastScanSwitchRef.current > 1500) { zoomRef.current = !zoomRef.current; setZoomed(zoomRef.current); lastScanSwitchRef.current = now; }
            const width = Math.round(sourceWidth / 1.4); const height = Math.round(sourceHeight / 1.4);
            const crop = zoomRef.current && width > 0 && height > 0 ? { x: Math.round((sourceWidth - width) / 2), y: Math.round((sourceHeight - height) / 2), width, height, sourceWidth, sourceHeight } : undefined;
            const bitmapPromise = crop ? createImageBitmap(video, crop.x, crop.y, crop.width, crop.height) : createImageBitmap(video);
            bitmapPromise.then(bitmap => {
              if (!cameraRunningRef.current || cameraRunRef.current !== runId || !workerRef.current) { bitmap.close(); return; }
              workerRef.current.postMessage({ type: 'frame', bitmap, capturedAt, crop }, [bitmap]);
            }).catch(cause => { if (cameraRunRef.current === runId) { stopCameraRef.current(); setCameraStatus('error'); setError(String(cause)); } });
          }
        }
        if (workerReadyRef.current && now - lastPoseRef.current > 600) {
          const missing = classifierRef.current.update([], now); setPose(missing); setPoints([]); lastPoseRef.current = now;
        }
        if (now - metricStartRef.current >= 1000) {
          const seconds = (now - metricStartRef.current) / 1000;
          setCameraFps(Math.round(cameraCountRef.current / seconds)); setPoseFps(Math.round(poseCountRef.current / seconds));
          cameraCountRef.current = 0; poseCountRef.current = 0; metricStartRef.current = now;
        }
        cameraFrameRef.current = requestAnimationFrame(loop);
      };
      cameraFrameRef.current = requestAnimationFrame(loop);
    } catch (cause) {
      if (cameraRunRef.current !== runId) return;
      stopCameraRef.current(); setCameraStatus('error');
      setError(cause instanceof DOMException && cause.name === 'NotAllowedError' ? (en ? 'Allow camera access to play with your body.' : '몸으로 놀려면 카메라 권한을 허용해 주세요.') : cause instanceof Error ? cause.message : String(cause));
    }
  }

  const cameraReady = cameraStatus === 'running' && pose.bodyDetected && pose.calibrationProgress === 1;
  return <div className="mx-auto w-full max-w-7xl space-y-5 px-4 pb-10 pt-4 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-black tracking-[.22em] text-[#ad6197]">SWEET FOREST · BODY RUN</p><h1 className="mt-1 font-display text-3xl font-black text-[#4b315e] sm:text-4xl">{en ? 'Sweet Forest Dash' : '달콤한 숲 달리기'}</h1><p className="mt-2 text-sm font-semibold text-[#795f83]">{en ? 'Run with a cookie friend through a colorful candy forest.' : '쿠키 친구와 함께 달콤한 숲을 달려요.'}</p></div>
      <Link to="/games" className="rounded-full border border-[#d9b6d4] bg-white/80 px-4 py-2 text-sm font-bold text-[#775778]">← {en ? 'All games' : '게임 목록'}</Link>
    </header>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section ref={gameSectionRef} className={`${theater ? 'fixed inset-0 z-[100] flex flex-col justify-center overflow-y-auto rounded-none border-0 p-3' : 'overflow-hidden rounded-[30px] border-[6px] border-[#f6a7c7] p-2 sm:p-3'} bg-[#69448f] shadow-[0_24px_60px_rgba(81,48,111,.24)]`} aria-label={en ? 'Sweet Forest Dash game' : '달콤한 숲 달리기 게임'}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-white"><div><span className="text-xs font-black tracking-[.15em] text-[#ffe49f]">SWEET FOREST</span><span className="ml-3 text-xs font-bold text-white/70">STAGE {stats.stage} / 3</span></div><div className="flex items-center gap-3 text-sm font-black"><span>✦ {stats.score.toLocaleString()}</span><span aria-label={en ? `${stats.hearts} hearts left` : `남은 하트 ${stats.hearts}개`} className="text-[#ff9caa]">{'♥'.repeat(stats.hearts)}{'♡'.repeat(3 - stats.hearts)}</span>{theater && (stats.phase === 'ready' || stats.phase === 'won' || stats.phase === 'lost') && <button className="rounded-lg border border-white/30 px-2 py-1 text-xs font-bold text-white" onClick={remoteConnected ? replayRemote : startKeyboard}>{remoteConnected ? (en ? 'Run again' : '다시 달리기') : (en ? 'Play' : '시작')}</button>}{theater && stats.phase === 'running' && <button className="rounded-lg border border-white/30 px-2 py-1 text-xs font-bold text-white" onClick={togglePause}>{en ? 'Pause' : '일시정지'}</button>}{theater && stats.phase === 'paused' && pauseReasonRef.current === 'manual' && <button className="rounded-lg border border-white/30 px-2 py-1 text-xs font-bold text-white" onClick={togglePause}>{en ? 'Resume' : '계속하기'}</button>}<button className="rounded-lg border border-white/30 px-2 py-1 text-xs font-bold text-white" onClick={toggleTheater}>{theater ? (en ? 'Exit full screen' : '전체 화면 닫기') : (en ? 'Full screen' : '전체 화면')}</button></div></div>
        <div className="relative mx-auto overflow-hidden rounded-[22px] border-[3px] border-[#fff0b1] bg-[#a5e3ef]" style={{ width: theater ? 'min(100%, calc((100dvh - 64px) * 1.77778))' : undefined }}><canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: '960 / 540' }} aria-label={en ? 'Cookie runner play field' : '쿠키 러너 플레이 화면'} />
          {(countdown !== null || stats.phase === 'won' || stats.phase === 'lost' || stats.phase === 'paused') && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-white"><div className="rounded-3xl border border-white/40 bg-[#4b346c]/85 px-6 py-4 shadow-xl backdrop-blur-sm"><p className="text-xs font-black tracking-[.2em] text-[#ffe39a]">SWEET FOREST</p><p className="mt-1 text-4xl font-black sm:text-6xl">{countdown ?? (stats.phase === 'won' ? (en ? 'FINISH!' : '완주!') : stats.phase === 'lost' ? (en ? 'TRY AGAIN' : '다시 도전!') : (en ? 'PAUSED' : '잠깐 멈춤'))}</p></div></div>}
        </div>
        <div className={`${theater ? 'hidden' : ''} px-2 pb-1 pt-3 text-white`}><div className="flex items-center justify-between text-xs font-black"><span>{stats.distance} / {stats.finish}m</span><span>{en ? 'BEST' : '최고 기록'} {bestScore.toLocaleString()}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-gradient-to-r from-[#ffcf72] to-[#fd8dad] transition-[width] duration-150" style={{ width: `${stats.distance / stats.finish * 100}%` }} /></div></div>
        <p role="status" className={`${theater ? 'sr-only' : ''} mx-2 my-3 rounded-2xl bg-white/12 px-4 py-3 text-sm font-bold text-white`}>{notice === 'running' && inputMode === 'remote' ? (en ? 'Jump over logs and collect stars with your spare phone!' : '공기계로 점프해 통나무를 넘고 별을 모아요!') : NOTICES[notice][language]}</p>
        <div className={`${theater ? 'hidden' : ''} flex flex-wrap gap-2 px-2 pb-2`}>
          {(stats.phase === 'ready' || stats.phase === 'won' || stats.phase === 'lost') && <button className={primary} onClick={startKeyboard}>{en ? 'Play with keys' : '키보드로 시작'}</button>}
          {remoteConnected && (stats.phase === 'won' || stats.phase === 'lost') && <button className={primary} onClick={replayRemote}>{en ? 'Run again with phone' : '공기계로 다시 달리기'}</button>}
          {(stats.phase === 'won' || stats.phase === 'lost') && <button className={secondary} onClick={restart}>{en ? 'Play with camera' : '카메라로 다시 달리기'}</button>}
          {(stats.phase === 'running' || stats.phase === 'paused' && pauseReasonRef.current === 'manual') && <button className={secondary} onClick={togglePause}>{stats.phase === 'running' ? (en ? 'Pause' : '일시정지') : (en ? 'Resume' : '계속하기')}</button>}
        </div>
        {inputMode === 'keyboard' && stats.phase === 'running' && !theater && <div className="grid grid-cols-2 gap-2 px-2 pb-2"><button className="min-h-16 rounded-2xl bg-[#ffe6ad] text-lg font-black text-[#55365c] touch-none" onPointerDown={() => gameRef.current?.jump()}>↑ {en ? 'JUMP' : '점프'}</button><button className="min-h-16 rounded-2xl bg-[#f7a6c3] text-lg font-black text-[#55365c] touch-none" onPointerDown={() => gameRef.current?.slide(performance.now())}>↓ {en ? 'SLIDE' : '슬라이드'}</button></div>}
        {inputMode === 'keyboard' && stats.phase === 'running' && theater && <div className="pointer-events-none fixed bottom-3 left-3 right-3 z-[101] flex justify-between"><button className="pointer-events-auto min-h-14 rounded-2xl bg-[#ffe6ad]/90 px-5 font-black text-[#55365c] shadow-lg touch-none" onPointerDown={() => gameRef.current?.jump()}>↑ {en ? 'JUMP' : '점프'}</button><button className="pointer-events-auto min-h-14 rounded-2xl bg-[#f7a6c3]/90 px-5 font-black text-[#55365c] shadow-lg touch-none" onPointerDown={() => gameRef.current?.slide(performance.now())}>↓ {en ? 'SLIDE' : '슬라이드'}</button></div>}
      </section>
      <aside className="space-y-4">
        <section className="rounded-[28px] bg-white p-4 shadow-[0_10px_40px_rgba(92,63,109,.12)]" aria-label={en ? 'Camera controller' : '카메라 조작'}>
          <div className="flex items-center justify-between"><h2 className="font-display text-lg font-black text-[#60446f]">{en ? 'Body controller' : '몸으로 조작'}</h2><span className={`h-3 w-3 rounded-full ${cameraReady ? 'bg-[#67c8a3]' : 'bg-[#d9bbc9]'}`} /></div>
          <p className="mt-1 text-xs leading-relaxed text-[#8a708c]">{en ? 'Keep the device fixed. Your full body should fit in the frame.' : '기기를 고정하고 전신이 보이도록 서 주세요.'}</p>
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-2xl bg-[#322c4d]"><video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-fill" style={{ transform: 'scaleX(-1)' }} />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={en ? 'Body landmarks' : '몸 관절 위치'}>{BONES.map(([a, b]) => points[a]?.visibility > .45 && points[b]?.visibility > .45 && <line key={`${a}-${b}`} x1={points[a].x * 100} y1={points[a].y * 100} x2={points[b].x * 100} y2={points[b].y * 100} stroke="#ffe9a9" strokeWidth=".7" />)}{points.map((point, index) => point.visibility > .45 && <circle key={index} cx={point.x * 100} cy={point.y * 100} r="1.1" fill="#84f0ca" />)}</svg>
            {cameraStatus === 'idle' && <div className="absolute inset-0 grid place-items-center text-center text-sm font-bold text-white/70">{en ? 'Camera preview' : '카메라 미리보기'}</div>}
            {zoomed && <span className="absolute left-2 top-2 rounded-lg bg-[#412c5f]/85 px-2 py-1 text-[11px] font-black text-[#ffedae]">{en ? 'Small body scan' : '작은 체구 확대 인식'}</span>}
          </div>
          <div className="mt-3 flex gap-2"><button className="min-h-11 flex-1 rounded-xl bg-[#6e4a87] px-3 text-sm font-black text-white disabled:opacity-50" onClick={startCamera} disabled={cameraStatus === 'loading' || cameraStatus === 'running'}>{cameraStatus === 'loading' ? (en ? 'Loading…' : '준비 중…') : (en ? 'Start camera' : '카메라 켜기')}</button><button className="min-h-11 rounded-xl border border-[#ceb7d3] px-3 text-sm font-bold text-[#684d77] disabled:opacity-50" onClick={stopCamera} disabled={cameraStatus === 'idle'}>{en ? 'Stop' : '끄기'}</button></div>
          {cameraStatus === 'running' && <button className="mt-2 min-h-10 w-full rounded-xl border border-[#ceb7d3] text-xs font-bold text-[#684d77]" onClick={recalibrate}>{en ? 'Recalibrate' : '다시 보정'}</button>}
          {pose.state === 'CALIBRATING' && <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0e7f2]"><div className="h-full rounded-full bg-[#73d9b1]" style={{ width: `${pose.calibrationProgress * 100}%` }} /></div>}
          <p className="mt-3 min-h-9 text-xs font-bold text-[#7c6186]" role="status">{cameraStatus === 'loading' ? (en ? 'Preparing the camera…' : '카메라를 준비하고 있어요…') : pose.bodyDetected ? pose.calibrationProgress === 1 ? (en ? 'Body detected · ready to run' : '몸 인식됨 · 출발 준비 완료') : (en ? 'Hold still for calibration' : '가만히 서서 보정해 주세요') : (en ? 'Stand in the center of the frame' : '화면 중앙에 서 주세요')}</p>
        </section>
        <section className="rounded-[28px] border border-[#ecd5db] bg-[#fff7e9] p-4 text-[#60446f]"><h2 className="font-display text-lg font-black">{en ? 'How to play' : '놀이 방법'}</h2><ol className="mt-3 space-y-2 text-sm font-semibold"><li>① {en ? 'Stand in front of the camera to start.' : '카메라 앞에 서면 자동으로 시작해요.'}</li><li>② {en ? 'Jump over logs.' : '점프해서 통나무를 넘어요.'}</li><li>③ {en ? 'Crouch under candy branches.' : '앉아서 사탕 가지를 피해요.'}</li><li>④ {en ? 'Collect stars and reach 1,200m!' : '별을 모아 1,200m를 완주해요!'}</li></ol></section>
        <details className="rounded-[28px] border border-[#d9c4e1] bg-white p-4 text-[#60446f]"><summary className="cursor-pointer font-display text-lg font-black">{en ? 'Play with a spare phone' : '공기계로 점프하기'}</summary>
          <p className="mt-3 text-xs leading-relaxed text-[#856c8b]">{en ? 'Keep this game on the display. On a spare phone using the same Wi-Fi, open the controller link below. A parent exchanges the connection text once.' : '이 화면은 게임 화면으로 두세요. 같은 Wi-Fi의 공기계에서 아래 주소를 열고, 보호자가 연결 정보를 한 번 교환해 주세요.'}</p>
          <Link className="mt-3 block break-all rounded-xl bg-[#f6edf7] p-2 text-xs font-bold text-[#684d77] underline" to="/games/motion-poc/remote?game=cookie-runner" target="_blank" rel="noopener noreferrer">{location.origin}/games/motion-poc/remote?game=cookie-runner</Link>
          {['localhost', '127.0.0.1'].includes(location.hostname) && <p className="mt-2 text-xs font-bold text-[#a45b69]">{en ? 'This local address only works on this computer. The spare phone needs an accessible HTTPS address.' : '현재 로컬 주소는 이 컴퓨터에서만 열립니다. 공기계에서는 접근 가능한 HTTPS 주소가 필요해요.'}</p>}
          <p className="mt-2 text-xs font-semibold text-[#856c8b]">{en ? 'This mode uses jump obstacles only. The run starts after the phone sensor is calibrated.' : '이 모드에서는 점프 장애물만 나옵니다. 공기계 센서 보정이 끝나면 자동 출발해요.'}</p>
          <div className="mt-3 flex flex-wrap gap-2"><button className="min-h-11 rounded-xl bg-[#6e4a87] px-4 text-xs font-black text-white" onClick={startRemoteDisplay}>{en ? 'Create connection' : '게임 화면 연결 시작'}</button>{peerRef.current && <button className="min-h-11 rounded-xl border border-[#d9c4e1] px-3 text-xs font-bold" onClick={stopRemote}>{en ? 'Disconnect' : '연결 끊기'}</button>}</div>
          {remoteOffer && <div className="mt-3 space-y-2"><label className="block text-xs font-bold" htmlFor="cookie-remote-offer">{en ? '1. Send this to the spare phone' : '1. 이 연결 정보를 공기계에 전달'}</label><textarea id="cookie-remote-offer" readOnly value={remoteOffer} className="h-20 w-full rounded-xl border border-[#dfcde4] bg-[#fbf5fc] p-2 text-xs" /><button className="min-h-10 rounded-xl border border-[#dfcde4] px-3 text-xs font-bold" onClick={copyRemoteOffer}>{en ? 'Copy connection' : '연결 정보 복사'}</button><label className="block text-xs font-bold" htmlFor="cookie-remote-answer">{en ? '2. Paste the reply from the spare phone' : '2. 공기계의 응답을 여기에 붙여넣기'}</label><textarea id="cookie-remote-answer" value={remoteAnswer} onChange={event => setRemoteAnswer(event.target.value)} className="h-20 w-full rounded-xl border border-[#dfcde4] bg-[#fbf5fc] p-2 text-xs" /><button className="min-h-10 rounded-xl bg-[#ffd078] px-3 text-xs font-black text-[#55365c] disabled:opacity-50" disabled={!remoteAnswer.trim() || remoteConnected} onClick={finishRemoteDisplay}>{remoteConnected ? (en ? 'Connected' : '연결됨') : (en ? 'Complete connection' : '연결 완료')}</button></div>}
        </details>
      </aside>
    </div>
    {error && <p role="alert" className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-800">{error}</p>}
    <details className="rounded-2xl border border-[#e8d9e7] bg-white p-4 text-sm text-[#715a7b]"><summary className="cursor-pointer font-black">{en ? 'Detection and performance' : '인식·성능 측정'}</summary><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5"><Metric label={en ? 'Body' : '몸 인식'} value={pose.bodyDetected ? (en ? 'Detected' : '인식됨') : (en ? 'Missing' : '없음')} /><Metric label={en ? 'Action' : '동작'} value={pose.action} /><Metric label={en ? 'Confidence' : '신뢰도'} value={pose.confidence.toFixed(2)} /><Metric label={en ? 'Camera FPS' : '카메라 FPS'} value={cameraFps} /><Metric label="Pose FPS" value={poseFps} /><Metric label={en ? 'Render FPS' : '렌더링 FPS'} value={stats.fps} /><Metric label={en ? 'Inference' : '추론 시간'} value={`${inferenceMs} ms`} /></div><p className="mt-2 text-xs">{en ? 'These are browser measurements; they do not include TV mirroring delay.' : '브라우저 내부 측정값이며 TV 미러링 지연은 포함하지 않습니다.'}</p></details>
    <RewardCelebration type="game_complete" stars={stats.hearts} newStickers={earned} open={showReward} onDismiss={() => setShowReward(false)} message={en ? 'You made it through the sweet forest!' : '달콤한 숲을 끝까지 달렸어요!'} />
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-[#fbf4fc] p-3"><p className="text-xs text-[#9a809b]">{label}</p><p className="mt-1 font-black tabular-nums">{value}</p></div>;
}
