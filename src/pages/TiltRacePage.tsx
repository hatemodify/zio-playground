import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RewardCelebration from '@/components/features/RewardCelebration';
import { acceptAnswer, createAnswer, createOffer, createPeer } from '@/motion/directLink';
import { parseRacePacket, steeringFromTilt } from '@/motion/raceControl';
import { TiltRace, type RaceEvent, type RaceStats } from '@/motion/TiltRace';
import { useGamificationStore } from '@/stores/gamification-store';
import { useSettingsStore } from '@/stores/settings-store';
import { soundManager } from '@/lib/sound-manager';

type Role = 'display' | 'controller';
type OrientationPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
const INITIAL_STATS: RaceStats = { phase: 'ready', distance: 0, finish: 1800, score: 0, hearts: 3, stage: 1, speed: 0, coins: 0, fps: 0 };
const primary = 'min-h-12 rounded-2xl bg-[#56e3c5] px-5 py-3 font-black text-[#14223a] shadow-[0_5px_0_#319d89] transition active:translate-y-1 active:shadow-none disabled:opacity-45';
const secondary = 'min-h-12 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 disabled:opacity-45';

export default function TiltRacePage() {
  const [params, setParams] = useSearchParams();
  const role: Role = params.get('mode') === 'controller' ? 'controller' : 'display';
  const language = useSettingsStore((state) => state.language);
  const bestScore = useGamificationStore((state) => state.gameRecords.filter((record) => record.gameId === 'tilt-race').reduce((best, record) => Math.max(best, record.score), 0));
  const [status, setStatus] = useState('레이스를 시작해 주세요.');
  const [error, setError] = useState('');
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [connected, setConnected] = useState(false);
  const [sensorOn, setSensorOn] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [rtt, setRtt] = useState<number | null>(null);
  const [stats, setStats] = useState<RaceStats>(INITIAL_STATS);
  const [earned, setEarned] = useState<string[]>([]);
  const [showReward, setShowReward] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TiltRace | null>(null);
  const frameRef = useRef(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const sensorRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const sensorWatchRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sensorSendRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const neutralRef = useRef<number | null>(null);
  const filteredRef = useRef(0);
  const lastSensorRef = useRef(0);
  const lastPingRef = useRef(0);
  const lastInputRef = useRef(0);
  const lastSequenceRef = useRef(0);
  const sequenceRef = useRef(0);
  const pingTimesRef = useRef(new Map<number, number>());
  const runModeRef = useRef<'none' | 'practice' | 'remote'>('none');
  const lastUiRef = useRef(0);
  const raceStartedRef = useRef(0);

  function releaseSensor() {
    if (sensorRef.current) window.removeEventListener('deviceorientation', sensorRef.current);
    sensorRef.current = null;
    if (sensorWatchRef.current) clearInterval(sensorWatchRef.current);
    sensorWatchRef.current = null;
    if (sensorSendRef.current) clearInterval(sensorSendRef.current);
    sensorSendRef.current = null;
    setSensorOn(false);
    neutralRef.current = null;
    filteredRef.current = 0;
  }

  function stopLink() {
    releaseSensor();
    channelRef.current?.close();
    peerRef.current?.close();
    channelRef.current = null;
    peerRef.current = null;
    pingTimesRef.current.clear();
    lastSequenceRef.current = 0;
    setConnected(false);
    setHasInput(false);
    setRtt(null);
    setOffer(''); setAnswer('');
    if (runModeRef.current !== 'none') gameRef.current?.pause();
    runModeRef.current = 'none';
  }
  const stopRef = useRef(stopLink);
  stopRef.current = stopLink;
  useEffect(() => () => stopRef.current(), []);

  useEffect(() => {
    if (role !== 'display' || !canvasRef.current) return;
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
        setStatus('완주 성공! 다시 달려 볼까요?');
      } else if (event === 'lost') setStatus('하트를 모두 잃었어요. 다시 도전해 보세요.');
      else if (event === 'stage') setStatus('새 스테이지! 차량이 조금 더 빨라졌어요.');
    };
    const game = new TiltRace(canvasRef.current, onEvent);
    gameRef.current = game;
    let lastUi = performance.now();
    const loop = (now: number) => {
      if (runModeRef.current === 'remote' && game.stats.phase === 'running' && now - lastInputRef.current > 900) {
        game.pause(); setHasInput(false); setStatus('컨트롤러 신호가 멈춰 레이스를 일시정지했어요.');
      }
      game.draw(now);
      if (now - lastUi >= 150) { setStats(game.stats); lastUi = now; }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frameRef.current); gameRef.current = null; };
  }, [role]);

  useEffect(() => {
    if (role !== 'display') return;
    const keys = { left: false, right: false };
    const update = () => {
      if (runModeRef.current !== 'practice') return;
      gameRef.current?.setSteer(keys.left === keys.right ? 0 : keys.left ? -0.85 : 0.85);
    };
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); keys[event.key === 'ArrowLeft' ? 'left' : 'right'] = true; update();
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        keys[event.key === 'ArrowLeft' ? 'left' : 'right'] = false; update();
      }
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [role]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) { gameRef.current?.pause(); releaseSensor(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  function chooseRole(next: Role) {
    stopLink(); setError(''); setStatus('연결을 시작해 주세요.');
    setParams(next === 'controller' ? { mode: 'controller' } : {});
  }

  function startPractice() {
    stopLink(); setError(''); setShowReward(false); setEarned([]);
    runModeRef.current = 'practice';
    gameRef.current?.start();
    raceStartedRef.current = performance.now();
    setStats(gameRef.current?.stats ?? INITIAL_STATS);
    setStatus('레이스 시작! 방향키나 화면 버튼으로 움직이세요.');
  }

  function attachChannel(channel: RTCDataChannel, nextRole: Role) {
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const packet = parseRacePacket(event.data);
      if (!packet) return;
      if (nextRole === 'display' && packet.type === 'drive' && packet.sequence > lastSequenceRef.current) {
        lastSequenceRef.current = packet.sequence;
        lastInputRef.current = performance.now();
        gameRef.current?.setSteer(packet.steer);
        setHasInput(true);
      } else if (nextRole === 'display' && packet.type === 'ping') {
        if (channel.readyState === 'open') channel.send(JSON.stringify({ type: 'pong', sequence: packet.sequence }));
      } else if (nextRole === 'controller' && packet.type === 'pong') {
        const sent = pingTimesRef.current.get(packet.sequence);
        if (sent !== undefined) { setRtt(Math.round(performance.now() - sent)); pingTimesRef.current.delete(packet.sequence); }
      }
    };
    channel.onclose = () => { setConnected(false); setHasInput(false); gameRef.current?.pause(); releaseSensor(); };
  }

  function preparePeer(nextRole: Role) {
    stopLink(); setError('');
    const peer = createPeer();
    peerRef.current = peer;
    peer.onconnectionstatechange = () => {
      if (peerRef.current !== peer) return;
      const live = peer.connectionState === 'connected';
      setConnected(live);
      if (live) setStatus(nextRole === 'display' ? '컨트롤러 연결됨. 센서 신호를 기다리는 중…' : '게임 화면 연결됨. 센서를 시작해 주세요.');
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        setStatus('연결이 끊겼어요. 같은 Wi-Fi를 확인하고 다시 연결해 주세요.');
        gameRef.current?.pause(); releaseSensor(); setHasInput(false);
      }
    };
    if (nextRole === 'controller') peer.ondatachannel = event => attachChannel(event.channel, 'controller');
    return peer;
  }

  async function startDisplayLink() {
    try {
      const peer = preparePeer('display');
      const result = await createOffer(peer, 'tilt-race');
      if (peerRef.current !== peer) return;
      attachChannel(result.channel, 'display');
      setOffer(result.offer);
      setStatus('1단계: 연결 정보를 공기계에 전달해 주세요.');
    } catch (cause) { setError(String(cause)); stopLink(); }
  }

  async function answerDisplay() {
    try {
      const receivedOffer = offer;
      const peer = preparePeer('controller');
      setOffer(receivedOffer);
      const response = await createAnswer(peer, receivedOffer);
      if (peerRef.current !== peer) return;
      setAnswer(response);
      setStatus('2단계: 응답을 게임 화면에 전달해 주세요.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); stopLink(); }
  }

  async function finishDisplayLink() {
    try {
      if (!peerRef.current) throw new Error('먼저 화면 연결을 시작해 주세요.');
      await acceptAnswer(peerRef.current, answer);
      setError(''); setStatus('연결 중…');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setStatus('연결 정보를 복사했어요.'); }
    catch { setError('복사할 수 없습니다. 연결 정보를 직접 선택해 전달해 주세요.'); }
  }

  async function startSensor() {
    if (!connected || !window.isSecureContext || !('DeviceOrientationEvent' in window)) {
      setError('휴대폰의 HTTPS 브라우저에서 연결한 뒤 기울임 센서를 시작해 주세요.'); return;
    }
    try {
      const orientation = DeviceOrientationEvent as OrientationPermission;
      if (orientation.requestPermission && await orientation.requestPermission() !== 'granted') throw new Error('기울임 센서 권한을 허용해 주세요.');
      neutralRef.current = null;
      filteredRef.current = 0;
      lastSensorRef.current = performance.now();
      const onOrientation = (event: DeviceOrientationEvent) => {
        if (event.gamma == null) return;
        const now = performance.now();
        lastSensorRef.current = now;
        if (neutralRef.current === null) neutralRef.current = event.gamma;
        const raw = steeringFromTilt(event.gamma, neutralRef.current);
        filteredRef.current += (raw - filteredRef.current) * 0.45;
        if (now - lastUiRef.current >= 100) { setTilt(filteredRef.current); lastUiRef.current = now; }
      };
      sensorRef.current = onOrientation;
      window.addEventListener('deviceorientation', onOrientation);
      sensorSendRef.current = setInterval(() => {
        const channel = channelRef.current;
        if (neutralRef.current === null || channel?.readyState !== 'open') return;
        const now = performance.now();
        channel.send(JSON.stringify({ type: 'drive', sequence: ++sequenceRef.current, steer: Number(filteredRef.current.toFixed(3)) }));
        if (now - lastPingRef.current >= 1000) {
          const ping = ++sequenceRef.current;
          pingTimesRef.current.set(ping, now);
          if (pingTimesRef.current.size > 10) pingTimesRef.current.delete(pingTimesRef.current.keys().next().value!);
          channel.send(JSON.stringify({ type: 'ping', sequence: ping }));
          lastPingRef.current = now;
        }
      }, 33);
      sensorWatchRef.current = setInterval(() => {
        if (performance.now() - lastSensorRef.current < (neutralRef.current === null ? 2000 : 10000)) return;
        releaseSensor(); setError('기울임 센서 값이 들어오지 않습니다. 권한과 기기를 확인해 주세요.');
      }, 500);
      setSensorOn(true); setError('');
      setStatus('컨트롤러 준비 완료! 폰을 좌우로 살짝 기울여 보세요.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  function startRemoteRace() {
    if (!connected || !hasInput) return;
    runModeRef.current = 'remote';
    lastInputRef.current = performance.now();
    setShowReward(false); setEarned([]);
    gameRef.current?.start();
    raceStartedRef.current = performance.now();
    setStats(gameRef.current?.stats ?? INITIAL_STATS);
    setStatus('레이스 시작! 공기계를 좌우로 기울여 주세요.');
  }

  function resumeRace() {
    if (runModeRef.current === 'remote' && (!connected || !hasInput)) return;
    if (runModeRef.current === 'remote') lastInputRef.current = performance.now();
    gameRef.current?.resume(); setStats(gameRef.current?.stats ?? INITIAL_STATS);
    setStatus('레이스를 계속합니다.');
  }

  const controllerUrl = `${location.origin}/games/tilt-race?mode=controller`;
  return <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-8 pt-4 text-slate-800 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-black tracking-[.22em] text-[#bd6b6e]">TILT RACE · SENSOR CONTROLLER</p><h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">또리의 드라이브 챌린지</h1><p className="mt-2 text-sm text-slate-600">핸들을 기울여 교통 차량을 피하고 별을 모아 결승선까지 달려요.</p></div>
      <div className="flex flex-wrap gap-2"><div className="rounded-full bg-[#172b4d] px-4 py-2 text-sm font-black text-[#8ff0d7]">3 STAGES · 1,800m</div><div className="rounded-full bg-[#fce1b0] px-4 py-2 text-sm font-black text-[#8b5225]">{language === 'en' ? 'BEST' : '최고 기록'} {bestScore.toLocaleString()}</div></div>
    </header>
    <div className="flex flex-wrap gap-2" role="group" aria-label="플레이 방식">
      <button className={role === 'display' ? primary : 'min-h-12 rounded-2xl bg-white px-5 py-3 font-bold text-slate-700'} onClick={() => chooseRole('display')} aria-pressed={role === 'display'}>🏁 게임 화면</button>
      <button className={role === 'controller' ? primary : 'min-h-12 rounded-2xl bg-white px-5 py-3 font-bold text-slate-700'} onClick={() => chooseRole('controller')} aria-pressed={role === 'controller'}>📱 공기계 컨트롤러</button>
    </div>
    {role === 'display' ? <>
      <section className="overflow-hidden rounded-[30px] bg-[#17213e] p-2 shadow-[0_20px_60px_rgba(23,33,62,.3)] sm:p-4" aria-label="레이싱 게임">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 font-black text-white"><span className="text-sm tracking-widest text-[#8ff0d7]">TILT RACE</span><span className="text-sm">STAGE {stats.stage} / 3</span><span className="text-sm" aria-label={language === 'en' ? `${stats.hearts} hearts left` : `남은 하트 ${stats.hearts}개`}>{'♥'.repeat(stats.hearts)}{'♡'.repeat(3 - stats.hearts)}</span></div>
        <div className="relative overflow-hidden rounded-2xl"><canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: '800 / 480' }} aria-label="교통 차량을 피하며 달리는 레이싱 게임" /><div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-[#17213e]/70 px-2 py-1 text-xs font-bold text-white sm:bottom-4 sm:left-4 sm:text-sm">{stats.distance} / {stats.finish} m</div></div>
        <div className="grid grid-cols-3 gap-2 p-3 text-center text-white"><Metric label="점수" value={stats.score.toLocaleString()} /><Metric label="속도" value={`${stats.speed} km/h`} /><Metric label="별" value={language === 'en' ? String(stats.coins) : `${stats.coins}개`} /></div>
        <div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#56e3c5] transition-[width] duration-150" style={{ width: `${Math.min(100, stats.distance / stats.finish * 100)}%` }} /></div>
      </section>
      <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">{status}</p>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-[#17213e] p-3">
        <button className={primary} onClick={startPractice}>{stats.phase === 'ready' ? '바로 플레이' : '처음부터 다시'}</button>
        {stats.phase === 'paused' && <button className={secondary} onClick={resumeRace} disabled={runModeRef.current === 'remote' && (!connected || !hasInput)}>계속하기</button>}
        {stats.phase === 'running' && <button className={secondary} onClick={() => { gameRef.current?.pause(); setStats(gameRef.current?.stats ?? INITIAL_STATS); }}>일시정지</button>}
        <button className={secondary} onClick={startDisplayLink}>공기계 연결 시작</button>
        {connected && <button className={primary} disabled={!hasInput} onClick={startRemoteRace}>공기계로 출발</button>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:hidden"><button className="min-h-16 rounded-2xl bg-[#172b4d] text-2xl font-black text-white touch-none" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); if (runModeRef.current === 'practice') gameRef.current?.setSteer(-0.85); }} onPointerUp={() => gameRef.current?.setSteer(0)} onPointerCancel={() => gameRef.current?.setSteer(0)}>← 왼쪽</button><button className="min-h-16 rounded-2xl bg-[#172b4d] text-2xl font-black text-white touch-none" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); if (runModeRef.current === 'practice') gameRef.current?.setSteer(0.85); }} onPointerUp={() => gameRef.current?.setSteer(0)} onPointerCancel={() => gameRef.current?.setSteer(0)}>오른쪽 →</button></div>
      <p className="text-sm text-slate-600">PC에서는 방향키로 연습할 수 있어요. 공기계로 놀 때는 두 기기를 같은 Wi-Fi에 연결하고, TV에는 게임 화면을 미러링하세요.</p>
    </> : <section className="rounded-[30px] bg-[#17213e] p-5 text-white shadow-[0_20px_60px_rgba(23,33,62,.3)] sm:p-8">
      <div className="text-center"><p className="text-xs font-black tracking-[.2em] text-[#8ff0d7]">YOUR CONTROLLER</p><h2 className="mt-2 text-2xl font-black">폰을 기울여 핸들을 돌려요</h2><p className="mt-2 text-sm text-white/70">휴대폰을 세로로 들고, 편한 자세에서 센서를 시작하세요.</p></div>
      <div className="relative mx-auto my-7 flex h-52 max-w-sm items-center justify-center rounded-[28px] border border-white/15 bg-[#23365a]"><div className="absolute left-5 text-3xl text-[#8ff0d7]">←</div><div className="absolute right-5 text-3xl text-[#8ff0d7]">→</div><div className="rounded-[32px] border-[14px] border-[#8ff0d7] p-9 text-center text-5xl transition-transform duration-75" style={{ transform: `rotate(${tilt * 28}deg)` }}>✦</div></div>
      <div className="flex flex-wrap justify-center gap-2"><button className={primary} disabled={!connected || sensorOn} onClick={startSensor}>기울임 센서 시작</button><button className={secondary} disabled={!sensorOn} onClick={() => { neutralRef.current = null; filteredRef.current = 0; setTilt(0); }}>가운데 다시 맞추기</button><button className={secondary} onClick={() => { stopLink(); setStatus('연결을 시작해 주세요.'); }}>연결 끊기</button></div>
      <div className="mt-6 grid grid-cols-3 gap-2 text-center"><Metric label="연결" value={connected ? '연결됨' : '대기 중'} /><Metric label="조향" value={`${Math.round(tilt * 100)}%`} /><Metric label="왕복 지연" value={rtt === null ? '—' : `${rtt} ms`} /></div>
      <p className="mt-4 text-center text-sm text-[#a4ebdb]" role="status">{status}</p>
    </section>}
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="공기계 연결">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black tracking-widest text-teal-700">SAME WI-FI CONNECTION</p><h2 className="mt-1 text-xl font-black">공기계 연결</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{language === 'en' ? connected ? '● Connected' : '○ Waiting' : connected ? '● 연결됨' : '○ 연결 대기'}</span></div>
      <p className="mt-2 text-sm text-slate-600">공기계에서 <a href={controllerUrl} className="font-bold text-teal-700 underline">컨트롤러 화면</a>을 열고, 아래 연결 정보를 순서대로 복사해 전달하세요. 휴대폰 센서는 HTTPS에서 동작합니다.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {role === 'display' ? <><ConnectionField id="race-offer" label="1. 이 정보를 공기계에 붙여넣기" value={offer} readOnly onChange={setOffer} /><ConnectionField id="race-answer" label="3. 공기계의 응답을 여기에 붙여넣기" value={answer} onChange={setAnswer} /></>
          : <><ConnectionField id="race-controller-offer" label="2. 게임 화면의 연결 정보를 여기에 붙여넣기" value={offer} onChange={setOffer} /><ConnectionField id="race-controller-answer" label="이 응답을 게임 화면에 붙여넣기" value={answer} readOnly onChange={setAnswer} /></>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2"><button className="min-h-11 rounded-xl bg-teal-700 px-4 font-bold text-white disabled:opacity-40" disabled={role === 'display' ? !answer.trim() : !offer.trim()} onClick={role === 'display' ? finishDisplayLink : answerDisplay}>{role === 'display' ? '연결 완료' : '응답 만들기'}</button><button className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold text-slate-700 disabled:opacity-40" disabled={!(role === 'display' ? offer : answer)} onClick={() => copy(role === 'display' ? offer : answer)}>연결 정보 복사</button></div>
    </section>
    {error && <p role="alert" className="rounded-2xl bg-rose-100 p-4 font-bold text-rose-800">{error}</p>}
    <RewardCelebration type="game_complete" stars={stats.hearts} newStickers={earned} open={showReward} onDismiss={() => setShowReward(false)} message="결승선까지 멋지게 달렸어요!" />
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/10 px-2 py-2"><p className="text-[11px] text-white/60">{label}</p><p className="font-black tabular-nums text-white">{value}</p></div>;
}

function ConnectionField({ id, label, value, onChange, readOnly = false }: { id: string; label: string; value: string; onChange: (value: string) => void; readOnly?: boolean }) {
  return <div><label htmlFor={id} className="text-sm font-bold text-slate-700">{label}</label><textarea id={id} className="mt-1 h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700" value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} /></div>;
}
