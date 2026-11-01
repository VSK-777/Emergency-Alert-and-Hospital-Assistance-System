# BRAND IDENTITY & APPLICATION ICON GUIDELINES
## Emergency Alert and Hospital Assistance System
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Department:** Computer Science and Engineering  
**Project Category:** Community Service Project (CSP) — Batch 8  
**Project Guide:** Mr. G. Lakshmi Narayana, Assistant Professor  
**Prepared By:** VSK (Reg. No: 23BQ1A05AG)  

---

## 1. Brand Ecosystem Overview

The **Emergency Alert and Hospital Assistance System** brand identity unites three specialized client applications into one cohesive, life-saving healthcare technology ecosystem. Each icon maintains immediate familial recognition while boldly communicating its distinct operational platform:

```
[VVIT CSP Watch]             [Emergency Alert]            [Emergency Alert & Asst.]
Wear OS Smartwatch           Flutter Mobile App           React + Vite Web Command
------------------           ------------------           -------------------------
Deep Crimson / Charcoal      Trust Blue / Navy            Deep Command Purple / Navy
Continuous IMU & SOS         GPS, Discovery & Responders  4-Role Grid Coordination
```

---

## 2. Common Visual Design System

All three applications adhere to a unified aesthetic standard:

| Design Dimension | Standard Specification |
| :--- | :--- |
| **Corner Curvature** | Rounded Squircle ($r = 108\text{px}$ on $512\text{px}$ canvas, $\approx 21\%$ radius) |
| **Lighting Direction** | Top-center to top-left diagonal specular illumination ($\theta = 135^\circ$) |
| **Depth & Elevation** | Multi-stage drop shadows with ambient diffusion ($\Delta y = 12\text{px}\dots 14\text{px}$, $\sigma = 16\text{px}$, opacity 55–60%) |
| **Central Symbolism** | High-contrast clinical medical cross coupled with life-rhythm ECG cardiac pulse |
| **Legibility Standard** | Pixel-sharp down to $16\text{px} \times 16\text{px}$ and $32\text{px} \times 32\text{px}$ |
| **Restricted Practices** | No cluttered text, no promotional ribbons, no low-contrast elements |

---

## 3. Platform Icon Identifications

### 3.1 Smartwatch Application: VVIT CSP Watch
- **Display Label:** `VVIT CSP Watch`
- **Target Platform:** Wear OS Smartwatches (Android API 26+)
- **Purpose:** Autonomous 50Hz IMU vehicle impact & traumatic fall detection with physical emergency SOS.
- **Palette:**
  - Deep Crimson (`#B71C1C`)
  - Emergency Red (`#D32F2F`)
  - Bright Coral (`#FF5252`)
  - Dark Charcoal (`#171717` / `#242120`)
  - Pure White (`#FFFFFF`)
- **Symbolism:**
  - Circular watch bezel ring with metallic edge highlight and tactical side crown button.
  - Dark sapphire watch display surrounded by concentric radar sweep arcs.
  - Centered clinical emergency cross and high-amplitude cardiac ECG pulse spike.
- **Form Factors & Assets:**
  - Square launcher icon (`ic_launcher.png`)
  - Circular launcher icon (`ic_launcher_round.png`) for round Wear OS displays
  - Adaptive icon (`mipmap-anydpi-v26/ic_launcher.xml` with foreground & background)
  - Monochrome silhouette vector for Android 13+ material themed icons

### 3.2 Mobile Application: Emergency Alert
- **Display Label:** `Emergency Alert`
- **Target Platform:** Flutter Android (API 21+) and Apple iOS
- **Purpose:** Citizen emergency dispatch, smartwatch BLE bridging, hospital & ambulance discovery, responder mobilization, offline first aid.
- **Palette:**
  - Trust Blue (`#1565C0`)
  - Royal Navy (`#0D47A1` / `#0A192F`)
  - Bright Azure (`#1E88E5`)
  - Emergency Red (`#D32F2F`)
  - Pure White (`#FFFFFF`)
- **Symbolism:**
  - Modern curved smartphone silhouette with dynamic speaker island and edge trim.
  - Pulsing ECG telemetry waveform leaping into a radiant emergency cross.
  - Concentric GPS location beacon waves symbolizing responder dispatch and hospital routing.
- **Form Factors & Assets:**
  - Android mipmap densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`)
  - Android adaptive icon foreground, background, and monochrome vector
  - Apple iOS `Assets.xcassets/AppIcon.appiconset` (15 variants from 20pt to 1024pt)

### 3.3 Web Platform: Emergency Alert & Hospital Assistance
- **Display Label:** `Emergency Alert & Hospital Assistance`
- **Target Platform:** React + Vite Web Command Center & PWA
- **Purpose:** Centralized operational hub for System Administrators, Hospital Clinicians, First Responders, and Citizens.
- **Palette:**
  - Deep Command Purple (`#4527A0`)
  - Regal Violet (`#6A1B9A` / `#7C3AED`)
  - Deep Midnight Navy (`#0F0C2E` / `#090D16`)
  - Healthcare Blue (`#1565C0`)
  - Neon Violet/Cyan (`#A78BFA` / `#818CF8`)
- **Symbolism:**
  - Operations command monitor with widescreen bezel and sturdy stand.
  - 4-quadrant coordination nodes representing the four platform roles:
    - Top-Left: System Administrator (Purple)
    - Top-Right: Hospital Staff (Red)
    - Bottom-Left: First Responder (Blue)
    - Bottom-Right: Citizen / Patient (Green)
  - Interconnecting telemetry arcs feeding into a central clinical emergency cross.
- **Form Factors & Assets:**
  - Vector SVG favicon (`public/favicon.svg`)
  - Multi-resolution ICO (`public/favicon.ico`: 16x16, 32x32, 48x48)
  - High-resolution web icons (16, 32, 48, 64, 128, 180, 192, 512px)
  - PWA manifest icons (`pwa-192x192.png`, `pwa-512x512.png`)
  - Apple touch icon (`apple-touch-icon.png`, 180x180)

---

## 4. Asset Directory Map

```
docs/branding/
|-- brand_preview.png                     (Visual brand showcase)
|-- density_preview.png                   (Multi-density scale verification)
|-- branding-guidelines.md                (This document)
|
|-- watch-app/
|   |-- master/
|   |   `-- watch_icon_1024.png           (1024x1024 Master High-Res)
|   |-- svg/
|   |   |-- watch_icon_master.svg         (Scalable Vector Master)
|   |   |-- watch_icon_foreground.svg     (Adaptive Foreground Vector)
|   |   |-- watch_icon_background.svg     (Adaptive Background Vector)
|   |   `-- watch_icon_monochrome.svg     (Themed Icon Vector)
|   |-- png/
|   |   |-- watch_icon_512.png
|   |   |-- watch_icon_192.png
|   |   |-- watch_icon_144.png
|   |   |-- watch_icon_96.png
|   |   |-- watch_icon_72.png
|   |   |-- watch_icon_48.png
|   |   `-- watch_icon_36.png
|   |-- adaptive/
|   |   |-- watch_foreground_1024.png
|   |   `-- watch_background_1024.png
|   `-- monochrome/
|       `-- watch_monochrome_1024.png
|
|-- mobile-app/
|   |-- master/
|   |   `-- mobile_icon_1024.png          (1024x1024 Master High-Res)
|   |-- svg/
|   |   |-- mobile_icon_master.svg        (Scalable Vector Master)
|   |   |-- mobile_icon_foreground.svg    (Adaptive Foreground Vector)
|   |   |-- mobile_icon_background.svg    (Adaptive Background Vector)
|   |   `-- mobile_icon_monochrome.svg    (Themed Icon Vector)
|   |-- png/
|   |   |-- mobile_icon_512.png
|   |   |-- mobile_icon_192.png
|   |   |-- mobile_icon_144.png
|   |   |-- mobile_icon_96.png
|   |   |-- mobile_icon_72.png
|   |   `-- mobile_icon_48.png
|   |-- android/
|   |   |-- mobile_foreground_1024.png
|   |   |-- mobile_background_1024.png
|   |   `-- mobile_monochrome_1024.png
|   `-- ios/
|       |-- Icon-App-20x20@1x.png ... Icon-App-1024x1024@1x.png (13 files)
|
`-- web-app/
    |-- master/
    |   `-- web_icon_1024.png             (1024x1024 Master High-Res)
    |-- svg/
    |   |-- web_icon_master.svg           (Scalable Vector Master)
    |   `-- web_icon_favicon.svg          (High-Contrast Vector Favicon)
    |-- png/
    |   |-- web_icon_512.png ... web_icon_16.png (8 files)
    `-- favicon/
        |-- favicon.ico                   (Multi-size 16/32/48 ICO)
        |-- favicon-16x16.png
        |-- favicon-32x32.png
        |-- favicon-48x48.png
        |-- apple-touch-icon.png          (180x180)
        |-- pwa-192x192.png
        `-- pwa-512x512.png
```

---

## 5. Application Integration Checklist

- [x] **Smart Watch App:** Installed mipmap densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) for `ic_launcher` and `ic_launcher_round`. Configured adaptive foreground, background, monochrome vectors, and updated `AndroidManifest.xml` with label `VVIT CSP Watch`.
- [x] **Flutter Mobile App:** Installed Android mipmaps and adaptive vector/drawable layers. Populated iOS `AppIcon.appiconset` with 15 standard assets. Updated `AndroidManifest.xml` label to `Emergency Alert`.
- [x] **React Web App:** Installed SVG favicon, multi-resolution `.ico`, PNG favicons, PWA icons, and apple-touch-icon into `public/`. Updated `index.html` link tags and registered `manifest.json`.
