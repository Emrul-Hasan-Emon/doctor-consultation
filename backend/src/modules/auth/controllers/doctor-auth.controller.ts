import { Controller } from '@nestjs/common';
import { DoctorAuthService } from '../services/doctor-auth.service';

@Controller('api/auth/doctor')
export class DoctorAuthController {
  constructor(private readonly service: DoctorAuthService) {}
}
