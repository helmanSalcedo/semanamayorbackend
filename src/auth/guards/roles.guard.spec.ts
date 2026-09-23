import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
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

describe('RolesGuard', () => {
  it('allows access when no roles are required', () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(createContext({ roles: [] }))).toBe(true);
  });

  it('allows access when the user has one of the required roles', () => {
    const reflector = {
      getAllAndOverride: () => ['ADMIN_FESTIVAL', 'SUPER_ADMIN'],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(
      guard.canActivate(createContext({ roles: ['ADMIN_FESTIVAL'] })),
    ).toBe(true);
  });

  it('denies access when the user lacks the required role', () => {
    const reflector = {
      getAllAndOverride: () => ['SUPER_ADMIN'],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() =>
      guard.canActivate(createContext({ roles: ['VIEWER'] })),
    ).toThrow(ForbiddenException);
  });
});
