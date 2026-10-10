-- CreateEnum
CREATE TYPE "BookingPlayerStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REMOVED');

-- AlterTable
ALTER TABLE "booking_players" ADD COLUMN     "status" "BookingPlayerStatus" NOT NULL DEFAULT 'PENDING';
