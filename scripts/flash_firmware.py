"""AstroVitals ESP32 Firmware Flasher.

Uses esptool with extended connection attempts (25 attempts)
to provide a comfortable window for pressing the hardware BOOT button.

Team Orbitrix - NASA Space Apps Challenge 2026
License: Apache-2.0
"""

import sys
import subprocess
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
build_dir = root_dir / "firmware" / ".pio" / "build" / "esp32dev"

bootloader = build_dir / "bootloader.bin"
partitions = build_dir / "partitions.bin"
firmware = build_dir / "firmware.bin"

if not firmware.exists():
    print(f"[ERROR] Firmware binary not found at {firmware}. Please run pio run first.")
    sys.exit(1)

cmd = [
    sys.executable,
    "-m",
    "esptool",
    "--chip",
    "esp32",
    "--port",
    "COM3",
    "--baud",
    "115200",
    "--connect-attempts",
    "30",
    "write-flash",
    "-z",
    "0x1000",
    str(bootloader),
    "0x8000",
    str(partitions),
    "0x10000",
    str(firmware),
]

print("==========================================================")
print("  ASTROVITALS ESP32 DIRECT FLASHER (115200 BAUD)")
print("  Port: COM3 | Baud: 115200 | Timeout window: ~35 seconds")
print("==========================================================")
print("\nHARDWARE INSTRUCTION:")
print("Press and keep holding the 'BOOT' button on the ESP32.")
print("Do NOT release it until you see 'Writing at 0x00001000...'!\n")

res = subprocess.run(cmd)
sys.exit(res.returncode)

