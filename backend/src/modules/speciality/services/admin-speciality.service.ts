import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { paginated, Paginated } from '../../../common/dto/paginated';
import { AuthActor } from '../../../common/types/auth-actor';
import { escapeLike } from '../../../common/utils/like';
import { DatabaseService } from '../../../database/database.service';
import { Speciality } from '../../../database/entities';
import { RefDto } from '../../location/dtos/location.dto';
import {
  CreateSpecialityDto,
  SpecialityDto,
  SpecialityListQueryDto,
  UpdateSpecialityDto,
} from '../dtos/speciality.dto';

const REQUIRED_FIELDS = ['name', 'value', 'prescriptionType', 'isActive'];

@Injectable()
export class AdminSpecialityService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async list(query: SpecialityListQueryDto): Promise<Paginated<SpecialityDto>> {
    const { page, limit, search, isActive } = query;
    const qb = this.db.specialityRepository.createQueryBuilder('s');
    if (isActive !== undefined)
      qb.andWhere('s.isActive = :isActive', { isActive });
    if (search) {
      qb.andWhere(
        `(s.name ILIKE :q OR s.nameBN ILIKE :q OR s.value ILIKE :q OR s.title ILIKE :q)`,
        { q: `%${escapeLike(search)}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('s.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginated(items, total, page, limit);
  }

  options(): Promise<RefDto[]> {
    return this.db.specialityRepository.find({
      select: { id: true, name: true, nameBN: true },
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async get(id: number): Promise<SpecialityDto> {
    const row = await this.db.specialityRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Speciality not found');
    return row;
  }

  create(dto: CreateSpecialityDto, actor: AuthActor): Promise<SpecialityDto> {
    return this.db.transaction(async (manager) => {
      await this.assertValueFree(dto.value, manager);
      const repo = manager.getRepository(Speciality);
      const row = await repo.save(repo.create(dto));
      await this.audit.log(
        actor,
        {
          action: 'speciality.create',
          entityType: 'speciality',
          entityId: row.id,
          changes: { ...dto },
        },
        manager,
      );
      return row;
    });
  }

  update(
    id: number,
    dto: UpdateSpecialityDto,
    actor: AuthActor,
  ): Promise<SpecialityDto> {
    for (const key of REQUIRED_FIELDS) {
      if ((dto as Record<string, unknown>)[key] === null) {
        throw new BadRequestException(`${key} cannot be null`);
      }
    }
    return this.db.transaction(async (manager) => {
      const repo = manager.getRepository(Speciality);
      const row = await repo.findOne({ where: { id } });
      if (!row) throw new NotFoundException('Speciality not found');
      if (dto.value !== undefined && dto.value !== row.value) {
        await this.assertValueFree(dto.value, manager, id);
      }
      Object.assign(row, dto);
      const saved = await repo.save(row);
      await this.audit.log(
        actor,
        {
          action: 'speciality.update',
          entityType: 'speciality',
          entityId: id,
          changes: { ...dto },
        },
        manager,
      );
      return saved;
    });
  }

  private async assertValueFree(
    value: string,
    manager: EntityManager,
    exceptId?: number,
  ): Promise<void> {
    const existing = await manager
      .getRepository(Speciality)
      .findOne({ where: { value } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`Speciality value "${value}" already exists`);
    }
  }
}
