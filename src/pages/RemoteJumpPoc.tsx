import { useEffect, useRef, useState } from 'react';
import { acceptAnswer, createAnswer, createOffer, createPeer, parsePacket } from '@/motion/directLink';
import { JumpDetector, type JumpReading } from '@/motion/jumpDetector';
import { Runner } from '@/motion/runner';

type Role = 'display' | 'controller';
type MotionPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
const EMPTY_READING: JumpReading = { phase: 'STILL', progress: 0, magnitude: 0, threshold: 17, jump: false };

export default function RemoteJumpPoc() {
  const [role, setRole] = useState<Role>('display');
  const [status, setStatus] = useState('연결을 시작해 주세요.');
  const [error, setError] = useState('');
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [connected, setConnected] = useState(false);
  const [sensorOn, setSensorOn] = useState(false);
  const [reading, setReading] = useState<JumpReading>(EMPTY_READING);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [rtt, setRtt] = useState<number | null>(null);
  const [fps, setFps] = useState(0);
  const [renderLatency, setRenderLatency] = useState<number | null>(null);
  const [lastJumpAt, setLastJumpAt] = useState<string>('—');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runnerRef = useRef<Runner | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const detectorRef = useRef(new JumpDetector());
  const frameRef = useRef(0);
  const sequenceRef = useRef(0);
  const lastReceivedRef = useRef(0);
  const lastUiRef = useRef(0);
  const lastMotionRef = useRef(0);
  const lastPhaseRef = useRef<JumpReading['phase']>('STILL');
  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const connectedRef = useRef(false);
  const roleRef = useRef<Role>('display');

  function stop() {
    if (motionHandlerRef.current) window.removeEventListener('devicemotion', motionHandlerRef.current);
    motionHandlerRef.current = null;
    void wakeLockRef.current?.release();
    wakeLockRef.current = null;
    cancelAnimationFrame(frameRef.current);
    channelRef.current?.close();
    peerRef.current?.close();
    channelRef.current = null;
    peerRef.current = null;
    runnerRef.current?.setRemoteActive(false);
    runnerRef.current = null;
    detectorRef.current.reset();
    sequenceRef.current = 0;
    lastReceivedRef.current = 0;
    lastPhaseRef.current = 'STILL';
    connectedRef.current = false;
    lastMotionRef.current = 0;
    setConnected(false);
    setSensorOn(false);
    setReading(EMPTY_READING);
    setSentCount(0); setReceivedCount(0); setRtt(null);
    setFps(0); setRenderLatency(null); setLastJumpAt('—');
    setOffer(''); setAnswer('');
    setStatus('연결을 시작해 주세요.');
  }
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden || !motionHandlerRef.current) return;
      window.removeEventListener('devicemotion', motionHandlerRef.current);
      motionHandlerRef.current = null;
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
      detectorRef.current.reset();
      setSensorOn(false);
      setStatus('화면이 가려져 센서를 멈췄습니다. 돌아오면 보정을 다시 시작해 주세요.');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); stopRef.current(); };
  }, []);
  useEffect(() => {
    if (!sensorOn) return;
    const timer = window.setInterval(() => {
      if (performance.now() - lastMotionRef.current < 1600) return;
      if (motionHandlerRef.current) window.removeEventListener('devicemotion', motionHandlerRef.current);
      motionHandlerRef.current = null;
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
      detectorRef.current.reset();
      setSensorOn(false);
      setError('움직임 센서 데이터가 들어오지 않습니다. 휴대폰 브라우저의 센서 권한을 확인해 주세요.');
    }, 500);
    return () => window.clearInterval(timer);
  }, [sensorOn]);

  function setRoleAndReset(next: Role) {
    stop();
    roleRef.current = next;
    setRole(next);
    setError('');
  }

  function preparePeer(nextRole: Role) {
    stop();
    setError('');
    const peer = createPeer();
    peerRef.current = peer;
    peer.onconnectionstatechange = () => {
      if (peerRef.current !== peer) return;
      const isConnected = peer.connectionState === 'connected';
      connectedRef.current = isConnected;
      setConnected(isConnected);
      runnerRef.current?.setRemoteActive(isConnected);
      if (isConnected) setStatus(nextRole === 'display' ? '컨트롤러 연결됨 · 점프를 기다리는 중' : '화면 연결됨 · 센서를 시작해 주세요');
      else if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') setStatus('연결이 끊겼습니다. 두 기기의 Wi-Fi를 확인하고 다시 연결해 주세요.');
      if (!isConnected && motionHandlerRef.current) {
        window.removeEventListener('devicemotion', motionHandlerRef.current);
        motionHandlerRef.current = null;
        void wakeLockRef.current?.release();
        wakeLockRef.current = null;
        setSensorOn(false);
      }
    };
    if (nextRole === 'controller') peer.ondatachannel = event => attachChannel(event.channel);
    return peer;
  }

  function attachChannel(channel: RTCDataChannel) {
    channelRef.current = channel;
    channel.onmessage = event => {
      const packet = parsePacket(event.data);
      if (!packet) return;
      if (roleRef.current === 'display' && packet.type === 'jump' && packet.sequence > lastReceivedRef.current) {
        lastReceivedRef.current = packet.sequence;
        const receivedAt = performance.now();
        runnerRef.current?.jumpFromRemote(receivedAt);
        setReceivedCount(count => count + 1);
        setLastJumpAt(new Date().toLocaleTimeString('ko-KR'));
        if (channel.readyState === 'open') channel.send(JSON.stringify({ type: 'echo', sequence: packet.sequence, sentAt: packet.sentAt }));
      } else if (roleRef.current === 'controller' && packet.type === 'echo') {
        setRtt(Math.round(performance.now() - packet.sentAt));
      }
    };
    channel.onclose = () => {
      connectedRef.current = false;
      setConnected(false);
      runnerRef.current?.setRemoteActive(false);
    };
  }

  function sendJump() {
    const channel = channelRef.current;
    if (!connectedRef.current || channel?.readyState !== 'open') return;
    channel.send(JSON.stringify({ type: 'jump', sequence: ++sequenceRef.current, sentAt: performance.now() }));
    setSentCount(count => count + 1);
    setLastJumpAt(new Date().toLocaleTimeString('ko-KR'));
  }

  function onMotion(event: DeviceMotionEvent) {
    const acceleration = event.accelerationIncludingGravity;
    if (acceleration?.x == null || acceleration.y == null || acceleration.z == null) return;
    const now = performance.now();
    lastMotionRef.current = now;
    const next = detectorRef.current.update(acceleration.x, acceleration.y, acceleration.z, now);
    if (next.jump) sendJump();
    const phaseChanged = next.phase !== lastPhaseRef.current;
    if (phaseChanged) {
      setStatus(next.phase === 'RUN' ? '제자리에서 2초간 달려 보정해 주세요.' : '보정 완료 · 제자리 달리기 중 점프해 보세요.');
      lastPhaseRef.current = next.phase;
    }
    if (now - lastUiRef.current >= 100 || next.jump || phaseChanged) {
      setReading(next);
      lastUiRef.current = now;
    }
  }

  async function startSensor() {
    if (!connectedRef.current || !window.isSecureContext || !('DeviceMotionEvent' in window)) {
      setError('움직임 센서를 사용할 수 없습니다. 휴대폰의 HTTPS 브라우저에서 열고 연결을 확인해 주세요.'); return;
    }
    try {
      const motionEvent = DeviceMotionEvent as MotionPermission;
      if (motionEvent.requestPermission && await motionEvent.requestPermission() !== 'granted') throw new Error('움직임 센서 권한을 허용해 주세요.');
      detectorRef.current.reset();
      lastMotionRef.current = performance.now();
      motionHandlerRef.current = onMotion;
      window.addEventListener('devicemotion', onMotion);
      if (navigator.wakeLock) {
        void navigator.wakeLock.request('screen').then(lock => {
          if (motionHandlerRef.current === onMotion) wakeLockRef.current = lock;
          else void lock.release();
        }).catch(() => { /* Sensor input remains available without wake lock. */ });
      }
      setSensorOn(true);
      setError('');
      setStatus('휴대폰을 몸에 고정하고 2초간 가만히 서 주세요. 다음 2초는 제자리 달리기를 해 주세요.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function startDisplay() {
    try {
      const peer = preparePeer('display');
      if (!canvasRef.current) throw new Error('게임 화면을 준비하지 못했습니다.');
      runnerRef.current = new Runner(canvasRef.current);
      runnerRef.current.setRemoteActive(false);
      const result = await createOffer(peer);
      if (peerRef.current !== peer) return;
      attachChannel(result.channel);
      setOffer(result.offer);
      setStatus('아래 연결 정보를 컨트롤러에 전달해 주세요.');
      let lastMetric = performance.now();
      const loop = (now: number) => {
        if (peerRef.current !== peer) return;
        runnerRef.current?.draw(now);
        if (now - lastMetric >= 1000) {
          setFps(runnerRef.current?.fps ?? 0);
          setRenderLatency(runnerRef.current?.latencyMs ?? null);
          lastMetric = now;
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); stop(); }
  }

  async function startController() {
    try {
      const peer = preparePeer('controller');
      const result = await createAnswer(peer, offer);
      if (peerRef.current !== peer) return;
      setAnswer(result);
      setStatus('아래 응답 정보를 게임 화면에 전달해 주세요.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); stop(); }
  }

  async function finishDisplay() {
    try {
      if (!peerRef.current) throw new Error('먼저 게임 화면 연결을 시작해 주세요.');
      await acceptAnswer(peerRef.current, answer);
      setStatus('연결 중…'); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setStatus('연결 정보를 복사했습니다.'); }
    catch { setError('복사할 수 없습니다. 연결 정보를 직접 선택해 전달해 주세요.'); }
  }

  const button = 'min-h-11 rounded-xl bg-teal-300 px-4 py-2 font-black text-slate-900 disabled:opacity-50';
  const secondary = 'min-h-11 rounded-xl border border-slate-400 px-4 py-2 font-bold text-white disabled:opacity-50';
  return <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 text-slate-800 sm:px-6">
    <header><p className="text-xs font-black tracking-[.2em] text-teal-700">REMOTE JUMP · TECH POC</p><h1 className="mt-1 text-2xl font-black">몸에 고정한 휴대폰으로 점프</h1><p className="mt-2 text-sm text-slate-600">게임 화면과 공기계를 같은 Wi-Fi에 연결하세요. 처음 연결 정보 교환은 보호자가 진행합니다.</p></header>
    <div className="flex flex-wrap gap-2"><button className={role === 'display' ? button : 'min-h-11 rounded-xl border px-4 py-2 font-bold'} onClick={() => setRoleAndReset('display')} aria-pressed={role === 'display'}>게임 화면</button><button className={role === 'controller' ? button : 'min-h-11 rounded-xl border px-4 py-2 font-bold'} onClick={() => setRoleAndReset('controller')} aria-pressed={role === 'controller'}>공기계 컨트롤러</button></div>
    <section className="rounded-3xl bg-slate-900 p-4 text-white shadow-lg">
      {role === 'display' && <canvas ref={canvasRef} className="w-full rounded-2xl" style={{ aspectRatio: '640 / 260' }} aria-label="점프 러너 게임" />}
      <p className="mt-3 text-sm text-teal-200" role="status">{status}</p>
      <p className="mt-1 text-sm">연결: <strong>{connected ? '연결됨' : '대기 중'}</strong></p>
      <div className="mt-3 flex flex-wrap gap-2">
        {role === 'display' ? <button className={button} onClick={startDisplay}>화면 연결 시작</button> : <button className={button} onClick={startController} disabled={!offer.trim()}>연결 정보로 응답 만들기</button>}
        <button className={secondary} onClick={stop}>연결 끊기</button>
      </div>
      {role === 'display' && <div className="mt-4 space-y-2"><label className="block text-sm font-bold" htmlFor="remote-offer">1. 이 연결 정보를 공기계에 전달</label><textarea id="remote-offer" className="h-24 w-full rounded-lg bg-slate-800 p-2 text-xs" readOnly value={offer} /><button className={secondary} disabled={!offer} onClick={() => copy(offer)}>연결 정보 복사</button><label className="block text-sm font-bold" htmlFor="remote-answer">3. 공기계 응답을 여기에 붙여넣기</label><textarea id="remote-answer" className="h-24 w-full rounded-lg bg-slate-800 p-2 text-xs" value={answer} onChange={event => setAnswer(event.target.value)} /><button className={button} disabled={!answer.trim()} onClick={finishDisplay}>연결 완료</button></div>}
      {role === 'controller' && <div className="mt-4 space-y-2"><label className="block text-sm font-bold" htmlFor="controller-offer">2. 게임 화면의 연결 정보를 붙여넣기</label><textarea id="controller-offer" className="h-24 w-full rounded-lg bg-slate-800 p-2 text-xs" value={offer} onChange={event => setOffer(event.target.value)} /><label className="block text-sm font-bold" htmlFor="controller-answer">생성된 응답을 게임 화면에 전달</label><textarea id="controller-answer" className="h-24 w-full rounded-lg bg-slate-800 p-2 text-xs" readOnly value={answer} /><button className={secondary} disabled={!answer} onClick={() => copy(answer)}>응답 복사</button></div>}
      {role === 'controller' && <div className="mt-4 flex flex-wrap gap-2"><button className={button} disabled={!connected || sensorOn} onClick={startSensor}>움직임 센서 시작</button><button className={secondary} disabled={!connected} onClick={sendJump}>점프 신호 전송 테스트</button></div>}
    </section>
    {error && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-800">{error}</p>}
    <section className="rounded-3xl border border-slate-200 bg-white p-4" aria-label="전송과 움직임 측정값"><h2 className="font-black">실시간 측정</h2><div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      {role === 'controller' ? <><Metric label="센서 단계" value={sensorOn ? reading.phase : '꺼짐'} /><Metric label="보정 진행" value={`${Math.round(reading.progress * 100)}%`} /><Metric label="가속도 크기" value={reading.magnitude.toFixed(1)} /><Metric label="점프 기준" value={reading.threshold.toFixed(1)} /><Metric label="보낸 점프" value={sentCount} /><Metric label="왕복 지연" value={rtt === null ? '—' : `${rtt} ms`} /></> : <><Metric label="받은 점프" value={receivedCount} /><Metric label="렌더링 FPS" value={fps} /><Metric label="수신→렌더 평균" value={renderLatency === null ? '—' : `${renderLatency} ms`} /></>}
      <Metric label="최근 점프" value={lastJumpAt} />
    </div><p className="mt-3 text-xs text-slate-500">왕복 지연은 신호 전송과 응답을 합친 값입니다. 수신→렌더는 표시 기기 내부 시간이며, 몸 움직임 시작과 TV 표시까지의 시간은 포함하지 않습니다.</p></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-black tabular-nums">{value}</p></div>; }
