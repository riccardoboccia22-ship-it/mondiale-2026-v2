'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheck, 
  Trophy, 
  Users, 
  Zap, 
  Search, 
  Trash2, 
  CheckCircle2,
  Star // <--- IMPORTATA CORRETTAMENTE ORA
} from 'lucide-react';

// --- CONFIGURAZIONE ---
const ADMIN_EMAIL = "ricky@mondiale.it";

const STAGES = [
  { id: 'R32', label: 'Sedicesimi (+2pt)' },
  { id: 'R16', label: 'Ottavi (+4pt)' },
  { id: 'QF', label: 'Quarti (+6pt)' },
  { id: 'SF', label: 'Semifinale (+8pt)' },
  { id: 'F', label: 'Finale (+10pt)' },
  { id: 'WINNER', label: 'Vincitore Mondiale (+20pt)' },
];

const TEAMS_2026 = [
  "Algeria", "Arabia Saudita", "Argentina", "Australia", "Austria", "Belgio", 
  "Bosnia ed Erzegovina", "Brasile", "Canada", "Capo Verde", "Colombia", 
  "Corea del Sud", "Costa d'Avorio", "Croazia", "Curaçao", "Ecuador", "Egitto", 
  "Francia", "Germania", "Ghana", "Giappone", "Giordania", "Haiti", "Inghilterra", 
  "Iran", "Iraq", "Marocco", "Messico", "Norvegia", "Nuova Zelanda", "Olanda", 
  "Panama", "Paraguay", "Portogallo", "Qatar", "Repubblica Ceca", 
  "Repubblica Democratica del Congo", "Scozia", "Senegal", "Spagna", 
  "Stati Uniti", "Sudafrica", "Svezia", "Svizzera", "Tunisia", "Turchia", 
  "Uruguay", "Uzbekistan"
].sort();

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [officialBracket, setOfficialBracket] = useState<any[]>([]);
  const [bonusData, setBonusData] = useState({ red: '', top: '', high: '' });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        fetchData();
      }
      setLoading(false);
    }
    init();
  }, []);

  async function fetchData() {
    const [mRes, bRes, pRes, obRes] = await Promise.all([
      supabase.from('matches').select('*').order('id', { ascending: true }),
      supabase.from('bonuses').select('*').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
      supabase.from('profiles').select('*').order('username', { ascending: true }),
      supabase.from('official_bracket').select('*')
    ]);
    setMatches(mRes.data || []);
    setProfiles(pRes.data || []);
    setOfficialBracket(obRes.data || []);
    if (bRes.data) {
      setBonusData({
        red: bRes.data.total_red_cards?.toString() || '',
        top: bRes.data.top_scorer || '',
        high: bRes.data.high_scoring_match || ''
      });
    }
  }

  const updateScore = async (id: number) => {
    const h = (document.getElementById(`h-${id}`) as HTMLInputElement).value;
    const a = (document.getElementById(`a-${id}`) as HTMLInputElement).value;
    const { error } = await supabase.from('matches').update({
      home_score_final: parseInt(h),
      away_score_final: parseInt(a),
      is_finished: true
    }).eq('id', id);

    if (error) toast.error(error.message);
    else {
      toast.success("Risultato Match salvato!");
      setMatches(matches.map(m => m.id === id ? { ...m, is_finished: true, home_score_final: h, away_score_final: a } : m));
    }
  };

  const saveBonuses = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('bonuses').upsert({
      id: '00000000-0000-0000-0000-000000000000', 
      user_id: null, 
      total_red_cards: parseInt(bonusData.red) || 0,
      top_scorer: bonusData.top.trim(),
      high_scoring_match: bonusData.high.trim()
    }, { onConflict: 'id' });

    if (error) toast.error(error.message);
    else toast.success("Bonus Ufficiali aggiornati!");
  };

  const saveQualif = async () => {
    const team = (document.getElementById('q_team') as HTMLSelectElement).value;
    const stage = (document.getElementById('q_stage') as HTMLSelectElement).value;
    if (!team) return toast.error("Seleziona squadra!");
    
    const { error } = await supabase.from('official_bracket').insert([{ stage, team_name: team }]);
    if (error) toast.error(error.message);
    else {
      toast.success(`${team} registrata in ${stage}!`);
      fetchData();
    }
  };

  const deleteQualif = async (id: number) => {
    const { error } = await supabase.from('official_bracket').delete().eq('id', id);
    if (!error) fetchData();
  };

  const togglePayment = async (userId: string, status: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_paid: !status }).eq('id', userId);
    if (!error) setProfiles(profiles.map(p => p.id === userId ? { ...p, is_paid: !status } : p));
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse uppercase italic">Control Tower Inizializzazione...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-10"><div className="text-rose-500 font-black border-4 border-rose-500 p-10 uppercase tracking-[0.4em]">ACCESSO NEGATO</div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-32 font-sans">
      <header className="text-center mb-12 pt-6">
        <h1 className="text-5xl font-black text-yellow-500 italic uppercase tracking-tighter">Control Tower</h1>
        <div className="flex justify-center gap-4 mt-2">
           <span className="text-[10px] bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-slate-500 font-black uppercase tracking-widest">Admin Mode</span>
           <span className="text-[10px] bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 text-yellow-500 font-black uppercase tracking-widest">v2.6 Stable</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto space-y-20">
        
        {/* --- CASSA --- */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-emerald-500" size={24} />
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Iscrizioni</h2>
          </div>
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 divide-y divide-slate-800/50 overflow-hidden shadow-2xl">
            {profiles.map(p => (
              <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-800/20 transition-all">
                <div className="flex flex-col">
                  <p className="font-black text-sm uppercase italic text-white tracking-tight">{p.username || 'Guerriero'}</p>
                  <p className="text-[9px] text-slate-500 font-mono tracking-tighter">{p.email}</p>
                </div>
                <button 
                  onClick={() => togglePayment(p.id, p.is_paid)} 
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                    p.is_paid 
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                      : 'bg-slate-950 text-rose-500 border border-rose-500/30'
                  }`}
                >
                  {p.is_paid ? <CheckCircle2 size={14} /> : null}
                  {p.is_paid ? 'PAGATO' : 'DA PAGARE'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* --- MATCH --- */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500" size={24} />
              <h2 className="text-2xl font-black uppercase italic tracking-tight">Risultati Reali</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="CERCA..." 
                className="bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black uppercase focus:border-yellow-500 outline-none w-full sm:w-64 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid gap-6">
            {matches.filter(m => m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) || m.away_team.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
              <div key={m.id} className={`bg-slate-900/40 p-8 rounded-[3rem] border transition-all ${m.is_finished ? 'border-emerald-500/20 shadow-none' : 'border-slate-800 shadow-2xl'}`}>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest italic">ID #{m.id}</span>
                  {m.is_finished && <span className="text-[10px] text-emerald-400 font-black uppercase italic tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full">FINITA</span>}
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-center space-y-2">
                    <p className="font-black uppercase italic text-xs tracking-tight">{m.home_team}</p>
                    <input id={`h-${m.id}`} type="number" defaultValue={m.home_score_final} className="w-20 h-20 bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] text-center font-black text-4xl text-yellow-500 focus:border-yellow-500 outline-none" />
                  </div>
                  <div className="text-slate-800 font-black text-2xl mt-8">:</div>
                  <div className="flex-1 text-center space-y-2">
                    <p className="font-black uppercase italic text-xs tracking-tight">{m.away_team}</p>
                    <input id={`a-${m.id}`} type="number" defaultValue={m.away_score_final} className="w-20 h-20 bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] text-center font-black text-4xl text-yellow-500 focus:border-yellow-500 outline-none" />
                  </div>
                </div>

                <button 
                  onClick={() => updateScore(m.id)} 
                  className={`w-full mt-8 py-5 rounded-2xl font-black uppercase text-xs italic tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    m.is_finished ? 'bg-emerald-500 text-slate-950' : 'bg-yellow-500 text-slate-950 hover:bg-yellow-400'
                  }`}
                >
                  <ShieldCheck size={18} /> {m.is_finished ? 'AGGIORNA' : 'SALVA'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* --- QUALIFICAZIONI --- */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-blue-500" size={24} />
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Tabellone</h2>
          </div>
          <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select id="q_team" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl font-black text-xs uppercase outline-none focus:border-blue-500 cursor-pointer">
                <option value="">SQUADRA...</option>
                {TEAMS_2026.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select id="q_stage" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl font-black text-xs uppercase outline-none focus:border-blue-500 cursor-pointer">
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <button onClick={saveQualif} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 shadow-xl">CONFERMA QUALIFICATA</button>
            <div className="mt-8 flex flex-wrap gap-2">
                {officialBracket.map(o => (
                  <div key={o.id} className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-blue-400">{o.stage}</span>
                    <span className="text-[10px] font-black uppercase">{o.team_name}</span>
                    <button onClick={() => deleteQualif(o.id)}><Trash2 size={12} className="text-rose-500"/></button>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* --- BONUS --- */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Star className="text-purple-500" size={24} />
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Super Bonus</h2>
          </div>
          <form onSubmit={saveBonuses} className="bg-slate-900 p-8 rounded-[3rem] space-y-5 border border-slate-800 shadow-2xl">
            <input 
              value={bonusData.red} 
              onChange={(e) => setBonusData({...bonusData, red: e.target.value})}
              type="number" 
              placeholder="ROSSI TOTALI"
              className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl font-black text-xl text-purple-400 outline-none" 
            />
            <input 
              value={bonusData.top}
              onChange={(e) => setBonusData({...bonusData, top: e.target.value})}
              placeholder="CAPOCANNONIERE"
              className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl font-black uppercase outline-none" 
            />
            <input 
              value={bonusData.high}
              onChange={(e) => setBonusData({...bonusData, high: e.target.value})}
              placeholder="MATCH PIÙ GOL"
              className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl font-black uppercase outline-none" 
            />
            <button type="submit" className="w-full bg-purple-600 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 shadow-xl">PUBBLICA BONUS</button>
          </form>
        </section>

      </div>
    </div>
  );
}