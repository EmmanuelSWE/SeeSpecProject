# SeeSpec Next.js Frontend

This app is the primary Next.js frontend for SeeSpec and is being aligned with the repository product and architecture docs.

## Routes

- `/` redirects to `/app/about`
- `/account/login`
- `/account/register`
- `/app/about`
- `/app/home`
- `/app/users`
- `/app/roles`
- `/app/tenants`
- `/app/update-password`

## Structure

- `app/components/`
  - page-owned and shared UI components
- `app/lib/`
  - API helpers, shared data, and service functions
- `app/account/`
  - authentication routes
- `app/app/`
  - authenticated workspace routes

## Run

1. Install dependencies with `npm install`
2. Start the dev server with `npm run dev`

Set `NEXT_PUBLIC_API_BASE_URL` if the backend is not running at `https://localhost:44311`.
