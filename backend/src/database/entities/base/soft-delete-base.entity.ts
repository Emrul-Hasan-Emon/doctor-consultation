import { DeleteDateColumn } from 'typeorm';
import { AppBaseEntity } from './app-base.entity';

/**
 * Only for rows that must disappear from the app but stay for history
 * (accounts, patients, chambers). Never put a plain UNIQUE column on these:
 * a soft-deleted row would block reuse. Use a generated key instead.
 */
export abstract class SoftDeleteBaseEntity extends AppBaseEntity {
  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
