import { Controller } from '@nestjs/common';
import { DoctorSpecialityService } from '../services/doctor-speciality.service';

@Controller('api/doctor/speciality')
export class DoctorSpecialityController {
  constructor(private readonly service: DoctorSpecialityService) {}
}
