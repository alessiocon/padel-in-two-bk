/*
  Warnings:

  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "booking_event_type" ADD VALUE 'INSERT';
ALTER TYPE "booking_event_type" ADD VALUE 'REMOVED';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
