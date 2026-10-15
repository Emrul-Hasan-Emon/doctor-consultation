import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PatientAuthService {
  constructor(private readonly db: DatabaseService) {}
}
