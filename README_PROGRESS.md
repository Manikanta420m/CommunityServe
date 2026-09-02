# CommunityServe Progress

## Product workflow completed

CommunityServe now covers the full civic issue lifecycle:

`Register/Login → Report Issue → Location + Evidence → AI Triage → Community Voting → Admin Review → Department/Authority Assignment → SLA Tracking → Authority Resolution → Status Timeline + Notifications → Citizen Feedback / Reopen Request → Analytics`

## Citizen features

- JWT authentication with inactive-account protection
- Issue reporting with category, priority, GPS coordinates and up to 5 evidence image URLs
- AI-assisted local category/priority suggestions and similar-issue detection without a paid AI API
- Search, filters, sorting and community voting
- Issue detail pages with map link, assignment, resolution evidence, status history and comments
- My Issues and profile activity
- Post-resolution 1–5 rating and satisfaction comments
- Reopen/review request with reason
- In-app notification center

## Administration features

- Status management and workflow tracking
- Department directory and SLA target dates
- Validated authority assignment by department
- Authority user management, activation/deactivation and role management
- Analytics for volume, status, category, priority, votes, resolution rate and citizen feedback

## Authority features

- Authority-only workspace
- Assigned-issue queue with search/filtering
- Overdue/SLA visibility
- Progress and resolution notes through status history
- Resolution evidence management
- Reporter notifications on progress changes

## Engineering / delivery

- Centralized API services and environment configuration
- Role-based backend authorization and frontend route guards
- Deactivated users are blocked even with previously issued JWTs
- GitHub Actions CI for backend syntax checks and frontend production builds

## Remaining production work

The application is functionally complete for the current MERN scope. Before public production deployment, configure production MongoDB/JWT/CORS settings, add a real image storage provider, and perform end-to-end QA against deployed frontend/backend environments.
