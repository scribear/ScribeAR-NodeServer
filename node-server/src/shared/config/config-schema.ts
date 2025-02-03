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

  WHISPER_SERVICE_ENDPOINT: Type.String(),
  WHISPER_RECONNECT_INTERVAL: Type.Number({default: 1000}),
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
  };
  whisper: {
    endpoint: string;
    reconnectInterval: number;
  };
}>;
