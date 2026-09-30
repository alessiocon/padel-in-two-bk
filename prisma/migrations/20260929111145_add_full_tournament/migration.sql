/*
  Warnings:

  - You are about to drop the column `start_date` on the `tournaments` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `tournament_teams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ends_at` to the `tournaments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `starts_at` to the `tournaments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournament_teams" ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "start_date",
ADD COLUMN     "ends_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "position" VARCHAR(150) NOT NULL DEFAULT '',
ADD COLUMN     "starts_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "timezone" VARCHAR(50) NOT NULL DEFAULT 'Europe/Rome',
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;
