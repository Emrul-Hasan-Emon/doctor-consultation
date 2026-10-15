import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Actor } from '../../../common/decorators/actor.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import { AuthResponseDto, AuthUserDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { AdminAuthService } from '../services/admin-auth.service';

@ApiTags('Admin / Auth')
@Controller('api/auth/admin')
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin login with mobile or email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.service.login(dto.identifier, dto.password, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange a refresh token for a new pair (rotation)',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.service.refresh(dto.refreshToken);
  }

  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke a refresh token' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.service.logout(dto.refreshToken);
  }

  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Current admin' })
  @ApiOkResponse({ type: AuthUserDto })
  me(@Actor() actor: AuthActor) {
    return this.service.me(actor);
  }
}
