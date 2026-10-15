import { UserType } from '../../database/enums';

/** The authenticated caller, attached to the request by JwtAuthGuard. */
export interface AuthActor {
  accountId: number;
  type: UserType;
  /** Row id in the profile table (AdminUser, Doctor, DoctorStaff, Patient). */
  profileId: number;
  /**
   * Doctor the caller acts as. Doctor: own id. Doctor staff: their doctor.
   * Patient: the doctor chosen at login. Admin: null.
   */
  doctorId: number | null;
}

export interface JwtPayload {
  sub: number;
  type: UserType;
  pid: number;
  did: number | null;
  /** Account tokenVersion at issue time. */
  tv: number;
}
