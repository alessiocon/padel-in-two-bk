## Purpose

This capability defines the domain model and invariants for clubs, courts, and club-level calendar availability. The club is the tenant boundary, courts are autonomous business resources, and the calendar represents a derived availability view based on the real state of those courts.

## Requirements

### Requirement: Club owns its sports resources
The system SHALL model every club as the root aggregate for its sports infrastructure, including at least one court and a required unique contact email.

#### Scenario: Tenant isolation
- **WHEN** multiple clubs coexist in the platform
- **THEN** the system SHALL ensure that each club's resource set is isolated from every other club and SHALL NOT allow cross-club calendar or court visibility.

#### Scenario: Club requires a court
- **WHEN** a client requests creation of a club
- **THEN** the request SHALL include a positive integer `courtCount` greater than zero and the system SHALL create that number of courts associated with the new club.

#### Scenario: Club requires unique email
- **WHEN** a client requests creation of a club
- **THEN** the request SHALL include a valid email address that is not already assigned to another club.

#### Scenario: Duplicate club email rejected
- **WHEN** a client requests creation or update with an email already assigned to another club
- **THEN** the system SHALL reject the request with HTTP `409` and SHALL NOT modify existing records.

### Requirement: Court is a standalone aggregate
The system SHALL model each court as a standalone aggregate associated with exactly one club.

#### Scenario: Unique club association
- **WHEN** a court is created
- **THEN** the court SHALL be associated with exactly one club and SHALL NOT belong to multiple clubs at the same time.

#### Scenario: Operational state isolation
- **WHEN** a court is unavailable due to maintenance, closure, or inactivity
- **THEN** the system SHALL prevent that court from being returned as an available resource in the relevant time window.

### Requirement: Calendar availability is derived
The system SHALL compute calendar availability as a derived read model from the operational state of a club's courts and its non-free bookings rather than as a separately persisted source of truth.

#### Scenario: Aggregated capacity
- **WHEN** a club calendar evaluates a time interval
- **THEN** the system SHALL return the number of operational courts without overlapping non-free bookings, the list of selectable courts, and whether the interval is bookable.

#### Scenario: No available courts
- **WHEN** the club has zero operational courts without an overlapping non-free booking in the requested interval
- **THEN** the system SHALL mark the interval as unavailable and SHALL return no selectable court.

### Requirement: Bookability depends on at least one court
The system SHALL consider a time window bookable only when at least one court owned by the club is available for that interval.

#### Scenario: Bookable window
- **WHEN** at least one court in the club is available for the requested interval
- **THEN** the system SHALL consider the interval bookable and SHALL expose the eligible courts.

#### Scenario: Non-bookable window
- **WHEN** no court is available for the requested interval
- **THEN** the system SHALL return a non-bookable result and SHALL prevent booking selection for that window.

### Requirement: Calendar data is club-scoped
The system SHALL ensure that all calendar query responses are scoped to the owning club and contain only that club's courts and booking-derived availability decisions.

#### Scenario: Club local view
- **WHEN** a caller requests availability for a club and a fixed time interval
- **THEN** the system SHALL return only courts belonging to that club and SHALL consider only bookings belonging to that club's courts.

### Requirement: Persistence of club domain entities
The system SHALL persist the core club domain in dedicated relational tables, with explicit ownership and state tracking for each club-owned resource, and SHALL create a club and its required courts atomically.

#### Scenario: Club record creation
- **WHEN** a new club is created with a valid name, unique email, and positive `courtCount`
- **THEN** the system SHALL store a unique club record with an identifier, business name, required email, status, creation metadata, and exactly `courtCount` associated courts.

#### Scenario: Court ownership
- **WHEN** a court is created for a club
- **THEN** the system SHALL attach it to exactly one club through a foreign key relationship and SHALL prevent cross-club ownership.

#### Scenario: Calendar projection scope
- **WHEN** availability is queried for a club
- **THEN** the system SHALL calculate and return a tenant-scoped result without reading or writing a persisted calendar slot.

#### Scenario: Atomic club and court creation
- **WHEN** creation of the club or any requested court fails
- **THEN** the system SHALL roll back the complete operation so that neither the partial club nor partial courts remain persisted.

#### Scenario: Existing clubs without email
- **WHEN** the system is deployed against data containing clubs without an email
- **THEN** the deployment SHALL apply an explicitly defined backfill or block policy before enforcing the required unique email constraint.

### Requirement: Courts are first-class persisted entities
The system SHALL store each court as a standalone entity with its own identity, operational state, and club ownership, without requiring creation or update timestamps on the court record.

#### Scenario: Court state updates
- **WHEN** a court changes operational status
- **THEN** the system SHALL persist the new status and SHALL ensure the calendar reflects that state when computing availability.

#### Scenario: Court unavailability
- **WHEN** a court is marked as maintenance, inactive, or reserved
- **THEN** the system SHALL exclude that court from the bookable set for the relevant interval.

#### Scenario: Court timestamps are not part of the contract
- **WHEN** a court is created or returned through a domain or persistence contract
- **THEN** the system SHALL NOT require or expose `createdAt` or `updatedAt` for that court.

### Requirement: Calendar is a derived availability view
The system SHALL expose calendar availability as a query-oriented projection based on courts and non-free bookings, not as an independently persisted entity.

#### Scenario: Derived availability
- **WHEN** the system calculates availability for a fixed time window
- **THEN** it SHALL count operational courts without overlapping non-free bookings, expose selected courts, and set the slot as bookable only when at least one court is available.

#### Scenario: No available courts
- **WHEN** zero courts are available for a club in the requested interval
- **THEN** the system SHALL return a non-bookable calendar state and SHALL not expose selectable courts.

### Requirement: Database constraints protect club isolation
The system SHALL enforce club-scoped data relationships and availability rules so that each club only accesses its own courts, bookings, and calendar output.

#### Scenario: Foreign key isolation
- **WHEN** a booking or other record references a court
- **THEN** the system SHALL enforce a valid club association and SHALL reject records that violate the club ownership boundary.

#### Scenario: Bookability threshold
- **WHEN** a time window is evaluated
- **THEN** the system SHALL mark it as bookable only if the available court count is greater than zero.

## Domain Model

### Club
- Root aggregate for all club-owned resources
- Owns one or more courts
- Owns one or more calendar definitions or availability views
- Enforces tenant boundaries and club-specific rules

### Court
- Aggregate with a unique identity
- Belongs to exactly one club
- Has an operational status:
  - available
  - reserved
  - maintenance
  - inactive
- Can be selected only when available for the requested interval

### Calendar
- Derived availability projection
- Calculates the available court set for a given date and interval
- Exposes:
  - `isBookable`
  - `availableCourtCount`
  - `availableCourtIds`
  - `status` (open / closed / partially available)

## Invariants

- A court MUST belong to exactly one club.
- A club MUST NOT expose another club's court set in any calendar response.
- A slot is not bookable when the available court count is zero.
- Calendar availability MUST always reflect the current real state of the club's courts.
- The calendar MUST never be treated as a separate source of truth for availability.

## Architectural Interpretation

The calendar is not a duplicate of court state; it is a derived, query-oriented projection of court capacity. The actual business truth lives in the court aggregate and the club ownership boundary. The calendar is responsible for exposing whether a window is bookable and which resources can satisfy the request.
