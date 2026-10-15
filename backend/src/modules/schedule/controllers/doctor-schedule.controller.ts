import { Controller } from '@nestjs/common';
import { DoctorScheduleService } from '../services/doctor-schedule.service';

@Controller('api/doctor/schedule')
export class DoctorScheduleController {
  constructor(private readonly service: DoctorScheduleService) {}
}
