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
import { AppBaseEntity } from './base/app-base.entity';
import { UserAccount } from './user-account.entity';
import { Speciality } from './speciality.entity';
import { DoctorStaff } from './doctor-staff.entity';
import { Chamber } from './chamber.entity';
import { DoctorOffDate } from './doctor-off-date.entity';
import { DoctorPatient } from './doctor-patient.entity';

/** Mobile, email and password live on the linked UserAccount. */
@Entity('doctor')
export class Doctor extends AppBaseEntity {
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

  /** Object key in file storage, not a URL. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePic: string | null;

  /** Object key. Printed on the prescription PDF. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  signatureUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  degrees: string | null;

  @Column({ type: 'text', nullable: true })
  degreesBN: string | null;

  @Column({ type: 'int', nullable: true })
  experience: number | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  bmdcCode: string | null;

  @Column({ type: 'date', nullable: true })
  bmdcExpiryDate: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workingAt: string | null;

  @Column({ type: 'text', nullable: true })
  workingAtBN: string | null;

  @Column({ type: 'text', nullable: true })
  biography: string | null;

  @Column({ type: 'text', nullable: true })
  biographyBN: string | null;

  /**
   * Default minutes per patient. Copied onto each new chamber turn, so changing
   * it later does not shift slots on existing turns.
   */
  @Column({ type: 'int', default: 15 })
  consultationDurationMinutes: number;

  /** Default follow-up window (days) when the prescription sets none. */
  @Column({ type: 'int', nullable: true })
  defaultFollowUpDays: number | null;

  /** Visible and bookable. Login is controlled by UserAccount.isActive. */
  @Column({ default: true })
  isActive: boolean;

  @Index()
  @Column({ type: 'int', nullable: true })
  specialityId: number | null;

  @ManyToOne(() => Speciality, (speciality) => speciality.doctors, {
    nullable: true,
  })
  @JoinColumn({ name: 'specialityId' })
  speciality: Relation<Speciality | null>;

  @OneToMany(() => DoctorStaff, (staff) => staff.doctor)
  staff: Relation<DoctorStaff[]>;

  @OneToMany(() => Chamber, (chamber) => chamber.doctor)
  chambers: Relation<Chamber[]>;

  @OneToMany(() => DoctorOffDate, (offDate) => offDate.doctor)
  offDates: Relation<DoctorOffDate[]>;

  @OneToMany(() => DoctorPatient, (link) => link.doctor)
  doctorPatients: Relation<DoctorPatient[]>;
}
