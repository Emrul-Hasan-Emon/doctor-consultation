import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from './base/app-base.entity';

/** Global medicine catalog. Admin-managed. */
@Entity('medicine')
export class Medicine extends AppBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  manufacturer: string;

  @Column({ type: 'varchar', length: 255 })
  brandName: string;

  @Column({ type: 'varchar', length: 1024 })
  genericName: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  strength: string | null;

  /** Dosage form, e.g. Tablet. */
  @Column({ type: 'varchar', length: 100 })
  dosage: string;

  @Column({ type: 'varchar', length: 100 })
  dar: string;

  @Column({ default: false })
  isChronic: boolean;

  @Column({ default: true })
  isActive: boolean;

  /** Hash of normalized brand, strength, dosage, manufacturer. Import upserts on it. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceKey: string | null;
}
