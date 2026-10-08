import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { db } from '../db/db';

const DualAuthContext = createContext(null);

export const DEFAULT_PATIENT_PROFILE = {
  name: '',
  age: '',
  locality: '',
  dementia_duration: '',
  dialect: 'Assamese',
  abha_id: '',
  caregiver_name: '',
  caregiver_phone: '',
  blood_group: '',
  primary_condition: '',
  emergency_contact: '',
  notes: ''
};

export function DualAuthProvider({ children }) {
  // Caretaker State
  const [caretakerUser, setCaretakerUser] = useState(null);
  const [caretakerSession, setCaretakerSession] = useState(null);
  const [isCaretakerLoading, setIsCaretakerLoading] = useState(true);

  // Patient Profile State (Managed by Caretaker)
  const [patientProfile, setPatientProfileState] = useState(() => {
    try {
      const saved = localStorage.getItem('smriti_patient_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Bhaben Baruah') {
          localStorage.removeItem('smriti_patient_profile');
          return DEFAULT_PATIENT_PROFILE;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored patient profile:', e);
    }
    return DEFAULT_PATIENT_PROFILE;
  });

  // Patient State (scoped to caretaker)
  const [patientSession, setPatientSessionState] = useState(() => {
    try {
      const saved = localStorage.getItem('smriti_patient_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.patient_name === 'Bhaben Baruah') {
          localStorage.removeItem('smriti_patient_session');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Sync patient profile from Supabase patient_profiles table
  const fetchSupabasePatientProfile = async (userId, userMetadata = {}) => {
    if (!isSupabaseConfigured || !userId) return;
    try {
      const { data: prof, error } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('caretaker_id', userId)
        .maybeSingle();

      if (prof && !error) {
        const mapped = {
          id: prof.id,
          name: prof.patient_name || '',
          age: prof.age || '',
          locality: prof.locality || '',
          dementia_duration: prof.dementia_duration || '',
          dialect: prof.dialect || 'Assamese',
          abha_id: prof.abha_id || '',
          primary_condition: prof.primary_condition || '',
          emergency_contact: userMetadata?.phone_number || '',
          caregiver_name: userMetadata?.full_name || '',
          caregiver_phone: userMetadata?.phone_number || '',
          notes: prof.notes || ''
        };
        setPatientProfileState(prev => ({ ...prev, ...mapped }));
        localStorage.setItem('smriti_patient_profile', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Supabase patient profile fetch notice:', err);
    }
  };

  // Check Supabase Caretaker session on mount
  useEffect(() => {
    let subscription = null;

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCaretakerSession(session);
          setCaretakerUser(session.user);
          fetchSupabasePatientProfile(session.user.id, session.user.user_metadata);
        } else {
          setCaretakerSession(null);
          setCaretakerUser(null);
        }
        setIsCaretakerLoading(false);
      }).catch((err) => {
        console.warn('Supabase getSession notice:', err?.message);
        setIsCaretakerLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setCaretakerSession(session);
          setCaretakerUser(session.user);
          await fetchSupabasePatientProfile(session.user.id, session.user.user_metadata);
        } else {
          setCaretakerSession(null);
          setCaretakerUser(null);
        }
        setIsCaretakerLoading(false);
      });
      subscription = data?.subscription;
    } else {
      setIsCaretakerLoading(false);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // --- Patient Profile Update Method (Called by Caretaker) ---
  const updatePatientProfile = async (newProfileData) => {
    const merged = {
      ...patientProfile,
      ...newProfileData,
      age: Number(newProfileData.age) || patientProfile.age
    };

    setPatientProfileState(merged);
    localStorage.setItem('smriti_patient_profile', JSON.stringify(merged));

    try {
      // 1. Sync with Dexie IndexedDB
      const existingPatient = await db.patients.toCollection().first();
      if (existingPatient?.id) {
        await db.patients.update(existingPatient.id, merged);
      } else {
        await db.patients.add(merged);
      }

      // 2. If active patientSession, also update session info in real time
      if (patientSession) {
        const updatedSession = {
          ...patientSession,
          patient_name: merged.name,
          patient_age: merged.age,
          locality: merged.locality,
          dementia_duration: merged.dementia_duration,
          dialect: merged.dialect || patientSession.dialect
        };
        setPatientSessionState(updatedSession);
        localStorage.setItem('smriti_patient_session', JSON.stringify(updatedSession));
      }

      // 3. Sync to remote PostgreSQL Supabase
      if (isSupabaseConfigured && caretakerUser) {
        await supabase
          .from('patient_profiles')
          .update({
            patient_name: merged.name,
            age: merged.age,
            dialect: merged.dialect,
            locality: merged.locality,
            dementia_duration: merged.dementia_duration,
            abha_id: merged.abha_id,
            primary_condition: merged.primary_condition,
            notes: merged.notes,
            updated_at: new Date().toISOString()
          })
          .eq('caretaker_id', caretakerUser.id);
      }
    } catch (err) {
      console.warn('Update patient profile sync notice:', err);
    }

    return { success: true, profile: merged };
  };

  // --- Real User Caretaker Auth Methods ---
  const signUpCaretaker = async ({ email, password, fullName, phoneNumber }) => {
    if (!email || !password) {
      return { data: null, error: new Error('Email and password are required.') };
    }
    if (!fullName || !fullName.trim()) {
      return { data: null, error: new Error('Full Name is required.') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber?.trim() || '',
            role: 'caretaker',
          },
        },
      });

      if (error) {
        return { data: null, error };
      }

      // Case 1: Session returned immediately (email confirmation disabled in Supabase)
      if (data?.session && data?.user) {
        setCaretakerSession(data.session);
        setCaretakerUser(data.user);
        await fetchSupabasePatientProfile(data.user.id, data.user.user_metadata);
        return { data, error: null };
      }

      // Case 2: User created but no session (email confirmation required)
      if (data?.user && !data.session) {
        // Try to sign in immediately (works if email confirmation is disabled)
        const signInRes = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (signInRes.data?.session && signInRes.data?.user) {
          setCaretakerSession(signInRes.data.session);
          setCaretakerUser(signInRes.data.user);
          await fetchSupabasePatientProfile(signInRes.data.user.id, signInRes.data.user.user_metadata);
          return { data: signInRes.data, error: null };
        }
        // Email confirmation is required — return informative error
        return {
          data: null,
          error: new Error(
            'A confirmation link has been sent to ' + email.trim() + '. Please check your inbox and click the link to activate your account, then sign in.'
          )
        };
      }

      return { data, error: null };
    } catch (err) {
      const msg = err?.message || 'Registration failed. Please check your network connection and try again.';
      return { data: null, error: new Error(msg) };
    }
  };

  const signInCaretaker = async ({ email, password }) => {
    if (!email || !password) {
      return { data: null, error: new Error('Please enter both email and password.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        // Provide user-friendly messages for common Supabase errors
        if (error.message?.includes('Email not confirmed')) {
          return {
            data: null,
            error: new Error('Your email has not been confirmed yet. Please check your inbox for a confirmation link.')
          };
        }
        if (error.message?.includes('Invalid login credentials')) {
          return {
            data: null,
            error: new Error('Invalid email or password. Please check your credentials and try again.')
          };
        }
        return { data: null, error };
      }

      if (data?.session && data?.user) {
        setCaretakerSession(data.session);
        setCaretakerUser(data.user);
        await fetchSupabasePatientProfile(data.user.id, data.user.user_metadata);
        return { data, error: null };
      }

      return { data, error: null };
    } catch (err) {
      const msg = err?.message || 'Sign in failed. Please check your network connection and try again.';
      return { data: null, error: new Error(msg) };
    }
  };

  const signOutCaretaker = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    localStorage.removeItem('smriti_patient_session');
    setCaretakerUser(null);
    setCaretakerSession(null);
  };

  const updatePatientAccessPassword = async (newPassword) => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('smriti_dev_patient_pass', newPassword);
      return { success: true, message: 'Password updated.' };
    }

    try {
      const { data, error } = await supabase.rpc('set_patient_access_password', {
        p_new_password: newPassword,
      });
      if (error) throw error;
      return data || { success: true, message: 'Patient access password successfully updated!' };
    } catch (err) {
      throw err;
    }
  };

  // --- Real User Patient Auth Methods ---
  const patientLogin = async ({ caretakerEmail, patientPassword }) => {
    if (!caretakerEmail || !patientPassword) {
      throw new Error('Please enter both caretaker email and patient password.');
    }

    const { data, error } = await supabase.rpc('verify_patient_login', {
      p_email: caretakerEmail.trim(),
      p_password: patientPassword.trim(),
    });

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'Invalid caretaker email or patient password.');
    }

    const currentProf = patientProfile || DEFAULT_PATIENT_PROFILE;
    const finalSession = {
      ...data.session,
      patient_name: data.session?.patient_name || currentProf.name || 'Patient',
      patient_age: currentProf.age,
      locality: currentProf.locality,
      dementia_duration: currentProf.dementia_duration
    };

    setPatientSession(finalSession);
    return { ...data, session: finalSession };
  };

  const setPatientSession = (session) => {
    if (session) {
      localStorage.setItem('smriti_patient_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('smriti_patient_session');
    }
    setPatientSessionState(session);
  };

  const signOutPatient = () => {
    setPatientSession(null);
  };

  return (
    <DualAuthContext.Provider
      value={{
        // Caretaker
        caretakerUser,
        caretakerSession,
        isCaretakerLoading,
        signUpCaretaker,
        signInCaretaker,
        signOutCaretaker,
        updatePatientAccessPassword,

        // Patient Profile (Configured by Caretaker)
        patientProfile,
        updatePatientProfile,

        // Patient Auth & Session
        patientSession,
        patientLogin,
        signOutPatient,
        isPatientLoggedIn: Boolean(patientSession),
      }}
    >
      {children}
    </DualAuthContext.Provider>
  );
}

export const useDualAuth = () => {
  const context = useContext(DualAuthContext);
  if (!context) {
    throw new Error('useDualAuth must be used within a DualAuthProvider');
  }
  return context;
};
