-- CreateTable
CREATE TABLE "GroupCover" (
    "role" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupCover_pkey" PRIMARY KEY ("role")
);
