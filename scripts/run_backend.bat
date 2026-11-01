@echo off
echo =====================================================================
echo Starting Spring Boot Backend (Development Mode - In-Memory H2)
echo VVIT B.Tech CSE Batch 8 - Emergency Alert & Hospital Assistance System
echo =====================================================================
echo.
cd /d "%~dp0..\Backend"
set SPRING_PROFILES_ACTIVE=dev
call mvn spring-boot:run
