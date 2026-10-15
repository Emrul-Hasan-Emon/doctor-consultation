import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { paginated, Paginated } from '../../../common/dto/paginated';
import { AuthActor } from '../../../common/types/auth-actor';
import { escapeLike } from '../../../common/utils/like';
import { DatabaseService } from '../../../database/database.service';
import { Medicine } from '../../../database/entities';
import {
  CreateMedicineDto,
  ImportErrorDto,
  ImportMedicinesResultDto,
  MedicineDto,
  MedicineListQueryDto,
  UpdateMedicineDto,
} from '../dtos/medicine.dto';
import {
  MedicineFields,
  medicineSourceKey,
  validateMedicineItem,
} from '../utils/medicine-import';

const CHUNK = 1000;
const REQUIRED_FIELDS = [
  'manufacturer',
  'brandName',
  'genericName',
  'dosage',
  'dar',
  'isChronic',
  'isActive',
];
const COMPARED = [
  'manufacturer',
  'brandName',
  'genericName',
  'strength',
  'dosage',
  'dar',
] as const;

@Injectable()
export class AdminMedicineService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async list(query: MedicineListQueryDto): Promise<Paginated<MedicineDto>> {
    const { page, limit, search, isActive, isChronic } = query;
    const qb = this.db.medicineRepository.createQueryBuilder('m');
    if (isActive !== undefined)
      qb.andWhere('m.isActive = :isActive', { isActive });
    if (isChronic !== undefined) {
      qb.andWhere('m.isChronic = :isChronic', { isChronic });
    }
    if (search) {
      qb.andWhere(
        '(lower(m.brandName) LIKE :q OR lower(m.genericName) LIKE :q)',
        { q: `%${escapeLike(search.toLowerCase())}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('m.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginated(items, total, page, limit);
  }

  async get(id: number): Promise<MedicineDto> {
    const row = await this.db.medicineRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Medicine not found');
    return row;
  }

  create(dto: CreateMedicineDto, actor: AuthActor): Promise<MedicineDto> {
    const input = {
      ...dto,
      brandName: dto.brandName.trim(),
      manufacturer: dto.manufacturer.trim(),
      genericName: dto.genericName.trim(),
      dosage: dto.dosage.trim(),
      dar: dto.dar.trim(),
      strength: dto.strength?.trim() || null,
    };
    const sourceKey = medicineSourceKey(input);
    return this.db.transaction(async (manager) => {
      await this.assertKeyFree(sourceKey, manager);
      const repo = manager.getRepository(Medicine);
      const row = await repo.save(repo.create({ ...input, sourceKey }));
      await this.audit.log(
        actor,
        {
          action: 'medicine.create',
          entityType: 'medicine',
          entityId: row.id,
          changes: { ...input },
        },
        manager,
      );
      return row;
    });
  }

  update(
    id: number,
    dto: UpdateMedicineDto,
    actor: AuthActor,
  ): Promise<MedicineDto> {
    for (const key of REQUIRED_FIELDS) {
      if ((dto as Record<string, unknown>)[key] === null) {
        throw new BadRequestException(`${key} cannot be null`);
      }
    }
    return this.db.transaction(async (manager) => {
      const repo = manager.getRepository(Medicine);
      const row = await repo.findOne({ where: { id } });
      if (!row) throw new NotFoundException('Medicine not found');
      Object.assign(row, dto);
      for (const key of [
        'manufacturer',
        'brandName',
        'genericName',
        'dosage',
        'dar',
      ] as const) {
        row[key] = row[key].trim();
      }
      row.strength = row.strength?.trim() || null;
      const sourceKey = medicineSourceKey(row);
      if (sourceKey !== row.sourceKey) {
        await this.assertKeyFree(sourceKey, manager, id);
        row.sourceKey = sourceKey;
      }
      const saved = await repo.save(row);
      await this.audit.log(
        actor,
        {
          action: 'medicine.update',
          entityType: 'medicine',
          entityId: id,
          changes: { ...dto },
        },
        manager,
      );
      return saved;
    });
  }

  async import(
    items: unknown[],
    actor: AuthActor,
  ): Promise<ImportMedicinesResultDto> {
    const errors: ImportErrorDto[] = [];
    const byKey = new Map<string, MedicineFields>();
    let skipped = 0;

    items.forEach((raw, index) => {
      const result = validateMedicineItem(raw);
      if (!result.ok) {
        errors.push({ index, message: result.message });
        return;
      }
      const key = medicineSourceKey(result.value);
      if (byKey.has(key)) skipped += 1;
      else byKey.set(key, result.value);
    });

    const entries = [...byKey.entries()];
    let created = 0;
    let updated = 0;

    await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(Medicine);
      for (let i = 0; i < entries.length; i += CHUNK) {
        const chunk = entries.slice(i, i + CHUNK);
        const existing = await repo.find({
          where: { sourceKey: In(chunk.map(([key]) => key)) },
        });
        const existingByKey = new Map(existing.map((m) => [m.sourceKey, m]));
        const toInsert: Partial<Medicine>[] = [];
        for (const [sourceKey, value] of chunk) {
          const current = existingByKey.get(sourceKey);
          if (!current) {
            toInsert.push({ ...value, sourceKey });
            continue;
          }
          const changes: Partial<Medicine> = {};
          for (const f of COMPARED) {
            if (current[f] !== value[f])
              Object.assign(changes, { [f]: value[f] });
          }
          if (
            value.isChronic !== undefined &&
            value.isChronic !== current.isChronic
          ) {
            changes.isChronic = value.isChronic;
          }
          if (
            value.isActive !== undefined &&
            value.isActive !== current.isActive
          ) {
            changes.isActive = value.isActive;
          }
          if (Object.keys(changes).length === 0) {
            skipped += 1;
            continue;
          }
          await repo.update(current.id, changes);
          updated += 1;
        }
        if (toInsert.length) {
          await repo.insert(toInsert);
          created += toInsert.length;
        }
      }
      await this.audit.log(
        actor,
        {
          action: 'medicine.import',
          entityType: 'medicine',
          entityId: 0,
          changes: {
            received: items.length,
            created,
            updated,
            skipped,
            errors: errors.length,
          },
        },
        manager,
      );
    });

    return { created, updated, skipped, errors };
  }

  private async assertKeyFree(
    sourceKey: string,
    manager: EntityManager,
    exceptId?: number,
  ): Promise<void> {
    const existing = await manager
      .getRepository(Medicine)
      .findOne({ where: { sourceKey } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        'A medicine with the same brand, strength, dosage and manufacturer already exists',
      );
    }
  }
}
