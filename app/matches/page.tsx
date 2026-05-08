'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Data di inizio del Mondiale 2026
const WORLD_CUP_START_DATE = new Date('2026-06-11T21:00:00+02:00');

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      
      // 1. Carichiamo le partite (inclusi i risultati finali inseriti dall'admin)
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      setMatches(matchesData || []);

      // 2. Se l'utente è loggato, carichiamo i suoi pronostici esistenti
      if (user) {
        const { data: predData } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id);

        if (predData) {
          const predMap: any = {};
          predData.forEach(p => {
            predMap[p.match_id] = { home: p.home_score, away: p.away_score };
          });
          setPredictions(predMap);
        }
      }
    } catch (error) {
      console.error('Errore:', error);
      toast.error("Errore nel caricamento dati");
    } finally {
      setLoading(false);
    }
  }

  const savePrediction = async (matchId: number) => {
    if (isExpired) {
      toast.error("Tempo scaduto! Giocate chiuse.");
      return;
    }

    const pred = predictions[matchId];
    if (!pred || pred.home === undefined || pred.away === undefined || pred.home === '' || pred.away === '') {
      toast.error('Inserisci entrambi i gol!');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Devi accedere per giocare");
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('predictions').upsert({
      match_id: matchId,
      user_id: user.id,
      home_score: parseInt(pred.home),
      away_score: parseInt(pred.away),
    }, { onConflict: 'match_id,user_id' });

    if (error) {
      toast.error('Errore nel salvataggio');
    } else {
      toast.success('Pronostico registrato! ⚽');
    }
  };

  const handleInputChange = (matchId: number, team: 'home' | 'away', value: string) => {
    if (isExpired) return;
    setPredictions({
      ...predictions,
      [matchId]: { ...predictions[matchId], [team]: value }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-black uppercase tracking-[0.3em] italic text-yellow-500 animate-pulse">
        Preparazione Campo...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-32">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12 pt-4">
          <h1 className="text-5xl font-black text-yellow-500 mb-2 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            Fase a Gironi
          </h1>
          <div className="mt-2 text-[10px] font-black uppercase tracking-widest italic">
            {isExpired ? (
              <span className="text-red-500 underline decoration-red-500/30 underline-offset-4">🔒 Schedine Chiuse</span>
            ) : (
              <span className="text-slate-500">Salva ogni partita singolarmente</span>
            )}
          </div>
        </header>

        <div className="space-y-6">
          {matches.map((match) => {
            const hasPrediction = predictions[match.id]?.home !== undefined;
            
            return (
              <div key={match.id} className={`bg-slate-900/40 border ${hasPrediction ? 'border-blue-500/30' : 'border-slate-800'} p-6 rounded-[2.5rem] relative overflow-hidden transition-all group ${isExpired ? 'opacity-70' : 'hover:border-yellow-500/40 hover:bg-slate-900/60'}`}>
                
                <div className="flex justify-between text-[9px] text-slate-500 font-black mb-6 uppercase tracking-widest px-2 italic">
                  <span>{new Date(match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={hasPrediction ? "text-blue-400" : "text-yellow-500/40"}>
                    {hasPrediction ? "✓ SALVATO" : match.stage}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Home Team */}
                  <div className="flex-1 flex items-center justify-end gap-3 text-right">
                    <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight truncate">{match.home_team}</span>
                    <div className="w-8 h-5 flex-shrink-0 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
                      {match.home_code && (
                        <img src={`https://flagcdn.com/w80/${match.home_code.toLowerCase()}.png`} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                  </div>
                  
                  {/* Inputs e Risultato Finale */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <input 
                        type="number" 
                        placeholder="-"
                        value={predictions[match.id]?.home ?? ''}
                        disabled={isExpired}
                        className="w-11 h-11 sm:w-14 sm:h-14 bg-slate-950 border-2 border-slate-800 rounded-2xl text-center font-black text-yellow-500 text-xl focus:outline-none focus:border-yellow-500 transition-all appearance-none disabled:opacity-50"
                        onChange={(e) => handleInputChange(match.id, 'home', e.target.value)}
                      />
                      <span className="text-slate-700 font-black text-xl">:</span>
                      <input 
                        type="number" 
                        placeholder="-"
                        value={predictions[match.id]?.away ?? ''}
                        disabled={isExpired}
                        className="w-11 h-11 sm:w-14 sm:h-14 bg-slate-950 border-2 border-slate-800 rounded-2xl text-center font-black text-yellow-500 text-xl focus:outline-none focus:border-yellow-500 transition-all appearance-none disabled:opacity-50"
                        onChange={(e) => handleInputChange(match.id, 'away', e.target.value)}
                      />
                    </div>

                    {/* Badge Risultato Reale dell'Admin */}
                    {(match.home_score_final !== null && match.home_score_final !== undefined) && (
                      <div className="mt-1 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full animate-in zoom-in duration-500">
                        <p className="text-[9px] font-black text-yellow-500 uppercase italic">
                          Finale: {match.home_score_final} - {match.away_score_final}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex items-center justify-start gap-3 text-left">
                    <div className="w-8 h-5 flex-shrink-0 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
                      {match.away_code && (
                        <img src={`https://flagcdn.com/w80/${match.away_code.toLowerCase()}.png`} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                    <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight truncate">{match.away_team}</span>
                  </div>
                </div>

                <div className="mt-8">
                  {!isExpired && (
                    <button 
                      onClick={() => savePrediction(match.id)}
                      className={`w-full py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] border active:scale-[0.98] ${
                        hasPrediction 
                        ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-yellow-500 hover:text-slate-950 hover:border-yellow-500'
                      }`}
                    >
                      {hasPrediction ? 'Aggiorna Risultato' : 'Invia Risultato'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}