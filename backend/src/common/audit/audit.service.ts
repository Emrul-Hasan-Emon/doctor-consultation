import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DatabaseService } from '../../database/database.service';
import { ActorType } from '../../database/enums';
import { AuditLog } from '../../database/entities';
import { AuthActor } from '../types/auth-actor';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: number;
  changes?: Record<string, unknown> | null;
  /** Set when the actor acts for a doctor (admin or staff). */
  onBehalfOfDoctorId?: number | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  /** Pass the transaction manager so the log commits or rolls back with the change. */
  async log(
    actor: AuthActor,
    entry: AuditEntry,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(AuditLog)
      : this.db.auditLogRepository;
    await repo.save(
      repo.create({
        actorType: actor.type as unknown as ActorType,
        actorId: actor.profileId,
        onBehalfOfDoctorId: entry.onBehalfOfDoctorId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: entry.changes ?? null,
      }),
    );
  }
}
