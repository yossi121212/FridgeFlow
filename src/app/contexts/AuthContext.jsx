'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../../utils/supabase';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for dev mode user in localStorage
  useEffect(() => {
    const checkDevUser = localStorage.getItem('fridgeflow_dev_user');
    if (checkDevUser) {
      setUser(JSON.parse(checkDevUser));
      setLoading(false);
      return;
    }

    // Otherwise check Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Initial session check
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Cleanup the subscription
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // Check if in dev mode
    if (localStorage.getItem('fridgeflow_dev_user')) {
      localStorage.removeItem('fridgeflow_dev_user');
      setUser(null);
      window.location.reload();
      return;
    }

    // Otherwise use Supabase logout
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Provide the context value
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 