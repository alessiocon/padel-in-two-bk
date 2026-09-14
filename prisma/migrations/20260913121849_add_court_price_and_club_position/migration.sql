/*
  Warnings:

  - You are about to drop the column `slot_price` on the `clubs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clubs" DROP COLUMN "slot_price",
ADD COLUMN     "position" VARCHAR(150) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "courts" ADD COLUMN     "slot_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
