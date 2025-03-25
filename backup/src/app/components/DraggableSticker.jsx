'use client';

import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import Image from 'next/image';

export default function DraggableSticker({ id, url, initialPosition, zoom = 100, onPositionChange }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const draggableRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialPosition) {
      setPosition({ x: initialPosition.x, y: initialPosition.y });
    }
  }, [initialPosition]);

  const handleDrag = (e, ui) => {
    const { x, y } = ui;
    setPosition({ x, y });
    if (typeof onPositionChange === 'function') {
      onPositionChange(id, { x, y });
    }
  };

  const handleStart = () => {
    setIsDragging(true);
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
        className="draggable-sticker"
        onWheel={handleWheel}
        style={{
          position: 'absolute',
          transform: `scale(${calculatedScale})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          zIndex: isDragging ? 1000 : 10
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
      </div>
    </Draggable>
  );
} 