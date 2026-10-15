import { Module } from '@nestjs/common';
import { AdminDoctorStaffController } from './controllers/admin-doctor-staff.controller';
import { DoctorDoctorStaffController } from './controllers/doctor-doctor-staff.controller';
import { AdminDoctorStaffService } from './services/admin-doctor-staff.service';
import { DoctorDoctorStaffService } from './services/doctor-doctor-staff.service';

@Module({
  controllers: [AdminDoctorStaffController, DoctorDoctorStaffController],
  providers: [AdminDoctorStaffService, DoctorDoctorStaffService],
  exports: [AdminDoctorStaffService, DoctorDoctorStaffService],
})
export class DoctorStaffModule {}
