import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { Division } from './division.entity';

@Entity('district')
export class District extends AppBaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameBN: string | null;

  @Column({ default: true })
  status: boolean;

  @Column()
  divisionId: number;

  @ManyToOne(() => Division, (division) => division.districts)
  @JoinColumn({ name: 'divisionId' })
  division: Relation<Division>;
}
