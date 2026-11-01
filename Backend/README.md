# Emergency Alert and Hospital Assistance System - Java Spring Boot Backend

**Project:** B.Tech Community Service Project (CSP)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Department:** Computer Science and Engineering (Batch 8)  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana (Assist. Prof)

---

**Live Render API:** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)  

## Architecture & Technology Stack
- **Framework:** Spring Boot 3.3.4 (Java 21 LTS)
- **Security:** Spring Security + Stateless JWT Bearer Authentication (BCrypt password hashing)
- **Persistence:** Spring Data JPA with dual-profile support:
  - `dev` profile: In-memory H2 in MySQL compatibility mode with pre-seeded demo users, hospitals, and responder records.
  - `mysql` profile: Native MySQL 9.5 integration with schema auto-updates.
- **RESTful Endpoints:** Versioned `/api/v1` architecture.
- **API Documentation:** OpenAPI 3.0 / Swagger UI (`/swagger-ui.html`).
- **AI Integration:** Google Gemini 1.5 Flash client with deterministic, clinical rule-based emergency protocol fallback.
- **Offline Synchronization:** Idempotent incident processing with deduplication tracking.

---

## Configuration & Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP Server port | `8080` |
| `SPRING_PROFILES_ACTIVE` | Active profile (`dev` or `mysql`) | `dev` |
| `SPRING_DATASOURCE_URL` | MySQL JDBC connection string | `jdbc:mysql://localhost:3306/emergency_db` |
| `SPRING_DATASOURCE_USERNAME` | MySQL database user | `root` |
| `SPRING_DATASOURCE_PASSWORD` | MySQL database password | ` ` |
| `APP_JWT_SECRET` | 256-bit Base64 secret key for JWT signing | Preconfigured test secret |
| `APP_JWT_EXPIRATION_MS` | JWT expiration duration in milliseconds | `86400000` (24h) |
| `GEMINI_API_KEY` | Optional Google Gemini API key for online AI triage | None (defaults to rule-based fallback) |

---

## How to Run & Test

### Run in Development Mode (Zero-config in-memory H2)
```bash
mvn spring-boot:run
```
Swagger UI will be immediately available at:
`http://localhost:8080/swagger-ui.html`

H2 Database Console:
`http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:emergency_db`, User: `sa`, Password: empty)

### Run with Local MySQL 9.5
```bash
$env:SPRING_PROFILES_ACTIVE="mysql"
$env:SPRING_DATASOURCE_PASSWORD="your_password"
mvn spring-boot:run
```

### Run Automated Unit and Integration Tests
```bash
mvn test
```

### Package Production JAR
```bash
mvn clean package -DskipTests
```
Output artifact: `target/emergency-assistance-backend-1.0.0-SNAPSHOT.jar`

---

## REST Endpoints Overview

- **Auth:**
  - `POST /api/v1/auth/register` — Citizen/responder registration
  - `POST /api/v1/auth/login` — JWT login
  - `GET /api/v1/auth/me` — Current authenticated profile
- **Emergencies:**
  - `POST /api/v1/emergencies` — Create/trigger emergency incident
  - `GET /api/v1/emergencies/{id}` — Retrieve emergency incident
  - `GET /api/v1/emergencies` — User's incident history
  - `GET /api/v1/emergencies/all` — Hospital/Responder incident feed
  - `PATCH /api/v1/emergencies/{id}/status` — Status lifecycle (DISPATCHED, EN_ROUTE, ARRIVED, RESOLVED)
  - `POST /api/v1/emergencies/{id}/cancel` — False-alarm cancellation
- **Hospitals & Responders:**
  - `GET /api/v1/hospitals?latitude=&longitude=` — Proximity-sorted hospital discovery
  - `GET /api/v1/responders?latitude=&longitude=` — Proximity-sorted active responders
  - `PUT /api/v1/responders/availability` — Toggle responder on-duty state
- **Offline Sync:**
  - `POST /api/v1/sync` — Batch incident sync with idempotency keys
- **Medical Expenses:**
  - `GET /api/v1/medical-expenses/incident/{incidentId}` — Incident cost log
  - `POST /api/v1/medical-expenses` — Add medical/ambulance expense
- **AI Assistance:**
  - `POST /api/v1/ai/triage` — Emergency triage assessment & hospital prep checklist
- **Notifications:**
  - `GET /api/v1/notifications/incident/{incidentId}` — Delivery and acknowledgement audit logs
