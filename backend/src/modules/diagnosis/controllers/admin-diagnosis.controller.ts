import { Controller } from '@nestjs/common';
import { AdminDiagnosisService } from '../services/admin-diagnosis.service';

@Controller('api/admin/diagnosis')
export class AdminDiagnosisController {
  constructor(private readonly service: AdminDiagnosisService) {}
}
