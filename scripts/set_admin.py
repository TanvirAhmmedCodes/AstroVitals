import sqlite3
import os
import bcrypt as bcrypt_lib
from datetime import datetime, timezone

ADMIN_EMAIL = "tanvirahmmed13579@gmail.com"
ADMIN_PASSWORD = "TanvirAdmin2026!"
ADMIN_FULL_NAME = "MD Tanvir Ahmmed"

pwd_bytes = ADMIN_PASSWORD.encode("utf-8")[:72]
hashed = bcrypt_lib.hashpw(pwd_bytes, bcrypt_lib.gensalt(rounds=12)).decode("utf-8")

db_paths = ["backend/astrovitals.db", "astrovitals.db"]

for db_path in db_paths:
    if not os.path.exists(db_path):
        continue
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id FROM user WHERE email = ?", (ADMIN_EMAIL,))
    row = cur.fetchone()
    if row:
        cur.execute("""
            UPDATE user 
            SET password_hash = ?, role = 'admin', email_verified = 1, suspended = 0, deleted_at = NULL, password_change_required = 0
            WHERE email = ?
        """, (hashed, ADMIN_EMAIL))
        print(f"[OK] Admin updated in {db_path}: {ADMIN_EMAIL}")
    else:
        admin_id = "admin-tanvir-001"
        cur.execute("""
            INSERT INTO user (id, email, password_hash, full_name, role, email_verified, password_change_required, created_at)
            VALUES (?, ?, ?, ?, 'admin', 1, 0, ?)
        """, (admin_id, ADMIN_EMAIL, hashed, ADMIN_FULL_NAME, datetime.now(timezone.utc).isoformat()))
        print(f"[OK] Admin created in {db_path}: {ADMIN_EMAIL}")
    conn.commit()
    conn.close()

print("=" * 50)
print("ADMIN CREDENTIALS:")
print(f"  Email:    {ADMIN_EMAIL}")
print(f"  Password: {ADMIN_PASSWORD}")
print("=" * 50)
