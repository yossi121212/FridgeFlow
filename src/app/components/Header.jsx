'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { MdArrowDropDown, MdLogout, MdDownload, MdPerson, MdLogin, MdEmail } from 'react-icons/md';

export default function Header({ user, notes, onLogout, onLoginClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  // Export notes to txt file
  const exportToTxt = () => {
    // Get content from all notes with title
    const notesText = notes.map(note => {
      return `${note.title}\n${'-'.repeat(note.title.length)}\n${note.content}`;
    }).join('\n\n-------------------\n\n');
    
    // Create a blob and download it
    const blob = new Blob([notesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fridgeflow-notes.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    // Close dropdown after action
    setDropdownOpen(false);
  };
  
  // Logout handler with dropdown close
  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout();
  };
  
  // Get actual user email from all possible locations in Supabase user object
  const getUserEmail = () => {
    if (!user) return 'User';
    
    // Try all possible places where email might be stored
    if (typeof user === 'object') {
      // Check for dev mode user from localStorage
      if (user.email) return user.email;
      
      // Check user_metadata
      if (user.user_metadata?.email) return user.user_metadata.email;
      
      // Check app_metadata
      if (user.app_metadata?.email) return user.app_metadata.email;
      
      // Check identities array (common in OAuth flows)
      if (user.identities && user.identities[0]?.identity_data?.email) {
        return user.identities[0].identity_data.email;
      }
      
      // Check raw localStorage item for dev mode
      const devUser = localStorage.getItem('fridgeflow_dev_user');
      if (devUser) {
        try {
          const parsed = JSON.parse(devUser);
          if (parsed.email) return parsed.email;
        } catch (e) {
          console.error('Error parsing dev user from localStorage', e);
        }
      }
    }
    
    return 'User';
  };
  
  const userEmail = getUserEmail();
  
  // Handle contact email
  const handleContactClick = () => {
    window.open('mailto:yossimolcho@gmail.com?subject=FridgeFlow%20Feedback', '_blank');
    setDropdownOpen(false);
  };
  
  return (
    <>
      {/* Left header - Logo */}
      <div className="header-left">
        <h1 className="title">FridgeFlow</h1>
        <span className="subtitle">Made by YM Studio</span>
      </div>
      
      {/* Right header - User Menu */}
      <div className="header-right">
        {user ? (
          <div ref={dropdownRef} className="user-dropdown-wrapper">
            <button onClick={toggleDropdown} className="user-dropdown-button">
              <MdPerson className="user-icon" />
              <span className="user-email">{userEmail}</span>
              <MdArrowDropDown className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <MdPerson size={24} />
                  <div className="dropdown-user-info">
                    <span className="dropdown-user-name">{user?.user_metadata?.full_name || userEmail}</span>
                    <span className="dropdown-user-email">{userEmail}</span>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button onClick={exportToTxt} className="dropdown-item">
                  <MdDownload size={20} />
                  <span>Export Notes to Text</span>
                </button>
                
                <button onClick={handleContactClick} className="dropdown-item">
                  <MdEmail size={20} />
                  <span>Contact Support</span>
                </button>
                
                <button onClick={handleLogout} className="dropdown-item">
                  <MdLogout size={20} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onLoginClick} className="login-button">
            <MdLogin className="login-icon" />
            <span>Login Now</span>
          </button>
        )}
      </div>
    </>
  );
} 