import {LogLevel, type ConfigType} from '@shared/config/config-schema.js';
import logger from '@shared/logger/logger.js';
import {describe, expect, vi} from 'vitest';
import os from 'os';
import formatTestNames from '@test/utils/format-test-names.js';

describe('Logger', it => {
  const time = 12345;

  const logLines = [
    `{"level":10,"time":${time},"pid":${process.pid},"hostname":"${os.hostname()}","msg":"trace"}\n`,
    `{"level":20,"time":${time},"pid":${process.pid},"hostname":"${os.hostname()}","msg":"debug"}\n`,
    `{"level":30,"time":${time},"pid":${process.pid},"hostname":"${os.hostname()}","msg":"info"}\n`,
    `{"level":40,"time":${time},"pid":${process.pid},"hostname":"${os.hostname()}","msg":"warn"}\n`,
    `{"level":50,"time":${time},"pid":${process.pid},"hostname":"${os.hostname()}","msg":"error"}\n`,
    `{"level":60,"time":${time},"pid":${process.pid},"hostname":"${os.hostname()}","msg":"fatal"}\n`,
  ];

  it.for(
    formatTestNames([
      {name: 'silent', level: LogLevel.Silent, expected: []},
      {name: 'trace', level: LogLevel.Trace, expected: logLines.slice(0)},
      {name: 'debug', level: LogLevel.Debug, expected: logLines.slice(1)},
      {name: 'info', level: LogLevel.Info, expected: logLines.slice(2)},
      {name: 'warn', level: LogLevel.Warn, expected: logLines.slice(3)},
      {name: 'error', level: LogLevel.Error, expected: logLines.slice(4)},
    ]),
  )('logs at configured log level: %s', ([, {level, expected}]) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(time));

    const stdout = vi.fn();
    process.stdout.write = stdout;

    const log = logger({log: {level}} as ConfigType);

    log.trace('trace');
    log.debug('debug');
    log.info('info');
    log.warn('warn');
    log.error('error');
    log.fatal('fatal');

    const createLog = stdout.mock.calls.reduce((log, line) => log + line[0], '');
    expect(createLog).toBe(expected.reduce((log, line) => log + line, ''));
  });
});
