import {FastifyInstance} from 'fastify';

/**
 * Registers access token endpoints for fetching qr code access tokens
 * @param fastify
 */
export default function accessTokenHandler(fastify: FastifyInstance) {
  fastify.get('/accessToken', {preHandler: fastify.requestAuthorizer.authorize}, (request, reply) => {
    return reply.send({accessToken: fastify.requestAuthorizer.accessToken});
  });
}
