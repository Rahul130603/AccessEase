import { open, readFile, unlink } from 'node:fs/promises';
import { readFileSync, unlinkSync } from 'node:fs';
import { hostname } from 'node:os';
import path from 'node:path';

// File-backed data and in-memory sessions require one application process.
// Refuse a second writer rather than silently corrupting the database.
export async function lockPlatformDirectory(directory) {
  const filename = path.join(directory, '.platform.lock');
  const owner = { pid: process.pid, host: hostname() };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const file = await open(filename, 'wx', 0o600);
      try { await file.writeFile(JSON.stringify(owner)); } finally { await file.close(); }
      process.once('exit', () => {
        try {
          const current = JSON.parse(readFileSync(filename, 'utf8'));
          if (current.pid === owner.pid && current.host === owner.host) unlinkSync(filename);
        } catch { /* Process termination may already have removed the lock. */ }
      });
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let current;
      try { current = JSON.parse(await readFile(filename, 'utf8')); }
      catch { throw new Error('Platform data is locked. Check the existing application process before restarting.'); }
      if (current.host === owner.host && current.pid === owner.pid) return;
      if (current.host === owner.host && Number.isSafeInteger(current.pid) && current.pid > 0) {
        try { process.kill(current.pid, 0); }
        catch (probe) {
          if (probe.code === 'ESRCH') { await unlink(filename); continue; }
        }
      }
      throw new Error('Platform data is already in use. Configure this application to run as one Node.js worker.');
    }
  }
  throw new Error('Unable to acquire the platform data lock.');
}
