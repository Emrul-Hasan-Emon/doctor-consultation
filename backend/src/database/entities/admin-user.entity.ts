import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { AdminRole } from '../enums';
import { UserAccount } from './user-account.entity';

@Entity('admin_user')
export class AdminUser extends AppBaseEntity {
  @Index({ unique: true })
  @Column()
  accountId: number;

  @OneToOne(() => UserAccount)
  @JoinColumn({ name: 'accountId' })
  account: Relation<UserAccount>;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.ADMIN })
  role: AdminRole;
}
