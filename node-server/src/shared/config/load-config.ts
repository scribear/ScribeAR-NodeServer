import type {Static} from '@sinclair/typebox';
import {NodeEnv, SCHEMA, type ConfigType} from './config-schema.js';
import envSchema from 'env-schema';

export default function loadConfig(path?: string) {
  const env = envSchema<Static<typeof SCHEMA>>({
    dotenv: {path},
    schema: SCHEMA,
  });

  // Application configuration object
  const config: ConfigType = Object.freeze({
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === NodeEnv.Development,
    isProduction: env.NODE_ENV === NodeEnv.Production,
    log: {
      level: env.LOG_LEVEL,
    },
    server: {
      host: env.HOST,
      port: env.PORT,
    },
    whisper: {
      endpoint: env.WHISPER_SERVICE_ENDPOINT,
      reconnectInterval: env.WHISPER_RECONNECT_INTERVAL,
    },
  });

  return config;
}
