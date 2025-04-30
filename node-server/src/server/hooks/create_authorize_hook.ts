import type RequestAuthorizer from '@server/services/token_service.js';
import type {ConfigType} from '@shared/config/config_schema.js';
import type {DoneFuncWithErrOrRes, FastifyReply, FastifyRequest} from 'fastify';

export enum Identities {
  SourceToken,
  AccessToken,
  SessionToken,
}

/**
 * Creates a fastify preHandler hook to handle authorizing requests
 * Checks request query string for sessionToken or sourceToken and checks if they are valid
 * A valid sessionToken corresponds to a TranscriptionSink identity
 * A valid sourceToken corresponds to a Kiosk identity
 * If the parsed identity is in allowedIdentities, request is authorized, otherwise it is rejected
 * @param config server config object
 * @param requestAuthorizer requestAuthorizer instance
 * @param allowedIdentities array of identities that should be accepted
 * @returns fastify preHandler hook
 */
export default function createAuthorizeHook(
  config: ConfigType,
  requestAuthorizer: RequestAuthorizer,
  allowedIdentities: Array<Identities>,
) {
  return (
    request: FastifyRequest<{
      Querystring: {accessToken?: string; sessionToken?: string; sourceToken?: string};
      Body?: {accessToken?: string; sessionToken?: string; sourceToken?: string};
    }>,
    reply: FastifyReply,
    done: DoneFuncWithErrOrRes,
  ) => {
    if (!config.auth.required) return done();

    const accessToken = request.body?.accessToken ? request.body?.accessToken : request.query.accessToken;
    if (allowedIdentities.includes(Identities.AccessToken) && requestAuthorizer.accessTokenIsValid(accessToken)) {
      request.log.debug('Request authorized via access token');
      return done();
    }

    const sessionToken = request.body?.sessionToken ? request.body?.sessionToken : request.query.sessionToken;
    if (allowedIdentities.includes(Identities.SessionToken) && requestAuthorizer.sessionTokenIsValid(sessionToken)) {
      const expiration = requestAuthorizer.getSessionTokenExpiry(sessionToken);
      if (expiration) {
        request.log.debug('Request authorized via session token');

        request.authorizationExpiryTimeout = expiration.getTime() - new Date().getTime();
        return done();
      }
    }

    const sourceToken = request.body?.sourceToken ? request.body?.sourceToken : request.query.sourceToken;
    if (allowedIdentities.includes(Identities.SourceToken) && sourceToken === config.auth.sourceToken) {
      request.log.debug('Request authorized via source token');
      return done();
    }

    reply.code(403);
    done(new Error('Unauthorized'));
  };
}
