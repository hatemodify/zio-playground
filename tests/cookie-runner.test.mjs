import assert from 'node:assert/strict';
import test from 'node:test';
import { CookieRunner, obstacleIsDangerous } from '../src/motion/CookieRunner.ts';

const canvas = { getContext: () => ({}) };

test('점프와 슬라이드가 각 장애물을 피하는 규칙을 구분한다', () => {
  assert.equal(obstacleIsDangerous('stump', 0, false), true);
  assert.equal(obstacleIsDangerous('stump', -70, false), false);
  assert.equal(obstacleIsDangerous('branch', 0, true), false);
  assert.equal(obstacleIsDangerous('branch', -100, false), true);
});

test('정식 러너는 시작, 일시정지, 재개, 다시 시작 상태를 관리한다', () => {
  const runner = new CookieRunner(canvas);
  assert.equal(runner.stats.phase, 'ready');
  assert.equal(runner.stats.finish, 1200);
  assert.equal(runner.jump(), false);
  runner.start();
  assert.equal(runner.stats.phase, 'running');
  assert.equal(runner.jump(), true);
  assert.equal(runner.jump(), false);
  runner.pause();
  assert.equal(runner.stats.phase, 'paused');
  runner.resume();
  assert.equal(runner.stats.phase, 'running');
  runner.reset();
  assert.equal(runner.stats.phase, 'ready');
  assert.equal(runner.stats.hearts, 3);
  assert.equal(runner.stats.score, 0);
});

test('1,200m 결승선을 통과하면 완주 이벤트가 한 번만 발생한다', () => {
  const context = new Proxy({}, {
    get(_target, key) {
      if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
    set() { return true; },
  });
  const events = [];
  const runner = new CookieRunner({ getContext: () => context }, event => events.push(event));
  runner.start();
  runner.spawnIn = Infinity;
  for (let now = 1000; now <= 52000; now += 50) runner.draw(now);
  assert.equal(runner.stats.phase, 'won');
  assert.equal(runner.stats.distance, 1200);
  assert.equal(events.filter(event => event === 'won').length, 1);
  assert.equal(runner.stats.stage, 3);
});
