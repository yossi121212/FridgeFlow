'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import { MdWarning, MdLogin, MdPersonAdd, MdClose } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';

export default function Login({ isModal = false, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Function to translate error messages to English
  const getErrorMessage = (errorMsg) => {
    if (typeof errorMsg === 'string') {
      if (errorMsg.includes('פרטי התחברות שגויים')) {
        return 'Invalid login credentials. Please check your email and password.';
      } else if (errorMsg.includes('האימייל טרם אומת')) {
        return 'Email not yet confirmed. Please check your inbox.';
      } else if (errorMsg.includes('שגיאת ניתוב')) {
        return 'Routing error. Please refresh the page and try again.';
      } else if (errorMsg.includes('משתמש עם אימייל זה כבר רשום')) {
        return 'A user with this email already exists. Please login.';
      } else if (errorMsg.includes('הסיסמה צריכה להיות באורך')) {
        return 'Password must be at least 6 characters long.';
      } else if (errorMsg.includes('אירעה שגיאה')) {
        return 'An error occurred. Please try again later.';
      } else if (errorMsg.includes('התחברות נכשלה')) {
        return 'Login failed. Please try again.';
      } else if (errorMsg.includes('ההרשמה נכשלה')) {
        return 'Registration failed. Please try again.';
      } else if (errorMsg.includes('בעיית חיבור ל-Supabase')) {
        return 'Supabase connection problem: ' + errorMsg.split('בעיית חיבור ל-Supabase:')[1];
      }
    }
    return errorMsg;
  };
  
  // Function to translate success messages to English
  const getSuccessMessage = (successMsg) => {
    if (typeof successMsg === 'string') {
      if (successMsg.includes('נשלח מייל אימות')) {
        return 'Verification email sent. Click the link in the email to complete registration.';
      } else if (successMsg.includes('ההרשמה הצליחה')) {
        return 'Registration successful! You can now login.';
      } else if (successMsg.includes('החיבור ל-Supabase תקין')) {
        return 'Supabase connection is working!';
      }
    }
    return successMsg;
  };

  // Redirect to main page if already authenticated (only for full page mode)
  useEffect(() => {
    if (isAuthenticated && !isModal) {
      router.push('/');
    } else if (isAuthenticated && isModal && onClose) {
      // In modal mode, just close the modal when authenticated
      onClose();
    }
  }, [isAuthenticated, router, isModal, onClose]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error logging in:', error);
        // Show more detailed error message
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid login credentials. Please check your email and password.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email not yet confirmed. Please check your inbox.');
        } else if (error.message.includes('requested path is invalid')) {
          setError('Routing error. Please refresh the page and try again.');
        } else {
          setError(error.message || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // For simplicity, we use signUp without email verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0], // Use part of email as name
          },
          // Fix redirect URL format to prevent path errors
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        console.error('Error registering:', error);
        // Show more detailed error message
        if (error.message.includes('User already registered')) {
          setError('A user with this email already exists. Please login.');
        } else if (error.message.includes('Password should be')) {
          setError('Password must be at least 6 characters long.');
        } else if (error.message.includes('requested path is invalid')) {
          setError('Routing error. Please refresh the page and try again.');
        } else {
          setError(error.message || 'Registration failed. Please try again.');
        }
      } else {
        // If email confirmation is required
        if (data?.user?.identities?.length === 0) {
          setSuccess('Verification email sent. Click the link in the email to complete registration.');
        } else {
          // If auto-confirmed (in development mode this might happen)
          setSuccess('Registration successful! You can now login.');
          // Try to sign in automatically
          await handleImmediateLogin(email, password);
        }
      }
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Try to sign in immediately after signup
  const handleImmediateLogin = async (email, password) => {
    try {
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } catch (error) {
      console.error('Error in immediate login:', error);
      // Fail silently, user can still log in manually
    }
  };

  // Debug mode for development
  const handleSkipAuth = () => {
    // Set a mock user in localStorage to bypass auth
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      user_metadata: {
        full_name: 'Development User'
      }
    };
    
    localStorage.setItem('fridgeflow_dev_user', JSON.stringify(mockUser));
    window.location.reload();
  };

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from('_test_connection').select('*').limit(1);
      
      if (error && error.code === '42P01') { // Table doesn't exist error is fine
        setSuccess('Supabase connection is working! (_test_connection table not found)');
      } else if (error) {
        setError(`Supabase connection problem: ${error.message}`);
      } else {
        setSuccess('Supabase connection is working!');
      }
    } catch (error) {
      console.error('Supabase connection test error:', error);
      setError(`Supabase connection problem: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-container ${isModal ? 'login-modal-container' : ''}`} style={{ padding: 0, margin: 0 }}>
      <div className="login-card" style={{ margin: 0 }}>
        {isModal && (
          <button onClick={onClose} className="close-modal-button">
            <MdClose size={24} />
          </button>
        )}
        
        <h1 className="login-title">FridgeFlow</h1>
        <p className="login-subtitle">Made by YM Studio</p>
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="login-error">
              <MdWarning size={20} />
              <span>{getErrorMessage(error)}</span>
            </div>
          )}

          {success && (
            <div className="login-success">
              <span>{getSuccessMessage(success)}</span>
            </div>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isRegistering ? 
              <><MdPersonAdd size={20} /> Sign Up</> : 
              <><MdLogin size={20} /> Login</>
            }
          </button>
        </form>
        
        <div className="login-toggle">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccess(null);
            }}
            className="toggle-button"
          >
            {isRegistering ? 'Already have an account? Login' : 'Don\'t have an account? Sign Up'}
          </button>
        </div>

        {/* Only show development tools in non-modal mode */}
        {!isModal && (
          <div className="dev-tools">
            <button 
              className="debug-toggle" 
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
            
            {showDebug && (
              <div className="debug-panel">
                <p>For development purposes only:</p>
                <button className="dev-button" onClick={handleSkipAuth}>
                  Skip Authentication (Dev Mode)
                </button>
                <button 
                  className="dev-button" 
                  onClick={testSupabaseConnection}
                  style={{ marginLeft: '10px', backgroundColor: '#00897B' }}
                  disabled={isLoading}
                >
                  Test Supabase Connection
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 