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
        // If legacy proxy data was saved, clear it
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

  // Load patient profile from Dexie on mount if available
  useEffect(() => {
    const loadDexieProfile = async () => {
      try {
        const stored = await db.patients.toCollection().first();
        if (stored && stored.name !== 'Bhaben Baruah') {
          setPatientProfileState(prev => {
            const merged = { ...DEFAULT_PATIENT_PROFILE, ...prev, ...stored };
            localStorage.setItem('smriti_patient_profile', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Dexie profile load notice:', err);
      }
    };
    loadDexieProfile();
  }, []);

  // Check Supabase Caretaker session on mount
  useEffect(() => {
    let subscription = null;

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setCaretakerSession(session);
        setCaretakerUser(session?.user ?? null);
        setIsCaretakerLoading(false);
      }).catch((err) => {
        console.warn('Supabase getSession notice:', err.message);
        setIsCaretakerLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setCaretakerSession(session);
        setCaretakerUser(session?.user ?? null);
        setIsCaretakerLoading(false);
      });
      subscription = data?.subscription;
    } else {
      // In local dev without keys, check local fallback
      const localCaretaker = localStorage.getItem('smriti_dev_caretaker');
      if (localCaretaker) {
        try {
          const parsed = JSON.parse(localCaretaker);
          setCaretakerUser(parsed.user);
          setCaretakerSession(parsed.session);
        } catch (e) {
          // ignore
        }
      }
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

      // 3. If Supabase configured and caretaker is logged in, sync to remote Postgres
      if (isSupabaseConfigured && caretakerUser) {
        await supabase
          .from('patient_profiles')
          .update({
            patient_name: merged.name,
            age: merged.age,
            dialect: merged.dialect,
            updated_at: new Date().toISOString()
          })
          .eq('caretaker_id', caretakerUser.id);
      }
    } catch (err) {
      console.warn('Update patient profile sync notice:', err);
    }

    return { success: true, profile: merged };
  };

  // --- Caretaker Auth Methods ---
  const signUpCaretaker = async ({ email, password, fullName, phoneNumber }) => {
    if (!isSupabaseConfigured) {
      // Fallback dev simulation
      const mockUser = {
        id: 'dev-caretaker-' + Date.now(),
        email,
        user_metadata: { full_name: fullName, phone_number: phoneNumber, role: 'caretaker' }
      };
      const mockSession = { user: mockUser, access_token: 'dev-token' };
      localStorage.setItem('smriti_dev_caretaker', JSON.stringify({ user: mockUser, session: mockSession }));
      setCaretakerUser(mockUser);
      setCaretakerSession(mockSession);
      return { data: { user: mockUser, session: mockSession }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone_number: phoneNumber?.trim() || '',
          role: 'caretaker',
        },
      },
    });

    return { data, error };
  };

  const signInCaretaker = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      const emailPrefix = email ? email.split('@')[0] : 'Caretaker';
      const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      const mockUser = {
        id: 'dev-caretaker-1',
        email: email.trim(),
        user_metadata: { full_name: formattedName, phone_number: '', role: 'caretaker' }
      };
      const mockSession = { user: mockUser, access_token: 'dev-token' };
      localStorage.setItem('smriti_dev_caretaker', JSON.stringify({ user: mockUser, session: mockSession }));
      setCaretakerUser(mockUser);
      setCaretakerSession(mockSession);
      return { data: { user: mockUser, session: mockSession }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return { data, error };
  };

  const signOutCaretaker = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('smriti_dev_caretaker');
    setCaretakerUser(null);
    setCaretakerSession(null);
  };

  const updatePatientAccessPassword = async (newPassword) => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('smriti_dev_patient_pass', newPassword);
      return { success: true, message: 'Password updated (Dev Local Store).' };
    }

    const { data, error } = await supabase.rpc('set_patient_access_password', {
      p_new_password: newPassword,
    });

    if (error) throw error;
    return data;
  };

  // --- Patient Auth Methods ---
  const patientLogin = async ({ caretakerEmail, patientPassword }) => {
    const currentProf = patientProfile || DEFAULT_PATIENT_PROFILE;

    if (!isSupabaseConfigured) {
      const storedDevPass = localStorage.getItem('smriti_dev_patient_pass') || 'Setu@2026';
      if (patientPassword !== storedDevPass && patientPassword !== 'Setu@2026') {
        throw new Error('Invalid caretaker email or patient password.');
      }
      const ctName = currentProf.caregiver_name || caretakerUser?.user_metadata?.full_name || (caretakerEmail ? caretakerEmail.split('@')[0] : 'Caretaker');
      const session = {
        patient_id: currentProf.id || 'p-dev-1',
        patient_name: currentProf.name || '',
        patient_age: currentProf.age || '',
        locality: currentProf.locality || '',
        dementia_duration: currentProf.dementia_duration || '',
        dialect: currentProf.dialect || 'Assamese',
        caretaker_id: 'dev-caretaker-1',
        caretaker_name: ctName,
        caretaker_email: caretakerEmail,
        authenticated_at: new Date().toISOString()
      };
      setPatientSession(session);
      return { success: true, session };
    }

    const { data, error } = await supabase.rpc('verify_patient_login', {
      p_email: caretakerEmail.trim(),
      p_password: patientPassword.trim(),
    });

    if (error || !data?.success) {
      throw new Error('Invalid credentials. Please check your email and password.');
    }

    const finalSession = {
      ...data.session,
      patient_name: data.session.patient_name || currentProf.name,
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

export function useDualAuth() {
  const context = useContext(DualAuthContext);
  if (!context) {
    throw new Error('useDualAuth must be used within a DualAuthProvider');
  }
  return context;
}
