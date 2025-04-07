import {describe, expect, vi} from 'vitest';
import RequestAuthorizer from './request_authorizer.js';
import fakeLogger from '../../../test/fakes/fake_logger.js';
import type {ConfigType} from '@shared/config/config_schema.js';
import Fastify from 'fastify';

describe('Request authorizer', () => {
  function setupTest() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    const ra = new RequestAuthorizer(
      {
        auth: {
          required: true,
          accessTokenRefreshIntervalMS: 1_000,
          accessTokenValidPeriodMS: 10_000,
          sessionLengthMS: 30_000,
        },
      } as ConfigType,
      fakeLogger(),
    );
    return ra;
  }

  describe('Access tokens', it => {
    it('generates new access tokens regularly', () => {
      const ra = setupTest();

      const {accessToken: token0} = ra.getAccessToken();
      vi.advanceTimersByTime(2000);
      const {accessToken: token1} = ra.getAccessToken();

      expect(token0).not.toEqual(token1);
    });

    it('generates new access tokens with correct expiration', () => {
      const ra = setupTest();

      const {expires: expires0} = ra.getAccessToken();
      vi.advanceTimersByTime(2000);
      const {expires: expires1} = ra.getAccessToken();

      expect(expires0).toEqual(new Date(10_000));
      expect(expires1).toEqual(new Date(10_000 + 2_000));
    });

    it('accepts valid access token', () => {
      const ra = setupTest();

      const {accessToken} = ra.getAccessToken();

      expect(ra.accessTokenIsValid(accessToken)).toBeTruthy();
    });

    it('rejects expired access tokens', () => {
      const ra = setupTest();

      const {accessToken} = ra.getAccessToken();
      vi.advanceTimersByTime(10_000);

      expect(ra.accessTokenIsValid(accessToken)).not.toBeTruthy();
    });

    it('rejects invalid access tokens', () => {
      const ra = setupTest();

      expect(ra.accessTokenIsValid('invalid')).not.toBeTruthy();
    });
  });

  describe('Session tokens', it => {
    it('generates new unique session tokens', () => {
      const ra = setupTest();

      const {sessionToken: token0} = ra.createSessionToken();
      vi.advanceTimersByTime(2000);
      const {sessionToken: token1} = ra.createSessionToken();

      expect(token0).not.toEqual(token1);
    });

    it('generates new session tokens with correct expiration', () => {
      const ra = setupTest();

      const {expires: expires0} = ra.createSessionToken();
      vi.advanceTimersByTime(2000);
      const {expires: expires1} = ra.createSessionToken();

      expect(expires0).toEqual(new Date(30_000));
      expect(expires1).toEqual(new Date(30_000 + 2_000));
    });

    it('accepts valid session token', () => {
      const ra = setupTest();

      const {sessionToken} = ra.createSessionToken();

      expect(ra.sessionTokenIsValid(sessionToken)).toBeTruthy();
    });

    it('rejects expired session tokens', () => {
      const ra = setupTest();

      const {sessionToken} = ra.createSessionToken();
      vi.advanceTimersByTime(60_000);

      expect(ra.sessionTokenIsValid(sessionToken)).not.toBeTruthy();
    });

    it('rejects invalid session tokens', () => {
      const ra = setupTest();

      expect(ra.sessionTokenIsValid('invalid')).not.toBeTruthy();
    });
  });

  describe('Fastify authentication middleware', it => {
    function setupFastify() {
      const ra = setupTest();
      vi.useRealTimers();

      const fastify = Fastify();
      fastify.decorate('requestAuthorizer', ra);

      fastify.get('/localhost', {preHandler: fastify.requestAuthorizer.authorizeLocalhost}, (req, reply) => {
        return reply.code(200).send();
      });
      fastify.get('/sessionToken', {preHandler: fastify.requestAuthorizer.authorizeSessionToken}, (req, reply) => {
        return reply.code(200).send();
      });

      return fastify;
    }

    it('localhost authorizer accepts localhost request', async () => {
      const fastify = setupFastify();

      const result = await fastify.inject({method: 'GET', url: '/localhost', remoteAddress: '127.0.0.1'});

      expect(result.statusCode).toBe(200);
    });

    it('localhost authorizer rejects non localhost request', async () => {
      const fastify = setupFastify();

      const result = await fastify.inject({method: 'GET', url: '/localhost', remoteAddress: '192.168.0.1'});

      expect(result.statusCode).toBe(403);
    });

    it('session token authorizer accepts localhost request', async () => {
      const fastify = setupFastify();

      const result = await fastify.inject({method: 'GET', url: '/sessionToken', remoteAddress: '127.0.0.1'});

      expect(result.statusCode).toBe(200);
    });

    it('session token authorizer rejects non localhost request without session token', async () => {
      const fastify = setupFastify();

      const result = await fastify.inject({method: 'GET', url: '/sessionToken', remoteAddress: '192.168.0.1'});

      expect(result.statusCode).toBe(403);
    });

    it('session token authorizer accepts non localhost request with valid session token', async () => {
      const fastify = setupFastify();

      const {sessionToken} = fastify.requestAuthorizer.createSessionToken();
      const result = await fastify.inject({
        method: 'GET',
        url: `/sessionToken?sessionToken=${sessionToken}`,
        remoteAddress: '192.168.0.1',
      });

      expect(result.statusCode).toBe(200);
    });
  });

  describe('Authorization override', it => {
    it('always accepts access tokens', () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as ConfigType, fakeLogger());

      const {accessToken} = ra.getAccessToken();

      expect(ra.accessTokenIsValid(accessToken)).toBeTruthy();
      expect(ra.accessTokenIsValid('invalid')).toBeTruthy();
    });

    it('always accepts session tokens', () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as ConfigType, fakeLogger());

      const {sessionToken} = ra.createSessionToken();

      expect(ra.accessTokenIsValid(sessionToken)).toBeTruthy();
      expect(ra.sessionTokenIsValid('invalid')).toBeTruthy();
    });

    it('overrides localhost authorizer', async () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as ConfigType, fakeLogger());
      const fastify = Fastify();
      fastify.decorate('requestAuthorizer', ra);

      fastify.get('/localhost', {preHandler: fastify.requestAuthorizer.authorizeLocalhost}, (req, reply) => {
        return reply.code(200).send();
      });
      const result = await fastify.inject({method: 'GET', url: '/localhost', remoteAddress: '192.168.0.1'});

      expect(result.statusCode).toBe(200);
    });

    it('overrides session token authorizer', async () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as ConfigType, fakeLogger());
      const fastify = Fastify();
      fastify.decorate('requestAuthorizer', ra);

      fastify.get('/sessionToken', {preHandler: fastify.requestAuthorizer.authorizeSessionToken}, (req, reply) => {
        return reply.code(200).send();
      });
      const result = await fastify.inject({method: 'GET', url: '/sessionToken', remoteAddress: '192.168.0.1'});

      expect(result.statusCode).toBe(200);
    });
  });
});
