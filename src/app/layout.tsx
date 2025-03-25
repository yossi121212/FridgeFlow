import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './contexts/AuthContext';

export const metadata: Metadata = {
  title: 'FridgeFlow | Sticky Notes App',
  description: 'A digital fridge board for your sticky notes and reminders by YM Studio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Caveat:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
