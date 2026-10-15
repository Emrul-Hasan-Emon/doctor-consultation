import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { Doctor } from './doctor.entity';

@Entity('doctor_off_date')
@Index(['doctorId', 'date'], { unique: true })
export class DoctorOffDate extends AppBaseEntity {
  @Column()
  doctorId: number;

  /** Local date (Asia/Dhaka), YYYY-MM-DD. */
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reasonBN: string | null;

  @ManyToOne(() => Doctor, (doctor) => doctor.offDates)
  @JoinColumn({ name: 'doctorId' })
  doctor: Relation<Doctor>;
}
