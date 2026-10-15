import { Module } from '@nestjs/common';
import { AdminPatientController } from './controllers/admin-patient.controller';
import { DoctorPatientController } from './controllers/doctor-patient.controller';
import { PatientPatientController } from './controllers/patient-patient.controller';
import { AdminPatientService } from './services/admin-patient.service';
import { DoctorPatientService } from './services/doctor-patient.service';
import { PatientPatientService } from './services/patient-patient.service';

@Module({
  controllers: [
    AdminPatientController,
    DoctorPatientController,
    PatientPatientController,
  ],
  providers: [AdminPatientService, DoctorPatientService, PatientPatientService],
  exports: [AdminPatientService, DoctorPatientService, PatientPatientService],
})
export class PatientModule {}
