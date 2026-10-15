import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class DoctorLocationService {
  constructor(private readonly db: DatabaseService) {}
}
