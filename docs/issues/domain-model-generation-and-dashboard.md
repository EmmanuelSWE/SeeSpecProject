# 1. Is your feature request related to a problem? Please describe.
Domain model edits are not being persisted and rendered consistently, `GenerateFromSpec` fails behind unclear backend errors, and the tenant dashboard still shows hardcoded placeholder data instead of actual workspace state.

# 2. Solution/feature Description:
Fix the confirmed domain-model serialization and PlantUML rendering issues, make generation failure messages and preview/apply feedback clearer, and replace the dashboard placeholders with live backend/workflow data.

# 3. Alternatives:
Leave the current domain-model legacy serialization path and patch around it in the renderer, or keep the dashboard static. Both would preserve the current instability and make future generation/readiness behavior harder to trust.

# 4. Additional context
This fix should stay scoped to the confirmed domain-model persistence/render path, generation feedback, and dashboard data wiring. It should not refactor unrelated flows.
