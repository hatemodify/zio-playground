import assert from 'node:assert/strict';
import test from 'node:test';
import { PoseClassifier } from '../src/motion/poseClassifier.ts';

const points = ({ x = 0, hip = 0, shoulder = hip, knee = hip, visibility = 0.99 } = {}) => [
  [.40 + x, .25 + shoulder], [.60 + x, .25 + shoulder],
  [.43 + x, .45 + hip], [.57 + x, .45 + hip],
  [.44 + x, .68 + knee], [.56 + x, .68 + knee],
  [.45 + x, .90], [.55 + x, .90],
].map(([px, py]) => ({ x: px, y: py, visibility }));

function calibrated() {
  const classifier = new PoseClassifier();
  let result;
  for (let time = 1000; time <= 3700; time += 100) result = classifier.update(points(), time);
  assert.equal(result.state, 'STANDING');
  return classifier;
}

function sequence(classifier, shape) {
  return [3800, 3900, 4000, 4100, 4200].map(time => classifier.update(points(shape), time));
}

test('중앙에서 2.5초 보정 후 네 동작을 구별한다', () => {
  const motions = [
    [{ hip: -.12, shoulder: -.11, knee: -.08 }, 'JUMP', 'JUMPING'],
    [{ hip: .12, shoulder: .06, knee: .02 }, 'CROUCH', 'CROUCHING'],
    [{ x: -.13 }, 'LEFT', 'MOVING_LEFT'],
    [{ x: .13 }, 'RIGHT', 'MOVING_RIGHT'],
  ];
  for (const [shape, action, state] of motions) {
    const results = sequence(calibrated(), shape);
    assert.ok(results.some(result => result.action === action), `${action} 미발생`);
    assert.ok(results.some(result => result.state === state), `${state} 미전환`);
    if (action === 'JUMP' || action === 'CROUCH') assert.equal(results.filter(result => result.action === action).length, 1);
  }
});

test('전신을 잃거나 신뢰도가 낮으면 입력이 즉시 중단된다', () => {
  const classifier = calibrated();
  sequence(classifier, { x: -.13 });
  assert.equal(classifier.update([], 4300).state, 'NO_BODY');
  assert.equal(classifier.update(points({ visibility: .3 }), 4400).action, 'NONE');
  assert.equal(classifier.update([], 4800).bodyDetected, false);
  assert.equal(classifier.update(points(), 4900).state, 'CALIBRATING');
});

test('불완전한 전신에서는 보정을 시작하지 않는다', () => {
  const classifier = new PoseClassifier();
  assert.equal(classifier.update(points({ x: .40 }), 1000).state, 'NO_BODY');
  assert.equal(classifier.update(points({ visibility: .2 }), 1100).bodyDetected, false);
});

test('앉은 자세는 기준 자세로 보정하지 않는다', () => {
  const classifier = new PoseClassifier();
  let result;
  for (let time = 1000; time <= 4000; time += 100) {
    result = classifier.update(points({ hip: .12, shoulder: .06, knee: -.08 }), time);
  }
  assert.equal(result.state, 'CALIBRATING');
  assert.equal(result.calibrationProgress, 0);
});

test('30fps 입력에서 두 프레임 안에 확실한 동작을 판정하고 한 프레임 잡음은 무시한다', () => {
  const motions = [
    [{ hip: -.12, shoulder: -.11, knee: -.08 }, 'JUMP'],
    [{ hip: .12, shoulder: .06, knee: .02 }, 'CROUCH'],
    [{ x: -.13 }, 'LEFT'],
    [{ x: .13 }, 'RIGHT'],
  ];
  for (const [shape, action] of motions) {
    const classifier = calibrated();
    assert.equal(classifier.update(points(shape), 3733).action, 'NONE');
    assert.equal(classifier.update(points(shape), 3766).action, action);
  }
  const noisy = calibrated();
  assert.equal(noisy.update(points({ x: -.13 }), 3733).action, 'NONE');
  assert.equal(noisy.update(points(), 3766).action, 'NONE');
  for (let time = 3800; time < 4500; time += 33) {
    assert.equal(noisy.update(points({ x: .012, hip: -.008 }), time).action, 'NONE');
  }
});
