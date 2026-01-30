-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MembroToSubject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_MembroToSubject_AB_unique" ON "_MembroToSubject"("A", "B");

-- CreateIndex
CREATE INDEX "_MembroToSubject_B_index" ON "_MembroToSubject"("B");

-- AddForeignKey
ALTER TABLE "_MembroToSubject" ADD CONSTRAINT "_MembroToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "Membro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MembroToSubject" ADD CONSTRAINT "_MembroToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
