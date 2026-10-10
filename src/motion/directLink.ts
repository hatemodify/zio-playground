export type JumpPacket = { type: 'jump'; sequence: number; sentAt: number };
export type EchoPacket = { type: 'echo'; sequence: number; sentAt: number };
export type LinkPacket = JumpPacket | EchoPacket;

export function createPeer() {
  // Host candidates are sufficient for the intended same-Wi-Fi POC.
  return new RTCPeerConnection({ iceServers: [] });
}

function waitForIce(peer: RTCPeerConnection, timeoutMs = 15000): Promise<void> {
  if (peer.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('연결 정보 수집 시간이 초과됐습니다. 같은 Wi-Fi인지 확인해 주세요.')); }, timeoutMs);
    const onChange = () => { if (peer.iceGatheringState === 'complete') { cleanup(); resolve(); } };
    const cleanup = () => { window.clearTimeout(timer); peer.removeEventListener('icegatheringstatechange', onChange); };
    peer.addEventListener('icegatheringstatechange', onChange);
    onChange();
  });
}

export async function createOffer(peer: RTCPeerConnection): Promise<{ offer: string; channel: RTCDataChannel }> {
  const channel = peer.createDataChannel('jump', { ordered: false, maxRetransmits: 0 });
  await peer.setLocalDescription(await peer.createOffer());
  await waitForIce(peer);
  return { offer: JSON.stringify(peer.localDescription), channel };
}

export async function createAnswer(peer: RTCPeerConnection, offer: string): Promise<string> {
  const parsed = parseDescription(offer, 'offer');
  await peer.setRemoteDescription(parsed);
  await peer.setLocalDescription(await peer.createAnswer());
  await waitForIce(peer);
  return JSON.stringify(peer.localDescription);
}

export async function acceptAnswer(peer: RTCPeerConnection, answer: string): Promise<void> {
  await peer.setRemoteDescription(parseDescription(answer, 'answer'));
}

function parseDescription(value: string, type: 'offer' | 'answer'): RTCSessionDescriptionInit {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error('연결 정보 형식이 올바르지 않습니다.'); }
  if (!parsed || typeof parsed !== 'object' || !('type' in parsed) || !('sdp' in parsed) || parsed.type !== type || typeof parsed.sdp !== 'string' || parsed.sdp.length > 100000) {
    throw new Error('연결 정보 형식이 올바르지 않습니다.');
  }
  return { type, sdp: parsed.sdp };
}

export function parsePacket(data: unknown): LinkPacket | null {
  if (typeof data !== 'string' || data.length > 200) return null;
  try {
    const packet: unknown = JSON.parse(data);
    if (!packet || typeof packet !== 'object' || !('type' in packet) || !('sequence' in packet) || !('sentAt' in packet)) return null;
    if ((packet.type !== 'jump' && packet.type !== 'echo') || !Number.isSafeInteger(packet.sequence) || typeof packet.sentAt !== 'number' || !Number.isFinite(packet.sentAt)) return null;
    return packet as LinkPacket;
  } catch { return null; }
}
