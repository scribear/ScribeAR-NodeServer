import {Type} from '@sinclair/typebox';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Silent = 'silent',
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

// Define environment schema
export const SCHEMA = Type.Object({
  NODE_ENV: Type.Enum(NodeEnv),

  LOG_LEVEL: Type.Enum(LogLevel),

  HOST: Type.String({default: 'localhost'}),
  PORT: Type.Number({default: 8000}),
  CORS_ORIGIN: Type.String(),

  WHISPER_SERVICE_ENDPOINT: Type.String(),
  WHISPER_RECONNECT_INTERVAL: Type.Number({default: 1000}),

  REQUIRE_AUTH: Type.Boolean(),
  ACCESS_TOKEN_REFRESH_INTERVAL_SEC: Type.Number({default: 5 * 60}),
  ACCESS_TOKEN_VALID_PERIOD_SEC: Type.Number({default: 90 * 60}),
  SESSION_LENGTH_SEC: Type.Number({default: 90 * 60}),
});

export type ConfigType = Readonly<{
  nodeEnv: NodeEnv;
  isDevelopment: boolean;
  isProduction: boolean;
  log: {
    level: LogLevel;
  };
  server: {
    host: string;
    port: number;
    corsOrigin: string;
  };
  whisper: {
    endpoint: string;
    reconnectInterval: number;
  };
  auth: {
    required: boolean;
    accessTokenRefreshIntervalMS: number;
    accessTokenValidPeriodMS: number;
    sessionLengthMS: number;
  };
}>;
