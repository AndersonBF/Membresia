-- CreateTable
CREATE TABLE "BibleSchoolLesson" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BibleSchoolLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleSchoolAttendance" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BibleSchoolAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BibleSchoolLesson_classId_date_idx" ON "BibleSchoolLesson"("classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BibleSchoolLesson_classId_date_key" ON "BibleSchoolLesson"("classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BibleSchoolAttendance_lessonId_memberId_key" ON "BibleSchoolAttendance"("lessonId", "memberId");

-- AddForeignKey
ALTER TABLE "BibleSchoolLesson" ADD CONSTRAINT "BibleSchoolLesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "BibleSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleSchoolAttendance" ADD CONSTRAINT "BibleSchoolAttendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "BibleSchoolLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleSchoolAttendance" ADD CONSTRAINT "BibleSchoolAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
