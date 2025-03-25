'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from '../utils/supabase';
import './components/styles.css';
import { MdImage } from 'react-icons/md';

// Components
import DraggableNote from './components/DraggableNote';
import EditableNote from './components/EditableNote';
import FloatingBar, { EmojiPickerComponent, DrawingControlsComponent } from './components/FloatingBar';
import DraggableEmoji from './components/DraggableEmoji';
import DraggableSticker from './components/DraggableSticker';
import Header from './components/Header';
import Login from './components/Login';
import DraggableImage from './components/DraggableImage';
import FriendNote from './components/FriendNote';

// Update the Header component type declaration with our new prop
declare module './components/Header' {
  interface HeaderProps {
    user: any;
    notes: any[];
    onLogout: () => void;
    onLoginClick: () => void;
  }

  export default function Header(props: HeaderProps): JSX.Element;
}

// Update the Login component type declaration
declare module './components/Login' {
  interface LoginProps {
    isModal?: boolean;
    onClose?: () => void;
  }

  export default function Login(props: LoginProps): JSX.Element;
}

// Dynamic imports for browser-only components
const ContactNote = dynamic(() => import('./components/ContactNote'), { ssr: false });
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
const SketchPicker = dynamic(() => import('react-color').then(mod => mod.SketchPicker), { ssr: false });

// Default notes for new users
const defaultNotes = [
  {
    id: 1,
    title: 'Buy Milk',
    content: "Don't forget to pick up milk on the way home!",
    color: 'orange',
    x: 100,
    y: 100,
    rotate: 'rotate(2deg)',
    shadowHeight: 15,
    shadowBlur: 30,
  },
  {
    id: 2,
    title: 'Pay Bills',
    content: "Electricity bill due on Friday",
    color: 'blue',
    x: 400,
    y: 150, 
    rotate: 'rotate(-3deg)',
    shadowHeight: 12,
    shadowBlur: 25,
  },
  {
    id: 3,
    title: 'Call Mom',
    content: "Call mom to wish her happy birthday",
    color: 'purple',
    x: 200,
    y: 300,
    rotate: 'rotate(1.5deg)',
    shadowHeight: 14,
    shadowBlur: 28,
  }
];

export default function Home() {
  // Auth state from context
  const { user, loading: authLoading, logout } = useAuth();
  
  // UI state
  const [isClient, setIsClient] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#FF5B14');
  const [lineWidth, setLineWidth] = useState(3);
  const [showFriendNoteModal, setShowFriendNoteModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Content state
  const [notes, setNotes] = useState<any[]>([]);
  const [emojis, setEmojis] = useState<{id: number, emoji: string, x: number, y: number}[]>([]);
  const [stickers, setStickers] = useState<{id: number, url: string, x: number, y: number}[]>([]);
  const [images, setImages] = useState<{id: number, url: string, x: number, y: number}[]>([]);
  const [nextNoteId, setNextNoteId] = useState(100);
  const [loading, setLoading] = useState(true);
  
  // History for undo/redo functionality
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);
  
  // User ID for history separation
  const [currentHistoryUser, setCurrentHistoryUser] = useState<string | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const drawingContextRef = useRef<CanvasRenderingContext2D | null>(null);

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

  // Handle zoom changes
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
    
    // Ensure notes table exists
    ensureNotesTableExists();
  }, []);

  // Create notes table if it doesn't exist
  const ensureNotesTableExists = async () => {
    try {
      // בדיקה מקיפה של מבנה הטבלה בסופאבייס
      console.log('DEBUG: Checking table structure in Supabase...');
      
      // First, check if the table exists by trying to select from it
      const { data: tableInfo, error: tableError } = await supabase
        .from('Notes Table')
        .select('id')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') { // Table doesn't exist error code
        console.log('Notes table does not exist. Will create when user logs in.');
        return;
      } else if (tableError) {
        console.error('Error checking if notes table exists:', tableError);
      } else {
        console.log('Notes table already exists');
        
        // עכשיו נבדוק את המבנה המדויק של הטבלה
        // נייצר רשומת בדיקה
        if (user) {
          const testNote = {
            id: 999999, // מספר גדול שלא סביר שקיים
            user_id: user.id,
            test_field: 'This is a test',
            test_title: 'Test Title',
            test_content: 'Test Content'
          };
          
          try {
            // ננסה להכניס את הרשומה הזו לטבלה ונראה אילו שדות מתקבלים
            const { data: insertData, error: insertError } = await supabase
              .from('Notes Table')
              .insert(testNote)
              .select();
            
            if (insertError) {
              if (insertError.message && insertError.message.includes('column')) {
                // מצאנו מידע על עמודות הטבלה מתוך שגיאה
                console.log('DEBUG: TABLE STRUCTURE INFO from error:', insertError.message);
              } else {
                console.error('Error during table test:', insertError);
              }
            } else if (insertData && insertData.length > 0) {
              console.log('DEBUG: TEST NOTE STRUCTURE:', JSON.stringify(insertData[0], null, 2));
              
              // מחיקת רשומת הבדיקה
              await supabase
                .from('Notes Table')
                .delete()
                .eq('id', 999999);
            }
          } catch (testError) {
            console.error('Error testing table structure:', testError);
          }
        }
      }
    } catch (error) {
      console.error('Error in ensureNotesTableExists:', error);
    }
  };

  // Reset history when user changes
  useEffect(() => {
    if (user?.id !== currentHistoryUser) {
      console.log('User changed, resetting history');
      // Save the current user ID for history
      setCurrentHistoryUser(user?.id || 'anonymous');
      // Reset history to empty
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [user]);

  // Load user notes when authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // ניקוי המצב הקודם לפני טעינת התוכן של המשתמש
      setNotes([]);
      setEmojis([]);
      setStickers([]);
      setImages([]);
      
      // ניקוי הקנבס אם קיים
      if (canvasRef.current && drawingContextRef.current) {
        drawingContextRef.current.clearRect(
          0, 0, 
          canvasRef.current.width, 
          canvasRef.current.height
        );
      }
      
      // טעינת המידע של המשתמש מהשרת
      fetchUserNotes(user.id);
    } else if (!user && !authLoading) {
      // ניקוי המצב הקודם
      setNotes([]);
      setEmojis([]);
      setStickers([]);
      setImages([]);
      
      // ניקוי הקנבס אם קיים
      if (canvasRef.current && drawingContextRef.current) {
        drawingContextRef.current.clearRect(
          0, 0, 
          canvasRef.current.width, 
          canvasRef.current.height
        );
      }
      
      // Load default notes for non-authenticated users
      setNotes(defaultNotes);
      setLoading(false);
    }
  }, [user, authLoading]);

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

  // Fetch user notes from database
  const fetchUserNotes = async (userId: string) => {
    try {
      setLoading(true);
      
      console.log('=== FETCHING NOTES ===');
      console.log('User ID:', userId);
      
      // בדיקת הרשאות
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Current auth state:', authData?.user?.id, authError);
      
      // Try to fetch notes from Supabase
      const { data: fetchedNotes, error } = await supabase
        .from('Notes Table')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('ERROR FETCHING NOTES:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Fetched notes count:', fetchedNotes?.length || 0);
      
      // If we have notes in the database, use them
      if (fetchedNotes && fetchedNotes.length > 0) {
        console.log('First note raw data:', JSON.stringify(fetchedNotes[0], null, 2));
        
        // בדיקה של כל שמות השדות
        const firstNote = fetchedNotes[0];
        console.log('ALL FIELDS IN NOTE:',
          Object.keys(firstNote).map(key => `${key}: ${firstNote[key] !== null ? typeof firstNote[key] : 'NULL'}`).join(', ')
        );
        
        // התמרה פשוטה של הנתונים מהבסיס לפורמט של האפליקציה
        const transformedNotes = fetchedNotes.map(note => ({
          id: note.id,
          title: note.title || '',
          content: note.content || '',
          color: note.color || 'yellow',
          x: note.x || note.position_x || 0,
          y: note.y || note.position_y || 0,
          rotate: note.rotate || 'rotate(0deg)',
          shadowHeight: note.shadowHeight || note.shadow_height || 10,
          shadowBlur: note.shadowBlur || note.shadow_blur || 30,
          user_id: note.user_id
        }));
        
        console.log('Transformed notes sample:', JSON.stringify(transformedNotes[0], null, 2));
        
        setNotes(transformedNotes);
        
        // Find the highest ID to continue from there
        const maxId = Math.max(...fetchedNotes.map(note => Number(note.id)));
        setNextNoteId(Math.max(100, maxId + 1));
      } else {
        // If no notes found, create default notes and save them to Supabase
        console.log('No notes found for user, creating defaults');
        const newNotes = defaultNotes.map(note => ({
          ...note,
          user_id: userId
        }));
        
        // Save default notes to Supabase
        for (const note of newNotes) {
          await saveNoteToSupabase(note);
        }
        
        setNotes(newNotes);
        setNextNoteId(100 + newNotes.length);
      }
    } catch (error) {
      console.error('Error in fetchUserNotes:', error);
      // Fall back to default notes if there's an error
      const newNotes = defaultNotes.map(note => ({
        ...note,
        user_id: userId
      }));
      setNotes(newNotes);
    } finally {
      setLoading(false);
    }
  };

  // Save note to Supabase - SIMPLIFIED VERSION
  const saveNoteToSupabase = async (note) => {
    if (!user) {
      console.error('ERROR: No user logged in, cannot save note');
      return;
    }
    
    try {
      console.log('=== SAVING NOTE TO SUPABASE ===');
      console.log('User ID:', user.id);
      console.log('Note ID:', note.id);
      console.log('Title:', note.title);
      console.log('Content:', note.content);
      console.log('Position:', note.x, note.y);
      
      // פישוט מוחלט - רק השדות החיוניים ביותר
      const simplifiedNote = {
        id: note.id,
        user_id: user.id,
        title: note.title || '',
        content: note.content || '',
        x: note.x,
        y: note.y,
        color: note.color || 'yellow'
      };
      
      console.log('Sending simplified note to Supabase:', JSON.stringify(simplifiedNote, null, 2));
      
      // נסה לשמור בטבלה החדשה
      const { data, error } = await supabase
        .from('Notes Table')
        .upsert(simplifiedNote, { onConflict: 'id' });
      
      if (error) {
        console.error('ERROR SAVING NOTE:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        
        // בדיקת הרשאות
        console.log('=== CHECKING PERMISSIONS ===');
        const { data: authData, error: authError } = await supabase.auth.getUser();
        console.log('Current auth state:', authData, authError);
      } else {
        console.log('SUCCESS: Note saved successfully:', note.id);
        if (data) {
          console.log('Returned data:', JSON.stringify(data, null, 2));
        }
      }
      
      // לצורך בדיקה, גם ננסה לקרוא את הפתק שזה עתה שמרנו
      console.log('=== TRYING TO READ BACK THE NOTE ===');
      const { data: readData, error: readError } = await supabase
        .from('Notes Table')
        .select('*')
        .eq('id', note.id)
        .eq('user_id', user.id);
      
      if (readError) {
        console.error('ERROR READING BACK NOTE:', readError);
      } else {
        console.log('Read back note:', JSON.stringify(readData, null, 2));
      }
      
    } catch (error) {
      console.error('EXCEPTION in saveNoteToSupabase:', error);
    }
  };

  // Delete note from Supabase
  const deleteNoteFromSupabase = async (noteId) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('Notes Table')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting note from Supabase:', error);
      }
    } catch (error) {
      console.error('Unexpected error deleting note:', error);
    }
  };

  // Handle content change in editable notes
  const handleNoteContentChange = (noteId: number, data: { title: string, content: string }) => {
    console.log('DEBUG: Content changed for note:', noteId, JSON.stringify(data));
    
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, title: data.title, content: data.content } : note
    );
    
    console.log('DEBUG: Updated notes state with:', 
      updatedNotes.find(note => note.id === noteId));
    
    setNotes(updatedNotes);
    
    // Get the updated note and save it to Supabase
    const updatedNote = updatedNotes.find(note => note.id === noteId);
    if (updatedNote) {
      saveNoteToSupabase(updatedNote);
    }
  };
  
  // Handle note deletion
  const handleDeleteNote = (noteId: number) => {
    setNotes(notes.filter(note => note.id !== noteId));
    deleteNoteFromSupabase(noteId);
  };
  
  // Handle image deletion
  const handleDeleteImage = (imageId: number) => {
    setImages(images.filter(image => image.id !== imageId));
  };
  
  // Add a new note
  const handleAddNote = () => {
    const newNote = {
      id: nextNoteId,
      title: 'New Note',
      content: 'Click to edit...',
      color: getRandomColor(),
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      rotate: getRandomRotation(),
      shadowHeight: 14,
      shadowBlur: 28,
      user_id: user?.id
    };
    
    setNotes([...notes, newNote]);
    setNextNoteId(nextNoteId + 1);
    
    // Save the new note to Supabase
    saveNoteToSupabase(newNote);
  };

  // Handle emoji selection from picker
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    // Calculate screen center for a better default position
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 3;
    
    // Create and immediately add the emoji at the target position
    const newEmoji = {
      id: Date.now(),
      emoji: emojiData.emoji,
      x: centerX - 25, // Center the emoji horizontally
      y: centerY - 25  // Place it in the upper center area
    };
    
    // Add to state directly with no transition
    setEmojis([...emojis, newEmoji]);
    
    // Close the picker
    setShowEmojiPicker(false);
    
    // Include in history
    setTimeout(() => saveToHistory(), 100);
  };

  // Toggle emoji picker
  const handleAddEmoji = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Add a sticker
  const handleAddSticker = () => {
    // Implementation for adding stickers
  };
  
  // Add an image from file
  const handleAddImage = (file: File) => {
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const newImage = {
            id: Date.now(),
            url: e.target.result.toString(),
            x: window.innerWidth / 2 - 100,
            y: window.innerHeight / 2 - 100
          };
          
          setImages([...images, newImage]);
          
          // Close any open file dialogs
          closeFileInputs();
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Helper function to close file inputs
  const closeFileInputs = () => {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      const fileInput = input as HTMLInputElement;
      fileInput.value = '';
      fileInput.blur();
      
      // Additional methods to force the file explorer to close
      document.body.focus();
      window.focus();
      
      // Click somewhere else on the page to shift focus
      setTimeout(() => {
        document.body.click();
        fileInput.blur();
      }, 100);
    });
  };
  
  // Handle drag and drop for images
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    // רק אם זה גרירת קובץ מבחוץ, לא גרירה פנימית של אובייקטים
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // רק אם זה גרירת קובץ מבחוץ, לא גרירה פנימית של אובייקטים
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragActive) setIsDragActive(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // רק אם זה גרירת קובץ מבחוץ, לא גרירה פנימית של אובייקטים
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    // רק אם זה גרירת קובץ מבחוץ, לא גרירה פנימית של אובייקטים
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Handle each dropped file
        Array.from(e.dataTransfer.files).forEach(file => {
          if (file.type.startsWith('image/')) {
            handleAddImage(file);
          }
        });
        
        // Close any open file inputs
        closeFileInputs();
      }
    }
  };
  
  // Reset the board
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the board? This will clear all notes.')) {
      setNotes([]);
    setEmojis([]);
      setImages([]);
    setStickers([]);
    }
  };

  // Handle drawing mode toggle
  const handleDrawingToggle = () => {
    const newDrawingMode = !isDrawing;
    setIsDrawing(newDrawingMode);
    
    // כשמפעילים את מצב הציור
    if (newDrawingMode) {
      console.log('Drawing mode turned on');
      
      // מאתחלים את הקנבס אם זו הפעם הראשונה
      setTimeout(() => {
        if (!drawingContextRef.current) {
          initCanvas(true);
        }
      }, 100);
    } else {
      console.log('Drawing mode turned off');
      // שמירה להיסטוריה ביציאה ממצב ציור
      saveToHistory();
    }
  };

  // אתחול הקנבס לציור עם בדיקות שגיאה
  const initCanvas = (preserveContent = false) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas reference is null');
        return;
      }

      // שמירת התוכן הקיים לפני שמשנים את גודל הקנבס (אם יש)
      let tempCanvas;
      if (preserveContent && drawingContextRef.current) {
        tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }
      }

      // התאמת גודל הקנבס למסך 
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // קבלת הקונטקסט לציור
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Failed to get 2d context');
        return;
      }
      
      // הגדרת מאפייני הציור
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = drawingColor;
      context.lineWidth = lineWidth;
      drawingContextRef.current = context;
      
      // שחזור התוכן הקיים אם יש
      if (preserveContent && tempCanvas) {
        try {
          context.drawImage(tempCanvas, 0, 0);
        } catch (e) {
          console.error('Failed to restore canvas content', e);
        }
      }
      
      console.log('Canvas initialized successfully');
    } catch (error) {
      console.error('Error initializing canvas:', error);
    }
  };

  // Handle canvas resize when window changes
  useEffect(() => {
    if (!isClient) return;
    
    const handleResize = () => {
      if (canvasRef.current && drawingContextRef.current) {
        // שמירת התוכן הקיים
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        
        // העתקת התוכן לקנבס זמני
        if (tempCtx) {
          tempCtx.drawImage(canvasRef.current, 0, 0);
        }
        
        // שינוי גודל הקנבס הראשי
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        
        // שחזור המאפיינים והתוכן
        drawingContextRef.current.lineCap = 'round';
        drawingContextRef.current.lineJoin = 'round';
        drawingContextRef.current.strokeStyle = drawingColor;
        drawingContextRef.current.lineWidth = lineWidth;
        
        // שחזור התוכן מהקנבס הזמני
        drawingContextRef.current.drawImage(tempCanvas, 0, 0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient, drawingColor, lineWidth]);

  // Get draw position from mouse or touch event
  const getDrawPosition = (e) => {
    try {
      if (!canvasRef.current) {
        console.error('Canvas reference is null in getDrawPosition');
        return { offsetX: 0, offsetY: 0 };
      }
      
      const rect = canvasRef.current.getBoundingClientRect();
      let offsetX, offsetY;
      
      if (e.type && e.type.includes('touch')) {
        // Touch event
        if (!e.touches[0]) {
          console.error('Touch event without touch data');
          return { offsetX: 0, offsetY: 0 };
        }
        offsetX = e.touches[0].clientX - rect.left;
        offsetY = e.touches[0].clientY - rect.top;
      } else {
        // Mouse event
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
      }
      
      // Adjust for zoom
      offsetX = offsetX * (100 / zoom);
      offsetY = offsetY * (100 / zoom);
      
      return { offsetX, offsetY };
    } catch (error) {
      console.error('Error in getDrawPosition:', error);
      return { offsetX: 0, offsetY: 0 };
    }
  };

  // שינוי צבע הציור - שומר את התוכן הקיים
  const changeDrawingColor = (color) => {
    setDrawingColor(color);
    if (drawingContextRef.current) {
      // לא מנקה את הקנבס, רק משנה את הצבע לציורים הבאים
      drawingContextRef.current.strokeStyle = color;
    }
  };

  // שינוי עובי הקו
  const changeLineWidth = (width) => {
    setLineWidth(width);
    if (drawingContextRef.current) {
      drawingContextRef.current.lineWidth = width;
    }
  };

  // ניקוי הקנבס
  const clearCanvas = () => {
    if (drawingContextRef.current && canvasRef.current) {
      drawingContextRef.current.clearRect(
        0, 0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  // פונקציה לפתיחת color picker מתקדם
  const openAdvancedColorPicker = () => {
    setShowColorPicker(true);
  };

  // פונקציה לבחירת צבע מותאם אישית
  const handleCustomColorSelect = (color) => {
    // שינוי הצבע ללא מחיקת הציור
    changeDrawingColor(color.hex);
    // סגירת חלון הצבעים
    setShowColorPicker(false);
  };

  // More reliable history management
  const saveToHistory = () => {
    try {
      console.log('Saving state to history...');
      
      // Skip if we're in the middle of an undo/redo action
      if (isUndoRedoAction) {
        console.log('Skipping history save during undo/redo action');
        return;
      }
      
      // Verify we're using the correct history for the current user
      const userId = user?.id || 'anonymous';
      if (userId !== currentHistoryUser) {
        console.log('User ID mismatch, updating current history user');
        setCurrentHistoryUser(userId);
        setHistory([]);
        setHistoryIndex(-1);
      }
      
      // Create deep copies to avoid reference issues
      const notesCopy = JSON.parse(JSON.stringify(notes));
      const emojisCopy = JSON.parse(JSON.stringify(emojis));
      const stickersCopy = JSON.parse(JSON.stringify(stickers));
      const imagesCopy = JSON.parse(JSON.stringify(images));
      
      // Capture canvas state if available
      let canvasImage = null;
      try {
        if (canvasRef.current) {
          canvasImage = canvasRef.current.toDataURL('image/png');
        }
      } catch (err) {
        console.error('Error capturing canvas state:', err);
      }
      
      // Create a snapshot of the current state
      const newState = {
        notes: notesCopy,
        emojis: emojisCopy,
        stickers: stickersCopy,
        images: imagesCopy,
        canvasImage,
        userId: userId  // Include the user ID in the state
      };
      
      // Check if the new state is identical to the current state
      const currentState = history[historyIndex];
      if (currentState && 
          currentState.userId === userId && 
          JSON.stringify({...currentState, userId: undefined}) === JSON.stringify({...newState, userId: undefined})) {
        console.log('State unchanged, skipping history save');
        return;
      }
      
      // Create new history array with truncated future states
      const newHistory = [...history.slice(0, historyIndex + 1), newState];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      console.log(`History updated, new index: ${newHistory.length - 1}, user: ${userId}`);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  // Improved undo function with proper checks and error handling
  const handleUndo = () => {
    try {
      if (history.length === 0 || historyIndex <= 0) {
        console.log('Cannot undo - at earliest state or empty history');
        return;
      }
      
      const currentUserId = user?.id || 'anonymous';
      const previousState = history[historyIndex - 1];
      
      // Verify user match
      if (!previousState || previousState.userId !== currentUserId) {
        console.error('Previous state not available or user ID mismatch');
        return;
      }
      
      console.log(`Undoing to index ${historyIndex - 1} for user ${currentUserId}`);
      
      // Update all state variables with previous state
      setNotes(previousState.notes || []);
      setEmojis(previousState.emojis || []);
      setStickers(previousState.stickers || []);
      setImages(previousState.images || []);
      
      // Restore canvas if we have a saved image
      if (previousState.canvasImage && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          try {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) {
              console.error('Failed to get canvas context for restoring');
              return;
            }
            
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
          } catch (err) {
            console.error('Error drawing previous canvas state:', err);
          }
        };
        img.onerror = () => console.error('Failed to load previous canvas image');
        img.src = previousState.canvasImage;
      }
      
      // Update history index
      setHistoryIndex(historyIndex - 1);
      setIsUndoRedoAction(true);
      
      // Reset the flag after a short delay
      setTimeout(() => setIsUndoRedoAction(false), 100);
    } catch (error) {
      console.error('Error in handleUndo:', error);
    }
  };

  // Improved redo function with proper checks and error handling
  const handleRedo = () => {
    try {
      if (history.length === 0 || historyIndex >= history.length - 1) {
        console.log('Cannot redo - at latest state or empty history');
        return;
      }
      
      const currentUserId = user?.id || 'anonymous';
      const nextState = history[historyIndex + 1];
      
      // Verify user match
      if (!nextState || nextState.userId !== currentUserId) {
        console.error('Next state not available or user ID mismatch');
        return;
      }
      
      console.log(`Redoing to index ${historyIndex + 1} for user ${currentUserId}`);
      
      // Update all state variables with next state
      setNotes(nextState.notes || []);
      setEmojis(nextState.emojis || []);
      setStickers(nextState.stickers || []);
      setImages(nextState.images || []);
      
      // Restore canvas if we have a saved image
      if (nextState.canvasImage && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          try {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) {
              console.error('Failed to get canvas context for restoring');
              return;
            }
            
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
          } catch (err) {
            console.error('Error drawing next canvas state:', err);
          }
        };
        img.onerror = () => console.error('Failed to load next canvas image');
        img.src = nextState.canvasImage;
      }
      
      // Update history index
      setHistoryIndex(historyIndex + 1);
      setIsUndoRedoAction(true);
      
      // Reset the flag after a short delay
      setTimeout(() => setIsUndoRedoAction(false), 100);
    } catch (error) {
      console.error('Error in handleRedo:', error);
    }
  };

  // Initialize history after data is loaded
  useEffect(() => {
    // Skip if still loading or if this is an undo/redo action
    if (loading || isUndoRedoAction) return;
    
    // If we have a loaded state but no history, initialize history
    if ((notes.length > 0 || emojis.length > 0 || stickers.length > 0 || images.length > 0) && 
        history.length === 0) {
      console.log('Initializing history with loaded state');
      
      // Force a save to history
      setTimeout(() => {
        saveToHistory();
      }, 500);
    }
  }, [loading, notes, emojis, stickers, images, history.length]);
  
  // Initialize canvas only once at the start
  useEffect(() => {
    if (isClient && canvasRef.current) {
      console.log('Initializing canvas on first load');
      initCanvas(true); // נאתחל את הקנבס בתחילת הטעינה
    }
  }, [isClient]);

  // Add state to track undo/redo actions
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
  
  // History state accessors for more reliable checks
  const canUndo = () => {
    // Check if we can undo and that the previous state belongs to the current user
    if (history.length === 0 || historyIndex <= 0) return false;
    
    const currentUserId = user?.id || 'anonymous';
    const previousState = history[historyIndex - 1];
    return previousState && previousState.userId === currentUserId;
  };
  
  const canRedo = () => {
    // Check if we can redo and that the next state belongs to the current user
    if (history.length === 0 || historyIndex >= history.length - 1) return false;
    
    const currentUserId = user?.id || 'anonymous';
    const nextState = history[historyIndex + 1];
    return nextState && nextState.userId === currentUserId;
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if we're in a form field
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.isContentEditable) {
        return;
      }
      
      try {
        // Undo: Ctrl+Z or Command+Z
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
          event.preventDefault();
          if (canUndo()) {
            console.log('UNDO SHORTCUT TRIGGERED');
            handleUndo();
          } else {
            console.log('Cannot undo - no history or at beginning');
          }
        }
        
        // Redo: Ctrl+Y or Command+Shift+Z
        if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') || 
            ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z')) {
          event.preventDefault();
          if (canRedo()) {
            console.log('REDO SHORTCUT TRIGGERED');
            handleRedo();
          } else {
            console.log('Cannot redo - no history or at end');
          }
        }
      } catch (error) {
        console.error('Error in keyboard shortcut handler:', error);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [history, historyIndex, user]);

  // Handle mouse drawing
  const startDrawing = (e) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = getDrawPosition(e);
    
    if (drawingContextRef.current) {
      drawingContextRef.current.beginPath();
      drawingContextRef.current.moveTo(offsetX, offsetY);
      setIsDrawingActive(true);
    }
  };
  
  const continueDrawing = (e) => {
    if (!isDrawingActive || !drawingContextRef.current) return;
    
    const { offsetX, offsetY } = getDrawPosition(e);
    drawingContextRef.current.lineTo(offsetX, offsetY);
    drawingContextRef.current.stroke();
  };
  
  const stopDrawing = () => {
    if (!drawingContextRef.current) return;
    
    drawingContextRef.current.closePath();
    setIsDrawingActive(false);
    
    // Save to history when finished drawing
    if (isDrawing) {
      saveToHistory();
    }
  };

  // Save to history when state changes (throttled)
  useEffect(() => {
    if (isClient && !loading && !isUndoRedoAction) {
      // Skip if we're in an undo/redo action
      if (isHistoryActionRef.current) {
        isHistoryActionRef.current = false;
        return;
      }
      
      // Throttle history updates to avoid excessive saves
      const timeoutId = setTimeout(() => {
        saveToHistory();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [notes, emojis, stickers, images, isClient, loading, user]);

  // מצב בחירה גלובלי
  const [selectedItem, setSelectedItem] = useState<{
    type: 'note' | 'emoji' | 'sticker' | 'image' | 'drawing' | null;
    id: string | number | null;
  }>({
    type: null,
    id: null
  });

  // טיפול במקש Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // בדיקה אם אנחנו נמצאים בתוך שדה טקסט
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // תמיכה גם במקלדות Mac וגם ב-Windows
      // Delete = מקש Delete בWindows או fn+delete במק
      // Backspace = מקש Backspace בWindows או מקש delete במק
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem.id !== null) {
        console.log(`Delete key pressed on ${selectedItem.type} id:${selectedItem.id}`);
        
        // מחיקת הפריט לפי הסוג שלו
        switch (selectedItem.type) {
          case 'note':
            handleDeleteNote(selectedItem.id as number);
            break;
          case 'emoji':
            setEmojis(prev => prev.filter(e => e.id !== selectedItem.id));
            break;
          case 'sticker':
            setStickers(prev => prev.filter(s => s.id !== selectedItem.id));
            break;
          case 'image':
            handleDeleteImage(selectedItem.id as number);
            break;
          case 'drawing':
            // יטופל בהמשך כאשר נממש את ציורים כאובייקטים
            break;
        }
        
        // ניקוי הבחירה
        setSelectedItem({ type: null, id: null });
        
        // שמירת היסטוריה לאחר מחיקה
        setTimeout(() => saveToHistory(), 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  // פונקציה להחלפת האובייקט הנבחר
  const handleSelectItem = (type: 'note' | 'emoji' | 'sticker' | 'image' | 'drawing', id: string | number) => {
    console.log(`Selected ${type} with id ${id}`);
    setSelectedItem({ type, id });
  };

  // פונקציה לביטול בחירה בעת לחיצה על רקע
  const handleClearSelection = () => {
    if (selectedItem.id !== null) {
      console.log('Clearing selection');
      setSelectedItem({ type: null, id: null });
    }
  };

  // Main app rendering
  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="app">
      <Header 
        user={user} 
        notes={notes} 
        onLogout={logout}
        onLoginClick={() => setShowLoginModal(true)}
      />
      
      {/* Display login modal if open */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <Login isModal={true} onClose={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}

      <main className="main">
        <div className={`container ${isDragActive ? 'dragging' : ''} ${isDrawing ? 'drawing-mode' : ''}`}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center top',
            height: `${Math.max(100, 100 * (100 / zoom))}vh`,
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClearSelection}
        >
          <div className={`drag-indicator ${isDragActive ? 'active' : ''}`}>
            <div className="drag-indicator-content">
              <MdImage size={48} />
              <p>Drop images here</p>
            </div>
          </div>
          {/* Notes */}
          {notes.map(note => (
            <EditableNote 
              key={note.id} 
              id={note.id} 
              note={note} 
              initialPosition={{ x: note.x, y: note.y }}
              onContentChange={(data) => handleNoteContentChange(note.id, data)}
              onDelete={() => handleDeleteNote(note.id)}
              zoom={zoom}
              isSelected={selectedItem.type === 'note' && selectedItem.id === note.id}
              onSelect={() => handleSelectItem('note', note.id)}
              onPositionChange={(id, position) => {
                const updatedNotes = notes.map(n => 
                  n.id === id ? { ...n, x: position.x, y: position.y } : n
                );
                setNotes(updatedNotes);
                
                // Get the updated note and save it to Supabase
                const updatedNote = updatedNotes.find(n => n.id === id);
                if (updatedNote) {
                  saveNoteToSupabase(updatedNote);
                }
              }}
            />
          ))}

          {/* Emojis */}
          {emojis.map(emoji => (
            <DraggableEmoji 
              key={emoji.id}
              id={emoji.id}
              emoji={emoji.emoji}
              initialPosition={{ x: emoji.x, y: emoji.y }}
              zoom={zoom}
              isSelected={selectedItem.type === 'emoji' && selectedItem.id === emoji.id}
              onSelect={() => handleSelectItem('emoji', emoji.id)}
              onPositionChange={(id, pos) => {
                setEmojis(prev => prev.map(e => e.id === id ? {...e, x: pos.x, y: pos.y} : e));
              }}
              onDelete={() => {
                setEmojis(prev => prev.filter(e => e.id !== emoji.id));
              }}
            />
          ))}

          {/* Stickers (drawings) */}
          {stickers.map(sticker => (
            <DraggableSticker 
              key={sticker.id}
              id={sticker.id}
              url={sticker.url}
              initialPosition={{ x: sticker.x, y: sticker.y }}
              zoom={zoom}
              isSelected={selectedItem.type === 'sticker' && selectedItem.id === sticker.id}
              onSelect={() => handleSelectItem('sticker', sticker.id)}
              onPositionChange={(id, pos) => {
                setStickers(prev => prev.map(s => s.id === id ? {...s, x: pos.x, y: pos.y} : s));
              }}
              onDelete={() => {
                setStickers(prev => prev.filter(s => s.id !== sticker.id));
              }}
            />
          ))}
          
          {/* Images */}
          {images.map(image => (
            <DraggableImage
              key={image.id}
              id={image.id}
              imageUrl={image.url}
              initialPosition={{ x: image.x, y: image.y }}
              zoom={zoom}
              isSelected={selectedItem.type === 'image' && selectedItem.id === image.id}
              onSelect={() => handleSelectItem('image', image.id)}
              onPositionChange={(id, pos) => {
                setImages(prev => prev.map(i => i.id === id ? {...i, x: pos.x, y: pos.y} : i));
              }}
              onDelete={(imageId) => {
                setImages(prev => prev.filter(i => i.id !== imageId));
              }}
            />
          ))}

          {/* Drawing canvas, always visible but pointer events only when drawing mode is active */}
          <canvas
            ref={canvasRef}
            className={`drawing-canvas ${isDrawing ? 'active' : 'inactive'}`}
            style={{ 
              opacity: isDrawing ? 1 : 0.999 // כמעט בלתי נראה אבל עדיין שומר את התוכן
            }}
            onMouseDown={startDrawing}
            onMouseMove={continueDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={continueDrawing}
            onTouchEnd={stopDrawing}
          />
          
          {/* Color Picker מתקדם, מוצג רק במצב ציור פעיל */}
          {isDrawing && showColorPicker && (
            <div 
              className="advanced-color-picker-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="color-picker-header">
                <h3>בחר צבע</h3>
                <button 
                  className="color-picker-close" 
                  onClick={() => setShowColorPicker(false)}
                >×</button>
              </div>
              <SketchPicker
                color={drawingColor}
                onChangeComplete={handleCustomColorSelect}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating action buttons */}
        <FloatingBar
          onAddNote={handleAddNote}
          onAddEmoji={handleAddEmoji}
          onAddSticker={handleDrawingToggle}
          onAddImage={(files) => {
            if (files && files[0]) {
              handleAddImage(files[0]);
              // Explicitly close file inputs here too
              closeFileInputs();
            }
          }}
          onReset={handleReset}
          onAddFriendNote={() => setShowFriendNoteModal(true)}
          onZoomChange={handleZoomChange}
          isDrawing={isDrawing}
          currentZoom={zoom}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo()}
          canRedo={canRedo()}
      />
      
      {/* Render emoji picker as a separate component */}
      <EmojiPickerComponent 
          showEmojiPicker={showEmojiPicker}
          onEmojiPickerClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
      />
      
      {/* Render drawing controls as a separate component */}
      <DrawingControlsComponent 
          isDrawing={isDrawing}
          drawingColor={drawingColor}
          onColorChange={(color: string) => {
            if (color === 'advanced') {
              setShowColorPicker(true);
            } else {
              changeDrawingColor(color);
            }
          }}
          lineWidth={lineWidth}
          onLineWidthChange={(width: number) => changeLineWidth(width)}
          onClearCanvas={clearCanvas}
      />
      
      {/* Share note modal */}
      {showFriendNoteModal && (
        <FriendNote 
          onClose={() => setShowFriendNoteModal(false)}
        />
      )}
    </div>
  );
}
