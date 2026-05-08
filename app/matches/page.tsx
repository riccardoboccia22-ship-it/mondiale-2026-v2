'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const WORLD_CUP_START_DATE = new Date('2026-06-11T21:00:00+02:00');

// --- MAPPA BANDIERE (Sincronizzata e Completa) ---
const flagMap: { [key: string]: string } = {
  'algeria': 'dz', 'arabia saudita': 'sa', 'argentina': 'ar', 'australia': 'au', 'austria': 'at',
  'belgio': 'be', 'bosnia ed erzegovina': 'ba', 'brasile': 'br', 'canada': 'ca', 'capo verde': 'cv',
  'colombia': 'co', 'corea del sud': 'kr', 'costa d\'avorio': 'ci', 'croazia': 'hr', 'curaçao': 'cw', 
  'ecuador': 'ec', 'egitto': 'eg', 'francia': 'fr', 'germania': 'de', 'ghana': 'gh', 'giappone': 'jp', 
  'giordania': 'jo', 'haiti': 'ht', 'inghilterra': 'gb-eng', 'iran': 'ir', 'iraq': 'iq', 'marocco': 'ma', 
  'messico': 'mx', 'norvegia': 'no', 'nuova zelanda': 'nz', 'olanda': 'nl', 'panama': 'pa', 'paraguay': 'py',
  'portogallo': 'pt', 'qatar': 'qa', 'repubblica ceca': 'cz', 'repubblica democratica del congo': 'cd',
  'scozia': 'gb-sct', 'senegal': 'sn', 'spagna': 'es', 'stati uniti': 'us', 'usa': 'us',
  'sudafrica': 'za', 'svezia': 'se', 'svizzera': 'ch', 'tunisia': 'tn', 'turchia': 'tr', 
  'uruguay': 'uy', 'uzbekistan': 'uz'
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [predictions, setPredictions] = useState<any>({});
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

  const getFlag = (team: string) => {
    const code = flagMap[team?.toLowerCase().trim()];
    return code ? `https://flagcdn.com/w80/${code}.png` : null;
  };

  // --- LOGICA SALVATAGGIO MASSIVO ---
  const saveAllPredictions = async () => {
    if (isExpired) return toast.error("Le giocate sono chiuse!");
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/profile');
      return;
    }

    // Trasformiamo l'oggetto predictions in un array pronto per Supabase
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

    const { error } = await supabase
      .from('predictions')
      .upsert(rowsToUpsert, { onConflict: 'match_id,user_id' });

    if (error) {
      toast.error("Errore durante il salvataggio");
    } else {
      toast.success(`${rowsToUpsert.length} pronostici salvati con successo! 🏆`);
    }
    setSaving(false);
  };

  const handleInputChange = (matchId: number, team: 'home' | 'away', value: string) => {
    if (isExpired || (value !== '' && parseInt(value) < 0)) return;
    setPredictions({ 
      ...predictions, 
      [matchId]: { ...predictions[matchId], [team]: value } 
    });
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse italic uppercase tracking-widest">Caricamento Partite...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-48 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10 pt-4">
          <h1 className="text-4xl sm:text-5xl font-black text-yellow-500 mb-2 uppercase italic tracking-tighter">Fase a Gironi</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
            {isExpired ? '🔒 Pronostici Chiusi' : 'Compila i risultati e salva tutto in fondo'}
          </p>
        </header>

        <div className="space-y-6">
          {matches.map((match) => {
            const isFinished = match.home_score_final !== null;
            return (
              <div key={match.id} className="bg-slate-900/60 border-2 border-slate-800 rounded-[2.5rem] p-6 transition-all hover:border-slate-700">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 mb-6 px-2 italic">
                  <span>{new Date(match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>MATCH #{match.id}</span>
                </div>

                <div className="flex items-center justify-between gap-3 sm:gap-6">
                  {/* Home Team */}
                  <div className="flex-1 flex flex-col items-end gap-2 text-right">
                    {getFlag(match.home_team) && <img src={getFlag(match.home_team)!} className="w-8 h-auto shadow-md rounded-sm" alt="" />}
                    <span className="font-black text-[10px] sm:text-xs uppercase italic leading-tight">{match.home_team}</span>
                  </div>
                  
                  {/* Inputs */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={predictions[match.id]?.home ?? ''} 
                        disabled={isExpired}
                        placeholder="-"
                        className="w-14 h-14 bg-slate-950 border-2 border-slate-800 rounded-2xl text-center font-black text-yellow-500 text-2xl focus:border-yellow-500 outline-none transition-all disabled:opacity-50"
                        onChange={(e) => handleInputChange(match.id, 'home', e.target.value)}
                      />
                      <span className="text-slate-800 font-black text-xl">:</span>
                      <input 
                        type="number" 
                        value={predictions[match.id]?.away ?? ''} 
                        disabled={isExpired}
                        placeholder="-"
                        className="w-14 h-14 bg-slate-950 border-2 border-slate-800 rounded-2xl text-center font-black text-yellow-500 text-2xl focus:border-yellow-500 outline-none transition-all disabled:opacity-50"
                        onChange={(e) => handleInputChange(match.id, 'away', e.target.value)}
                      />
                    </div>
                    {isFinished && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        <p className="text-[9px] font-black text-emerald-500 uppercase italic">Finale: {match.home_score_final} - {match.away_score_final}</p>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex flex-col items-start gap-2 text-left">
                    {getFlag(match.away_team) && <img src={getFlag(match.away_team)!} className="w-8 h-auto shadow-md rounded-sm" alt="" />}
                    <span className="font-black text-[10px] sm:text-xs uppercase italic leading-tight">{match.away_team}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- BOTTONE FISSO DI SALVATAGGIO MASSIVO --- */}
      {!isExpired && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6 z-50 pointer-events-none">
          <button 
            onClick={saveAllPredictions}
            disabled={saving}
            className="group pointer-events-auto max-w-xs w-full bg-yellow-500 text-slate-950 font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs italic shadow-[0_20px_50px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {saving ? 'Salvataggio in corso...' : 'Salva Tutti i Pronostici'}
            {!saving && <span className="text-lg">💾</span>}
          </button>
        </div>
      )}
    </main>
  );
}