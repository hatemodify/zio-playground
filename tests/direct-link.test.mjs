import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePacket } from '../src/motion/directLink.ts';

test('공기계의 보정 완료와 점프 패킷을 구분하고 잘못된 메시지는 버린다', () => {
  assert.deepEqual(parsePacket(JSON.stringify({ type: 'ready', sequence: 1, sentAt: 100 })), { type: 'ready', sequence: 1, sentAt: 100 });
  assert.deepEqual(parsePacket(JSON.stringify({ type: 'jump', sequence: 2, sentAt: 120 })), { type: 'jump', sequence: 2, sentAt: 120 });
  assert.equal(parsePacket(JSON.stringify({ type: 'ready', sequence: -1, sentAt: 'now' })), null);
  assert.equal(parsePacket(JSON.stringify({ type: 'unknown', sequence: 3, sentAt: 130 })), null);
});
