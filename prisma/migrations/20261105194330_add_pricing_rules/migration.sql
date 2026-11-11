-- CreateEnum
CREATE TYPE "pricing_rule_price_mode" AS ENUM ('multiplier', 'fixed_slot_price');

-- CreateEnum
CREATE TYPE "pricing_rule_scope" AS ENUM ('all_courts', 'selected_courts');

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "scope" "pricing_rule_scope" NOT NULL DEFAULT 'all_courts',
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_until" DATE,
    "price_mode" "pricing_rule_price_mode" NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rule_courts" (
    "pricing_rule_id" UUID NOT NULL,
    "court_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,

    CONSTRAINT "pricing_rule_courts_pkey" PRIMARY KEY ("pricing_rule_id","court_id")
);

-- CreateIndex
CREATE INDEX "pricing_rules_club_id_is_active_idx" ON "pricing_rules"("club_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_id_club_id_key" ON "pricing_rules"("id", "club_id");

-- CreateIndex
CREATE INDEX "pricing_rule_courts_club_id_court_id_idx" ON "pricing_rule_courts"("club_id", "court_id");

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rule_courts" ADD CONSTRAINT "pricing_rule_courts_pricing_rule_id_club_id_fkey" FOREIGN KEY ("pricing_rule_id", "club_id") REFERENCES "pricing_rules"("id", "club_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rule_courts" ADD CONSTRAINT "pricing_rule_courts_court_id_club_id_fkey" FOREIGN KEY ("court_id", "club_id") REFERENCES "courts"("id", "club_id") ON DELETE CASCADE ON UPDATE CASCADE;
