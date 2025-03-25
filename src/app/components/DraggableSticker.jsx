'use client';

import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa';

export default function DraggableSticker({ 
  id, 
  url, 
  initialPosition, 
  zoom = 100, 
  onPositionChange, 
  onDelete,
  isSelected,
  onSelect
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
    
    // Select this sticker when starting to drag
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

  // Handle sticker click for selection
  const handleStickerClick = (e) => {
    e.stopPropagation();
    
    // Select this sticker when clicked
    if (onSelect) {
      onSelect(id);
    }
  };
  
  // Handle right click (context menu)
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select this sticker on right click
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
        className={`draggable-sticker ${isSelected ? 'selected-item' : ''}`}
        onWheel={handleWheel}
        onClick={handleStickerClick}
        onContextMenu={handleContextMenu}
        style={{
          position: 'absolute',
          transform: `scale(${calculatedScale})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <img 
          src={url} 
          alt="Sticker" 
          width={100}
          height={100}
          style={{ 
            pointerEvents: 'none',
            width: 'auto',
            height: 'auto',
            maxWidth: '100px',
            maxHeight: '100px',
            objectFit: 'contain'
          }}
        />
        
        {/* Context Menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="context-menu"
          >
            <div className="context-menu-item" onClick={handleDeleteFromMenu}>
              <FaTrash size={14} style={{ marginRight: '8px' }} />
              Delete
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
} 