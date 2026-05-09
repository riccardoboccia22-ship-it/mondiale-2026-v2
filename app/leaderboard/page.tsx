'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Crown, Star, ArrowUp } from 'lucide-react';

const STAGE_POINTS: { [key: string]: number } = {
  'R32': 2, 'R16': 4, 'QF': 6, 'SF': 8, 'F': 10, 'WINNER': 20
};

const normalizeStage = (s: string) => {
  if (!s) return '';
  const upper = s.toUpperCase().trim();
  if (upper.includes('SEDICESIMI') || upper === 'R32') return 'R32';
  if (upper.includes('OTTAVI') || upper === 'R16') return 'R16';
  if (upper.includes('QUARTI') || upper === 'QF') return 'QF';
  if (upper.includes('SEMIFINALE') || upper === 'SF') return 'SF';
  if (upper.includes('VINCITORE') || upper === 'WINNER') return 'WINNER';
  if (upper === 'FINALE' || upper === 'F') return 'F';
  return upper;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runPointsUpdate();
  }, []);

  async function runPointsUpdate() {
    try {
      setLoading(true);
      
      // FIX ARCHITETTURA: Puntiamo alle due nuove tabelle separate
      const [prf, mtc, prd, brk, off, offBon, usrBon] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('matches').select('*'),
        supabase.from('predictions').select('*'),
        supabase.from('brackets').select('*'),
        supabase.from('official_bracket').select('*'),
        supabase.from('official_bonuses').select('*').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
        supabase.from('user_bonus_answers').select('*')
      ]);

      if (!prf.data) return;
      
      // I risultati ufficiali dell'Admin
      const officialBonus = offBon.data;

      const calculatedProfiles = prf.data.map((user) => {
        // 1. PUNTI GIRONI (10 - 6 - 4)
        let gironiPoints = 0;
        const userPreds = prd.data?.filter((p) => p.user_id === user.id) || [];
        userPreds.forEach((pred) => {
          const m = mtc.data?.find((match) => match.id === pred.match_id);
          if (m && m.home_score_final !== null) {
            const ph = Number(pred.home_score); const pa = Number(pred.away_score);
            const mh = Number(m.home_score_final); const ma = Number(m.away_score_final);
            const pRes = ph > pa ? '1' : ph < pa ? '2' : 'X';
            const mRes = mh > ma ? '1' : mh < ma ? '2' : 'X';
            
            if (ph === mh && pa === ma) gironiPoints += 10;
            else if (pRes === mRes && (ph === mh || pa === ma)) gironiPoints += 6;
            else if (pRes === mRes) gironiPoints += 4;
            // Bonus consolazione: un risultato azzeccato ma segno sbagliato
            else if (ph === mh || pa === ma) gironiPoints += 2;
          }
        });

        // 2. PUNTI BRACKET (FF)
        let bracketPoints = 0;
        const userBrackets = brk.data?.filter((b) => b.user_id === user.id) || [];
        userBrackets.forEach((b) => {
          const normalizedUserStage = normalizeStage(b.stage);
          const isCorrect = off.data?.some((o) => 
            normalizeStage(o.stage) === normalizedUserStage && 
            o.team_name.trim().toLowerCase() === b.team_name.trim().toLowerCase()
          );
          if (isCorrect) bracketPoints += STAGE_POINTS[normalizedUserStage] || 0;
        });

        // 3. PUNTI BONUS
        let bonusPoints = 0;
        // Peschiamo dalla tabella delle risposte utenti
        const userBonus = usrBon.data?.find(b => b.user_id === user.id);
        
        if (userBonus && officialBonus) {
          if (officialBonus.total_red_cards > 0 && userBonus.total_red_cards === officialBonus.total_red_cards) bonusPoints += 10;
          if (officialBonus.top_scorer && userBonus.top_scorer?.trim().toLowerCase() === officialBonus.top_scorer.trim().toLowerCase()) bonusPoints += 10;
          if (officialBonus.high_scoring_match && userBonus.high_scoring_match?.trim().toLowerCase() === officialBonus.high_scoring_match.trim().toLowerCase()) bonusPoints += 10;
        }

        const total = gironiPoints + bracketPoints + bonusPoints;
        return { ...user, points: total, points_groups: gironiPoints, points_bracket: bracketPoints, points_bonus: bonusPoints };
      });

      const sorted = calculatedProfiles.sort((a, b) => b.points - a.points);
      const ranked = sorted.map((u, i) => ({ ...u, ranking: i + 1 }));

      setLeaderboard(ranked);

      // Sincronizzazione Silenziosa Database
      ranked.forEach(async (u) => {
        if (u.points !== u.db_points_backup) { 
          await supabase.from('profiles').update({
            points: u.points,
            points_groups: u.points_groups,
            points_bracket: u.points_bracket,
            points_bonus: u.points_bonus,
            ranking: u.ranking
          }).eq('id', u.id);
        }
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={20} />;
    if (rank === 2) return <Medal className="text-slate-300" size={20} />;
    if (rank === 3) return <Medal className="text-amber-700" size={20} />;
    return <span className="text-slate-500 text-[10px] font-black italic ml-1">#{rank}</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-yellow-500 font-black uppercase italic tracking-[0.2em] animate-pulse">Calcolo Ranking Mondiale...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-32 font-sans">
      <header className="text-center mb-12 mt-6">
        <h1 className="text-5xl font-black text-yellow-500 uppercase italic tracking-tighter">Classifica</h1>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Live World Cup Rankings</p>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* Header Colonne Leggibile */}
        <div className="flex px-6 mb-4 text-[9px] font-black text-slate-600 uppercase tracking-widest italic">
          <div className="flex-1">Giocatore</div>
          <div className="flex gap-6 md:gap-10 pr-2">
            <div className="w-8 text-center">Gironi</div>
            <div className="w-8 text-center">FF</div>
            <div className="w-8 text-center">Bonus</div>
            <div className="w-12 text-center text-yellow-500 border-b border-yellow-500/20">Tot</div>
          </div>
        </div>

        <div className="space-y-3">
          {leaderboard.map((player) => (
            <div 
              key={player.id} 
              className={`flex items-center p-5 rounded-[2rem] border transition-all ${
                player.ranking === 1 
                ? 'bg-yellow-500/10 border-yellow-500/40 shadow-2xl shadow-yellow-500/5 scale-[1.02]' 
                : 'bg-slate-900/40 border-slate-800/60'
              }`}
            >
              {/* Rank & Info */}
              <div className="flex-1 flex items-center gap-4 min-w-0">
                <div className="w-8 flex justify-center shrink-0">
                  {getRankIcon(player.ranking)}
                </div>
                <div className="truncate">
                  <p className="font-black uppercase italic text-sm md:text-base tracking-tight leading-none mb-1">
                    {player.username}
                  </p>
                  {player.is_paid ? (
                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Quota OK ✓</span>
                  ) : (
                    <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Manca Quota!</span>
                  )}
                </div>
              </div>

              {/* Punteggi Dettagliati */}
              <div className="flex items-center gap-6 md:gap-10 shrink-0 ml-2">
                <div className="w-8 text-center text-[10px] md:text-xs font-bold text-slate-500">
                  {player.points_groups}
                </div>
                <div className="w-8 text-center text-[10px] md:text-xs font-bold text-slate-500">
                  {player.points_bracket}
                </div>
                <div className={`w-8 text-center text-[10px] md:text-xs font-bold ${player.points_bonus > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {player.points_bonus}
                </div>
                <div className={`w-12 text-center font-black italic text-xl md:text-3xl ${
                  player.ranking === 1 ? 'text-yellow-500' : 'text-white'
                }`}>
                  {player.points}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}