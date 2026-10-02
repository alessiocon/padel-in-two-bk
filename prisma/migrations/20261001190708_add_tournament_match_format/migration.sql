-- CreateEnum
CREATE TYPE "match_format" AS ENUM ('single_set', 'best_of_3');

-- AlterTable
ALTER TABLE "tournament_matches" ADD COLUMN     "format" "match_format" NOT NULL DEFAULT 'single_set';
