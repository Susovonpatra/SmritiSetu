import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('.env')
db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)

with engine.connect() as conn:
    # Confirm any existing users
    conn.execute(text("""
        UPDATE auth.users 
        SET email_confirmed_at = NOW() 
        WHERE email_confirmed_at IS NULL;
    """))

    # Update the existing handle_new_caretaker_signup in public schema to also confirm email
    conn.execute(text("""
        CREATE OR REPLACE FUNCTION public.handle_new_caretaker_signup()
        RETURNS TRIGGER 
        SECURITY DEFINER
        SET search_path = public, auth, extensions
        LANGUAGE plpgsql
        AS $$
        DECLARE
            v_full_name TEXT;
            v_phone TEXT;
            v_role TEXT;
            v_initial_password TEXT;
            v_initial_hash TEXT;
        BEGIN
            -- Ensure email is marked confirmed so user can login immediately
            UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = NEW.id AND email_confirmed_at IS NULL;

            v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'caretaker');
            
            -- When a caretaker registers
            IF v_role = 'caretaker' THEN
                v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Caretaker');
                v_phone     := NEW.raw_user_meta_data->>'phone_number';

                -- A. Insert or update Caretakers table
                INSERT INTO public.caretakers (id, full_name, phone_number)
                VALUES (NEW.id, v_full_name, v_phone)
                ON CONFLICT (id) DO UPDATE 
                SET full_name = EXCLUDED.full_name,
                    phone_number = EXCLUDED.phone_number,
                    updated_at = NOW();

                -- B. Generate an initial default patient access password ('Setu@2026')
                v_initial_password := 'Setu@' || TO_CHAR(NOW(), 'YYYY');
                v_initial_hash := extensions.crypt(v_initial_password, extensions.gen_salt('bf', 10));

                -- C. Provision linked patient profile
                INSERT INTO public.patient_profiles (caretaker_id, patient_name, patient_password_hash)
                VALUES (NEW.id, 'My Patient', v_initial_hash)
                ON CONFLICT (caretaker_id) DO NOTHING;
            END IF;

            RETURN NEW;
        END;
        $$;
    """))

    conn.commit()
    print("[SUCCESS] Function updated to auto-confirm new users & existing users confirmed.")
