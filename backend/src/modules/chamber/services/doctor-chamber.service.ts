import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class DoctorChamberService {
  constructor(private readonly db: DatabaseService) {}
}
