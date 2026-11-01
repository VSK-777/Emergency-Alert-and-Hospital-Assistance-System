# Environment Verification Report

**Project:** Emergency Alert and Hospital Assistance System  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT)  
**Programme:** B.Tech CSE (Batch 8)  
**Date:** October 29, 2026  
**Investigator:** VSK  

---

## 1. Toolchain & Runtime Availability

| Component | Detected Version / Details | Status | Notes |
|-----------|----------------------------|--------|-------|
| **OS** | Windows 11 (Version 10.0.26300.9711) | Verified | Native powershell / pwsh available |
| **Java** | Oracle JDK 21.0.8 (`C:\Program Files\Java\jdk-21`) / Java 26 preview | Verified | Maven targets Java 21 LTS |
| **Maven** | Apache Maven 3.9.11 (`C:\Maven\apache-maven-3.9.11`) | Verified | Standard CLI build tool for Backend |
| **Flutter SDK** | Flutter 3.44.8 (Channel stable, `C:\src\flutter`) | Verified | Framework revision 058e0af2c2 |
| **Dart SDK** | Dart 3.12.2 | Verified | Bundled with Flutter 3.44.8 |
| **Android SDK** | Android SDK 36.1, build-tools 36.0.0 (`C:\Users\Lenovo\AppData\Local\Android\Sdk`) | Verified | Configured in AppData |
| **Android Studio** | Android Studio installed with JBR 21 (`C:\Program Files\Android\Android Studio\jbr`) | Verified | Full IDE toolchain installed |
| **ADB** | Android Debug Bridge version 1.0.41 (37.0.0-14910828) | Verified | Located at `C:\Users\Lenovo\AppData\Local\Android\Sdk\platform-tools\adb.exe` |
| **Emulators** | `Pixel_9_Pro` (Mobile), `Wear_OS_Round` (Smartwatch) | Verified | Both required target AVDs already created |
| **MySQL Service** | MySQL Community Server 9.5.0 (`MySQL95` Windows Service: Running) | Verified | Database engine installed and active |
| **Git** | git version 2.50.1.windows.1 | Verified | Version control available |

---

## 2. Platform Build Capabilities

1. **Java 21 Spring Boot Backend:** Supported natively via Maven (`mvn clean test`, `mvn package`). Dual database support: MySQL 9.5 for production/docker and H2 in-memory profile for isolated unit/integration testing without credential coupling.
2. **Flutter Mobile Application:** Supported natively via Flutter CLI (`flutter test`, `flutter build`).
3. **Wear OS Smartwatch Application:** Supported natively via Gradle Wrapper targeting Android Wear OS SDK / Kotlin.
4. **Hardware Validation Status:** Physical smartwatch is not connected over USB. Testing strategy utilizes the configured `Wear_OS_Round` emulator and an automated sensor-event replay harness with standard simulated telemetry payloads (acceleration spike, angular velocity spike, stillness period). Physical hardware validation remains logged as an outstanding deployment verification step.

---

## 3. Database Credentials & Configuration Strategy

- MySQL 9.5 service is running locally.
- In accordance with security guidelines, credentials are not hardcoded into code.
- `.env.example` and `application.properties` read from `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.
- In-memory H2 profile (`spring.profiles.active=test` or fallback) allows 100% independent and verifiable automated test execution.
