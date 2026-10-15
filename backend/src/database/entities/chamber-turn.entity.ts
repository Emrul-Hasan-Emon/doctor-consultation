import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { ChamberDay } from './chamber-day.entity';

@Entity('chamber_turn')
@Check('CHK_turn_time', '"endTime" > "startTime"')
@Check('CHK_turn_capacity', '"maxPatients" > 0')
@Check('CHK_turn_fee', '"fee" >= 0')
@Check('CHK_turn_slot', '"slotDurationMinutes" > 0')
export class ChamberTurn extends AppBaseEntity {
  @Index()
  @Column()
  chamberDayId: number;

  /** Local time (Asia/Dhaka), HH:mm:ss. */
  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  /**
   * Minutes per patient, copied from the doctor default when the turn is
   * saved. Slot N starts at startTime + (N-1) * slotDurationMinutes.
   */
  @Column({ type: 'int' })
  slotDurationMinutes: number;

  @Column({ type: 'int' })
  maxPatients: number;

  @Column({ type: 'int' })
  fee: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ChamberDay, (day) => day.turns)
  @JoinColumn({ name: 'chamberDayId' })
  chamberDay: Relation<ChamberDay>;
}
