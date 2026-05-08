'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [bonusData, setBonusData] = useState<any>(null);

  const ADMIN_EMAIL = "ricky@mondiale.it";

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        const { data: m } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
        const { data: b } = await supabase.from('bonuses').select('*').maybeSingle();
        const { data: p } = await supabase.from('profiles').select('*').order('username', { ascending: true });
        
        setMatches(m || []);
        setBonusData(b);
        setProfiles(p || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  const togglePayment = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_paid: !currentStatus })
      .eq('id', userId);
    
    if (error) {
      toast.error("Errore: " + error.message);
    } else {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, is_paid: !currentStatus } : p));
      toast.success("Stato pagamento aggiornato!");
    }
  };

  const updateScore = async (id: number) => {
    const h = (document.getElementById(`h-${id}`) as HTMLInputElement).value;
    const a = (document.getElementById(`a-${id}`) as HTMLInputElement).value;
    const { error } = await supabase.from('matches').update({
      home_score_final: parseInt(h),
      away_score_final: parseInt(a),
      is_finished: true
    }).eq('id', id);
    toast.success(error ? error.message : "Match aggiornato!");
  };

  const saveBonuses = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('bonuses').update({
      total_red_cards: parseInt(fd.get('red') as string || '0'),
      top_scorer: fd.get('top') as string,
      high_scoring_match: fd.get('high') as string
    }).eq('id', '00000000-0000-0000-0000-000000000000');
    toast.success(error ? error.message : "Bonus salvati!");
  };

  const saveQualif = async () => {
    const team = (document.getElementById('q_team') as HTMLInputElement).value.toUpperCase();
    const stage = (document.getElementById('q_stage') as HTMLSelectElement).value;
    const pts: any = { R32: 2, R16: 4, QF: 6, SF: 8, F: 10, WINNER: 20 };
    
    const { error } = await supabase.from('brackets')
      .update({ points_earned: pts[stage] })
      .match({ stage: stage, team_name: team });
      
    if (error) toast.error(error.message);
    else toast.success(`${team} confermata per ${stage}!`);
  };

  if (loading) return <div className="p-10 text-white animate-pulse uppercase font-black italic">Accesso in corso...</div>;
  if (!isAdmin) return <div className="p-10 text-red-500 font-black uppercase tracking-widest text-center">Accesso Negato</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-black text-yellow-500 italic uppercase tracking-tighter">Pannello Admin</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Control Tower</p>
      </header>

      <div className="max-w-xl mx-auto space-y-16">
        
        {/* 1. GESTIONE PAGAMENTI */}
        <section>
          <h2 className="text-xl font-black border-l-4 border-emerald-500 pl-3 mb-6 uppercase italic">Gestione Quote</h2>
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 divide-y divide-slate-800 overflow-hidden shadow-2xl">
            {profiles.map(p => (
              <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="font-black text-xs uppercase italic tracking-tight text-white">{p.username || 'Guerriero'}</p>
                  <p className="text-[8px] text-slate-500 font-mono">{p.email?.substring(0,20)}...</p>
                </div>
                <button 
                  onClick={() => togglePayment(p.id, p.is_paid)}
                  className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    p.is_paid 
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                    : 'bg-slate-950 text-rose-500 border border-rose-500/30'
                  }`}
                >
                  {p.is_paid ? 'PAGATO ✓' : 'DA PAGARE'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 2. PARTITE */}
        <section>
          <h2 className="text-xl font-black border-l-4 border-yellow-500 pl-3 mb-6 uppercase italic">Risultati Match</h2>
          <div className="space-y-3">
            {matches.map(m => (
              <div key={m.id} className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 shadow-lg">
                <p className="text-[9px] text-slate-500 uppercase font-black text-center mb-3 tracking-widest">{m.home_team} VS {m.away_team}</p>
                <div className="flex gap-2">
                  <input id={`h-${m.id}`} type="number" defaultValue={m.home_score_final} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center font-black text-lg focus:border-yellow-500 outline-none transition-all" />
                  <input id={`a-${m.id}`} type="number" defaultValue={m.away_score_final} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center font-black text-lg focus:border-yellow-500 outline-none transition-all" />
                  <button onClick={() => updateScore(m.id)} className="bg-yellow-500 text-slate-950 px-6 font-black rounded-2xl hover:bg-yellow-400 active:scale-90 transition-all uppercase text-[10px]">OK</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. QUALIFICAZIONI FASE FINALE */}
        <section>
          <h2 className="text-xl font-black border-l-4 border-blue-500 pl-3 mb-6 uppercase italic">Qualificazioni Fase Finale</h2>
          <div className="bg-slate-900 p-6 rounded-[2.5rem] space-y-4 border border-slate-800 shadow-2xl">
            <div>
              <label className="text-[8px] font-black text-slate-500 uppercase ml-2 mb-1 block">Squadra Qualificata</label>
              <input id="q_team" placeholder="ES: ITALIA" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-sm uppercase outline-none focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-500 uppercase ml-2 mb-1 block">Fase Raggiunta</label>
              <select id="q_stage" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-sm uppercase outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                <option value="R32">Sedicesimi (+2pt)</option>
                <option value="R16">Ottavi (+4pt)</option>
                <option value="QF">Quarti (+6pt)</option>
                <option value="SF">Semifinali (+8pt)</option>
                <option value="F">Finale (+10pt)</option>
                <option value="WINNER">Vincitore (+20pt)</option>
              </select>
            </div>
            <button onClick={saveQualif} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
              Conferma Squadra
            </button>
          </div>
        </section>

        {/* 4. BONUS EXTRA */}
        <section>
          <h2 className="text-xl font-black border-l-4 border-purple-500 pl-3 mb-6 uppercase italic">Risultati Super Bonus</h2>
          <form onSubmit={saveBonuses} className="bg-slate-900 p-6 rounded-[2.5rem] space-y-4 border border-slate-800 shadow-2xl">
            <input name="red" type="number" defaultValue={bonusData?.total_red_cards} placeholder="CARTELINI ROSSI" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black uppercase" />
            <input name="top" placeholder="CAPOCANNONIERE" defaultValue={bonusData?.top_scorer} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black uppercase" />
            <input name="high" placeholder="PARTITA CON PIÙ GOL" defaultValue={bonusData?.high_scoring_match} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black uppercase" />
            <button type="submit" className="w-full bg-purple-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
              Salva Bonus
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}