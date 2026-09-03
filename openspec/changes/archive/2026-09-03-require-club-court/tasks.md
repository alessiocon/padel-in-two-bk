## 1. Domain and Application Contract

- [x] 1.1 Extend the club creation command with a positive integer `courtCount` and reject zero, negative, fractional, missing, and non-numeric values; verify domain/use-case tests cover each invalid input
- [x] 1.2 Define the generated court representation and default operational state for newly created clubs; verify valid creation produces exactly the requested number of courts
- [x] 1.3 Preserve the club aggregate boundary while delegating atomic club-plus-courts persistence to the repository; verify no club is returned without its requested courts

## 2. Transactional Persistence and Database

- [x] 2.1 Implement club and court creation inside one Prisma transaction using the new club ID for every court; verify a successful transaction persists one club and exactly `courtCount` related courts
- [x] 2.2 Translate transaction failures without exposing persistence details and verify a failed court insert rolls back the club and all previously created courts
- [x] 2.3 Audit existing database records for clubs without courts and implement the agreed remediation or blocking migration policy; verify the deployment check reports no unresolved orphan clubs

## 3. REST API and OpenAPI

- [x] 3.1 Update `CreateClubDto` validation and Swagger metadata to require `courtCount` as a positive integer; verify invalid POST `/clubs` requests return HTTP `400`
- [x] 3.2 Update the club response contract to expose the generated court count or generated courts as specified; verify POST `/clubs` returns the persisted club-to-court associations
- [x] 3.3 Update controller tests and OpenAPI assertions for valid creation, invalid counts, persistence failure, and atomic rollback; verify duplicate club errors remain HTTP `409`

## 4. Backend and Frontend Integration

- [x] 4.1 Update backend README/API examples with the required `courtCount` field and generated-court response; verify examples match DTOs and Swagger
- [x] 4.2 Document the frontend integration requirement to send `courtCount` during onboarding; verify no frontend source code is changed in this backend-only increment

## 5. Validation

- [x] 5.1 Run focused club domain, use-case, controller, and Prisma integration tests with the database environment; verify all club creation and rollback scenarios pass
- [x] 5.2 Run `npm run build`, `npm run lint`, `npm run test`, and `openspec validate --strict`; verify no new errors and no orphan-club requirement violations remain
