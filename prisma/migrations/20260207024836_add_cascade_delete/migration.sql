-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_memberId_fkey";

-- DropForeignKey
ALTER TABLE "ClassTeacher" DROP CONSTRAINT "ClassTeacher_classId_fkey";

-- DropForeignKey
ALTER TABLE "ClassTeacher" DROP CONSTRAINT "ClassTeacher_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_bibleSchoolClassId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_councilId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_diaconateId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_ministryId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_societyId_fkey";

-- DropForeignKey
ALTER TABLE "MemberCouncil" DROP CONSTRAINT "MemberCouncil_councilId_fkey";

-- DropForeignKey
ALTER TABLE "MemberCouncil" DROP CONSTRAINT "MemberCouncil_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberDiaconate" DROP CONSTRAINT "MemberDiaconate_diaconateId_fkey";

-- DropForeignKey
ALTER TABLE "MemberDiaconate" DROP CONSTRAINT "MemberDiaconate_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberMinistry" DROP CONSTRAINT "MemberMinistry_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberMinistry" DROP CONSTRAINT "MemberMinistry_ministryId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSociety" DROP CONSTRAINT "MemberSociety_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSociety" DROP CONSTRAINT "MemberSociety_societyId_fkey";

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
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "BibleSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
