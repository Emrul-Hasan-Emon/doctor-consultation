import { Controller } from '@nestjs/common';
import { PatientSpecialityService } from '../services/patient-speciality.service';

@Controller('api/patient/speciality')
export class PatientSpecialityController {
  constructor(private readonly service: PatientSpecialityService) {}
}
