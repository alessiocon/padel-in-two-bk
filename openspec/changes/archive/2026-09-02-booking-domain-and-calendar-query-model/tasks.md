## 1. Database Model and Migration

- [x] 1.1 Replace `CalendarSlot` persistence with `Booking` and its four-state enum in `prisma/schema.prisma`, preserving `CourtStatus.reserved`, and verify `prisma validate` succeeds
- [x] 1.2 Generate or write the PostgreSQL migration that removes `calendar_slots`, creates `bookings`, adds tenant indexes, and applies the active-booking anti-overlap constraint; verify the migration SQL is valid for PostgreSQL
- [x] 1.3 Regenerate the Prisma client and verify the generated types expose `Booking` without `CalendarSlot`

## 2. Booking Domain and Application

- [x] 2.1 Add the Booking value model with `free`, `reserved`, `searching`, and `blocked` states, fixed 60-minute duration, and interval invariants; verify unit tests cover valid and invalid inputs
- [ ] 2.2 Add booking repository contracts and Prisma persistence mapping, including club/court ownership validation and conflict translation; verify repository tests cover cross-club rejection and overlap conflicts
- [x] 2.3 Add the Nest `BookingsModule` and booking use cases for create and read operations without customer dependencies; verify module compilation and use-case tests pass

## 3. Calendar Query Model

- [x] 3.1 Refactor the calendar availability calculation to accept a requested interval and derive eligible courts from operational court state plus non-free overlapping bookings; verify unit tests cover tenant isolation, overlap, adjacent intervals, and zero capacity
- [ ] 3.2 Add the availability query service and persistence query needed to read courts and bookings without writing calendar rows; verify the query integration test returns only the requested club's courts

## 4. REST API and Documentation

- [x] 4.1 Add validated DTOs and controller routes for `GET /clubs/:clubId/availability`, `POST /clubs/:clubId/bookings`, and `GET /clubs/:clubId/bookings/:id`; verify controller tests cover success and `400`/`404`/`409` errors
- [x] 4.2 Document booking and availability request/response contracts and error responses with Swagger decorators; verify the application exposes the routes in the generated OpenAPI document

## 5. Backend and Frontend Integration Verification

- [x] 5.1 Update backend README/API notes for the new availability and booking contracts and verify the documented examples match the controller DTOs
- [x] 5.2 Record that no frontend code change is required in this backend-only increment and verify the OpenAPI contract is sufficient for a later frontend consumer

## 6. Validation

- [ ] 6.1 Run focused booking, calendar, controller, and Prisma integration tests with the required database environment and verify all pass
- [ ] 6.2 Run `npm run build`, `npm run lint`, and `openspec validate --change "booking-domain-and-calendar-query-model" --strict`; verify no new errors remain
