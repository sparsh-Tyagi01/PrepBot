-- Baseline migration: captures all schema changes applied via `prisma db push`
-- that were not recorded in migration history.
-- This migration should be marked as already applied.

-- CreateTable: Branch
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BranchSection
CREATE TABLE "BranchSection" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchSection_pkey" PRIMARY KEY ("id")
);

-- AlterTable: User — replace old plain-text branch/section with FK columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "branch";
ALTER TABLE "User" DROP COLUMN IF EXISTS "section";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

-- AlterTable: InterviewType — add branchId / sectionId FK columns
ALTER TABLE "InterviewType" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "InterviewType" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

-- AlterTable: QuestionBank — add branchId / sectionId FK columns
ALTER TABLE "QuestionBank" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "QuestionBank" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Branch_code_key" ON "Branch"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "BranchSection_code_key" ON "BranchSection"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Branch_institutionId_idx" ON "Branch"("institutionId");
CREATE INDEX IF NOT EXISTS "BranchSection_branchId_idx" ON "BranchSection"("branchId");
CREATE INDEX IF NOT EXISTS "User_branchId_idx" ON "User"("branchId");
CREATE INDEX IF NOT EXISTS "User_sectionId_idx" ON "User"("sectionId");
CREATE INDEX IF NOT EXISTS "InterviewType_branchId_idx" ON "InterviewType"("branchId");
CREATE INDEX IF NOT EXISTS "InterviewType_sectionId_idx" ON "InterviewType"("sectionId");
CREATE INDEX IF NOT EXISTS "QuestionBank_branchId_idx" ON "QuestionBank"("branchId");
CREATE INDEX IF NOT EXISTS "QuestionBank_sectionId_idx" ON "QuestionBank"("sectionId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchSection" ADD CONSTRAINT "BranchSection_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BranchSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewType" ADD CONSTRAINT "InterviewType_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewType" ADD CONSTRAINT "InterviewType_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BranchSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BranchSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
