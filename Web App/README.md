# Emergency Alert and Hospital Assistance System — Web App

**Project:** B.Tech Community Service Project (CSP)  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT), Guntur, AP  
**Department:** Computer Science and Engineering (Batch 8)  
**Prepared by:** VSK (Reg. No: 24BQ1A054O)  
**Project Guide:** Mr. G. Lakshmi Narayana, Assistant Professor  

**Live Production URL:** [https://emergency-alert-and-hospital-assist.vercel.app](https://emergency-alert-and-hospital-assist.vercel.app)  
**Backend API:** [https://emergency-alert-and-hospital-assistance.onrender.com](https://emergency-alert-and-hospital-assistance.onrender.com)  

---

## Overview

The Web Platform serves as the central command, triage, and multi-role operations dashboard for the Emergency Alert and Hospital Assistance System. It provides four specialized, authenticated dashboards:

1. **System Administrator (`/admin`):** Comprehensive system telemetry, user management, hospital license verification, volunteer certification approvals, and audit trail.
2. **Hospital Staff (`/hospital`):** Real-time inbound emergency queue, 1-click Acknowledge, Accept, or Decline (with mandatory clinical rationale), 6-stage patient preparation pipeline, and bed/ICU capacity management.
3. **First Responder (`/responder`):** Real-time duty availability toggle synced to GPS, atomic mission claiming radar, turn-by-turn workflow (`EN_ROUTE` -> `ARRIVED` -> `ASSISTANCE_STARTED` -> `PATIENT_HANDED_OVER`), and OpenStreetMap directions.
4. **Citizen / Patient (`/citizen`):** 1-click tactile emergency SOS (`MANUAL_SOS`), active incident tracking with real-time status updates, smartwatch IMU connection monitor, nearby hospital discovery, and digital medical ID card.

---

## Technology Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **State Management:** Zustand (AuthStore, EmergencyStore, NotificationStore, HospitalStore)
- **Routing:** React Router v7 with dynamic role-based redirection (`DashboardRouter`)
- **Real-Time Communication:** STOMP WebSocket + Server-Sent Events (SSE) fallback
- **Mapping:** Leaflet + OpenStreetMap (`react-leaflet`)
- **Authentication:** Stateless JWT with dual login modes (Institutional Email/Password & Citizen Phone OTP)
- **Hosting & Deployment:** Vercel SPA with `/api` reverse-proxy routing to Render backend

---

## Scripts

```bash
npm run dev        # Start Vite dev server on http://localhost:5173
npm run build      # TypeScript compile and Vite production build
npm run preview    # Preview production bundle locally
```
