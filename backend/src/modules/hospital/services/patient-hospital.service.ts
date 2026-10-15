import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PatientHospitalService {
  constructor(private readonly db: DatabaseService) {}
}
