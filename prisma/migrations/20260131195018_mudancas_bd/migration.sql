/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Membro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MembroToSubject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MembroToSubject" DROP CONSTRAINT "_MembroToSubject_A_fkey";

-- DropForeignKey
ALTER TABLE "_MembroToSubject" DROP CONSTRAINT "_MembroToSubject_B_fkey";

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Membro";

-- DropTable
DROP TABLE "Subject";

-- DropTable
DROP TABLE "_MembroToSubject";

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bibleSchoolClassId" INTEGER,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Council" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Council_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diaconate" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Diaconate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberCouncil" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "councilId" INTEGER NOT NULL,

    CONSTRAINT "MemberCouncil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDiaconate" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "diaconateId" INTEGER NOT NULL,

    CONSTRAINT "MemberDiaconate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ministry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ministry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberMinistry" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "ministryId" INTEGER NOT NULL,

    CONSTRAINT "MemberMinistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalSociety" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InternalSociety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberSociety" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "societyId" INTEGER NOT NULL,

    CONSTRAINT "MemberSociety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleSchool" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BibleSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleSchoolClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "bibleSchoolId" INTEGER,

    CONSTRAINT "BibleSchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTeacher" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "societyId" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finance" (
    "id" SERIAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "councilId" INTEGER,
    "societyId" INTEGER,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_username_key" ON "Member"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCouncil_memberId_key" ON "MemberCouncil"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberDiaconate_memberId_key" ON "MemberDiaconate"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberMinistry_memberId_ministryId_key" ON "MemberMinistry"("memberId", "ministryId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSociety_memberId_societyId_key" ON "MemberSociety"("memberId", "societyId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_memberId_classId_key" ON "ClassTeacher"("memberId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Finance_month_year_councilId_key" ON "Finance"("month", "year", "councilId");

-- CreateIndex
CREATE UNIQUE INDEX "Finance_month_year_societyId_key" ON "Finance"("month", "year", "societyId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_bibleSchoolClassId_fkey" FOREIGN KEY ("bibleSchoolClassId") REFERENCES "BibleSchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCouncil" ADD CONSTRAINT "MemberCouncil_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCouncil" ADD CONSTRAINT "MemberCouncil_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "Council"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDiaconate" ADD CONSTRAINT "MemberDiaconate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDiaconate" ADD CONSTRAINT "MemberDiaconate_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMinistry" ADD CONSTRAINT "MemberMinistry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMinistry" ADD CONSTRAINT "MemberMinistry_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSociety" ADD CONSTRAINT "MemberSociety_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSociety" ADD CONSTRAINT "MemberSociety_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleSchoolClass" ADD CONSTRAINT "BibleSchoolClass_bibleSchoolId_fkey" FOREIGN KEY ("bibleSchoolId") REFERENCES "BibleSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "BibleSchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "Council"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE SET NULL ON UPDATE CASCADE;
