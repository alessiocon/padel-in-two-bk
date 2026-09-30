-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "is_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_teams" BOOLEAN NOT NULL DEFAULT false;
