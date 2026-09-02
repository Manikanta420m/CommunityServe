# CommunityServe

CommunityServe is a MERN-based civic issue reporting platform that connects residents, administrators, and authority officers through one transparent workflow.

## Core workflow

Resident reports an issue → evidence/GPS is captured → local AI suggests category/priority and possible duplicates → community votes → admin reviews and assigns a department/officer → authority works the issue against an SLA target → progress and resolution evidence are published → resident gives feedback or requests another review → administrators monitor analytics.

## Features

- JWT authentication with protected routes
- Roles: `user`, `authority`, `admin`
- Account activation/deactivation
- Issue creation, validation, ownership controls, search, filters, and sorting
- Up to 5 evidence image URLs per issue
- Browser geolocation and OpenStreetMap links
- Reversible one-user voting
- Comments with ownership/admin deletion
- Local AI-assisted category/priority suggestions and duplicate detection without a paid LLM API
- Department and authority management
- SLA target dates and overdue queues
- Authority dashboard for assigned work
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

### User

Create and track reports, vote, comment, view notifications, and submit resolution feedback.

### Authority

See only issues assigned to them, manage progress, add resolution notes/evidence, and work overdue/SLA queues.

### Admin

Manage issues, departments, authority assignments, users, status workflow, and analytics.

New authority/admin accounts should normally be created by promoting existing users through the admin User Management screen.

## Deployment

### Backend on Render

The repository contains `render.yaml`. Create a Render web service from the repository and provide:

- `MONGO_URI`
- `JWT_SECRET`

Render will use `BackEnd` as the service root, `npm install` as the build command, `npm start` as the start command, and `/api/health` as the health check.

### Frontend on Vercel

Set the project root to `FrontEnd` and define:

```text
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

`FrontEnd/vercel.json` rewrites client-side React routes to `index.html`, so routes such as `/issues/:id`, `/authority`, and `/admin/users` continue to work after a direct refresh.

## Security notes

- Never commit `.env` files.
- Rotate any database/JWT credentials that were ever exposed in Git history.
- Use a strong, random `JWT_SECRET` in production.
- Keep MongoDB network access restricted to the environments that need it.
- Image fields currently store URLs; production deployments should point them at a proper object/image storage service.

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

The CI workflow validates backend JavaScript syntax and the frontend production build on pull requests.
