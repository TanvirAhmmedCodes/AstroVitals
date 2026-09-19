import sys
import os
sys.path.insert(0, os.path.abspath("."))
from scripts.simulate_wearable import WearableSimulator, ASTRONAUTS

print("--- TESTING PHYSIOLOGICAL VARIATION ---")
for aid in ASTRONAUTS:
    sim = WearableSimulator(aid)
    hrs = [sim.tick()["heart_rate_bpm"] for _ in range(5)]
    print(f"[{aid}] Sample HRs: {hrs}")
    assert len(set(hrs)) > 1, f"Expected varied values for {aid}, got {hrs}"

print("\n--- 15-TICK DETAILED TRACE FOR ASTRONAUT-A ---")
sim_a = WearableSimulator("astronaut-A")
for t in range(15):
    d = sim_a.tick()
    print(f"Tick {t+1:2d} | HR {d['heart_rate_bpm']:5.1f} | SpO2 {d['spo2_pct']:4.1f}% | Temp {d['skin_temp_c']:5.2f}C | Activity: {d['activity_state']:8s} | Rad: {d['radiation_dose_uSv_cumulative']:.5f} uSv")

print("\n[ALL SIMULATOR TESTS PASSED!]")
