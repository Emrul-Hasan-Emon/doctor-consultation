import { Controller } from '@nestjs/common';
import { PatientHospitalService } from '../services/patient-hospital.service';

@Controller('api/patient/hospital')
export class PatientHospitalController {
  constructor(private readonly service: PatientHospitalService) {}
}
