import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load backend/.env
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
print(f"[1] Reading DATABASE_URL from .env: {db_url[:35]}... (redacted)")

if not db_url:
    print("[ERROR] DATABASE_URL is not set in backend/.env!")
    sys.exit(1)

# Connect to database
try:
    print("[2] Attempting connection to PostgreSQL/Supabase...")
    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT version();")).fetchone()
        print(f"[SUCCESS] Connected successfully to database!")
        print(f"    Version: {res[0][:60]}...")
        
        # Check if caretakers and patient_profiles tables exist
        check_tables = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('caretakers', 'patient_profiles', 'patient_reminders');
        """)).fetchall()
        
        tables = [r[0] for r in check_tables]
        print(f"[3] Schema Status: Found public tables: {tables}")
        if 'caretakers' in tables and 'patient_profiles' in tables:
            print("    -> Dual-portal migration is already applied in your database!")
        else:
            print("    -> Dual-portal migration not detected yet. Run backend/supabase/migrations/20260925_dual_portal_schema.sql in Supabase SQL Editor.")
except Exception as e:
    print(f"[ERROR] Failed to connect: {e}")
