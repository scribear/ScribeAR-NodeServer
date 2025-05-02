import loadConfig from './shared/config/load_config.js';
import createServer from './server/start_server.js';
import createLogger from './shared/logger/logger.js';

async function init() {
  const config = loadConfig();
  const logger = createLogger(config);
  if (config.isDevelopment) logger.debug({msg: 'App configuration', config});
  const server = createServer(config, logger);

  process.on('uncaughtException', err => {
    logger.fatal({msg: 'Uncaught exception', err});
    throw err; // terminate on uncaught errors
  });

  process.on('unhandledRejection', reason => {
    const err = new Error(`Unhanded rejection. Reason: ${reason}`);
    logger.fatal({msg: 'Unhandled rejection', err});
    throw err; // terminate on uncaught rejection
  });

  try {
    await server.listen({port: config.server.port, host: config.server.host});
  } catch (err) {
    logger.fatal({msg: 'Failed to start webserver', err});
    throw err; // terminate if fails to start
  }

  // Close connection and server on SIGTERM/SIGINT for a graceful exit
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, exiting gracefully.');
    await server.close();
    // eslint-disable-next-line n/no-process-exit
    process.exit();
  });
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, exiting gracefully.');
    await server.close();
    // eslint-disable-next-line n/no-process-exit
    process.exit();
  });
}

await init();
