import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { Weekday } from '../enums';
import { Chamber } from './chamber.entity';
import { ChamberTurn } from './chamber-turn.entity';

@Entity('chamber_day')
@Index(['chamberId', 'weekday'], { unique: true })
export class ChamberDay extends AppBaseEntity {
  @Column()
  chamberId: number;

  @Column({ type: 'smallint' })
  weekday: Weekday;

  @Column({ default: false })
  isOff: boolean;

  @ManyToOne(() => Chamber, (chamber) => chamber.days)
  @JoinColumn({ name: 'chamberId' })
  chamber: Relation<Chamber>;

  @OneToMany(() => ChamberTurn, (turn) => turn.chamberDay)
  turns: Relation<ChamberTurn[]>;
}
