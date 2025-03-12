import loadConfig from './shared/config/load_config.js';
import createServer from './server/start_server.js';
import createLogger from './shared/logger/logger.js';

async function init() {
  const config = loadConfig();
  const logger = createLogger(config);
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
}

await init();
