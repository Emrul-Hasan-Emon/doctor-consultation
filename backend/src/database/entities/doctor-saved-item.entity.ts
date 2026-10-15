import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { PrescriptionItemKind } from '../enums';
import { Doctor } from './doctor.entity';

/**
 * A doctor's reusable complaint, diagnosis, lab test or advice text.
 * Replaces the reference's four near-identical tables. Unique per doctor and
 * kind, so saving the same text twice does not duplicate it.
 */
@Entity('doctor_saved_item')
@Index(['doctorId', 'kind', 'text'], { unique: true })
export class DoctorSavedItem extends AppBaseEntity {
  @Column()
  doctorId: number;

  @Column({ type: 'enum', enum: PrescriptionItemKind })
  kind: PrescriptionItemKind;

  @Column({ type: 'varchar', length: 500 })
  text: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;
}
