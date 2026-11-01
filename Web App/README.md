# Emergency Alert and Hospital Assistance System — Web App
## Modern Healthcare SaaS Platform (Light & Dark Theme)

**Project:** B.Tech Community Service Project (CSP)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT), Guntur, AP  
**Department:** Computer Science and Engineering (Batch 8)  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana, Assistant Professor  

**Live Production URL:** [https://emergency-alert-and-hospital-assistance-system.vercel.app](https://emergency-alert-and-hospital-assistance-system.vercel.app)  
**Backend API:** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)  

---

## Overview

The Web Platform serves as the central command, triage, and multi-role operations portal for the Emergency Alert and Hospital Assistance System. Designed with a clinical-grade Healthcare SaaS aesthetic, it features **Light Mode as default**, full **Dark Mode support** with an instant navbar switch, and four dedicated role dashboards:

1. **System Administrator (`/admin`):** Network command overview, active alerts counter, Wear OS telemetry, ICU availability, ambulance fleet status, volunteer response KPIs, interactive OpenStreetMap dispatch GIS with layer filters, and system audit logs.
2. **Hospital Staff (`/hospital`):** Emergency department triage center, inbound incident queue with clinical details, 1-click Accept / Decline (with clinical reason modal), trauma bay preparation milestones, and live bed/ICU capacity management.
3. **First Responder (`/responder`):** Volunteer field command with duty toggle (`AVAILABLE` / `OFF_DUTY`), GPS location synchronization, nearby unclaimed incident radar, and turn-by-turn routing with OpenStreetMap directions.
4. **Citizen / Patient (`/citizen`):** Reassuring emergency portal, real-time active incident tracking, paired Wear OS smartwatch telemetry (IMU 50Hz, battery, algorithm health), read-only nearby ER hospital directory, and personal Digital Medical ID card with voluntary profile fields and transparent emergency care invoices.

---

## Design System & Theme Architecture

- **Default Theme:** Light Mode (`#F5F7FA` page canvas, `#FFFFFF` crisp elevated cards, `#1F2937` primary text, `#E2E8F0` borders).
- **Dark Theme:** High-contrast Dark Mode (`#0B132B` / `#0F172A` deep navy, `#1E293B` cards, `#F8FAFC` crisp text).
- **Accent Palette:**
  - Primary Clinical Blue: `#1565C0`
  - Emergency Alert Red: `#D32F2F`
  - Success Indicator Green: `#16865C`
  - Warning Status Amber: `#D97706`
  - Wear OS Accent Purple: `#7C3AED`
- **Role Isolation:** Strict role-based navigation and route guards. Citizens cannot access other citizens' medical records or administrative device fleets; Hospital Staff and Responders only access their respective operational workflows.

---

## Technology Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **State Management:** Zustand (`authStore`, `emergencyStore`, `hospitalStore`, `notificationStore`, `themeStore`)
- **Routing:** React Router v7 with dynamic role-based redirection (`DashboardRouter`)
- **Real-Time Communication:** Server-Sent Events (SSE) stream (`/api/v1/emergencies/stream`) with STOMP WebSocket capability
- **GIS Mapping:** Leaflet + OpenStreetMap (`react-leaflet`) with custom emergency pulse markers
- **Authentication:** Stateless JWT with dual login modes (Institutional Email/Password & Citizen Phone OTP)
- **Hosting & Deployment:** Vercel SPA with `/api` reverse-proxy routing to Render backend

---

## Scripts

```bash
npm run dev        # Start Vite dev server on http://localhost:5173
npm run build      # TypeScript compile and Vite production build
npm run preview    # Preview production bundle locally
```
