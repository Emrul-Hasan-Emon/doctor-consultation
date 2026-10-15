import { Controller } from '@nestjs/common';
import { DoctorDiagnosisService } from '../services/doctor-diagnosis.service';

@Controller('api/doctor/diagnosis')
export class DoctorDiagnosisController {
  constructor(private readonly service: DoctorDiagnosisService) {}
}
