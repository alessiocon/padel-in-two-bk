## 1. Domain and application layers

- [x] 1.1 Implement the `Club` aggregate root with identifier, name, status, audit fields, and invariant validation; verify unit tests reject blank names and invalid state transitions
- [x] 1.2 Define the `ClubRepository` port and application result/error types; verify the application layer has no NestJS or Prisma imports
- [x] 1.3 Implement create, list, get-by-id, update, and delete club use cases through the repository port; verify unit tests cover success, not-found, and conflict outcomes

## 2. Persistence and NestJS composition

- [x] 2.1 Add a Prisma service/provider and map Prisma `Club` records to the domain model; verify the adapter compiles and keeps Prisma types inside infrastructure
- [x] 2.2 Implement the Prisma repository adapter with club-scoped queries and persistence error translation; verify duplicate and missing-record errors become application-level errors
- [x] 2.3 Register the `ClubsModule` in the root NestJS module and wire the repository token to the Prisma adapter; verify the application builds with dependency injection resolved

## 3. REST API contract

- [x] 3.1 Add DTOs for club creation and partial update with runtime validation and UUID route validation; verify invalid payloads and identifiers return HTTP `400`
- [x] 3.2 Implement `GET /clubs` and `GET /clubs/:id`; verify existing data returns HTTP `200`, empty lists remain arrays, and unknown IDs return HTTP `404`
- [x] 3.3 Implement `POST /clubs`; verify valid input returns HTTP `201`, generates an active club, and duplicate names return HTTP `409`
- [x] 3.4 Implement `PATCH /clubs/:id`; verify valid updates return HTTP `200`, unknown IDs return HTTP `404`, and unsupported fields are rejected
- [x] 3.5 Implement `DELETE /clubs/:id`; verify successful deletion returns HTTP `204` without a response body and unknown IDs return HTTP `404`
- [x] 3.6 Add Swagger/OpenAPI decorators and document request/response/error contracts; verify the generated API document exposes all five club routes

## 4. Verification and integration

- [x] 4.1 Add focused domain, application, repository, and controller/API tests; verify the full club test suite covers aggregate invariants, persistence mapping, CRUD status codes, and safe error responses
- [x] 4.2 Run the Prisma-backed integration test setup against the existing `clubs` table; verify the API can create, read, update, and delete a real club record
- [x] 4.3 Run `npm test`, `npm run build`, and `npm run lint`; verify all checks pass without adding court, calendar, booking, user, or payment endpoints

## 5. Frontend boundary

- [x] 5.1 Document the backend API contract for future frontend consumption without modifying the frontend repository; verify route names, payloads, response fields, and error statuses match the capability specification
