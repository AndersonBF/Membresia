-- AlterTable
ALTER TABLE "ChurchSettings" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "ChurchSettings" ADD COLUMN "slug" TEXT;

-- CreateTable
CREATE TABLE "VisitorContact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorContact_createdAt_idx" ON "VisitorContact"("createdAt");
