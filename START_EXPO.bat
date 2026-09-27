@echo off
title Sahaas - Expo Dev Server
color 0A

echo.
echo  ============================================================
echo    SAHAAS ^| Emergency Incident Response App
echo    Powered by SOTE AI
echo  ============================================================
echo.

echo  [STEP 1] Adding Firewall Rule for Expo Metro (port 8081)...
netsh advfirewall firewall delete rule name="Expo Metro 8081" >nul 2>&1
netsh advfirewall firewall add rule name="Expo Metro 8081" protocol=TCP dir=in localport=8081 action=allow >nul 2>&1

if %errorlevel%==0 (
    echo  [OK] Firewall rule added for port 8081.
) else (
    echo  [!!] Could not add firewall rule.
    echo       Right-click this file and choose "Run as Administrator".
    pause
    exit /b 1
)

echo.
echo  [STEP 2] Checking local environment configuration...

if not exist ".env.local" (
    echo  [!!] .env.local was not found.
    echo       Copy .env.example to .env.local and configure it first.
    echo.
    pause
    exit /b 1
)

echo  [OK] .env.local found.

echo.
echo  [STEP 3] Starting Expo Dev Server with LAN mode...
echo.
echo  ----------------------------------------------------------
echo   Scan the QR code with Expo Go on your phone.
echo   Make sure your phone and PC are on the SAME Wi-Fi.
echo  ----------------------------------------------------------
echo.

cd /d "%~dp0"
npx expo start --lan --clear

pause
