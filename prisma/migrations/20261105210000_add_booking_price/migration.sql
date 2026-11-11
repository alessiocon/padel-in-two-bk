ALTER TABLE "bookings" ADD COLUMN "price" DECIMAL(10,2);

UPDATE "bookings" AS booking
SET "price" = court."slot_price"
FROM "courts" AS court
WHERE court."id" = booking."court_id"
  AND court."club_id" = booking."club_id";

ALTER TABLE "bookings" ALTER COLUMN "price" SET NOT NULL;