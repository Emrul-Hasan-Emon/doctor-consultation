import { Controller } from '@nestjs/common';
import { DoctorAppointmentService } from '../services/doctor-appointment.service';

@Controller('api/doctor/appointment')
export class DoctorAppointmentController {
  constructor(private readonly service: DoctorAppointmentService) {}
}
