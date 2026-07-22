-- CreateTable
CREATE TABLE "DiaconateUnavailability" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaconateUnavailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiaconateUnavailability_date_idx" ON "DiaconateUnavailability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DiaconateUnavailability_memberId_date_key" ON "DiaconateUnavailability"("memberId", "date");

-- AddForeignKey
ALTER TABLE "DiaconateUnavailability" ADD CONSTRAINT "DiaconateUnavailability_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
