# Backend Test Task

NestJS application that models a company and its staff hierarchy, exposes a REST
API, calculates an individual staff member's salary at an arbitrary date, and
calculates the company's total payroll.

## Overview

Three staff types exist — **Employee**, **Manager** and **Sales**. Every staff
member has a name, a join date, a salary basis and an optional supervisor.
Managers and Sales can have subordinates; Employees cannot. Salary formulas are
staff-type specific and deterministic for a supplied `asOf` date
(`YYYY-MM-DD`).

## Requirements

- Node.js **24**
- npm (package manager)

## Installation

```bash
npm ci
```

## Configuration

Optional environment variables:

| Variable | Default                 | Description                                    |
| -------- | ----------------------- | ---------------------------------------------- |
| `PORT`   | `3000`                  | HTTP port                                      |
| `DB_PATH`| `data/company.sqlite`   | SQLite database file (`:memory:` for in-memory)|

The `data/` directory is created automatically on first run. It is git-ignored.
The single company record (default base salary `1000`) is seeded
automatically.

## Running the application

```bash
# watch mode
npm run start:dev

# production-like build + start
npm run build
npm run start:prod
```

The server listens on `http://localhost:3000`.

## API

Base URL: `http://localhost:3000`

### Staff

| Method | Path            | Description                        |
| ------ | --------------- | ---------------------------------- |
| POST   | `/staff`        | Create a staff member              |
| GET    | `/staff`        | List all staff                     |
| GET    | `/staff/:id`    | Get one staff member               |
| PATCH  | `/staff/:id`    | Update a staff member              |
| DELETE | `/staff/:id`    | Delete a staff member              |

`POST /staff` body:

```json
{
  "name": "Alice",
  "joinedAt": "2020-01-15",
  "type": "EMPLOYEE",
  "baseSalaryOverride": 1200,
  "supervisorId": 1
}
```

`type` must be `EMPLOYEE`, `MANAGER` or `SALES`. `joinedAt` must be an ISO
calendar date (`YYYY-MM-DD`). `baseSalaryOverride` and `supervisorId` are
optional; `null` clears them on update.

### Salary

| Method | Path                              | Description                            |
| ------ | --------------------------------- | -------------------------------------- |
| GET    | `/staff/:id/salary?asOf=2026-01-01`| Individual salary at `asOf`           |
| GET    | `/company/total-salary?asOf=2026-01-01` | Company total payroll at `asOf` |

`asOf` is required and must be a valid `YYYY-MM-DD` date that is **not earlier
than** the staff member's `joinedAt`.

Responses:

```json
{ "staffId": 1, "asOf": "2026-01-01", "salary": 1267.3 }
{ "asOf": "2026-01-01", "totalSalary": 7026.5 }
```

### Company

| Method | Path         | Description                     |
| ------ | ------------ | ------------------------------- |
| GET    | `/company`   | Get company configuration       |
| PATCH  | `/company`   | Update name / default base salary |

### Error behavior

- `400` — invalid input or business-rule violation (e.g. bad date, `asOf` before `joinedAt`)
- `404` — staff member or company not found
- `409` — hierarchy conflict (self-supervision, cycle, Employee supervising)
- `500` — unexpected errors
## Salary rules

| Type | Formula (base = effective base salary, y = full calendar years at `asOf`) |
| ---- | -------------------------------------------------------------------------- |
| Employee | `base + min(base * y * 0.03, base * 0.30)` |
| Manager  | `base + min(base * y * 0.05, base * 0.40) + sum(first-level subordinate salaries) * 0.005` |
| Sales    | `base + min(base * y * 0.01, base * 0.35) + sum(all descendant salaries) * 0.003` |

- The effective base salary is the staff member's `baseSalaryOverride`, or the
  company's `defaultBaseSalary` when no override is set.
- Manager bonus uses **first-level** subordinates only; Sales commission uses
  **all** descendants.
- Subordinate salaries are calculated at the same `asOf` date.
- Every final salary is rounded to two decimal places (same policy for total).
- The total payroll is the sum of each member's own salary exactly once.

## Testing

```bash
# unit tests (business logic, no HTTP/database)
npm test

# integration/e2e tests (real HTTP stack with in-memory SQLite)
npm run test:e2e

# watch mode / coverage
npm run test:watch
npm run test:cov
```

- **Unit tests** live in `test/unit/` and cover the salary strategies, the
  strategy factory, salary orchestration, date utilities and staff
  hierarchy invariants — without HTTP or a database.
- **Integration/e2e tests** live in `test/*.e2e-spec.ts` and boot the real Nest
  application (controllers, validation pipe, Swagger) against an isolated
  in-memory SQLite database using `supertest`.

## Swagger

Once the app is running, OpenAPI documentation is available at:

```
http://localhost:3000/api
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every `push` and `pull
request`:

1. `npm ci`
2. lint
3. unit tests
4. e2e tests
5. build

See `SOLUTION.md` for the detailed design discussion.

## Project structure

```text
src/
  app.module.ts        # root module + TypeORM (better-sqlite3) config
  app.setup.ts         # global ValidationPipe + Swagger (shared with e2e)
  common/              # date helpers (ISO validation, full years worked)
  company/             # company configuration + default base salary
  database/            # DB path resolution
  staff/               # staff CRUD + hierarchy management + invariants
  salary/
    strategies/        # Employee / Manager / Sales formulas (Strategy pattern)
    salary-calculator.factory.ts
    salary.service.ts  # post-order orchestration, memoized per request
    salary.controller.ts
test/
  unit/                # business-logic unit tests
  *.e2e-spec.ts        # HTTP e2e tests against an in-memory SQLite DB
```