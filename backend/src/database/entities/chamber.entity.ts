import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { SoftDeleteBaseEntity } from './base/soft-delete-base.entity';
import { ChamberType } from '../enums';
import { Doctor } from './doctor.entity';
import { Hospital } from './hospital.entity';
import { Division } from './division.entity';
import { District } from './district.entity';
import { ChamberDay } from './chamber-day.entity';

@Entity('chamber')
@Check(
  'CHK_chamber_hospital',
  `("chamberType" = 'HOSPITAL') = ("hospitalId" IS NOT NULL)`,
)
export class Chamber extends SoftDeleteBaseEntity {
  @Index()
  @Column()
  doctorId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameBN: string | null;

  @Column({ type: 'enum', enum: ChamberType })
  chamberType: ChamberType;

  /** Required iff chamberType = HOSPITAL. */
  @Column({ type: 'int', nullable: true })
  hospitalId: number | null;

  @Column()
  divisionId: number;

  @Column()
  districtId: number;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'text', nullable: true })
  addressBN: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionBN: string | null;

  /** How far ahead patients may book. */
  @Column({ type: 'int', default: 30 })
  advanceBookingDays: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Doctor, (doctor) => doctor.chambers)
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;

  @ManyToOne(() => Hospital, (hospital) => hospital.chambers, {
    nullable: true,
  })
  @JoinColumn({ name: 'hospitalId' })
  hospital: Relation<Hospital | null>;

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'divisionId' })
  division: Relation<Division>;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'districtId' })
  district: Relation<District>;

  @OneToMany(() => ChamberDay, (day) => day.chamber)
  days: Relation<ChamberDay[]>;
}
