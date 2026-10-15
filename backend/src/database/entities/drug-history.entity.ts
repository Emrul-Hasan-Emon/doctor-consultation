import { Column, Entity } from 'typeorm';
import { ReportedBy } from '../enums';
import { DiagnosisChildBase } from './base/diagnosis-child.base';

@Entity('drug_history')
export class DrugHistory extends DiagnosisChildBase {
  @Column({ type: 'varchar', length: 1000 })
  drug: string;

  @Column({ type: 'enum', enum: ReportedBy, default: ReportedBy.PATIENT })
  reportedBy: ReportedBy;
}
