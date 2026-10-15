import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActorType } from '../enums';

/**
 * Append-only record of who changed what. Needed because admins and staff act
 * on behalf of doctors. Never updated or deleted; archive by date.
 */
@Entity('audit_log')
@Index(['entityType', 'entityId'])
@Index(['actorType', 'actorId'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'enum', enum: ActorType })
  actorType: ActorType;

  @Column({ type: 'int' })
  actorId: number;

  /** Set when the actor acted for a doctor (admin or staff). */
  @Column({ type: 'int', nullable: true })
  onBehalfOfDoctorId: number | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column({ type: 'int' })
  entityId: number;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
