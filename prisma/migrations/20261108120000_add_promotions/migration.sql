CREATE TYPE "promotion_type" AS ENUM ('accumulate_points');

ALTER TABLE "clubs" ADD COLUMN "promotions" "promotion_type"[] DEFAULT ARRAY[]::"promotion_type"[];
ALTER TABLE "bookings" ADD COLUMN "eligible_promotions" "promotion_type"[] DEFAULT ARRAY[]::"promotion_type"[];

CREATE TABLE "promotion_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "promotion" "promotion_type" NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "available_points" INTEGER NOT NULL DEFAULT 0,
    "redeemed_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "promotion_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promotion_accounts_balance_check" CHECK (
      "total_points" >= 0 AND "available_points" >= 0 AND "redeemed_points" >= 0
      AND "total_points" = "available_points" + "redeemed_points"
    )
);

CREATE TABLE "promotion_awards" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "promotion" "promotion_type" NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "promotion_awards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promotion_awards_points_check" CHECK ("points" > 0)
);

CREATE TABLE "promotion_redemptions" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "redeemed_by_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "promotion_redemptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promotion_redemptions_points_check" CHECK ("points" > 0)
);

CREATE UNIQUE INDEX "promotion_accounts_user_id_promotion_key" ON "promotion_accounts"("user_id", "promotion");
CREATE UNIQUE INDEX "promotion_awards_booking_id_promotion_key" ON "promotion_awards"("booking_id", "promotion");
CREATE INDEX "promotion_awards_account_id_created_at_idx" ON "promotion_awards"("account_id", "created_at");
CREATE INDEX "promotion_redemptions_account_id_created_at_idx" ON "promotion_redemptions"("account_id", "created_at");

ALTER TABLE "promotion_accounts" ADD CONSTRAINT "promotion_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_awards" ADD CONSTRAINT "promotion_awards_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "promotion_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_awards" ADD CONSTRAINT "promotion_awards_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "promotion_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_redeemed_by_id_fkey" FOREIGN KEY ("redeemed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;