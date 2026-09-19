from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

try:
    from schemas import ForecastDayItem, ForecastResponse
except ImportError:
    from backend.schemas import ForecastDayItem, ForecastResponse


class ForecastService:
    """Projects 7-day to 30-day health risk trajectories and intervention simulations."""

    @staticmethod
    def generate_7day_forecast(
        astronaut_id: str,
        current_composite: float,
        cv_score: float,
        sleep_score: float,
        immune_score: float,
        current_rad_uSv: float,
        days: int = 7,
    ) -> ForecastResponse:
        now = datetime.now(timezone.utc)
        daily_items: List[ForecastDayItem] = []

        # Determine trajectory direction
        if current_composite > 50.0:
            trend_factor = 0.8  # Upward drift in risk without countermeasure
            trajectory = "accumulating_debt"
        elif current_composite > 30.0:
            trend_factor = 0.2
            trajectory = "nominal_slight_drift"
        else:
            trend_factor = -0.1
            trajectory = "improving"

        daily_rad_rate = 22.5  # uSv/day in nominal LEO

        for d in range(1, days + 1):
            future_date = now + timedelta(days=d)
            # Standard trajectory (no intervention)
            drift = (d * trend_factor) + (d * 0.1)
            f_comp = round(min(100.0, max(5.0, current_composite + drift)), 1)
            f_cv = round(min(100.0, max(5.0, cv_score + (d * trend_factor * 0.9))), 1)
            f_sleep = round(min(100.0, max(5.0, sleep_score + (d * trend_factor * 1.2))), 1)
            f_immune = round(min(100.0, max(5.0, immune_score + (d * trend_factor * 0.7))), 1)
            f_rad = round(current_rad_uSv + (d * daily_rad_rate), 2)

            # Simulated trajectory WITH NASA HRP countermeasures (30m resistance + sleep hygiene)
            intervention_reduction = min(22.0, d * 2.8)
            f_with_intervention = round(max(10.0, f_comp - intervention_reduction), 1)

            daily_items.append(
                ForecastDayItem(
                    day_offset=d,
                    mission_day=42 + d,
                    date=future_date.strftime("%Y-%m-%d"),
                    composite_risk=f_comp,
                    cardiovascular_risk=f_cv,
                    sleep_risk=f_sleep,
                    immune_risk=f_immune,
                    cumulative_radiation_uSv=f_rad,
                    with_intervention_risk=f_with_intervention,
                )
            )

        recommendation = (
            "Model forecasts that implementing 30 minutes daily cycle ergometer / resistance exercise "
            "and 4-7-8 pre-sleep autonomic breathing will reduce projected composite risk by 18-24% over the "
            "next 7 days (NASA HRP Human Research Roadmap - Risk of Cardiovascular Deconditioning)."
        )

        return ForecastResponse(
            astronaut_id=astronaut_id,
            forecast_window_days=days,
            trajectory=trajectory,
            daily_forecast=daily_items,
            recommendation=recommendation,
        )


forecast_service = ForecastService()
