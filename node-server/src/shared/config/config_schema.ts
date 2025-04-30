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
const RUNTIME_CONFIG = Type.Object({
  NODE_ENV: Type.Enum(NodeEnv, {default: NodeEnv.Production}),
  LOG_LEVEL: Type.Enum(LogLevel, {default: LogLevel.Info}),
});

const SERVER_CONFIG = Type.Object({
  HOST: Type.String({default: 'localhost'}),
  PORT: Type.Number({default: 8080}),
  CORS_ORIGIN: Type.String({default: '*'}),
  SERVER_ADDRESS: Type.String({default: '127.0.0.1:8080'}),
});

const HTTPS_CONFIG = Type.Union([
  Type.Object({
    USE_HTTPS: Type.Literal(false),
    KEY_FILEPATH: Type.Any(),
    CERTIFICATE_FILEPATH: Type.Any(),
  }),
  Type.Object({
    USE_HTTPS: Type.Literal(true),
    KEY_FILEPATH: Type.String({minLength: 1}),
    CERTIFICATE_FILEPATH: Type.String({minLength: 1}),
  }),
]);

const WHISPER_CONFIG = Type.Object({
  WHISPER_SERVICE_ENDPOINT: Type.String({minLength: 1}),
  WHISPER_RECONNECT_INTERVAL_SEC: Type.Number({default: 1}),
});

const AUTH_CONFIG = Type.Union([
  Type.Object({
    REQUIRE_AUTH: Type.Const(false),
    ACCESS_TOKEN_BYTES: Type.Any(),
    ACCESS_TOKEN_REFRESH_INTERVAL_SEC: Type.Any(),
    ACCESS_TOKEN_VALID_PERIOD_SEC: Type.Any(),
    SESSION_TOKEN_BYTES: Type.Any(),
    SESSION_LENGTH_SEC: Type.Any(),
  }),
  Type.Object({
    REQUIRE_AUTH: Type.Const(true),
    ACCESS_TOKEN_BYTES: Type.Number({minimum: 1}),
    ACCESS_TOKEN_REFRESH_INTERVAL_SEC: Type.Number({minimum: 1}),
    ACCESS_TOKEN_VALID_PERIOD_SEC: Type.Number({minimum: 1}),
    SESSION_TOKEN_BYTES: Type.Number({minimum: 1}),
    SESSION_LENGTH_SEC: Type.Number({minimum: 1}),
  }),
]);

// Merge all configs into one schema
export const SCHEMA = Type.Intersect([RUNTIME_CONFIG, SERVER_CONFIG, HTTPS_CONFIG, WHISPER_CONFIG, AUTH_CONFIG]);

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
    serverAddress: string;
  } & (
    | {
        useHttps: false;
      }
    | {
        useHttps: true;
        keyPath: string;
        certPath: string;
      }
  );
  whisper: {
    endpoint: string;
    reconnectIntervalSec: number;
  };
  auth:
    | {required: false}
    | {
        required: true;
        accessTokenBytes: number;
        accessTokenRefreshIntervalSec: number;
        accessTokenValidPeriodSec: number;
        sessionTokenBytes: number;
        sessionLengthSec: number;
      };
}>;
