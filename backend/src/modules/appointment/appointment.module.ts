import { Module } from '@nestjs/common';
import { AdminAppointmentController } from './controllers/admin-appointment.controller';
import { DoctorAppointmentController } from './controllers/doctor-appointment.controller';
import { PatientAppointmentController } from './controllers/patient-appointment.controller';
import { AppointmentAvailabilityService } from './services/appointment-availability.service';
import { AppointmentBookingService } from './services/appointment-booking.service';
import { AdminAppointmentService } from './services/admin-appointment.service';
import { DoctorAppointmentService } from './services/doctor-appointment.service';
import { PatientAppointmentService } from './services/patient-appointment.service';

@Module({
  controllers: [
    AdminAppointmentController,
    DoctorAppointmentController,
    PatientAppointmentController,
  ],
  providers: [
    AppointmentAvailabilityService,
    AppointmentBookingService,
    AdminAppointmentService,
    DoctorAppointmentService,
    PatientAppointmentService,
  ],
  exports: [
    AppointmentAvailabilityService,
    AppointmentBookingService,
    AdminAppointmentService,
    DoctorAppointmentService,
    PatientAppointmentService,
  ],
})
export class AppointmentModule {}
