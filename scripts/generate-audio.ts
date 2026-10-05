/**
 * Renders every line in src/data/voice-lines.ts to public/assets/audio/<id>.mp3
 * using macOS `say` (Yuna for Korean, Samantha for English) and `lame`.
 *
 *   brew install lame
 *   node scripts/generate-audio.ts            # only missing clips
 *   node scripts/generate-audio.ts --force    # re-render everything
 *
 * Runs on Node 24's built-in type stripping; the data modules it imports only
 * use `import type`, so no bundler or alias resolution is needed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildVoiceLines } from '../src/data/voice-lines.ts';

const OUT_DIR = resolve(import.meta.dirname, '../public/assets/audio');
const VOICES = { ko: 'Yuna', en: 'Samantha' } as const;
const RATE = 150; // words per minute; a little slower than default for small listeners
const force = process.argv.includes('--force');

mkdirSync(OUT_DIR, { recursive: true });
const lines = buildVoiceLines();
const wanted = new Set(lines.map((line) => `${line.id}.mp3`));

let rendered = 0;
for (const line of lines) {
  const target = join(OUT_DIR, `${line.id}.mp3`);
  if (!force && existsSync(target)) continue;
  const aiff = join(tmpdir(), `${line.id}.aiff`);
  execFileSync('say', ['-v', VOICES[line.lang], '-r', String(RATE), '-o', aiff, line.text]);
  execFileSync('lame', ['--quiet', '-b', '32', '-m', 'm', '--resample', '22.05', aiff, target]);
  unlinkSync(aiff);
  rendered += 1;
}

// Clips whose line was removed or renamed would otherwise linger forever.
let removed = 0;
for (const file of readdirSync(OUT_DIR)) {
  if (file.endsWith('.mp3') && !wanted.has(file)) { unlinkSync(join(OUT_DIR, file)); removed += 1; }
}
console.log(`voice clips: ${lines.length} total, ${rendered} rendered, ${removed} stale removed`);
