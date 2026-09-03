## 1. Database Model and Migration

- [x] 1.1 Add required normalized `email` to `Club` in Prisma with a unique constraint and remove `createdAt`/`updatedAt` from `Court`; verify `prisma validate` succeeds
- [x] 1.2 Add a migration that audits or backfills existing club emails before enforcing `NOT NULL` and `UNIQUE`, and removes Court timestamp columns; verify `prisma migrate deploy` succeeds without unresolved null or duplicate emails
- [x] 1.3 Regenerate the Prisma client and verify Club email is required and Court no longer exposes timestamp fields

## 2. Domain and Repository Contracts

- [x] 2.1 Add required email to the Club domain, normalize it, validate its format, preserve the existing court invariant, and remove Court timestamps from domain representations; verify unit tests cover valid, invalid, normalized, and missing emails
- [x] 2.2 Rename `ClubRepository` to `IClubRepository` and `BookingRepository` to `IBookingRepository`, updating all implementations, imports, fakes, and tests; verify `npm run build` has no stale contract references
- [x] 2.3 Update Prisma mappings and conflict translation for normalized unique club emails; verify repository tests cover duplicate email conflicts and Court persistence without timestamps

## 3. Nest Dependency Injection

- [x] 3.1 Add `@Injectable()` to all club use cases and inject `IClubRepository` with `@Inject(CLUB_REPOSITORY)`; verify unit tests instantiate the use cases through their explicit dependency contract
- [x] 3.2 Remove the generic use-case factory from `ClubsModule` and register club use cases directly while preserving exports and runtime behavior; verify the Nest testing module compiles
- [x] 3.3 Document the explicit `@Inject(TOKEN)` convention for future use cases and confirm booking use cases retain the same style

## 4. REST API and Documentation

- [x] 4.1 Make `email` required and validated in `POST /clubs`, allow the agreed update behavior in `PATCH /clubs/:id`, and add Swagger metadata; verify invalid emails return `400` and duplicate emails return `409`
- [x] 4.2 Include normalized email in Club responses and remove Court timestamp fields from any API representations; verify controller and OpenAPI tests match the new contracts
- [x] 4.3 Update README/API examples and record the frontend onboarding requirement to provide a unique club email; verify examples match DTOs and Swagger

## 5. Validation

- [x] 5.1 Run focused domain, repository, controller, and PostgreSQL integration tests with the required database environment; verify email uniqueness and Court timestamp removal end to end
- [x] 5.2 Run `npm run build`, `npm run lint`, `npm run test`, and `openspec validate --all --strict`; verify no new errors remain
