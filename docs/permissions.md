# SeeSpec Permissions Matrix

Backend authorization is authoritative. Frontend visibility mirrors it but does not replace it.

## Permission Groups

- `Pages.Requirements`
- `Pages.Diagrams`
- `Pages.Tasks`
- `Pages.Assignments`
- `Pages.Team`
- `Pages.Users`
- `Pages.Notifications`

## Core Business Rules

- Only `Tenant Admin` and `Project Lead` can add people to a tenant.
- Only `System Architect` can create, edit, delete, and finalize diagrams.
- `System Architect` does not author requirements.
- `Tenant Admin` and `Project Lead` handle approval, unlock, reassignment, and workflow/status oversight.
- New tenant users receive default password `123456` and must change it on first login.

## Tenant Roles

- `Tenant Admin`
- `Project Lead`
- `Business Analyst`
- `System Architect`
- `Team Member`

## Permission Surface

### Requirements

- `Pages.Requirements`
- `Pages.Requirements.Create`
- `Pages.Requirements.Edit`
- `Pages.Requirements.Delete`
- `Pages.Requirements.Approve`
- `Pages.Requirements.Unlock`
- `Pages.Requirements.Comment`
- `Pages.Requirements.ViewAll`

### Diagrams

- `Pages.Diagrams`
- `Pages.Diagrams.Create`
- `Pages.Diagrams.Edit`
- `Pages.Diagrams.Delete`
- `Pages.Diagrams.View`
- `Pages.Diagrams.Finalize`

### Tasks

- `Pages.Tasks`
- `Pages.Tasks.Create`
- `Pages.Tasks.Edit`
- `Pages.Tasks.Delete`
- `Pages.Tasks.Assign`
- `Pages.Tasks.Complete`
- `Pages.Tasks.Reassign`
- `Pages.Tasks.ViewAll`
- `Pages.Tasks.ManageStatus`

### Assignments

- `Pages.Assignments`
- `Pages.Assignments.Create`
- `Pages.Assignments.Edit`
- `Pages.Assignments.Delete`
- `Pages.Assignments.AssignPeople`
- `Pages.Assignments.Complete`
- `Pages.Assignments.Reassign`
- `Pages.Assignments.ViewAll`
- `Pages.Assignments.ManageStatus`

### Team

- `Pages.Team`
- `Pages.Team.View`
- `Pages.Team.AddPeople`
- `Pages.Team.EditPeople`
- `Pages.Team.RemovePeople`
- `Pages.Team.ViewAll`

### Users

- `Pages.Users`
- `Pages.Users.Create`
- `Pages.Users.Edit`
- `Pages.Users.Delete`
- `Pages.Users.Activation`
- `Pages.Users.ResetPassword`
- `Pages.Users.AssignRoles`

### Notifications

- `Pages.Notifications`
- `Pages.Notifications.View`
- `Pages.Notifications.Manage`

## Role Matrix

### Tenant Admin

Granted:

- requirements approve, unlock, comment, view all
- diagram view
- task view all, reassign, manage status, complete
- assignment view all, reassign, manage status, complete
- team view, add people, edit people, remove people, view all
- users create, edit, delete, activation, reset password, assign roles
- notifications view and manage
- dashboard, settings, roles

Not granted:

- requirement create/edit
- diagram create/edit/delete/finalize
- day-to-day task and assignment creation

### Project Lead

Granted:

- requirements approve, unlock, comment, view all
- diagram view
- task view all, reassign, manage status, complete
- assignment view all, reassign, manage status, complete
- team view, add people, edit people, view all
- notifications view and manage
- dashboard

Not granted:

- user admin permissions
- team remove people
- diagram create/edit/delete/finalize
- requirement create/edit

Project Lead onboarding is restricted in the application service layer:

- may only create or edit users in project roles
- may only assign `Business Analyst`, `System Architect`, or `Team Member`
- may not manage tenant-admin users

### System Architect

Granted:

- requirements comment and view
- full diagram control
- task create, edit, assign, complete
- assignment create, edit, assign people, complete
- team view
- notifications view
- dashboard

### Business Analyst

Granted:

- requirement create, edit, comment
- diagram view
- task create, edit, assign, complete
- assignment create, edit, assign people, complete
- team view
- notifications view
- dashboard

### Team Member

Granted:

- requirement create, edit, comment
- diagram view
- task create, edit, assign, complete
- assignment create, edit, assign people, complete
- team view
- notifications view
- dashboard

## Application-Layer Rules

Permissions alone are not enough for these cases:

- Project Lead people management is restricted to project roles.
- Project Lead cannot elevate users into administrative roles.
- New tenant users always start with password `123456`.
- First successful password change clears the forced-password-change flag.

## Frontend Rules

- routes are shown only when the session includes the required permission
- user-management UI uses team permissions for `Project Lead` access
- diagram routes require `Pages.Diagrams.View`
- diagram editing requires `Pages.Diagrams.Edit`
- requirement creation/edit affordances are hidden or disabled unless both permission and workflow state allow them
