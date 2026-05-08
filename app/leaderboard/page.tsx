'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runPointsUpdate();
  }, []);

  async function runPointsUpdate() {
    try {
      setLoading(true);
      console.log('🚀 Sincronizzazione Globale in corso...');

      // 1. Scarichiamo tutti i dati necessari in parallelo
      const [mRes, pRes, prRes] = await Promise.all([
        supabase.from('matches').select('*'),
        supabase.from('predictions').select('*'),
        supabase.from('profiles').select('*'),
      ]);

      const matches = mRes.data || [];
      const predictions = pRes.data || [];
      const profiles = prRes.data || [];

      // 2. Calcolo dei punti basato sulle tue regole (10, 6, 4, 2)
      const calculatedProfiles = profiles.map((user) => {
        let matchPoints = 0;
        const userPreds = predictions.filter((pre) => pre.user_id === user.id);

        userPreds.forEach((pred) => {
          const match = matches.find((m) => m.id === pred.match_id);

          // Calcoliamo solo se l'admin ha inserito il risultato finale
          if (
            match &&
            match.home_score_final !== null &&
            match.away_score_final !== null
          ) {
            const ph = Number(pred.home_score);
            const pa = Number(pred.away_score);
            const mh = Number(match.home_score_final);
            const ma = Number(match.away_score_final);

            const pRes = ph > pa ? '1' : ph < pa ? '2' : 'X';
            const mRes = mh > ma ? '1' : mh < ma ? '2' : 'X';

            const homeOk = ph === mh;
            const awayOk = pa === ma;
            const signOk = pRes === mRes;

            if (homeOk && awayOk) matchPoints += 10;
            else if (signOk && (homeOk || awayOk)) matchPoints += 6;
            else if (signOk) matchPoints += 4;
            else if (homeOk || awayOk) matchPoints += 2;
          }
        });

        // Sommiamo i punti dei gironi (matchPoints) + bracket + bonus
        const totalFinal =
          matchPoints + (user.points_bracket || 0) + (user.points_bonus || 0);

        return {
          ...user,
          calculatedPoints: totalFinal,
          calculatedGroups: matchPoints,
        };
      });

      // 3. Ordinamento per definire il Ranking
      const sorted = calculatedProfiles.sort(
        (a, b) => b.calculatedPoints - a.calculatedPoints
      );

      // 4. Aggiornamento massivo del Database
      // Usiamo un ciclo per aggiornare punti e posizione (ranking) di tutti
      const updatePromises = sorted.map(async (user, index) => {
        const rank = index + 1;
        const { error } = await supabase
          .from('profiles')
          .update({
            points: user.calculatedPoints,
            points_groups: user.calculatedGroups,
            ranking: rank,
          })
          .eq('id', user.id);

        if (error) console.error(`Errore update ${user.username}:`, error);

        return { ...user, points: user.calculatedPoints, ranking: rank };
      });

      const finalData = await Promise.all(updatePromises);
      setLeaderboard(finalData);
    } catch (err) {
      console.error('Errore critico leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-yellow-500 font-black uppercase italic tracking-widest text-[10px]">
          Aggiornamento Ranking...
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-32">
      <header className="text-center mb-12 mt-8">
        <h1 className="text-6xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          Classifica
        </h1>
      </header>

      <div className="max-w-2xl mx-auto space-y-3">
        {/* Intestazione Colonne */}
        <div className="grid grid-cols-5 gap-2 px-8 mb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
          <div className="col-span-1 text-left">Guerriero</div>
          <div>Gironi</div>
          <div>Bracket</div>
          <div>Bonus</div>
          <div className="text-yellow-500">Totale</div>
        </div>

        {/* Righe Giocatori */}
        {leaderboard.map((player) => (
          <div
            key={player.id}
            className={`grid grid-cols-5 gap-2 items-center p-6 rounded-[2rem] border transition-all ${
              player.ranking === 1
                ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="col-span-1 flex flex-col items-start overflow-hidden">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black italic ${
                    player.ranking === 1 ? 'text-yellow-500' : 'text-slate-500'
                  }`}
                >
                  #{player.ranking || '--'}
                </span>
                <span className="text-sm font-black uppercase italic truncate">
                  {player.username}
                </span>
              </div>
            </div>

            <div className="text-center font-bold text-slate-400">
              {player.points_groups || 0}
            </div>
            <div className="text-center font-bold text-slate-400">
              {player.points_bracket || 0}
            </div>
            <div className="text-center font-bold text-slate-400">
              {player.points_bonus || 0}
            </div>

            <div
              className={`text-center font-black italic text-2xl ${
                player.ranking === 1 ? 'text-yellow-500' : 'text-white'
              }`}
            >
              {player.points || 0}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
