import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class DoctorSpecialityService {
  constructor(private readonly db: DatabaseService) {}
}
