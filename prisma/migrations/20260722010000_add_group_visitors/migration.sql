-- CreateTable
CREATE TABLE "Visitor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "gender" "Gender",
    "birthDate" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "societyId" INTEGER,
    "category" TEXT,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorAttendance" (
    "id" SERIAL NOT NULL,
    "visitorId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VisitorAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visitor_societyId_idx" ON "Visitor"("societyId");

-- CreateIndex
CREATE INDEX "Visitor_category_idx" ON "Visitor"("category");

-- CreateIndex
CREATE INDEX "VisitorAttendance_eventId_idx" ON "VisitorAttendance"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorAttendance_visitorId_eventId_key" ON "VisitorAttendance"("visitorId", "eventId");

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorAttendance" ADD CONSTRAINT "VisitorAttendance_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorAttendance" ADD CONSTRAINT "VisitorAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
