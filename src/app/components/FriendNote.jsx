import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

export default function FriendNote({ onClose }) {
  const [friendEmail, setFriendEmail] = useState('');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError('');
    
    try {
      // In a real app, this would connect to your backend to send the email
      console.log('Sending note to friend:', { friendEmail, note });
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setIsSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFriendEmail('');
        setNote('');
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to send note. Please try again.');
      console.error('Error sending note:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal friend-note-modal">
        <div className="modal-header">
          <h2>Leave a Note</h2>
          <button onClick={onClose} className="close-button">
            <MdClose size={20} />
          </button>
        </div>
        
        {isSuccess ? (
          <div className="success-message">
            <p>Note sent successfully! 🎉</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="friend-email">Friend's Email</label>
              <input
                id="friend-email"
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Enter your friend's email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="friend-note">Your Note</label>
              <textarea
                id="friend-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write your note here..."
                rows={4}
                required
              />
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="modal-buttons">
              <button 
                type="button" 
                onClick={onClose} 
                className="cancel-button"
                disabled={isSending}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send Note'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 