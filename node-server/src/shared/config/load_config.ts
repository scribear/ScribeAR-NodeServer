import {Ajv} from 'ajv';
import {Value} from '@sinclair/typebox/value';
import type {Static} from '@sinclair/typebox';
import {NodeEnv, SCHEMA, type ConfigType} from './config_schema.js';
import {configDotenv} from 'dotenv';

/**
 * Loads environment configuration file from privated path
 * Checks that configuration is correctly formatted
 * @param path file path to a dotenv file
 * @returns configuration
 */
export default function loadConfig(path?: string): ConfigType {
  // Load from .env file
  configDotenv({path});

  const ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    allowUnionTypes: true,
  });

  const defaults = Value.Default(SCHEMA, {}) as Static<typeof SCHEMA>;
  const env = Object.assign(defaults, process.env);
  const valid = ajv.validate(SCHEMA, env);
  if (!valid) {
    const error = new Error('Invalid Configuration! ' + ajv.errorsText());
    (error as unknown as {errors: unknown}).errors = ajv.errors;
    throw error;
  }

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
      serverAddress: env.SERVER_ADDRESS,
    },
    whisper: {
      endpoint: env.WHISPER_SERVICE_ENDPOINT,
      reconnectIntervalSec: env.WHISPER_RECONNECT_INTERVAL_SEC,
    },
    auth: {
      required: env.REQUIRE_AUTH,
      sourceToken: env.SOURCE_TOKEN,
      accessTokenBytes: env.ACCESS_TOKEN_BYTES,
      accessTokenRefreshIntervalSec: env.ACCESS_TOKEN_REFRESH_INTERVAL_SEC,
      accessTokenValidPeriodSec: env.ACCESS_TOKEN_VALID_PERIOD_SEC,
      sessionTokenBytes: env.SESSION_TOKEN_BYTES,
      sessionLengthSec: env.SESSION_LENGTH_SEC,
    },
  }) as unknown as ConfigType;

  return config;
}
