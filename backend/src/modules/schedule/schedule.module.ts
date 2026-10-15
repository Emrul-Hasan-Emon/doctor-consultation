import { Module } from '@nestjs/common';
import { ChamberModule } from '../chamber/chamber.module';
import { AdminScheduleController } from './controllers/admin-schedule.controller';
import { DoctorScheduleController } from './controllers/doctor-schedule.controller';
import { PatientScheduleController } from './controllers/patient-schedule.controller';
import { AdminScheduleService } from './services/admin-schedule.service';
import { DoctorScheduleService } from './services/doctor-schedule.service';
import { PatientScheduleService } from './services/patient-schedule.service';

@Module({
  imports: [ChamberModule],
  controllers: [
    AdminScheduleController,
    DoctorScheduleController,
    PatientScheduleController,
  ],
  providers: [
    AdminScheduleService,
    DoctorScheduleService,
    PatientScheduleService,
  ],
  exports: [
    AdminScheduleService,
    DoctorScheduleService,
    PatientScheduleService,
  ],
})
export class ScheduleModule {}
