import { Controller } from '@nestjs/common';
import { DoctorHospitalService } from '../services/doctor-hospital.service';

@Controller('api/doctor/hospital')
export class DoctorHospitalController {
  constructor(private readonly service: DoctorHospitalService) {}
}
