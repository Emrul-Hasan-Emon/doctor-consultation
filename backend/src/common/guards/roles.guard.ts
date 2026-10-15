import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UserType } from '../../database/enums';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthActor } from '../types/auth-actor';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }
    const roles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      targets,
    );
    // Fail closed: a route without @Roles is not callable.
    if (!roles?.length) {
      throw new ForbiddenException('Route has no role policy');
    }
    const actor = context
      .switchToHttp()
      .getRequest<Request & { actor?: AuthActor }>().actor;
    if (!actor || !roles.includes(actor.type)) {
      throw new ForbiddenException('Not allowed for this account type');
    }
    return true;
  }
}
