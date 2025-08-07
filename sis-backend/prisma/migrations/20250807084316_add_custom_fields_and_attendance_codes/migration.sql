-- CreateTable
CREATE TABLE "public"."CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentCustomField" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "countsAsPresent" BOOLEAN NOT NULL DEFAULT false,
    "countsAsAbsent" BOOLEAN NOT NULL DEFAULT false,
    "countsAsTardy" BOOLEAN NOT NULL DEFAULT false,
    "isExcused" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_name_key" ON "public"."CustomFieldDefinition"("name");

-- CreateIndex
CREATE INDEX "StudentCustomField_studentId_idx" ON "public"."StudentCustomField"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCustomField_studentId_fieldId_key" ON "public"."StudentCustomField"("studentId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceCode_code_key" ON "public"."AttendanceCode"("code");

-- AddForeignKey
ALTER TABLE "public"."StudentCustomField" ADD CONSTRAINT "StudentCustomField_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCustomField" ADD CONSTRAINT "StudentCustomField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."CustomFieldDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
