export type RacePacket =
  | { type: 'drive'; sequence: number; steer: number }
  | { type: 'ping'; sequence: number }
  | { type: 'pong'; sequence: number };

export function steeringFromTilt(angle: number, neutral: number): number {
  if (!Number.isFinite(angle) || !Number.isFinite(neutral)) return 0;
  const delta = Math.max(-90, Math.min(90, angle - neutral));
  const deadZone = 3;
  if (Math.abs(delta) <= deadZone) return 0;
  return Math.sign(delta) * Math.min(1, (Math.abs(delta) - deadZone) / 23);
}

export function parseRacePacket(data: unknown): RacePacket | null {
  if (typeof data !== 'string' || data.length > 120) return null;
  try {
    const packet: unknown = JSON.parse(data);
    if (!packet || typeof packet !== 'object' || !('type' in packet) || !('sequence' in packet) || typeof packet.sequence !== 'number' || !Number.isSafeInteger(packet.sequence) || packet.sequence < 0) return null;
    if (packet.type === 'drive' && 'steer' in packet && typeof packet.steer === 'number' && Number.isFinite(packet.steer) && Math.abs(packet.steer) <= 1) return packet as RacePacket;
    if (packet.type === 'ping' || packet.type === 'pong') return packet as RacePacket;
    return null;
  } catch { return null; }
}
