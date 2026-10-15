import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './app-base.entity';
import { ActorType } from '../../enums';
import { Diagnosis } from '../diagnosis.entity';

/**
 * Shared shape of prescription history rows (vitals, illness, drug, family,
 * menstrual). Hard-deleted with the diagnosis. Records the real actor, since
 * a doctor-staff may enter data on behalf of the doctor.
 */
export abstract class DiagnosisChildBase extends AppBaseEntity {
  @Index()
  @Column()
  diagnosisId: number;

  @Column()
  appointmentId: number;

  /** Patient-wide history lists query by this. */
  @Index()
  @Column()
  patientId: number;

  @Column()
  doctorId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: ActorType })
  createdByType: ActorType;

  @Column({ type: 'int' })
  createdById: number;

  @ManyToOne(() => Diagnosis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'diagnosisId' })
  diagnosisRef: Relation<Diagnosis>;
}
