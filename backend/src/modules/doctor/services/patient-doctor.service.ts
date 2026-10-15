import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PatientDoctorService {
  constructor(private readonly db: DatabaseService) {}
}
