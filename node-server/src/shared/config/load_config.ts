import type {Static} from '@sinclair/typebox';
import {NodeEnv, SCHEMA, type ConfigType} from './config_schema.js';
import envSchema from 'env-schema';

/**
 * Loads environment configuration file from privated path
 * Checks that configuration is correctly formatted
 * @param path file path to a dotenv file
 * @returns configuration
 */
export default function loadConfig(path?: string): ConfigType {
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
      corsOrigin: env.CORS_ORIGIN,
    },
    whisper: {
      endpoint: env.WHISPER_SERVICE_ENDPOINT,
      reconnectInterval: env.WHISPER_RECONNECT_INTERVAL,
    },
    auth: {
      required: env.REQUIRE_AUTH,
      accessTokenRefreshIntervalMS: env.ACCESS_TOKEN_REFRESH_INTERVAL_SEC * 1000,
      accessTokenValidPeriodMS: env.ACCESS_TOKEN_VALID_PERIOD_SEC * 1000,
      sessionLengthMS: env.SESSION_LENGTH_SEC * 1000,
    },
  });

  return config;
}
