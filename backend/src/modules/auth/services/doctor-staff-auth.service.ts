import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class DoctorStaffAuthService {
  constructor(private readonly db: DatabaseService) {}
}
