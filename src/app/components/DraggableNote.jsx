'use client';

import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import Pin3D from './Pin3D';

export default function DraggableNote({ id, note, initialPosition, zoom = 100 }) {
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(1);
  const nodeRef = useRef(null);
  
  // Get style based on color and rotation
  const getNoteStyle = () => {
    const noteStyle = {
      transform: note.rotate && !isDragging ? note.rotate : 'rotate(0deg)',
      zIndex: zIndex,
      boxShadow: isDragging 
        ? '0 20px 40px rgba(0,0,0,0.2)' 
        : `0 ${note.shadowHeight || 10}px ${note.shadowBlur || 30}px rgba(0,0,0,0.1)`,
      touchAction: 'none', // Prevents touch scrolling while dragging
      cursor: isDragging ? 'grabbing' : 'grab',
    };
    
    return noteStyle;
  };
  
  // Handle start of drag
  const handleStart = (e, data) => {
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
    // Update position in real-time for smoother dragging
    setPosition({ x: data.x, y: data.y });
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
      positionOffset={{ x: 0, y: 0 }}
    >
      <div 
        ref={nodeRef}
        className={`note note--${note.color}`} 
        style={getNoteStyle()}
      >
        <Pin3D color={note.color} />
        <div className="note__inner">
          <div className="note__content-wrapper">
            <h2 className="note__title">{note.title}</h2>
            {note.hasLinks ? (
              <p className="note__content">
                Recent work includes <a href="#" className="project-link">e-commerce sites</a>, <a href="#" className="project-link">interactive dashboards</a>, and <a href="#" className="project-link">creative portfolio experiences</a>! Check out my projects for more examples.
              </p>
            ) : (
              <p className="note__content">{note.content}</p>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
} 