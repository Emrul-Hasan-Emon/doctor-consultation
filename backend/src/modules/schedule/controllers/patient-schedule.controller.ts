import { Controller } from '@nestjs/common';
import { PatientScheduleService } from '../services/patient-schedule.service';

@Controller('api/patient/schedule')
export class PatientScheduleController {
  constructor(private readonly service: PatientScheduleService) {}
}
