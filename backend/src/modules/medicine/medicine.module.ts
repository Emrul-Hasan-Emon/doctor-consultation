import { Module } from '@nestjs/common';
import { AdminMedicineController } from './controllers/admin-medicine.controller';
import { DoctorMedicineController } from './controllers/doctor-medicine.controller';
import { AdminMedicineService } from './services/admin-medicine.service';
import { DoctorMedicineService } from './services/doctor-medicine.service';

@Module({
  controllers: [AdminMedicineController, DoctorMedicineController],
  providers: [AdminMedicineService, DoctorMedicineService],
  exports: [AdminMedicineService, DoctorMedicineService],
})
export class MedicineModule {}
