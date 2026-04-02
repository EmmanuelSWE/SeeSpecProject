# 1. Is your feature request related to a problem? Please describe.
Role names and granted permissions are not reaching the frontend reliably after login or refresh. The session can show `null` or empty roles, which breaks role-aware UI and permission-gated routes such as assignments.

# 2. Solution/feature Description:
Ensure the backend authentication and current-session responses always include actual role names and granted permissions, persist the same values in the session cookie, and make the frontend hydrate those values consistently. Fix assignment route access so it follows the corrected permission state.

# 3. Alternatives:
Leave the current cookie as-is and depend only on a later session fetch, but that keeps refreshes and fallback login flows inconsistent. Another option would be adding a separate frontend-only role fetch, but backend auth/session should already be authoritative.

# 4. Additional context
This fix must stay surgical. It should touch only auth/session payload handling and the assignments access surface that depends on it.
