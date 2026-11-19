// Signed commits (Dinis, 19 Nov 2026, about 01:10 UTC, handover/conductor-common.md in the Factory):
// every commit from the one that adds this file on must carry a good git SSH signature by a key
// that is "active" in team/keys.json of the commit's PARENT (never its own, so a commit cannot
// add the key that signs it). No commit is exempted by author or committer name.
// Usage: node scripts/check-signatures.mjs <before> <after>   (the pushed range, before..after)
// Commits that are ancestors of the commit that added this file are skipped (they predate the rule).
// Prints OK or lists each commit that fails and exits 1. Never prints a key's private part (none is read).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
const lines = (s) => (s ? s.split('\n').filter(Boolean) : []);

const [beforeArg, afterArg] = process.argv.slice(2);
const after = afterArg || 'HEAD';
if (!tryGit('rev-parse', '--verify', '--quiet', `${after}^{commit}`)) { console.error(`check-signatures: unknown commit ${after}`); process.exit(1); }

const first = lines(git('log', '--format=%H', '--diff-filter=A', '--reverse', after, '--', 'scripts/check-signatures.mjs'))[0];
if (!first) { console.error('check-signatures: cannot find the commit that added scripts/check-signatures.mjs'); process.exit(1); }

const zero = /^0+$/;
const before = beforeArg && !zero.test(beforeArg) && tryGit('rev-parse', '--verify', '--quiet', `${beforeArg}^{commit}`);
const range = before ? [`${before}..${after}`] : [after];
const commits = lines(git('rev-list', ...range));
const isOlder = (c) => c !== first && spawnSync('git', ['merge-base', '--is-ancestor', c, first]).status === 0;

const dir = mkdtempSync(join(tmpdir(), 'sigcheck-'));
const signersFor = new Map(); // parent sha -> allowed-signers path or an error string
function allowedSigners(parent) {
  if (signersFor.has(parent)) return signersFor.get(parent);
  let result;
  const text = tryGit('show', `${parent}:team/keys.json`);
  if (text === null) result = { error: 'the parent has no team/keys.json' };
  else {
    let keys;
    try { keys = JSON.parse(text).keys; } catch (e) { keys = null; }
    if (!Array.isArray(keys)) result = { error: "the parent's team/keys.json is not readable" };
    else {
      const out = [];
      for (const k of keys) {
        if (k.status !== 'active' || !k.agent || !k.git_signing_key_pem) continue;
        const pem = join(dir, `k${out.length}-${parent.slice(0, 7)}.pem`);
        writeFileSync(pem, k.git_signing_key_pem);
        const conv = spawnSync('ssh-keygen', ['-i', '-m', 'PKCS8', '-f', pem], { encoding: 'utf8' });
        if (conv.status === 0 && conv.stdout.trim()) out.push(`${k.agent} ${conv.stdout.trim().split(/\s+/).slice(0, 2).join(' ')}`);
      }
      if (!out.length) result = { error: "the parent's team/keys.json has no active git signing key" };
      else {
        const f = join(dir, `allowed-${parent.slice(0, 7)}`);
        writeFileSync(f, out.join('\n') + '\n');
        result = { file: f };
      }
    }
  }
  signersFor.set(parent, result);
  return result;
}

const errors = [];
let checked = 0, skipped = 0;
for (const c of commits) {
  if (isOlder(c)) { skipped++; continue; }
  checked++;
  const subject = git('log', '-1', '--format=%s', c);
  const parent = lines(git('rev-list', '--parents', '-n', '1', c)).join(' ').split(' ')[1];
  if (!parent) { errors.push(`${c.slice(0, 7)} ${subject}: a root commit cannot be checked against a parent's keys`); continue; }
  const s = allowedSigners(parent);
  if (s.error) { errors.push(`${c.slice(0, 7)} ${subject}: ${s.error}`); continue; }
  const v = spawnSync('git', ['-c', 'gpg.format=ssh', '-c', 'gpg.ssh.program=ssh-keygen', '-c', `gpg.ssh.allowedSignersFile=${s.file}`, 'verify-commit', c], { encoding: 'utf8' });
  const said = `${v.stdout}${v.stderr}`;
  if (v.status !== 0 || !/Good "git" signature for /.test(said)) errors.push(`${c.slice(0, 7)} ${subject}: no good signature by an active key in its parent's team/keys.json`);
}
rmSync(dir, { recursive: true, force: true });

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`FAILED (${errors.length} of ${checked} commits checked)`);
  process.exit(1);
}
console.log(`OK (${checked} commits checked, ${skipped} older than the check skipped)`);
