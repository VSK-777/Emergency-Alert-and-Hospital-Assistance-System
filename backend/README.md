# Emergency Alert and Hospital Assistance System — Java Spring Boot Backend

**Project:** B.Tech Community Service Project (CSP)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Department:** Computer Science and Engineering (Batch 8)  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana (Assistant Professor)  

**Live Production Deployments:**
- **Frontend Web App (Vercel):** [https://emergency-alert-and-hospital-assist.vercel.app](https://emergency-alert-and-hospital-assist.vercel.app)
- **Backend API (Render):** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)
- **Swagger UI:** [https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html](https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html)  

---

## 1. Database & Persistence Architecture

The backend utilizes **Supabase PostgreSQL** as its production relational database, managed exclusively through version-controlled **Flyway** database migrations.

```
Smartwatch (Wear OS) ──> Mobile App (Flutter) ──> Spring Boot REST API ──> Supabase PostgreSQL (Port 5432)
                                                        ▲
React Web App (Vite SaaS) ──────────────────────────────┘
```

- **Database:** Supabase PostgreSQL 17.11 (Region: Seoul `ap-northeast-2`)
- **Connection Mode:** Supabase Session Pooler via JDBC (Port `5432` with `sslmode=require`)
- **Schema Management:** Flyway 10.x versioned migrations (`classpath:db/migration`)
- **Hibernate DDL Policy:** `spring.jpa.hibernate.ddl-auto=validate` (Strict validation against Flyway migrations)
- **Security Boundary:** The Spring Boot backend is the sole authority communicating with PostgreSQL. Neither the browser nor mobile apps hold database credentials.

---

## 2. Spring Profiles

| Profile | Purpose | Database | Schema Management | Data Seeding |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | **Production & Staging** | Supabase PostgreSQL | Flyway (`ddl-auto=validate`) | **None** (Clean schema, voluntary user registration) |
| **`dev`** | **Local Development** | In-Memory H2 | Auto-create with seeds | `DataInitializer.java` (Demonstration records for testing) |
| **`test`** | **Automated CI/CD** | H2 (PostgreSQL mode) | Flyway (`ddl-auto=validate`) | Isolated transactional test cases |

---

## 3. Required Environment Variables

For production deployment on Render, configure the following environment variables:

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `postgres` |
| `SPRING_DATASOURCE_URL` | Supabase Session Pooler JDBC URL | `jdbc:postgresql://<POOLER_HOST>:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | Supabase Session Pooler Username | `postgres.<PROJECT_REF>` |
| `SPRING_DATASOURCE_PASSWORD` | Supabase Database Password | *(Secure database password)* |
| `APP_JWT_SECRET` | 256-bit Base64-encoded secret key | *(Base64 string generated via `openssl rand -base64 32`)* |
| `APP_JWT_EXPIRATION_MS` | JWT expiration duration in ms | `86400000` (24 hours) |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins | `https://emergency-alert-and-hospital-assistance-system.vercel.app` |
| `PORT` | Web server listening port | `8080` |
| `GEMINI_API_KEY` | Google Gemini AI API key | *(Optional API Key for Online Clinical Triage)* |

> **Security Rule:** Never commit real database passwords or JWT secrets to Git. Placeholders only are kept in `.env.example`.

---

## 4. Flyway Database Migrations

Database schema evolution is maintained in `src/main/resources/db/migration/`:

- `V1__create_initial_schema.sql` — Creates the 12 normalized relational tables:
  1. `users`
  2. `hospitals`
  3. `responders`
  4. `user_devices`
  5. `emergency_contacts`
  6. `emergency_incidents`
  7. `ambulances`
  8. `detection_events`
  9. `notification_attempts`
  10. `medical_expenses`
  11. `synchronization_records`
  12. `audit_logs`
- `V2__create_indexes_and_constraints.sql` — Creates foreign keys, cascade rules, and query indexes on geospatial, user, status, and audit lookup fields.

To apply new schema changes, always add sequential version files (e.g. `V3__description.sql`). Never edit already-applied migrations.

---

## 5. Automated Testing & Verification

Run the automated test suite locally:

```bash
cd Backend
mvn clean test
```

### Verified Test Suites:
1. `FlywayMigrationAndSchemaValidationTest`:
   - Verifies Flyway executes migration scripts cleanly.
   - Verifies Hibernate `ddl-auto=validate` validates all 12 JPA entities with zero discrepancies.
   - Tests entity CRUD, foreign key cascading, and decimal precision (`NUMERIC(10,2)` for medical expenses).
2. `JwtAndSecurityConfigTest`:
   - Verifies JWT token generation, role claims, subject claims, and expiration.
   - Verifies BCrypt password hashing.
3. `EmergencyWorkflowIntegrationTest`:
   - Verifies citizen registration, nearby hospital discovery, incident dispatching, and status retrieval.

---

## 6. Deployment Procedure (Render)

1. Open Render Dashboard: Service `emergency-alert-and-hospital-assistance-backend` (Region: Singapore).
2. Set Environment Variables:
   - `SPRING_PROFILES_ACTIVE`: `postgres`
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<SESSION_POOLER_HOST>:5432/postgres?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME`: `<SESSION_POOLER_USERNAME>`
   - `SPRING_DATASOURCE_PASSWORD`: `<DATABASE_PASSWORD>`
   - `APP_JWT_SECRET`: `<STRONG_RANDOM_SECRET>`
   - `APP_JWT_EXPIRATION_MS`: `86400000`
   - `APP_CORS_ALLOWED_ORIGINS`: `https://emergency-alert-and-hospital-assistance-system.vercel.app`
3. Trigger Manual Deploy with Clear Build Cache from branch `main`.
4. Monitor deployment logs for:
   - `Migrating schema "public" to version "1 - create initial schema"`
   - `Migrating schema "public" to version "2 - create indexes and constraints"`
   - `Started EmergencyAssistanceApplication in X.XXX seconds`

---

## 7. Rollback & Disaster Recovery Plan

1. **Pre-Cutover Backup:** Prior to cutover, execute a full PostgreSQL logical dump:
   ```bash
   pg_dump -h <POOLER_HOST> -p 5432 -U <USERNAME> -d postgres -F c -b -v -f supabase_pre_migration_backup.dump
   ```
2. **Restoration Procedure:** If a rollback is necessitated:
   ```bash
   pg_restore -h <POOLER_HOST> -p 5432 -U <USERNAME> -d postgres -v -c supabase_pre_migration_backup.dump
   ```
3. **Additive Schema Rule:** Never write destructive down-migrations. If schema rollback is required, apply a new forward migration (e.g. `V3__revert_...sql`).
4. **Data Preservation:** In the event of service degradation, keep PostgreSQL running and review Render logs. Do not switch back to in-memory H2 as H2 will lose live production citizen records.
