import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  AdminUser,
  AppointmentStatusLog,
  Appointment,
  AuditLog,
  AuthToken,
  ChamberDay,
  ChamberTurn,
  Chamber,
  DiagnosisItem,
  DiagnosisMedicine,
  Diagnosis,
  District,
  Division,
  DoctorMedicine,
  DoctorOffDate,
  DoctorPatient,
  DoctorSavedItem,
  DoctorStaff,
  Doctor,
  DrugHistory,
  FamilyHistory,
  Hospital,
  Medicine,
  MenstrualHistory,
  OtpChallenge,
  PastIllness,
  Patient,
  SmsOutbox,
  Speciality,
  UserAccount,
  Vitals,
} from './entities';

/**
 * Facade over every repository. Feature services inject this one class
 * instead of many @InjectRepository() tokens. Edit by hand when entities are
 * added: this file is no longer generated.
 */
@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(AdminUser)
    readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(AppointmentStatusLog)
    readonly appointmentStatusLogRepository: Repository<AppointmentStatusLog>,
    @InjectRepository(Appointment)
    readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AuditLog)
    readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(AuthToken)
    readonly authTokenRepository: Repository<AuthToken>,
    @InjectRepository(ChamberDay)
    readonly chamberDayRepository: Repository<ChamberDay>,
    @InjectRepository(ChamberTurn)
    readonly chamberTurnRepository: Repository<ChamberTurn>,
    @InjectRepository(Chamber) readonly chamberRepository: Repository<Chamber>,
    @InjectRepository(DiagnosisItem)
    readonly diagnosisItemRepository: Repository<DiagnosisItem>,
    @InjectRepository(DiagnosisMedicine)
    readonly diagnosisMedicineRepository: Repository<DiagnosisMedicine>,
    @InjectRepository(Diagnosis)
    readonly diagnosisRepository: Repository<Diagnosis>,
    @InjectRepository(District)
    readonly districtRepository: Repository<District>,
    @InjectRepository(Division)
    readonly divisionRepository: Repository<Division>,
    @InjectRepository(DoctorMedicine)
    readonly doctorMedicineRepository: Repository<DoctorMedicine>,
    @InjectRepository(DoctorOffDate)
    readonly doctorOffDateRepository: Repository<DoctorOffDate>,
    @InjectRepository(DoctorPatient)
    readonly doctorPatientRepository: Repository<DoctorPatient>,
    @InjectRepository(DoctorSavedItem)
    readonly doctorSavedItemRepository: Repository<DoctorSavedItem>,
    @InjectRepository(DoctorStaff)
    readonly doctorStaffRepository: Repository<DoctorStaff>,
    @InjectRepository(Doctor) readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(DrugHistory)
    readonly drugHistoryRepository: Repository<DrugHistory>,
    @InjectRepository(FamilyHistory)
    readonly familyHistoryRepository: Repository<FamilyHistory>,
    @InjectRepository(Hospital)
    readonly hospitalRepository: Repository<Hospital>,
    @InjectRepository(Medicine)
    readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(MenstrualHistory)
    readonly menstrualHistoryRepository: Repository<MenstrualHistory>,
    @InjectRepository(OtpChallenge)
    readonly otpChallengeRepository: Repository<OtpChallenge>,
    @InjectRepository(PastIllness)
    readonly pastIllnessRepository: Repository<PastIllness>,
    @InjectRepository(Patient) readonly patientRepository: Repository<Patient>,
    @InjectRepository(SmsOutbox)
    readonly smsOutboxRepository: Repository<SmsOutbox>,
    @InjectRepository(Speciality)
    readonly specialityRepository: Repository<Speciality>,
    @InjectRepository(UserAccount)
    readonly userAccountRepository: Repository<UserAccount>,
    @InjectRepository(Vitals) readonly vitalsRepository: Repository<Vitals>,
    private readonly dataSource: DataSource,
  ) {}

  /** Runs fn in one transaction. Pass the manager to every repository call inside. */
  transaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(fn);
  }

  get manager(): EntityManager {
    return this.dataSource.manager;
  }
}
