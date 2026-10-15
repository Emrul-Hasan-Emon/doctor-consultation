import { Controller } from '@nestjs/common';
import { PatientAuthService } from '../services/patient-auth.service';

@Controller('api/auth/patient')
export class PatientAuthController {
  constructor(private readonly service: PatientAuthService) {}
}
