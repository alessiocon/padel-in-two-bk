/*
  Warnings:

  - The values [nothing] on the enum `match_propose` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "booking_status" ADD VALUE 'end';

-- AlterEnum
BEGIN;
CREATE TYPE "match_propose_new" AS ENUM ('pending', 'accepted', 'declined');
ALTER TABLE "public"."booking_matches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "booking_matches" ALTER COLUMN "status" TYPE "match_propose_new" USING ("status"::text::"match_propose_new");
ALTER TYPE "match_propose" RENAME TO "match_propose_old";
ALTER TYPE "match_propose_new" RENAME TO "match_propose";
DROP TYPE "public"."match_propose_old";
ALTER TABLE "booking_matches" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;
