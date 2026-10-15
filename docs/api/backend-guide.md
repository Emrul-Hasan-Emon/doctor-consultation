# Backend module guide

Read before writing a module. Look at `backend/src/modules/auth` for a finished example (`admin-auth` controller, service, dtos).

## Layout
`backend/src/modules/<feature>/` has `controllers/`, `services/`, `dtos/`, `utils/` and `<feature>.module.ts`.
One controller and one service **per actor**, named `{actor}-{feature}.controller.ts` / `.service.ts` (`admin-doctor`, `doctor-doctor`, `patient-doctor`). Shells for all actors already exist. Only the **admin** actor is in scope now. Leave the doctor and patient shells untouched.
Logic shared by several actors goes in a shared service in the same module (for example `chamber-schedule.service.ts`), exported from the module. The per-actor service adds the actor rules and calls it.

## Rules
- Controller: `@ApiTags('Admin / <Feature>') @ApiBearerAuth() @Roles(UserType.ADMIN) @Controller('api/admin/<route>')`. Every route has `@ApiOperation({ summary })` and a response type (`@ApiOkResponse({ type })`, `@ApiPaginatedResponse(Model)` for lists). A route without `@Roles` is rejected by the global guard.
- DTOs are classes in `dtos/*.dto.ts` (the Swagger plugin only reads that suffix). Every field has class-validator decorators: the global pipe uses `whitelist` and `forbidNonWhitelisted`, so an undecorated field is rejected. Use `@IsBdMobile()` for mobiles, `@Type(() => Number)` for query numbers, `PaginationQueryDto` for list queries. Update DTOs are separate classes (`PartialType` from `@nestjs/swagger` is fine). Response DTOs are classes too, so Swagger documents them.
- Services never return entities with secrets. `passwordHash` is `select: false`; do not select it.
- `import type { AuthActor }` when used in a decorated signature (isolatedModules).
- Inject `DatabaseService` (all repositories, `transaction(fn)`, `manager`). Pass the transaction `manager` to every call inside a transaction. Use `AccountService` (from `AuthModule`, global) to create or change login accounts inside your transaction. Use `AuditService` to log every create, update, delete and status change; pass the transaction manager.
- Errors: Nest exceptions with clear messages (`NotFoundException`, `ConflictException`, `BadRequestException`, `UnprocessableEntityException`). Postgres unique, FK and check violations are mapped to 409/400 by a global filter, but check explicitly first when the user can fix it.
- Search uses `ILIKE` with `escapeLike` from `common/utils/like`. Lists are paginated with `paginated()` from `common/dto/paginated`. Default order is stable (id desc unless stated).
- Dates are `YYYY-MM-DD` strings, times `HH:mm:ss` strings, Asia/Dhaka local. Use `common/utils/date` (`todayDhaka`, `weekdayOf`, `addDays`, `isValidDate`, `nowMinutesDhaka`). Slot math is in `modules/schedule/utils/slots.ts` (do not duplicate it).
- No `any`. No new dependencies without need. No comments that restate code. Match the style of `modules/auth`.
- **Do not edit** entities, migrations, `database.service.ts`, `common/`, `modules/auth`, or other agents' modules. If a schema change seems needed, work around it and report it in your final message.
- Register new providers in your own `<feature>.module.ts`. Export services other modules need. A module that needs another module's service imports that module.

## Verify (several agents work at once: do NOT run `nest build`, `npm run build`, `npm run start*`, or `npm run seed`; they clobber `dist/` and each other)
- Types: `cd backend && npx tsc --noEmit -p tsconfig.json`
- Lint your files: `npx eslint "src/modules/<feature>/**/*.ts" --fix`
- Unit tests for pure logic and for services with a mocked `DatabaseService`: `npx jest src/modules/<feature>`.
- Run against the real database (Postgres, db `doctor_consultation`, already migrated and seeded; admin login `01700000000` / `ChangeMe123!`): `PORT=<your port> npx ts-node -r tsconfig-paths/register src/main.ts` in the background, then drive it with `curl`. Use your assigned port. **Prefix all test data with your tag and delete it at the end** (soft-deleted rows included: use `psql -d doctor_consultation`). Stop your server when done.
- Swagger UI is at `/api/docs` of your server. Verify your routes show with the right schemas.

## Final message
Report: files created, routes implemented (method + path), tests run and their results, what you could not verify, any schema or contract deviation. Keep it short.
