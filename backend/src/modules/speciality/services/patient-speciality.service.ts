import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PatientSpecialityService {
  constructor(private readonly db: DatabaseService) {}
}
