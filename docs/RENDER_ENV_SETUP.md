# Production Environment Configuration & Render Deployment Guide

**Project:** Emergency Alert and Hospital Assistance System  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Department:** Computer Science and Engineering (Batch 8) — Community Service Project (CSP)  
**Target Environments:** Render (Backend API), Vercel (Frontend SaaS Web App), Supabase / Neon (Cloud PostgreSQL & Storage)

---

## 1. Architecture Overview & Security Boundary

The Emergency Alert and Hospital Assistance System is architected with strict boundary separation between client-side platforms (React Web App, Flutter Mobile App, Wear OS Smartwatch) and the Java Spring Boot Backend:

```
[ Wear OS Watch / Flutter App / Vite React Web App ]
                        │
                        ▼ (HTTPS REST / SSE / JWT Bearer)
          [ Render Web Service: Spring Boot API ]
             (Port 8080 or PORT env variable)
            │                           │
            ▼ (TLS Port 5432)           ▼ (HTTPS REST / Bearer)
[ Cloud PostgreSQL Database ]    [ Supabase Storage & Services ]
  - Supabase Session Pooler        - Bucket: emergency-attachments
  - OR Neon Pooled Endpoint        - Service Role Secret (Backend Only)
  - Flyway Migrations (V1, V2, V3)
```

### Critical Security Rules:
- **Never expose backend credentials to the frontend**: Database connection strings, database passwords, `APP_JWT_SECRET`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY` belong **exclusively** on Render backend environment variables.
- **Never commit `.env` to GitHub**: All local `.env` and `.env.*` files are strictly ignored by `.gitignore`. Only `.env.example` is checked into version control.

---

## 2. Navigating Render Dashboard to Configure Environment Variables

Render runs your backend inside an isolated Docker container built from `./Backend/Dockerfile`.

> **CRITICAL DEPLOYMENT PRINCIPLE:**
> - **Do not assume Render automatically reads your local `.env` file.** Render operates in an isolated container environment and does not have access to developer local files or gitignored configurations.
> - Render environment variables should be configured individually or imported using a supported environment-variable workflow (such as Render Environment Groups, Infrastructure-as-Code via `render.yaml`, or bulk importing key-value pairs via the dashboard's "Add from .env" modal).

### Exact Dashboard Navigation:
To add each required environment variable in Render, follow this exact dashboard path:

```text
Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable
```

### Step-by-Step Instructions:
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Under **Services**, select your backend web service: **`emergency-alert-and-hospital-assistance-backend`**.
3. In the left navigation sidebar, navigate to:
   **`Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable`**
4. Click **Add Environment Variable** to add variables individually, or click **Add from .env** to paste multiple lines formatted as `KEY=VALUE`.
5. Enter each key and value as specified in the environment variable reference matrix below.
6. Click **Save Changes**. Render will automatically trigger a rolling redeployment with the new environment variables.

---

## 3. Complete Environment Variable Reference Matrix

| Variable Name | Required? | Hosting Scope | Where to Add in Dashboard | Public Exposure Risk | Description & Purpose | Where to Obtain Value |
| :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **Mandatory** | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Safe / Internal | Activates production profile (`prod`), enabling Flyway migrations, PostgreSQL dialect, and strict validation (`postgres` is also supported as alias). | Set to `prod` (or `postgres`). |
| `PORT` | Optional (Default: `8080`) | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Safe / Internal | Server listen port. Render automatically injects `PORT=10000` or uses default `8080`. | Render dashboard or leave blank for default. |
| `SPRING_DATASOURCE_URL` | **Mandatory** | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | **CRITICAL SECRET** | JDBC connection string with SSL mode required for cloud PostgreSQL. | Supabase / Neon Dashboard (see Section 4 & 5). |
| `SPRING_DATASOURCE_USERNAME` | **Mandatory** | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | **CRITICAL SECRET** | Database username (`postgres` for Supabase, or Neon role username). | Supabase / Neon Dashboard. |
| `SPRING_DATASOURCE_PASSWORD` | **Mandatory** | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | **CRITICAL SECRET** | Database user password. | Supabase / Neon project settings. |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | Optional (Default: `org.postgresql.Driver`) | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Safe / Internal | JDBC driver class name. | Already defaults to `org.postgresql.Driver`. |
| `SPRING_FLYWAY_ENABLED` | Optional (Default: `true` in prod) | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Safe / Internal | Controls execution of Flyway SQL migrations on application startup. | Set to `true`. |
| `APP_JWT_SECRET` | **Mandatory** | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | **CRITICAL SECRET** | 256-bit Base64-encoded secret key for signing & verifying backend JWT tokens. | Generated securely via `openssl rand -base64 32` (see Section 7). |
| `APP_JWT_EXPIRATION_MS` | Optional (Default: `86400000`) | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Safe / Internal | Token expiration time in milliseconds (86400000 ms = 24 hours). | Set desired token lifetime in milliseconds. |
| `FRONTEND_URL` | **Mandatory** | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Public URL | Canonical URL of the Vercel-deployed frontend web application. | Vercel Project Dashboard (e.g. `https://emergency-alert-and-hospital-assistance-system.vercel.app`). |
| `APP_CORS_ALLOWED_ORIGINS` | **Mandatory** | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Public URLs | Comma-separated CORS whitelist of domains permitted to make credentialed API requests. | Comma-separated Vercel domain and local preview domains. |
| `SUPABASE_URL` | Optional / Storage | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Public Project URL | Base URL of your Supabase project (`https://<project-ref>.supabase.co`). | Supabase Dashboard → Project Settings → API. |
| `SUPABASE_PUBLISHABLE_KEY` | Optional / Client | **Render** & Vercel | `Render Dashboard` & `Vercel Dashboard → Environment Variables` | Public Anon Key | Supabase anonymous public API key. | Supabase Dashboard → Project Settings → API → `anon public`. |
| `SUPABASE_SECRET_KEY` | Optional / Storage | **Render ONLY** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | **CRITICAL SECRET** | Supabase service role secret key. Never expose to client applications or Vercel! | Supabase Dashboard → Project Settings → API → `service_role secret`. |
| `SUPABASE_JWKS_URL` | Optional / Auth | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Public JWKS URL | JSON Web Key Set URL for Supabase Auth token signature verification. | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`. |
| `SUPABASE_STORAGE_BUCKET` | Optional / Storage | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | Bucket Name | Supabase Storage bucket name for incident medical photos and triage files. | Supabase Dashboard → Storage → Bucket name (e.g. `emergency-attachments`). |
| `GEMINI_API_KEY` | Optional (AI Triage) | **Render** | `Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable` | **CRITICAL SECRET** | Google Gemini API key for automated AI triage notes and symptom analysis. | [Google AI Studio](https://aistudio.google.com/). |

---

## 4. Neon PostgreSQL Configuration (Primary Production Database)

The application uses **Neon Serverless PostgreSQL** via its built-in connection pooler (`PgBouncer`).

### Tested Production Configuration:
- **Neon Host (Pooled):** `ep-odd-art-b3wr3a72-pooler.c-4.ap-southeast-1.aws.neon.tech`
- **Port:** `5432`
- **Database:** `neondb`
- **User:** `neondb_owner`
- **Region:** AWS `ap-southeast-1` (Singapore)
- **Neon Data API URL:** `https://ep-odd-art-b3wr3a72.apirest.c-4.ap-southeast-1.aws.neon.tech/neondb/rest/v1`

Configure the Render environment variables in Render Dashboard:
```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-odd-art-b3wr3a72-pooler.c-4.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require&channelBinding=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=YOUR_NEON_PASSWORD
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
```

Neon PostgreSQL fully complies with Hibernate 6's `PostgreSQLDialect` and executes Flyway migrations without modification.

---

## 5. Secondary Database Options & Legacy Reference

The application also natively supported Supabase PostgreSQL via its session pooler.

> [!CAUTION]
> **CRITICAL RENDER NETWORKING REQUIREMENT: IPv6 vs IPv4**
> - **Supabase Direct Connection** (`db.<project-ref>.supabase.co`) resolves to **IPv6 only**.
> - **Render does NOT support outbound IPv6 networking**. Connecting to `db.<project-ref>.supabase.co` from Render triggers:
>   `java.net.SocketException: Network unreachable`
> - **Solution:** You **MUST** use the Supabase **Session Pooler** (`aws-0-<region>.pooler.supabase.com:5432`), which operates over **IPv4** and fully supports Flyway migrations, Hibernate, and prepared statements.
> - When using the pooler, the username format **MUST** be: `postgres.<project-ref>`.

### Exact Tested Credentials for Project `ludglhsoseisgqbpylae`:
Your Supabase project is located in AWS region **`ap-northeast-2`** (Seoul). The tested, verified IPv4 configuration is:

```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres.ludglhsoseisgqbpylae
SPRING_DATASOURCE_PASSWORD=UUl7kFBWJXiE0TV2
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
```

### How to Retrieve Credentials for Any Supabase Project:
1. Log in to [Supabase](https://supabase.com/dashboard) and open your project.
2. In the top navigation bar, click the **Connect** button (or navigate to **Project Settings** → **Database**).
3. Under the **Connection string** tab, select **Session pooler** (Port `5432`), then select **JDBC**.
4. The connection parameters are:
   - **Pooler Host:** `aws-0-<region>.pooler.supabase.com`
   - **Port:** `5432`
   - **Database Name:** `postgres`
   - **User:** `postgres.<project-ref>`
   - **Password:** The password specified during project creation.
5. In Render Dashboard, enter these under `Environment` for your backend service.

---

## 5. Neon PostgreSQL Configuration

If deploying against **Neon Serverless PostgreSQL** instead of Supabase:

### How to Retrieve Credentials from Neon Console:
1. Log in to [Neon Console](https://console.neon.tech/) and select your project.
2. On the **Dashboard**, locate the **Connection Details** section.
3. Toggle the connection selector from **Direct connection** to **Pooled connection** (utilizes PgBouncer to manage connection limits during traffic spikes).
4. Select **JDBC** from the connection language dropdown.
5. Neon provides a connection string with the following components:
   - **Pooled Host:** `ep-<endpoint-id>-pooler.<region>.neon.tech` (or direct `ep-<endpoint-id>.<region>.neon.tech`)
   - **Port:** `5432`
   - **Database:** `neondb` (or custom database name)
   - **User:** `neondb_owner` (or your created role)
   - **Password:** Available via **Show Password** button.
6. Configure the Render environment variables in Render Dashboard:
   ```properties
   # Standard Neon JDBC connection URL format:
   SPRING_DATASOURCE_URL=jdbc:postgresql://ep-<endpoint-id>-pooler.<region>.neon.tech:5432/neondb?sslmode=require
   SPRING_DATASOURCE_USERNAME=neondb_owner
   SPRING_DATASOURCE_PASSWORD=YOUR_NEON_PASSWORD
   SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
   ```
   *(Note: Neon also supports `jdbc:postgresql://YOUR_NEON_HOST/YOUR_DATABASE?sslmode=require` where port 5432 is default).*
7. **JPA/Hibernate Compatibility:** Neon PostgreSQL fully complies with Hibernate 6's `PostgreSQLDialect` and executes Flyway migrations without modification.

---

## 6. Supabase Project, Auth, & Storage Setup

### Obtaining API Keys and JWKS:
1. In the Supabase Dashboard, navigate to **Project Settings** → **API**.
2. **Project URL:** Copy the URL (format: `https://<project-ref>.supabase.co`).
3. **Publishable Key (`anon` / `public`):** Copy the key starting with `sb_publishable_` or `eyJ...`.
4. **Secret Key (`service_role`):** Reveal and copy the `service_role` secret key. **Do NOT share this key publicly.**
5. **JWKS URL:** The public cryptographic key set for verifying Supabase JWT signatures is:
   ```
   https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
   ```

### Supabase Storage Bucket Configuration:
1. In the Supabase Dashboard, click **Storage** in the left sidebar.
2. Click **New bucket**.
3. Name the bucket: `emergency-attachments` (or custom bucket name defined in `SUPABASE_STORAGE_BUCKET`).
4. **Public Bucket vs RLS:**
   - Keep the bucket **Private** for patient data privacy.
   - Configure Row Level Security (RLS) policies or upload via the backend using the `service_role` key.
5. **Java SDK Integration Notice:**
   - Java Spring Boot communicates with Supabase Storage via standard HTTP REST APIs (`POST /storage/v1/object/{bucket}/{filename}` with `Authorization: Bearer <SUPABASE_SECRET_KEY>`).
   - Do **NOT** install `@supabase/supabase-js` or `@supabase/server` Node packages into the Java Maven repository.

---

## 7. Generating the Production JWT Secret

The Spring Boot backend uses an integrated HMAC-SHA256 JWT service (`io.jsonwebtoken` JJWT 0.12.6). In production profiles (`prod` or `postgres`), the application strictly validates that `APP_JWT_SECRET` is present and decodes to at least 256 bits (32 bytes).

> **SECURITY WARNING:**
> Never use the test or development fallback key (`404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`) in production. Anyone with knowledge of that key can forge admin and medical role tokens.

### Generate a Cryptographically Secure 256-Bit Secret:
Run this command in any terminal:
```bash
# Using OpenSSL (macOS / Linux / Git Bash / WSL):
openssl rand -base64 32

# Or using PowerShell on Windows:
pwsh -Command '$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)'
```

Example valid production output:
```
5WGMKyBB+8oXOF/+ikHgEXGzmTsCqFcajZU2F9Mg98U=
```

Add your newly generated string as the value for `APP_JWT_SECRET` in:
`Render Dashboard → Select Backend Web Service → Environment → Add Environment Variable`.

---

## 8. Frontend Environment Configuration (Vercel)

The React Web App is hosted separately on Vercel. In your Vercel Dashboard (**Project Settings** → **Environment Variables**), configure:

| Variable Name | Sample Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://emergency-alert-and-hospital-assistance.onrender.com` | Live backend API URL on Render. |
| `VITE_MAP_TILE_URL` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Standard OpenStreetMap tile server (optional, defaults automatically). |

> **Security Boundary Enforcement:** Vercel MUST NEVER be given `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`, or `SUPABASE_SECRET_KEY`.

---

## 9. Deployment Verification & Startup Checklist

After configuring the environment variables in Render:
1. Go to **Manual Deploy** → **Deploy latest commit** (or trigger a clean cache build).
2. Open the **Logs** tab in Render Dashboard.
3. Verify the following startup milestones in the log stream:
   - `The following 1 profile is active: "prod"` (or `"postgres"`)
   - `HikariPool-1 - Added connection conn0: url=jdbc:postgresql://...`
   - `Successfully applied 3 migrations to schema "public", now at version v3`
   - `Tomcat started on port 8080 (http) with context path ''`
   - `Started EmergencyAssistanceApplication in X.XXX seconds`
4. Test live API reachability:
   - **Swagger Docs:** `https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html`
   - **OpenAPI Schema:** `https://emergency-alert-and-hospital-assistance.onrender.com/api-docs`
   - **Public Hospital Directory:** `curl -X GET https://emergency-alert-and-hospital-assistance.onrender.com/api/v1/hospitals`
