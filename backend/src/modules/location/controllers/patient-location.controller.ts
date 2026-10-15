import { Controller } from '@nestjs/common';
import { PatientLocationService } from '../services/patient-location.service';

@Controller('api/patient/location')
export class PatientLocationController {
  constructor(private readonly service: PatientLocationService) {}
}
