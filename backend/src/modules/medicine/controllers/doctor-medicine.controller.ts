import { Controller } from '@nestjs/common';
import { DoctorMedicineService } from '../services/doctor-medicine.service';

@Controller('api/doctor/medicine')
export class DoctorMedicineController {
  constructor(private readonly service: DoctorMedicineService) {}
}
