import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { ActorType } from '../enums';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

/**
 * Patient <-> Doctor association. Removing a link sets isActive = false so
 * appointments and prescriptions keep their history. A patient needs at least
 * one active link (service rule).
 */
@Entity('doctor_patient')
@Index(['doctorId', 'patientId'], { unique: true })
@Index(['doctorId', 'isActive'])
@Index(['patientId', 'isActive'])
export class DoctorPatient extends AppBaseEntity {
  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deactivatedAt: Date | null;

  @Column({ type: 'enum', enum: ActorType })
  createdByType: ActorType;

  @Column({ type: 'int' })
  createdById: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.doctorPatients)
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;

  @ManyToOne(() => Patient, (patient) => patient.doctorPatients)
  @JoinColumn({ name: 'patientId' })
  patient: Relation<Patient>;
}
