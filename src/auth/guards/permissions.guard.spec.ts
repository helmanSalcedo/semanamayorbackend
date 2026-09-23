import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import type { AuthenticatedUser } from '../types/jwt-payload.interface';

function createContext(user: Partial<AuthenticatedUser>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  it('allows access when no permissions are required', () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    expect(guard.canActivate(createContext({ permissions: [] }))).toBe(true);
  });

  it('allows access when the user has all required permissions', () => {
    const reflector = {
      getAllAndOverride: () => ['donation.create', 'donation.read'],
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = createContext({
      permissions: ['donation.create', 'donation.read'],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when the user is missing one required permission', () => {
    const reflector = {
      getAllAndOverride: () => ['donation.create', 'donation.refund'],
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = createContext({ permissions: ['donation.create'] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
