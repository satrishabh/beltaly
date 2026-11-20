import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Every language file must translate every string the site shows, keeping {placeholders} intact.
test('all locales cover every UI string', () => {
  const run = spawnSync(process.execPath, ['scripts/i18n-keys.mjs', '--check'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
});
