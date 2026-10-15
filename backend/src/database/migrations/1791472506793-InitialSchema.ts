import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791472506793 implements MigrationInterface {
  name = 'InitialSchema1791472506793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_account_type_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_account" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "type" "public"."user_account_type_enum" NOT NULL, "mobile" character varying(20) NOT NULL, "email" character varying(255), "passwordHash" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "isMobileVerified" boolean NOT NULL DEFAULT false, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "tokenVersion" integer NOT NULL DEFAULT '0', "failedLoginCount" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6acfec7285fdf9f463462de3e9f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b5b22bb1104534a308b9e08f27" ON "user_account"  ("type", "email") WHERE "deletedAt" IS NULL AND "email" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8125b16499863bfd699ba62c10" ON "user_account"  ("type", "mobile") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admin_user_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "accountId" integer NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100), "role" "public"."admin_user_role_enum" NOT NULL DEFAULT 'ADMIN', CONSTRAINT "REL_f4a64072bf3931b136428d4d62" UNIQUE ("accountId"), CONSTRAINT "PK_a28028ba709cd7e5053a86857b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f4a64072bf3931b136428d4d62" ON "admin_user"  ("accountId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_log_fromstatus_enum" AS ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_log_tostatus_enum" AS ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_log_actortype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointment_status_log" ("id" BIGSERIAL NOT NULL, "appointmentId" integer NOT NULL, "fromStatus" "public"."appointment_status_log_fromstatus_enum", "toStatus" "public"."appointment_status_log_tostatus_enum" NOT NULL, "actorType" "public"."appointment_status_log_actortype_enum" NOT NULL, "actorId" integer NOT NULL, "reason" character varying(255), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_57441a60a94ef141beb1ac64ad2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b6676e79d75c2678d789786f3" ON "appointment_status_log"  ("appointmentId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "division" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "nameBN" character varying(255), "status" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b6f0d207e38106dbddabab3a078" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "district" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "nameBN" character varying(255), "status" boolean NOT NULL DEFAULT true, "divisionId" integer NOT NULL, CONSTRAINT "PK_ee5cb6fd5223164bb87ea693f1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."speciality_prescriptiontype_enum" AS ENUM('GENERAL', 'NUTRITIONIST', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "speciality" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "nameBN" character varying(255), "title" character varying(255), "titleBN" character varying(255), "value" character varying(255) NOT NULL, "icon" character varying(255), "prescriptionType" "public"."speciality_prescriptiontype_enum" NOT NULL DEFAULT 'GENERAL', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_a20b43c6b36e055277860555a6d" UNIQUE ("value"), CONSTRAINT "PK_cfdbcfa372a34f2d9c1d5180052" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."doctor_staff_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_staff" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "accountId" integer NOT NULL, "doctorId" integer NOT NULL, "name" character varying(255) NOT NULL, "nameBN" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "createdByType" "public"."doctor_staff_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, CONSTRAINT "REL_1d505814fed8c6bcd3c78e3f7e" UNIQUE ("accountId"), CONSTRAINT "PK_30c6c35db96d7de4993f2f0c614" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1d505814fed8c6bcd3c78e3f7e" ON "doctor_staff"  ("accountId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_883c738cdc6fe00fa520d3d2e2" ON "doctor_staff"  ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hospital" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "nameBN" character varying(255), "alias" character varying(255), "aliasBN" character varying(255), "phone" character varying(20), "email" character varying(255), "address" text, "addressBN" text, "description" text, "descriptionBN" text, "banner" character varying(255), "icon" character varying(255), "status" boolean NOT NULL DEFAULT true, "divisionId" integer NOT NULL, "districtId" integer NOT NULL, CONSTRAINT "UQ_8a23841c964290648eb2a851e84" UNIQUE ("name"), CONSTRAINT "PK_10f19e0bf17ded693ea0da07d95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamber_turn" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "chamberDayId" integer NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "slotDurationMinutes" integer NOT NULL, "maxPatients" integer NOT NULL, "fee" integer NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "CHK_turn_slot" CHECK ("slotDurationMinutes" > 0), CONSTRAINT "CHK_turn_fee" CHECK ("fee" >= 0), CONSTRAINT "CHK_turn_capacity" CHECK ("maxPatients" > 0), CONSTRAINT "CHK_turn_time" CHECK ("endTime" > "startTime"), CONSTRAINT "PK_ee24282b9d11896e214bed98a1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20386e1ae4a1f2aed06398688e" ON "chamber_turn"  ("chamberDayId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "chamber_day" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "chamberId" integer NOT NULL, "weekday" smallint NOT NULL, "isOff" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_36276580d7b39fd641c0402511b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_43a6ba1ed37569777173e13245" ON "chamber_day"  ("chamberId", "weekday") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chamber_chambertype_enum" AS ENUM('SELF', 'HOSPITAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamber" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "doctorId" integer NOT NULL, "name" character varying(255), "nameBN" character varying(255), "chamberType" "public"."chamber_chambertype_enum" NOT NULL, "hospitalId" integer, "divisionId" integer NOT NULL, "districtId" integer NOT NULL, "address" text NOT NULL, "addressBN" text, "description" text, "descriptionBN" text, "advanceBookingDays" integer NOT NULL DEFAULT '30', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "CHK_chamber_hospital" CHECK (("chamberType" = 'HOSPITAL') = ("hospitalId" IS NOT NULL)), CONSTRAINT "PK_cde4a9652dfc250c6184b3f6fb4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c482c4529d87ca996338b3f57" ON "chamber"  ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_off_date" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "doctorId" integer NOT NULL, "date" date NOT NULL, "reason" character varying(255), "reasonBN" character varying(255), CONSTRAINT "PK_ab38b28e4758b3986e454a3aba5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_65f23c497f852f83386091873b" ON "doctor_off_date"  ("doctorId", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "accountId" integer NOT NULL, "name" character varying(255) NOT NULL, "nameBN" character varying(255), "profilePic" character varying(255), "signatureUrl" character varying(255), "degrees" character varying(255), "degreesBN" text, "experience" integer, "bmdcCode" character varying(100), "bmdcExpiryDate" date, "workingAt" character varying(255), "workingAtBN" text, "biography" text, "biographyBN" text, "consultationDurationMinutes" integer NOT NULL DEFAULT '15', "defaultFollowUpDays" integer, "isActive" boolean NOT NULL DEFAULT true, "specialityId" integer, CONSTRAINT "REL_b7d00d3985d6e28a635abe5589" UNIQUE ("accountId"), CONSTRAINT "PK_ee6bf6c8de78803212c548fcb94" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b7d00d3985d6e28a635abe5589" ON "doctor"  ("accountId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5fea8a198a6563dab8d115abd9" ON "doctor"  ("bmdcCode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_481703e5094c9305b69f8d61b5" ON "doctor"  ("specialityId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."doctor_patient_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_patient" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "doctorId" integer NOT NULL, "patientId" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "deactivatedAt" TIMESTAMP WITH TIME ZONE, "createdByType" "public"."doctor_patient_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, CONSTRAINT "PK_eab52a93c854c8d7c7ae8cfa279" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94c56b6260dde5b9ebd5ca491e" ON "doctor_patient"  ("patientId", "isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa218a3430fef7c4b7e95bfdc5" ON "doctor_patient"  ("doctorId", "isActive") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8bc9d7109db1ec42202e082f0d" ON "doctor_patient"  ("doctorId", "patientId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patient_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "patient" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "accountId" integer NOT NULL, "name" character varying(255) NOT NULL, "nameBN" character varying(255), "divisionId" integer NOT NULL, "districtId" integer NOT NULL, "address" text, "addressBN" text, "isActive" boolean NOT NULL DEFAULT true, "createdByType" "public"."patient_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, CONSTRAINT "REL_7d80c1776b4c07adc20c0f6d60" UNIQUE ("accountId"), CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7d80c1776b4c07adc20c0f6d60" ON "patient"  ("accountId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd0a9de126d8a86c66bbcc42e5" ON "patient"  ("divisionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8f557ede4964634072fc07c19" ON "patient"  ("districtId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_enum" AS ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_category_enum" AS ENUM('NEW', 'FOLLOW_UP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_bookedbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_cancelledbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointment" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "chamberId" integer NOT NULL, "chamberTurnId" integer NOT NULL, "appointmentDate" date NOT NULL, "slotNumber" integer NOT NULL, "slotStartTime" TIME NOT NULL, "slotEndTime" TIME NOT NULL, "durationMinutes" integer NOT NULL, "fee" integer NOT NULL, "status" "public"."appointment_status_enum" NOT NULL DEFAULT 'SCHEDULED', "category" "public"."appointment_category_enum" NOT NULL DEFAULT 'NEW', "patientDetails" jsonb, "bookedByType" "public"."appointment_bookedbytype_enum" NOT NULL, "bookedById" integer NOT NULL, "cancelledAt" TIMESTAMP WITH TIME ZONE, "cancelledByType" "public"."appointment_cancelledbytype_enum", "cancelledById" integer, "cancelReason" character varying(255), "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1f0661ff87098c04e65967a237" ON "appointment"  ("chamberTurnId", "appointmentDate", "slotNumber") WHERE "status" <> 'CANCELLED'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f289eb5eeebce1e6504b8a78fc" ON "appointment"  ("chamberTurnId", "appointmentDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ded2d3bce282057aede6b963b" ON "appointment"  ("patientId", "appointmentDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27fb5c3d97e12d575802726e7e" ON "appointment"  ("doctorId", "appointmentDate", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_log_actortype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" BIGSERIAL NOT NULL, "actorType" "public"."audit_log_actortype_enum" NOT NULL, "actorId" integer NOT NULL, "onBehalfOfDoctorId" integer, "action" character varying(100) NOT NULL, "entityType" character varying(100) NOT NULL, "entityId" integer NOT NULL, "changes" jsonb, "ip" character varying(45), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78e013ffae12f5a1fc1dbefff9" ON "audit_log"  ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_690d510485b9271273a0111faa" ON "audit_log"  ("actorType", "actorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7253c576c9bcaf94fe064341dd" ON "audit_log"  ("entityType", "entityId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "accountId" integer NOT NULL, "tokenHash" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "selectedDoctorId" integer, "deviceDetails" jsonb, CONSTRAINT "PK_4572ff5d1264c4a523f01aa86a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d7910be62df26229e2d3b5a9e" ON "auth_token"  ("accountId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7634f50cfa7ac8e4e4d5f31e35" ON "auth_token"  ("tokenHash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cd2007f24ad4c2644331e0783" ON "auth_token"  ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "diagnosis_medicine" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diagnosisId" integer NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "medicineId" integer, "doctorMedicineId" integer, "brandName" character varying(255) NOT NULL, "genericName" character varying(1024), "manufacturer" character varying(255), "strength" character varying(1024), "dosage" character varying(100), "dar" character varying(100), "frequency" character varying(255), "duration" character varying(255), "instruction" character varying(500), "isChronic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_8e321bcb4118adec5c0c706334b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09d53bf524c2075f4a295dad62" ON "diagnosis_medicine"  ("diagnosisId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25f83ec43e30e28cfb8454f5c5" ON "diagnosis_medicine"  ("medicineId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."diagnosis_status_enum" AS ENUM('DRAFT', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "diagnosis" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "appointmentId" integer NOT NULL, "doctorId" integer NOT NULL, "status" "public"."diagnosis_status_enum" NOT NULL DEFAULT 'DRAFT', "mealInstruction" jsonb, "followUpComment" text, "followUpDay" integer, "followUpDate" date, "completedAt" TIMESTAMP WITH TIME ZONE, "pdfFileKey" character varying(1024), "pdfGeneratedAt" TIMESTAMP WITH TIME ZONE, "smsSentAt" TIMESTAMP WITH TIME ZONE, "textSmsSentAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_d5dbb1cc4e30790df368da56961" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_589f5bdaa8b34421a72ca8bb3a" ON "diagnosis"  ("appointmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c3a899268650ed7872f8594d8" ON "diagnosis"  ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."diagnosis_item_kind_enum" AS ENUM('CHIEF_COMPLAINT', 'DIAGNOSIS', 'LAB_TEST', 'ADVICE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "diagnosis_item" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diagnosisId" integer NOT NULL, "kind" "public"."diagnosis_item_kind_enum" NOT NULL, "text" character varying(500) NOT NULL, "code" character varying(50), "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_ed39fab53d13c84e6887855f8c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a4baf4dee8f288135fb3f0cd3" ON "diagnosis_item"  ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5680049de1250f069142bd5851" ON "diagnosis_item"  ("diagnosisId", "kind", "sortOrder") `,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_medicine" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "doctorId" integer NOT NULL, "medicineId" integer, "manufacturer" character varying(255), "brandName" character varying(255), "genericName" character varying(1024), "strength" character varying(1024), "dosage" character varying(100), "dar" character varying(100), "frequency" character varying(255), "duration" character varying(255), "instruction" character varying(500), "isChronic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_846035e46466688aaea857a0cb9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_99c13d6e968522ef1340b65560" ON "doctor_medicine"  ("doctorId", "medicineId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."doctor_saved_item_kind_enum" AS ENUM('CHIEF_COMPLAINT', 'DIAGNOSIS', 'LAB_TEST', 'ADVICE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_saved_item" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "doctorId" integer NOT NULL, "kind" "public"."doctor_saved_item_kind_enum" NOT NULL, "text" character varying(500) NOT NULL, CONSTRAINT "PK_bbc9343505e80c14b9d267bdf2a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_714a7f608e39575ed3f202807f" ON "doctor_saved_item"  ("doctorId", "kind", "text") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."drug_history_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."drug_history_reportedby_enum" AS ENUM('PATIENT', 'DOCTOR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "drug_history" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diagnosisId" integer NOT NULL, "appointmentId" integer NOT NULL, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "date" date NOT NULL, "createdByType" "public"."drug_history_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, "drug" character varying(1000) NOT NULL, "reportedBy" "public"."drug_history_reportedby_enum" NOT NULL DEFAULT 'PATIENT', CONSTRAINT "PK_b856c65e7339d54a26a76b0078c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_161d8bcddc3d7dde67a6e39555" ON "drug_history"  ("diagnosisId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45391589f74959c0ed7bd698b4" ON "drug_history"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."family_history_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "family_history" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diagnosisId" integer NOT NULL, "appointmentId" integer NOT NULL, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "date" date NOT NULL, "createdByType" "public"."family_history_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, "history" character varying(1000) NOT NULL, CONSTRAINT "PK_cbd60bda074eb1c7c17fea20390" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_680c4a0cd05dbb36aee8fe2a6f" ON "family_history"  ("diagnosisId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b9714cb38c843b2a5ca45e683" ON "family_history"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "medicine" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "manufacturer" character varying(255) NOT NULL, "brandName" character varying(255) NOT NULL, "genericName" character varying(1024) NOT NULL, "strength" character varying(1024), "dosage" character varying(100) NOT NULL, "dar" character varying(100) NOT NULL, "isChronic" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "sourceKey" character varying(64), CONSTRAINT "PK_b9e0e6f37b7cadb5f402390928b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_81b7bb2137ace246200ae81820" ON "medicine"  ("sourceKey") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."menstrual_history_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."menstrual_history_menstrualcycle_enum" AS ENUM('Regular', 'Irregular')`,
    );
    await queryRunner.query(
      `CREATE TABLE "menstrual_history" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diagnosisId" integer NOT NULL, "appointmentId" integer NOT NULL, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "date" date NOT NULL, "createdByType" "public"."menstrual_history_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, "lmp" date, "edd" date, "para" character varying(50), "gravida" integer, "alc" character varying(50), "marriedFor" character varying(100), "menstrualCycle" "public"."menstrual_history_menstrualcycle_enum", CONSTRAINT "PK_f010d5b44302f12a7d0ab421090" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fade66edc1c7aad33495dd45d9" ON "menstrual_history"  ("diagnosisId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a033ec35b43abb09d079922d67" ON "menstrual_history"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."otp_challenge_purpose_enum" AS ENUM('PATIENT_LOGIN', 'PASSWORD_RESET')`,
    );
    await queryRunner.query(
      `CREATE TABLE "otp_challenge" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "mobile" character varying(20) NOT NULL, "purpose" "public"."otp_challenge_purpose_enum" NOT NULL, "codeHash" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "consumedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_200fe6e81812616e7f97690cb21" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d12087b343e0c51536d4231a52" ON "otp_challenge"  ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e351d8ac1f4f6c342ed12f3131" ON "otp_challenge"  ("mobile", "purpose", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."past_illness_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."past_illness_reportedby_enum" AS ENUM('PATIENT', 'DOCTOR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "past_illness" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diagnosisId" integer NOT NULL, "appointmentId" integer NOT NULL, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "date" date NOT NULL, "createdByType" "public"."past_illness_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, "illness" character varying(1000) NOT NULL, "reportedBy" "public"."past_illness_reportedby_enum" NOT NULL DEFAULT 'PATIENT', CONSTRAINT "PK_23690dae7bfa72910a99614710e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2dcb55997f3560b18de7c96546" ON "past_illness"  ("diagnosisId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f6cdfe1492652d9617c54fd4ed" ON "past_illness"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sms_outbox_status_enum" AS ENUM('PENDING', 'SENT', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sms_outbox" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "toMobile" character varying(20) NOT NULL, "template" character varying(100) NOT NULL, "payload" jsonb, "status" "public"."sms_outbox_status_enum" NOT NULL DEFAULT 'PENDING', "attempts" integer NOT NULL DEFAULT '0', "lastError" character varying(500), "providerMessageId" character varying(100), "sentAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8b64347e4647de6ac287b2ed834" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d613640dfd9f0e70d5f22b336" ON "sms_outbox"  ("status", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vitals_createdbytype_enum" AS ENUM('ADMIN', 'DOCTOR', 'DOCTOR_STAFF', 'PATIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "vitals" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diagnosisId" integer NOT NULL, "appointmentId" integer NOT NULL, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "date" date NOT NULL, "createdByType" "public"."vitals_createdbytype_enum" NOT NULL, "createdById" integer NOT NULL, "bloodPressure" character varying(20), "pulseRate" character varying(20), "temperature" character varying(20), "respiratoryRate" character varying(20), "spo2" character varying(20), CONSTRAINT "PK_a6f02e68a2c1766b720d065dfd8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_952730170632c469c8e49e4723" ON "vitals"  ("diagnosisId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18d995ee0fc66f9ebded708850" ON "vitals"  ("patientId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_user" ADD CONSTRAINT "FK_f4a64072bf3931b136428d4d620" FOREIGN KEY ("accountId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "district" ADD CONSTRAINT "FK_5a90f59e76c13a9aa52a61c1692" FOREIGN KEY ("divisionId") REFERENCES "division"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_staff" ADD CONSTRAINT "FK_1d505814fed8c6bcd3c78e3f7ed" FOREIGN KEY ("accountId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_staff" ADD CONSTRAINT "FK_883c738cdc6fe00fa520d3d2e2b" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital" ADD CONSTRAINT "FK_c140494ff2ead2ef870c33b40af" FOREIGN KEY ("divisionId") REFERENCES "division"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital" ADD CONSTRAINT "FK_a5acc204d536625e2c2e4b3140f" FOREIGN KEY ("districtId") REFERENCES "district"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber_turn" ADD CONSTRAINT "FK_20386e1ae4a1f2aed06398688ee" FOREIGN KEY ("chamberDayId") REFERENCES "chamber_day"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber_day" ADD CONSTRAINT "FK_39884bde1536ebad542ec60b38b" FOREIGN KEY ("chamberId") REFERENCES "chamber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" ADD CONSTRAINT "FK_6c482c4529d87ca996338b3f57e" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" ADD CONSTRAINT "FK_74ca030c343c4d57e6309fdc7e4" FOREIGN KEY ("hospitalId") REFERENCES "hospital"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" ADD CONSTRAINT "FK_34e3f12dd49c8533d0d693a828e" FOREIGN KEY ("divisionId") REFERENCES "division"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" ADD CONSTRAINT "FK_4e787c15785c6c7b0149ef5fca6" FOREIGN KEY ("districtId") REFERENCES "district"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_off_date" ADD CONSTRAINT "FK_cb948442e4ea77c1a151a594f5d" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor" ADD CONSTRAINT "FK_b7d00d3985d6e28a635abe5589a" FOREIGN KEY ("accountId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor" ADD CONSTRAINT "FK_481703e5094c9305b69f8d61b58" FOREIGN KEY ("specialityId") REFERENCES "speciality"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_patient" ADD CONSTRAINT "FK_fdaddf39db96906e183460b8824" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_patient" ADD CONSTRAINT "FK_022378a74b4f8a631f985966643" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" ADD CONSTRAINT "FK_7d80c1776b4c07adc20c0f6d60f" FOREIGN KEY ("accountId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" ADD CONSTRAINT "FK_dd0a9de126d8a86c66bbcc42e5b" FOREIGN KEY ("divisionId") REFERENCES "division"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" ADD CONSTRAINT "FK_a8f557ede4964634072fc07c195" FOREIGN KEY ("districtId") REFERENCES "district"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_5ce4c3130796367c93cd817948e" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_50736df8b34b9cbe709feb7a693" FOREIGN KEY ("chamberId") REFERENCES "chamber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_ad8281af406fe8cfc553d3a4672" FOREIGN KEY ("chamberTurnId") REFERENCES "chamber_turn"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_token" ADD CONSTRAINT "FK_3d7910be62df26229e2d3b5a9ee" FOREIGN KEY ("accountId") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis_medicine" ADD CONSTRAINT "FK_09d53bf524c2075f4a295dad628" FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis" ADD CONSTRAINT "FK_589f5bdaa8b34421a72ca8bb3a6" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis" ADD CONSTRAINT "FK_5c3a899268650ed7872f8594d80" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis_item" ADD CONSTRAINT "FK_27dd25d0d4c06cf63a089c5c94e" FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_medicine" ADD CONSTRAINT "FK_ce86767bc3dcee1f578b558c59d" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_saved_item" ADD CONSTRAINT "FK_fb9b278558e3b2e06cbddcd3587" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "drug_history" ADD CONSTRAINT "FK_161d8bcddc3d7dde67a6e39555a" FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_history" ADD CONSTRAINT "FK_680c4a0cd05dbb36aee8fe2a6f1" FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menstrual_history" ADD CONSTRAINT "FK_fade66edc1c7aad33495dd45d99" FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "past_illness" ADD CONSTRAINT "FK_2dcb55997f3560b18de7c965460" FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vitals" ADD CONSTRAINT "FK_952730170632c469c8e49e4723b" FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Medicine search: trigram indexes for contains and prefix matches.
    await queryRunner.query(
      `CREATE INDEX "IDX_medicine_brand_trgm" ON "medicine" USING gin (lower("brandName") gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_medicine_generic_trgm" ON "medicine" USING gin (lower("genericName") gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_doctor_medicine_brand_trgm" ON "doctor_medicine" USING gin (lower("brandName") gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_doctor_medicine_generic_trgm" ON "doctor_medicine" USING gin (lower("genericName") gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_doctor_medicine_generic_trgm"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_doctor_medicine_brand_trgm"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medicine_generic_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medicine_brand_trgm"`);
    await queryRunner.query(
      `ALTER TABLE "vitals" DROP CONSTRAINT "FK_952730170632c469c8e49e4723b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "past_illness" DROP CONSTRAINT "FK_2dcb55997f3560b18de7c965460"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menstrual_history" DROP CONSTRAINT "FK_fade66edc1c7aad33495dd45d99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_history" DROP CONSTRAINT "FK_680c4a0cd05dbb36aee8fe2a6f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "drug_history" DROP CONSTRAINT "FK_161d8bcddc3d7dde67a6e39555a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_saved_item" DROP CONSTRAINT "FK_fb9b278558e3b2e06cbddcd3587"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_medicine" DROP CONSTRAINT "FK_ce86767bc3dcee1f578b558c59d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis_item" DROP CONSTRAINT "FK_27dd25d0d4c06cf63a089c5c94e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis" DROP CONSTRAINT "FK_5c3a899268650ed7872f8594d80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis" DROP CONSTRAINT "FK_589f5bdaa8b34421a72ca8bb3a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnosis_medicine" DROP CONSTRAINT "FK_09d53bf524c2075f4a295dad628"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_token" DROP CONSTRAINT "FK_3d7910be62df26229e2d3b5a9ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_ad8281af406fe8cfc553d3a4672"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_50736df8b34b9cbe709feb7a693"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_5ce4c3130796367c93cd817948e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" DROP CONSTRAINT "FK_a8f557ede4964634072fc07c195"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" DROP CONSTRAINT "FK_dd0a9de126d8a86c66bbcc42e5b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" DROP CONSTRAINT "FK_7d80c1776b4c07adc20c0f6d60f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_patient" DROP CONSTRAINT "FK_022378a74b4f8a631f985966643"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_patient" DROP CONSTRAINT "FK_fdaddf39db96906e183460b8824"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor" DROP CONSTRAINT "FK_481703e5094c9305b69f8d61b58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor" DROP CONSTRAINT "FK_b7d00d3985d6e28a635abe5589a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_off_date" DROP CONSTRAINT "FK_cb948442e4ea77c1a151a594f5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" DROP CONSTRAINT "FK_4e787c15785c6c7b0149ef5fca6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" DROP CONSTRAINT "FK_34e3f12dd49c8533d0d693a828e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" DROP CONSTRAINT "FK_74ca030c343c4d57e6309fdc7e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber" DROP CONSTRAINT "FK_6c482c4529d87ca996338b3f57e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber_day" DROP CONSTRAINT "FK_39884bde1536ebad542ec60b38b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamber_turn" DROP CONSTRAINT "FK_20386e1ae4a1f2aed06398688ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital" DROP CONSTRAINT "FK_a5acc204d536625e2c2e4b3140f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital" DROP CONSTRAINT "FK_c140494ff2ead2ef870c33b40af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_staff" DROP CONSTRAINT "FK_883c738cdc6fe00fa520d3d2e2b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_staff" DROP CONSTRAINT "FK_1d505814fed8c6bcd3c78e3f7ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "district" DROP CONSTRAINT "FK_5a90f59e76c13a9aa52a61c1692"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_user" DROP CONSTRAINT "FK_f4a64072bf3931b136428d4d620"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_18d995ee0fc66f9ebded708850"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_952730170632c469c8e49e4723"`,
    );
    await queryRunner.query(`DROP TABLE "vitals"`);
    await queryRunner.query(`DROP TYPE "public"."vitals_createdbytype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d613640dfd9f0e70d5f22b336"`,
    );
    await queryRunner.query(`DROP TABLE "sms_outbox"`);
    await queryRunner.query(`DROP TYPE "public"."sms_outbox_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f6cdfe1492652d9617c54fd4ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2dcb55997f3560b18de7c96546"`,
    );
    await queryRunner.query(`DROP TABLE "past_illness"`);
    await queryRunner.query(
      `DROP TYPE "public"."past_illness_reportedby_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."past_illness_createdbytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e351d8ac1f4f6c342ed12f3131"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d12087b343e0c51536d4231a52"`,
    );
    await queryRunner.query(`DROP TABLE "otp_challenge"`);
    await queryRunner.query(`DROP TYPE "public"."otp_challenge_purpose_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a033ec35b43abb09d079922d67"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fade66edc1c7aad33495dd45d9"`,
    );
    await queryRunner.query(`DROP TABLE "menstrual_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."menstrual_history_menstrualcycle_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."menstrual_history_createdbytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81b7bb2137ace246200ae81820"`,
    );
    await queryRunner.query(`DROP TABLE "medicine"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b9714cb38c843b2a5ca45e683"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_680c4a0cd05dbb36aee8fe2a6f"`,
    );
    await queryRunner.query(`DROP TABLE "family_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."family_history_createdbytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45391589f74959c0ed7bd698b4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_161d8bcddc3d7dde67a6e39555"`,
    );
    await queryRunner.query(`DROP TABLE "drug_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."drug_history_reportedby_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."drug_history_createdbytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_714a7f608e39575ed3f202807f"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_saved_item"`);
    await queryRunner.query(`DROP TYPE "public"."doctor_saved_item_kind_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99c13d6e968522ef1340b65560"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_medicine"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5680049de1250f069142bd5851"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a4baf4dee8f288135fb3f0cd3"`,
    );
    await queryRunner.query(`DROP TABLE "diagnosis_item"`);
    await queryRunner.query(`DROP TYPE "public"."diagnosis_item_kind_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5c3a899268650ed7872f8594d8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_589f5bdaa8b34421a72ca8bb3a"`,
    );
    await queryRunner.query(`DROP TABLE "diagnosis"`);
    await queryRunner.query(`DROP TYPE "public"."diagnosis_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25f83ec43e30e28cfb8454f5c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09d53bf524c2075f4a295dad62"`,
    );
    await queryRunner.query(`DROP TABLE "diagnosis_medicine"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7cd2007f24ad4c2644331e0783"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7634f50cfa7ac8e4e4d5f31e35"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d7910be62df26229e2d3b5a9e"`,
    );
    await queryRunner.query(`DROP TABLE "auth_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7253c576c9bcaf94fe064341dd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_690d510485b9271273a0111faa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78e013ffae12f5a1fc1dbefff9"`,
    );
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TYPE "public"."audit_log_actortype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27fb5c3d97e12d575802726e7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ded2d3bce282057aede6b963b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f289eb5eeebce1e6504b8a78fc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f0661ff87098c04e65967a237"`,
    );
    await queryRunner.query(`DROP TABLE "appointment"`);
    await queryRunner.query(
      `DROP TYPE "public"."appointment_cancelledbytype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."appointment_bookedbytype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."appointment_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8f557ede4964634072fc07c19"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd0a9de126d8a86c66bbcc42e5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d80c1776b4c07adc20c0f6d60"`,
    );
    await queryRunner.query(`DROP TABLE "patient"`);
    await queryRunner.query(`DROP TYPE "public"."patient_createdbytype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8bc9d7109db1ec42202e082f0d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa218a3430fef7c4b7e95bfdc5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_94c56b6260dde5b9ebd5ca491e"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_patient"`);
    await queryRunner.query(
      `DROP TYPE "public"."doctor_patient_createdbytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_481703e5094c9305b69f8d61b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5fea8a198a6563dab8d115abd9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7d00d3985d6e28a635abe5589"`,
    );
    await queryRunner.query(`DROP TABLE "doctor"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65f23c497f852f83386091873b"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_off_date"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c482c4529d87ca996338b3f57"`,
    );
    await queryRunner.query(`DROP TABLE "chamber"`);
    await queryRunner.query(`DROP TYPE "public"."chamber_chambertype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43a6ba1ed37569777173e13245"`,
    );
    await queryRunner.query(`DROP TABLE "chamber_day"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20386e1ae4a1f2aed06398688e"`,
    );
    await queryRunner.query(`DROP TABLE "chamber_turn"`);
    await queryRunner.query(`DROP TABLE "hospital"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_883c738cdc6fe00fa520d3d2e2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1d505814fed8c6bcd3c78e3f7e"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_staff"`);
    await queryRunner.query(
      `DROP TYPE "public"."doctor_staff_createdbytype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "speciality"`);
    await queryRunner.query(
      `DROP TYPE "public"."speciality_prescriptiontype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "district"`);
    await queryRunner.query(`DROP TABLE "division"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b6676e79d75c2678d789786f3"`,
    );
    await queryRunner.query(`DROP TABLE "appointment_status_log"`);
    await queryRunner.query(
      `DROP TYPE "public"."appointment_status_log_actortype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."appointment_status_log_tostatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."appointment_status_log_fromstatus_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f4a64072bf3931b136428d4d62"`,
    );
    await queryRunner.query(`DROP TABLE "admin_user"`);
    await queryRunner.query(`DROP TYPE "public"."admin_user_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8125b16499863bfd699ba62c10"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5b22bb1104534a308b9e08f27"`,
    );
    await queryRunner.query(`DROP TABLE "user_account"`);
    await queryRunner.query(`DROP TYPE "public"."user_account_type_enum"`);
  }
}
