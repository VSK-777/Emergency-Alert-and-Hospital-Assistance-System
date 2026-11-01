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

### Critical Security Rule:
- **Never expose backend credentials to the frontend**: Database connection strings, database passwords, `APP_JWT_SECRET`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY` belong **exclusively** on Render backend environment variables.
- **Frontend variables in Vercel** must ONLY contain public client endpoints (such as `VITE_API_BASE_URL` pointing to Render, `VITE_MAP_TILE_URL`, or `VITE_PHONE_EMAIL_CLIENT_ID`).
- **Never commit `.env` to GitHub**: All local `.env` and `.env.*` files are strictly ignored by `.gitignore`. Only `.env.example` is checked into version control.

---

## 2. Navigating Render Dashboard to Configure Environment Variables

Render runs your backend inside an isolated Docker container built from `./Backend/Dockerfile`. **Render does NOT automatically read local `.env` files from developer machines or Git repositories.** Environment variables must be entered directly in the Render Dashboard or defined via `render.yaml`.

### Step-by-Step Navigation:
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Under **Services**, select your backend web service: **`emergency-alert-and-hospital-assistance-backend`**.
3. In the left navigation sidebar, click **Environment**.
4. Click the **Add Environment Variable** button (or click **Add from .env** to paste multiple lines in key=value format).
5. Enter each key and value as specified in the environment variable reference below.
6. Click **Save Changes**. Render will automatically trigger a rolling redeployment with the new environment variables.

---

## 3. Complete Environment Variable Reference Matrix

| Variable Name | Required? | Hosting Scope | Public Exposure Risk | Description & Purpose | Where to Obtain Value |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **Mandatory** | **Render** | Safe / Internal | Activates production profile (`postgres` or `prod`), enabling Flyway migrations, PostgreSQL dialect, and strict validation. | Set to `postgres` (or `prod`). |
| `PORT` | Optional (Default: `8080`) | **Render** | Safe / Internal | Server listen port. Render automatically injects `PORT=10000` or uses default `8080`. | Render dashboard or leave blank for default. |
| `SPRING_DATASOURCE_URL` | **Mandatory** | **Render** | **CRITICAL SECRET** | JDBC connection string with SSL mode required for cloud PostgreSQL. | Supabase / Neon Dashboard (see Section 4 & 5). |
| `SPRING_DATASOURCE_USERNAME` | **Mandatory** | **Render** | **CRITICAL SECRET** | Database username (`postgres` for Supabase, or Neon role username). | Supabase / Neon Dashboard. |
| `SPRING_DATASOURCE_PASSWORD` | **Mandatory** | **Render** | **CRITICAL SECRET** | Database user password. | Supabase / Neon project settings. |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | Optional (Default: `org.postgresql.Driver`) | **Render** | Safe / Internal | JDBC driver class name. | Already defaults to `org.postgresql.Driver`. |
| `SPRING_FLYWAY_ENABLED` | Optional (Default: `true` in prod) | **Render** | Safe / Internal | Controls execution of Flyway SQL migrations on application startup. | Set to `true`. |
| `APP_JWT_SECRET` | **Mandatory** | **Render** | **CRITICAL SECRET** | 256-bit Base64-encoded secret key for signing & verifying backend JWT tokens. | Generated securely via `openssl rand -base64 32` (see Section 7). |
| `APP_JWT_EXPIRATION_MS` | Optional (Default: `86400000`) | **Render** | Safe / Internal | Token expiration time in milliseconds (86400000 ms = 24 hours). | Set desired token lifetime in milliseconds. |
| `FRONTEND_URL` | **Mandatory** | **Render** | Public URL | Canonical URL of the Vercel-deployed frontend web application. | Vercel Project Dashboard (e.g. `https://emergency-alert-and-hospital-assistance-system.vercel.app`). |
| `APP_CORS_ALLOWED_ORIGINS` | **Mandatory** | **Render** | Public URLs | Comma-separated CORS whitelist of domains permitted to make credentialed API requests. | Comma-separated Vercel domain and local preview domains. |
| `SUPABASE_URL` | Optional / Storage | **Render** | Public Project URL | Base URL of your Supabase project (`https://<project-ref>.supabase.co`). | Supabase Dashboard → Project Settings → API. |
| `SUPABASE_PUBLISHABLE_KEY` | Optional / Client | **Render** & Vercel | Public Anon Key | Supabase anonymous public API key. | Supabase Dashboard → Project Settings → API → `anon public`. |
| `SUPABASE_SECRET_KEY` | Optional / Storage | **Render ONLY** | **CRITICAL SECRET** | Supabase service role secret key. Never expose to client applications! | Supabase Dashboard → Project Settings → API → `service_role secret`. |
| `SUPABASE_JWKS_URL` | Optional / Auth | **Render** | Public JWKS URL | JSON Web Key Set URL for Supabase Auth token signature verification. | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`. |
| `SUPABASE_STORAGE_BUCKET` | Optional / Storage | **Render** | Bucket Name | Supabase Storage bucket name for incident medical photos and triage files. | Supabase Dashboard → Storage → Bucket name (e.g. `emergency-attachments`). |
| `GEMINI_API_KEY` | Optional (AI Triage) | **Render** | **CRITICAL SECRET** | Google Gemini API key for automated AI triage notes and symptom analysis. | [Google AI Studio](https://aistudio.google.com/). |

---

## 4. Supabase PostgreSQL Configuration

The application natively supports **Supabase PostgreSQL** via its built-in session pooler or direct connection.

### How to Retrieve Credentials from Supabase Dashboard:
1. Log in to [Supabase](https://supabase.com/dashboard) and open your project (`ludglhsoseisgqbpylae`).
2. In the top navigation bar, click the **Connect** button (or navigate to **Project Settings** → **Database**).
3. Under the **Connection string** tab, select **JDBC**.
4. Choose **Session pooler** (Port `5432`) or **Direct connection** (Port `5432`).
5. The connection details will be formatted as follows:
   - **Host:** `db.ludglhsoseisgqbpylae.supabase.co` (or session pooler hostname `aws-0-<region>.pooler.supabase.com`)
   - **Port:** `5432`
   - **Database Name:** `postgres`
   - **User:** `postgres` (or `postgres.ludglhsoseisgqbpylae` for session pooler)
   - **Password:** The password specified during project creation.
6. Assemble the JDBC URL with mandatory SSL mode:
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://db.ludglhsoseisgqbpylae.supabase.co:5432/postgres?sslmode=require
   ```

---

## 5. Neon PostgreSQL Configuration

If deploying against **Neon Serverless PostgreSQL** instead of Supabase:

### How to Retrieve Credentials from Neon Console:
1. Log in to [Neon Console](https://console.neon.tech/) and select your project.
2. On the **Dashboard**, locate the **Connection Details** section.
3. Toggle the connection selector from **Direct connection** to **Pooled connection** (utilizes PgBouncer to manage connection limits during traffic spikes).
4. Select **JDBC** from the connection language dropdown.
5. Neon provides a connection string with the following components:
   - **Pooled Host:** `ep-<endpoint-id>-pooler.<region>.neon.tech`
   - **Port:** `5432`
   - **Database:** `neondb`
   - **User:** `neondb_owner` (or your created role)
   - **Password:** Available via **Show Password** button.
6. Configure the Render environment variables:
   ```properties
   SPRING_DATASOURCE_URL=jdbc:postgresql://ep-<endpoint-id>-pooler.<region>.neon.tech:5432/neondb?sslmode=require
   SPRING_DATASOURCE_USERNAME=neondb_owner
   SPRING_DATASOURCE_PASSWORD=YOUR_NEON_PASSWORD
   SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
   ```
7. **JPA/Hibernate Compatibility:** Neon PostgreSQL 15/16/17 fully complies with Hibernate 6's `PostgreSQLDialect` and executes Flyway migrations without modification.

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
3. Name the bucket: `emergency-attachments`.
4. **Public Bucket vs RLS:**
   - Keep the bucket **Private** for patient data privacy.
   - Configure Row Level Security (RLS) policies or upload via the backend using the `service_role` key.
5. **Java SDK Integration Notice:**
   - Java Spring Boot communicates with Supabase Storage via standard HTTP REST APIs (`POST /storage/v1/object/{bucket}/{filename}` with `Authorization: Bearer <SUPABASE_SECRET_KEY>`).
   - Do **NOT** install `@supabase/supabase-js` or Node packages into the Java Maven repository.

---

## 7. Generating the Production JWT Secret

The Spring Boot backend uses an integrated HMAC-SHA256 JWT service (`io.jsonwebtoken` JJWT 0.12.6). In production profiles (`postgres` or `prod`), the application strictly validates that `APP_JWT_SECRET` is present and decodes to at least 256 bits (32 bytes).

### Generate a Cryptographically Secure 256-Bit Secret:
Run this command in any PowerShell or bash terminal:
```bash
# Using OpenSSL (macOS / Linux / Git Bash / WSL)
openssl rand -base64 32

# Or using PowerShell on Windows:
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

Example valid output:
```
404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

Add the generated string as the value for `APP_JWT_SECRET` in the Render Dashboard.

---

## 8. Frontend Environment Configuration (Vercel)

The React Web App is hosted separately on Vercel. In your Vercel Dashboard (**Project Settings** → **Environment Variables**), configure:

| Variable Name | Sample Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://emergency-alert-and-hospital-assistance.onrender.com` | Live backend API URL on Render. |
| `VITE_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Leaflet OpenStreetMap tile server. |
| `VITE_PHONE_EMAIL_CLIENT_ID` | `15695407177920574360` | Optional client ID for phone/email sign-in widget. |

> **Security Check:** Vercel MUST NEVER be given `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`, or `SUPABASE_SECRET_KEY`.

---

## 9. Deployment Verification & Startup Checklist

After configuring the environment variables in Render:
1. Go to **Manual Deploy** → **Deploy latest commit** (or trigger a clean cache build).
2. Open the **Logs** tab in Render Dashboard.
3. Verify the following startup milestones in the log stream:
   - `The following 1 profile is active: "postgres"` (or `"prod"`)
   - `HikariPool-1 - Added connection conn0: url=jdbc:postgresql://...`
   - `Successfully applied 3 migrations to schema "public", now at version v3`
   - `Tomcat started on port 8080 (http) with context path ''`
   - `Started EmergencyAssistanceApplication in X.XXX seconds`
4. Test live API reachability:
   - **Swagger Docs:** `https://emergency-alert-and-hospital-assistance.onrender.com/swagger-ui.html`
   - **OpenAPI Schema:** `https://emergency-alert-and-hospital-assistance.onrender.com/api-docs`
   - **Public Hospital Directory:** `curl -X GET https://emergency-alert-and-hospital-assistance.onrender.com/api/v1/hospitals`
