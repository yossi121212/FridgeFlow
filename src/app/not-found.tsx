import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
      <h2 style={{ marginBottom: '20px', fontFamily: 'Space Grotesk, sans-serif' }}>Page Not Found</h2>
      <p style={{ marginBottom: '30px', fontFamily: 'Space Grotesk, sans-serif' }}>
        Sorry, the page you are looking for doesn't exist.
      </p>
      <Link 
        href="/"
        style={{
          padding: '10px 20px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          textDecoration: 'none',
          fontFamily: 'Space Grotesk, sans-serif'
        }}
      >
        Return Home
      </Link>
    </div>
  );
} 