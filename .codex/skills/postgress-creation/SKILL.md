# ABP PostgreSQL Provider Consistency Ruleset

## Rule 1: PostgreSQL Connection Strings Require Npgsql Provider
If a connection string contains PostgreSQL-specific keywords such as:
- Host=
- Port=
- SSL Mode=
- Trust Server Certificate=

THEN:
- The Entity Framework Core provider MUST be Npgsql
- `UseNpgsql()` MUST be configured in AbpDbContextOptions

Violation Result:
- Runtime exception: "Keyword not supported: 'host'"

---

## Rule 2: SQL Server Provider Must Not Be Present with PostgreSQL
If PostgreSQL is used as the database engine:

THEN:
- `Microsoft.EntityFrameworkCore.SqlServer` MUST NOT be referenced
- `UseSqlServer()` MUST NOT appear anywhere in the solution

---

## Rule 3: Provider Configuration Is Mandatory and Explicit
Every ABP project using EF Core MUST explicitly configure its provider via:

- `Configure<AbpDbContextOptions>(...)`

---

## Rule 4: ConnectionStrings:Default Is Provider-Agnostic
- `postgres://` URLs are NOT allowed
- Npgsql connection string format is REQUIRED

---

## Rule 5: UnitOfWork Failures Indicate Provider Misconfiguration
If exceptions reference unsupported keywords:
- Diagnose provider mismatch BEFORE application logic

---

## Rule 6: Environment-Based Configuration Must Preserve Provider Consistency
Environments may change credentials and hosts, but NEVER providers.

---

## Rule 7: Provider Validation on Startup (Recommended)
