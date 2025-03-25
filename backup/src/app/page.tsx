'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { EmojiClickData } from 'emoji-picker-react';
import DraggableNote from './components/DraggableNote';
import EditableNote from './components/EditableNote';
import FloatingBar from './components/FloatingBar';
import DraggableEmoji from './components/DraggableEmoji';
import DraggableSticker from './components/DraggableSticker';

// Initial positions for notes
const initialPositions = [
  { x: 100, y: 40 },     // Top left
  { x: 440, y: 20 },    // Top middle
  { x: 780, y: 50 },    // Top right
  { x: 140, y: 320 },    // Bottom left
  { x: 480, y: 340 },   // Bottom middle
  { x: 820, y: 330 },   // Bottom right - contact note
];

// Dynamically import components that use browser APIs
const ContactNote = dynamic(() => import('./components/ContactNote'), { ssr: false });
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function Home() {
  // State to track if running on client (for SSR compatibility)
  const [isClient, setIsClient] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [emojis, setEmojis] = useState<{id: number, emoji: string, x: number, y: number}[]>([]);
  const [stickers, setStickers] = useState<{id: number, url: string, x: number, y: number}[]>([]);
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [nextNoteId, setNextNoteId] = useState(7);
  const [initialState, setInitialState] = useState<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const markerPoints = useRef<{x: number, y: number}[]>([]);
  
  // Store initial state when component mounts
  useEffect(() => {
    if (isClient) {
      setInitialState({
        zoom: 100,
        emojis: [],
        userNotes: []
      });
    }
  }, [isClient]);

  // Random colors for new notes
  const noteColors = ['orange', 'blue', 'purple', 'green'];
  const getRandomColor = () => {
    return noteColors[Math.floor(Math.random() * noteColors.length)];
  };

  // Random rotation for new notes
  const getRandomRotation = () => {
    const angle = Math.random() * 6 - 3; // -3 to 3 degrees
    return `rotate(${angle}deg)`;
  };

  // Handle zoom changes from both buttons and wheel
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    const container = document.querySelector('.container') as HTMLElement;
    if (container) {
      container.style.transform = `scale(${newZoom / 100})`;
      container.style.transformOrigin = 'center top';
      container.style.height = `${Math.max(100, 100 * (100 / newZoom))}vh`;
    }
  };

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newZoom = Math.max(50, Math.min(150, zoom + (delta * 10)));
        handleZoomChange(newZoom);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [zoom]);
  
  // Set client state after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const picker = document.querySelector('.emoji-picker-container');
      if (picker && !picker.contains(e.target as Node) && 
          !(e.target as Element).closest('.floating-bar__button')) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Handle content change in editable notes
  const handleNoteContentChange = (noteId: number, data: { title: string, content: string }) => {
    setUserNotes(userNotes.map(note => 
      note.id === noteId ? { ...note, title: data.title, content: data.content } : note
    ));
  };

  // Delete a note
  const handleDeleteNote = (noteId: number) => {
    setUserNotes(userNotes.filter(note => note.id !== noteId));
  };

  // Add a new note to the canvas
  const handleAddNote = () => {
    const newNote = {
      id: nextNoteId,
      number: nextNoteId.toString().padStart(2, '0'),
      title: 'New Note',
      content: 'Click to edit...',
      color: getRandomColor(),
      rotate: getRandomRotation(),
      shadowHeight: Math.floor(Math.random() * 6) + 10, // 10-15
      shadowBlur: Math.floor(Math.random() * 10) + 25, // 25-35
      x: Math.random() * 500 + 200,
      y: Math.random() * 300 + 150
    };
    
    setUserNotes([...userNotes, newNote]);
    setNextNoteId(nextNoteId + 1);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    const newEmoji = {
      id: Date.now(),
      emoji: emojiData.emoji,
      x: Math.random() * 500 + 200,
      y: Math.random() * 300 + 150
    };
    setEmojis([...emojis, newEmoji]);
    setShowEmojiPicker(false);
  };

  // Toggle emoji picker
  const handleAddEmoji = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setIsDrawing(false);
  };

  // Toggle marker drawing mode
  const handleAddSticker = () => {
    setIsDrawing(!isDrawing);
    setShowEmojiPicker(false);
  };

  // Apply cursor style globally based on drawing mode
  useEffect(() => {
    if (!isClient) return;
    
    if (isDrawing) {
      document.body.classList.add('pencil-cursor');
    } else {
      document.body.classList.remove('pencil-cursor');
    }
    
    // Make sure the cursor doesn't change when hovering over notes
    document.querySelectorAll('.note').forEach(note => {
      if (isDrawing) {
        note.classList.add('prevent-pencil-cursor');
      } else {
        note.classList.remove('prevent-pencil-cursor');
      }
    });
    
    return () => {
      document.body.classList.remove('pencil-cursor');
      document.querySelectorAll('.note').forEach(note => {
        note.classList.remove('prevent-pencil-cursor');
      });
    };
  }, [isDrawing, isClient]);

  // Draw with marker
  useEffect(() => {
    const container = canvasRef.current;
    if (!container || !isDrawing) return;

    let isDrawingMarker = false;
    let lastX = 0;
    let lastY = 0;

    const startDrawing = (e: MouseEvent) => {
      isDrawingMarker = true;
      const rect = container.getBoundingClientRect();
      lastX = (e.clientX - rect.left) / (zoom / 100);
      lastY = (e.clientY - rect.top) / (zoom / 100);
      drawHighlight(lastX, lastY, lastX, lastY);
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawingMarker) return;
      const rect = container.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) / (zoom / 100);
      const currentY = (e.clientY - rect.top) / (zoom / 100);
      drawHighlight(lastX, lastY, currentX, currentY);
      lastX = currentX;
      lastY = currentY;
    };

    const stopDrawing = () => {
      isDrawingMarker = false;
    };

    const drawHighlight = (fromX: number, fromY: number, toX: number, toY: number) => {
      // Calculate the distance between the points
      const dist = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
      // If the distance is very small, just draw a dot
      if (dist < 5) {
        const dot = document.createElement('div');
        dot.className = 'marker-highlight';
        dot.style.position = 'absolute';
        dot.style.left = `${toX - 5}px`;
        dot.style.top = `${toY - 5}px`;
        dot.style.width = '10px';
        dot.style.height = '10px';
        container.appendChild(dot);
        return;
      }
      
      // For longer distances, draw a line by creating multiple dots
      const steps = Math.ceil(dist / 2);
      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const x = fromX + (toX - fromX) * ratio;
        const y = fromY + (toY - fromY) * ratio;
        
        const highlight = document.createElement('div');
        highlight.className = 'marker-highlight';
        highlight.style.position = 'absolute';
        highlight.style.left = `${x - 5}px`;
        highlight.style.top = `${y - 5}px`;
        highlight.style.width = '10px';
        highlight.style.height = '10px';
        container.appendChild(highlight);
      }
    };

    container.addEventListener('mousedown', startDrawing);
    container.addEventListener('mousemove', draw);
    container.addEventListener('mouseup', stopDrawing);
    container.addEventListener('mouseleave', stopDrawing);

    return () => {
      container.removeEventListener('mousedown', startDrawing);
      container.removeEventListener('mousemove', draw);
      container.removeEventListener('mouseup', stopDrawing);
      container.removeEventListener('mouseleave', stopDrawing);
      document.body.style.cursor = 'default';
    };
  }, [isDrawing, zoom]);

  // Reset everything to initial state
  const handleReset = () => {
    setZoom(100);
    setEmojis([]);
    setStickers([]);
    setUserNotes([]);
    setNextNoteId(7);
    setIsDrawing(false);
    
    // Reset all draggable notes to initial positions
    document.querySelectorAll('.note').forEach((noteEl, index) => {
      if (index < initialPositions.length) {
        const draggableInstance = (noteEl as any).__reactFiber$?.return?.return?.stateNode;
        if (draggableInstance && typeof draggableInstance.updatePosition === 'function') {
          draggableInstance.updatePosition({x: 0, y: 0});
        }
      }
    });
    
    // Clear marker highlights
    const highlights = document.querySelectorAll('.marker-highlight');
    highlights.forEach(highlight => highlight.remove());
    
    // Reset container transform
    const container = document.querySelector('.container') as HTMLElement;
    if (container) {
      container.style.transform = '';
      container.style.height = '';
    }

    // Force reload the page to reset everything completely
    window.location.reload();
  };
  
  // Personal info for the sticky notes
  const notes = [
    {
      id: 1,
      number: '01',
      title: 'About Me',
      content: "Hey there! Yossi Molcho here. UX/UI designer and developer based in Tel Aviv creating beautiful digital experiences.",
      color: 'orange',
      rotate: 'rotate(2deg)',
      shadowHeight: 15,
      shadowBlur: 30,
    },
    {
      id: 2,
      number: '02',
      title: 'My Background',
      content: "With over 8 years in digital design and development. I specialize in creating intuitive, user-centered interfaces for startups and enterprise clients.",
      color: 'blue',
      rotate: 'rotate(-3deg)',
      shadowHeight: 12,
      shadowBlur: 25,
    },
    {
      id: 3,
      number: '03',
      title: 'Skills & Expertise',
      content: 'UX/UI Design, Interactive Prototyping, User Research, Frontend Development (React, Next.js), Design Systems, Figma, Creative Coding.',
      color: 'purple',
      rotate: 'rotate(1.5deg)',
      shadowHeight: 14,
      shadowBlur: 28,
    },
    {
      id: 4,
      number: '04',
      title: 'My Approach',
      content: 'I believe in design that tells a story. Every project I work on is built around understanding user needs and business goals to create meaningful digital experiences.',
      color: 'green',
      rotate: 'rotate(-2deg)',
      shadowHeight: 16,
      shadowBlur: 32,
    },
    {
      id: 5,
      number: '05',
      title: 'Recent Projects',
      content: "Recent work includes e-commerce sites, interactive dashboards, and creative portfolio experiences! Check out my projects for more examples.",
      color: 'orange',
      rotate: 'rotate(2.5deg)',
      shadowHeight: 13,
      shadowBlur: 26,
      hasLinks: true,
    },
    {
      id: 6,
      number: '06',
      title: "Leave a Note",
      content: "",
      color: 'blue',
      rotate: 'rotate(-1.5deg)',
      shadowHeight: 14,
      shadowBlur: 28,
      isContactNote: true,
    }
  ];

  return (
    <div className="container" ref={canvasRef}>
      <div className="header">
        <div className="header__top">
          <span className="made-by">Made by <a href="https://yossimolcho.com" target="_blank" rel="noopener noreferrer">YM Studio</a></span>
        </div>
        <h1 className="title">Yossi Molcho</h1>
        <p className="subtitle">
          UX/UI Designer & Developer based in Tel Aviv, specializing in creating beautiful digital experiences
        </p>
      </div>

      <div className="notes-board">
        {/* Predefined notes */}
        {notes.filter(note => !note.isContactNote).map((note, index) => (
          <DraggableNote 
            key={note.id} 
            id={note.id} 
            note={note} 
            initialPosition={initialPositions[index]} 
            zoom={zoom}
          />
        ))}

        {/* Contact note */}
        {notes.find(note => note.isContactNote) && (
          <ContactNote 
            initialPosition={initialPositions[5]} 
            zoom={zoom}
          />
        )}

        {/* User added notes */}
        {userNotes.map((note) => (
          <EditableNote 
            key={note.id} 
            id={note.id} 
            note={note} 
            initialPosition={{x: note.x, y: note.y}} 
            onContentChange={handleNoteContentChange}
            onDelete={handleDeleteNote}
            zoom={zoom}
          />
        ))}

        {/* Emojis */}
        {emojis.map((emojiObj) => (
          <DraggableEmoji 
            key={emojiObj.id} 
            id={emojiObj.id} 
            emoji={emojiObj.emoji} 
            initialPosition={{x: emojiObj.x, y: emojiObj.y}} 
            zoom={zoom}
            onPositionChange={(id, pos) => {
              setEmojis(prev => prev.map(e => e.id === id ? {...e, x: pos.x, y: pos.y} : e));
            }}
          />
        ))}

        {/* Stickers */}
        {stickers.map((stickerObj) => (
          <DraggableSticker 
            key={stickerObj.id} 
            id={stickerObj.id} 
            url={stickerObj.url} 
            initialPosition={{x: stickerObj.x, y: stickerObj.y}} 
            zoom={zoom}
            onPositionChange={(id, pos) => {
              setStickers(prev => prev.map(s => s.id === id ? {...s, x: pos.x, y: pos.y} : s));
            }}
          />
        ))}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            className="emoji-picker-container"
            style={{
              position: 'fixed',
              top: 'auto',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="emoji-picker-header">
              <h3>Choose an Emoji</h3>
              <button className="emoji-picker-close" onClick={() => setShowEmojiPicker(false)}>×</button>
            </div>
            <EmojiPicker onEmojiClick={handleEmojiSelect} />
          </div>
        )}
      </div>
      
      <div className="copyright">
        © 2025 All rights reserved
      </div>

      {isClient && (
        <FloatingBar
          onAddNote={handleAddNote}
          onAddEmoji={handleAddEmoji}
          onAddSticker={handleAddSticker}
          onReset={handleReset}
          onZoomChange={handleZoomChange}
          isDrawing={isDrawing}
          currentZoom={zoom}
        />
      )}
    </div>
  );
}
