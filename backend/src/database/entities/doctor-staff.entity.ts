import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { ActorType } from '../enums';
import { UserAccount } from './user-account.entity';
import { Doctor } from './doctor.entity';

@Entity('doctor_staff')
export class DoctorStaff extends AppBaseEntity {
  @Index({ unique: true })
  @Column()
  accountId: number;

  @OneToOne(() => UserAccount)
  @JoinColumn({ name: 'accountId' })
  account: Relation<UserAccount>;

  @Index()
  @Column()
  doctorId: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.staff)
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameBN: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ActorType })
  createdByType: ActorType;

  @Column({ type: 'int' })
  createdById: number;
}
