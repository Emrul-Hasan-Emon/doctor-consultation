import { ConflictException, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { paginated, Paginated } from '../../../common/dto/paginated';
import type { AuthActor } from '../../../common/types/auth-actor';
import { escapeLike } from '../../../common/utils/like';
import { DatabaseService } from '../../../database/database.service';
import { Chamber, ChamberTurn } from '../../../database/entities';
import { ChamberType } from '../../../database/enums';
import { ChamberQueryDto } from '../dtos/chamber-query.dto';
import {
  ChamberListItemDto,
  ChamberResourceDto,
} from '../dtos/chamber-response.dto';
import { ReplaceScheduleDto } from '../dtos/chamber-schedule-input.dto';
import { CreateChamberDto } from '../dtos/create-chamber.dto';
import { UpdateChamberDto } from '../dtos/update-chamber.dto';
import { ChamberScheduleService } from './chamber-schedule.service';

@Injectable()
export class AdminChamberService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly schedule: ChamberScheduleService,
  ) {}

  async list(query: ChamberQueryDto): Promise<Paginated<ChamberListItemDto>> {
    const qb = this.db.chamberRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.doctor', 'd')
      .leftJoinAndSelect('c.hospital', 'h')
      .innerJoinAndSelect('c.division', 'dv')
      .innerJoinAndSelect('c.district', 'ds');
    if (query.doctorId) qb.andWhere('c.doctorId = :doctorId', query);
    if (query.hospitalId) qb.andWhere('c.hospitalId = :hospitalId', query);
    if (query.chamberType) qb.andWhere('c.chamberType = :chamberType', query);
    if (query.divisionId) qb.andWhere('c.divisionId = :divisionId', query);
    if (query.isActive !== undefined) {
      qb.andWhere('c.isActive = :isActive', query);
    }
    if (query.search) {
      const search = `%${escapeLike(query.search)}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('c.name ILIKE :search')
            .orWhere('c.nameBN ILIKE :search')
            .orWhere('c.address ILIKE :search')
            .orWhere('d.name ILIKE :search')
            .orWhere('d.nameBN ILIKE :search')
            .orWhere('h.name ILIKE :search')
            .orWhere('h.nameBN ILIKE :search'),
        ),
      ).setParameter('search', search);
    }
    const [rows, total] = await qb
      .orderBy('c.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const open = rows.length
      ? await this.db.chamberDayRepository
          .createQueryBuilder('day')
          .select('day.chamberId', 'chamberId')
          .addSelect('day.weekday', 'weekday')
          .innerJoin(ChamberTurn, 't', 't.chamberDayId = day.id')
          .where('day.chamberId IN (:...ids)', { ids: rows.map((r) => r.id) })
          .andWhere('day.isOff = false')
          .andWhere('t.isActive = true')
          .groupBy('day.chamberId')
          .addGroupBy('day.weekday')
          .getRawMany<{ chamberId: number; weekday: number }>()
      : [];
    const openDays = new Map<number, number[]>();
    for (const o of open) {
      const list = openDays.get(Number(o.chamberId)) ?? [];
      list.push(Number(o.weekday));
      openDays.set(Number(o.chamberId), list);
    }

    const items = rows.map((c) => ({
      id: c.id,
      name: c.name,
      nameBN: c.nameBN,
      chamberType: c.chamberType,
      doctor: { id: c.doctor.id, name: c.doctor.name, nameBN: c.doctor.nameBN },
      hospital: c.hospital
        ? {
            id: c.hospital.id,
            name: c.hospital.name,
            nameBN: c.hospital.nameBN,
          }
        : null,
      division: {
        id: c.division.id,
        name: c.division.name,
        nameBN: c.division.nameBN,
      },
      district: {
        id: c.district.id,
        name: c.district.name,
        nameBN: c.district.nameBN,
      },
      address: c.address,
      isActive: c.isActive,
      openDays: (openDays.get(c.id) ?? []).sort((a, b) => a - b),
    }));
    return paginated(items, total, query.page, query.limit);
  }

  get(id: number): Promise<ChamberResourceDto> {
    return this.schedule.getResource(id);
  }

  async create(
    actor: AuthActor,
    dto: CreateChamberDto,
  ): Promise<ChamberResourceDto> {
    const id = await this.db.transaction(async (manager) => {
      await this.schedule.getActiveDoctor(manager, dto.doctorId);
      await this.schedule.assertChamberInfo(manager, {
        chamberType: dto.chamberType,
        hospitalId: dto.hospitalId ?? null,
        divisionId: dto.divisionId,
        districtId: dto.districtId,
      });
      const repo = manager.getRepository(Chamber);
      const chamber = await repo.save(
        repo.create({
          doctorId: dto.doctorId,
          name: dto.name ?? null,
          nameBN: dto.nameBN ?? null,
          chamberType: dto.chamberType,
          hospitalId: dto.hospitalId ?? null,
          divisionId: dto.divisionId,
          districtId: dto.districtId,
          address: dto.address,
          addressBN: dto.addressBN ?? null,
          description: dto.description ?? null,
          descriptionBN: dto.descriptionBN ?? null,
          advanceBookingDays: dto.advanceBookingDays ?? 30,
          isActive: dto.isActive ?? true,
        }),
      );
      if (dto.days) {
        await this.schedule.replaceSchedule(manager, chamber.id, dto.days);
      }
      await this.audit.log(
        actor,
        {
          action: 'CHAMBER_CREATE',
          entityType: 'Chamber',
          entityId: chamber.id,
          changes: { ...dto },
          onBehalfOfDoctorId: chamber.doctorId,
        },
        manager,
      );
      return chamber.id;
    });
    return this.schedule.getResource(id);
  }

  async update(
    actor: AuthActor,
    id: number,
    dto: UpdateChamberDto,
  ): Promise<ChamberResourceDto> {
    await this.db.transaction(async (manager) => {
      const chamber = await this.schedule.lockChamber(manager, id);
      const chamberType = dto.chamberType ?? chamber.chamberType;
      let hospitalId =
        dto.hospitalId !== undefined ? dto.hospitalId : chamber.hospitalId;
      if (chamberType === ChamberType.SELF && dto.hospitalId === undefined) {
        hospitalId = null;
      }
      const divisionId = dto.divisionId ?? chamber.divisionId;
      const districtId = dto.districtId ?? chamber.districtId;
      await this.schedule.assertChamberInfo(
        manager,
        { chamberType, hospitalId, divisionId, districtId },
        hospitalId !== chamber.hospitalId,
      );
      await manager
        .getRepository(Chamber)
        .update(id, { ...dto, chamberType, hospitalId });
      await this.audit.log(
        actor,
        {
          action: 'CHAMBER_UPDATE',
          entityType: 'Chamber',
          entityId: id,
          changes: { ...dto },
          onBehalfOfDoctorId: chamber.doctorId,
        },
        manager,
      );
    });
    return this.schedule.getResource(id);
  }

  async replaceSchedule(
    actor: AuthActor,
    id: number,
    dto: ReplaceScheduleDto,
  ): Promise<ChamberResourceDto> {
    await this.db.transaction(async (manager) => {
      const chamber = await this.schedule.lockChamber(manager, id);
      await this.schedule.replaceSchedule(manager, id, dto.days);
      await this.audit.log(
        actor,
        {
          action: 'CHAMBER_SCHEDULE_REPLACE',
          entityType: 'Chamber',
          entityId: id,
          changes: { days: dto.days },
          onBehalfOfDoctorId: chamber.doctorId,
        },
        manager,
      );
    });
    return this.schedule.getResource(id);
  }

  async remove(actor: AuthActor, id: number): Promise<void> {
    await this.db.transaction(async (manager) => {
      const chamber = await this.schedule.lockChamber(manager, id);
      const count = await this.schedule.countFutureScheduled(manager, id);
      if (count > 0) {
        throw new ConflictException(
          `Chamber has ${count} scheduled appointment(s) from today onward; cancel them first`,
        );
      }
      await manager.getRepository(Chamber).softDelete(id);
      await this.audit.log(
        actor,
        {
          action: 'CHAMBER_DELETE',
          entityType: 'Chamber',
          entityId: id,
          onBehalfOfDoctorId: chamber.doctorId,
        },
        manager,
      );
    });
  }
}
