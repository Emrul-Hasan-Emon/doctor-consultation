import { Module } from '@nestjs/common';
import { AdminSpecialityController } from './controllers/admin-speciality.controller';
import { DoctorSpecialityController } from './controllers/doctor-speciality.controller';
import { PatientSpecialityController } from './controllers/patient-speciality.controller';
import { AdminSpecialityService } from './services/admin-speciality.service';
import { DoctorSpecialityService } from './services/doctor-speciality.service';
import { PatientSpecialityService } from './services/patient-speciality.service';

@Module({
  controllers: [
    AdminSpecialityController,
    DoctorSpecialityController,
    PatientSpecialityController,
  ],
  providers: [
    AdminSpecialityService,
    DoctorSpecialityService,
    PatientSpecialityService,
  ],
  exports: [
    AdminSpecialityService,
    DoctorSpecialityService,
    PatientSpecialityService,
  ],
})
export class SpecialityModule {}
