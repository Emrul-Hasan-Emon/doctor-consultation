import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { SmsStatus } from '../enums';

/**
 * Outbox for SMS. Requests write a row in their transaction; a worker sends.
 * Keeps booking and prescription completion independent of the SMS provider.
 */
@Entity('sms_outbox')
@Index(['status', 'createdAt'])
export class SmsOutbox extends AppBaseEntity {
  @Column({ type: 'varchar', length: 20 })
  toMobile: string;

  @Column({ type: 'varchar', length: 100 })
  template: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: SmsStatus, default: SmsStatus.PENDING })
  status: SmsStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  providerMessageId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;
}
