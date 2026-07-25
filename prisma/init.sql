-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO');

-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('BOM', 'REGULAR', 'RUIM');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('DOMINGO', 'EVENTO');

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileImageUrl" TEXT,
    "bibleSchoolClassId" INTEGER,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Council" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Council_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diaconate" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Diaconate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberCouncil" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "councilId" INTEGER NOT NULL,
    "cargo" TEXT,

    CONSTRAINT "MemberCouncil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDiaconate" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "diaconateId" INTEGER NOT NULL,
    "cargo" TEXT,

    CONSTRAINT "MemberDiaconate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ministry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ministry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberMinistry" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "ministryId" INTEGER NOT NULL,

    CONSTRAINT "MemberMinistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalSociety" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InternalSociety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberSociety" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "societyId" INTEGER NOT NULL,
    "cargo" TEXT,
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberSociety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleSchool" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BibleSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleSchoolClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "bibleSchoolId" INTEGER,

    CONSTRAINT "BibleSchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleSchoolLesson" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BibleSchoolLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleSchoolAttendance" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BibleSchoolAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTeacher" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "requiresAttendance" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "societyId" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "VisitorAttendance" (
    "id" SERIAL NOT NULL,
    "visitorId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VisitorAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finance" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "councilId" INTEGER,
    "societyId" INTEGER,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "societyId" INTEGER,
    "councilId" INTEGER,
    "diaconateId" INTEGER,
    "ministryId" INTEGER,
    "bibleSchoolClassId" INTEGER,
    "bibleSchoolGeneral" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "societyId" INTEGER NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastReaction" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "broadcastId" INTEGER NOT NULL,

    CONSTRAINT "BroadcastReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryAlbum" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "societyId" INTEGER,
    "councilId" INTEGER,
    "diaconateId" INTEGER,
    "ministryId" INTEGER,
    "bibleSchoolClassId" INTEGER,

    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "albumId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaconateTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIA',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDENTE',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diaconateId" INTEGER NOT NULL,

    CONSTRAINT "DiaconateTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaconateInventory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "condition" "ItemCondition" NOT NULL DEFAULT 'BOM',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diaconateId" INTEGER NOT NULL,

    CONSTRAINT "DiaconateInventory_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "DiaconateUnavailability" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaconateUnavailability_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "GroupCover" (
    "role" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupCover_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" SERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "roles" TEXT[],
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sermon" (
    "id" SERIAL NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passage" TEXT,
    "content" TEXT,
    "blocks" JSONB,
    "date" TIMESTAMP(3),
    "series" TEXT,
    "tags" TEXT[],
    "preachedAt" TIMESTAMP(3)[],
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sermon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorDiaryEntry" (
    "id" SERIAL NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastorDiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurchSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "churchName" TEXT,
    "youtubeChannelUrl" TEXT,
    "pastor" TEXT,
    "founded" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "about" TEXT,
    "photoUrl" TEXT,
    "mapsUrl" TEXT,
    "pastorCoverUrl" TEXT,
    "whatsapp" TEXT,
    "slug" TEXT,
    "preferences" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" SERIAL NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'ebd',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "urgencia" "TaskPriority" NOT NULL DEFAULT 'MEDIA',
    "neededBy" TIMESTAMP(3),
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrcamentoItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "link" TEXT,
    "imageUrl" TEXT,
    "orcamentoId" INTEGER NOT NULL,

    CONSTRAINT "OrcamentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_username_key" ON "Member"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCouncil_memberId_key" ON "MemberCouncil"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberDiaconate_memberId_key" ON "MemberDiaconate"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberMinistry_memberId_ministryId_key" ON "MemberMinistry"("memberId", "ministryId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSociety_memberId_societyId_key" ON "MemberSociety"("memberId", "societyId");

-- CreateIndex
CREATE INDEX "BibleSchoolLesson_classId_date_idx" ON "BibleSchoolLesson"("classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BibleSchoolLesson_classId_date_key" ON "BibleSchoolLesson"("classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BibleSchoolAttendance_lessonId_memberId_key" ON "BibleSchoolAttendance"("lessonId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_memberId_classId_key" ON "ClassTeacher"("memberId", "classId");

-- CreateIndex
CREATE INDEX "Visitor_societyId_idx" ON "Visitor"("societyId");

-- CreateIndex
CREATE INDEX "Visitor_category_idx" ON "Visitor"("category");

-- CreateIndex
CREATE INDEX "SheetNameAlias_memberId_idx" ON "SheetNameAlias"("memberId");

-- CreateIndex
CREATE INDEX "SheetNameAlias_visitorId_idx" ON "SheetNameAlias"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetNameAlias_role_normalized_key" ON "SheetNameAlias"("role", "normalized");

-- CreateIndex
CREATE INDEX "VisitorAttendance_eventId_idx" ON "VisitorAttendance"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorAttendance_visitorId_eventId_key" ON "VisitorAttendance"("visitorId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastReaction_broadcastId_userId_emoji_key" ON "BroadcastReaction"("broadcastId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "DiaconateSchedule_diaconateId_date_idx" ON "DiaconateSchedule"("diaconateId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DiaconateScheduleMember_scheduleId_memberId_key" ON "DiaconateScheduleMember"("scheduleId", "memberId");

-- CreateIndex
CREATE INDEX "DiaconateUnavailability_date_idx" ON "DiaconateUnavailability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DiaconateUnavailability_memberId_date_key" ON "DiaconateUnavailability"("memberId", "date");

-- CreateIndex
CREATE INDEX "VisitorContact_createdAt_idx" ON "VisitorContact"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_event_createdAt_idx" ON "AccessLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_userId_createdAt_idx" ON "AccessLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Sermon_authorId_updatedAt_idx" ON "Sermon"("authorId", "updatedAt");

-- CreateIndex
CREATE INDEX "PastorDiaryEntry_authorId_date_idx" ON "PastorDiaryEntry"("authorId", "date");

-- CreateIndex
CREATE INDEX "Orcamento_context_idx" ON "Orcamento"("context");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_bibleSchoolClassId_fkey" FOREIGN KEY ("bibleSchoolClassId") REFERENCES "BibleSchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCouncil" ADD CONSTRAINT "MemberCouncil_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCouncil" ADD CONSTRAINT "MemberCouncil_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "Council"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDiaconate" ADD CONSTRAINT "MemberDiaconate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDiaconate" ADD CONSTRAINT "MemberDiaconate_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMinistry" ADD CONSTRAINT "MemberMinistry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMinistry" ADD CONSTRAINT "MemberMinistry_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSociety" ADD CONSTRAINT "MemberSociety_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSociety" ADD CONSTRAINT "MemberSociety_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleSchoolClass" ADD CONSTRAINT "BibleSchoolClass_bibleSchoolId_fkey" FOREIGN KEY ("bibleSchoolId") REFERENCES "BibleSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleSchoolLesson" ADD CONSTRAINT "BibleSchoolLesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "BibleSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleSchoolAttendance" ADD CONSTRAINT "BibleSchoolAttendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "BibleSchoolLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleSchoolAttendance" ADD CONSTRAINT "BibleSchoolAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "BibleSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetNameAlias" ADD CONSTRAINT "SheetNameAlias_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetNameAlias" ADD CONSTRAINT "SheetNameAlias_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorAttendance" ADD CONSTRAINT "VisitorAttendance_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorAttendance" ADD CONSTRAINT "VisitorAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "Council"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "Council"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_bibleSchoolClassId_fkey" FOREIGN KEY ("bibleSchoolClassId") REFERENCES "BibleSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastReaction" ADD CONSTRAINT "BroadcastReaction_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "InternalSociety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "Council"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_bibleSchoolClassId_fkey" FOREIGN KEY ("bibleSchoolClassId") REFERENCES "BibleSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateTask" ADD CONSTRAINT "DiaconateTask_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateInventory" ADD CONSTRAINT "DiaconateInventory_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateSchedule" ADD CONSTRAINT "DiaconateSchedule_diaconateId_fkey" FOREIGN KEY ("diaconateId") REFERENCES "Diaconate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateScheduleMember" ADD CONSTRAINT "DiaconateScheduleMember_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DiaconateSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateScheduleMember" ADD CONSTRAINT "DiaconateScheduleMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaconateUnavailability" ADD CONSTRAINT "DiaconateUnavailability_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoItem" ADD CONSTRAINT "OrcamentoItem_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

