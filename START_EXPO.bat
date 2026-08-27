@echo off
title Sahaas — Expo Dev Server
color 0A

echo.
echo  ============================================================
echo    SAHAAS  ^|  Emergency Incident Response App
echo    Powered by Groq Llama 3.3 AI
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
echo  [STEP 2] Starting Expo Dev Server with LAN mode...
echo.
echo  ----------------------------------------------------------
echo   Scan the QR code below with Expo Go on your phone.
echo   Make sure your phone and PC are on the SAME Wi-Fi.
echo  ----------------------------------------------------------
echo.

cd /d "c:\Users\Aayush\Desktop\hmmmmm"
npx expo start --lan --clear

pause
