import { Column, Entity } from 'typeorm';
import { DiagnosisChildBase } from './base/diagnosis-child.base';

@Entity('family_history')
export class FamilyHistory extends DiagnosisChildBase {
  @Column({ type: 'varchar', length: 1000 })
  history: string;
}
