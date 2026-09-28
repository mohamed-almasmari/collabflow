# CollabFlow

CollabFlow is a full-stack real-time collaborative project management platform designed to help teams organize projects, manage issues, communicate, and track progress from a centralized workspace.

The project demonstrates production-oriented full-stack software engineering concepts including authentication, role-based access control, real-time collaboration, relational database design, REST APIs, WebSockets, Docker, database migrations, testing, and cloud deployment.

## Live Application

### Frontend

https://collabflow-three.vercel.app

### Backend API

https://collabflow-production-1e25.up.railway.app

### API Health Check

https://collabflow-production-1e25.up.railway.app/api/health

---

## Features

### Authentication

- User registration
- User login and logout
- JWT-based access authentication
- Secure HTTP-only refresh cookies
- Refresh-token rotation
- Persistent authentication sessions
- Protected API routes
- Cross-origin production authentication

### Workspaces

- Create and manage workspaces
- Workspace membership
- Role-based access control
- Member authorization
- Workspace-level project organization

### Projects

- Create projects within workspaces
- Project-specific issue boards
- Project activity tracking
- Project member presence
- Project analytics

### Issue Management

- Create issues
- Edit issues
- Delete issues
- Issue status management
- Issue priority management
- Drag-and-drop positioning
- Due dates
- Issue assignment
- Labels
- Filtering
- Sorting
- Search
- Shareable issue URLs

### Kanban Board

- Interactive Kanban workflow
- Move issues between status columns
- Persistent issue positions
- Real-time board updates
- Board statistics
- Board filters

### Comments and Collaboration

- Issue comments
- User mentions
- Activity timeline
- Real-time collaboration
- Project presence tracking
- Collaborative issue updates

### Checklists and Subtasks

- Issue checklists
- Checklist item creation
- Completion tracking
- Progress indicators

### Notifications

- Workflow notifications
- Issue assignment notifications
- Mention notifications
- Read and unread states
- Real-time notification updates

### Search and Filtering

- Global search
- Project filtering
- Issue filtering
- Status filtering
- Priority filtering
- Due-date filtering
- Label filtering
- Sortable issue results

### Analytics

- Project statistics
- Issue completion metrics
- Status distribution
- Priority distribution
- Due-date statistics
- Dashboard analytics

### Real-Time Features

CollabFlow uses Socket.IO for real-time collaboration features including:

- Live issue updates
- Project presence
- Notification updates
- Board synchronization
- Collaborative activity updates

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Socket.IO Client

### Backend

- Node.js
- TypeScript
- Express
- Socket.IO
- REST APIs

### Database

- PostgreSQL
- Prisma ORM
- Prisma Migrations

### Authentication and Security

- JWT authentication
- HTTP-only refresh cookies
- Refresh-token rotation
- Argon2 password hashing
- CORS configuration
- Role-based authorization

### Testing

- Vitest
- Supertest
- Integration testing
- Authorization testing

### DevOps and Deployment

- Docker
- Docker Compose
- Multi-stage Docker builds
- Railway
- Vercel
- Git
- GitHub

---

## Architecture

CollabFlow uses a separated frontend, backend, and database architecture.

```text
┌───────────────────────────────┐
│         React Client          │
│                               │
│ React + TypeScript + Vite     │
│ Tailwind CSS                  │
│ Socket.IO Client              │
└───────────────┬───────────────┘
                │
                │ HTTPS / WebSocket
                │
                ▼
┌───────────────────────────────┐
│         Express API           │
│                               │
│ Node.js + TypeScript          │
│ REST APIs                     │
│ Socket.IO                     │
│ Authentication               │
│ Authorization                │
└───────────────┬───────────────┘
                │
                │ Prisma
                │
                ▼
┌───────────────────────────────┐
│          PostgreSQL           │
│                               │
│ Users                         │
│ Workspaces                    │
│ Projects                      │
│ Issues                        │
│ Comments                      │
│ Notifications                 │
│ Activity Logs                 │
│ Checklists                    │
└───────────────────────────────┘
```

---

## Project Structure

```text
collabflow/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── socket/
│   │   └── ...
│   │
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   └── ...
│   │
│   ├── tests/
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── prisma7.config.ts
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Local Development

### Prerequisites

Install:

- Node.js 24+
- npm
- Docker Desktop
- Git

Clone the repository:

```bash
git clone https://github.com/mohamed-almasmari/collabflow.git
cd collabflow
```

---

## Backend Setup

Go to the backend directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create:

```text
server/.env
```

Use `server/.env.example` as the template.

Example:

```env
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://collabflow:collabflow_dev@127.0.0.1:5433/collabflow
JWT_SECRET=replace-with-a-secure-random-secret
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Apply database migrations:

```bash
npm run prisma:migrate:deploy
```

Start the backend:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:3000
```

Health endpoint:

```text
http://localhost:3000/api/health
```

---

## Frontend Setup

Open another terminal and go to:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

The application runs at:

```text
http://localhost:5173
```

---

## Environment Variables

### Server

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Application environment |
| `PORT` | Express server port |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used for authentication tokens |

### Client

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API origin |
| `VITE_SOCKET_URL` | Socket.IO server origin |

Never commit real `.env` files or production secrets.

---

## Backend Scripts

Run these commands from:

```text
server/
```

### Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Production Start

```bash
npm start
```

### Type Checking

```bash
npm run typecheck
```

### Tests

```bash
npm test
```

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Apply Production Migrations

```bash
npm run prisma:migrate:deploy
```

---

## Frontend Scripts

Run these commands from:

```text
client/
```

### Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Production Preview

```bash
npm run preview
```

---

## Testing

The backend includes integration and authorization tests covering:

- Authentication
- Registration
- Login
- Refresh-token handling
- Logout behavior
- Workspace authorization
- Project authorization
- Issue authorization
- API health checks

Current backend test suite:

```text
5 test files passed
85 tests passed
```

Run all tests with:

```bash
cd server
npm test
```

---

## Docker

The backend uses a multi-stage Docker build for production deployment.

Build the API image:

```bash
cd server
docker build -t collabflow-server .
```

The production image contains:

- Compiled backend code
- Prisma schema
- Prisma migrations
- Production dependencies

Database migrations are executed before deployment in the production environment.

---

## Production Deployment

### Frontend

The React frontend is deployed on Vercel.

```text
https://collabflow-three.vercel.app
```

Production environment variables:

```env
VITE_API_URL=https://collabflow-production-1e25.up.railway.app
VITE_SOCKET_URL=https://collabflow-production-1e25.up.railway.app
```

### Backend

The Express API is deployed on Railway.

```text
https://collabflow-production-1e25.up.railway.app
```

Health check:

```text
/api/health
```

Railway runs Prisma database migrations before starting a new production deployment.

### Database

The production PostgreSQL database is hosted through Railway and accessed through the `DATABASE_URL` environment variable.

---

## Production Authentication

The frontend and backend are hosted on separate domains.

Production authentication therefore uses:

- Explicit CORS origin configuration
- Credentialed cross-origin requests
- Secure HTTP-only cookies
- `SameSite=None` refresh cookies in production
- HTTPS-only production cookies
- JWT access tokens
- Refresh-token rotation

This configuration allows authenticated sessions to work securely between the Vercel frontend and Railway backend.

---

## Engineering Highlights

CollabFlow demonstrates several production-oriented software engineering concepts:

- Full-stack TypeScript development
- REST API design
- Relational database modeling
- Prisma migrations
- Secure authentication
- JWT access tokens
- Refresh-token rotation
- Role-based access control
- Resource-level authorization
- Real-time WebSocket communication
- Collaborative UI workflows
- Cross-origin authentication
- Environment-based configuration
- Multi-stage Docker builds
- Production database migrations
- Cloud deployment
- Integration testing
- Responsive frontend development

---

## Author

**Mohamed Almasmari**

Computer Science graduate and full-stack software developer focused on building modern web applications with React, TypeScript, Node.js, PostgreSQL, Docker, and cloud deployment technologies.

GitHub:

https://github.com/mohamed-almasmari

---

## License

This project is currently intended for portfolio and educational purposes.

Copyright © 2026 Mohamed Almasmari.