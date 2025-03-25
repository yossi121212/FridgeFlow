'use client';

import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import Pin3D from './Pin3D';
import { MdDelete } from 'react-icons/md';

export default function EditableNote({ 
  id, 
  note, 
  initialPosition, 
  zoom = 100, 
  onContentChange, 
  onDelete, 
  onPositionChange,
  isSelected,
  onSelect 
}) {
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(1);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const contextMenuRef = useRef(null);
  
  // Handle changes to title and content
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.title, note.content]);
  
  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current.focus();
        adjustHeight();
      }, 10);
    }
    if (editingContent && contentInputRef.current) {
      setTimeout(() => {
        contentInputRef.current.focus();
        adjustHeight();
      }, 10);
    }
  }, [editingTitle, editingContent]);

  // Listen for clicks outside context menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  // Get style based on color and rotation
  const getNoteStyle = () => {
    return {
      transform: note.rotate && !isDragging ? note.rotate : 'rotate(0deg)',
      boxShadow: isDragging 
        ? '0 20px 40px rgba(0,0,0,0.2)' 
        : `0 ${note.shadowHeight || 10}px ${note.shadowBlur || 30}px rgba(0,0,0,0.1)`,
      touchAction: 'none', // Prevents touch scrolling while dragging
      cursor: isDragging ? 'grabbing' : 'grab',
    };
  };
  
  // Handle start of drag
  const handleStart = (e, data) => {
    // If clicking on a textarea or input, don't start dragging
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      return false;
    }
    e.stopPropagation();
    setIsDragging(true);
    
    if (!editingTitle && !editingContent) {
      // Select this note when starting to drag
      if (onSelect) {
        onSelect(id);
      }
    }
  };
  
  // Handle end of drag
  const handleStop = (e, data) => {
    e.stopPropagation();
    setIsDragging(false);
    
    // Update position
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    
    // Notify parent component
    if (onPositionChange) {
      onPositionChange(id, newPosition);
    }
    
    // Don't reset z-index to avoid shuffling when selection changes
  };

  // Handle drag
  const handleDrag = (e, data) => {
    e.stopPropagation();
    setPosition({ x: data.x, y: data.y });
  };

  // Handle note selection on click
  const handleNoteClick = (e) => {
    e.stopPropagation();
    
    // Don't select if we're editing
    if (editingTitle || editingContent) {
      return;
    }
    
    // Select this note when clicked
    if (onSelect) {
      onSelect(id);
    }
  };

  // Handle right click (context menu)
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select this note on right click
    if (onSelect) {
      onSelect(id);
    }
    
    // Show menu directly in the component instead of at fixed position
    setShowContextMenu(true);
  };

  // Handle delete from context menu
  const handleDeleteFromMenu = () => {
    setShowContextMenu(false);
    if (onDelete) {
      onDelete(id);
    }
  };

  // Handle title edit
  const handleTitleClick = () => {
    if (!isDragging) {
      setEditingTitle(true);
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 0);
    }
  };
  
  // Handle content edit
  const handleContentClick = () => {
    if (!isDragging) {
      setEditingContent(true);
      setTimeout(() => {
        if (contentInputRef.current) {
          contentInputRef.current.focus();
        }
      }, 0);
    }
  };
  
  // Handle title input blur
  const handleTitleBlur = () => {
    setEditingTitle(false);
    
    if (onContentChange) {
      console.log('DEBUG: TITLE BLUR - Sending update to parent:');
      console.log('- ID:', id);
      console.log('- Title:', title);
      console.log('- Content:', content);
      onContentChange({ title, content });
    }
  };
  
  // Handle content input blur
  const handleContentBlur = () => {
    setEditingContent(false);
    
    if (onContentChange) {
      console.log('DEBUG: CONTENT BLUR - Sending update to parent:');
      console.log('- ID:', id);
      console.log('- Title:', title);
      console.log('- Content:', content);
      onContentChange({ title, content });
    }
  };
  
  // Handle title input key down
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (contentInputRef.current) {
        contentInputRef.current.focus();
        setEditingTitle(false);
        setEditingContent(true);
      } else {
        handleTitleBlur();
      }
    }
  };
  
  // Handle content input key down
  const handleContentKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow multiline with Shift+Enter
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContentBlur();
    }
  };
  
  // Handle click outside note
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target)) {
        if (editingTitle || editingContent) {
          setEditingTitle(false);
          setEditingContent(false);
          
          if (onContentChange) {
            console.log('Sending update from outside click:', id, title, content);
            onContentChange({ title, content });
          }
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [title, content, onContentChange]);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (contentInputRef.current) {
      contentInputRef.current.style.height = 'auto';
      contentInputRef.current.style.height = contentInputRef.current.scrollHeight + 'px';
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
    >
      <div 
        ref={nodeRef}
        className={`note note--${note.color || 'orange'} ${isSelected ? 'selected-item' : ''}`} 
        onClick={handleNoteClick}
        onContextMenu={handleContextMenu}
        style={getNoteStyle()}
      >
        <Pin3D color={note.color || 'orange'} />
        
        <div className="note__inner">
          <div className="note__content-wrapper">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                className="editable-note__content-text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder="Title"
              />
            ) : (
              <h2 className="note__title editable" onClick={handleTitleClick}>{title}</h2>
            )}
            
            <div className="editable-note__content">
              {editingContent ? (
                <textarea
                  ref={contentInputRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    adjustHeight();
                  }}
                  className="editable-note__content-text"
                  rows={3}
                  onFocus={adjustHeight}
                  onBlur={handleContentBlur}
                  onKeyDown={handleContentKeyDown}
                />
              ) : (
                <p className="note__content editable" onClick={handleContentClick}>{content}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Context Menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="context-menu"
          >
            <div className="context-menu-item" onClick={handleDeleteFromMenu}>
              <MdDelete size={16} style={{ marginRight: '8px' }} />
              Delete
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
} 