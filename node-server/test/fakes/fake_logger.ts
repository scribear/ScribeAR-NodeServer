import type {Logger} from '@shared/logger/logger.js';
import {vi, type Mocked} from 'vitest';

export default function fakeLogger(): Mocked<Logger> {
  const fakePino = {
    silent: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn().mockImplementation(() => fakePino),
  };
  return fakePino as unknown as Mocked<Logger>;
}
