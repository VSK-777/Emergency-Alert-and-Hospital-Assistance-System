# Emergency Alert and Hospital Assistance System — Java Spring Boot Backend

**Project:** B.Tech Community Service Project (CSP)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Department:** Computer Science and Engineering (Batch 8)  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana (Assistant Professor)  

**Live Production Deployments:**
- **Frontend Web App (Vercel):** [https://frontend-seven-zeta-99.vercel.app](https://frontend-seven-zeta-99.vercel.app)
- **Backend API (Render):** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)
- **Swagger UI:** [https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html](https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html)  

---

## 1. Database & Persistence Architecture

The backend utilizes **Cloud PostgreSQL** (via Supabase IPv4 Session Pooler / Neon PostgreSQL) as its production relational database, managed exclusively through version-controlled **Flyway** database migrations.

```text
ESP32 Firmware (IMU & BLE GATT) ──> Mobile App (Flutter) ──> Spring Boot REST API ──> Cloud PostgreSQL (Port 5432)
                                                                    ▲
React Web App (Vite SaaS) ──────────────────────────────────────────┘
```

- **Database:** Cloud PostgreSQL (Supabase IPv4 Session Pooler on port 5432 with `sslmode=require` / Neon PostgreSQL)
- **Connection Mode:** Session Connection Pooler via JDBC (Port `5432` with SSL enabled)
- **Schema Management:** Flyway 10.x versioned migrations (`classpath:db/migration`, V1 through V8)
- **Hibernate DDL Policy:** `spring.jpa.hibernate.ddl-auto=validate` (Strict validation against Flyway migrations)
- **Security Boundary:** The Spring Boot backend is the sole authority communicating with PostgreSQL. Neither the browser nor mobile apps hold database credentials.

---

## 2. Spring Profiles

| Profile | Purpose | Database | Schema Management | Data Seeding |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** / **`prod`** | **Production & Staging** | Cloud PostgreSQL (Supabase / Neon) | Flyway (`ddl-auto=validate`) | Clean schema with verified partner hospitals (V8) |
| **`dev`** | **Local Development** | In-Memory H2 | Auto-create with seeds | `DataInitializer.java` (Demonstration records for testing) |
| **`test`** | **Automated CI/CD** | H2 (PostgreSQL mode) | Flyway (`ddl-auto=validate`) | Isolated transactional test cases |

---

## 3. Required Environment Variables

For production deployment on Render, configure the following environment variables:

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `postgres` or `prod` |
| `SPRING_DATASOURCE_URL` | Cloud Pooler JDBC URL | `jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | Database Role Username | `postgres.ludglhsoseisgqbpylae` |
| `SPRING_DATASOURCE_PASSWORD` | Database Password | *(Secure database password)* |
| `APP_JWT_SECRET` | 256-bit Base64-encoded secret key | *(Base64 string generated via `openssl rand -base64 32`)* |
| `APP_JWT_EXPIRATION_MS` | JWT expiration duration in ms | `86400000` (24 hours) |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins | `https://frontend-seven-zeta-99.vercel.app` |
| `PORT` | Web server listening port | `8080` |
| `GEMINI_API_KEY` | Google Gemini AI API key | *(Optional API Key for Online Clinical Triage)* |

> **Security Rule:** Never commit real database passwords or JWT secrets to Git. Placeholders only are kept in `.env.example`.

---

## 4. Flyway Database Migrations

Database schema evolution is maintained in `src/main/resources/db/migration/`:

- `V1__create_initial_schema.sql` — Creates the 12 core relational tables (`users`, `hospitals`, `responders`, `user_devices`, `emergency_contacts`, `emergency_incidents`, `ambulances`, `detection_events`, `notification_attempts`, `medical_expenses`, `synchronization_records`, `audit_logs`).
- `V2__create_indexes_and_constraints.sql` — Creates foreign keys, cascade rules, and query indexes on geospatial, user, status, and audit lookup fields.
- `V3__add_device_auth_token.sql` — Adds cryptographic hardware authentication tokens (`device_auth_token`, `last_authenticated_at`) to `user_devices`.
- `V4__add_esp32_hardware_telemetry.sql` — Creates `hardware_telemetry_logs` for real-time ESP32 MPU6050 & MAX30102 sensor telemetry.
- `V5__add_detection_event_timestamps.sql` — Adds `detection_source`, `confidence_score`, and telemetry sync timestamps to `detection_events`.
- `V6__synchronize_passwords.sql` — Synchronizes default BCrypt hashes for pre-seeded demonstration accounts.
- `V7__create_file_storage_and_pairing_tables.sql` — Creates `medical_documents` and `device_pairing_challenges` tables for medical attachments and secure hardware pairing.
- `V8__seed_regional_partner_hospitals.sql` — Seeds authentic verified regional trauma centers and multi-speciality partner hospitals with precise OpenStreetMap coordinates.

To apply new schema changes, always add sequential version files (e.g. `V9__description.sql`). Never edit already-applied migrations.

---

## 5. Automated Testing & Verification

Run the automated test suite locally:

```bash
cd backend
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
   - `SPRING_PROFILES_ACTIVE`: `postgres` (or `prod`)
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME`: `postgres.ludglhsoseisgqbpylae`
   - `SPRING_DATASOURCE_PASSWORD`: `<DATABASE_PASSWORD>`
   - `APP_JWT_SECRET`: `<STRONG_RANDOM_SECRET>`
   - `APP_JWT_EXPIRATION_MS`: `86400000`
   - `APP_CORS_ALLOWED_ORIGINS`: `https://frontend-seven-zeta-99.vercel.app`
3. Trigger Manual Deploy with Clear Build Cache from branch `main`.
4. Monitor deployment logs for Flyway schema migrations and successful startup.

---

## 7. Rollback & Disaster Recovery Plan

1. **Pre-Cutover Backup:** Prior to cutover, execute a full PostgreSQL logical dump:
   ```bash
   pg_dump -h ep-odd-art-b3wr3a72-pooler.c-4.ap-southeast-1.aws.neon.tech -p 5432 -U neondb_owner -d neondb -F c -b -v -f neon_backup.dump
   ```
2. **Restoration Procedure:** If a rollback is necessitated:
   ```bash
   pg_restore -h ep-odd-art-b3wr3a72-pooler.c-4.ap-southeast-1.aws.neon.tech -p 5432 -U neondb_owner -d neondb -v -c neon_backup.dump
   ```
3. **Additive Schema Rule:** Never write destructive down-migrations. If schema rollback is required, apply a new forward migration (e.g. `V8__revert_...sql`).
4. **Data Preservation:** In the event of service degradation, keep PostgreSQL running and review Render logs. Do not switch back to in-memory H2 as H2 will lose live production citizen records.
