import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IsNull, MoreThan } from 'typeorm';
import { DatabaseService } from '../../../database/database.service';
import { UserAccount } from '../../../database/entities';
import { UserType } from '../../../database/enums';
import { JwtPayload } from '../../../common/types/auth-actor';
import { tryNormalizeMobile } from '../../../common/utils/mobile';
import { hashPassword, verifyPassword } from '../../../common/utils/password';
import { AuthResponseDto } from '../dtos/auth-response.dto';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

interface Profile {
  profileId: number;
  name: string;
  doctorId: number | null;
}

/** Login, token issue, refresh rotation and logout, shared by every actor type. */
@Injectable()
export class AuthCoreService {
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    type: UserType,
    identifier: string,
    password: string,
    device?: Record<string, unknown>,
  ): Promise<AuthResponseDto> {
    const account = await this.findAccount(type, identifier);
    if (!account) {
      // Spend the same time as a real check so timing does not reveal accounts.
      await verifyPassword(password, await this.getDummyHash());
      throw new UnauthorizedException('Invalid credentials');
    }
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Too many failed attempts. Try again later.',
      );
    }
    const ok =
      !!account.passwordHash &&
      (await verifyPassword(password, account.passwordHash));
    if (!ok) {
      await this.recordFailure(account);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!account.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }
    await this.db.userAccountRepository.update(account.id, {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });
    const profile = await this.resolveProfile(account);
    return this.issue(account, profile, null, device);
  }

  async refresh(
    type: UserType,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    const row = await this.db.authTokenRepository.findOne({
      where: {
        tokenHash: this.hashToken(refreshToken),
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { account: true },
    });
    if (
      !row ||
      row.account.type !== type ||
      !row.account.isActive ||
      row.account.deletedAt
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Rotation: a refresh token works once.
    await this.db.authTokenRepository.update(row.id, { revokedAt: new Date() });
    const profile = await this.resolveProfile(row.account);
    return this.issue(
      row.account,
      profile,
      row.selectedDoctorId,
      row.deviceDetails ?? undefined,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    await this.db.authTokenRepository.update(
      { tokenHash: this.hashToken(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /** Ends every session of an account (password reset, deactivation). */
  async revokeAllSessions(accountId: number): Promise<void> {
    await this.db.manager.query(
      'UPDATE "user_account" SET "tokenVersion" = "tokenVersion" + 1 WHERE "id" = $1',
      [accountId],
    );
    await this.db.authTokenRepository.update(
      { accountId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async resolveProfile(account: UserAccount): Promise<Profile> {
    switch (account.type) {
      case UserType.ADMIN: {
        const p = await this.db.adminUserRepository.findOne({
          where: { accountId: account.id },
        });
        if (!p) break;
        return {
          profileId: p.id,
          name: [p.firstName, p.lastName].filter(Boolean).join(' '),
          doctorId: null,
        };
      }
      case UserType.DOCTOR: {
        const p = await this.db.doctorRepository.findOne({
          where: { accountId: account.id },
        });
        if (!p || !p.isActive) break;
        return { profileId: p.id, name: p.name, doctorId: p.id };
      }
      case UserType.DOCTOR_STAFF: {
        const p = await this.db.doctorStaffRepository.findOne({
          where: { accountId: account.id },
          relations: { doctor: true },
        });
        if (!p || !p.isActive || !p.doctor.isActive) break;
        return { profileId: p.id, name: p.name, doctorId: p.doctorId };
      }
      case UserType.PATIENT: {
        const p = await this.db.patientRepository.findOne({
          where: { accountId: account.id },
        });
        if (!p || !p.isActive) break;
        return { profileId: p.id, name: p.name, doctorId: null };
      }
    }
    throw new UnauthorizedException('Profile is not available');
  }

  private async issue(
    account: UserAccount,
    profile: Profile,
    selectedDoctorId: number | null,
    device?: Record<string, unknown>,
  ): Promise<AuthResponseDto> {
    const doctorId = selectedDoctorId ?? profile.doctorId;
    const payload: JwtPayload = {
      sub: account.id,
      type: account.type,
      pid: profile.profileId,
      did: doctorId,
      tv: account.tokenVersion,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = Number(this.config.get('JWT_REFRESH_TTL_DAYS') ?? 30);
    await this.db.authTokenRepository.save(
      this.db.authTokenRepository.create({
        accountId: account.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
        selectedDoctorId,
        deviceDetails: device ?? null,
      }),
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: Number(this.config.get('JWT_ACCESS_TTL_SECONDS') ?? 900),
      user: {
        accountId: account.id,
        type: account.type,
        profileId: profile.profileId,
        name: profile.name,
        mobile: account.mobile,
        email: account.email,
        doctorId,
      },
    };
  }

  private async findAccount(type: UserType, identifier: string) {
    const trimmed = identifier.trim();
    const mobile = tryNormalizeMobile(trimmed);
    const qb = this.db.userAccountRepository
      .createQueryBuilder('a')
      .addSelect('a.passwordHash')
      .where('a.type = :type', { type });
    if (mobile) qb.andWhere('a.mobile = :mobile', { mobile });
    else qb.andWhere('a.email = :email', { email: trimmed.toLowerCase() });
    return qb.getOne();
  }

  private async recordFailure(account: UserAccount) {
    const failures = account.failedLoginCount + 1;
    const lock = failures >= MAX_FAILED_LOGINS;
    await this.db.userAccountRepository.update(account.id, {
      failedLoginCount: lock ? 0 : failures,
      lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getDummyHash() {
    this.dummyHash ??= hashPassword('not-a-real-password');
    return this.dummyHash;
  }
}
