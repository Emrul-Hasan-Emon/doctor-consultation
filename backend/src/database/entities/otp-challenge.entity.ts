import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { OtpPurpose } from '../enums';

/** One-time code. Only the hash is stored. Short-lived, purge by expiresAt. */
@Entity('otp_challenge')
@Index(['mobile', 'purpose', 'createdAt'])
export class OtpChallenge extends AppBaseEntity {
  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose: OtpPurpose;

  @Column({ type: 'varchar', length: 255 })
  codeHash: string;

  @Index()
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;
}
