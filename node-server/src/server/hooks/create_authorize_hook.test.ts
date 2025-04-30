import type TokenService from '@server/services/token_service.js';
import type {ConfigType} from '@shared/config/config_schema.js';
import Fastify from 'fastify';
import {describe, expect, vi} from 'vitest';
import createAuthorizeHook, {Identities} from './create_authorize_hook.js';
import formatTestNames from '@test/utils/format_test_names.js';

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

  function setupTest(allowedIdentities: Array<Identities>) {
    const fastify = Fastify();
    const reqHandlerSpy = vi.fn((req, reply) => reply.code(200).send('hi'));
    fastify.post(
      '/test',
      {preHandler: createAuthorizeHook(fakeConfig, fakeTokenService, allowedIdentities)},
      reqHandlerSpy,
    );

    return {fastify, reqHandlerSpy};
  }

  it.for(
    formatTestNames([
      {name: 'AccessToken', identity: Identities.AccessToken, param: `accessToken=${validAccessToken}`},
      {name: 'SessionToken', identity: Identities.SessionToken, param: `sessionToken=${validSessionToken}`},
      {name: 'SourceToken', identity: Identities.SourceToken, param: `sourceToken=${validSourceToken}`},
    ]),
  )('authorizes valid tokens in request query string for identity: %s', async ([, {identity, param}]) => {
    const {fastify, reqHandlerSpy} = setupTest([identity]);

    const reply = await fastify.inject({
      method: 'post',
      url: `/test?${param}`,
    });

    expect(reply.statusCode).toBe(200);
    expect(reqHandlerSpy).toHaveBeenCalled();
  });

  it.for(
    formatTestNames([
      {name: 'AccessToken', identity: Identities.AccessToken, body: {accessToken: validAccessToken}},
      {name: 'SessionToken', identity: Identities.SessionToken, body: {sessionToken: validSessionToken}},
      {name: 'SourceToken', identity: Identities.SourceToken, body: {sourceToken: validSourceToken}},
    ]),
  )('authorizes valid tokens in request body for identity: %s', async ([, {identity, body}]) => {
    const {fastify, reqHandlerSpy} = setupTest([identity]);

    const reply = await fastify.inject({
      method: 'post',
      url: '/test',
      body,
    });

    expect(reply.statusCode).toBe(200);
    expect(reqHandlerSpy).toHaveBeenCalled();
  });

  it.for(
    formatTestNames([
      {name: 'AccessToken', identity: Identities.AccessToken, param: `accessToken=${validSessionToken}`},
      {name: 'SessionToken', identity: Identities.SessionToken, param: `sessionToken=${validAccessToken}`},
      {name: 'SourceToken', identity: Identities.SourceToken, param: `sourceToken=${validAccessToken}`},
    ]),
  )('rejects invalid tokens in request query string for identity: %s', async ([, {identity, param}]) => {
    const {fastify, reqHandlerSpy} = setupTest([identity]);

    const reply = await fastify.inject({
      method: 'post',
      url: `/test?${param}`,
    });

    expect(reply.statusCode).toBe(403);
    expect(reqHandlerSpy).not.toHaveBeenCalled();
  });

  it.for(
    formatTestNames([
      {name: 'AccessToken', identity: Identities.AccessToken, body: {accessToken: validSourceToken}},
      {name: 'SessionToken', identity: Identities.SessionToken, body: {sessionToken: validSourceToken}},
      {name: 'SourceToken', identity: Identities.SourceToken, body: {sourceToken: validSessionToken}},
    ]),
  )('rejects invalid tokens in request body for identity: %s', async ([, {identity, body}]) => {
    const {fastify, reqHandlerSpy} = setupTest([identity]);

    const reply = await fastify.inject({
      method: 'post',
      url: '/test',
      body,
    });

    expect(reply.statusCode).toBe(403);
    expect(reqHandlerSpy).not.toHaveBeenCalled();
  });

  it.for(
    formatTestNames([
      {
        name: 'AccessToken',
        identity: Identities.AccessToken,
        param: `accessToken=${validAccessToken}`,
        body: {accessToken: 'invalid-token'},
      },
      {
        name: 'SessionToken',
        identity: Identities.SessionToken,
        param: `sessionToken=${validSessionToken}`,
        body: {sessionToken: 'invalid-token'},
      },
      {
        name: 'SourceToken',
        identity: Identities.SourceToken,
        param: `sourceToken=${validSourceToken}`,
        body: {sourceToken: 'invalid-token'},
      },
    ]),
  )('prioritizes tokens in request body for identity (invalid): %s', async ([, {identity, param, body}]) => {
    const {fastify, reqHandlerSpy} = setupTest([identity]);

    const reply = await fastify.inject({
      method: 'post',
      url: `/test?${param}`,
      body,
    });

    expect(reply.statusCode).toBe(403);
    expect(reqHandlerSpy).not.toHaveBeenCalled();
  });

  it.for(
    formatTestNames([
      {
        name: 'AccessToken',
        identity: Identities.AccessToken,
        param: 'accessToken=invalid-token',
        body: {accessToken: validAccessToken},
      },
      {
        name: 'SessionToken',
        identity: Identities.SessionToken,
        param: 'sessionToken=invalid-token',
        body: {sessionToken: validSessionToken},
      },
      {
        name: 'SourceToken',
        identity: Identities.SourceToken,
        param: 'sourceToken=invalid-token',
        body: {sourceToken: validSourceToken},
      },
    ]),
  )('prioritizes tokens in request body for identity (valid): %s', async ([, {identity, param, body}]) => {
    const {fastify, reqHandlerSpy} = setupTest([identity]);

    const reply = await fastify.inject({
      method: 'post',
      url: `/test?${param}`,
      body,
    });

    expect(reply.statusCode).toBe(200);
    expect(reqHandlerSpy).toHaveBeenCalled();
  });

  it.for(
    formatTestNames([
      {
        name: 'AccessToken, SessionToken',
        identities: [Identities.AccessToken, Identities.SessionToken],
        expected: [true, true, false],
      },
      {
        name: 'AccessToken, SourceToken',
        identities: [Identities.AccessToken, Identities.SourceToken],
        expected: [true, false, true],
      },
      {
        name: 'SessionToken, SourceToken',
        identities: [Identities.SessionToken, Identities.SourceToken],
        expected: [false, true, true],
      },
      {
        name: 'AccessToken, SessionToken, SourceToken',
        identities: [Identities.AccessToken, Identities.SessionToken, Identities.SourceToken],
        expected: [true, true, true],
      },
    ]),
  )('authorizes multiple identities: %s', async ([, {identities, expected}]) => {
    const {fastify, reqHandlerSpy} = setupTest(identities);

    const toTest = [
      {accessToken: validAccessToken},
      {sessionToken: validSessionToken},
      {sourceToken: validSourceToken},
    ];

    for (let i = 0; i < toTest.length; i++) {
      reqHandlerSpy.mockClear();

      const reply = await fastify.inject({
        method: 'post',
        url: '/test',
        body: toTest[i],
      });

      if (expected[i]) {
        expect(reply.statusCode).toBe(200);
        expect(reqHandlerSpy).toHaveBeenCalled();
      } else {
        expect(reply.statusCode).toBe(403);
        expect(reqHandlerSpy).not.toHaveBeenCalled();
      }
    }
  });

  it('authorizes if auth is disabled for identity', async () => {
    const fastify = Fastify();
    const reqHandlerSpy = vi.fn((req, reply) => reply.code(200).send('hi'));
    fastify.post(
      '/test',
      {preHandler: createAuthorizeHook({auth: {required: false}} as ConfigType, fakeTokenService, [])},
      reqHandlerSpy,
    );

    const reply = await fastify.inject({
      method: 'post',
      url: '/test',
    });

    expect(reply.statusCode).toBe(200);
    expect(reqHandlerSpy).toHaveBeenCalled();
  });

  it('provides session expiration for sessionTokens', async () => {
    const {fastify, reqHandlerSpy} = setupTest([Identities.SessionToken]);

    await fastify.inject({method: 'POST', path: '/test', body: {sessionToken: validSessionToken}});

    expect(Math.abs(reqHandlerSpy.mock.calls[0][0]['authorizationExpiryTimeout'] - 10_000)).toBeLessThan(100);
  });
});
