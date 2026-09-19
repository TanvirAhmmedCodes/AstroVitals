"""Database Migration: Replace Placeholder Astronauts with Real User Dynamic Roster.

Purges placeholder astronauts (astronaut-A, astronaut-B, astronaut-C, astronaut-D)
and their associated telemetry, risks, cognitive tests, and chat messages.
Preserves real registered users in the 'user' table.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

import sys
from pathlib import Path
import shutil

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.database import (
    SessionLocal,
    AstronautProfile,
    Telemetry,
    RiskSnapshot,
    CognitiveTest,
    ChatMessage,
    Alert,
    User,
)


def run_migration():
    print("==================================================================")
    print("  ASTROVITALS NEURO-SHIELD · DATABASE MIGRATION 001")
    print("  Purging placeholder crew to enable real registered astronaut roster")
    print("  Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps 2026")
    print("==================================================================")

    from backend.database import Base, engine, init_db
    Base.metadata.create_all(bind=engine)
    init_db()

    db = SessionLocal()
    fake_ids = ["astronaut-A", "astronaut-B", "astronaut-C", "astronaut-D"]

    try:
        # 1. Telemetry records
        deleted_tel = db.query(Telemetry).filter(Telemetry.astronaut_id.in_(fake_ids)).delete(synchronize_session=False)
        print(f"[Migration] Deleted {deleted_tel} telemetry records for placeholder crew.")

        # 2. Risk snapshots
        deleted_risk = db.query(RiskSnapshot).filter(RiskSnapshot.astronaut_id.in_(fake_ids)).delete(synchronize_session=False)
        print(f"[Migration] Deleted {deleted_risk} risk snapshots for placeholder crew.")

        # 3. Cognitive tests
        deleted_cog = db.query(CognitiveTest).filter(CognitiveTest.astronaut_id.in_(fake_ids)).delete(synchronize_session=False)
        print(f"[Migration] Deleted {deleted_cog} cognitive test records.")

        # 4. Chat messages
        deleted_chat = db.query(ChatMessage).filter(ChatMessage.astronaut_id.in_(fake_ids)).delete(synchronize_session=False)
        print(f"[Migration] Deleted {deleted_chat} placeholder chat messages.")

        # 5. Alerts
        deleted_alerts = db.query(Alert).filter(Alert.astronaut_id.in_(fake_ids)).delete(synchronize_session=False)
        print(f"[Migration] Deleted {deleted_alerts} placeholder alert rows.")

        # 6. Astronaut Profiles
        deleted_profiles = db.query(AstronautProfile).filter(AstronautProfile.id.in_(fake_ids)).delete(synchronize_session=False)
        print(f"[Migration] Deleted {deleted_profiles} placeholder astronaut profiles (Alex Chen, etc.).")

        db.commit()

        # Check preserved users
        users_count = db.query(User).count()
        print(f"[Migration] SUCCESS: Database sanitized. Preserved {users_count} registered user(s).")
    except Exception as e:
        db.rollback()
        print(f"[Migration] FAILED with error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
