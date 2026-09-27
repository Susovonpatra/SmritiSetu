-- ============================================================================
-- SMRITISETU: DUAL-PORTAL AUTHENTICATION & DATABASE ARCHITECTURE
-- PostgreSQL Migration for Supabase (Auth + RLS + Stored Procedures)
-- ============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Caretakers Table
-- Directly references auth.users(id) for automatic sync upon caretaker sign-up
CREATE TABLE IF NOT EXISTS public.caretakers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Patient Profiles Table
-- Holds the patient identity and the dedicated bcrypt-hashed patient access password
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretaker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_name TEXT DEFAULT 'Patient' NOT NULL,
    patient_password_hash TEXT NOT NULL,
    age INT,
    dialect TEXT DEFAULT 'Odia',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_caretaker_patient UNIQUE (caretaker_id)
);

-- 4. Sample Domain Table Scoped to Caretaker/Patient (Reminders / Care Plan)
CREATE TABLE IF NOT EXISTS public.patient_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretaker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    reminder_time TIME NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 5. TRIGGER: Automatic Profile Provisioning on Caretaker Sign-up
-- ============================================================================

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

DROP TRIGGER IF EXISTS on_auth_user_created_caretaker ON auth.users;
CREATE TRIGGER on_auth_user_created_caretaker
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_caretaker_signup();

-- ============================================================================
-- 6. STORED PROCEDURE: Caretaker updates Patient Access Password
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_patient_access_password(
    p_new_password TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
    v_caretaker_id UUID;
    v_new_hash TEXT;
BEGIN
    v_caretaker_id := auth.uid();
    
    IF v_caretaker_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Only authenticated caretakers can set patient passwords.';
    END IF;

    IF LENGTH(TRIM(p_new_password)) < 6 THEN
        RAISE EXCEPTION 'Password must be at least 6 characters.';
    END IF;

    -- Hash password with Blowfish cost 10
    v_new_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));

    UPDATE public.patient_profiles
    SET patient_password_hash = v_new_hash,
        updated_at = NOW()
    WHERE caretaker_id = v_caretaker_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patient profile not found for the authenticated caretaker.';
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Patient access password successfully updated.'
    );
END;
$$;

-- ============================================================================
-- 7. STORED PROCEDURE: Verify Patient Login (Caretaker Email + Patient Password)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_patient_login(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
    v_caretaker_id UUID;
    v_caretaker_name TEXT;
    v_patient_id UUID;
    v_patient_name TEXT;
    v_db_hash TEXT;
    v_is_match BOOLEAN;
BEGIN
    p_email := LOWER(TRIM(p_email));

    -- Locate caretaker and corresponding patient profile
    SELECT 
        u.id,
        c.full_name,
        p.id,
        p.patient_name,
        p.patient_password_hash
    INTO 
        v_caretaker_id,
        v_caretaker_name,
        v_patient_id,
        v_patient_name,
        v_db_hash
    FROM auth.users u
    INNER JOIN public.caretakers c ON c.id = u.id
    INNER JOIN public.patient_profiles p ON p.caretaker_id = u.id
    WHERE LOWER(u.email) = p_email
    LIMIT 1;

    -- Check if found
    IF v_caretaker_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Invalid caretaker email or patient password.'
        );
    END IF;

    -- Cryptographic comparison using stored blowfish salt
    v_is_match := (v_db_hash = extensions.crypt(p_password, v_db_hash));

    IF NOT v_is_match THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Invalid caretaker email or patient password.'
        );
    END IF;

    -- Success payload
    RETURN jsonb_build_object(
        'success', TRUE,
        'role', 'patient',
        'session', jsonb_build_object(
            'patient_id', v_patient_id,
            'patient_name', v_patient_name,
            'caretaker_id', v_caretaker_id,
            'caretaker_name', v_caretaker_name,
            'caretaker_email', p_email,
            'authenticated_at', NOW()
        )
    );
END;
$$;

-- Grant permissions to public/anon for login RPC and authenticated for setting password
GRANT EXECUTE ON FUNCTION public.verify_patient_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_patient_access_password(TEXT) TO authenticated;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.caretakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_reminders ENABLE ROW LEVEL SECURITY;

-- Protect the password hash from ever being read via direct REST SELECT queries
REVOKE SELECT (patient_password_hash) ON public.patient_profiles FROM anon, authenticated;

-- Caretakers can read and update only their own profile
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Caretakers view own profile') THEN
        CREATE POLICY "Caretakers view own profile" ON public.caretakers FOR SELECT TO authenticated USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Caretakers update own profile') THEN
        CREATE POLICY "Caretakers update own profile" ON public.caretakers FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Caretakers view linked patient') THEN
        CREATE POLICY "Caretakers view linked patient" ON public.patient_profiles FOR SELECT TO authenticated USING (auth.uid() = caretaker_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Caretakers update linked patient') THEN
        CREATE POLICY "Caretakers update linked patient" ON public.patient_profiles FOR UPDATE TO authenticated USING (auth.uid() = caretaker_id) WITH CHECK (auth.uid() = caretaker_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Caretakers manage reminders') THEN
        CREATE POLICY "Caretakers manage reminders" ON public.patient_reminders FOR ALL TO authenticated USING (auth.uid() = caretaker_id) WITH CHECK (auth.uid() = caretaker_id);
    END IF;
END $$;
