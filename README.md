# Doctor Consultation

| Folder | What | Stack |
|---|---|---|
| `backend/` | Shared API | NestJS, TypeORM, PostgreSQL |
| `web/` | Admin portal (`/admin/*`), doctor portal (`/doctor/*`), more later | Next.js |
| `doctor/` | Doctor and doctor-staff app | Flutter |
| `patient/` | Patient app | Flutter |
| `docs/` | Phase tracker and phase notes | Markdown |

Progress: [docs/PHASE_TRACKER.md](docs/PHASE_TRACKER.md).

## Backend
```
cd backend
cp .env.example .env     # set DB_* and JWT_SECRET
npm install
npm run migration:run    # create tables
npm run seed             # divisions, districts, specialities, first admin
npm run start:dev        # API on :3001, Swagger on /api/docs
```
Schema changes use migrations only (`npm run migration:generate -- src/database/migrations/Name`).

## Web
```
cd web
cp .env.example .env.local   # BACKEND_URL
npm install
npm run dev                  # admin portal at http://localhost:3000/admin
```
