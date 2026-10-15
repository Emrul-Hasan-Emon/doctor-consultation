import { Module } from '@nestjs/common';
import { AdminChamberController } from './controllers/admin-chamber.controller';
import { DoctorChamberController } from './controllers/doctor-chamber.controller';
import { PatientChamberController } from './controllers/patient-chamber.controller';
import { AdminChamberService } from './services/admin-chamber.service';
import { ChamberScheduleService } from './services/chamber-schedule.service';
import { DoctorChamberService } from './services/doctor-chamber.service';
import { PatientChamberService } from './services/patient-chamber.service';

@Module({
  controllers: [
    AdminChamberController,
    DoctorChamberController,
    PatientChamberController,
  ],
  providers: [
    ChamberScheduleService,
    AdminChamberService,
    DoctorChamberService,
    PatientChamberService,
  ],
  exports: [
    ChamberScheduleService,
    AdminChamberService,
    DoctorChamberService,
    PatientChamberService,
  ],
})
export class ChamberModule {}
