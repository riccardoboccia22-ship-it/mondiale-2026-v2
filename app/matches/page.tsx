'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Shield, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';

const WORLD_CUP_START_DATE = new Date('2026-06-11T21:00:00+02:00');

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

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [predictions, setPredictions] = useState<any>({});
  // Stato per gestire quali gironi sono aperti
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});
  
  const router = useRouter();
  const isExpired = new Date() > WORLD_CUP_START_DATE;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: matchesData } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      setMatches(matchesData || []);

      if (user) {
        const { data: predData } = await supabase.from('predictions').select('*').eq('user_id', user.id);
        if (predData) {
          const predMap: any = {};
          predData.forEach(p => { predMap[p.match_id] = { home: p.home_score, away: p.away_score }; });
          setPredictions(predMap);
        }
      }
    } catch (error) {
      toast.error("Errore caricamento dati");
    } finally {
      setLoading(false);
    }
  }

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getFlagCode = (team: string) => flagMap[team?.toLowerCase().trim()];

  const handleInputChange = (matchId: number, team: 'home' | 'away', value: string) => {
    if (isExpired || (value !== '' && parseInt(value) < 0)) return;
    setPredictions({ 
      ...predictions, 
      [matchId]: { ...predictions[matchId], [team]: value } 
    });
  };

  const saveAllPredictions = async () => {
    if (isExpired) return toast.error("Le giocate sono chiuse!");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/profile'); return; }

    const rowsToUpsert = Object.entries(predictions)
      .filter(([_, val]: any) => val.home !== '' && val.away !== '' && val.home !== undefined && val.away !== undefined)
      .map(([matchId, val]: any) => ({
        user_id: user.id,
        match_id: parseInt(matchId),
        home_score: parseInt(val.home),
        away_score: parseInt(val.away)
      }));

    if (rowsToUpsert.length === 0) {
      toast.error("Inserisci almeno un risultato!");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('predictions').upsert(rowsToUpsert, { onConflict: 'match_id,user_id' });

    if (error) toast.error("Errore durante il salvataggio");
    else toast.success(`${rowsToUpsert.length} pronostici salvati! 🏆`);
    setSaving(false);
  };

  const groupMatches = () => {
    const grouped: { [key: string]: any[] } = {};
    tournamentGroups.forEach(group => { grouped[group.name] = []; });
    grouped['Altre Partite'] = [];

    matches.forEach(match => {
      let foundGroup = false;
      for (const group of tournamentGroups) {
        if (group.teams.some(t => t.toLowerCase() === match.home_team.toLowerCase() || t.toLowerCase() === match.away_team.toLowerCase())) {
          grouped[group.name].push(match);
          foundGroup = true;
          break;
        }
      }
      if (!foundGroup) grouped['Altre Partite'].push(match);
    });
    return grouped;
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse uppercase">Caricamento...</div>;

  const groupedMatches = groupMatches();

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-48 font-sans text-center">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 pt-4">
          <h1 className="text-4xl sm:text-5xl font-black text-yellow-500 mb-3 uppercase italic tracking-tighter">Fase a Gironi</h1>
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
            {isExpired ? <Shield size={14} className="text-rose-500" /> : <Clock size={14} className="text-yellow-500" />}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isExpired ? 'Pronostici Chiusi' : 'Compila e salva tutto in fondo'}
            </p>
          </div>
        </header>

        <div className="space-y-4 text-left">
          {Object.entries(groupedMatches).map(([groupName, groupMatchesArray]) => {
            if (groupMatchesArray.length === 0) return null;
            const isOpen = openGroups[groupName];

            return (
              <div key={groupName} className={`bg-slate-900/40 border-2 rounded-[2.5rem] overflow-hidden transition-all duration-300 ${isOpen ? 'border-yellow-500/20 bg-slate-900/80 shadow-2xl' : 'border-slate-800'}`}>
                
                {/* Header Girone (Il pulsante dell'Accordion) */}
                <button 
                  onClick={() => toggleGroup(groupName)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isOpen ? 'bg-yellow-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                      {groupName.split(' ')[1]}
                    </div>
                    <div>
                      <h2 className="font-black text-lg uppercase italic text-white tracking-tight">{groupName}</h2>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{groupMatchesArray.length} Partite</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="text-yellow-500" /> : <ChevronDown className="text-slate-600" />}
                </button>

                {/* Lista Partite (Visibile solo se aperto) */}
                {isOpen && (
                  <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    {groupMatchesArray.map((match) => {
                      const isFinished = match.home_score_final !== null;
                      const hFlag = getFlagCode(match.home_team);
                      const aFlag = getFlagCode(match.away_team);

                      return (
                        <div key={match.id} className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-5 hover:border-slate-700 transition-all">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-600 mb-4 italic">
                            <span>{new Date(match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            <span>MATCH #{match.id}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            {/* Casa */}
                            <div className="flex-1 flex flex-col items-end gap-1 text-right">
                              {hFlag ? <img src={`https://flagcdn.com/w80/${hFlag}.png`} className="w-7 h-auto rounded-sm shadow-sm" alt="" /> : <Shield size={14} className="text-slate-800"/>}
                              <span className="font-black text-[10px] uppercase italic text-slate-200 truncate w-full">{match.home_team}</span>
                            </div>
                            
                            {/* Input */}
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="number" 
                                  value={predictions[match.id]?.home ?? ''} 
                                  disabled={isExpired}
                                  placeholder="-"
                                  className="w-11 h-11 bg-slate-900 border border-slate-800 rounded-xl text-center font-black text-yellow-500 text-lg focus:border-yellow-500 outline-none transition-all disabled:opacity-30"
                                  onChange={(e) => handleInputChange(match.id, 'home', e.target.value)}
                                />
                                <span className="text-slate-800 font-black">:</span>
                                <input 
                                  type="number" 
                                  value={predictions[match.id]?.away ?? ''} 
                                  disabled={isExpired}
                                  placeholder="-"
                                  className="w-11 h-11 bg-slate-900 border border-slate-800 rounded-xl text-center font-black text-yellow-500 text-lg focus:border-yellow-500 outline-none transition-all disabled:opacity-30"
                                  onChange={(e) => handleInputChange(match.id, 'away', e.target.value)}
                                />
                              </div>
                              {isFinished && (
                                <span className="text-[7px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                  FINALE: {match.home_score_final}-{match.away_score_final}
                                </span>
                              )}
                            </div>

                            {/* Trasferta */}
                            <div className="flex-1 flex flex-col items-start gap-1 text-left">
                              {aFlag ? <img src={`https://flagcdn.com/w80/${aFlag}.png`} className="w-7 h-auto rounded-sm shadow-sm" alt="" /> : <Shield size={14} className="text-slate-800"/>}
                              <span className="font-black text-[10px] uppercase italic text-slate-200 truncate w-full">{match.away_team}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottone di salvataggio */}
      {!isExpired && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6 z-50 pointer-events-none">
          <button 
            onClick={saveAllPredictions}
            disabled={saving}
            className="group pointer-events-auto max-w-[280px] w-full bg-yellow-500 text-slate-950 font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] italic shadow-[0_20px_50px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {saving ? 'Salvataggio...' : 'Conferma Pronostici'}
            {!saving && <span>💾</span>}
          </button>
        </div>
      )}
    </main>
  );
}