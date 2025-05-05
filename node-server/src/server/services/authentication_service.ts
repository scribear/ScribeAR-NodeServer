import type {ConfigType} from '@shared/config/config_schema.js';
import type {Logger} from '@shared/logger/logger.js';
import type TokenService from './token_service.js';

export enum Identities {
  SourceToken,
  AccessToken,
  SessionToken,
}

export default class AuthenticationService {
  constructor(
    private _config: ConfigType,
    private _tokenService: TokenService,
  ) {}

  /**
   * Checks if provided tokens correspond to an allowed identity
   * Token must be valid in order for identity to be considered
   * If the parsed identity is in allowedIdentities, request is authorized, otherwise it is rejected
   * @param accessToken
   * @param sessionToken
   * @param sourceToken
   * @param allowedIdentities
   * @param log
   * @returns object with authorized property indicating result
   *            if identity was a SourceToken, expiresInMs property is also provided
   */
  authorizeTokens(
    accessToken: string | undefined,
    sessionToken: string | undefined,
    sourceToken: string | undefined,
    allowedIdentities: Array<Identities>,
    log: Logger,
  ): {authorized: boolean; expiresInMs?: number} {
    if (!this._config.auth.required) return {authorized: true};

    if (allowedIdentities.includes(Identities.AccessToken) && this._tokenService.accessTokenIsValid(accessToken)) {
      log.debug('Request authorized via access token');
      return {authorized: true};
    }

    if (allowedIdentities.includes(Identities.SessionToken) && this._tokenService.sessionTokenIsValid(sessionToken)) {
      const expiration = this._tokenService.getSessionTokenExpiry(sessionToken);
      if (expiration) {
        log.debug('Request authorized via session token');
        const authorizationExpiryTimeout = expiration.getTime() - new Date().getTime();
        return {authorized: true, expiresInMs: authorizationExpiryTimeout};
      }
    }

    if (allowedIdentities.includes(Identities.SourceToken) && sourceToken === this._config.auth.sourceToken) {
      log.debug('Request authorized via source token');
      return {authorized: true};
    }
    return {authorized: false};
  }
}
