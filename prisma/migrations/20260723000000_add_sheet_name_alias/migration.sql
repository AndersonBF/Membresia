-- CreateTable
CREATE TABLE "SheetNameAlias" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "readName" TEXT NOT NULL,
    "memberId" INTEGER,
    "visitorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "SheetNameAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SheetNameAlias_memberId_idx" ON "SheetNameAlias"("memberId");

-- CreateIndex
CREATE INDEX "SheetNameAlias_visitorId_idx" ON "SheetNameAlias"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetNameAlias_role_normalized_key" ON "SheetNameAlias"("role", "normalized");

-- AddForeignKey
ALTER TABLE "SheetNameAlias" ADD CONSTRAINT "SheetNameAlias_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetNameAlias" ADD CONSTRAINT "SheetNameAlias_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
