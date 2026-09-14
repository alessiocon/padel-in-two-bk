-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "slot_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "courts" ADD COLUMN     "is_indoor" BOOLEAN NOT NULL DEFAULT false;
