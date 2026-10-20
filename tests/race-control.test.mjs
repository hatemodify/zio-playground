import assert from 'node:assert/strict';
import test from 'node:test';
import { RaceSidestepDetector } from '../src/motion/raceControl.ts';

test('옆으로 이동하면 한 차선만 바꾸고 중앙 복귀 때는 자동차를 움직이지 않는다', () => {
  const detector = new RaceSidestepDetector();
  assert.equal(detector.update(0.02, 100), 0);
  assert.equal(detector.update(-0.12, 200), 0);
  assert.equal(detector.update(-0.14, 260), -1);
  assert.equal(detector.update(-0.2, 320), 0);
  assert.equal(detector.update(0.01, 400), 0);
  assert.equal(detector.update(0.02, 450), 0);
  assert.equal(detector.update(-0.13, 760), 0);
  assert.equal(detector.update(-0.15, 820), -1);
});

test('중앙 복귀 후 반대 방향 이동과 재보정을 처리한다', () => {
  const detector = new RaceSidestepDetector();
  detector.update(0.15, 100);
  assert.equal(detector.update(0.16, 150), 1);
  detector.update(0.01, 200);
  detector.update(0.01, 250);
  assert.equal(detector.update(-0.13, 600), 0);
  assert.equal(detector.update(-0.15, 650), -1);
  detector.reset();
  assert.equal(detector.update(Number.NaN, 700), 0);
  assert.equal(detector.update(0.15, 750), 0);
  assert.equal(detector.update(0.16, 800), 1);
});

test('일시정지에서 복귀할 때 옆에 서 있는 자세는 새 이동으로 처리하지 않는다', () => {
  const detector = new RaceSidestepDetector();
  detector.reset(false);
  assert.equal(detector.update(0.18, 100), 0);
  assert.equal(detector.update(0.18, 160), 0);
  detector.update(0.01, 200);
  detector.update(0.01, 260);
  assert.equal(detector.update(-0.13, 320), 0);
  assert.equal(detector.update(-0.14, 380), -1);
});
