import { Controller } from '@nestjs/common';
import { PatientPatientService } from '../services/patient-patient.service';

@Controller('api/patient/patient')
export class PatientPatientController {
  constructor(private readonly service: PatientPatientService) {}
}
