-- CreateTable
CREATE TABLE "public"."GradingCategory" (
    "id" TEXT NOT NULL,
    "courseSectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "dropLowest" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GPAScale" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "letterGrade" TEXT NOT NULL,
    "minPercentage" DOUBLE PRECISION NOT NULL,
    "maxPercentage" DOUBLE PRECISION NOT NULL,
    "gradePoints" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GPAScale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradingCategory_courseSectionId_idx" ON "public"."GradingCategory"("courseSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "GradingCategory_courseSectionId_name_key" ON "public"."GradingCategory"("courseSectionId", "name");

-- CreateIndex
CREATE INDEX "GPAScale_schoolId_idx" ON "public"."GPAScale"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "GPAScale_schoolId_name_letterGrade_key" ON "public"."GPAScale"("schoolId", "name", "letterGrade");

-- AddForeignKey
ALTER TABLE "public"."GradingCategory" ADD CONSTRAINT "GradingCategory_courseSectionId_fkey" FOREIGN KEY ("courseSectionId") REFERENCES "public"."CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GPAScale" ADD CONSTRAINT "GPAScale_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
