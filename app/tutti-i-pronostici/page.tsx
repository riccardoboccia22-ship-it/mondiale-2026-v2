'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TuttiPronosticiPage() {
  const [data, setData] = useState<{
    profiles: any[];
    matches: any[];
    predictions: any[];
  }>({ profiles: [], matches: [], predictions: [] });
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [pRes, mRes, prRes] = await Promise.all([
          // Aggiunto ordine alfabetico per gestire meglio 50+ persone
          supabase
            .from('profiles')
            .select('id, username')
            .order('username', { ascending: true }),
          supabase.from('matches').select('*').order('id'),
          supabase.from('predictions').select('*'),
        ]);

        setData({
          profiles: pRes.data || [],
          matches: mRes.data || [],
          predictions: prRes.data || [],
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-yellow-500 font-black italic animate-pulse">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        RECUPERO SCHEDINE...
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-32">
      <header className="text-center mb-10 mt-6">
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter">
          Pronostici Globali
        </h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
          Tutti i risultati della community
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {data.matches.map((match) => {
          const matchPredictions = data.predictions.filter(
            (p) => p.match_id === match.id
          );
          const isExpanded = expandedMatch === match.id;
          const isFinished =
            match.home_score_final !== null && match.away_score_final !== null;

          return (
            <div
              key={match.id}
              className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden transition-all duration-300 shadow-xl"
            >
              {/* HEADER DELLA PARTITA */}
              <button
                onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Match #{match.id}
                    </span>
                    {isFinished && (
                      <span className="bg-yellow-500/10 text-yellow-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase">
                        Terminata
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white">
                    {match.home_team} <span className="text-yellow-500">v</span>{' '}
                    {match.away_team}
                  </h3>
                </div>

                <div className="text-right">
                  {isFinished ? (
                    <div className="text-2xl font-black italic text-yellow-500">
                      {match.home_score_final} - {match.away_score_final}
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-widest italic">
                      Da giocare
                    </div>
                  )}
                  <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold">
                    {isExpanded
                      ? 'Chiudi ▲'
                      : `${matchPredictions.length} Pronostici ▼`}
                  </div>
                </div>
              </button>

              {/* LISTA UTENTI (ACCORDION) */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/50 animate-in slide-in-from-top duration-300">
                  <div className="grid grid-cols-1 divide-y divide-slate-800/30">
                    {data.profiles.map((user) => {
                      const pred = matchPredictions.find(
                        (p) => p.user_id === user.id
                      );

                      // LOGICA COLORI E PUNTI
                      let textColor = 'text-slate-500';
                      let pointsLabel = '';

                      if (pred && isFinished) {
                        const ph = Number(pred.home_score);
                        const pa = Number(pred.away_score);
                        const mh = Number(match.home_score_final);
                        const ma = Number(match.away_score_final);

                        const pRes = ph > pa ? '1' : ph < pa ? '2' : 'X';
                        const mRes = mh > ma ? '1' : mh < ma ? '2' : 'X';

                        const homeOk = ph === mh;
                        const awayOk = pa === ma;
                        const signOk = pRes === mRes;

                        if (homeOk && awayOk) {
                          textColor =
                            'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]';
                          pointsLabel = '+10 PT';
                        } else if (signOk && (homeOk || awayOk)) {
                          textColor = 'text-sky-400';
                          pointsLabel = '+6 PT';
                        } else if (signOk) {
                          textColor = 'text-amber-400';
                          pointsLabel = '+4 PT';
                        } else if (homeOk || awayOk) {
                          textColor = 'text-fuchsia-400';
                          pointsLabel = '+2 PT';
                        } else {
                          pointsLabel = '0 PT';
                        }
                      }

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 px-8 hover:bg-slate-800/20 transition-all"
                        >
                          <span className="text-sm font-bold uppercase italic text-slate-400">
                            {user.username}
                          </span>
                          <div className="text-right">
                            <span
                              className={`font-black text-xl italic tracking-tighter block ${
                                pred ? textColor : 'text-slate-800'
                              }`}
                            >
                              {pred
                                ? `${pred.home_score} - ${pred.away_score}`
                                : '--'}
                            </span>
                            {isFinished && pred && (
                              <span
                                className={`text-[8px] font-black uppercase tracking-tighter ${textColor} opacity-80`}
                              >
                                {pointsLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
