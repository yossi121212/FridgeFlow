'use client';

import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { MdDelete } from 'react-icons/md';

export default function DraggableEmoji({ 
  id, 
  emoji, 
  initialPosition, 
  zoom = 100, 
  onPositionChange, 
  onDelete,
  isSelected,
  onSelect
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(1);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const draggableRef = useRef(null);
  const contextMenuRef = useRef(null);

  useEffect(() => {
    if (initialPosition) {
      setPosition({ x: initialPosition.x, y: initialPosition.y });
    }
  }, [initialPosition]);
  
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

  const handleDrag = (e, ui) => {
    const { x, y } = ui;
    setPosition({ x, y });
    if (typeof onPositionChange === 'function') {
      onPositionChange(id, { x, y });
    }
  };

  const handleStart = () => {
    setIsDragging(true);
    
    // Select this emoji when starting to drag
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleStop = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY * -0.01;
      const newScale = Math.max(0.5, Math.min(3, scale + delta));
      setScale(newScale);
    }
  };
  
  // Handle emoji click for selection
  const handleEmojiClick = (e) => {
    e.stopPropagation();
    
    // Select this emoji when clicked
    if (onSelect) {
      onSelect(id);
    }
  };
  
  // Handle right click (context menu)
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select this emoji on right click
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

  // Zoom factor from parent
  const calculatedScale = (zoom / 100) * scale;

  return (
    <Draggable
      nodeRef={draggableRef}
      position={position}
      onDrag={handleDrag}
      onStart={handleStart}
      onStop={handleStop}
      scale={zoom / 100}
    >
      <div 
        ref={draggableRef} 
        className={`draggable-emoji ${isSelected ? 'selected-item' : ''}`}
        onWheel={handleWheel}
        onClick={handleEmojiClick}
        onContextMenu={handleContextMenu}
        style={{
          position: 'absolute',
          fontSize: `${45 * scale}px`,
          transform: `scale(${calculatedScale})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          boxShadow: isDragging ? '0px 10px 20px rgba(0,0,0,0.1)' : 'none',
          filter: isDragging ? 'brightness(1.05)' : 'none'
        }}
      >
        {emoji}
        
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