'use client';

import React from 'react';

// Mappa dei codici bandiera per tutte le squadre citate
const flagMap: { [key: string]: string } = {
  'Messico': 'mx', 'Sudafrica': 'za', 'Corea del Sud': 'kr', 'Repubblica Ceca': 'cz',
  'Canada': 'ca', 'Svizzera': 'ch', 'Qatar': 'qa', 'Bosnia Erzegovina': 'ba',
  'Brasile': 'br', 'Marocco': 'ma', 'Haiti': 'ht', 'Scozia': 'gb-sct',
  'Usa': 'us', 'Australia': 'au', 'Paraguay': 'py', 'Turchia': 'tr',
  'Germania': 'de', "Costa D'Avorio": 'ci', 'Ecuador': 'ec', 'Curacao': 'cw',
  'Olanda': 'nl', 'Svezia': 'se', 'Giappone': 'jp', 'Tunisia': 'tn',
  'Belgio': 'be', 'Iran': 'ir', 'Egitto': 'eg', 'Nuova Zelanda': 'nz',
  'Spagna': 'es', 'Uruguay': 'uy', 'Arabia Saudita': 'sa', 'Capo Verde': 'cv',
  'Francia': 'fr', 'Senegal': 'sn', 'Norvegia': 'no', 'Iraq': 'iq',
  'Argentina': 'ar', 'Austria': 'at', 'Algeria': 'dz', 'Giordania': 'jo',
  'Portogallo': 'pt', 'Colombia': 'co', 'Uzbekistan': 'uz', 'Repubblica Democratica del Congo': 'cd',
  'Inghilterra': 'gb-eng', 'Croazia': 'hr', 'Ghana': 'gh', 'Panama': 'pa'
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
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* Intestazione */}
        <header className="text-center mb-10 mt-6">
          <h1 className="text-5xl font-black text-yellow-500 mb-2 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
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
                {group.teams.map((team, index) => (
                  <li key={team} className="flex items-center space-x-3">
                    {/* Numero Posizione */}
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-black border border-slate-700">
                      {index + 1}
                    </span>
                    
                    {/* Bandiera */}
                    <div className="w-7 h-4.5 bg-slate-800 rounded-sm overflow-hidden border border-slate-700 flex-shrink-0 relative">
                      <img 
                        src={`https://flagcdn.com/w40/${flagMap[team] || 'un'}.png`} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Nome Squadra */}
                    <span className="font-bold text-xs uppercase tracking-tight text-slate-200 group-hover:text-white transition-colors">
                      {team}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}