# System Setup & Deployment Guide

**Project:** Emergency Alert and Hospital Assistance System  
**Institution:** Vasireddy Venkatadri Institute of Technology (VVIT - CSE Batch 8)  
**Author:** VSK  

---

## Prerequisites & Detected Environment

The system runs on the verified local environment:
- **Java:** Oracle JDK 21 LTS (`C:\Program Files\Java\jdk-21`)
- **Maven:** Apache Maven 3.9.11
- **Flutter:** Flutter 3.44.8 (Channel stable, `C:\src\flutter`)
- **Android SDK:** API 34/36 (`C:\Users\Lenovo\AppData\Local\Android\Sdk`)
- **Emulators:** `Pixel_9_Pro` (Mobile), `Wear_OS_Round` (Smartwatch)
- **Database:** MySQL Community Server 9.5 (`MySQL95` service running)

---

## 1. Running the Java Spring Boot Backend

### Option A: Zero-Config In-Memory Mode (Recommended for testing & evaluation)
The default `dev` profile boots with an in-memory H2 database running in MySQL compatibility mode. It automatically seeds demo users, emergency contacts, participating hospitals, and active responders.
```bash
cd "C:\Users\Lenovo\Desktop\VSK\B.Tech\CSP\Emergency Alert and Hospital Assistance System\Backend"
mvn spring-boot:run
```
- API Endpoint: `http://localhost:8080/api/v1`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- H2 Console: `http://localhost:8080/h2-console`

### Option B: Local MySQL 9.5 Production Profile
1. Ensure the Windows `MySQL95` service is running:
   ```powershell
   Get-Service -Name MySQL95
   ```
2. Set the active profile and database password:
   ```powershell
   $env:SPRING_PROFILES_ACTIVE = "mysql"
   $env:SPRING_DATASOURCE_PASSWORD = "your_mysql_password"
   mvn spring-boot:run
   ```
3. Database initialization scripts are located in:
   - `database/schema/01_init_schema.sql`
   - `database/seed/01_seed_data.sql`

---

## 2. Running the Flutter Mobile Application

### Step 1: Install Dependencies
```bash
cd "C:\Users\Lenovo\Desktop\VSK\B.Tech\CSP\Emergency Alert and Hospital Assistance System\Mobile App"
flutter pub get
```

### Step 2: Run Automated Tests
```bash
flutter test
```

### Step 3: Launch Application
- **Windows Desktop:**
  ```bash
  flutter run -d windows
  ```
- **Android Emulator (`Pixel_9_Pro`):**
  ```bash
  # Launch the mobile AVD
  & "C:\Users\Lenovo\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Pixel_9_Pro
  # Run app
  flutter run -d emulator-5554
  ```

---

## 3. Running the Wear OS Smartwatch Application

### Step 1: Launch Wear OS Emulator
```bash
& "C:\Users\Lenovo\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Wear_OS_Round
```

### Step 2: Build & Install Native Watch App
```bash
cd "C:\Users\Lenovo\Desktop\VSK\B.Tech\CSP\Emergency Alert and Hospital Assistance System\Smart Watch App"
$env:ANDROID_HOME = "C:\Users\Lenovo\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
.\gradlew.bat assembleDebug
& "C:\Users\Lenovo\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5556 install app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. Default Demonstration Credentials

| Role | Email | Password | Primary Details |
|------|-------|----------|-----------------|
| **Citizen (Patient)** | `patient.vsk@vvit.net` | `Password@123` | Sai Krishna VSK (Blood O+, Penicillin allergy) |
| **First Responder** | `responder@vvit.net` | `Password@123` | Ramesh Kumar T (Certified Emergency Paramedic) |
| **Hospital Staff** | `hospital.admin@aiims.edu.in` | `Password@123` | AIIMS Mangalagiri Trauma Chief |
| **System Admin** | `admin@vvit.net` | `Password@123` | CSP Administrator |
