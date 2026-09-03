## Purpose

Questa capability espone la gestione HTTP dei circoli come aggregate root del dominio, offrendo un CRUD REST validato e persistente per il backend NestJS.

## ADDED Requirements

### Requirement: List clubs
The system SHALL expose `GET /clubs` to return all clubs visible in the current application context.

#### Scenario: List existing clubs
- **WHEN** a client requests `GET /clubs`
- **THEN** the system SHALL return HTTP `200` with a JSON array of club representations containing at least `id`, `name`, `status`, `createdAt`, and `updatedAt`.

#### Scenario: List with no clubs
- **WHEN** no clubs exist
- **THEN** the system SHALL return HTTP `200` with an empty JSON array.

### Requirement: Get club by identifier
The system SHALL expose `GET /clubs/:id` to retrieve one club by its unique identifier.

#### Scenario: Existing club
- **WHEN** a client requests `GET /clubs/:id` with a valid existing identifier
- **THEN** the system SHALL return HTTP `200` with the matching club representation.

#### Scenario: Unknown club
- **WHEN** a client requests `GET /clubs/:id` with an identifier that does not exist
- **THEN** the system SHALL return HTTP `404` and SHALL NOT disclose another club's data.

#### Scenario: Invalid identifier
- **WHEN** a client requests `GET /clubs/:id` with an invalid identifier format
- **THEN** the system SHALL return HTTP `400` with a validation error.

### Requirement: Create a club
The system SHALL expose `POST /clubs` to create a new club through the club aggregate boundary.

#### Scenario: Valid club creation
- **WHEN** a client sends `POST /clubs` with a valid business name
- **THEN** the system SHALL persist one club with a generated unique identifier and default active status and SHALL return HTTP `201` with the created club representation.

#### Scenario: Invalid club creation
- **WHEN** a client sends `POST /clubs` with a missing, blank, or invalid name
- **THEN** the system SHALL return HTTP `400` and SHALL NOT persist a club.

#### Scenario: Duplicate club name
- **WHEN** a client sends `POST /clubs` with a name that violates the configured uniqueness rule
- **THEN** the system SHALL return HTTP `409` and SHALL NOT expose persistence-layer details.

### Requirement: Update a club
The system SHALL expose `PATCH /clubs/:id` to update mutable club attributes through the aggregate boundary.

#### Scenario: Valid club update
- **WHEN** a client sends `PATCH /clubs/:id` with valid mutable fields for an existing club
- **THEN** the system SHALL persist the update and SHALL return HTTP `200` with the updated club representation.

#### Scenario: Update unknown club
- **WHEN** a client sends `PATCH /clubs/:id` for an identifier that does not exist
- **THEN** the system SHALL return HTTP `404`.

#### Scenario: Invalid club update
- **WHEN** a client sends `PATCH /clubs/:id` with an invalid name or unsupported field
- **THEN** the system SHALL return HTTP `400` and SHALL leave the existing club unchanged.

### Requirement: Delete a club
The system SHALL expose `DELETE /clubs/:id` to remove an existing club when no dependent business data prevents deletion.

#### Scenario: Delete existing club
- **WHEN** a client sends `DELETE /clubs/:id` for an existing club
- **THEN** the system SHALL delete the club and SHALL return HTTP `204` without a response body.

#### Scenario: Delete unknown club
- **WHEN** a client sends `DELETE /clubs/:id` for an identifier that does not exist
- **THEN** the system SHALL return HTTP `404`.

### Requirement: Preserve club aggregate boundaries
The system SHALL route every club mutation through the club aggregate and SHALL keep transport, application, domain, and persistence responsibilities separated.

#### Scenario: Domain invariant enforcement
- **WHEN** a create or update operation violates a club invariant
- **THEN** the system SHALL reject the operation before persistence and SHALL return a client-safe validation error.

#### Scenario: Persistence failure
- **WHEN** persistence is unavailable during a club operation
- **THEN** the system SHALL return an appropriate server error without exposing database credentials, queries, or internal stack details.
