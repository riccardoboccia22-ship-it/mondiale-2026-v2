import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar'; 
import { Toaster } from 'react-hot-toast'; // Importiamo il gestore dei messaggi

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mondiale 2026 - Pronostici', 
  description: 'Gestisci i tuoi pronostici per il mondiale',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        {/* Configurazione dei messaggi a comparsa (Toast) */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0f172a', // slate-950
              color: '#fff',
              border: '1px solid #1e293b', // slate-800
              fontSize: '11px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: '1rem',
              padding: '12px 24px',
            },
            success: {
              iconTheme: {
                primary: '#eab308', // yellow-500
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // red-500
                secondary: '#0f172a',
              },
            },
          }}
        />

        {/* Container principale con padding bottom per la navbar */}
        <div className="pb-24">
          {children}
        </div>
        
        {/* La barra di navigazione fissa in fondo */}
        <Navbar />
      </body>
    </html>
  );
}