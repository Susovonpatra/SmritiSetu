import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("[ERROR] DATABASE_URL not found in backend/.env")
    sys.exit(1)

migration_file = os.path.join(os.path.dirname(__file__), 'supabase', 'migrations', '20260925_dual_portal_schema.sql')

if not os.path.exists(migration_file):
    print(f"[ERROR] Migration file not found at: {migration_file}")
    sys.exit(1)

with open(migration_file, 'r', encoding='utf-8') as f:
    sql_script = f.read()

print(f"[1] Connecting to Supabase database...")
try:
    # Autocommit engine for DDL
    engine = create_engine(db_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        print(f"[2] Applying migration: {os.path.basename(migration_file)}...")
        conn.execute(text(sql_script))
        print("[SUCCESS] Dual-portal schema, triggers, and RPC functions successfully applied!")
except Exception as e:
    print(f"[NOTICE] Direct migration execution encountered: {e}")
    print("\nIf permissions require the Supabase Dashboard, copy and run the SQL in:")
    print("https://supabase.com/dashboard/project/fqlxmddmqegxmwzqxqpx/sql/new")
