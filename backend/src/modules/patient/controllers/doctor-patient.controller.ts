import { Controller } from '@nestjs/common';
import { DoctorPatientService } from '../services/doctor-patient.service';

@Controller('api/doctor/patient')
export class DoctorPatientController {
  constructor(private readonly service: DoctorPatientService) {}
}
