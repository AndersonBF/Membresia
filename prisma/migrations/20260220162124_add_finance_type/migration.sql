-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('ENTRADA', 'SAIDA');

-- AlterTable
ALTER TABLE "Finance" 
  ADD COLUMN "description" TEXT NOT NULL DEFAULT 'Lançamento anterior',
  ADD COLUMN "type" "FinanceType" NOT NULL DEFAULT 'ENTRADA',
  ADD COLUMN "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Remove defaults para forçar valores nos novos registros
ALTER TABLE "Finance" ALTER COLUMN "description" DROP DEFAULT;
ALTER TABLE "Finance" ALTER COLUMN "type" DROP DEFAULT;