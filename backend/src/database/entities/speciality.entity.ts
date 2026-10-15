import { Column, Entity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { PrescriptionType } from '../enums';
import { AppBaseEntity } from './base/app-base.entity';
import { Doctor } from './doctor.entity';

@Entity('speciality')
export class Speciality extends AppBaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameBN: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titleBN: string | null;

  /** Slug-like key. */
  @Column({ length: 255, unique: true })
  value: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string | null;

  @Column({
    type: 'enum',
    enum: PrescriptionType,
    default: PrescriptionType.GENERAL,
  })
  prescriptionType: PrescriptionType;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Doctor, (doctor) => doctor.speciality)
  doctors: Relation<Doctor[]>;
}
