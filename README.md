# nestjs-auth-starter

> 🚧 Work in progress — building a production-ready authentication module with NestJS, step by step.

A reusable authentication starter for NestJS APIs, written in strict TypeScript.

## Current status

- [x] Project bootstrap (NestJS, strict TypeScript)
- [x] Environment validation at startup with Joi (the app refuses to start if a required variable is missing)
- [x] PostgreSQL 16 via Docker Compose
- [ ] User entity and migrations (TypeORM)
- [ ] Register / login with bcrypt
- [ ] JWT access tokens + refresh token rotation with reuse detection
- [ ] Role-based access control (RBAC)
- [ ] Security hardening: Helmet, CORS allowlist, rate limiting
- [ ] Unit and e2e tests, CI, Docker image

## Getting started

```bash
git clone https://github.com/Schandroid243/nestjs-auth-starter.git
cd nestjs-auth-starter
npm install
cp .env.example .env   # then fill in the values
docker compose up -d   # starts PostgreSQL
npm run start:dev
```

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Secret used for refresh tokens |
| `CORS_ORIGINS` | Comma-separated list of allowed origins |
| `PORT` | HTTP port (default: 3000) |