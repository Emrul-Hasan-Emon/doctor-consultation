import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { DatabaseService } from '../../database/database.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthActor, JwtPayload } from '../types/auth-actor';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { actor?: AuthActor }>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Revocation: a deactivated account or a bumped tokenVersion ends the session.
    const account = await this.db.userAccountRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, type: true, isActive: true, tokenVersion: true },
    });
    if (
      !account ||
      !account.isActive ||
      account.type !== payload.type ||
      account.tokenVersion !== payload.tv
    ) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    request.actor = {
      accountId: payload.sub,
      type: payload.type,
      profileId: payload.pid,
      doctorId: payload.did,
    };
    return true;
  }
}
