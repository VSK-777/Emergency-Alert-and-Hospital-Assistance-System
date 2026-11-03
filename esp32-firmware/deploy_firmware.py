"""
=============================================================================
CSP PROTOTYPE V1 — AUTOMATED HARDWARE DEPLOYMENT UTILITY
=============================================================================
This script completely automates compiling and flashing the ESP32 Triage firmware.
Features:
  1. Auto-detects connected ESP32 boards on USB COM ports.
  2. Compiles the firmware sketch using Arduino CLI.
  3. Uploads the compiled binary to the ESP32 via UART.
  4. Automatically opens the Serial Monitor at 115200 baud to verify sensor init.
=============================================================================
"""

import os
import sys
import time
import subprocess
import serial.tools.list_ports

# Ensure instantaneous unbuffered console output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

ARDUINO_CLI = r"C:\Program Files\Arduino CLI\arduino-cli.exe"
SKETCH_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "ESP32_Triage_Firmware"))
FQBN = "esp32:esp32:esp32" # Standard ESP32 Dev Module / DevKit v1

def banner():
    print("=" * 65)
    print("   CSP PROTOTYPE V1 — AUTOMATED ESP32 DEPLOYMENT   ")
    print("=" * 65)

def find_esp32_port():
    print("[1/4] Scanning for connected ESP32 board...")
    ports = list(serial.tools.list_ports.comports())
    
    candidates = []
    for p in ports:
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        # Common ESP32 USB-to-UART chips: CP210x, CH340, FTDI, USB Serial
        if any(chip in desc or chip in hwid for chip in ["cp210", "ch340", "ch341", "usb serial", "uart"]):
            candidates.append(p.device)
            print(f"      -> Found candidate: {p.device} ({p.description})")

    if len(candidates) == 1:
        return candidates[0]
    elif len(candidates) > 1:
        print(f"      -> Multiple potential serial ports detected: {candidates}")
        return candidates[0]
    
    # Fallback to any available non-bluetooth COM port
    non_bt = [p.device for p in ports if "bluetooth" not in (p.description or "").lower()]
    if non_bt:
        return non_bt[0]

    return None

def compile_sketch():
    print(f"\n[2/4] Compiling firmware sketch ({SKETCH_PATH})...")
    if not os.path.exists(ARDUINO_CLI):
        print(f"[ERROR] Arduino CLI not found at: {ARDUINO_CLI}")
        return False

    cmd = [
        ARDUINO_CLI, "compile",
        "--fqbn", FQBN,
        SKETCH_PATH
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("[ERROR] Compilation failed:")
        print(res.stderr or res.stdout)
        return False
    print("      -> Compilation SUCCESSFUL! (Binary ready)")
    return True

def upload_sketch(port):
    print(f"\n[3/4] Uploading to ESP32 on {port}...")
    cmd = [
        ARDUINO_CLI, "upload",
        "-p", port,
        "--fqbn", FQBN,
        SKETCH_PATH
    ]
    print("      -> Upload in progress... (Hold 'BOOT' button on ESP32 if 'Connecting...' appears)")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print("      -> Upload SUCCESSFUL! Hardware flashed 100%.")
        return True

    # Fallback to esptool with precompiled merged binary if available
    merged_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "build", "ESP32_Triage_Firmware.ino.merged.bin"))
    if os.path.exists(merged_bin):
        print("      -> Trying fallback via esptool.py...")
        esptool_cmd = [
            sys.executable, "-m", "esptool",
            "--chip", "esp32",
            "--port", port,
            "--baud", "921600",
            "write_flash", "-z", "0x0", merged_bin
        ]
        res2 = subprocess.run(esptool_cmd, capture_output=True, text=True)
        if res2.returncode == 0:
            print("      -> Upload SUCCESSFUL via esptool! Hardware flashed 100%.")
            return True

    print(f"[ERROR] Upload to {port} failed:")
    print(res.stderr or res.stdout)
    return False

def monitor_serial(port):
    print(f"\n[4/4] Connecting to Serial Monitor on {port} (115200 baud)...")
    print("=" * 65)
    print("Press Ctrl+C at any time to exit monitor.")
    print("=" * 65)
    try:
        import serial
        ser = serial.Serial(port, 115200, timeout=1)
        time.sleep(0.5)
        # Pulse DTR to reset ESP32 and show boot logs
        ser.dtr = False
        time.sleep(0.1)
        ser.dtr = True
        while True:
            line = ser.readline().decode('utf-8', errors='replace')
            if line:
                print(line, end='')
    except KeyboardInterrupt:
        print("\n[INFO] Exited Serial Monitor.")
    except Exception as e:
        print(f"[INFO] Serial monitor closed: {e}")

def main():
    banner()
    
    port = find_esp32_port()
    if not port:
        print("\n[!] No ESP32 board detected on USB.")
        print("    Please connect your ESP32 board to your computer via USB data cable.")
        print("    Waiting 10 seconds for device...")
        for i in range(10):
            time.sleep(1)
            port = find_esp32_port()
            if port:
                break

    if not compile_sketch():
        sys.exit(1)

    if not port:
        print("\n[!] ESP32 is not plugged in yet.")
        print("    The firmware has been compiled successfully!")
        print("    Whenever you plug the ESP32 in, simply run 'flash_esp32.bat' to upload.")
        sys.exit(0)

    if not upload_sketch(port):
        sys.exit(1)

    monitor_serial(port)

if __name__ == "__main__":
    main()
