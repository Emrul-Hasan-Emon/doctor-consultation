import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { validateEnv } from './common/config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { DoctorStaffModule } from './modules/doctor-staff/doctor-staff.module';
import { PatientModule } from './modules/patient/patient.module';
import { SpecialityModule } from './modules/speciality/speciality.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { LocationModule } from './modules/location/location.module';
import { ChamberModule } from './modules/chamber/chamber.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { MedicineModule } from './modules/medicine/medicine.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    CommonModule,
    DatabaseModule,
    AuthModule,
    DoctorModule,
    DoctorStaffModule,
    PatientModule,
    SpecialityModule,
    HospitalModule,
    LocationModule,
    ChamberModule,
    ScheduleModule,
    AppointmentModule,
    DiagnosisModule,
    MedicineModule,
  ],
})
export class AppModule {}
