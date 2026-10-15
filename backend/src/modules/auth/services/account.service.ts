import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager, IsNull } from 'typeorm';
import { UserAccount } from '../../../database/entities';
import { UserType } from '../../../database/enums';
import { normalizeMobile } from '../../../common/utils/mobile';
import { hashPassword } from '../../../common/utils/password';
import { AuthCoreService } from './auth-core.service';
import { DatabaseService } from '../../../database/database.service';

export interface NewAccount {
  type: UserType;
  mobile: string;
  email?: string | null;
  /** Omit for patients (OTP login). */
  password?: string;
}

/** Creates and maintains login accounts. Profile services call this inside their transaction. */
@Injectable()
export class AccountService {
  constructor(
    private readonly db: DatabaseService,
    private readonly authCore: AuthCoreService,
  ) {}

  async create(
    manager: EntityManager,
    input: NewAccount,
  ): Promise<UserAccount> {
    const repo = manager.getRepository(UserAccount);
    const mobile = normalizeMobile(input.mobile);
    const email = input.email?.trim().toLowerCase() || null;
    await this.assertFree(manager, input.type, mobile, email, null);
    return repo.save(
      repo.create({
        type: input.type,
        mobile,
        email,
        passwordHash: input.password
          ? await hashPassword(input.password)
          : null,
      }),
    );
  }

  /** Change mobile or email. Throws 409 if another live account of the same type has it. */
  async updateContact(
    manager: EntityManager,
    accountId: number,
    type: UserType,
    contact: { mobile?: string; email?: string | null },
  ): Promise<void> {
    const patch: Partial<UserAccount> = {};
    if (contact.mobile !== undefined)
      patch.mobile = normalizeMobile(contact.mobile);
    if (contact.email !== undefined)
      patch.email = contact.email?.trim().toLowerCase() || null;
    await this.assertFree(
      manager,
      type,
      patch.mobile ?? null,
      patch.email ?? null,
      accountId,
    );
    if (Object.keys(patch).length)
      await manager.getRepository(UserAccount).update(accountId, patch);
  }

  async setPassword(accountId: number, password: string): Promise<void> {
    await this.db.userAccountRepository.update(accountId, {
      passwordHash: await hashPassword(password),
      failedLoginCount: 0,
      lockedUntil: null,
    });
    await this.authCore.revokeAllSessions(accountId);
  }

  async setActive(accountId: number, isActive: boolean): Promise<void> {
    await this.db.userAccountRepository.update(accountId, { isActive });
    if (!isActive) await this.authCore.revokeAllSessions(accountId);
  }

  private async assertFree(
    manager: EntityManager,
    type: UserType,
    mobile: string | null,
    email: string | null,
    ignoreId: number | null,
  ) {
    const repo = manager.getRepository(UserAccount);
    const clash = async (where: object) => {
      const hit = await repo.findOne({
        where: { type, deletedAt: IsNull(), ...where },
        select: { id: true },
      });
      return hit && hit.id !== ignoreId;
    };
    if (mobile && (await clash({ mobile }))) {
      throw new ConflictException('This mobile number is already registered');
    }
    if (email && (await clash({ email }))) {
      throw new ConflictException('This email is already registered');
    }
  }
}
