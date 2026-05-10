'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Importiamo solo le icone necessarie (Tree-shaking attivo)
import { 
  User, 
  Trophy, 
  Star, 
  ListOrdered, 
  Users, 
  Gamepad2 
} from 'lucide-react';

// DEADLINE UFFICIALE: 11 Giugno 2026 (Nota: Ho corretto l'anno a 2026 come da progetto)
const WORLD_CUP_START_DATE = new Date('2025-06-11T21:00:00+02:00');

export default function Navbar() {
  const pathname = usePathname();
  const isExpired = new Date() > WORLD_CUP_START_DATE;

  const navItems = [
    { name: 'Profilo', path: '/login', icon: <User size={20} strokeWidth={2.5} /> },
    { name: 'Fase Gironi', path: '/matches', icon: <Gamepad2 size={20} strokeWidth={2.5} /> },
    { name: 'Fase Finale', path: '/bracket', icon: <Trophy size={20} strokeWidth={2.5} /> },
    { name: 'Bonus', path: '/bonus', icon: <Star size={20} strokeWidth={2.5} /> },
    { name: 'Classifica', path: '/leaderboard', icon: <ListOrdered size={20} strokeWidth={2.5} /> },
    ...(isExpired ? [{ name: 'Tutti', path: '/tutti-i-pronostici', icon: <Users size={20} strokeWidth={2.5} /> }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-6 pt-2">
      {/* Container con Glassmorphism: Blur dello sfondo per profondità */}
      <div className="max-w-md mx-auto bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.7)]">
        <div className="flex justify-around items-end">
          {navItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`relative flex flex-col items-center transition-all duration-300 ${
                  isActive 
                    ? 'text-yellow-500 scale-110' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={{ width: `${100 / navItems.length}%` }}
              >
                {/* Icona Lucide con background soffuso quando attiva */}
                <div className={`p-2 rounded-2xl transition-all duration-500 ${isActive ? 'bg-slate-900/50 mb-1' : 'mb-0'}`}>
                  {item.icon}
                </div>
                
                {/* Label: Font 9px per leggibilità ottimale su smartphone */}
                <span className="text-[9px] font-black uppercase italic tracking-tighter text-center leading-none mb-1 px-1">
                  {item.name}
                </span>

                {/* Puntino di stato attivo unificato */}
                {isActive && (
                  <div className="w-1 h-1 rounded-full animate-pulse bg-yellow-500 shadow-[0_0_8px_#eab308]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}