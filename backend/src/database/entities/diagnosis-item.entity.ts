import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { PrescriptionItemKind } from '../enums';
import { Diagnosis } from './diagnosis.entity';

/**
 * Chief complaint, diagnosis, lab test or advice line on a prescription.
 * Rows instead of JSON so they can be searched and reported on.
 */
@Entity('diagnosis_item')
@Index(['diagnosisId', 'kind', 'sortOrder'])
export class DiagnosisItem extends AppBaseEntity {
  @Column()
  diagnosisId: number;

  @Column({ type: 'enum', enum: PrescriptionItemKind })
  kind: PrescriptionItemKind;

  @Column({ type: 'varchar', length: 500 })
  text: string;

  /** Optional coded value, e.g. an ICD-11 code for a diagnosis. */
  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Diagnosis, (diagnosis) => diagnosis.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagnosisId' })
  diagnosis: Relation<Diagnosis>;
}
