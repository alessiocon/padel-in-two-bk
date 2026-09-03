## ADDED Requirements

### Requirement: Persistence of club domain entities
The system SHALL persist the core club domain in dedicated relational tables, with explicit ownership and state tracking for each club-owned resource.

#### Scenario: Club record creation
- **WHEN** a new club is created
- **THEN** the system SHALL store a unique club record with an identifier, business name, status, and creation metadata.

#### Scenario: Court ownership
- **WHEN** a court is created for a club
- **THEN** the system SHALL attach it to exactly one club through a foreign key relationship and SHALL prevent cross-club ownership.

#### Scenario: Calendar projection scope
- **WHEN** a calendar is evaluated for a club
- **THEN** the system SHALL return only records belonging to that club and SHALL ensure the result is scoped to the owning tenant.

### Requirement: Courts are first-class persisted entities
The system SHALL store each court as a standalone entity with its own identity, status, and operational attributes.

#### Scenario: Court state updates
- **WHEN** a court changes operational status
- **THEN** the system SHALL persist the new status and SHALL ensure the calendar reflects that state when computing availability.

#### Scenario: Court unavailability
- **WHEN** a court is marked as maintenance, inactive, or reserved
- **THEN** the system SHALL exclude that court from the bookable set for the relevant interval.

### Requirement: Calendar is a derived availability view
The system SHALL store the calendar as a derived availability model based on club courts and their real state, not as a separate source of truth for booking availability.

#### Scenario: Derived availability
- **WHEN** the system calculates availability for a date and time window
- **THEN** it SHALL count available courts, expose selected courts, and set the slot as bookable only when at least one court is available.

#### Scenario: No available courts
- **WHEN** zero courts are available for a club in the requested interval
- **THEN** the system SHALL return a non-bookable calendar state and SHALL not expose selectable courts.

### Requirement: Database constraints protect club isolation
The system SHALL enforce club-scoped data relationships and status constraints so that each club only accesses its own courts and calendar output.

#### Scenario: Foreign key isolation
- **WHEN** a record references a court or calendar row
- **THEN** the system SHALL enforce a valid club association and SHALL reject records that violate the club ownership boundary.

#### Scenario: Bookability threshold
- **WHEN** a time window is evaluated
- **THEN** the system SHALL mark it as bookable only if the available court count is greater than zero.
