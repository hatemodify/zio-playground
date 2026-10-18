import assert from 'node:assert/strict';
import test from 'node:test';
import { steeringFromTilt, parseRacePacket } from '../src/motion/raceControl.ts';

test('기울임 조향은 중립 흔들림을 무시하고 양쪽 끝에서 제한된다', () => {
  assert.equal(steeringFromTilt(11, 10), 0);
  assert.equal(steeringFromTilt(35, 10), 22 / 23);
  assert.equal(steeringFromTilt(-20, 10), -1);
  assert.equal(steeringFromTilt(90, 10), 1);
  assert.equal(steeringFromTilt(NaN, 10), 0);
});

test('레이싱 입력은 범위와 순서 번호가 올바른 패킷만 받는다', () => {
  assert.deepEqual(parseRacePacket('{"type":"drive","sequence":2,"steer":-0.7}'), { type: 'drive', sequence: 2, steer: -0.7 });
  assert.equal(parseRacePacket('{"type":"drive","sequence":3,"steer":4}'), null);
  assert.equal(parseRacePacket('{"type":"drive","sequence":-1,"steer":0}'), null);
  assert.equal(parseRacePacket('{"type":"drive","sequence":2,"steer":"0"}'), null);
});
