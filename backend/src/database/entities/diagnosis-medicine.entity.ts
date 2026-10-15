import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { Diagnosis } from './diagnosis.entity';

/**
 * One prescribed medicine. Name and strength are copied from the catalog so
 * old prescriptions never change when the catalog does.
 */
@Entity('diagnosis_medicine')
export class DiagnosisMedicine extends AppBaseEntity {
  @Index()
  @Column()
  diagnosisId: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /** Catalog id. null for free-text medicines. */
  @Index()
  @Column({ type: 'int', nullable: true })
  medicineId: number | null;

  @Column({ type: 'int', nullable: true })
  doctorMedicineId: number | null;

  @Column({ type: 'varchar', length: 255 })
  brandName: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  genericName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  strength: string | null;

  /** Dosage form, e.g. Tablet. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dar: string | null;

  /** Free text, e.g. 1+0+1. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  frequency: string | null;

  /** Free text, e.g. 10 days. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  duration: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instruction: string | null;

  @Column({ default: false })
  isChronic: boolean;

  @ManyToOne(() => Diagnosis, (diagnosis) => diagnosis.medicines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagnosisId' })
  diagnosis: Relation<Diagnosis>;
}
