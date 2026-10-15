import { Column, Entity } from 'typeorm';
import { DiagnosisChildBase } from './base/diagnosis-child.base';

@Entity('vitals')
export class Vitals extends DiagnosisChildBase {
  /** "120/80" */
  @Column({ type: 'varchar', length: 20, nullable: true })
  bloodPressure: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pulseRate: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  temperature: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  respiratoryRate: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  spo2: string | null;
}
