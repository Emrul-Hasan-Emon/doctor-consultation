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
import { District, Division, Hospital } from '../../../database/entities';
import { RefDto } from '../../location/dtos/location.dto';
import {
  CreateHospitalDto,
  HospitalDto,
  HospitalListQueryDto,
  UpdateHospitalDto,
} from '../dtos/hospital.dto';

const REQUIRED_FIELDS = ['name', 'status', 'divisionId', 'districtId'];
const RELATIONS = { division: true, district: true } as const;

const toDto = (h: Hospital): HospitalDto => ({
  ...h,
  division: {
    id: h.division.id,
    name: h.division.name,
    nameBN: h.division.nameBN,
  },
  district: {
    id: h.district.id,
    name: h.district.name,
    nameBN: h.district.nameBN,
  },
});

@Injectable()
export class AdminHospitalService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async list(query: HospitalListQueryDto): Promise<Paginated<HospitalDto>> {
    const { page, limit, search, status, divisionId, districtId } = query;
    const qb = this.db.hospitalRepository
      .createQueryBuilder('h')
      .innerJoinAndSelect('h.division', 'division')
      .innerJoinAndSelect('h.district', 'district');
    if (status !== undefined) qb.andWhere('h.status = :status', { status });
    if (divisionId) qb.andWhere('h.divisionId = :divisionId', { divisionId });
    if (districtId) qb.andWhere('h.districtId = :districtId', { districtId });
    if (search) {
      qb.andWhere(
        '(h.name ILIKE :q OR h.nameBN ILIKE :q OR h.alias ILIKE :q OR h.phone ILIKE :q)',
        { q: `%${escapeLike(search)}%` },
      );
    }
    const [rows, total] = await qb
      .orderBy('h.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginated(rows.map(toDto), total, page, limit);
  }

  options(): Promise<RefDto[]> {
    return this.db.hospitalRepository.find({
      select: { id: true, name: true, nameBN: true },
      where: { status: true },
      order: { name: 'ASC' },
    });
  }

  async get(id: number): Promise<HospitalDto> {
    const row = await this.db.hospitalRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!row) throw new NotFoundException('Hospital not found');
    return toDto(row);
  }

  create(dto: CreateHospitalDto, actor: AuthActor): Promise<HospitalDto> {
    return this.db.transaction(async (manager) => {
      await this.assertNameFree(dto.name, manager);
      await this.assertGeo(dto.divisionId, dto.districtId, manager);
      const repo = manager.getRepository(Hospital);
      const row = await repo.save(repo.create(dto));
      await this.audit.log(
        actor,
        {
          action: 'hospital.create',
          entityType: 'hospital',
          entityId: row.id,
          changes: { ...dto },
        },
        manager,
      );
      return this.load(row.id, manager);
    });
  }

  update(
    id: number,
    dto: UpdateHospitalDto,
    actor: AuthActor,
  ): Promise<HospitalDto> {
    for (const key of REQUIRED_FIELDS) {
      if ((dto as Record<string, unknown>)[key] === null) {
        throw new BadRequestException(`${key} cannot be null`);
      }
    }
    return this.db.transaction(async (manager) => {
      const repo = manager.getRepository(Hospital);
      const row = await repo.findOne({ where: { id } });
      if (!row) throw new NotFoundException('Hospital not found');
      if (dto.name !== undefined && dto.name !== row.name) {
        await this.assertNameFree(dto.name, manager, id);
      }
      const divisionId = dto.divisionId ?? row.divisionId;
      const districtId = dto.districtId ?? row.districtId;
      if (dto.divisionId !== undefined || dto.districtId !== undefined) {
        await this.assertGeo(divisionId, districtId, manager);
      }
      const { division: _d, district: _t, ...plain } = row;
      void _d;
      void _t;
      await repo.save({ ...plain, ...dto });
      await this.audit.log(
        actor,
        {
          action: 'hospital.update',
          entityType: 'hospital',
          entityId: id,
          changes: { ...dto },
        },
        manager,
      );
      return this.load(id, manager);
    });
  }

  private async load(id: number, manager: EntityManager): Promise<HospitalDto> {
    const row = await manager
      .getRepository(Hospital)
      .findOneOrFail({ where: { id }, relations: RELATIONS });
    return toDto(row);
  }

  private async assertNameFree(
    name: string,
    manager: EntityManager,
    exceptId?: number,
  ): Promise<void> {
    const existing = await manager
      .getRepository(Hospital)
      .findOne({ where: { name } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`Hospital "${name}" already exists`);
    }
  }

  private async assertGeo(
    divisionId: number,
    districtId: number,
    manager: EntityManager,
  ): Promise<void> {
    const division = await manager
      .getRepository(Division)
      .findOne({ where: { id: divisionId } });
    if (!division) throw new BadRequestException('Division not found');
    const district = await manager
      .getRepository(District)
      .findOne({ where: { id: districtId } });
    if (!district) throw new BadRequestException('District not found');
    if (district.divisionId !== divisionId) {
      throw new BadRequestException(
        'District does not belong to the given division',
      );
    }
  }
}
