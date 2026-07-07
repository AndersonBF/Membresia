-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('DOMINGO', 'EVENTO');

-- CreateTable
CREATE TABLE "DiaconateSchedule" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "type" "ScheduleType" NOT NULL DEFAULT 'DOMINGO',
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diaconateId" INTEGER NOT NULL,

    CONSTRAINT "DiaconateSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaconateScheduleMember" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,

    CONSTRAINT "DiaconateScheduleMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiaconateSchedule_diaconateId_date_idx" ON "DiaconateSchedule"("diaconateId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DiaconateScheduleMember_scheduleId_memberId_key" ON "DiaconateScheduleMember"("scheduleId", "memberId");

-- AddForeignKey
ALTER TABLE "DiaconateSchedule" ADD CONSTRAINT "DiaconateSchedule_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateScheduleMember" ADD CONSTRAINT "DiaconateScheduleMember_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DiaconateSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateScheduleMember" ADD CONSTRAINT "DiaconateScheduleMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

