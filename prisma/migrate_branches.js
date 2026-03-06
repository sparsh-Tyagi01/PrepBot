/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await c.connect();
  console.log("Connected");

  await c.query(
    'CREATE TABLE IF NOT EXISTS "Branch" (' +
    '  id TEXT NOT NULL PRIMARY KEY,' +
    '  "institutionId" TEXT NOT NULL,' +
    '  name TEXT NOT NULL,' +
    '  code TEXT NOT NULL UNIQUE,' +
    '  description TEXT,' +
    '  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  CONSTRAINT "Branch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"(id) ON DELETE CASCADE' +
    ")"
  );
  console.log("Branch table OK");

  await c.query('CREATE INDEX IF NOT EXISTS "Branch_institutionId_idx" ON "Branch"("institutionId")');

  await c.query(
    'CREATE TABLE IF NOT EXISTS "BranchSection" (' +
    '  id TEXT NOT NULL PRIMARY KEY,' +
    '  "branchId" TEXT NOT NULL,' +
    '  name TEXT NOT NULL,' +
    '  code TEXT NOT NULL UNIQUE,' +
    '  description TEXT,' +
    '  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  CONSTRAINT "BranchSection_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE CASCADE' +
    ")"
  );
  console.log("BranchSection table OK");

  await c.query('CREATE INDEX IF NOT EXISTS "BranchSection_branchId_idx" ON "BranchSection"("branchId")');

  // User: drop old text columns, add FK columns
  await c.query('ALTER TABLE "User" DROP COLUMN IF EXISTS "branch"');
  await c.query('ALTER TABLE "User" DROP COLUMN IF EXISTS "section"');
  await c.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchId" TEXT');
  await c.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sectionId" TEXT');
  try { await c.query('ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE SET NULL'); } catch (e) { console.log("User branchId fkey:", e.message.split("\n")[0]); }
  try { await c.query('ALTER TABLE "User" ADD CONSTRAINT "User_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BranchSection"(id) ON DELETE SET NULL'); } catch (e) { console.log("User sectionId fkey:", e.message.split("\n")[0]); }
  await c.query('CREATE INDEX IF NOT EXISTS "User_branchId_idx" ON "User"("branchId")');
  await c.query('CREATE INDEX IF NOT EXISTS "User_sectionId_idx" ON "User"("sectionId")');
  console.log("User columns OK");

  // InterviewType: add branchId/sectionId
  await c.query('ALTER TABLE "InterviewType" ADD COLUMN IF NOT EXISTS "branchId" TEXT');
  await c.query('ALTER TABLE "InterviewType" ADD COLUMN IF NOT EXISTS "sectionId" TEXT');
  try { await c.query('ALTER TABLE "InterviewType" ADD CONSTRAINT "InterviewType_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE CASCADE'); } catch (e) { console.log("IT branchId fkey:", e.message.split("\n")[0]); }
  try { await c.query('ALTER TABLE "InterviewType" ADD CONSTRAINT "InterviewType_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BranchSection"(id) ON DELETE CASCADE'); } catch (e) { console.log("IT sectionId fkey:", e.message.split("\n")[0]); }
  await c.query('CREATE INDEX IF NOT EXISTS "InterviewType_branchId_idx" ON "InterviewType"("branchId")');
  await c.query('CREATE INDEX IF NOT EXISTS "InterviewType_sectionId_idx" ON "InterviewType"("sectionId")');
  console.log("InterviewType columns OK");

  // QuestionBank: add branchId/sectionId
  await c.query('ALTER TABLE "QuestionBank" ADD COLUMN IF NOT EXISTS "branchId" TEXT');
  await c.query('ALTER TABLE "QuestionBank" ADD COLUMN IF NOT EXISTS "sectionId" TEXT');
  try { await c.query('ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE CASCADE'); } catch (e) { console.log("QB branchId fkey:", e.message.split("\n")[0]); }
  try { await c.query('ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BranchSection"(id) ON DELETE CASCADE'); } catch (e) { console.log("QB sectionId fkey:", e.message.split("\n")[0]); }
  await c.query('CREATE INDEX IF NOT EXISTS "QuestionBank_branchId_idx" ON "QuestionBank"("branchId")');
  await c.query('CREATE INDEX IF NOT EXISTS "QuestionBank_sectionId_idx" ON "QuestionBank"("sectionId")');
  console.log("QuestionBank columns OK");

  await c.end();
  console.log("ALL DONE");
}

run().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
