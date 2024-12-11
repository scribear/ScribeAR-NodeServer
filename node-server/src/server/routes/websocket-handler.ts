import {FastifyInstance} from 'fastify';

export default function websocketHandler(fastify: FastifyInstance) {
  fastify.get('/sourcesink', {websocket: true}, (ws, req) => {
    fastify.transcriptionEngine.registerSink(ws);
    fastify.transcriptionEngine.registerSource(ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/sink', {websocket: true}, (ws, req) => {
    fastify.transcriptionEngine.registerSink(ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });

  fastify.get('/source', {websocket: true}, (ws, req) => {
    fastify.transcriptionEngine.registerSource(ws);

    ws.on('close', code => {
      req.log.info({msg: 'Websocket closed', code});
    });
  });
}
