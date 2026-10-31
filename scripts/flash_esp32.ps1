# AstroVitals ESP32 Firmware Flashing Utility
# Team Orbitrix - NASA Space Apps Challenge 2026
# Target: ESP32-WROOM-32 on COM3

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AstroVitals ESP32 Universal Firmware Flash Utility" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$comPort = "COM3"
$firmwareDir = Join-Path $PSScriptRoot "..\firmware"

Set-Location $firmwareDir

Write-Host "`n[1/2] Compiling firmware binary with PlatformIO..." -ForegroundColor Yellow
pio run

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Firmware compilation failed. Please check build errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/2] Ready to flash to $comPort..." -ForegroundColor Green
Write-Host "`nIMPORTANT HARDWARE STEP FOR ESP32 DEV BOARDS:" -ForegroundColor White
Write-Host "If the upload hangs on 'Connecting................', press and HOLD the 'BOOT' button" -ForegroundColor Yellow
Write-Host "on your ESP32 board for 2 seconds until the writing progress percentage appears.`n" -ForegroundColor Yellow

pio run --target upload

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS: AstroVitals Firmware Flash Complete!" -ForegroundColor Green
    Write-Host "  ESP32 is now running AstroVitals v2.1.0 Universal Wi-Fi." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "`n[NOTICE] Upload exited with code $LASTEXITCODE." -ForegroundColor Yellow
    Write-Host "To put the ESP32 board in download mode:" -ForegroundColor White
    Write-Host "1. Press and hold the BOOT button on the ESP32." -ForegroundColor White
    Write-Host "2. Tap the EN/RST button once while holding BOOT." -ForegroundColor White
    Write-Host "3. Release the BOOT button, then run this script again." -ForegroundColor White
}

