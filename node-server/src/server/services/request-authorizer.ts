import type {ConfigType} from '@shared/config/config-schema.js';
import type {DoneFuncWithErrOrRes, FastifyReply, FastifyRequest} from 'fastify';
import crypto from 'node:crypto';

export default class RequestAuthorizer {
  private _accessToken;
  get accessToken() {
    return this._accessToken;
  }

  constructor(private _config: ConfigType) {
    if (this._config.auth.overrideToken !== '') {
      this._accessToken = this._config.auth.overrideToken;
    } else {
      this._accessToken = crypto.randomBytes(32).toString('base64url');
    }

    this.authorize = this.authorize.bind(this);
  }

  authorize(
    request: FastifyRequest<{Querystring: {accessToken?: string}}>,
    reply: FastifyReply,
    done: DoneFuncWithErrOrRes,
  ) {
    if (!this._config.auth.required) return done();
    if (this._config.auth.allowLocalhost && request.socket.remoteAddress === '127.0.0.1') return done();
    if (request.query['accessToken'] === this._accessToken) return done();

    reply.code(401);
    done(new Error('Invalid access token'));
  }
}
