import {FastifyInstance} from 'fastify';

/**
 * Registers access token and session token endpoints for managing authentication
 * @param fastify
 */
export default function sessionAuthHandler(fastify: FastifyInstance) {
  fastify.get('/accessToken', {preHandler: fastify.requestAuthorizer.authorizeLocalhost}, (request, reply) => {
    const {accessToken, expires} = fastify.requestAuthorizer.getAccessToken();
    return reply.send({
      accessToken,
      serverAddress: fastify.config.server.serverAddress,
      expires: expires.toISOString(),
    });
  });

  fastify.post('/startSession', (request, reply) => {
    if (typeof request.body !== 'object') return reply.code(400).send();
    const {accessToken} = request.body as {accessToken?: string};

    if (!fastify.requestAuthorizer.accessTokenIsValid(accessToken)) {
      return reply.code(401).send();
    }

    const {sessionToken, expires} = fastify.requestAuthorizer.createSessionToken();
    return reply.send({sessionToken, expires: expires.toISOString()});
  });
}
