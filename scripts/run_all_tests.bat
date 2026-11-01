@echo off
echo =====================================================================
echo Emergency Alert and Hospital Assistance System - Test Suite Runner
echo B.Tech CSE Batch 8 Community Service Project (VVIT - VSK)
echo =====================================================================
echo.

echo [1/3] Running Java Spring Boot Backend Tests...
cd /d "%~dp0..\Backend"
call mvn test
if %errorlevel% neq 0 (
    echo [ERROR] Backend tests failed.
    exit /b %errorlevel%
)
echo [OK] Backend tests completed successfully.
echo.

echo [2/3] Running Flutter Mobile Application Tests...
cd /d "%~dp0..\Mobile App"
call flutter test
if %errorlevel% neq 0 (
    echo [ERROR] Flutter tests failed.
    exit /b %errorlevel%
)
echo [OK] Flutter mobile tests completed successfully.
echo.

echo [3/3] Running Wear OS Smartwatch Tests...
cd /d "%~dp0..\Smart Watch App"
set ANDROID_HOME=C:\Users\Lenovo\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Java\jdk-21
call gradlew.bat test
if %errorlevel% neq 0 (
    echo [ERROR] Smartwatch tests failed.
    exit /b %errorlevel%
)
echo [OK] Wear OS smartwatch tests completed successfully.
echo.
echo =====================================================================
echo ALL TEST SUITES PASSED!
echo =====================================================================
