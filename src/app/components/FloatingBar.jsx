'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MdRefresh } from 'react-icons/md';
import { RiStickyNoteFill } from 'react-icons/ri';
import { BsPencilFill } from 'react-icons/bs';
import { AiOutlineClose } from 'react-icons/ai';
import { MdImage, MdMail } from 'react-icons/md';
import { FaUndo, FaRedo } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

export default function FloatingBar({ 
  onAddNote, 
  onAddEmoji, 
  onAddSticker, 
  onAddImage,
  onAddFriendNote, 
  onReset, 
  onZoomChange, 
  isDrawing, 
  currentZoom,
  showEmojiPicker = false,
  onEmojiPickerClose = () => {},
  onEmojiSelect = () => {},
  onUndo = () => {},
  onRedo = () => {},
  canUndo = false,
  canRedo = false
}) {
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef(null);

  // Sync zoom state with parent component
  useEffect(() => {
    setZoom(currentZoom);
  }, [currentZoom]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 150);
    setZoom(newZoom);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 50);
    setZoom(newZoom);
    onZoomChange(newZoom);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImage(e.target.files);
      e.target.value = null; // Reset input
      
      // Close the input by blurring it
      if (fileInputRef.current) {
        fileInputRef.current.blur();
      }
      
      // Force close by unfocusing and triggering a click elsewhere
      document.body.focus();
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.blur();
        }
      }, 100);
    }
  };

  return (
    <>
      <div className="floating-bar">
        <button className="floating-bar__button" onClick={onAddNote}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" fill="#FFE8D9" stroke="#FF5B14" strokeWidth="1.5"/>
            <path d="M12 8V16M8 12H16" stroke="#FF5B14" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Note
        </button>

        <button className="floating-bar__button" onClick={onAddEmoji}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#FFF5D9" stroke="#FFB800" strokeWidth="1.5"/>
            <circle cx="8.5" cy="10.5" r="1.5" fill="#FFB800"/>
            <circle cx="15.5" cy="10.5" r="1.5" fill="#FFB800"/>
            <path d="M8.5 15C9.5 16.5 11.4 18 12 18C12.6 18 14.5 16.5 15.5 15" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add Emoji
        </button>

        <button 
          className={`floating-bar__button ${isDrawing ? 'floating-bar__button--active' : ''}`} 
          onClick={onAddSticker}
          id="draw-button"
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BsPencilFill size={20} color={isDrawing ? "#FF9900" : "#FFCC00"} style={{ marginRight: '12px' }} />
            Draw
          </div>
        </button>

        {/* Add Image Button */}
        <button className="floating-bar__button" onClick={handleImageClick}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MdImage size={20} color="#4CAF50" style={{ marginRight: '12px' }} />
            Add Image
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </button>

        <div className="floating-bar__divider"></div>

        <div className="floating-bar__zoom">
          <button className="floating-bar__zoom-button" onClick={handleZoomOut}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="floating-bar__zoom-text">{Math.round(zoom)}%</span>
          <button className="floating-bar__zoom-button" onClick={handleZoomIn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Separate Undo/Redo buttons component in bottom right */}
      <div className="floating-bar__history-buttons">
        <button 
          className={`floating-bar__button history-button ${!canUndo ? 'disabled' : ''}`} 
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <FaUndo size={18} color={canUndo ? "#333" : "#999"} />
        </button>
        <button 
          className={`floating-bar__button history-button ${!canRedo ? 'disabled' : ''}`} 
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <FaRedo size={18} color={canRedo ? "#333" : "#999"} />
        </button>
      </div>
    </>
  );
}

// Render the emoji picker separately from the component
export function EmojiPickerComponent({ showEmojiPicker, onEmojiPickerClose, onEmojiSelect }) {
  if (!showEmojiPicker) return null;
  
  return (
    <div 
      className="emoji-picker-container"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)',
        width: '320px',
        overflow: 'hidden'
      }}
    >
      <div className="emoji-picker-header">
        <h3>Choose an Emoji</h3>
        <button className="emoji-picker-close" onClick={onEmojiPickerClose}>×</button>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <EmojiPicker 
          onEmojiClick={onEmojiSelect} 
          width="100%" 
          height="350px" 
        />
      </div>
    </div>
  );
}

// Drawing controls component like emoji picker
export function DrawingControlsComponent({ 
  isDrawing, 
  drawingColor, 
  onColorChange, 
  lineWidth, 
  onLineWidthChange, 
  onClearCanvas 
}) {
  if (!isDrawing) return null;
  
  // Calculate position based on Draw button
  const [menuPosition, setMenuPosition] = useState({ left: '50%', bottom: '90px' });
  
  useEffect(() => {
    const updatePosition = () => {
      const drawButton = document.getElementById('draw-button');
      if (drawButton) {
        const rect = drawButton.getBoundingClientRect();
        setMenuPosition({
          left: `${rect.left + rect.width/2}px`,
          bottom: `${window.innerHeight - rect.top + 10}px`
        });
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isDrawing]);

  return (
    <div 
      className="drawing-controls-container"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: menuPosition.bottom,
        left: menuPosition.left,
        transform: 'translateX(-50%)',
        zIndex: 2000,
        backgroundColor: 'white',
        borderRadius: '30px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'row',
        gap: '8px'
      }}
    >
      <button className="drawing-control-button" onClick={onClearCanvas} title="Clear Drawing">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5L19 19M5 19L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      
      <div className="color-picker">
        {['#000000', '#e74c3c', '#2ecc71', '#3498db', '#f1c40f'].map(color => (
          <div
            key={color}
            className={`color-option ${color === drawingColor ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
          />
        ))}
      </div>

      <div className="line-width-control">
        {[1, 3, 5, 8].map(width => (
          <button
            key={width}
            className={`drawing-control-button ${width === lineWidth ? 'active' : ''}`}
            onClick={() => onLineWidthChange(width)}
          >
            <div style={{ 
              width: `${width * 2}px`, 
              height: `${width * 2}px`, 
              borderRadius: '50%', 
              backgroundColor: drawingColor 
            }} />
          </button>
        ))}
      </div>
    </div>
  );
} 