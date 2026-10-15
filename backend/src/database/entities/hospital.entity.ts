import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';
import { District } from './district.entity';
import { Division } from './division.entity';
import { Chamber } from './chamber.entity';

@Entity('hospital')
export class Hospital extends AppBaseEntity {
  @Column({ length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameBN: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alias: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aliasBN: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  addressBN: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionBN: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  banner: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string | null;

  @Column({ default: true })
  status: boolean;

  @Column()
  divisionId: number;

  @Column()
  districtId: number;

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'divisionId' })
  division: Relation<Division>;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'districtId' })
  district: Relation<District>;

  @OneToMany(() => Chamber, (chamber) => chamber.hospital)
  chambers: Relation<Chamber[]>;
}
