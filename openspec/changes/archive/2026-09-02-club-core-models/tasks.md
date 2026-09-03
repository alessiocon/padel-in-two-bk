## 1. Schema foundation

- [x] 1.1 Define the Prisma model for `Club` and verify it includes tenant identity, status, and audit metadata
- [x] 1.2 Define the Prisma model for `Court` and verify each court has a single `clubId` foreign key and a status enum
- [x] 1.3 Define the calendar projection model and verify it is scoped by club and computed from court availability rather than acting as the source of truth

## 2. Data constraints and integrity

- [x] 2.1 Add enum values for court states (`available`, `reserved`, `maintenance`, `inactive`) and verify the values match the domain rules
- [x] 2.2 Enforce `clubId` relationships and uniqueness constraints and verify the migration rejects orphaned or cross-club data
- [x] 2.3 Add validation rules for bookability and verify a time window is marked bookable only when at least one court is available

## 3. Verification and review

- [x] 3.1 Run the Prisma migration and verify the schema is created without errors
- [x] 3.2 Execute a focused regression test set covering club isolation, court association, and zero-availability windows
- [x] 3.3 Review the generated schema against the club domain spec and confirm no user, booking, or payment tables are introduced in this phase
