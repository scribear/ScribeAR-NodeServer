import type {ConfigType} from '@shared/config/config_schema.js';
import type {Logger} from '@shared/logger/logger.js';
import crypto from 'node:crypto';

const MAX_TIMESTAMP = 8640000000000000;

export default class TokenService {
  private _validAccessTokens: {[key: string]: Date} = {};
  private _validSessionTokens: {[key: string]: Date} = {};
  private _currentAccessToken = ' ';

  constructor(
    private _config: ConfigType,
    private _log: Logger,
  ) {
    this._updateAccessTokens();

    if (this._config.auth.required) {
      setInterval(() => {
        this._updateAccessTokens();
      }, this._config.auth.accessTokenRefreshIntervalSec * 1000);
    }
  }

  /**
   * Refreshes the currently active token and deletes old access tokens
   * Updates this._currentAccessToken, this._validAccessTokens, and this._validSessionTokens
   */
  private _updateAccessTokens() {
    if (!this._config.auth.required) return;
    this._log.debug('Updating access tokens');

    this._currentAccessToken = crypto.randomBytes(this._config.auth.accessTokenBytes).toString('base64url');
    const expiry = new Date(Date.now() + this._config.auth.accessTokenValidPeriodSec * 1000);
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
   * Computes the expiration date of a new session token
   * @returns expiry date
   */
  private _computeNewSessionExpiry() {
    if (!this._config.auth.required) {
      return new Date(MAX_TIMESTAMP);
    }
    return new Date(Date.now() + this._config.auth.sessionLengthSec * 1000);
  }

  /**
   * Gets the currently active access token and the expiration of said access token
   * @returns object containg access token and expiry date
   */
  getAccessToken() {
    if (!this._config.auth.required) {
      return {
        accessToken: this._currentAccessToken,
        expires: new Date(MAX_TIMESTAMP),
      };
    }

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
   * Fetches expiration time of given session token
   * @param sessionToken session token to fetch
   * @returns expiry date or undefined if no valid session token found
   */
  getSessionTokenExpiry(sessionToken: string | undefined) {
    if (!this._config.auth.required) return new Date(MAX_TIMESTAMP);

    if (typeof sessionToken !== 'string' || !(sessionToken in this._validSessionTokens)) return undefined;
    return this._validSessionTokens[sessionToken];
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
    if (!this._config.auth.required) {
      return {sessionToken: ' ', expires: this._computeNewSessionExpiry()};
    }
    let sessionToken = crypto.randomBytes(this._config.auth.sessionTokenBytes).toString('base64url');
    while (sessionToken in this._validSessionTokens) {
      sessionToken = crypto.randomBytes(this._config.auth.sessionTokenBytes).toString('base64url');
    }

    const expires = this._computeNewSessionExpiry();
    this._validSessionTokens[sessionToken] = expires;

    this._log.trace({msg: 'Creating new session token', sessionToken, expires});

    return {sessionToken, expires};
  }
}
