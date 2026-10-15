import { Column, Entity, Index } from 'typeorm';
import { SoftDeleteBaseEntity } from './base/soft-delete-base.entity';
import { UserType } from '../enums';

/**
 * Login identity for every actor type. Profile tables (AdminUser, Doctor,
 * DoctorStaff, Patient) hold the person data and point here.
 * A new portal or role = a new UserType + a new profile table.
 */
@Entity('user_account')
/** Unique per actor type among live rows. A soft-deleted account frees its mobile and email. */
@Index(['type', 'mobile'], { unique: true, where: `"deletedAt" IS NULL` })
@Index(['type', 'email'], {
  unique: true,
  where: `"deletedAt" IS NULL AND "email" IS NOT NULL`,
})
export class UserAccount extends SoftDeleteBaseEntity {
  @Column({ type: 'enum', enum: UserType })
  type: UserType;

  /** Normalized 01XXXXXXXXX. */
  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  /** Stored lowercase. */
  email: string | null;

  /** null for patients (OTP login). */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isMobileVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  /** Bump to invalidate every issued token for this account. */
  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'int', default: 0 })
  failedLoginCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;
}
