# Deployment Guide: Emergency Alert and Hospital Assistance System
## Full-Stack Deployment: Render (Backend) + Vercel (Frontend)

**Project Name:** Emergency Alert and Hospital Assistance System  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Department:** Computer Science and Engineering — Batch 8  
**Prepared By:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana (Assist. Prof)

---

## 1. Architecture Overview

```
                      +---------------------------------------+
                      |         Vercel (Frontend Web)         |
                      |   React 19 + TypeScript + Vite SPA    |
                      | https://emergency-assistance.vercel.app|
                      +-------------------+-------------------+
                                          |
                                          | HTTPS / SSE (EventSource)
                                          v
                      +---------------------------------------+
                      |          Render (Backend API)         |
                      |   Spring Boot 3.3.4 (Java 21 Docker)  |
                      | https://...onrender.com/api/v1/...    |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
              [In-Memory H2 (Dev)]             [Cloud PostgreSQL / MySQL]
          Pre-seeded emergency data               Persistent database
```

---

## 2. Environment Variables Specification

### A. Backend Environment Variables (Render)

| Environment Variable | Required | Default Value | Description |
|---|---|---|---|
| `PORT` | **Yes** | `8080` | HTTP port exposed by Spring Boot (Render auto-detects `8080`). |
| `SPRING_PROFILES_ACTIVE` | **Yes** | `dev` | `dev` = Zero-config H2 in-memory DB with pre-seeded hospitals, responders, ambulances, and mock incidents.<br>`postgres` = PostgreSQL database (e.g. Render Postgres).<br>`mysql` = MySQL database. |
| `APP_JWT_SECRET` | **Yes** | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit Base64/Hex secret key for signing JWT tokens. |
| `APP_JWT_EXPIRATION_MS` | No | `86400000` | JWT token lifetime in milliseconds (86400000 = 24 hours). |
| `SPRING_DATASOURCE_URL` | If DB profile | - | JDBC connection string (e.g. `jdbc:postgresql://<host>:5432/<db>`). |
| `SPRING_DATASOURCE_USERNAME` | If DB profile | - | Database username. |
| `SPRING_DATASOURCE_PASSWORD` | If DB profile | - | Database password. |
| `GEMINI_API_KEY` | Optional | - | Google Gemini AI key for real-time triage risk summarization. |

### B. Frontend Environment Variables (Vercel)

| Environment Variable | Required | Default Value | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | **Yes** (Prod) | `https://<your-render-app>.onrender.com` | Full HTTPS URL of your deployed Render backend. |
| `VITE_MAP_TILE_URL` | No | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | OpenStreetMap tile server URL. |

---

## 3. Step 1: Deploy Backend to Render

1. Sign in to **[dashboard.render.com](https://dashboard.render.com/)**.
2. Click **New +** -> **Web Service**.
3. Choose **Build and deploy from a Git repository**, and connect your GitHub repo:
   `https://github.com/VSK-777/Emergency-Alert-and-Hospital-Assistance-System`
4. Configure the Web Service settings:
   - **Name:** `emergency-alert-and-hospital-assistance-backend`
   - **Region:** Any (e.g., `Singapore`, `Frankfurt`, or `Oregon`)
   - **Branch:** `main`
   - **Root Directory:** `Backend`
   - **Runtime:** `Docker`
   - **Instance Type:** `Free` (512 MB RAM)
5. Under **Environment Variables**, add:
   - `PORT` = `8080`
   - `SPRING_PROFILES_ACTIVE` = `dev`
   - `APP_JWT_SECRET` = `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`
6. Click **Create Web Service**.
7. Wait 2–3 minutes for the Docker container to build. Once deployed, Render will provide a public URL:
   `https://emergency-alert-and-hospital-assistance-backend.onrender.com`
8. Verify the backend is live by opening:
   `https://emergency-alert-and-hospital-assistance-backend.onrender.com/swagger-ui.html`

---

## 4. Step 2: Deploy Frontend to Vercel

### Option A: 1-Click Instant Preview (Already Deployed)
A live preview deployment has already been triggered:
- **Instant Preview URL:** `https://brisk-orion-famlllt.tmp.now`
- **Claim to your Vercel Account:** `https://vercel.com/claim-deployment?code=f72a67c9-5307-4867-8acc-1c386ca35dfc`

### Option B: Permanent Production Deployment via Vercel Dashboard
1. Sign in to **[vercel.com](https://vercel.com/)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository:
   `https://github.com/VSK-777/Emergency-Alert-and-Hospital-Assistance-System`
4. In the Project Configuration:
   - **Project Name:** `emergency-alert-and-hospital-assistance-system`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `Web App`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://emergency-alert-and-hospital-assistance-backend.onrender.com` (from Step 1)
6. Click **Deploy**.
7. Vercel will build and assign your production domain:
   `https://emergency-alert-and-hospital-assistance-system.vercel.app`

---

## 5. Deployed Demo Credentials

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **System Admin** | `admin@emergency.com` | `admin123` | Complete emergency triage, full system logs, device & hospital management |
| **Hospital Staff** | `hospital@emergency.com` | `hospital123` | Bed tracking, hospital load status, ambulance dispatch |
| **Field Responder** | `responder@emergency.com` | `responder123` | Active rescue dispatch, incident verification, status updates |
