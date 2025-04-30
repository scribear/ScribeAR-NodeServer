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
  NODE_ENV: Type.Enum(NodeEnv, {default: NodeEnv.Production}),

  LOG_LEVEL: Type.Enum(LogLevel, {default: LogLevel.Info}),

  HOST: Type.String({default: 'localhost'}),
  PORT: Type.Number({default: 8080}),
  USE_HTTPS: Type.Boolean({default: false}),
  KEY_FILEPATH: Type.String({default: ''}),
  CERTIFICATE_FILEPATH: Type.String({default: ''}),
  CORS_ORIGIN: Type.String({default: '*'}),
  SERVER_ADDRESS: Type.String({default: '127.0.0.1:8080'}),

  WHISPER_SERVICE_ENDPOINT: Type.String(),
  WHISPER_RECONNECT_INTERVAL_SEC: Type.Number({default: 1}),

  REQUIRE_AUTH: Type.Boolean({default: true}),
  ACCESS_TOKEN_BYTES: Type.Number({default: 32}),
  ACCESS_TOKEN_REFRESH_INTERVAL_SEC: Type.Number({default: 150}),
  ACCESS_TOKEN_VALID_PERIOD_SEC: Type.Number({default: 300}),
  SESSION_TOKEN_BYTES: Type.Number({default: 8}),
  SESSION_LENGTH_SEC: Type.Number({default: 5400}),
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
    useHttps: boolean;
    keyPath: string;
    certificatePath: string;
    corsOrigin: string;
    serverAddress: string;
  };
  whisper: {
    endpoint: string;
    reconnectInterval: number;
  };
  auth: {
    required: boolean;
    accessTokenBytes: number;
    accessTokenRefreshIntervalMS: number;
    accessTokenValidPeriodMS: number;
    sessionTokenBytes: number;
    sessionLengthMS: number;
  };
}>;
