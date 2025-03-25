'use client';

import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import Pin3D from './Pin3D';

export default function ContactNote({ initialPosition, color = 'blue', title = 'Leave a Note', content = '', rotate = 'rotate(-1deg)', zoom = 100 }) {
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(1);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const nodeRef = useRef(null);
  
  const getNoteStyle = () => {
    const noteStyle = {
      transform: !isDragging ? rotate : 'rotate(0deg)',
      zIndex: zIndex,
      boxShadow: isDragging 
        ? '0 20px 40px rgba(0,0,0,0.2)' 
        : '0 12px 25px rgba(0,0,0,0.1)',
      touchAction: 'none',
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
    setPosition({ x: data.x, y: data.y });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, this would send data to a server
    console.log('Sending message:', { message, email });
    // Show success state
    setIsSent(true);
    // Reset after 3 seconds
    setTimeout(() => {
      setMessage('');
      setEmail('');
      setIsSent(false);
    }, 3000);
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
        className={`note note--${color}`}
        style={getNoteStyle()}
      >
        <Pin3D color={color} />
        <div className="note__inner">
          <div className="note__content-wrapper">
            <h2 className="note__title">{title}</h2>
            {content && <p className="note__content">{content}</p>}
            
            {isSent ? (
              <div className="note__content">
                <p>Thanks for your message!</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Your email..."
                  className="contact-input contact-input--borderless"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Write me something..."
                  className="contact-input contact-input--borderless"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                ></textarea>
                <button type="submit" className="contact-button">
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
} 