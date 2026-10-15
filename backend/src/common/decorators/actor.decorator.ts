import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthActor } from '../types/auth-actor';

/** Injects the authenticated caller. */
export const Actor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthActor => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { actor: AuthActor }>();
    return request.actor;
  },
);
