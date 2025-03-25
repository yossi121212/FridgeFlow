'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
      <h2 style={{ marginBottom: '20px', fontFamily: 'Space Grotesk, sans-serif' }}>Something went wrong!</h2>
      <button
        onClick={() => reset()}
        style={{
          padding: '10px 20px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: 'Space Grotesk, sans-serif'
        }}
      >
        Try again
      </button>
    </div>
  );
} 