'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/10 blur-[120px] rounded-full"></div>
      <div className="max-w-3xl w-full text-center z-10">
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
          IL GIOCO DEL MONDIALE <span className="text-yellow-500">2026</span>
        </h1>
        <p className="text-slate-400 mb-10 uppercase tracking-widest text-xs font-bold italic">Il gioco dei pronostici ufficiale</p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button 
            onClick={() => router.push(isLoggedIn ? '/matches' : '/login')}
            className="px-10 py-5 bg-yellow-500 text-slate-950 font-black rounded-2xl uppercase text-xs tracking-widest hover:scale-105 transition-all"
          >
            {isLoggedIn ? 'Vai ai Pronostici' : 'Inizia a Giocare'}
          </button>
          
          <button 
            onClick={() => router.push('/login')}
            className="px-10 py-5 bg-slate-900 border border-slate-800 text-white font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
          >
            {isLoggedIn ? 'Il mio Profilo' : 'Accedi'}
          </button>
        </div>
      </div>
    </main>
  );
}