import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActorType, AppointmentStatus } from '../enums';

/** Append-only status history of an appointment. */
@Entity('appointment_status_log')
export class AppointmentStatusLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column()
  appointmentId: number;

  @Column({ type: 'enum', enum: AppointmentStatus, nullable: true })
  fromStatus: AppointmentStatus | null;

  @Column({ type: 'enum', enum: AppointmentStatus })
  toStatus: AppointmentStatus;

  @Column({ type: 'enum', enum: ActorType })
  actorType: ActorType;

  @Column({ type: 'int' })
  actorId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
