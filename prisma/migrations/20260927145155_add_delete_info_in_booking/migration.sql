-- CreateEnum
CREATE TYPE "BookingCancBy" AS ENUM ('user', 'club');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancellation_reason" VARCHAR(255),
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" "BookingCancBy",
ADD COLUMN     "cancelled_post_confirm" BOOLEAN;
