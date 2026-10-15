export interface MealInstruction {
  mealType?: string;
  instruction?: string;
  duration?: string;
}

/** Snapshot of demographics at consultation time. Edited from the prescribe screen. */
export interface PatientDetails {
  fullName: string;
  mobile?: string;
  gender?: string;
  age?: number;
  /** kg */
  weight?: number;
  /** cm */
  height?: number;
}
