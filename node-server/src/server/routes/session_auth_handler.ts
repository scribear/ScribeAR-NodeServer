import createAuthorizeHook from '@server/hooks/create_authorize_hook.js';
import {Identities} from '@server/services/authentication_service.js';
import {FastifyInstance} from 'fastify';

/**
 * Registers access token and session token endpoints for managing authentication
 * @param fastify fastify webserver instance
 */
export default function sessionAuthHandler(fastify: FastifyInstance) {
  fastify.post(
    '/accessToken',
    {preHandler: createAuthorizeHook(fastify.authenticationService, [Identities.SourceToken])},
    (request, reply) => {
      const {accessToken, expires} = fastify.tokenService.getAccessToken();
      return reply.send({
        accessToken,
        serverAddress: fastify.config.server.serverAddress,
        expires: expires.toISOString(),
      });
    },
  );

  fastify.post(
    '/startSession',
    {preHandler: createAuthorizeHook(fastify.authenticationService, [Identities.AccessToken])},
    (request, reply) => {
      if (typeof request.body !== 'object') return reply.code(400).send();
      const {accessToken} = request.body as {accessToken?: string};

      if (!fastify.tokenService.accessTokenIsValid(accessToken)) {
        return reply.code(401).send();
      }

      const {sessionToken, expires} = fastify.tokenService.createSessionToken();
      return reply.send({sessionToken, expires: expires.toISOString()});
    },
  );
}
