import { Module } from '@nestjs/common';
import { AdminHospitalController } from './controllers/admin-hospital.controller';
import { DoctorHospitalController } from './controllers/doctor-hospital.controller';
import { PatientHospitalController } from './controllers/patient-hospital.controller';
import { AdminHospitalService } from './services/admin-hospital.service';
import { DoctorHospitalService } from './services/doctor-hospital.service';
import { PatientHospitalService } from './services/patient-hospital.service';

@Module({
  controllers: [
    AdminHospitalController,
    DoctorHospitalController,
    PatientHospitalController,
  ],
  providers: [
    AdminHospitalService,
    DoctorHospitalService,
    PatientHospitalService,
  ],
  exports: [
    AdminHospitalService,
    DoctorHospitalService,
    PatientHospitalService,
  ],
})
export class HospitalModule {}
