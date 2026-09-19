"""AstroVitals Neuro-Shield — Transactional Email Service.

Dispatches mission-grade, dark-themed HTML notifications using Resend API
with graceful console fallback for local environments.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

from typing import Optional, Dict, Any
import resend

try:
    from config import settings
except ImportError:
    from backend.config import settings

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY


def _wrap_email_template(title: str, content_html: str) -> str:
    """Wrap content in mission-grade cinematic dark email template."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #030509;
      color: #E8EDF5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }}
    .container {{
      max-width: 600px;
      margin: 30px auto;
      background-color: #070B14;
      border: 1px solid #1E293B;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
    }}
    .header {{
      background: linear-gradient(180deg, #0B3D91 0%, #070B14 100%);
      padding: 24px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 212, 255, 0.2);
    }}
    .header h1 {{
      margin: 0;
      font-size: 22px;
      letter-spacing: 0.15em;
      color: #00D4FF;
      text-transform: uppercase;
    }}
    .header p {{
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #94A3B8;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }}
    .content {{
      padding: 32px 28px;
      font-size: 15px;
      line-height: 1.6;
      color: #CBD5E1;
    }}
    .btn {{
      display: inline-block;
      margin: 20px 0;
      padding: 12px 28px;
      background: linear-gradient(135deg, #00D4FF 0%, #0B3D91 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.08em;
      border-radius: 4px;
      text-transform: uppercase;
    }}
    .footer {{
      background-color: #030509;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748B;
      border-top: 1px solid #1E293B;
      letter-spacing: 0.05em;
    }}
    .footer a {{
      color: #00D4FF;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AstroVitals Neuro-Shield</h1>
      <p>Mission Health Guardian · NASA Space Apps 2026</p>
    </div>
    <div class="content">
      {content_html}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Made by MD Tanvir Ahmmed · Team Orbitrix</strong></p>
      <p style="margin: 0;">NASA Space Apps Challenge 2026 · Dhaka, Bangladesh</p>
    </div>
  </div>
</body>
</html>"""


class EmailService:
    @staticmethod
    def _send(to_email: str, subject: str, html_content: str) -> bool:
        """Send email via Resend or log to console on local/dev mode."""
        if not settings.RESEND_API_KEY:
            print(f"\n[EmailService:LOCAL-MOCK] =========================================")
            print(f" To      : {to_email}")
            print(f" Subject : {subject}")
            print(f" Body    : [HTML Template Rendered - {len(html_content)} chars]")
            print(f"===================================================================\n")
            return True

        try:
            from_addr = settings.FROM_EMAIL
            # If using free onboarding Resend key without custom domain verified:
            if "onboarding" not in from_addr and "@astrovitals.app" in from_addr:
                from_addr = "onboarding@resend.dev"

            params: resend.Emails.SendParams = {
                "from": f"AstroVitals Mission Control <{from_addr}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            resend.Emails.send(params)
            print(f"[EmailService] Email sent successfully to {to_email} ({subject})")
            return True
        except Exception as e:
            print(f"[EmailService] Failed to send email to {to_email}: {e}")
            return False

    @classmethod
    def send_welcome_email(cls, email: str, name: str, verify_link: Optional[str] = None) -> bool:
        """Dispatch welcome email to newly registered astronaut / observer."""
        btn_html = f'<p style="text-align: center;"><a href="{verify_link}" class="btn">Verify Mission Clearance</a></p>' if verify_link else ''
        content = f"""
        <h2 style="color: #F8FAFC; margin-top: 0;">Welcome Aboard, {name}!</h2>
        <p>Your access credentials for the <strong>AstroVitals Neuro-Shield</strong> mission console have been initialized.</p>
        <p>AstroVitals monitors real-time physiological telemetry, predicts multidimensional health risks using NASA Human Research Program evidence, and provides autonomous AI medical guidance during deep-space exploration.</p>
        {btn_html}
        <p style="color: #94A3B8; font-size: 13px;">If you did not create this account, please disregard this transmission.</p>
        """
        return cls._send(email, "Welcome to AstroVitals Mission Console", _wrap_email_template("Welcome to AstroVitals", content))

    @classmethod
    def send_verification_email(cls, email: str, verify_link: str) -> bool:
        """Dispatch email verification link."""
        content = f"""
        <h2 style="color: #F8FAFC; margin-top: 0;">Mission Clearance Verification</h2>
        <p>Please confirm your transmission channel by verifying your email address.</p>
        <p style="text-align: center;">
          <a href="{verify_link}" class="btn">Confirm Email Address</a>
        </p>
        <p style="word-break: break-all; font-size: 12px; color: #64748B;">Or direct link: {verify_link}</p>
        """
        return cls._send(email, "Verify Your AstroVitals Account", _wrap_email_template("Email Verification", content))

    @classmethod
    def send_password_reset(cls, email: str, reset_link: str) -> bool:
        """Dispatch secure password reset link."""
        content = f"""
        <h2 style="color: #F8FAFC; margin-top: 0;">Security Key Reset Request</h2>
        <p>A password reset sequence was initiated for your AstroVitals mission account.</p>
        <p style="text-align: center;">
          <a href="{reset_link}" class="btn">Reset Access Key</a>
        </p>
        <p style="color: #EF4444; font-size: 13px;">This emergency link expires in 60 minutes. If you did not request this, secure your account immediately.</p>
        """
        return cls._send(email, "AstroVitals Security Key Reset", _wrap_email_template("Password Reset", content))

    @classmethod
    def send_alert_notification(cls, email: str, astronaut_name: str, alert_type: str, message: str) -> bool:
        """Dispatch real-time health anomaly alert to flight surgeons or family members."""
        content = f"""
        <div style="border-left: 4px solid #EF4444; padding-left: 14px; margin-bottom: 20px;">
          <h2 style="color: #EF4444; margin: 0;">TELEMETRY ALERT: {alert_type.upper()}</h2>
          <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 13px;">Target Subject: <strong>{astronaut_name}</strong></p>
        </div>
        <p style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; border-radius: 4px; color: #FCA5A5;">
          {message}
        </p>
        <p>Please consult the live console telemetry and initiate prescribed NASA HRP countermeasures if symptoms persist.</p>
        """
        return cls._send(email, f"[ALERT] {alert_type.upper()} Alert for {astronaut_name}", _wrap_email_template("Telemetry Alert", content))

    @classmethod
    def send_daily_summary(cls, email: str, astronaut_name: str, summary_data: Dict[str, Any]) -> bool:
        """Dispatch daily flight surgeon medical digest."""
        content = f"""
        <h2 style="color: #F8FAFC; margin-top: 0;">24-Hour Medical Telemetry Digest</h2>
        <p>Summary report for <strong>{astronaut_name}</strong>:</p>
        <ul>
          <li>Mean Heart Rate: {summary_data.get('avg_hr', 72)} BPM</li>
          <li>SpO2 Stability: {summary_data.get('avg_spo2', 98)}%</li>
          <li>Skin Temp: {summary_data.get('avg_temp', 36.5)} C</li>
          <li>Cumulative Radiation: {summary_data.get('cumulative_rad', '12.5 uSv')}</li>
          <li>Overall Status: <strong>{summary_data.get('status', 'NOMINAL').upper()}</strong></li>
        </ul>
        """
        return cls._send(email, f"Daily Medical Telemetry: {astronaut_name}", _wrap_email_template("Daily Digest", content))

    @classmethod
    def send_family_message_notification(cls, email: str, astronaut_name: str, message_preview: str) -> bool:
        """Notify crew member of Earth-side family transmission."""
        content = f"""
        <h2 style="color: #F8FAFC; margin-top: 0;">Earth-Side Family Transmission</h2>
        <p>A new message has been routed to <strong>{astronaut_name}</strong> from family comms:</p>
        <blockquote style="border-left: 3px solid #00D4FF; margin: 16px 0; padding-left: 14px; color: #E2E8F0; font-style: italic;">
          "{message_preview}"
        </blockquote>
        <p>Log in to your console to reply or send an orbital heartbeat ping.</p>
        """
        return cls._send(email, f"New Family Message for {astronaut_name}", _wrap_email_template("Family Transmission", content))


email_service = EmailService()
