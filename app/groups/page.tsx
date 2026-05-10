'use client';
import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mappa bandiere unificata e robusta
const flagMap: { [key: string]: string } = {
  'algeria': 'dz', 'arabia saudita': 'sa', 'argentina': 'ar', 'australia': 'au', 'austria': 'at',
  'belgio': 'be', 'bosnia ed erzegovina': 'ba', 'bosnia erzegovina': 'ba',
  'brasile': 'br', 'canada': 'ca', 'capo verde': 'cv', 'colombia': 'co', 'corea del sud': 'kr', 
  'costa d\'avorio': 'ci', 'croazia': 'hr', 'curaçao': 'cw', 'curacao': 'cw',
  'ecuador': 'ec', 'egitto': 'eg', 'francia': 'fr', 'germania': 'de', 'ghana': 'gh', 'giappone': 'jp', 
  'giordania': 'jo', 'haiti': 'ht', 'inghilterra': 'gb-eng', 'iran': 'ir', 'iraq': 'iq', 'marocco': 'ma', 
  'messico': 'mx', 'norvegia': 'no', 'nuova zelanda': 'nz', 'olanda': 'nl', 'panama': 'pa', 'paraguay': 'py',
  'portogallo': 'pt', 'qatar': 'qa', 'repubblica ceca': 'cz', 
  'repubblica democratica del congo': 'cd', 'congo': 'cd',
  'scozia': 'gb-sct', 'senegal': 'sn', 'spagna': 'es', 'stati uniti': 'us', 'usa': 'us',
  'sudafrica': 'za', 'svezia': 'se', 'svizzera': 'ch', 'tunisia': 'tn', 'turchia': 'tr', 
  'uruguay': 'uy', 'uzbekistan': 'uz'
};

const tournamentGroups = [
  { name: 'Gruppo A', teams: ['Messico', 'Sudafrica', 'Corea del Sud', 'Repubblica Ceca'] },
  { name: 'Gruppo B', teams: ['Canada', 'Svizzera', 'Qatar', 'Bosnia Erzegovina'] },
  { name: 'Gruppo C', teams: ['Brasile', 'Marocco', 'Haiti', 'Scozia'] },
  { name: 'Gruppo D', teams: ['Usa', 'Australia', 'Paraguay', 'Turchia'] },
  { name: 'Gruppo E', teams: ['Germania', "Costa D'Avorio", 'Ecuador', 'Curacao'] },
  { name: 'Gruppo F', teams: ['Olanda', 'Svezia', 'Giappone', 'Tunisia'] },
  { name: 'Gruppo G', teams: ['Belgio', 'Iran', 'Egitto', 'Nuova Zelanda'] },
  { name: 'Gruppo H', teams: ['Spagna', 'Uruguay', 'Arabia Saudita', 'Capo Verde'] },
  { name: 'Gruppo I', teams: ['Francia', 'Senegal', 'Norvegia', 'Iraq'] },
  { name: 'Gruppo J', teams: ['Argentina', 'Austria', 'Algeria', 'Giordania'] },
  { name: 'Gruppo K', teams: ['Portogallo', 'Colombia', 'Uzbekistan', 'Repubblica Democratica del Congo'] },
  { name: 'Gruppo L', teams: ['Inghilterra', 'Croazia', 'Ghana', 'Panama'] },
];

export default function GroupsPage() {
  const router = useRouter();

  const getFlagCode = (team: string) => {
    return flagMap[team?.toLowerCase().trim()];
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* Tasto Torna Indietro Globale (Visibile su Mobile e Desktop) */}
        <div className="mt-4 mb-2 flex justify-start">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft size={16} /> Torna Indietro
          </button>
        </div>

        {/* Intestazione */}
        <header className="text-center mb-10 mt-4 relative">
          <h1 className="text-4xl sm:text-5xl font-black text-yellow-500 mb-2 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            I Gironi
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            Le 48 sfidanti del Mondiale 2026
          </p>
        </header>

        {/* Griglia dei Gironi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tournamentGroups.map((group) => (
            <div 
              key={group.name} 
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl hover:border-yellow-500/40 transition-all group"
            >
              {/* Nome del Girone */}
              <div className="bg-slate-800/30 p-4 border-b border-slate-800/50 text-center">
                <h2 className="text-xl font-black text-white group-hover:text-yellow-500 transition-colors italic tracking-tight">
                  {group.name}
                </h2>
              </div>
              
              {/* Lista delle Squadre */}
              <ul className="p-5 space-y-4">
                {group.teams.map((team, index) => {
                  const flagCode = getFlagCode(team);
                  return (
                    <li key={team} className="flex items-center space-x-3">
                      {/* Numero Posizione */}
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-black border border-slate-700">
                        {index + 1}
                      </span>
                      
                      {/* Bandiera o Fallback */}
                      <div className="w-7 h-5 bg-slate-800 rounded-sm overflow-hidden border border-slate-700 flex-shrink-0 flex items-center justify-center relative shadow-sm">
                        {flagCode ? (
                          <img 
                            src={`https://flagcdn.com/w40/${flagCode}.png`} 
                            alt={team} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Shield size={10} className="text-slate-500" />
                        )}
                      </div>

                      {/* Nome Squadra */}
                      <span className="font-bold text-xs uppercase tracking-tight text-slate-200 group-hover:text-white transition-colors truncate">
                        {team}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}