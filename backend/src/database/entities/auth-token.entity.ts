import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { UserAccount } from './user-account.entity';

/** Refresh-token store, one row per session. Hash only. */
@Entity('auth_token')
export class AuthToken extends AppBaseEntity {
  @Index()
  @Column()
  accountId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Index()
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  /** Patient sessions: the doctor chosen at login. */
  @Column({ type: 'int', nullable: true })
  selectedDoctorId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  deviceDetails: Record<string, unknown> | null;

  @ManyToOne(() => UserAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Relation<UserAccount>;
}
