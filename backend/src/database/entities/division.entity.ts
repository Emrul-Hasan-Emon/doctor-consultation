import { Column, Entity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { District } from './district.entity';

@Entity('division')
export class Division extends AppBaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameBN: string | null;

  @Column({ default: true })
  status: boolean;

  @OneToMany(() => District, (district) => district.division)
  districts: Relation<District[]>;
}
