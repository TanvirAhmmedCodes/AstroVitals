import sqlite3

conn = sqlite3.connect('astrovitals.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cur.fetchall()]
print("Tables:", tables)

if 'telemetry' in tables:
    cur.execute("SELECT COUNT(*) FROM telemetry")
    print("Telemetry rows:", cur.fetchone()[0])

if 'astronaut_profile' in tables:
    cur.execute("SELECT COUNT(*) FROM astronaut_profile")
    print("Astronaut profiles:", cur.fetchone()[0])
    cur.execute("SELECT id, name FROM astronaut_profile")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]}")

conn.close()