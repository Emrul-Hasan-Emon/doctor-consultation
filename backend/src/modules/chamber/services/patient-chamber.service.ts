import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PatientChamberService {
  constructor(private readonly db: DatabaseService) {}
}
