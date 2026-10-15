import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { Doctor } from './doctor.entity';

/** A doctor's saved medicine with default frequency, duration, instruction. */
@Entity('doctor_medicine')
@Index(['doctorId', 'medicineId'], { unique: true })
export class DoctorMedicine extends AppBaseEntity {
  @Column()
  doctorId: number;

  /** Catalog id. null for free-text medicines. Soft reference, no FK. */
  @Column({ type: 'int', nullable: true })
  medicineId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brandName: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  genericName: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  strength: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dar: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  frequency: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  duration: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instruction: string | null;

  @Column({ default: false })
  isChronic: boolean;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;
}
