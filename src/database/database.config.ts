import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Resolves the SQLite database path.
 *
 * - `DB_PATH=:memory:` is used by the integration/e2e test suite for an
 *   isolated in-memory SQLite database.
 * - Otherwise a file-based SQLite database is used (default `data/company.sqlite`)
 *   and its parent directory is created automatically.
 */
export function resolveDatabasePath(): string {
  const raw = process.env.DB_PATH ?? 'data/company.sqlite';
  if (raw !== ':memory:') {
    mkdirSync(dirname(raw), { recursive: true });
  }
  return raw;
}