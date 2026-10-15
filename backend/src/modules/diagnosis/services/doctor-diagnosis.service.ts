import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class DoctorDiagnosisService {
  constructor(private readonly db: DatabaseService) {}
}
