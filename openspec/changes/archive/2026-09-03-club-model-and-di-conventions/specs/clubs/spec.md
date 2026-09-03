## MODIFIED Requirements

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

### Requirement: Persistence of club domain entities
The system SHALL persist the core club domain in dedicated relational tables, with explicit ownership and state tracking for each club-owned resource, and SHALL create a club and its required courts atomically.

#### Scenario: Club record creation
- **WHEN** a new club is created with a valid name, unique email, and positive `courtCount`
- **THEN** the system SHALL store a unique club record with an identifier, business name, required email, status, creation metadata, and exactly `courtCount` associated courts.

#### Scenario: Court ownership
- **WHEN** a court is created for a club
- **THEN** the system SHALL attach it to exactly one club through a foreign key relationship and SHALL prevent cross-club ownership.

#### Scenario: Atomic club and court creation
- **WHEN** creation of the club or any requested court fails
- **THEN** the system SHALL roll back the complete operation so that neither the partial club nor partial courts remain persisted.

#### Scenario: Existing orphan clubs
- **WHEN** the system is deployed against data containing clubs without courts
- **THEN** the deployment SHALL identify those records and SHALL apply an explicitly defined remediation or block policy before claiming that the no-orphan invariant holds for all existing data.

#### Scenario: Existing clubs without email
- **WHEN** the system is deployed against data containing clubs without an email
- **THEN** the deployment SHALL apply an explicitly defined backfill or block policy before enforcing the required unique email constraint.

#### Scenario: Calendar projection scope
- **WHEN** availability is queried for a club
- **THEN** the system SHALL calculate and return a tenant-scoped result without reading or writing a persisted calendar slot.

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
