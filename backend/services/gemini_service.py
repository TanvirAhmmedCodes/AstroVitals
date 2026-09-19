import os
from pathlib import Path
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()


CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.active_model = None
        self.is_ready = False
        self.client = None

        if not api_key:
            print("[GeminiService] Warning: GEMINI_API_KEY not found in environment.")
            return

        try:
            self.client = genai.Client(api_key=api_key)
        except Exception as e:
            print(f"[GeminiService] Client init failed: {e}")
            return

        prompt_path = Path(__file__).parent.parent / "prompts" / "system_prompt.txt"
        self.system_prompt = prompt_path.read_text(encoding="utf-8") if prompt_path.exists() else ""

    def warmup(self) -> bool:
        """Warm up Gemini API connection and determine best responsive flash model."""
        if not self.client:
            print("[GeminiService] Cannot warmup: client not initialized.")
            return False

        for model_name in CANDIDATE_MODELS:
            try:
                resp = self.client.models.generate_content(
                    model=model_name,
                    contents="System status check: reply 'READY' in one word.",
                    config=types.GenerateContentConfig(max_output_tokens=10),
                )
                if resp and resp.text:
                    self.active_model = model_name
                    self.is_ready = True
                    print(f"[GeminiService] Auto-warm SUCCESS with model '{model_name}': {resp.text.strip()[:30]}")
                    return True
            except Exception as e:
                print(f"[GeminiService] Model '{model_name}' warmup attempt failed: {e}")
                continue

        self.is_ready = False
        return False

    async def chat(self, message: str, history: Optional[List[Dict[str, str]]] = None, context: Optional[Dict[str, Any]] = None) -> str:
        """Send chat message with live contextual telemetry and historical awareness."""
        ctx_str = self._format_context(context or {})
        history_str = self._format_history(history or [])
        full_message = f"[MISSION CONTEXT]\n{ctx_str}\n\n[RECENT CHAT HISTORY]\n{history_str}\n\n[ASTRONAUT MESSAGE]\n{message}"

        if not self.client:
            return self._offline_fallback(message, context)

        target_model = self.active_model or "gemini-3.5-flash-lite"
        models_to_try = [target_model] + [m for m in CANDIDATE_MODELS if m != target_model]

        for model_name in models_to_try:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=full_message,
                    config=types.GenerateContentConfig(
                        system_instruction=self.system_prompt,
                        temperature=0.7,
                        top_p=0.95,
                        max_output_tokens=1024,
                    ),
                )
                if response and response.text:
                    self.active_model = model_name
                    self.is_ready = True
                    return response.text
            except Exception as e:
                print(f"[GeminiService] Error with {model_name}: {e}")
                continue

        return self._offline_fallback(message, context)

    def _format_context(self, context: Dict[str, Any]) -> str:
        vitals = context.get("current_vitals", {})
        risk = context.get("current_risk", {})
        rad = context.get("radiation", {})

        hr = vitals.get("heart_rate_bpm", "72.0")
        spo2 = vitals.get("spo2_pct", "98.0")
        temp = vitals.get("skin_temp_c", "36.5")
        act = vitals.get("activity_state", "rest")
        rad_dose = vitals.get("radiation_dose_uSv_cumulative", "12.5")
        anom = vitals.get("is_anomaly", False)

        lines = [
            f"Mission Day: {context.get('mission_day', 42)} | Module: ISS Zarya Core | Comms: Direct LEO",
            f"Astronaut: {context.get('astronaut_name', 'Astronaut')} ({context.get('astronaut_id', 'crew-member')})",
            "Real-Time Vitals:",
            f"  - Heart Rate: {hr} BPM (Baseline: 72.0 BPM, Delta: {vitals.get('hr_delta_pct', 0.0)}%)",
            f"  - SpO2: {spo2}% (Baseline: 98.0%, Delta: {vitals.get('spo2_delta_pct', 0.0)}%)",
            f"  - Skin Temperature: {temp} C",
            f"  - Activity State: {act}",
            f"  - Cumulative Radiation: {rad_dose} uSv (Career Limit: 600 mSv, SPE Limit: 250 mSv)",
            f"  - In South Atlantic Anomaly: {rad.get('in_south_atlantic_anomaly', False)}",
            f"  - Real-Time Anomaly Flag: {'ACTIVE ALERT' if anom else 'NOMINAL'}",
            "Risk Assessment (NASA OSDR / HRP Evidence Base):",
            f"  - Cardiovascular Risk: {risk.get('cardiovascular', {}).get('score', 12)}/100 (Model R2: -0.43)",
            f"  - Sleep & Behavioral: {risk.get('sleep_behavioral', {}).get('score', 8)}/100 (Model R2: -0.35)",
            f"  - Immune Function: {risk.get('immune', {}).get('score', 5)}/100 (Model R2: -0.17)",
            f"  - Cognitive Resilience: {risk.get('cognitive', {}).get('score', 78)}/100 (Norm: ESA COGNISPACE)",
            "Honest Disclosure: Models trained on NASA OSDR Inspiration4 (28 unique subjects). Negative R2 reflects sample constraints. Always advise consulting flight surgeon.",
        ]
        return "\n".join(lines)

    def _format_history(self, history: List[Dict[str, str]]) -> str:
        if not history:
            return "No previous messages in this session."
        lines = []
        for msg in history[-6:]:  # Keep last 6 exchanges for context
            role = "Astronaut" if msg.get("role") in ["user", "astronaut"] else "AstroVitals"
            lines.append(f"{role}: {msg.get('content', '')}")
        return "\n".join(lines)

    def _offline_fallback(self, message: str, context: Optional[Dict[str, Any]]) -> str:
        """Compassionate autonomous medical companion fallback if API is unreachable."""
        vitals = (context or {}).get("current_vitals", {})
        hr = vitals.get("heart_rate_bpm", 72.0)
        is_anom = vitals.get("is_anomaly", False)
        raw_name = (context or {}).get("astronaut_name", "Explorer")
        first_name = raw_name.split()[0] if raw_name else "Explorer"

        if is_anom or (hr and hr > 120):
            return (
                f"Hi {first_name}! I'm Ori. I'm observing slightly elevated heart rate readings right now ({hr} BPM). "
                "Let's pause physical exertion together and take slow 4-7-8 calming breaths. Sip 500mL of electrolyte water. "
                "I'm keeping watch over your telemetry and will remain right beside you. Would you like me to guide a breathing exercise?"
            )
        return (
            f"Hi {first_name}! I'm Ori. Your telemetry is looking nominal and steady right now with a resting heart rate of {hr} BPM. "
            "Your cognitive score and recovery metrics look well-balanced for today's mission schedule. "
            "Remember to hydrate and take a gentle 5-minute breather before your next orbital task. How can I help you feel your best today?"
        )


# Singleton instance
gemini_service = GeminiService()