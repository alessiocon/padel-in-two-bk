/*
  Warnings:

  - Added the required column `propose_number` to the `booking_matches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "match_propose" AS ENUM ('pending', 'accepted', 'declined', 'nothing');

-- AlterTable
ALTER TABLE "booking_matches" ADD COLUMN     "propose_by_team_id" UUID,
ADD COLUMN     "propose_number" INTEGER NOT NULL,
ADD COLUMN     "status" "match_propose" NOT NULL DEFAULT 'pending';

-- AddForeignKey
ALTER TABLE "booking_matches" ADD CONSTRAINT "booking_matches_propose_by_team_id_fkey" FOREIGN KEY ("propose_by_team_id") REFERENCES "booking_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
