import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { Paginated, paginated } from '../../../common/dto/paginated';
import type { AuthActor } from '../../../common/types/auth-actor';
import { escapeLike } from '../../../common/utils/like';
import { DatabaseService } from '../../../database/database.service';
import { Doctor, DoctorStaff } from '../../../database/entities';
import { ActorType, UserType } from '../../../database/enums';
import { AccountService } from '../../auth/services/account.service';
import { assertNotNull, pickDefined } from '../../doctor/utils/pick-defined';
import {
  CreateDoctorStaffDto,
  DoctorStaffListQueryDto,
  DoctorStaffResponseDto,
  UpdateDoctorStaffDto,
} from '../dtos/admin-doctor-staff.dto';

const PROFILE_FIELDS = ['name', 'nameBN'] as const;

@Injectable()
export class AdminDoctorStaffService {
  constructor(
    private readonly db: DatabaseService,
    private readonly accounts: AccountService,
    private readonly audit: AuditService,
  ) {}

  async list(
    query: DoctorStaffListQueryDto,
  ): Promise<Paginated<DoctorStaffResponseDto>> {
    const qb = this.db.doctorStaffRepository
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.account', 'a')
      .innerJoinAndSelect('s.doctor', 'd');
    if (query.doctorId !== undefined)
      qb.andWhere('s.doctorId = :doctorId', { doctorId: query.doctorId });
    if (query.isActive !== undefined)
      qb.andWhere('s.isActive = :active', { active: query.isActive });
    if (query.search?.trim()) {
      const like = `%${escapeLike(query.search.trim())}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('s.name ILIKE :like')
            .orWhere('s.nameBN ILIKE :like')
            .orWhere('a.mobile ILIKE :like')
            .orWhere('a.email ILIKE :like');
        }),
      ).setParameter('like', like);
    }
    const [rows, total] = await qb
      .orderBy('s.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginated(
      rows.map((s) => this.toResource(s)),
      total,
      query.page,
      query.limit,
    );
  }

  async get(id: number): Promise<DoctorStaffResponseDto> {
    const staff = await this.db.doctorStaffRepository.findOne({
      where: { id },
      relations: { account: true, doctor: true },
    });
    if (!staff) throw new NotFoundException('Doctor staff not found');
    return this.toResource(staff);
  }

  async create(
    dto: CreateDoctorStaffDto,
    actor: AuthActor,
  ): Promise<DoctorStaffResponseDto> {
    const id = await this.db.transaction(async (manager) => {
      const doctor = await manager.getRepository(Doctor).exists({
        where: { id: dto.doctorId },
      });
      if (!doctor) throw new NotFoundException('Doctor not found');
      const account = await this.accounts.create(manager, {
        type: UserType.DOCTOR_STAFF,
        mobile: dto.mobile,
        email: dto.email,
        password: dto.password,
      });
      const repo = manager.getRepository(DoctorStaff);
      const staff = await repo.save(
        repo.create({
          accountId: account.id,
          doctorId: dto.doctorId,
          name: dto.name,
          nameBN: dto.nameBN ?? null,
          createdByType: ActorType.ADMIN,
          createdById: actor.profileId,
        }),
      );
      await this.audit.log(
        actor,
        {
          action: 'DOCTOR_STAFF_CREATE',
          entityType: 'DoctorStaff',
          entityId: staff.id,
          changes: {
            doctorId: dto.doctorId,
            name: dto.name,
            nameBN: dto.nameBN ?? null,
            mobile: account.mobile,
            email: account.email,
          },
          onBehalfOfDoctorId: dto.doctorId,
        },
        manager,
      );
      return staff.id;
    });
    return this.get(id);
  }

  async update(
    id: number,
    dto: UpdateDoctorStaffDto,
    actor: AuthActor,
  ): Promise<DoctorStaffResponseDto> {
    assertNotNull(dto, ['name', 'mobile', 'isActive']);
    const accountId = await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(DoctorStaff);
      const staff = await repo.findOne({ where: { id } });
      if (!staff) throw new NotFoundException('Doctor staff not found');
      if (dto.mobile !== undefined || dto.email !== undefined) {
        await this.accounts.updateContact(
          manager,
          staff.accountId,
          UserType.DOCTOR_STAFF,
          { mobile: dto.mobile, email: dto.email },
        );
      }
      const patch: Partial<DoctorStaff> = pickDefined(dto, PROFILE_FIELDS);
      if (dto.isActive !== undefined) patch.isActive = dto.isActive;
      if (Object.keys(patch).length) await repo.update(id, patch);
      await this.audit.log(
        actor,
        {
          action:
            dto.isActive !== undefined
              ? 'DOCTOR_STAFF_UPDATE_STATUS'
              : 'DOCTOR_STAFF_UPDATE',
          entityType: 'DoctorStaff',
          entityId: id,
          changes: { ...dto },
          onBehalfOfDoctorId: staff.doctorId,
        },
        manager,
      );
      return staff.accountId;
    });
    if (dto.isActive !== undefined)
      await this.accounts.setActive(accountId, dto.isActive);
    return this.get(id);
  }

  async resetPassword(
    id: number,
    password: string,
    actor: AuthActor,
  ): Promise<void> {
    const staff = await this.db.doctorStaffRepository.findOne({
      where: { id },
      select: { id: true, accountId: true, doctorId: true },
    });
    if (!staff) throw new NotFoundException('Doctor staff not found');
    await this.accounts.setPassword(staff.accountId, password);
    await this.audit.log(actor, {
      action: 'DOCTOR_STAFF_RESET_PASSWORD',
      entityType: 'DoctorStaff',
      entityId: id,
      onBehalfOfDoctorId: staff.doctorId,
    });
  }

  private toResource(s: DoctorStaff): DoctorStaffResponseDto {
    return {
      id: s.id,
      accountId: s.accountId,
      doctorId: s.doctorId,
      doctor: { id: s.doctor.id, name: s.doctor.name, nameBN: s.doctor.nameBN },
      name: s.name,
      nameBN: s.nameBN,
      mobile: s.account.mobile,
      email: s.account.email,
      isActive: s.isActive,
      createdAt: s.createdAt,
    };
  }
}
