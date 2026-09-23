"""
SmritiSetu Database Management CLI
Usage:
    python manage_db.py summary          # View table record counts
    python manage_db.py view <table_name> # View records in a table (e.g., patients, asha_queue)
    python manage_db.py reset            # Wipe and re-seed fresh test data
    python manage_db.py query "<sql>"    # Execute custom SQL query
"""

import sys
import os
from app.models.database import engine, SessionLocal, Base
from app.models.schemas import Patient, ConsentRecord, TelemetryLog, AshaQueue, IVRCheckinLog
from sqlalchemy import text

def print_summary():
    db = SessionLocal()
    try:
        print("\n=== SmritiSetu Database Record Summary ===")
        print(f" Patients:         {db.query(Patient).count()}")
        print(f" Consent Records:  {db.query(ConsentRecord).count()}")
        print(f" Telemetry Logs:   {db.query(TelemetryLog).count()}")
        print(f" ASHA Queue:       {db.query(AshaQueue).count()}")
        print(f" IVR Checkins:     {db.query(IVRCheckinLog).count()}")
        print("==========================================\n")
    finally:
        db.close()

def view_table(table_name):
    db = SessionLocal()
    try:
        query = f"SELECT * FROM {table_name} LIMIT 25"
        result = db.execute(text(query)).fetchall()
        if not result:
            print(f"\nTable '{table_name}' is empty.")
            return

        print(f"\n--- Records in '{table_name}' (First 25) ---")
        for row in result:
            print(dict(row._mapping))
        print("------------------------------------------\n")
    except Exception as e:
        print(f"Error querying '{table_name}': {e}")
    finally:
        db.close()

def reset_database():
    confirm = input("Are you sure you want to drop and re-create all tables? (y/N): ")
    if confirm.lower() != 'y':
        print("Cancelled.")
        return

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("All tables recreated.")

    # Re-seed via app.main
    from app.main import seed_database
    seed_database()
    print("Database successfully re-seeded with default demo data!\n")
    print_summary()

def execute_sql(sql):
    db = SessionLocal()
    try:
        result = db.execute(text(sql))
        db.commit()
        try:
            rows = result.fetchall()
            for r in rows:
                print(dict(r._mapping))
        except Exception:
            print("Query executed successfully.")
    except Exception as e:
        print(f"SQL Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        print_summary()
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == "summary":
        print_summary()
    elif cmd == "view":
        if len(sys.argv) < 3:
            print("Specify table name: patients, consent_records, telemetry_logs, asha_queue, ivr_checkin_logs")
        else:
            view_table(sys.argv[2])
    elif cmd == "reset":
        reset_database()
    elif cmd == "query":
        if len(sys.argv) < 3:
            print('Specify SQL query in quotes, e.g.: python manage_db.py query "SELECT * FROM patients"')
        else:
            execute_sql(" ".join(sys.argv[2:]))
    else:
        print(f"Unknown command '{cmd}'.")
        print(__doc__)
