import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { DoctorAuthController } from './controllers/doctor-auth.controller';
import { DoctorStaffAuthController } from './controllers/doctor-staff-auth.controller';
import { PatientAuthController } from './controllers/patient-auth.controller';
import { AccountService } from './services/account.service';
import { AdminAuthService } from './services/admin-auth.service';
import { AuthCoreService } from './services/auth-core.service';
import { DoctorAuthService } from './services/doctor-auth.service';
import { DoctorStaffAuthService } from './services/doctor-staff-auth.service';
import { PatientAuthService } from './services/patient-auth.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(config.get('JWT_ACCESS_TTL_SECONDS') ?? 900),
        },
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    DoctorAuthController,
    DoctorStaffAuthController,
    PatientAuthController,
  ],
  providers: [
    AuthCoreService,
    AccountService,
    AdminAuthService,
    DoctorAuthService,
    DoctorStaffAuthService,
    PatientAuthService,
    // Order matters: throttle, authenticate, then check role.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthCoreService, AccountService],
})
export class AuthModule {}
