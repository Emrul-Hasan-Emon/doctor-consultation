import { Controller } from '@nestjs/common';
import { DoctorLocationService } from '../services/doctor-location.service';

@Controller('api/doctor/location')
export class DoctorLocationController {
  constructor(private readonly service: DoctorLocationService) {}
}
