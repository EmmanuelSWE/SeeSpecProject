# 1. Is your feature request related to a problem? Please describe.
The current SeeSpec permission model is too coarse. It does not enforce the required ABP role matrix for requirements, diagrams, tasks, assignments, team management, and tenant user onboarding. Project Leads cannot safely add people with restricted role scope, diagram authority is not isolated to System Architects, and the frontend permission map does not mirror backend authority.

# 2. Solution/feature Description:
Implement the ABP permissions matrix across backend and frontend. Add the new permission groups and child permissions, reseed static tenant roles, enforce backend authorization in the app services, restrict Project Lead onboarding to non-admin project roles with default password `123456`, surface first-login password change state, and align the frontend route and action visibility with the granted permissions returned by the backend.

# 3. Alternatives:
Keep the existing coarse permissions and rely on frontend role checks. This was rejected because backend enforcement must remain authoritative and the current UI-only gating is inconsistent.

# 4. Additional context
Business rules locked for this implementation:

- Only Admins and Project Leads can add people to the tenant.
- Only System Architects can create, edit, delete, and finalize diagrams.
- Everyone except System Architects can write requirements.
- Admins and Project Leads do oversight, approval, reassignment, and status management.
- New tenant users receive default password `123456` and must change it on first login.
