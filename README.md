# CommunityServe

CommunityServe is a MERN-based civic issue reporting platform that connects residents, department authorities, corporate/community leaders, and administrators through one transparent resolution workflow.

## Core workflow

Resident reports an issue → evidence/GPS is captured → local AI suggests category/priority and possible duplicates → community votes → admin reviews and assigns a department/officer → authority works the issue against an SLA target → department leader reviews and steers the entire queue → progress and resolution evidence are published → resident gives feedback or requests another review → administrators monitor analytics.

## Features

- JWT authentication with protected role-based routes
- Roles: `user`, `authority`, `corporate_leader`, `admin`
- Dedicated Corporate Leader login and department-scoped leadership portal
- Account activation/deactivation and admin role promotion
- Issue creation, validation, ownership controls, search, filters, and sorting
- Up to 5 evidence image URLs per issue
- Browser geolocation and OpenStreetMap links
- Reversible one-user voting
- Comments with ownership/admin deletion
- Local AI-assisted category/priority suggestions and duplicate detection without a paid LLM API
- Department and authority management
- SLA target dates and overdue queues
- Authority workspace for assigned work
- Corporate Leader command center with department-wide review queue
- Leader metrics for resolution rate, critical cases, overdue work, unassigned work and reopen requests
- Leader workload view for active authorities
- Leader controls for status, priority, authority assignment, SLA target dates, escalation level/reason and leadership notes
- Leadership review timeline entries and citizen/team notifications
- Resolution evidence and progress notes
- Status history timeline
- In-app notifications with unread count
- Resident resolution rating, feedback, and reopen request
- Admin analytics for status, category, priority, engagement, trends, and resolution performance
- CI workflow for backend syntax checks and frontend production builds
- Vercel SPA rewrite configuration and Render backend deployment configuration

## Project structure

```text
CommunityServe/
├── BackEnd/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── FrontEnd/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── vercel.json
├── .github/workflows/ci.yml
└── render.yaml
```

## Local development

### Backend

```bash
cd BackEnd
npm install
```

Create `BackEnd/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/CommunityServe
JWT_SECRET=replace_with_a_long_random_secret
```

Then run:

```bash
npm run dev
```

Backend health check:

```text
http://localhost:5000/api/health
```

### Frontend

```bash
cd FrontEnd
npm install
```

Create `FrontEnd/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

If your backend uses another port, change `VITE_API_URL` accordingly.

## Role model

### User / Citizen

Create and track reports, vote, comment, view notifications, and submit resolution feedback or reopen requests.

### Authority

See only issues assigned to them, manage progress, add resolution notes/evidence, and work overdue/SLA queues.

### Corporate Leader

A department-level operational leader. Login through `/leader-login`. Leaders only see cases belonging to their assigned department and can review the complete department queue, prioritize cases, assign/reassign active authorities, set target dates, escalate risk, add leadership notes, and move cases through the status workflow. They also get team workload visibility and a focused attention queue for overdue, critical, unassigned and escalated cases.

### Admin

Manage issues, departments, authority assignments, users, leader promotions, status workflow, and analytics.

Authority and Corporate Leader accounts should normally be created by promoting existing users through the admin User Management screen. Both staff roles require a department.

## Leadership workflow

1. An administrator promotes a user to `corporate_leader` and assigns a department.
2. The leader signs in through the dedicated Leader Portal.
3. The leader reviews department-wide operational alerts and the full case queue.
4. The leader assigns an active authority from the same department, sets priority/SLA targets, and records decisions.
5. Authorities execute field work and publish progress/resolution evidence.
6. The leader can escalate high-risk cases or move them to `Resolved` / `Closed` when the department confirms completion.
7. Citizens receive notifications on meaningful status/ownership changes and can submit feedback or request another review.

## Deployment

### Backend on Render

The repository contains `render.yaml`. Create a Render web service from the repository and provide:

- `MONGO_URI`
- `JWT_SECRET`

Render uses `BackEnd` as the service root, `npm install` as the build command, `npm start` as the start command, and `/api/health` as the health check.

### Frontend on Vercel

Set the project root to `FrontEnd` and define:

```text
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

`FrontEnd/vercel.json` rewrites client-side React routes to `index.html`, so routes such as `/issues/:id`, `/authority`, `/leader`, `/leader-login`, and `/admin/users` continue to work after a direct refresh.

## Security notes

- Never commit `.env` files.
- Rotate any database/JWT credentials that were ever exposed in Git history.
- Use a strong, random `JWT_SECRET` in production.
- Keep MongoDB network access restricted to the environments that need it.
- Image fields currently store URLs; production deployments should point them at a proper object/image storage service.
- Corporate Leader permissions are enforced server-side by role and department, not just by frontend routing.

## Development commands

Frontend production build:

```bash
cd FrontEnd
npm run build
```

Backend production start:

```bash
cd BackEnd
npm start
```

The CI workflow validates backend JavaScript syntax and the frontend production build on pull requests and pushes to the main development branches.
