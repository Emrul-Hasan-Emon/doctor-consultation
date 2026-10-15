import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PatientAppointmentService {
  constructor(private readonly db: DatabaseService) {}
}
