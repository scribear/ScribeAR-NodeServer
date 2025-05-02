import {FastifyInstance} from 'fastify';

/**
 * Registers endpoint for checking if server is alive
 * @param fastify fastify webserver instance
 */
export default function healthcheckHandler(fastify: FastifyInstance) {
  fastify.get('/healthcheck', (req, reply) => {
    return reply.code(200).send('ok');
  });
}
