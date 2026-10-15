import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { SoftDeleteBaseEntity } from './base/soft-delete-base.entity';
import { ActorType } from '../enums';
import { UserAccount } from './user-account.entity';
import { District } from './district.entity';
import { Division } from './division.entity';
import { DoctorPatient } from './doctor-patient.entity';
import { Appointment } from './appointment.entity';

/** Mobile lives on the linked UserAccount (unique per live patient). */
@Entity('patient')
export class Patient extends SoftDeleteBaseEntity {
  @Index({ unique: true })
  @Column()
  accountId: number;

  @OneToOne(() => UserAccount)
  @JoinColumn({ name: 'accountId' })
  account: Relation<UserAccount>;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameBN: string | null;

  @Index()
  @Column()
  divisionId: number;

  @Index()
  @Column()
  districtId: number;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  addressBN: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ActorType })
  createdByType: ActorType;

  @Column({ type: 'int' })
  createdById: number;

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'divisionId' })
  division: Relation<Division>;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'districtId' })
  district: Relation<District>;

  @OneToMany(() => DoctorPatient, (link) => link.patient)
  doctorPatients: Relation<DoctorPatient[]>;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Relation<Appointment[]>;
}
