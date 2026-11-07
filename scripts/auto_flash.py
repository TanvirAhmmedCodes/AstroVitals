"""AstroVitals ESP32 Smart Firmware Flasher.

Uses PlatformIO's verified esptool toolchain to flash the complete image:
  - 0x1000: bootloader.bin
  - 0x8000: partitions.bin
  - 0xe000: boot_app0.bin
  - 0x10000: firmware.bin (v2.3.0-ds18b20-wifi)

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
boot_app0 = Path(r"C:\Users\tanvi\.platformio\packages\framework-arduinoespressif32\tools\partitions\boot_app0.bin")
firmware = build_dir / "firmware.bin"
esptool_exe = Path(r"C:\Users\tanvi\.platformio\packages\tool-esptool\esptool.exe")

if not firmware.exists():
    print(f"[ERROR] Firmware binary not found at {firmware}. Run pio run first.")
    sys.exit(1)

print("==========================================================")
print("  ASTROVITALS ESP32 AUTOMATED FIRMWARE FLASHER (COM3)")
print("==========================================================")
print("Target: ESP32-WROOM-32 on COM3")
print("Firmware: v2.3.0-ds18b20-wifi (DS18B20 1-Wire + I2C Suite)")
print("\n>>> INSTRUCTION: HOLD THE 'BOOT' BUTTON ON YOUR ESP32 NOW! <<<")
print("The flasher will retry connecting every few seconds.")
print("Keep holding BOOT until you see 'Writing at 0x00010000...'\n")

success = False
for attempt in range(1, 31):
    print(f"--- [Flash Attempt {attempt}/30] Connecting to COM3... ---")
    cmd = [
        str(esptool_exe),
        "--chip", "esp32",
        "--port", "COM3",
        "--baud", "115200",
        "--before", "default-reset",
        "--after", "hard-reset",
        "write-flash",
        "-z",
        "--flash-mode", "dio",
        "--flash-freq", "40m",
        "--flash-size", "4MB",
        "0x1000", str(bootloader),
        "0x8000", str(partitions),
        "0xe000", str(boot_app0),
        "0x10000", str(firmware),
    ]

    res = subprocess.run(cmd)
    if res.returncode == 0:
        success = True
        print("\n==========================================================")
        print("  SUCCESS! ASTROVITALS FIRMWARE FLASHED TO ESP32 (100%)!")
        print("==========================================================")
        print("Release the BOOT button now.")
        print("Reading live boot logs from COM3 (10 seconds)...\n")
        time.sleep(1.5)
        try:
            ser = serial.Serial("COM3", 115200, timeout=0.2)
            ser.dtr = False
            ser.rts = True
            time.sleep(0.1)
            ser.rts = False
            t_boot = time.time()
            while time.time() - t_boot < 10:
                raw = ser.readline()
                if raw:
                    line = raw.decode("utf-8", errors="replace").strip()
                    if line:
                        print(f"[ESP32] {line}")
            ser.close()
        except Exception as e:
            print(f"[SERIAL] Notice: {e}")
        sys.exit(0)
    else:
        print("[RETRY] Still waiting for BOOT button... keep BOOT held down.")
        time.sleep(1.5)

print("\n[TIMEOUT] All 15 attempts completed without connection.")
sys.exit(1)
