import { Controller } from '@nestjs/common';
import { DoctorDoctorService } from '../services/doctor-doctor.service';

@Controller('api/doctor/doctor')
export class DoctorDoctorController {
  constructor(private readonly service: DoctorDoctorService) {}
}
