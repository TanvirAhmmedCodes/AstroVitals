"""AstroVitals Smart ESP32 Flash Loader.

Monitors COM3 for hardware bootloader signals.
As soon as the user enters download mode (HOLD BOOT -> TAP EN -> RELEASE BOOT),
it immediately locks in and flashes the firmware without auto-reset timing conflicts.

Team Orbitrix - NASA Space Apps Challenge 2026
License: Apache-2.0
"""

import sys
import time
import subprocess
from pathlib import Path
import serial

root_dir = Path(__file__).resolve().parent.parent
build_dir = root_dir / "firmware" / ".pio" / "build" / "esp32dev"

bootloader = build_dir / "bootloader.bin"
partitions = build_dir / "partitions.bin"
firmware = build_dir / "firmware.bin"

if not firmware.exists():
    print(f"[ERROR] Firmware binary not found at {firmware}. Run pio run first.")
    sys.exit(1)

print("==========================================================")
print("  ASTROVITALS SMART HARDWARE LOADER (COM3)")
print("==========================================================")
print("\nWaiting for you to trigger download mode on your ESP32.")
print("To trigger it:")
print("  1. Press and HOLD the 'BOOT' button.")
print("  2. TAP the 'EN' (or 'RST') button once.")
print("  3. RELEASE the 'BOOT' button.")
print("\nListening on COM3 for 90 seconds...\n")

detected = False
try:
    ser = serial.Serial("COM3", 115200, timeout=0.1)
except Exception as e:
    print(f"[ERROR] Could not open COM3: {e}")
    sys.exit(1)

t_start = time.time()
while time.time() - t_start < 90:
    raw = ser.readline()
    if raw:
        line = raw.decode("utf-8", errors="replace").strip()
        # Specifically look for download boot mode and avoid false positive on normal boot (0x13 or 0x17)
        if any(keyword in line for keyword in ["waiting for download", "DOWNLOAD_BOOT", "DOWNLOAD(USB", "boot:0x3 ", "boot:0x7 ", "boot:0x23 ", "boot:0x2b "]) or ("DOWNLOAD" in line and "FLASH" not in line):
            print(f"\n[OK] ESP32 DOWNLOAD MODE DETECTED: {line}")
            detected = True
            break
        elif "boot:0x13" in line or "boot:0x17" in line or "SPI_FAST_FLASH_BOOT" in line:
            print("[INFO] Normal boot detected. Remember to hold BOOT while tapping EN.")
        elif len(line) > 0 and ("AGRO" in line or "WiFi" in line or "Astro" in line or "SYSTEM" in line):
            print(f"[INFO] Chip running: {line[:50]}...")

ser.close()

if not detected:
    print("\n[TIMEOUT] Download mode not detected within 90 seconds.")
    print("You can run this anytime by executing in PowerShell:")
    print("  python scripts/auto_flash.py")
    sys.exit(1)

print("\nStarting high-speed flash writing (460800 baud)...")
time.sleep(0.5)

cmd = [
    sys.executable,
    "-m",
    "esptool",
    "--chip",
    "esp32",
    "--port",
    "COM3",
    "--baud",
    "460800",
    "--before",
    "no-reset",
    "write-flash",
    "-z",
    "0x1000",
    str(bootloader),
    "0x8000",
    str(partitions),
    "0x10000",
    str(firmware),
]

res = subprocess.run(cmd)
if res.returncode == 0:
    print("\n==========================================================")
    print("  SUCCESS! ASTROVITALS FIRMWARE FLASHED TO ESP32!")
    print("==========================================================")
    print("Tap the EN/RST button once if automatic reboot does not occur.")
    print("Monitoring COM3 for boot logs (12 seconds)...")
    time.sleep(1.0)
    try:
        ser = serial.Serial("COM3", 115200, timeout=0.2)
        ser.dtr = False
        ser.rts = True
        time.sleep(0.1)
        ser.rts = False
        print("\n--- ESP32 LIVE SERIAL BOOT LOGS ---")
        t_boot = time.time()
        while time.time() - t_boot < 12:
            raw = ser.readline()
            if raw:
                line = raw.decode("utf-8", errors="replace").strip()
                if line:
                    print(f"[ESP32] {line}")
        ser.close()
    except Exception as e:
        print(f"[SERIAL] Notice: {e}")
    sys.exit(0)

sys.exit(res.returncode)
