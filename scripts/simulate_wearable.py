import argparse
import asyncio
import random
from datetime import datetime, timezone
from math import sin, pi
import httpx

ASTRONAUTS = {
    "astronaut-A": {"hr": 72, "spo2": 98.5, "temp": 36.5, "rr": 0.25, "seed": 101},
    "astronaut-B": {"hr": 78, "spo2": 97.8, "temp": 36.7, "rr": 0.28, "seed": 202},
    "astronaut-C": {"hr": 68, "spo2": 99.0, "temp": 36.3, "rr": 0.22, "seed": 303},
    "astronaut-D": {"hr": 74, "spo2": 98.2, "temp": 36.6, "rr": 0.26, "seed": 404},
}

class WearableSimulator:
    def __init__(self, astronaut_id):
        p = ASTRONAUTS.get(astronaut_id, ASTRONAUTS["astronaut-A"])
        self.aid = astronaut_id
        self.device_id = f"esp32-{astronaut_id[-1]}"
        self.p = p
        self.rng = random.Random(p["seed"])
        self.hr_noise = 0.0
        self.spo2_base = p["spo2"]
        self.temp_base = p["temp"]
        self.battery = 87.0
        self.rssi = -45.0
        # Baseline cumulative career dose on Mission Day 42: 12,500 uSv (12.5 mSv = 2.08% limit)
        # REMOVE simulator in production: ESP32 hardware sends real biosensor packet over Wi-Fi
        self.radiation = 12500.0
        self.activity = "rest"
        self.t = 0.0

    def tick(self):
        self.t += 1.0
        r = self.rng.random()
        if self.activity == "rest" and r < 0.015:
            self.activity = "active"
        elif self.activity == "active":
            if r < 0.007: self.activity = "exercise"
            elif r < 0.057: self.activity = "rest"
        elif self.activity == "exercise" and r < 0.03:
            self.activity = "active"

        rsa = 2.5 * sin(2 * pi * self.p["rr"] * self.t)
        self.hr_noise += self.rng.gauss(0, 0.3)
        self.hr_noise = max(-4, min(4, self.hr_noise))
        offset = {"rest": 0, "active": 8, "exercise": 45}[self.activity]
        hr = self.p["hr"] + rsa + self.hr_noise + offset + self.rng.gauss(0, 0.8)
        hr = round(max(45, min(180, hr)), 1)

        self.spo2_base += self.rng.gauss(0, 0.08)
        self.spo2_base = max(96.5, min(99.3, self.spo2_base))
        spo2 = self.spo2_base + self.rng.gauss(0, 0.15)
        if self.activity == "exercise": spo2 -= 0.8
        spo2 = round(max(94, min(100, spo2)), 1)

        self.temp_base += self.rng.gauss(0, 0.005)
        self.temp_base = max(36.2, min(36.9, self.temp_base))
        temp = self.temp_base + self.rng.gauss(0, 0.03)
        if self.activity == "exercise": temp += 0.3
        temp = round(temp, 2)

        scale = {"rest": 0.015, "active": 0.15, "exercise": 0.5}[self.activity]
        ax = round(self.rng.gauss(0, scale), 3)
        ay = round(self.rng.gauss(0, scale), 3)
        az = round(1.0 + self.rng.gauss(0, scale), 3)

        self.radiation += 0.00083 * self.rng.uniform(0.5, 1.5)
        self.battery = max(0, self.battery - 0.0001 + self.rng.gauss(0, 0.005))
        self.battery = round(self.battery, 1)
        self.rssi += self.rng.gauss(0, 1)
        self.rssi = max(-65, min(-35, self.rssi))

        return {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "heart_rate_bpm": hr,
            "spo2_pct": spo2,
            "skin_temp_c": temp,
            "accel_x_g": ax, "accel_y_g": ay, "accel_z_g": az,
            "activity_state": self.activity,
            "radiation_dose_uSv_cumulative": round(self.radiation, 3),
            "battery_pct": self.battery,
            "wifi_rssi": round(self.rssi, 1),
            "buffered": False,
        }

async def run_astronaut(client, aid, rate):
    sim = WearableSimulator(aid)
    while True:
        reading = sim.tick()
        try:
            r = await client.post("/api/v1/ingest/vitals", json={
                "device_id": sim.device_id, "astronaut_id": aid,
                "readings": [reading],
            })
            status = "OK" if r.status_code == 200 else f"ERR({r.status_code})"
        except Exception as e:
            status = f"FAIL({type(e).__name__})"
        print(f"[{aid[-1]}] {reading['timestamp_utc'][11:19]} | "
              f"HR {reading['heart_rate_bpm']:5.1f} | "
              f"SpO2 {reading['spo2_pct']:4.1f} | "
              f"T {reading['skin_temp_c']:5.2f} | "
              f"{reading['activity_state']:8s} | {status}")
        await asyncio.sleep(rate)

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--astronaut-id", default="astronaut-A")
    ap.add_argument("--all-astronauts", action="store_true")
    ap.add_argument("--rate", type=float, default=1.0)
    ap.add_argument("--backend", default="http://127.0.0.1:8080")
    args = ap.parse_args()
    async with httpx.AsyncClient(base_url=args.backend, timeout=10) as c:
        if args.all_astronauts:
            await asyncio.gather(*[run_astronaut(c, a, args.rate) for a in ASTRONAUTS])
        else:
            await run_astronaut(c, args.astronaut_id, args.rate)

if __name__ == "__main__":
    asyncio.run(main())
