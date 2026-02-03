-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "gender" "Gender";
