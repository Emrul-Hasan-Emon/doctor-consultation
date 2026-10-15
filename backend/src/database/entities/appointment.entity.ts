import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { ActorType, AppointmentCategory, AppointmentStatus } from '../enums';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';
import { Chamber } from './chamber.entity';
import { ChamberTurn } from './chamber-turn.entity';
import type { PatientDetails } from '../interfaces/prescription';

@Entity('appointment')
@Index(['doctorId', 'appointmentDate', 'status'])
@Index(['patientId', 'appointmentDate'])
@Index(['chamberTurnId', 'appointmentDate'])
/**
 * Double-booking guard: one live appointment per slot. Cancelled rows are
 * outside the index, so a cancelled slot can be booked again.
 */
@Index(['chamberTurnId', 'appointmentDate', 'slotNumber'], {
  unique: true,
  where: `"status" <> 'CANCELLED'`,
})
export class Appointment extends AppBaseEntity {
  @Column()
  patientId: number;

  @Column()
  doctorId: number;

  @Column()
  chamberId: number;

  @Column()
  chamberTurnId: number;

  /** Local date (Asia/Dhaka), YYYY-MM-DD. */
  @Column({ type: 'date' })
  appointmentDate: string;

  /** 1-based position inside the turn. */
  @Column({ type: 'int' })
  slotNumber: number;

  /** Snapshots: later turn edits must not rewrite history. */
  @Column({ type: 'time' })
  slotStartTime: string;

  @Column({ type: 'time' })
  slotEndTime: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'int' })
  fee: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentCategory,
    default: AppointmentCategory.NEW,
  })
  category: AppointmentCategory;

  /** Demographics snapshot, editable while prescribing. */
  @Column({ type: 'jsonb', nullable: true })
  patientDetails: PatientDetails | null;

  @Column({ type: 'enum', enum: ActorType })
  bookedByType: ActorType;

  @Column({ type: 'int' })
  bookedById: number;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'enum', enum: ActorType, nullable: true })
  cancelledByType: ActorType | null;

  @Column({ type: 'int', nullable: true })
  cancelledById: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn({ name: 'patientId' })
  patient: Relation<Patient>;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;

  @ManyToOne(() => Chamber)
  @JoinColumn({ name: 'chamberId' })
  chamber: Relation<Chamber>;

  @ManyToOne(() => ChamberTurn)
  @JoinColumn({ name: 'chamberTurnId' })
  chamberTurn: Relation<ChamberTurn>;
}
