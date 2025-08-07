/*
  Warnings:

  - You are about to drop the column `phone` on the `Parent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Parent" DROP COLUMN "phone",
ADD COLUMN     "phoneNumber" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationSettings" (
    "id" TEXT NOT NULL,
    "attendanceAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "gradeAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "disciplineAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "absenceThreshold" INTEGER NOT NULL DEFAULT 1,
    "tardyThreshold" INTEGER NOT NULL DEFAULT 3,
    "gradeThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "sendTime" TEXT NOT NULL DEFAULT '08:00',
    "notifyOnWeekends" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_studentId_idx" ON "public"."NotificationLog"("studentId");

-- CreateIndex
CREATE INDEX "NotificationLog_type_idx" ON "public"."NotificationLog"("type");

-- CreateIndex
CREATE INDEX "NotificationLog_sentAt_idx" ON "public"."NotificationLog"("sentAt");
