import { Column, Entity } from 'typeorm';
import { MenstrualCycle } from '../enums';
import { DiagnosisChildBase } from './base/diagnosis-child.base';

@Entity('menstrual_history')
export class MenstrualHistory extends DiagnosisChildBase {
  /** Last menstrual period. */
  @Column({ type: 'date', nullable: true })
  lmp: string | null;

  /** Expected delivery date. */
  @Column({ type: 'date', nullable: true })
  edd: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  para: string | null;

  @Column({ type: 'int', nullable: true })
  gravida: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  alc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marriedFor: string | null;

  @Column({ type: 'enum', enum: MenstrualCycle, nullable: true })
  menstrualCycle: MenstrualCycle | null;
}
