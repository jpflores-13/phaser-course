// Build every game in the course into _demos/, so the lesson pages and
// slides can embed them. Runs before `quarto render` (see _quarto.yml).
//
// A game is skipped when its build is newer than every file in it.
// Pass --force to rebuild everything.

import { build } from 'vite';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outRoot = join(root, '_demos');
const force = process.argv.includes('--force');
const groups = ['starter', 'stopping-points', 'solutions', 'remix'];

function findGames(dir) {
  if (!existsSync(dir)) return [];
  if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'index.html'))) return [dir];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'node_modules' && d.name !== 'dist')
    .flatMap((d) => findGames(join(dir, d.name)));
}

function newest(dir) {
  let latest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const path = join(dir, entry.name);
    latest = Math.max(latest, entry.isDirectory() ? newest(path) : statSync(path).mtimeMs);
  }
  return latest;
}

const games = groups.flatMap((g) => findGames(join(root, g)));

const missing = games.filter((g) => !existsSync(join(g, 'public', 'assets')));
if (missing.length) {
  console.error(`No public/assets/ in: ${missing.map((g) => relative(root, g)).join(', ')}`);
  console.error('Run `python3 _scripts/make_assets.py` to copy the assets into every game folder.');
  process.exit(1);
}
let built = 0;

for (const game of games) {
  const name = relative(root, game);
  const outDir = join(outRoot, name);
  const stamp = join(outDir, 'index.html');
  if (!force && existsSync(stamp) && statSync(stamp).mtimeMs > newest(game)) continue;

  await build({
    root: game,
    base: './',
    configFile: false,
    logLevel: 'warn',
    build: { outDir, emptyOutDir: true, chunkSizeWarningLimit: 2000 },
  });
  built += 1;
  console.log(`built ${name}`);
}

console.log(`demos: ${built} built, ${games.length - built} up to date`);
