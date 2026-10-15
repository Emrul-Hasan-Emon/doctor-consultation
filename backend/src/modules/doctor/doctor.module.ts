import { Module } from '@nestjs/common';
import { AdminDoctorController } from './controllers/admin-doctor.controller';
import { DoctorDoctorController } from './controllers/doctor-doctor.controller';
import { PatientDoctorController } from './controllers/patient-doctor.controller';
import { AdminDoctorService } from './services/admin-doctor.service';
import { DoctorDoctorService } from './services/doctor-doctor.service';
import { PatientDoctorService } from './services/patient-doctor.service';

@Module({
  controllers: [
    AdminDoctorController,
    DoctorDoctorController,
    PatientDoctorController,
  ],
  providers: [AdminDoctorService, DoctorDoctorService, PatientDoctorService],
  exports: [AdminDoctorService, DoctorDoctorService, PatientDoctorService],
})
export class DoctorModule {}
