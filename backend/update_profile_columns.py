import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('.env')
db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE public.patient_profiles ADD COLUMN IF NOT EXISTS locality TEXT;
        ALTER TABLE public.patient_profiles ADD COLUMN IF NOT EXISTS dementia_duration TEXT;
        ALTER TABLE public.patient_profiles ADD COLUMN IF NOT EXISTS abha_id TEXT;
        ALTER TABLE public.patient_profiles ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE public.patient_profiles ADD COLUMN IF NOT EXISTS primary_condition TEXT;
    """))
    conn.commit()
    cols = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'patient_profiles'")).fetchall()
    print("[SUCCESS] patient_profiles columns now:", [c[0] for c in cols])
