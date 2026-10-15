import { Module } from '@nestjs/common';
import { AdminDiagnosisController } from './controllers/admin-diagnosis.controller';
import { DoctorDiagnosisController } from './controllers/doctor-diagnosis.controller';
import { AdminDiagnosisService } from './services/admin-diagnosis.service';
import { DoctorDiagnosisService } from './services/doctor-diagnosis.service';

@Module({
  controllers: [AdminDiagnosisController, DoctorDiagnosisController],
  providers: [AdminDiagnosisService, DoctorDiagnosisService],
  exports: [AdminDiagnosisService, DoctorDiagnosisService],
})
export class DiagnosisModule {}
