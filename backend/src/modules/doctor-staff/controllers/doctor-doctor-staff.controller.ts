import { Controller } from '@nestjs/common';
import { DoctorDoctorStaffService } from '../services/doctor-doctor-staff.service';

@Controller('api/doctor/doctor-staff')
export class DoctorDoctorStaffController {
  constructor(private readonly service: DoctorDoctorStaffService) {}
}
