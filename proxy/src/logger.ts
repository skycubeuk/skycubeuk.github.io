import { createWriteStream, type WriteStream } from 'node:fs';
import { join } from 'node:path';

// Default to /app/logs/auth.log (Docker WORKDIR). Override via LOG_FILE env var.
const LOG_FILE = process.env.LOG_FILE ?? join(process.cwd(), 'logs', 'auth.log');

const enabled = process.env.LOG_LEVEL?.toLowerCase() !== 'off';

let stream: WriteStream | null = null;

if (enabled) {
  try {
    stream = createWriteStream(LOG_FILE, { flags: 'a' });
    stream.on('error', (err) => {
      console.error('[logger] Failed to write to audit log:', err.message);
    });
    console.log(`[logger] Audit log → ${LOG_FILE}`);
  } catch (err) {
    console.error('[logger] Could not open audit log file:', (err as Error).message);
  }
}

/**
 * Appends a structured JSONL entry to the audit log.
 * Fields must not include secrets (tokens, client secret, etc.).
 */
export function log(event: string, fields: Record<string, string> = {}): void {
  if (!stream) return;

  const entry = JSON.stringify({ timestamp: new Date().toISOString(), event, ...fields });
  stream.write(entry + '\n');
}

/**
 * Flushes and closes the audit log write stream.
 * Call this during graceful shutdown to ensure the last entries are flushed to disk.
 */
export function closeLogger(): void {
  if (stream) {
    stream.end();
    stream = null;
  }
}
