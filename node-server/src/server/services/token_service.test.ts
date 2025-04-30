import {describe, expect, vi} from 'vitest';
import RequestAuthorizer from './token_service.js';
import fakeLogger from '../../../test/fakes/fake_logger.js';
import type {ConfigType} from '@shared/config/config_schema.js';

const MAX_TIMESTAMP = 8640000000000000;

describe('Token service', () => {
  function setupTest() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    const ra = new RequestAuthorizer(
      {
        auth: {
          required: true,
          accessTokenBytes: 8,
          accessTokenRefreshIntervalSec: 1,
          accessTokenValidPeriodSec: 10,
          sessionTokenBytes: 32,
          sessionLengthSec: 30,
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

    it('returns correct session token expiration', () => {
      const ra = setupTest();

      const {sessionToken} = ra.createSessionToken();

      const expires = ra.getSessionTokenExpiry(sessionToken);
      expect(expires).toEqual(new Date(30_000));
    });

    it('returns undefined session token expiration for invalid session tokens', () => {
      const ra = setupTest();

      const {sessionToken} = ra.createSessionToken();

      const expires = ra.getSessionTokenExpiry(sessionToken + 'invalid token');
      expect(expires).toBeUndefined();
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

  describe('Authorization override', it => {
    it('generates access tokens with max expiry', () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as unknown as ConfigType, fakeLogger());

      const {expires} = ra.getAccessToken();

      expect(expires).toEqual(new Date(MAX_TIMESTAMP));
    });

    it('always accepts access tokens', () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as unknown as ConfigType, fakeLogger());

      const {accessToken} = ra.getAccessToken();

      expect(ra.accessTokenIsValid(accessToken)).toBeTruthy();
      expect(ra.accessTokenIsValid('invalid')).toBeTruthy();
    });

    it('generates session tokens with max expiry', () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as unknown as ConfigType, fakeLogger());

      const {sessionToken} = ra.createSessionToken();

      expect(ra.getSessionTokenExpiry(sessionToken)).toEqual(new Date(MAX_TIMESTAMP));
    });

    it('always accepts session tokens', () => {
      const ra = new RequestAuthorizer({auth: {required: false}} as unknown as ConfigType, fakeLogger());

      const {sessionToken} = ra.createSessionToken();

      expect(ra.accessTokenIsValid(sessionToken)).toBeTruthy();
      expect(ra.sessionTokenIsValid('invalid')).toBeTruthy();
    });
  });
});
