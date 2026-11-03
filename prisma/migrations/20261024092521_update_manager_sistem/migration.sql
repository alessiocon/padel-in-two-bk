/*
  Warnings:

  - You are about to drop the `managers` table. If the table is not empty, all the data it contains will be lost.

*/

BEGIN;
-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('OWNER', 'MANAGER', 'COACH', 'STAFF');

-- CreateTable
CREATE TABLE "club_members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'MANAGER',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "club_members_pkey" PRIMARY KEY ("id")
);

INSERT INTO "club_members" ("id", "user_id", "club_id", "role", "created_at", "updated_at")
SELECT 
    gen_random_uuid(), 
    m."user_id", 
    c."id", 
    'MANAGER'::"ClubRole", 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM "clubs" c
JOIN "managers" m ON c."manager_id" = m."id";

-- DropForeignKey
ALTER TABLE "clubs" DROP CONSTRAINT "clubs_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "managers" DROP CONSTRAINT "managers_user_id_fkey";
ALTER TABLE "clubs" DROP COLUMN "manager_id";

-- DropTable
DROP TABLE "managers";



-- CreateIndex
CREATE INDEX "club_members_user_id_idx" ON "club_members"("user_id");

-- CreateIndex
CREATE INDEX "club_members_club_id_idx" ON "club_members"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_members_user_id_club_id_key" ON "club_members"("user_id", "club_id");

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;