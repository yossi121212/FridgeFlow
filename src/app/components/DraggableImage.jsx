import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { MdDelete } from 'react-icons/md';

export default function DraggableImage({ 
  id, 
  imageUrl, 
  initialPosition, 
  zoom = 100, 
  onDelete, 
  onPositionChange,
  isSelected,
  onSelect
}) {
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const nodeRef = useRef(null);
  const contextMenuRef = useRef(null);
  
  // Listen for clicks outside context menu to close it
  React.useEffect(() => {
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
  
  // Handle start of drag
  const handleStart = (e, data) => {
    e.stopPropagation();
    setIsDragging(true);
    
    // Select this image when starting to drag
    if (onSelect) {
      onSelect(id);
    }
  };
  
  // Handle end of drag
  const handleStop = (e, data) => {
    e.stopPropagation();
    setIsDragging(false);
    setPosition({ x: data.x, y: data.y });
    
    if (onPositionChange) {
      onPositionChange(id, { x: data.x, y: data.y });
    }
  };

  // Handle drag
  const handleDrag = (e, data) => {
    e.stopPropagation();
    setPosition({ x: data.x, y: data.y });
  };
  
  // Handle image click for selection
  const handleImageClick = (e) => {
    e.stopPropagation();
    
    // Select this image when clicked
    if (onSelect) {
      onSelect(id);
    }
  };
  
  // Handle right click (context menu)
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select this image on right click
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
  
  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
      scale={zoom / 100}
    >
      <div 
        ref={nodeRef} 
        className={`draggable-image ${isSelected ? 'selected-item' : ''} ${isDragging ? 'image--dragging' : ''}`}
        onClick={handleImageClick}
        onContextMenu={handleContextMenu}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: isDragging ? '0 15px 30px rgba(0,0,0,0.2)' : '0 5px 15px rgba(0,0,0,0.1)',
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease'
        }}
      >
        <div className="image-container">
          <img 
            src={imageUrl} 
            alt="Draggable Image" 
            style={{ 
              width: '100%', 
              display: 'block',
              pointerEvents: 'none'
            }} 
          />
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