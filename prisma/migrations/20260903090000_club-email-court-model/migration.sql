ALTER TABLE "clubs" ADD COLUMN "email" VARCHAR(320);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "clubs" WHERE "email" IS NULL) THEN
        RAISE EXCEPTION 'Cannot add required club email: null emails exist';
    END IF;
END $$;

ALTER TABLE "clubs" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX "clubs_email_key" ON "clubs"("email");

ALTER TABLE "courts" DROP COLUMN "createdAt";
ALTER TABLE "courts" DROP COLUMN "updatedAt";
