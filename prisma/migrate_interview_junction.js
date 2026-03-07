require('dotenv/config');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE "InterviewType" DROP CONSTRAINT IF EXISTS "InterviewType_branchId_fkey"`);
    await client.query(`ALTER TABLE "InterviewType" DROP CONSTRAINT IF EXISTS "InterviewType_sectionId_fkey"`);
    await client.query(`DROP INDEX IF EXISTS "InterviewType_branchId_idx"`);
    await client.query(`DROP INDEX IF EXISTS "InterviewType_sectionId_idx"`);
    await client.query(`ALTER TABLE "InterviewType" DROP COLUMN IF EXISTS "branchId"`);
    await client.query(`ALTER TABLE "InterviewType" DROP COLUMN IF EXISTS "sectionId"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "InterviewTypeBranch" (
        "interviewTypeId" TEXT NOT NULL,
        "branchId" TEXT NOT NULL,
        CONSTRAINT "InterviewTypeBranch_pkey" PRIMARY KEY ("interviewTypeId", "branchId")
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "InterviewTypeSection" (
        "interviewTypeId" TEXT NOT NULL,
        "sectionId" TEXT NOT NULL,
        CONSTRAINT "InterviewTypeSection_pkey" PRIMARY KEY ("interviewTypeId", "sectionId")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "InterviewTypeBranch_branchId_idx" ON "InterviewTypeBranch"("branchId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "InterviewTypeSection_sectionId_idx" ON "InterviewTypeSection"("sectionId")`);
    await client.query(`ALTER TABLE "InterviewTypeBranch" DROP CONSTRAINT IF EXISTS "InterviewTypeBranch_interviewTypeId_fkey"`);
    await client.query(`ALTER TABLE "InterviewTypeBranch" ADD CONSTRAINT "InterviewTypeBranch_interviewTypeId_fkey" FOREIGN KEY ("interviewTypeId") REFERENCES "InterviewType"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await client.query(`ALTER TABLE "InterviewTypeBranch" DROP CONSTRAINT IF EXISTS "InterviewTypeBranch_branchId_fkey"`);
    await client.query(`ALTER TABLE "InterviewTypeBranch" ADD CONSTRAINT "InterviewTypeBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await client.query(`ALTER TABLE "InterviewTypeSection" DROP CONSTRAINT IF EXISTS "InterviewTypeSection_interviewTypeId_fkey"`);
    await client.query(`ALTER TABLE "InterviewTypeSection" ADD CONSTRAINT "InterviewTypeSection_interviewTypeId_fkey" FOREIGN KEY ("interviewTypeId") REFERENCES "InterviewType"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await client.query(`ALTER TABLE "InterviewTypeSection" DROP CONSTRAINT IF EXISTS "InterviewTypeSection_sectionId_fkey"`);
    await client.query(`ALTER TABLE "InterviewTypeSection" ADD CONSTRAINT "InterviewTypeSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BranchSection"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    console.log('DB migration applied successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
