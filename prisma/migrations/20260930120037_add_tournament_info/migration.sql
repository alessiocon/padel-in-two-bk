/*
  Warnings:

  - Added the required column `award` to the `tournaments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipality` to the `tournaments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "award" VARCHAR(150) NOT NULL,
ADD COLUMN     "municipality" VARCHAR(32) NOT NULL,
ADD COLUMN     "province" VARCHAR(32) NOT NULL,
ALTER COLUMN "position" DROP DEFAULT;
