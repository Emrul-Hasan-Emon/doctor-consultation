import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { DiagnosisStatus } from '../enums';
import { Appointment } from './appointment.entity';
import { Doctor } from './doctor.entity';
import { DiagnosisItem } from './diagnosis-item.entity';
import { DiagnosisMedicine } from './diagnosis-medicine.entity';
import type { MealInstruction } from '../interfaces/prescription';

/**
 * The prescription header. One per appointment. Created as an empty draft,
 * autosaved, then completed. Complaints, diagnoses, lab tests and advice are
 * DiagnosisItem rows; medicines are DiagnosisMedicine rows. Medical records are
 * never deleted.
 */
@Entity('diagnosis')
export class Diagnosis extends AppBaseEntity {
  @Index({ unique: true })
  @Column()
  appointmentId: number;

  @Index()
  @Column()
  doctorId: number;

  @Column({
    type: 'enum',
    enum: DiagnosisStatus,
    default: DiagnosisStatus.DRAFT,
  })
  status: DiagnosisStatus;

  /** Nutritionist diet chart. */
  @Column({ type: 'jsonb', nullable: true })
  mealInstruction: MealInstruction[] | null;

  @Column({ type: 'text', nullable: true })
  followUpComment: string | null;

  @Column({ type: 'int', nullable: true })
  followUpDay: number | null;

  @Column({ type: 'date', nullable: true })
  followUpDate: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  /** Object key of the rendered PDF. Presign on read, never store a URL. */
  @Column({ type: 'varchar', length: 1024, nullable: true })
  pdfFileKey: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  pdfGeneratedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  smsSentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  textSmsSentAt: Date | null;

  @ManyToOne(() => Appointment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Relation<Appointment>;

  @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;

  @OneToMany(() => DiagnosisItem, (item) => item.diagnosis)
  items: Relation<DiagnosisItem[]>;

  @OneToMany(() => DiagnosisMedicine, (medicine) => medicine.diagnosis)
  medicines: Relation<DiagnosisMedicine[]>;
}
