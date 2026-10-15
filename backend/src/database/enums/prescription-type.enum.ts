/**
 * Which prescription form a speciality uses. Replaces the reference's
 * hard-coded speciality ids (18 = nutritionist, 25/28 = other).
 */
export enum PrescriptionType {
  GENERAL = 'GENERAL',
  NUTRITIONIST = 'NUTRITIONIST',
  OTHER = 'OTHER',
}
