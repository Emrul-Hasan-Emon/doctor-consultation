import { Controller } from '@nestjs/common';
import { PatientAppointmentService } from '../services/patient-appointment.service';

@Controller('api/patient/appointment')
export class PatientAppointmentController {
  constructor(private readonly service: PatientAppointmentService) {}
}
