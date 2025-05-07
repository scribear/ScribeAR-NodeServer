import {describe, expect, vi} from 'vitest';
import type TokenService from './token_service.js';
import type {ConfigType} from '@shared/config/config_schema.js';
import AuthenticationService, {Identities} from './authentication_service.js';
import formatTestNames from '@test/utils/format_test_names.js';
import fakeLogger from '@test/fakes/fake_logger.js';

describe('createAuthorizeHook', it => {
  const validAccessToken = 'valid-access-token';
  const validSessionToken = 'valid-session-token';
  const validSourceToken = 'valid-source-token';

  const fakeConfig = {
    auth: {
      required: true,
      sourceToken: validSourceToken,
    },
  } as ConfigType;

  const fakeTokenService = {
    accessTokenIsValid: vi.fn(token => {
      return token === validAccessToken;
    }),
    sessionTokenIsValid: vi.fn(token => {
      return token === validSessionToken;
    }),
    getSessionTokenExpiry: vi.fn(() => {
      return new Date(Date.now() + 10_000);
    }),
  } as unknown as TokenService;

  const validCases = formatTestNames([
    {
      name: 'Only AccessToken allowed, only AccessToken provided',
      identities: [Identities.AccessToken],
      tokens: {accessToken: validAccessToken, sessionToken: undefined, sourceToken: undefined},
    },
    {
      name: 'Only SessionToken allowed, only SessionToken provided',
      identities: [Identities.SessionToken],
      tokens: {accessToken: undefined, sessionToken: validSessionToken, sourceToken: undefined},
    },
    {
      name: 'Only SourceToken allowed, only SourceToken provided',
      identities: [Identities.SourceToken],
      tokens: {accessToken: undefined, sessionToken: undefined, sourceToken: validSourceToken},
    },
    {
      name: 'All tokens allowed, AccessToken provided',
      identities: [Identities.AccessToken, Identities.SessionToken, Identities.SourceToken],
      tokens: {accessToken: validAccessToken, sessionToken: undefined, sourceToken: undefined},
    },
    {
      name: 'All tokens allowed, SessionToken provided',
      identities: [Identities.AccessToken, Identities.SessionToken, Identities.SourceToken],
      tokens: {accessToken: undefined, sessionToken: validSessionToken, sourceToken: undefined},
    },
    {
      name: 'All tokens allowed, SourceToken provided',
      identities: [Identities.AccessToken, Identities.SessionToken, Identities.SourceToken],
      tokens: {accessToken: undefined, sessionToken: undefined, sourceToken: validSourceToken},
    },
  ]);

  const invalidCases = formatTestNames([
    {
      name: 'Only AccessToken allowed, no tokens provided',
      identities: [Identities.AccessToken],
      tokens: {accessToken: undefined, sessionToken: undefined, sourceToken: undefined},
    },
    {
      name: 'Only SessionToken allowed, no tokens provided',
      identities: [Identities.SessionToken],
      tokens: {accessToken: undefined, sessionToken: undefined, sourceToken: undefined},
    },
    {
      name: 'Only SourceToken allowed, no tokens provided',
      identities: [Identities.SourceToken],
      tokens: {accessToken: undefined, sessionToken: undefined, sourceToken: undefined},
    },
    {
      name: 'All tokens allowed, no tokens provided',
      identities: [Identities.AccessToken, Identities.SessionToken, Identities.SourceToken],
      tokens: {accessToken: undefined, sessionToken: undefined, sourceToken: undefined},
    },
    {
      name: 'Only AccessToken allowed, SessionToken provided',
      identities: [Identities.AccessToken],
      tokens: {accessToken: undefined, sessionToken: validSessionToken, sourceToken: undefined},
    },
    {
      name: 'Only SessionToken allowed, SourceToken provided',
      identities: [Identities.SessionToken],
      tokens: {accessToken: undefined, sessionToken: undefined, sourceToken: validSourceToken},
    },
    {
      name: 'Only SourceToken allowed, AccessToken provided',
      identities: [Identities.SessionToken],
      tokens: {accessToken: validAccessToken, sessionToken: undefined, sourceToken: undefined},
    },
  ]);

  it.for(validCases)('approves authorization whe: %s', ([, {identities, tokens}]) => {
    const {accessToken, sessionToken, sourceToken} = tokens;
    const as = new AuthenticationService(fakeConfig, fakeTokenService);

    const {authorized} = as.authorizeTokens(accessToken, sessionToken, sourceToken, identities, fakeLogger());

    expect(authorized).toBe(true);
  });

  it.for(invalidCases)('rejects authentication when: %s', ([, {identities, tokens}]) => {
    const {accessToken, sessionToken, sourceToken} = tokens;
    const as = new AuthenticationService(fakeConfig, fakeTokenService);

    const {authorized} = as.authorizeTokens(accessToken, sessionToken, sourceToken, identities, fakeLogger());

    expect(authorized).toBe(false);
  });

  it('accepts authentication when authentication is turned off', () => {
    const as = new AuthenticationService({auth: {required: false}} as ConfigType, fakeTokenService);

    const {authorized} = as.authorizeTokens(undefined, undefined, undefined, [], fakeLogger());

    expect(authorized).toBe(true);
  });

  it('returns expiration timeout for session token', () => {
    const as = new AuthenticationService(fakeConfig, fakeTokenService);

    const {expiresInMs} = as.authorizeTokens(
      undefined,
      validSessionToken,
      undefined,
      [Identities.SessionToken],
      fakeLogger(),
    );

    expect(typeof expiresInMs).toBe('number');
    expect(Math.abs((expiresInMs ? expiresInMs : 0) - 10_000)).toBeLessThan(100);
  });
});
