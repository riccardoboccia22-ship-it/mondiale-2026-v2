'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// DEADLINE: 11 Giugno 2026, 21:00
// Nota: Se vuoi vederlo subito per test, metti una data passata qui (es. 2024-01-01)
const WORLD_CUP_START_DATE = new Date('2024-06-11T21:00:00+02:00');

export default function Navbar() {
  const pathname = usePathname();
  // Se vuoi forzare la visualizzazione del tasto "TUTTI" durante lo sviluppo, 
  // puoi cambiare questa riga in: const isExpired = true;
  const isExpired = new Date() > WORLD_CUP_START_DATE;

  const navItems = [
    { name: 'Profilo', path: '/login', icon: '👤' },
    { name: 'Pronostici Gironi', path: '/matches', icon: '⚽' },
    { name: 'Fase Finale', path: '/bracket', icon: '🏆' },
    { name: 'Bonus', path: '/bonus', icon: '⭐' },
    { name: 'Gironi', path: '/groups', icon: '📊' },
    { name: 'Classifica', path: '/leaderboard', icon: '🥇' },
    // Il tasto compare solo dopo l'inizio del mondiale
    ...(isExpired ? [{ name: 'TUTTI', path: '/tutti-i-pronostici', icon: '📢' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 px-0.5 py-3 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] rounded-t-[2rem]">
      <div className="max-w-md mx-auto flex justify-around items-center px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const isSpecial = item.path === '/tutti-i-pronostici';
          const activeColor = isSpecial ? 'text-blue-400' : 'text-yellow-500';

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`relative flex flex-col items-center flex-1 transition-all duration-300 min-w-[45px] ${
                isActive ? `${activeColor} scale-105` : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              
              <div className="text-[5px] font-black italic uppercase tracking-tighter text-center leading-[1.1] min-h-[18px] flex flex-col justify-start">
                {item.name.split(' ').map((word, index) => (
                  <div key={index} className="truncate w-full px-0.5">
                    {word}
                  </div>
                ))}
              </div>

              {isActive && (
                <span className={`absolute -bottom-1 w-1 h-1 rounded-full ${
                  isSpecial 
                    ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]' 
                    : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                }`} />
              )}

              {/* Badge blu animato per attirare l'attenzione su TUTTI quando disponibile */}
              {isSpecial && !isActive && (
                <span className="absolute -top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}