'use client';
import { useEffect, useState, use } from 'react'; // Aggiunto use per i params
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UserSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Metodo raccomandato in Next.js 15+
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchUserSummary();
  }, [id]);

  async function fetchUserSummary() {
    setLoading(true);
    
    // Recupero dati in parallelo per evitare "waterfall" di caricamento
    const [profileRes, predictionsRes, bracketRes, bonusRes] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', id).single(),
      supabase.from('predictions').select('*, matches(*)').eq('user_id', id),
      supabase.from('brackets').select('*').eq('user_id', id),
      supabase.from('bonuses').select('*').eq('user_id', id).single()
    ]);

    setData({
      username: profileRes.data?.username || 'Utente',
      predictions: predictionsRes.data || [],
      bracket: bracketRes.data || [],
      bonus: bonusRes.data || null
    });
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-yellow-500 font-black animate-pulse uppercase italic tracking-widest">
        Scansione Schedina...
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-20 font-sans">
      <header className="max-w-2xl mx-auto mb-10 pt-6">
        <button onClick={() => router.back()} className="text-slate-500 text-[10px] font-black uppercase mb-4 hover:text-yellow-500 transition-colors">
          ← Torna alla Classifica
        </button>
        <h1 className="text-5xl font-black text-yellow-500 uppercase italic leading-none tracking-tighter">
          {data.username}
        </h1>
        <div className="h-1 w-20 bg-yellow-500 mt-2 italic"></div>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-3 opacity-60">Ticket Ufficiale Mondiale 2026</p>
      </header>

      <div className="max-w-2xl mx-auto space-y-10">
        
        {/* SEZIONE BONUS */}
        <section className="bg-slate-900/40 rounded-[2rem] border border-slate-800/60 p-8 shadow-xl">
          <h2 className="text-yellow-500 text-[10px] font-black uppercase mb-6 tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Super Bonus
          </h2>
          {data.bonus ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="border-l border-slate-800 pl-4">
                <p className="text-slate-500 text-[8px] uppercase font-black tracking-widest mb-1">Capocannoniere</p>
                <p className="text-sm font-bold text-white uppercase italic">{data.bonus.top_scorer}</p>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <p className="text-slate-500 text-[8px] uppercase font-black tracking-widest mb-1">Espulsioni</p>
                <p className="text-sm font-bold text-white uppercase italic">{data.bonus.total_red_cards}</p>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <p className="text-slate-500 text-[8px] uppercase font-black tracking-widest mb-1">Partita Top Gol</p>
                <p className="text-sm font-bold text-white uppercase italic">{data.bonus.high_scoring_match}</p>
              </div>
            </div>
          ) : <p className="text-slate-600 text-[10px] italic">Nessun bonus inserito.</p>}
        </section>

        {/* SEZIONE FASE FINALE */}
        <section className="space-y-4">
          <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] pl-2">🏆 Tabellone Finale</h2>
          <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/60 p-6">
            <div className="flex flex-wrap gap-2">
              {data.bracket.length > 0 ? data.bracket.map((b: any, i: number) => (
                <div key={i} className="bg-slate-950 px-4 py-2 rounded-full border border-slate-800 flex items-center gap-2">
                  <span className="text-[7px] font-black text-yellow-500 uppercase">{b.stage}</span>
                  <span className="text-[11px] font-black text-white uppercase italic">{b.team_name}</span>
                </div>
              )) : <p className="text-slate-600 text-[10px] italic">Tabellone non compilato.</p>}
            </div>
          </div>
        </section>

        {/* SEZIONE GIRONI */}
        <section className="space-y-4">
          <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] pl-2">⚽ Risultati Gironi</h2>
          <div className="grid grid-cols-1 gap-2">
            {data.predictions.length > 0 ? data.predictions.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-slate-900/20 p-4 rounded-2xl border border-slate-800/40 hover:bg-slate-900/40 transition-colors">
                <span className="text-[10px] font-black uppercase italic w-1/3 tracking-tighter">{p.matches?.home_team}</span>
                <span className="bg-slate-950 border border-slate-800 px-4 py-1.5 rounded-xl text-yellow-500 font-black text-sm tabular-nums shadow-inner">
                  {p.home_score} — {p.away_score}
                </span>
                <span className="text-[10px] font-black uppercase italic w-1/3 text-right tracking-tighter">{p.matches?.away_team}</span>
              </div>
            )) : <p className="text-slate-600 text-[10px] italic">Nessun pronostico gironi.</p>}
          </div>
        </section>

      </div>
    </main>
  );
}