import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthActor } from '../../../common/types/auth-actor';
import { DatabaseService } from '../../../database/database.service';
import { UserType } from '../../../database/enums';
import { AuthResponseDto, AuthUserDto } from '../dtos/auth-response.dto';
import { AuthCoreService } from './auth-core.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly core: AuthCoreService,
  ) {}

  login(
    identifier: string,
    password: string,
    device?: Record<string, unknown>,
  ): Promise<AuthResponseDto> {
    return this.core.login(UserType.ADMIN, identifier, password, device);
  }

  refresh(refreshToken: string): Promise<AuthResponseDto> {
    return this.core.refresh(UserType.ADMIN, refreshToken);
  }

  logout(refreshToken: string): Promise<void> {
    return this.core.logout(refreshToken);
  }

  async me(actor: AuthActor): Promise<AuthUserDto> {
    const account = await this.db.userAccountRepository.findOne({
      where: { id: actor.accountId },
    });
    if (!account) throw new NotFoundException();
    const profile = await this.core.resolveProfile(account);
    return {
      accountId: account.id,
      type: account.type,
      profileId: profile.profileId,
      name: profile.name,
      mobile: account.mobile,
      email: account.email,
      doctorId: null,
    };
  }
}
