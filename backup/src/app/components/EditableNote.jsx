'use client';

import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import Pin3D from './Pin3D';
import { MdDelete } from 'react-icons/md';

export default function EditableNote({ id, note, initialPosition, zoom = 100, onContentChange, onDelete }) {
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(1);
  const [isEditing, setIsEditing] = useState(note.content === 'Click to edit...');
  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const nodeRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        adjustHeight();
      }, 10);
    }
  }, [isEditing]);

  // Get style based on color and rotation
  const getNoteStyle = () => {
    const noteStyle = {
      transform: note.rotate && !isDragging ? note.rotate : 'rotate(0deg)',
      zIndex: zIndex,
      boxShadow: isDragging 
        ? '0 20px 40px rgba(0,0,0,0.2)' 
        : `0 ${note.shadowHeight || 10}px ${note.shadowBlur || 30}px rgba(0,0,0,0.1)`,
      touchAction: 'none', // Prevents touch scrolling while dragging
      cursor: isEditing ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    };
    
    return noteStyle;
  };
  
  // Handle start of drag
  const handleStart = (e, data) => {
    // If clicking on a textarea or input, don't start dragging
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      return false;
    }
    e.stopPropagation();
    setIsDragging(true);
    setZIndex(20);
  };
  
  // Handle end of drag
  const handleStop = (e, data) => {
    e.stopPropagation();
    setIsDragging(false);
    setPosition({ x: data.x, y: data.y });
    setZIndex(10);
  };

  // Handle drag
  const handleDrag = (e, data) => {
    e.stopPropagation();
    setPosition({ x: data.x, y: data.y });
  };

  // Handle content click to start editing
  const handleContentClick = () => {
    setIsEditing(true);
    // Focus the textarea after a short delay to allow for render
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  // Handle save
  const handleSave = () => {
    setIsEditing(false);
    if (onContentChange) {
      onContentChange(id, { title, content });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setContent(note.content);
    setTitle(note.title);
    setIsEditing(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };
  
  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
      bounds={null}
      scale={zoom / 100}
      defaultClassNameDragging="note--dragging"
      disabled={false}
      positionOffset={{ x: 0, y: 0 }}
      grid={[1, 1]} // Optional - can help with smoother movements
    >
      <div 
        ref={nodeRef}
        className={`note note--${note.color}`} 
        style={getNoteStyle()}
      >
        <Pin3D color={note.color} />
        <button 
          className="edit-note-button" 
          title="Delete Note"
          onClick={handleDelete}
        >
          <MdDelete size={16} />
        </button>
        <div className="note__inner">
          <div className="note__content-wrapper">
            <p className="note__number">{note.number}</p>
            
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="editable-note__content-text"
                style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}
              />
            ) : (
              <h2 className="note__title editable" onClick={handleContentClick}>{title}</h2>
            )}
            
            <div className="editable-note__content">
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    adjustHeight();
                  }}
                  className="editable-note__content-text"
                  rows={3}
                  onFocus={adjustHeight}
                />
              ) : (
                <p className="note__content editable" onClick={handleContentClick}>{content}</p>
              )}
            </div>
            
            {isEditing && (
              <div className="editable-note__controls">
                <button 
                  className="contact-button" 
                  onClick={handleCancel}
                  style={{ 
                    backgroundColor: '#999', 
                    padding: '6px 12px',
                    fontSize: '0.8rem'
                  }}
                >
                  Cancel
                </button>
                <button 
                  className={`contact-button note--${note.color}`} 
                  onClick={handleSave}
                  style={{ 
                    padding: '6px 12px',
                    fontSize: '0.8rem'
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
} 