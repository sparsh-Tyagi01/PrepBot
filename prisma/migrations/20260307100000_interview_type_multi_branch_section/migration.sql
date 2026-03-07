-- Drop old single-FK columns on InterviewType (replaced by junction tables)
ALTER TABLE "InterviewType" DROP CONSTRAINT IF EXISTS "InterviewType_branchId_fkey";
ALTER TABLE "InterviewType" DROP CONSTRAINT IF EXISTS "InterviewType_sectionId_fkey";
DROP INDEX IF EXISTS "InterviewType_branchId_idx";
DROP INDEX IF EXISTS "InterviewType_sectionId_idx";
ALTER TABLE "InterviewType" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "InterviewType" DROP COLUMN IF EXISTS "sectionId";

-- CreateTable: InterviewTypeBranch (many-to-many junction)
CREATE TABLE "InterviewTypeBranch" (
    "interviewTypeId" TEXT NOT NULL,
    "branchId"        TEXT NOT NULL,

    CONSTRAINT "InterviewTypeBranch_pkey" PRIMARY KEY ("interviewTypeId", "branchId")
);

-- CreateTable: InterviewTypeSection (many-to-many junction)
CREATE TABLE "InterviewTypeSection" (
    "interviewTypeId" TEXT NOT NULL,
    "sectionId"       TEXT NOT NULL,

    CONSTRAINT "InterviewTypeSection_pkey" PRIMARY KEY ("interviewTypeId", "sectionId")
);

-- CreateIndex
CREATE INDEX "InterviewTypeBranch_branchId_idx"   ON "InterviewTypeBranch"("branchId");
CREATE INDEX "InterviewTypeSection_sectionId_idx" ON "InterviewTypeSection"("sectionId");

-- AddForeignKey
ALTER TABLE "InterviewTypeBranch" ADD CONSTRAINT "InterviewTypeBranch_interviewTypeId_fkey"
    FOREIGN KEY ("interviewTypeId") REFERENCES "InterviewType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterviewTypeBranch" ADD CONSTRAINT "InterviewTypeBranch_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterviewTypeSection" ADD CONSTRAINT "InterviewTypeSection_interviewTypeId_fkey"
    FOREIGN KEY ("interviewTypeId") REFERENCES "InterviewType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterviewTypeSection" ADD CONSTRAINT "InterviewTypeSection_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "BranchSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
