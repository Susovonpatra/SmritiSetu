import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const DualAuthContext = createContext(null);

export function DualAuthProvider({ children }) {
  // Caretaker State
  const [caretakerUser, setCaretakerUser] = useState(null);
  const [caretakerSession, setCaretakerSession] = useState(null);
  const [isCaretakerLoading, setIsCaretakerLoading] = useState(true);

  // Patient State (scoped to caretaker)
  const [patientSession, setPatientSessionState] = useState(() => {
    try {
      const saved = localStorage.getItem('smriti_patient_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
      const mockUser = {
        id: 'dev-caretaker-1',
        email,
        user_metadata: { full_name: 'Ananya Baruah', phone_number: '+91 94350 12345', role: 'caretaker' }
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
    if (!isSupabaseConfigured) {
      const storedDevPass = localStorage.getItem('smriti_dev_patient_pass') || 'Setu@2026';
      if (patientPassword !== storedDevPass && patientPassword !== 'Setu@2026') {
        throw new Error('Invalid caretaker email or patient password.');
      }
      const session = {
        patient_id: 'p-dev-1',
        patient_name: 'Bhaben Baruah',
        caretaker_id: 'dev-caretaker-1',
        caretaker_name: 'Ananya Baruah',
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

    setPatientSession(data.session);
    return data;
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

        // Patient
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
