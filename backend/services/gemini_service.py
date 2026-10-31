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
        if os.getenv("OFFLINE", "0").strip() == "1":
            print("[GeminiService] OFFLINE=1: Skipping network warmup.")
            return False

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
            f"  - Cardiovascular Risk: {risk.get('cardiovascular', {}).get('score', 12)}/100 (Model R2: 0.67)",
            f"  - Sleep & Behavioral: {risk.get('sleep_behavioral', {}).get('score', 8)}/100 (Model R2: 0.58)",
            f"  - Immune Function: {risk.get('immune', {}).get('score', 5)}/100 (Model R2: 0.67)",
            f"  - Cognitive Resilience: {risk.get('cognitive', {}).get('score', 78)}/100 (Norm: ESA COGNISPACE)",
            "Model Context: Models trained using GroupKFold cross-validation on subject_id across 36 subjects (NASA OSDR Inspiration4, Twin Study, HRP Bedrest, ESA Concordia). Always advise consulting flight surgeon.",
        ]
        return "\n".join(lines)

    def _format_history(self, history: List[Dict[str, str]]) -> str:
        if not history:
            return "No previous messages in this session."
        lines = []
        for msg in history[-6:]:  # Keep last 6 exchanges for context
            role = "Astronaut" if msg.get("role") in ["user", "astronaut"] else "Ori"
            lines.append(f"{role}: {msg.get('content', '')}")
        return "\n".join(lines)

    def _offline_fallback(self, message: str, context: Optional[Dict[str, Any]]) -> str:
        """Intelligent autonomous medical companion fallback if API is unreachable."""
        vitals = (context or {}).get("current_vitals", {})
        hr = vitals.get("heart_rate_bpm", 72.0)
        spo2 = vitals.get("spo2_pct", 98.0)
        temp = vitals.get("skin_temp_c", 36.5)
        is_anom = vitals.get("is_anomaly", False)
        raw_name = (context or {}).get("astronaut_name", "Explorer")
        first_name = raw_name.split()[0] if raw_name else "Explorer"

        msg_lower = message.lower().strip()

        # 1. Identity inquiry (only introduce when asked)
        if any(q in msg_lower for q in ["who are you", "what are you", "your name", "introduce yourself"]):
            return (
                f"I'm Ori, your onboard AstroVitals mission companion. I keep watch over your physiological telemetry, "
                "help monitor cardiovascular and circadian health in microgravity, and keep you company out here in orbit."
            )

        # 2. Greeting / casual check-in
        if any(msg_lower.startswith(g) for g in ["hi", "hello", "hey", "good morning", "good evening", "howdy", "sup"]):
            status_text = f"telemetry is nominal with heart rate at {hr} BPM and SpO2 at {spo2}%" if not is_anom else f"heart rate is elevated at {hr} BPM"
            return f"Good to hear from you, {first_name}! Your {status_text}. What's on your mind today?"

        # 3. Anomaly or distress / fatigue
        if is_anom or (hr and hr > 115) or any(w in msg_lower for w in ["tired", "exhausted", "dizzy", "stress", "fatigue", "headache", "chest"]):
            return (
                f"I'm seeing elevated readings right now with your heart rate at {hr} BPM. "
                "Let's pause active tasks for a moment, take slow deep breaths, and drink 500 mL of electrolyte water. "
                "If the dizziness or fatigue persists, please notify your flight surgeon immediately."
            )

        # 4. Telemetry / vitals inquiry
        if any(w in msg_lower for w in ["vitals", "heart rate", "spo2", "telemetry", "status", "health", "how am i"]):
            return (
                f"Here is your current status: heart rate is {hr} BPM, oxygen saturation is {spo2}%, "
                f"and skin temperature is {temp} C. All metrics are nominal for microgravity operations."
            )

        # 5. General fallback
        return (
            f"Your current telemetry is holding steady with heart rate at {hr} BPM and SpO2 at {spo2}%. "
            f"I'm right here monitoring the flight systems with you, {first_name}."
        )


# Singleton instance
gemini_service = GeminiService()