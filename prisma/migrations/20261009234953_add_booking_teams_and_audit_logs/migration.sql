/*
  Warnings:

  - You are about to drop the column `user_id` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `created_by_user_id` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "booking_event_type" AS ENUM ('CREATED', 'PLAYER_JOINED', 'PLAYER_LEFT', 'STATUS_CHANGED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_user_id_fkey";

-- DropIndex
DROP INDEX "bookings_user_id_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "user_id",
ADD COLUMN     "created_by_user_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "booking_teams" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "team_number" INTEGER NOT NULL,
    "team_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "booking_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_players" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "user_id" UUID,
    "first_name" VARCHAR(24),
    "last_name" VARCHAR(24),
    "phone" VARCHAR(30),

    CONSTRAINT "booking_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_audit_logs" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" "booking_event_type" NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_teams_booking_id_idx" ON "booking_teams"("booking_id");

-- CreateIndex
CREATE INDEX "booking_players_user_id_idx" ON "booking_players"("user_id");

-- CreateIndex
CREATE INDEX "booking_audit_logs_booking_id_idx" ON "booking_audit_logs"("booking_id");

-- CreateIndex
CREATE INDEX "booking_audit_logs_user_id_idx" ON "booking_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "bookings_created_by_user_id_idx" ON "bookings"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_teams" ADD CONSTRAINT "booking_teams_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_players" ADD CONSTRAINT "booking_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "booking_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_players" ADD CONSTRAINT "booking_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_audit_logs" ADD CONSTRAINT "booking_audit_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_audit_logs" ADD CONSTRAINT "booking_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
