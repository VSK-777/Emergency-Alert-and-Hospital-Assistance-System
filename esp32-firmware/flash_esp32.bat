@echo off
title CSP Prototype V1 - ESP32 Hardware Deployment
cd /d "%~dp0"
echo ==============================================================
echo    CSP PROTOTYPE V1: ESP32 AUTOMATED FIRMWARE DEPLOYER
echo ==============================================================
echo.
python deploy_firmware.py
echo.
pause
