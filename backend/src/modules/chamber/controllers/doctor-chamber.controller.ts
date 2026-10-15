import { Controller } from '@nestjs/common';
import { DoctorChamberService } from '../services/doctor-chamber.service';

@Controller('api/doctor/chamber')
export class DoctorChamberController {
  constructor(private readonly service: DoctorChamberService) {}
}
