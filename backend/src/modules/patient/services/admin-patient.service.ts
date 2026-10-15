import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, EntityManager, In } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { Paginated, paginated } from '../../../common/dto/paginated';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { AuthActor } from '../../../common/types/auth-actor';
import { todayDhaka } from '../../../common/utils/date';
import { escapeLike } from '../../../common/utils/like';
import { DatabaseService } from '../../../database/database.service';
import {
  Appointment,
  District,
  Division,
  Doctor,
  DoctorPatient,
  Patient,
  UserAccount,
} from '../../../database/entities';
import {
  ActorType,
  AppointmentStatus,
  UserType,
} from '../../../database/enums';
import { AccountService } from '../../auth/services/account.service';
import { assertNotNull, pickDefined } from '../../doctor/utils/pick-defined';
import {
  CreatePatientDto,
  PatientDoctorItemDto,
  PatientListQueryDto,
  PatientResponseDto,
  UpdatePatientDto,
} from '../dtos/admin-patient.dto';
import { diffLinks } from '../utils/link-diff';

const PROFILE_FIELDS = [
  'name',
  'nameBN',
  'divisionId',
  'districtId',
  'address',
  'addressBN',
] as const;

@Injectable()
export class AdminPatientService {
  constructor(
    private readonly db: DatabaseService,
    private readonly accounts: AccountService,
    private readonly audit: AuditService,
  ) {}

  async list(
    query: PatientListQueryDto,
  ): Promise<Paginated<PatientResponseDto>> {
    const qb = this.db.patientRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.account', 'a')
      .innerJoinAndSelect('p.division', 'dv')
      .innerJoinAndSelect('p.district', 'dt');
    if (query.divisionId !== undefined)
      qb.andWhere('p.divisionId = :divisionId', {
        divisionId: query.divisionId,
      });
    if (query.districtId !== undefined)
      qb.andWhere('p.districtId = :districtId', {
        districtId: query.districtId,
      });
    if (query.isActive !== undefined)
      qb.andWhere('p.isActive = :active', { active: query.isActive });
    if (query.doctorId !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM doctor_patient dp WHERE dp."patientId" = p.id AND dp."doctorId" = :doctorId AND dp."isActive" = true)`,
        { doctorId: query.doctorId },
      );
    }
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
      .orderBy('p.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    const doctors = await this.activeDoctorsFor(rows.map((p) => p.id));
    return paginated(
      rows.map((p) => this.toResource(p, doctors.get(p.id) ?? [])),
      total,
      query.page,
      query.limit,
    );
  }

  async get(id: number): Promise<PatientResponseDto> {
    const patient = await this.db.patientRepository.findOne({
      where: { id },
      relations: { account: true, division: true, district: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    const doctors = await this.activeDoctorsFor([id]);
    return this.toResource(patient, doctors.get(id) ?? []);
  }

  async create(
    dto: CreatePatientDto,
    actor: AuthActor,
  ): Promise<PatientResponseDto> {
    const id = await this.db.transaction(async (manager) => {
      await this.assertLocation(manager, dto.divisionId, dto.districtId);
      await this.assertActiveDoctors(manager, dto.doctorIds);
      const account = await this.accounts.create(manager, {
        type: UserType.PATIENT,
        mobile: dto.mobile,
      });
      const repo = manager.getRepository(Patient);
      const patient = await repo.save(
        repo.create({
          accountId: account.id,
          ...pickDefined(dto, PROFILE_FIELDS),
          createdByType: ActorType.ADMIN,
          createdById: actor.profileId,
        }),
      );
      const linkRepo = manager.getRepository(DoctorPatient);
      await linkRepo.save(
        dto.doctorIds.map((doctorId) =>
          linkRepo.create({
            doctorId,
            patientId: patient.id,
            createdByType: ActorType.ADMIN,
            createdById: actor.profileId,
          }),
        ),
      );
      await this.audit.log(
        actor,
        {
          action: 'PATIENT_CREATE',
          entityType: 'Patient',
          entityId: patient.id,
          changes: {
            ...pickDefined(dto, PROFILE_FIELDS),
            mobile: account.mobile,
            doctorIds: dto.doctorIds,
          },
        },
        manager,
      );
      for (const doctorId of dto.doctorIds) {
        await this.logLink(
          actor,
          'PATIENT_DOCTOR_LINK',
          patient.id,
          doctorId,
          manager,
        );
      }
      return patient.id;
    });
    return this.get(id);
  }

  async update(
    id: number,
    dto: UpdatePatientDto,
    actor: AuthActor,
  ): Promise<PatientResponseDto> {
    assertNotNull(dto, [
      'name',
      'mobile',
      'divisionId',
      'districtId',
      'isActive',
    ]);
    const accountId = await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(Patient);
      const patient = await repo.findOne({ where: { id } });
      if (!patient) throw new NotFoundException('Patient not found');
      if (dto.divisionId !== undefined || dto.districtId !== undefined) {
        await this.assertLocation(
          manager,
          dto.divisionId ?? patient.divisionId,
          dto.districtId ?? patient.districtId,
        );
      }
      if (dto.mobile !== undefined) {
        await this.accounts.updateContact(
          manager,
          patient.accountId,
          UserType.PATIENT,
          { mobile: dto.mobile },
        );
      }
      const patch: Partial<Patient> = pickDefined(dto, PROFILE_FIELDS);
      if (dto.isActive !== undefined) patch.isActive = dto.isActive;
      if (Object.keys(patch).length) await repo.update(id, patch);
      await this.audit.log(
        actor,
        {
          action:
            dto.isActive !== undefined
              ? 'PATIENT_UPDATE_STATUS'
              : 'PATIENT_UPDATE',
          entityType: 'Patient',
          entityId: id,
          changes: { ...dto },
        },
        manager,
      );
      return patient.accountId;
    });
    if (dto.isActive !== undefined)
      await this.accounts.setActive(accountId, dto.isActive);
    return this.get(id);
  }

  async remove(id: number, actor: AuthActor): Promise<void> {
    const accountId = await this.db.transaction(async (manager) => {
      const patient = await this.lockPatient(manager, id);
      const upcoming = await manager
        .getRepository(Appointment)
        .createQueryBuilder('ap')
        .where('ap.patientId = :id', { id })
        .andWhere('ap.status = :status', {
          status: AppointmentStatus.SCHEDULED,
        })
        .andWhere('ap.appointmentDate >= :today', { today: todayDhaka() })
        .getCount();
      if (upcoming > 0) {
        throw new ConflictException(
          `Patient has ${upcoming} scheduled appointment(s) from today onward; cancel them first`,
        );
      }
      await manager
        .getRepository(DoctorPatient)
        .update(
          { patientId: id, isActive: true },
          { isActive: false, deactivatedAt: new Date() },
        );
      await manager.getRepository(Patient).softDelete(id);
      await manager.getRepository(UserAccount).softDelete(patient.accountId);
      await this.audit.log(
        actor,
        { action: 'PATIENT_DELETE', entityType: 'Patient', entityId: id },
        manager,
      );
      return patient.accountId;
    });
    await this.accounts.setActive(accountId, false);
  }

  async listDoctors(
    id: number,
    query: PaginationQueryDto,
  ): Promise<Paginated<PatientDoctorItemDto>> {
    await this.assertExists(id);
    const qb = this.db.doctorPatientRepository
      .createQueryBuilder('dp')
      .innerJoinAndSelect('dp.doctor', 'd')
      .innerJoinAndSelect('d.account', 'a')
      .leftJoinAndSelect('d.speciality', 's')
      .where('dp.patientId = :id AND dp.isActive = true', { id });
    if (query.search?.trim()) {
      const like = `%${escapeLike(query.search.trim())}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('d.name ILIKE :like')
            .orWhere('d.nameBN ILIKE :like')
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
        doctorId: l.doctorId,
        name: l.doctor.name,
        nameBN: l.doctor.nameBN,
        mobile: l.doctor.account.mobile,
        speciality: l.doctor.speciality
          ? {
              id: l.doctor.speciality.id,
              name: l.doctor.speciality.name,
              nameBN: l.doctor.speciality.nameBN,
            }
          : null,
        isActive: l.doctor.isActive,
        linkedAt: l.createdAt,
      })),
      total,
      query.page,
      query.limit,
    );
  }

  async setDoctors(
    id: number,
    doctorIds: number[],
    actor: AuthActor,
  ): Promise<PatientResponseDto> {
    await this.db.transaction(async (manager) => {
      await this.lockPatient(manager, id);
      await this.assertActiveDoctors(manager, doctorIds);
      const repo = manager.getRepository(DoctorPatient);
      const existing = await repo.find({ where: { patientId: id } });
      const diff = diffLinks(existing, doctorIds);
      if (diff.toCreate.length) {
        await repo.save(
          diff.toCreate.map((doctorId) =>
            repo.create({
              doctorId,
              patientId: id,
              createdByType: ActorType.ADMIN,
              createdById: actor.profileId,
            }),
          ),
        );
      }
      if (diff.toReactivate.length) {
        await repo.update(
          { patientId: id, doctorId: In(diff.toReactivate) },
          { isActive: true, deactivatedAt: null },
        );
      }
      if (diff.toDeactivate.length) {
        await repo.update(
          { patientId: id, doctorId: In(diff.toDeactivate) },
          { isActive: false, deactivatedAt: new Date() },
        );
      }
      for (const doctorId of [...diff.toCreate, ...diff.toReactivate])
        await this.logLink(actor, 'PATIENT_DOCTOR_LINK', id, doctorId, manager);
      for (const doctorId of diff.toDeactivate)
        await this.logLink(
          actor,
          'PATIENT_DOCTOR_UNLINK',
          id,
          doctorId,
          manager,
        );
    });
    return this.get(id);
  }

  async addDoctor(
    id: number,
    doctorId: number,
    actor: AuthActor,
  ): Promise<PatientResponseDto> {
    await this.db.transaction(async (manager) => {
      await this.lockPatient(manager, id);
      await this.assertActiveDoctors(manager, [doctorId]);
      const repo = manager.getRepository(DoctorPatient);
      const link = await repo.findOne({ where: { patientId: id, doctorId } });
      if (link?.isActive)
        throw new ConflictException('Patient is already linked to this doctor');
      if (link) {
        await repo.update(link.id, { isActive: true, deactivatedAt: null });
      } else {
        await repo.save(
          repo.create({
            doctorId,
            patientId: id,
            createdByType: ActorType.ADMIN,
            createdById: actor.profileId,
          }),
        );
      }
      await this.logLink(actor, 'PATIENT_DOCTOR_LINK', id, doctorId, manager);
    });
    return this.get(id);
  }

  async removeDoctor(
    id: number,
    doctorId: number,
    actor: AuthActor,
  ): Promise<void> {
    await this.db.transaction(async (manager) => {
      await this.lockPatient(manager, id);
      const repo = manager.getRepository(DoctorPatient);
      const links = await repo.find({
        where: { patientId: id, isActive: true },
      });
      const link = links.find((l) => l.doctorId === doctorId);
      if (!link)
        throw new NotFoundException('Patient is not linked to this doctor');
      if (links.length <= 1) {
        throw new ConflictException(
          'Cannot remove the last active doctor of a patient',
        );
      }
      await repo.update(link.id, {
        isActive: false,
        deactivatedAt: new Date(),
      });
      await this.logLink(actor, 'PATIENT_DOCTOR_UNLINK', id, doctorId, manager);
    });
  }

  private logLink(
    actor: AuthActor,
    action: string,
    patientId: number,
    doctorId: number,
    manager: EntityManager,
  ) {
    return this.audit.log(
      actor,
      {
        action,
        entityType: 'Patient',
        entityId: patientId,
        changes: { doctorId },
        onBehalfOfDoctorId: doctorId,
      },
      manager,
    );
  }

  private async assertExists(id: number) {
    const exists = await this.db.patientRepository.exists({ where: { id } });
    if (!exists) throw new NotFoundException('Patient not found');
  }

  /** Row lock so concurrent link changes cannot both pass the "keep one link" rule. */
  private async lockPatient(manager: EntityManager, id: number) {
    const patient = await manager.getRepository(Patient).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  private async assertLocation(
    manager: EntityManager,
    divisionId: number,
    districtId: number,
  ) {
    const division = await manager
      .getRepository(Division)
      .exists({ where: { id: divisionId } });
    if (!division) throw new BadRequestException('Division not found');
    const district = await manager.getRepository(District).findOne({
      where: { id: districtId },
      select: { id: true, divisionId: true },
    });
    if (!district) throw new BadRequestException('District not found');
    if (district.divisionId !== divisionId)
      throw new BadRequestException('District does not belong to the division');
  }

  private async assertActiveDoctors(manager: EntityManager, ids: number[]) {
    const unique = [...new Set(ids)];
    const doctors = await manager.getRepository(Doctor).find({
      where: { id: In(unique) },
      select: { id: true, isActive: true },
    });
    const ok = new Set(doctors.filter((d) => d.isActive).map((d) => d.id));
    const bad = unique.filter((id) => !ok.has(id));
    if (bad.length) {
      throw new BadRequestException(
        `Doctors not found or not active: ${bad.join(', ')}`,
      );
    }
  }

  private async activeDoctorsFor(ids: number[]) {
    const map = new Map<
      number,
      { doctorId: number; name: string; nameBN: string | null }[]
    >();
    if (!ids.length) return map;
    const links = await this.db.doctorPatientRepository.find({
      where: { patientId: In(ids), isActive: true },
      relations: { doctor: true },
      order: { id: 'ASC' },
    });
    for (const l of links) {
      const list = map.get(l.patientId) ?? [];
      list.push({
        doctorId: l.doctorId,
        name: l.doctor.name,
        nameBN: l.doctor.nameBN,
      });
      map.set(l.patientId, list);
    }
    return map;
  }

  private toResource(
    p: Patient,
    doctors: PatientResponseDto['doctors'],
  ): PatientResponseDto {
    const ref = (r: { id: number; name: string; nameBN: string | null }) => ({
      id: r.id,
      name: r.name,
      nameBN: r.nameBN,
    });
    return {
      id: p.id,
      accountId: p.accountId,
      name: p.name,
      nameBN: p.nameBN,
      mobile: p.account.mobile,
      divisionId: p.divisionId,
      districtId: p.districtId,
      division: ref(p.division),
      district: ref(p.district),
      address: p.address,
      addressBN: p.addressBN,
      isActive: p.isActive,
      createdByType: p.createdByType,
      doctors,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
