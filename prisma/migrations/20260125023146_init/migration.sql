/*
  Warnings:

  - Changed the type of `sexo` on the `Membro` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Membro" DROP COLUMN "sexo",
ADD COLUMN     "sexo" TEXT NOT NULL;

-- DropEnum
DROP TYPE "UserSex";
