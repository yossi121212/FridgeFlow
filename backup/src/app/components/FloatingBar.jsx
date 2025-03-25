'use client';

import React, { useState, useEffect } from 'react';
import { MdRefresh } from 'react-icons/md';
import { RiStickyNoteFill } from 'react-icons/ri';
import { BsPencilFill } from 'react-icons/bs';
import { AiOutlineClose } from 'react-icons/ai';

export default function FloatingBar({ onAddNote, onAddEmoji, onAddSticker, onReset, onZoomChange, isDrawing, currentZoom }) {
  const [zoom, setZoom] = useState(100);

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

  return (
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
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BsPencilFill size={20} color={isDrawing ? "#FF9900" : "#FFCC00"} style={{ marginRight: '12px' }} />
          Draw
          {isDrawing && <AiOutlineClose size={16} color="#FF5B14" style={{ marginLeft: '8px' }} />}
        </div>
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

      <div className="floating-bar__divider"></div>

      <button className="floating-bar__button floating-bar__button--reset" onClick={onReset}>
        <MdRefresh size={22} />
        Reset
      </button>
    </div>
  );
} 