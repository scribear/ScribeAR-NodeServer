import {NodeEnv} from '@shared/config/config-schema.js';
import loadConfig from '@shared/config/load-config.js';
import formatTestNames from '@test/utils/format-test-names.js';
import path from 'path';
import {fileURLToPath} from 'url';
import {beforeEach, describe, expect} from 'vitest';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

describe('Load config', it => {
  const makeEnvPath = (file: string) => path.join(DIRNAME, 'test-config-files', file);

  beforeEach(() => {
    process.env = {};
  });

  it.for(
    formatTestNames([
      {
        name: 'valid0.env',
        envPath: makeEnvPath('valid0.env'),
        expected: {
          nodeEnv: NodeEnv.Test,
          isDevelopment: false,
          isProduction: false,
          log: {level: 'debug'},
          server: {
            host: 'localhost',
            port: 8000,
          },
          whisper: {
            endpoint: 'ws://localhost:43007',
            reconnectInterval: 1000,
          },
        },
      },
      {
        name: 'valid1.env',
        envPath: makeEnvPath('valid1.env'),
        expected: {
          nodeEnv: NodeEnv.Development,
          isDevelopment: true,
          isProduction: false,
          log: {level: 'silent'},
          server: {
            host: 'localhost',
            port: 8000,
          },
          whisper: {
            endpoint: 'ws://localhost:43007',
            reconnectInterval: 5000,
          },
        },
      },
      {
        name: 'valid2.env',
        envPath: makeEnvPath('valid2.env'),
        expected: {
          nodeEnv: NodeEnv.Production,
          isDevelopment: false,
          isProduction: true,
          log: {level: 'error'},
          server: {
            host: 'test.com',
            port: 443,
          },
          whisper: {
            endpoint: 'wss://whisper.test.com/large-v3',
            reconnectInterval: 500,
          },
        },
      },
    ]),
  )('loads valid config: %s', ([, {envPath, expected}]) => {
    const config = loadConfig(envPath);

    expect(config).toEqual(expected);
  });

  it.for(['invalid0.env', 'invalid1.env', 'invalid2.env', 'invalid3.env'])('rejects invalid config: %s', envFile => {
    const envPath = makeEnvPath(envFile);

    expect(() => loadConfig(envPath)).toThrow();
  });
});
