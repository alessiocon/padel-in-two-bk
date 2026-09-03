DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "clubs" AS club
        WHERE NOT EXISTS (
            SELECT 1 FROM "courts" AS court WHERE court."clubId" = club."id"
        )
    ) THEN
        RAISE EXCEPTION 'Cannot apply club-court invariant: orphan clubs exist';
    END IF;
END $$;