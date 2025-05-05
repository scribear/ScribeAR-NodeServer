import Fastify from 'fastify';
import {describe, expect, vi} from 'vitest';
import createAuthorizeHook from './create_authorize_hook.js';
import type AuthenticationService from '@server/services/authentication_service.js';
import {Identities} from '@server/services/authentication_service.js';

describe('createAuthorizeHook', it => {
  function setupTest(fakeAuthenticationService: AuthenticationService, allowedIdentities: Array<Identities>) {
    const fastify = Fastify();
    const reqHandlerSpy = vi.fn((req, reply) => reply.code(200).send('hi'));
    fastify.post(
      '/test',
      {preHandler: createAuthorizeHook(fakeAuthenticationService, allowedIdentities)},
      reqHandlerSpy,
    );

    return {fastify, reqHandlerSpy};
  }

  it('calls AuthenticationService with provided tokens and identities', async () => {
    const fakeAuthenticationService = {
      authorizeTokens: vi.fn(() => {
        return {authorized: true};
      }),
    } as unknown as AuthenticationService;
    const identities = [Identities.AccessToken, Identities.SourceToken];

    const {fastify} = setupTest(fakeAuthenticationService, identities);
    await fastify.inject({
      method: 'POST',
      path: '/test',
      body: {
        accessToken: 'accessToken',
        sessionToken: 'sessionToken',
        sourceToken: 'sourceToken',
      },
    });

    expect(fakeAuthenticationService.authorizeTokens).toHaveBeenCalledExactlyOnceWith(
      'accessToken',
      'sessionToken',
      'sourceToken',
      identities,
      fastify.log,
    );
  });

  it('accepts request when AuthenticationService accepts tokens', async () => {
    const fakeAuthenticationService = {
      authorizeTokens: vi.fn(() => {
        return {authorized: true};
      }),
    } as unknown as AuthenticationService;

    const {fastify, reqHandlerSpy} = setupTest(fakeAuthenticationService, []);
    await fastify.inject({
      method: 'POST',
      path: '/test',
      body: {
        accessToken: 'accessToken',
        sessionToken: 'sessionToken',
        sourceToken: 'sourceToken',
      },
    });

    expect(reqHandlerSpy).toHaveBeenCalledOnce();
  });

  it('rejects request when AuthenticationService rejects tokens', async () => {
    const fakeAuthenticationService = {
      authorizeTokens: vi.fn(() => {
        return {authorized: false};
      }),
    } as unknown as AuthenticationService;

    const {fastify, reqHandlerSpy} = setupTest(fakeAuthenticationService, []);
    await fastify.inject({
      method: 'POST',
      path: '/test',
      body: {
        accessToken: 'accessToken',
        sessionToken: 'sessionToken',
        sourceToken: 'sourceToken',
      },
    });

    expect(reqHandlerSpy).not.toHaveBeenCalled();
  });

  it('decorates request with authorizationExpiryTimeout when provided', async () => {
    const fakeAuthenticationService = {
      authorizeTokens: vi.fn(() => {
        return {authorized: true, expiresInMs: 1000};
      }),
    } as unknown as AuthenticationService;

    const {fastify, reqHandlerSpy} = setupTest(fakeAuthenticationService, []);
    await fastify.inject({
      method: 'POST',
      path: '/test',
      body: {
        accessToken: 'accessToken',
        sessionToken: 'sessionToken',
        sourceToken: 'sourceToken',
      },
    });

    expect(reqHandlerSpy.mock.calls[0][0].authorizationExpiryTimeout).toBe(1000);
  });
});
