import { Controller } from '@nestjs/common';
import { DoctorStaffAuthService } from '../services/doctor-staff-auth.service';

@Controller('api/auth/doctor-staff')
export class DoctorStaffAuthController {
  constructor(private readonly service: DoctorStaffAuthService) {}
}
