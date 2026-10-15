import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Brackets,
  EntityManager,
  ObjectLiteral,
  SelectQueryBuilder,
} from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { Paginated, paginated } from '../../../common/dto/paginated';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { AuthActor } from '../../../common/types/auth-actor';
import { isValidDate } from '../../../common/utils/date';
import { escapeLike } from '../../../common/utils/like';
import { DatabaseService } from '../../../database/database.service';
import { Doctor, Speciality } from '../../../database/entities';
import { UserType } from '../../../database/enums';
import { AccountService } from '../../auth/services/account.service';
import {
  CreateDoctorDto,
  DoctorListItemDto,
  DoctorListQueryDto,
  DoctorOptionDto,
  DoctorOptionsQueryDto,
  DoctorPatientItemDto,
  DoctorResponseDto,
  UpdateDoctorDto,
} from '../dtos/admin-doctor.dto';
import { assertNotNull, pickDefined } from '../utils/pick-defined';

const PROFILE_FIELDS = [
  'name',
  'nameBN',
  'specialityId',
  'degrees',
  'degreesBN',
  'experience',
  'bmdcCode',
  'bmdcExpiryDate',
  'workingAt',
  'workingAtBN',
  'biography',
  'biographyBN',
  'consultationDurationMinutes',
  'defaultFollowUpDays',
  'profilePic',
  'signatureUrl',
] as const;

interface Counts {
  patientCount: number;
  staffCount: number;
  chamberCount: number;
}

@Injectable()
export class AdminDoctorService {
  constructor(
    private readonly db: DatabaseService,
    private readonly accounts: AccountService,
    private readonly audit: AuditService,
  ) {}

  async list(query: DoctorListQueryDto): Promise<Paginated<DoctorListItemDto>> {
    const qb = this.db.doctorRepository
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.account', 'a')
      .leftJoinAndSelect('d.speciality', 's');
    if (query.search) {
      const like = `%${escapeLike(query.search.trim())}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('d.name ILIKE :like')
            .orWhere('d.nameBN ILIKE :like')
            .orWhere('a.mobile ILIKE :like')
            .orWhere('a.email ILIKE :like')
            .orWhere('d.bmdcCode ILIKE :like');
        }),
      ).setParameter('like', like);
    }
    if (query.specialityId !== undefined)
      qb.andWhere('d.specialityId = :sid', { sid: query.specialityId });
    if (query.isActive !== undefined)
      qb.andWhere('d.isActive = :active', { active: query.isActive });
    const [rows, total] = await qb
      .orderBy('d.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    const counts = await this.countsFor(rows.map((d) => d.id));
    return paginated(
      rows.map((d) => this.toListItem(d, counts.get(d.id))),
      total,
      query.page,
      query.limit,
    );
  }

  async options(query: DoctorOptionsQueryDto): Promise<DoctorOptionDto[]> {
    const qb = this.db.doctorRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.speciality', 's')
      .where('d.isActive = true');
    if (query.search?.trim()) {
      const like = `%${escapeLike(query.search.trim())}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('d.name ILIKE :like').orWhere('d.nameBN ILIKE :like');
        }),
      ).setParameter('like', like);
    }
    const rows = await qb
      .orderBy('d.name', 'ASC')
      .addOrderBy('d.id')
      .take(50)
      .getMany();
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      nameBN: d.nameBN,
      specialityName: d.speciality?.name ?? null,
    }));
  }

  async get(id: number): Promise<DoctorResponseDto> {
    const doctor = await this.db.doctorRepository.findOne({
      where: { id },
      relations: { account: true, speciality: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const counts = await this.countsFor([id]);
    return this.toResource(doctor, counts.get(id));
  }

  async create(
    dto: CreateDoctorDto,
    actor: AuthActor,
  ): Promise<DoctorResponseDto> {
    const bmdcCode = dto.bmdcCode?.trim() || null;
    this.assertDate(dto.bmdcExpiryDate);
    const id = await this.db.transaction(async (manager) => {
      if (dto.specialityId != null)
        await this.assertSpeciality(manager, dto.specialityId);
      if (bmdcCode) await this.assertBmdcFree(manager, bmdcCode, null);
      const account = await this.accounts.create(manager, {
        type: UserType.DOCTOR,
        mobile: dto.mobile,
        email: dto.email,
        password: dto.password,
      });
      const repo = manager.getRepository(Doctor);
      const doctor = await repo.save(
        repo.create({
          accountId: account.id,
          ...pickDefined(dto, PROFILE_FIELDS),
          bmdcCode,
        }),
      );
      await this.audit.log(
        actor,
        {
          action: 'DOCTOR_CREATE',
          entityType: 'Doctor',
          entityId: doctor.id,
          changes: {
            ...pickDefined(dto, PROFILE_FIELDS),
            mobile: account.mobile,
            email: account.email,
          },
        },
        manager,
      );
      return doctor.id;
    });
    return this.get(id);
  }

  async update(
    id: number,
    dto: UpdateDoctorDto,
    actor: AuthActor,
  ): Promise<DoctorResponseDto> {
    assertNotNull(dto, [
      'name',
      'mobile',
      'consultationDurationMinutes',
      'isActive',
    ]);
    this.assertDate(dto.bmdcExpiryDate);
    const accountId = await this.db.transaction(async (manager) => {
      const doctor = await manager
        .getRepository(Doctor)
        .findOne({ where: { id } });
      if (!doctor) throw new NotFoundException('Doctor not found');
      if (dto.specialityId != null && dto.specialityId !== doctor.specialityId)
        await this.assertSpeciality(manager, dto.specialityId);
      const patch: Partial<Doctor> = pickDefined(dto, PROFILE_FIELDS);
      if (dto.bmdcCode !== undefined) {
        patch.bmdcCode = dto.bmdcCode?.trim() || null;
        if (patch.bmdcCode)
          await this.assertBmdcFree(manager, patch.bmdcCode, id);
      }
      if (dto.isActive !== undefined) patch.isActive = dto.isActive;
      if (dto.mobile !== undefined || dto.email !== undefined) {
        await this.accounts.updateContact(
          manager,
          doctor.accountId,
          UserType.DOCTOR,
          { mobile: dto.mobile, email: dto.email },
        );
      }
      if (Object.keys(patch).length)
        await manager.getRepository(Doctor).update(id, patch);
      await this.audit.log(
        actor,
        {
          action:
            dto.isActive !== undefined
              ? 'DOCTOR_UPDATE_STATUS'
              : 'DOCTOR_UPDATE',
          entityType: 'Doctor',
          entityId: id,
          changes: { ...dto },
          onBehalfOfDoctorId: id,
        },
        manager,
      );
      return doctor.accountId;
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
    const doctor = await this.db.doctorRepository.findOne({
      where: { id },
      select: { id: true, accountId: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    await this.accounts.setPassword(doctor.accountId, password);
    await this.audit.log(actor, {
      action: 'DOCTOR_RESET_PASSWORD',
      entityType: 'Doctor',
      entityId: id,
      onBehalfOfDoctorId: id,
    });
  }

  async listPatients(
    id: number,
    query: PaginationQueryDto,
  ): Promise<Paginated<DoctorPatientItemDto>> {
    await this.assertExists(id);
    const qb = this.db.doctorPatientRepository
      .createQueryBuilder('dp')
      .innerJoinAndSelect('dp.patient', 'p')
      .innerJoinAndSelect('p.account', 'a')
      .innerJoinAndSelect('p.division', 'dv')
      .innerJoinAndSelect('p.district', 'dt')
      .where('dp.doctorId = :id AND dp.isActive = true', { id })
      .andWhere('p.deletedAt IS NULL');
    if (query.search?.trim()) {
      const like = `%${escapeLike(query.search.trim())}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('p.name ILIKE :like')
            .orWhere('p.nameBN ILIKE :like')
            .orWhere('a.mobile ILIKE :like');
        }),
      ).setParameter('like', like);
    }
    const [rows, total] = await qb
      .orderBy('dp.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginated(
      rows.map((l) => ({
        linkId: l.id,
        patientId: l.patientId,
        name: l.patient.name,
        nameBN: l.patient.nameBN,
        mobile: l.patient.account.mobile,
        division: this.ref(l.patient.division),
        district: this.ref(l.patient.district),
        linkedAt: l.createdAt,
      })),
      total,
      query.page,
      query.limit,
    );
  }

  private async assertExists(id: number) {
    const exists = await this.db.doctorRepository.exists({ where: { id } });
    if (!exists) throw new NotFoundException('Doctor not found');
  }

  private assertDate(value: string | null | undefined) {
    if (value && !isValidDate(value))
      throw new BadRequestException('bmdcExpiryDate must be a valid date');
  }

  private async assertSpeciality(manager: EntityManager, id: number) {
    const speciality = await manager.getRepository(Speciality).findOne({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!speciality) throw new BadRequestException('Speciality not found');
    if (!speciality.isActive)
      throw new BadRequestException('Speciality is not active');
  }

  private async assertBmdcFree(
    manager: EntityManager,
    code: string,
    ignoreId: number | null,
  ) {
    const hit = await manager.getRepository(Doctor).findOne({
      where: { bmdcCode: code },
      select: { id: true },
    });
    if (hit && hit.id !== ignoreId)
      throw new ConflictException('This BMDC code is already registered');
  }

  private async countsFor(ids: number[]): Promise<Map<number, Counts>> {
    const result = new Map<number, Counts>();
    if (!ids.length) return result;
    const group = async (
      repo: {
        createQueryBuilder(alias: string): SelectQueryBuilder<ObjectLiteral>;
      },
      extra?: string,
    ) => {
      const qb = repo
        .createQueryBuilder('x')
        .select('x.doctorId', 'doctorId')
        .addSelect('COUNT(*)', 'n')
        .where('x.doctorId IN (:...ids)', { ids });
      if (extra) qb.andWhere(extra);
      const rows = await qb
        .groupBy('x.doctorId')
        .getRawMany<{ doctorId: number; n: string }>();
      return new Map(rows.map((r) => [Number(r.doctorId), Number(r.n)]));
    };
    const [patients, staff, chambers] = await Promise.all([
      group(this.db.doctorPatientRepository, 'x.isActive = true'),
      group(this.db.doctorStaffRepository),
      group(this.db.chamberRepository),
    ]);
    for (const id of ids) {
      result.set(id, {
        patientCount: patients.get(id) ?? 0,
        staffCount: staff.get(id) ?? 0,
        chamberCount: chambers.get(id) ?? 0,
      });
    }
    return result;
  }

  private ref(r: { id: number; name: string; nameBN: string | null }) {
    return { id: r.id, name: r.name, nameBN: r.nameBN };
  }

  private toListItem(d: Doctor, counts?: Counts): DoctorListItemDto {
    return {
      id: d.id,
      accountId: d.accountId,
      name: d.name,
      nameBN: d.nameBN,
      mobile: d.account.mobile,
      email: d.account.email,
      profilePic: d.profilePic,
      signatureUrl: d.signatureUrl,
      degrees: d.degrees,
      experience: d.experience,
      bmdcCode: d.bmdcCode,
      bmdcExpiryDate: d.bmdcExpiryDate,
      workingAt: d.workingAt,
      consultationDurationMinutes: d.consultationDurationMinutes,
      defaultFollowUpDays: d.defaultFollowUpDays,
      isActive: d.isActive,
      accountActive: d.account.isActive,
      specialityId: d.specialityId,
      speciality: d.speciality ? this.ref(d.speciality) : null,
      patientCount: counts?.patientCount ?? 0,
      staffCount: counts?.staffCount ?? 0,
      chamberCount: counts?.chamberCount ?? 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private toResource(d: Doctor, counts?: Counts): DoctorResponseDto {
    return {
      ...this.toListItem(d, counts),
      degreesBN: d.degreesBN,
      workingAtBN: d.workingAtBN,
      biography: d.biography,
      biographyBN: d.biographyBN,
    };
  }
}
