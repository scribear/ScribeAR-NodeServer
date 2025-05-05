import type {Identities} from '@server/services/authentication_service.js';
import type AuthenticationService from '@server/services/authentication_service.js';
import type {Logger} from '@shared/logger/logger.js';
import type {DoneFuncWithErrOrRes, FastifyReply, FastifyRequest} from 'fastify';

/**
 * Creates a fastify preHandler hook to handle authorizing requests
 * Checks request query string for sessionToken or sourceToken and checks if they are valid

 * @param authenticationService authenticationService instance
 * @param allowedIdentities array of identities that should be accepted
 * @returns fastify preHandler hook
 */
export default function createAuthorizeHook(
  authenticationService: AuthenticationService,
  allowedIdentities: Array<Identities>,
) {
  return (
    request: FastifyRequest<{
      Body?: {accessToken?: string; sessionToken?: string; sourceToken?: string};
    }>,
    reply: FastifyReply,
    done: DoneFuncWithErrOrRes,
  ) => {
    const accessToken = request.body?.accessToken;
    const sessionToken = request.body?.sessionToken;
    const sourceToken = request.body?.sourceToken;

    const {authorized, expiresInMs} = authenticationService.authorizeTokens(
      accessToken,
      sessionToken,
      sourceToken,
      allowedIdentities,
      request.log as Logger,
    );

    if (authorized) {
      request.authorizationExpiryTimeout = expiresInMs;
      return done();
    }

    reply.code(403);
    done(new Error('Unauthorized'));
  };
}
