import { Module } from '@nestjs/common';
import { AdminLocationController } from './controllers/admin-location.controller';
import { DoctorLocationController } from './controllers/doctor-location.controller';
import { PatientLocationController } from './controllers/patient-location.controller';
import { AdminLocationService } from './services/admin-location.service';
import { DoctorLocationService } from './services/doctor-location.service';
import { PatientLocationService } from './services/patient-location.service';

@Module({
  controllers: [
    AdminLocationController,
    DoctorLocationController,
    PatientLocationController,
  ],
  providers: [
    AdminLocationService,
    DoctorLocationService,
    PatientLocationService,
  ],
  exports: [
    AdminLocationService,
    DoctorLocationService,
    PatientLocationService,
  ],
})
export class LocationModule {}
