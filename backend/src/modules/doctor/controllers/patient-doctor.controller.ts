import { Controller } from '@nestjs/common';
import { PatientDoctorService } from '../services/patient-doctor.service';

@Controller('api/patient/doctor')
export class PatientDoctorController {
  constructor(private readonly service: PatientDoctorService) {}
}
