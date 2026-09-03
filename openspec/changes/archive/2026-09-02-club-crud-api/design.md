## Context

See proposal.md - Why. The repository currently contains the Prisma `Club` model and a minimal NestJS application, but no club feature module or HTTP contract. The existing `clubs` database row is the tenant root, so the API must introduce a vertical slice without coupling the transport layer directly to Prisma.

## Goals / Non-Goals

**Goals:**
- implement a complete club CRUD vertical slice in the backend
- make `Club` the DDD aggregate root and enforce its invariants in the domain layer
- isolate NestJS transport, application use cases, domain abstractions, and Prisma infrastructure
- expose stable REST responses and validation errors
- keep all queries and mutations scoped to the requested club aggregate

**Non-Goals:**
- court, calendar, availability, booking, user, payment, or authentication endpoints
- authorization policy implementation before the user/identity domain exists
- event bus, CQRS framework, or generic repository abstraction across domains
- frontend changes in this backend repository

## Decisions

### 1. Feature-first DDD module layout
Create one `src/clubs` feature module with explicit subdirectories for `domain`, `application`, `infrastructure`, and `presentation`. The Nest module composes the layers, while dependencies point inward toward the domain contracts.

Alternative considered: organize by technical type (`controllers`, `services`, `repositories`) across the whole application. Rejected because it weakens domain boundaries and makes the club aggregate harder to evolve independently.

### 2. Club aggregate owns creation and mutation rules
The domain `Club` entity/aggregate root owns valid state transitions and name invariants. Application use cases orchestrate commands and queries through a `ClubRepository` port; they do not contain persistence details or HTTP concerns.

Alternative considered: put validation only in DTOs or Prisma. Rejected because DTO validation protects the API boundary but cannot protect other future application entry points, while database constraints cannot express all domain rules.

### 3. Prisma adapter implements the repository port
The infrastructure layer adapts Prisma Client to the domain repository interface. It maps Prisma records to domain objects and translates known persistence errors into application-level errors that the controller maps to `404`, `409`, or `500` responses.

Alternative considered: inject Prisma Client directly into the controller. Rejected because it couples HTTP behavior to the ORM and makes domain/use-case tests dependent on the database adapter.

### 4. REST contract uses conventional CRUD routes
Use `GET /clubs`, `GET /clubs/:id`, `POST /clubs`, `PATCH /clubs/:id`, and `DELETE /clubs/:id`. Creation returns `201`, successful reads/updates return `200`, deletion returns `204`, invalid input returns `400`, missing resources return `404`, and uniqueness conflicts return `409`.

Alternative considered: expose action-oriented endpoints such as `/createClub` or use `PUT` for partial updates. Rejected because the requested API is CRUD-oriented and `PATCH` expresses partial mutation without requiring clients to resend the full aggregate.

### 5. Validation at both HTTP and domain boundaries
Use Nest request DTO validation for payload shape, UUID parameter validation for route identifiers, and domain validation for aggregate invariants. Unsupported properties are rejected instead of silently persisted.

Alternative considered: rely solely on TypeScript types. Rejected because types are erased at runtime and cannot validate external HTTP input.

### 6. Delete semantics for the current phase
Use hard deletion for now because there are no booking or user-dependent records in scope. The repository must translate a missing row into `404`; future dependent domains can introduce a deactivation policy without changing the current read contract.

Alternative considered: soft delete immediately. Deferred because it would require a new persistence field and lifecycle semantics not present in the approved club model.

### 7. Dependency injection and testability
Expose the repository through a Nest injection token and provide the Prisma implementation in the module. Unit tests use an in-memory repository or a focused fake at the application boundary; API tests exercise the controller and module contract without asserting mock call choreography.

## Risks / Trade-offs

- [Authorization gap] → Authentication and authorization are explicitly out of scope; keep the controller boundary ready for a future guard and never claim tenant authorization is implemented.
- [Hard-delete compatibility] → Future dependent entities may prevent deletion; retain a repository-level conflict mapping so the API can evolve to `409` without leaking database errors.
- [ORM coupling in mappings] → Prisma schema changes can affect the adapter; keep all Prisma types inside infrastructure and map to domain/application response types.
- [Concurrent updates] → Last-write-wins behavior is acceptable for this first API; add optimistic concurrency only when administrative workflows require it.

## Migration Plan

No database migration is required because the `clubs` table and `Club` model already exist. Implement the module against the current schema, run the API test suite, and deploy the backend normally. Rollback consists of removing the module registration and endpoint implementation; existing club data remains intact.

## Open Questions

- Which authentication role will be allowed to create, update, or delete clubs? This can be decided when the identity and authorization domain is introduced; it does not change the current unauthenticated development contract.
