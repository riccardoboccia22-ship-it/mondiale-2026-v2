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
  Star,
  Shield,
  Goal,
  ArrowUpToLine,
  ArrowDownToLine,
  ShieldAlert,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ADMIN_EMAIL = "ricky@mondiale.it";

const STAGES = [
  { id: 'R32', label: 'Sedicesimi (+2pt)' },
  { id: 'R16', label: 'Ottavi (+4pt)' },
  { id: 'QF', label: 'Quarti (+6pt)' },
  { id: 'SF', label: 'Semifinale (+8pt)' },
  { id: 'F', label: 'Finale (+10pt)' },
  { id: 'WINNER', label: 'Vincitore Mondiale (+20pt)' },
];

const GROUPS = ['Gruppo A', 'Gruppo B', 'Gruppo C', 'Gruppo D', 'Gruppo E', 'Gruppo F', 'Gruppo G', 'Gruppo H', 'Gruppo I', 'Gruppo J', 'Gruppo K', 'Gruppo L'];

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

const normalizeStage = (s: string) => {
  const u = s?.toUpperCase().trim() || '';
  if (u.includes('SEDICESIM') || u === 'R32') return 'R32';
  if (u.includes('OTTAV') || u === 'R16') return 'R16';
  if (u.includes('QUART') || u === 'QF') return 'QF';
  if (u.includes('SEMIFINAL') || u === 'SF') return 'SF';
  if (u.includes('VINCITOR') || u.includes('VINCITRIC') || u.includes('CAMPIONE') || u === 'WINNER') return 'WINNER';
  if (u.includes('FINAL') || u === 'F') return 'F';
  return u; 
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // FIX: Ora tutte le sezioni partono chiuse (false)
  const [openSection, setOpenSection] = useState<{
    iscrizioni: boolean;
    risultati: boolean;
    tabellone: boolean;
    bonus: boolean;
  }>({
    iscrizioni: false,
    risultati: false,
    tabellone: false,
    bonus: false
  });

  const [matches, setMatches] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [officialBracket, setOfficialBracket] = useState<any[]>([]);
  
  const [bonusData, setBonusData] = useState({ 
    red: '', top: '', high: '',
    penalties: '', own_goals: '', high_group: '', low_group: '', mvp_world_cup: ''
  });
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
      supabase.from('official_bonuses').select('*').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
      supabase.from('profiles').select('*').order('username', { ascending: true }),
      supabase.from('official_bracket').select('*').order('id', { ascending: true })
    ]);
    
    setMatches(mRes.data || []);
    setProfiles(pRes.data || []);
    setOfficialBracket(obRes.data || []);
    
    if (bRes.data) {
      setBonusData({
        red: bRes.data.total_red_cards != null ? bRes.data.total_red_cards.toString() : '',
        top: bRes.data.top_scorer || '',
        high: bRes.data.high_scoring_match || '',
        penalties: bRes.data.total_penalties != null ? bRes.data.total_penalties.toString() : '',
        own_goals: bRes.data.total_own_goals != null ? bRes.data.total_own_goals.toString() : '',
        high_group: bRes.data.highest_scoring_group || '',
        low_group: bRes.data.lowest_scoring_group || '',
        mvp_world_cup: bRes.data.mvp_world_cup || '',
      });
    }
  }

  const toggleSection = (section: keyof typeof openSection) => {
    setOpenSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getFlagCode = (team: string) => flagMap[team?.toLowerCase().trim()];

  const updateScore = async (id: number) => {
    const h = (document.getElementById(`h-${id}`) as HTMLInputElement).value;
    const a = (document.getElementById(`a-${id}`) as HTMLInputElement).value;
    const isFinished = h !== '' && a !== '';
    const { error } = await supabase.from('matches').update({
      home_score_final: isFinished ? parseInt(h) : null,
      away_score_final: isFinished ? parseInt(a) : null,
      is_finished: isFinished
    }).eq('id', id);

    if (error) toast.error(error.message);
    else {
      toast.success(isFinished ? "Risultato salvato!" : "Risultato resettato");
      fetchData();
    }
  };

  const saveBonuses = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      id: '00000000-0000-0000-0000-000000000000', 
      total_red_cards: bonusData.red !== '' ? parseInt(bonusData.red) : null,
      total_penalties: bonusData.penalties !== '' ? parseInt(bonusData.penalties) : null,
      total_own_goals: bonusData.own_goals !== '' ? parseInt(bonusData.own_goals) : null,
      top_scorer: bonusData.top.trim() || null,
      mvp_world_cup: bonusData.mvp_world_cup.trim() || null,
      high_scoring_match: bonusData.high || null,
      highest_scoring_group: bonusData.high_group || null,
      lowest_scoring_group: bonusData.low_group || null
    };

    const { error } = await supabase.from('official_bonuses').upsert(payload, { onConflict: 'id' });

    if (error) toast.error(error.message);
    else toast.success("Bonus Ufficiali aggiornati!");
  };

  const saveQualif = async () => {
    const teamSelect = document.getElementById('q_team') as HTMLSelectElement;
    const stageSelect = document.getElementById('q_stage') as HTMLSelectElement;
    const team = teamSelect.value;
    const stage = stageSelect.value;
    if (!team || !stage) return toast.error("Seleziona squadra e fase!");

    const { error } = await supabase.from('official_bracket').insert([{ stage, team_name: team }]);
    if (error) toast.error(error.message);
    else { toast.success("Squadra registrata!"); fetchData(); }
  };

  const deleteQualif = async (id: any) => {
    const { error } = await supabase.from('official_bracket').delete().eq('id', id);
    if (!error) { toast.success("Rimosso!"); fetchData(); }
  };

  const togglePayment = async (userId: string, status: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_paid: !status }).eq('id', userId);
    if (!error) fetchData();
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse uppercase italic">Inizializzazione...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-10"><div className="text-rose-500 font-black border-4 border-rose-500 p-10 uppercase">ACCESSO NEGATO</div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-32 font-sans">
      <header className="text-center mb-12 pt-6">
        <h1 className="text-5xl font-black text-yellow-500 italic uppercase tracking-tighter">Control Tower</h1>
      </header>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* --- 1. ISCRIZIONI --- */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('iscrizioni')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Users className="text-emerald-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Iscrizioni ({profiles.length})</h2>
            </div>
            {openSection.iscrizioni ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
          </button>
          
          {openSection.iscrizioni && (
            <div className="bg-slate-900 border-t border-slate-800 divide-y divide-slate-800/50">
              {profiles.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20">
                  <div>
                    <p className="font-black text-sm uppercase italic text-white">{p.username || 'Guerriero'}</p>
                    <p className="text-[9px] text-slate-500 font-mono">{p.email}</p>
                  </div>
                  <button onClick={() => togglePayment(p.id, p.is_paid)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${p.is_paid ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-950 text-rose-500 border border-rose-500/30'}`}>
                    {p.is_paid ? <CheckCircle2 size={14} /> : null}
                    {p.is_paid ? 'PAGATO' : 'DA PAGARE'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- 2. FASE A GIRONI --- */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('risultati')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Fase a Gironi</h2>
            </div>
            {openSection.risultati ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
          </button>
          
          {openSection.risultati && (
            <div className="border-t border-slate-800 p-6 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="text" placeholder="CERCA SQUADRA..." className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black uppercase focus:border-yellow-500 outline-none w-full transition-all" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <div className="grid gap-3">
                {matches.filter(m => m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) || m.away_team.toLowerCase().includes(searchTerm.toLowerCase())).map(m => {
                  const homeFlag = getFlagCode(m.home_team);
                  const awayFlag = getFlagCode(m.away_team);
                  const hasResult = m.is_finished && m.home_score_final !== null && m.away_score_final !== null;
                  return (
                  <div key={m.id} className={`bg-slate-900 p-4 rounded-3xl border transition-all flex flex-col sm:flex-row items-center gap-4 shadow-md ${hasResult ? 'border-emerald-500/20' : 'border-slate-800'}`}>
                    <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto gap-2">
                      <span className="text-[10px] text-slate-600 uppercase font-black italic">#{m.id}</span>
                      {hasResult && <span className="text-[8px] text-emerald-400 font-black uppercase italic bg-emerald-500/10 px-2 py-0.5 rounded-full">FINITA</span>}
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-4 w-full">
                      <div className="flex flex-1 items-center justify-end gap-2 text-right">
                        <span className="font-black uppercase italic text-xs hidden sm:block truncate">{m.home_team}</span>
                        {homeFlag ? <img src={`https://flagcdn.com/w40/${homeFlag}.png`} className="w-6 h-auto rounded-sm shadow-md" /> : <Shield size={10} className="text-slate-600"/>}
                        <input id={`h-${m.id}`} type="number" defaultValue={m.home_score_final ?? ''} className="w-12 h-10 bg-slate-950 border border-slate-700 rounded-xl text-center font-black text-xl text-yellow-500 outline-none" />
                      </div>
                      <span className="text-slate-700 font-black">-</span>
                      <div className="flex flex-1 items-center justify-start gap-2 text-left">
                        <input id={`a-${m.id}`} type="number" defaultValue={m.away_score_final ?? ''} className="w-12 h-10 bg-slate-950 border border-slate-700 rounded-xl text-center font-black text-xl text-yellow-500 outline-none" />
                        {awayFlag ? <img src={`https://flagcdn.com/w40/${awayFlag}.png`} className="w-6 h-auto rounded-sm shadow-md" /> : <Shield size={10} className="text-slate-600"/>}
                        <span className="font-black uppercase italic text-xs hidden sm:block truncate">{m.away_team}</span>
                      </div>
                    </div>
                    <button onClick={() => updateScore(m.id)} className={`w-full sm:w-auto px-4 py-3 rounded-xl font-black uppercase text-[10px] italic transition-all flex items-center justify-center gap-2 ${hasResult ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 cursor-pointer' : 'bg-yellow-500 text-slate-950 hover:bg-yellow-400 cursor-pointer'}`}>
                       {hasResult ? <CheckCircle2 size={14} /> : <Zap size={14} />}
                       <span>{hasResult ? 'AGGIORNA' : 'SALVA'}</span>
                    </button>
                  </div>
                )})}
              </div>
            </div>
          )}
        </section>

        {/* --- 3. FASE FINALE --- */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('tabellone')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Trophy className="text-blue-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Fase Finale</h2>
            </div>
            {openSection.tabellone ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
          </button>
          
          {openSection.tabellone && (
            <div className="border-t border-slate-800 p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select id="q_team" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500">
                  <option value="">SQUADRA...</option>
                  {TEAMS_2026.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select id="q_stage" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500">
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <button onClick={saveQualif} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-xl">CONFERMA QUALIFICATA</button>
              
              <div className="mt-8 space-y-4">
                {STAGES.map((stage) => {
                  const teamsInThisStage = officialBracket.filter(o => normalizeStage(o.stage) === stage.id);
                  if (teamsInThisStage.length === 0) return null;
                  return (
                    <div key={stage.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                      <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">{stage.label.split(' ')[0]}</h3>
                      <div className="flex flex-wrap gap-2">
                        {teamsInThisStage.map(o => {
                          const flag = getFlagCode(o.team_name);
                          return (
                            <div key={o.id} className="bg-slate-900 border border-slate-700 pl-2 pr-1 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                              {flag && <img src={`https://flagcdn.com/w20/${flag}.png`} className="w-4 h-auto rounded-sm" />}
                              <span className="text-[10px] font-black uppercase text-white">{o.team_name}</span>
                              <button onClick={() => deleteQualif(o.id)} className="p-1 hover:bg-rose-500/20 rounded ml-1 transition-colors"><Trash2 size={12} className="text-rose-500"/></button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* --- 4. BONUS --- */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('bonus')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Star className="text-purple-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Bonus</h2>
            </div>
            {openSection.bonus ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
          </button>
          
          {openSection.bonus && (
            <div className="border-t border-slate-800 p-6">
              <form onSubmit={saveBonuses} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Rossi Totali</span>
                    <input value={bonusData.red} onChange={(e) => setBonusData({...bonusData, red: e.target.value})} type="number" placeholder="Inserisci Numero" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none placeholder:text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Rigori Totali</span>
                    <input value={bonusData.penalties} onChange={(e) => setBonusData({...bonusData, penalties: e.target.value})} type="number" placeholder="Inserisci Numero" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none placeholder:text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Autogol Totali</span>
                    <input value={bonusData.own_goals} onChange={(e) => setBonusData({...bonusData, own_goals: e.target.value})} type="number" placeholder="Inserisci Numero" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none placeholder:text-slate-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Capocannoniere</span>
                    <input value={bonusData.top} onChange={(e) => setBonusData({...bonusData, top: e.target.value})} placeholder="Es. Mbappé" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none placeholder:text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-2">MVP Mondiale</span>
                    <input value={bonusData.mvp_world_cup} onChange={(e) => setBonusData({...bonusData, mvp_world_cup: e.target.value})} placeholder="Es. Lamine Yamal" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none placeholder:text-slate-700" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Partita con più gol</span>
                  <select value={bonusData.high} onChange={(e) => setBonusData({...bonusData, high: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none appearance-none text-sm">
                    <option value="">Seleziona Partita...</option>
                    {matches.filter(m => !m.home_team.includes('TBD')).map(m => (
                      <option key={m.id} value={`${m.home_team} - ${m.away_team}`}>{m.home_team} - {m.away_team}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Girone + Gol</span>
                    <select value={bonusData.high_group} onChange={(e) => setBonusData({...bonusData, high_group: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none appearance-none">
                      <option value="">Seleziona Girone...</option>
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Girone - Gol</span>
                    <select value={bonusData.low_group} onChange={(e) => setBonusData({...bonusData, low_group: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none appearance-none">
                      <option value="">Seleziona Girone...</option>
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-purple-600 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">SALVA BONUS</button>
              </form>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}