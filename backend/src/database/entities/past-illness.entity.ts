import { Column, Entity } from 'typeorm';
import { ReportedBy } from '../enums';
import { DiagnosisChildBase } from './base/diagnosis-child.base';

@Entity('past_illness')
export class PastIllness extends DiagnosisChildBase {
  @Column({ type: 'varchar', length: 1000 })
  illness: string;

  @Column({ type: 'enum', enum: ReportedBy, default: ReportedBy.PATIENT })
  reportedBy: ReportedBy;
}
