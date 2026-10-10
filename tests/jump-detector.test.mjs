import assert from 'node:assert/strict';
import test from 'node:test';
import { JumpDetector } from '../src/motion/jumpDetector.ts';

function calibrated() {
  const detector = new JumpDetector();
  for (let time = 0; time <= 4000; time += 20) {
    const magnitude = time < 2000 ? 9.8 : 9.8 + (time % 200 ? 2 : 3);
    detector.update(magnitude, 0, 0, time);
  }
  return detector;
}

test('서 있기와 제자리 달리기 보정 뒤 두 번 연속 큰 움직임만 점프로 판정한다', () => {
  const detector = calibrated();
  assert.equal(detector.update(21, 0, 0, 4020).jump, false);
  assert.equal(detector.update(22, 0, 0, 4040).jump, true);
  assert.equal(detector.update(23, 0, 0, 4060).jump, false);
  assert.equal(detector.update(9.8, 0, 0, 4100).jump, false);
  assert.equal(detector.update(21, 0, 0, 4300).jump, false);
  assert.equal(detector.update(22, 0, 0, 4320).jump, false);
  assert.equal(detector.update(21, 0, 0, 4900).jump, false);
  assert.equal(detector.update(22, 0, 0, 4920).jump, true);
});

test('한 번의 충격과 달리기 수준 움직임은 점프가 아니다', () => {
  const detector = calibrated();
  assert.equal(detector.update(25, 0, 0, 4020).jump, false);
  assert.equal(detector.update(9.8, 0, 0, 4040).jump, false);
  for (let time = 4060; time <= 5000; time += 20) {
    assert.equal(detector.update(time % 80 ? 12 : 13, 0, 0, time).jump, false);
  }
});
