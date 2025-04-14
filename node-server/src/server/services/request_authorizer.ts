import type {ConfigType} from '@shared/config/config_schema.js';
import type {Logger} from '@shared/logger/logger.js';
import type {DoneFuncWithErrOrRes, FastifyReply, FastifyRequest} from 'fastify';
import crypto from 'node:crypto';

export default class RequestAuthorizer {
  private _validAccessTokens: {[key: string]: Date} = {};
  private _validSessionTokens: {[key: string]: Date} = {};
  private _currentAccessToken = '';

  constructor(
    private _config: ConfigType,
    private _log: Logger,
  ) {
    this._updateAccessTokens();

    setInterval(() => {
      this._updateAccessTokens();
    }, this._config.auth.accessTokenRefreshIntervalMS);

    this.authorizeLocalhost = this.authorizeLocalhost.bind(this);
    this.authorizeSessionToken = this.authorizeSessionToken.bind(this);
  }

  /**
   * Refreshes the currently active token and deletes old access tokens
   * Updates this._currentAccessToken, this._validAccessTokens, and this._validSessionTokens
   */
  private _updateAccessTokens() {
    this._log.debug('Updating access tokens');

    this._currentAccessToken = crypto.randomBytes(32).toString('base64url');
    const expiry = new Date(Date.now() + this._config.auth.accessTokenValidPeriodMS);
    this._validAccessTokens[this._currentAccessToken] = expiry;
    this._log.trace({msg: 'Created new access token', accessToken: this._currentAccessToken, expiry});

    // Remove invalid tokens
    const currTime = new Date(Date.now());
    for (const token in this._validAccessTokens) {
      if (this._validAccessTokens[token] <= currTime) {
        delete this._validAccessTokens[token];
      }
    }
    for (const token in this._validSessionTokens) {
      if (this._validSessionTokens[token] <= currTime) {
        delete this._validSessionTokens[token];
      }
    }
  }

  /**
   * Gets the currently active access token and the expiration of said access token
   * @returns object containg access token and expiry date
   */
  getAccessToken() {
    return {
      accessToken: this._currentAccessToken,
      expires: this._validAccessTokens[this._currentAccessToken],
    };
  }

  /**
   * Checks if a given access token is valid
   * If authentication is disabled, this function always returns true
   * @param accessToken access token to check
   * @returns true if valid, false otherwise
   */
  accessTokenIsValid(accessToken: string | undefined) {
    if (!this._config.auth.required) return true;

    const valid =
      typeof accessToken === 'string' &&
      accessToken in this._validAccessTokens &&
      this._validAccessTokens[accessToken] > new Date(Date.now());

    this._log.trace({msg: 'Checking access token is valid', accessToken, valid});

    return valid;
  }

  /**
   * Checks if a given session token is valid
   * If authentication is disabled, this function always returns true
   * @param sessionToken session token to check
   * @returns true if valid, false otherwise
   */
  sessionTokenIsValid(sessionToken: string | undefined) {
    if (!this._config.auth.required) return true;

    const valid =
      typeof sessionToken === 'string' &&
      sessionToken in this._validSessionTokens &&
      this._validSessionTokens[sessionToken] > new Date(Date.now());

    this._log.trace({msg: 'Checking session token is valid', sessionToken, valid});

    return valid;
  }

  /**
   * Creates a new session token with configured expiry
   * @returns created session token
   */
  createSessionToken() {
    let sessionToken = crypto.randomBytes(32).toString('base64url');
    while (sessionToken in this._validSessionTokens) {
      sessionToken = crypto.randomBytes(32).toString('base64url');
    }
    const expires = new Date(Date.now() + this._config.auth.sessionLengthMS);
    this._validSessionTokens[sessionToken] = expires;

    this._log.trace({msg: 'Creating new session token', sessionToken, expires});

    return {sessionToken, expires};
  }

  /**
   * Fastify preHandler hook to accept/reject localhost connections
   * @param request Fastify request object
   * @param reply Fastify reply object
   * @param done Fastify done function
   */
  authorizeLocalhost(
    request: FastifyRequest<{Querystring: {sessionToken?: string}}>,
    reply: FastifyReply,
    done: DoneFuncWithErrOrRes,
  ) {
    if (!this._config.auth.required) return done();
    if (request.socket.remoteAddress === '127.0.0.1') return done();

    reply.code(403);
    done(new Error('Unauthorized'));
  }

  /**
   * Fastify preHandler hook to accept/reject localhost and session token connections
   * @param request Fastify request object
   * @param reply Fastify reply object
   * @param done Fastify done function
   */
  authorizeSessionToken(
    request: FastifyRequest<{Querystring: {sessionToken?: string}}>,
    reply: FastifyReply,
    done: DoneFuncWithErrOrRes,
  ) {
    if (!this._config.auth.required) return done();
    if (request.ip === '127.0.0.1' || request.ip === '::1') return done();
    if (this.sessionTokenIsValid(request.query.sessionToken)) return done();

    reply.code(403);
    done(new Error('Unauthorized'));
  }
}
