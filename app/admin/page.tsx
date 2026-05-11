'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import {
  Trophy, Users, Zap, Search, Trash2, CheckCircle2, Star, Shield, 
  ChevronDown, ChevronUp, BarChart3, TrendingUp, RefreshCw, ShieldCheck
} from 'lucide-react';

const ADMIN_EMAIL = 'ricky@mondiale.it';

const STAGES = [
  { id: 'R32', label: 'Sedicesimi (+2pt)', pts: 2 },
  { id: 'R16', label: 'Ottavi (+4pt)', pts: 4 },
  { id: 'QF', label: 'Quarti (+6pt)', pts: 6 },
  { id: 'SF', label: 'Semifinale (+8pt)', pts: 8 },
  { id: 'F', label: 'Finale (+10pt)', pts: 10 },
  { id: 'WINNER', label: 'Vincitore Mondiale (+20pt)', pts: 20 },
];

const GROUPS = ['Gruppo A', 'Gruppo B', 'Gruppo C', 'Gruppo D', 'Gruppo E', 'Gruppo F', 'Gruppo G', 'Gruppo H', 'Gruppo I', 'Gruppo J', 'Gruppo K', 'Gruppo L'];

const TEAMS_2026 = [
  'Algeria', 'Arabia Saudita', 'Argentina', 'Australia', 'Austria', 'Belgio', 'Bosnia ed Erzegovina', 'Brasile', 'Canada', 'Capo Verde', 'Colombia', 'Corea del Sud', "Costa d'avorio", 'Croazia', 'Curaçao', 'Ecuador', 'Egitto', 'Francia', 'Germania', 'Ghana', 'Giappone', 'Giordania', 'Haiti', 'Inghilterra', 'Iran', 'Iraq', 'Marocco', 'Messico', 'Norvegia', 'Nuova Zelanda', 'Olanda', 'Panama', 'Paraguay', 'Portogallo', 'Qatar', 'Repubblica Ceca', 'Repubblica Democratica del Congo', 'Scozia', 'Senegal', 'Spagna', 'Stati Uniti', 'Sudafrica', 'Svezia', 'Svizzera', 'Tunisia', 'Turchia', 'Uruguay', 'Uzbekistan'
].sort();

const flagMap: { [key: string]: string } = {
  algeria: 'dz', 'arabia saudita': 'sa', argentina: 'ar', australia: 'au', austria: 'at', belgio: 'be', 'bosnia ed erzegovina': 'ba', 'bosnia erzegovina': 'ba', brasile: 'br', canada: 'ca', 'capo verde': 'cv', colombia: 'co', 'corea del sud': 'kr', "costa d'avorio": 'ci', croazia: 'hr', curaçao: 'cw', curacao: 'cw', ecuador: 'ec', egitto: 'eg', francia: 'fr', germania: 'de', ghana: 'gh', giappone: 'jp', giordania: 'jo', haiti: 'ht', inghilterra: 'gb-eng', iran: 'ir', iraq: 'iq', marocco: 'ma', messico: 'mx', norvegia: 'no', 'nuova zelanda': 'nz', olanda: 'nl', panama: 'pa', paraguay: 'py', portogallo: 'pt', qatar: 'qa', 'repubblica ceca': 'cz', 'repubblica democratica del congo': 'cd', congo: 'cd', scozia: 'gb-sct', senegal: 'sn', spagna: 'es', 'stati uniti': 'us', usa: 'us', sudafrica: 'za', svezia: 'se', svizzera: 'ch', tunisia: 'tn', turchia: 'tr', uruguay: 'uy', uzbekistan: 'uz'
};

const normalizeStage = (s: string) => {
  const u = s?.toUpperCase().trim() || '';
  if (u.includes('SEDICESIM') || u === 'R32') return 'R32';
  if (u.includes('OTTAV') || u === 'R16') return 'R16';
  if (u.includes('QUART') || u === 'QF') return 'QF';
  if (u.includes('SEMIFINAL') || u === 'SF') return 'SF';
  if (u.includes('VINCITOR') || u.includes('CAMPIONE') || u === 'WINNER') return 'WINNER';
  if (u.includes('FINAL') || u === 'F') return 'F';
  return u;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [openSection, setOpenSection] = useState({ iscrizioni: false, risultati: false, tabellone: false, bonus: false, statistiche: false });
  
  const [matches, setMatches] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [officialBracket, setOfficialBracket] = useState<any[]>([]);
  const [allUserBonuses, setAllUserBonuses] = useState<any[]>([]);
  const [bonusData, setBonusData] = useState({ 
    red: '', top: '', high: '', penalties: '', own_goals: '', 
    high_group: '', low_group: '', mvp_world_cup: '', best_goalkeeper: '' 
  });
  const [searchTerm, setSearchTerm] = useState('');

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
    const [mRes, bRes, pRes, obRes, ubRes] = await Promise.all([
      supabase.from('matches').select('*').order('id', { ascending: true }),
      supabase.from('official_bonuses').select('*').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
      supabase.from('profiles').select('*').order('username', { ascending: true }),
      supabase.from('official_bracket').select('*').order('id', { ascending: true }),
      supabase.from('user_bonus_answers').select('*'),
    ]);

    setMatches(mRes.data || []);
    setProfiles(pRes.data || []);
    setOfficialBracket(obRes.data || []);
    setAllUserBonuses(ubRes.data || []);

    if (bRes.data) {
      setBonusData({
        red: bRes.data.total_red_cards?.toString() || '',
        top: bRes.data.top_scorer || '',
        high: bRes.data.high_scoring_match || '',
        penalties: bRes.data.total_penalties?.toString() || '',
        own_goals: bRes.data.total_own_goals?.toString() || '',
        high_group: bRes.data.highest_scoring_group || '',
        low_group: bRes.data.lowest_scoring_group || '',
        mvp_world_cup: bRes.data.mvp_world_cup || '',
        best_goalkeeper: bRes.data.best_goalkeeper || ''
      });
    }
  }

  const syncLeaderboard = async (isManual = true) => {
    if (isManual && !window.confirm("Vuoi ricalcolare i punti e la classifica per tutti i giocatori?")) return;
    
    setSyncing(true);
    const syncToast = !isManual ? toast.loading("Aggiornamento classifica...") : null;

    try {
      const [
        { data: profs },
        { data: allMatches },
        { data: allPreds },
        { data: offBonuses },
        { data: userBonuses },
        { data: offBracket },
        { data: userBrackets }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('matches').select('*').eq('is_finished', true),
        supabase.from('predictions').select('*'),
        supabase.from('official_bonuses').select('*').maybeSingle(),
        supabase.from('user_bonus_answers').select('*'),
        supabase.from('official_bracket').select('*'),
        supabase.from('brackets').select('*')
      ]);

      if (!profs) throw new Error("Errore profili");

      const updates = profs.map(profile => {
        let pGroups = 0; let pBracket = 0; let pBonus = 0;

        // 1. CALCOLO GIRONI
        const uPreds = allPreds?.filter(p => p.user_id === profile.id) || [];
        uPreds.forEach(pred => {
          const m = allMatches?.find(m => m.id === pred.match_id);
          if (m) {
            const ph = Number(pred.home_score); const pa = Number(pred.away_score);
            const mh = Number(m.home_score_final); const ma = Number(m.away_score_final);
            const pRes = ph > pa ? '1' : ph < pa ? '2' : 'X';
            const mRes = mh > ma ? '1' : mh < ma ? '2' : 'X';
            if (ph === mh && pa === ma) pGroups += 10;
            else if (pRes === mRes && (ph === mh || pa === ma)) pGroups += 6;
            else if (pRes === mRes) pGroups += 4;
            else if (ph === mh || pa === ma) pGroups += 2;
          }
        });

        // 2. CALCOLO TABELLONE
        const myBrackets = userBrackets?.filter(b => b.user_id === profile.id) || [];
        myBrackets.forEach(ub => {
          const uStg = normalizeStage(ub.stage);
          if (offBracket?.some(ob => normalizeStage(ob.stage) === uStg && ob.team_name.toLowerCase().trim() === ub.team_name.toLowerCase().trim())) {
            const points = STAGES.find(s => s.id === uStg)?.pts || 0;
            pBracket += points;
          }
        });

        // 3. CALCOLO BONUS
        const ub = userBonuses?.find(b => b.user_id === profile.id);
        if (ub && offBonuses) {
          const bonusKeys = ['total_red_cards', 'total_penalties', 'total_own_goals', 'top_scorer', 'mvp_world_cup', 'best_goalkeeper', 'high_scoring_match', 'highest_scoring_group', 'lowest_scoring_group'];
          bonusKeys.forEach(k => {
            if (offBonuses[k] != null && String(offBonuses[k]).trim().toLowerCase() === String(ub[k]).trim().toLowerCase()) {
              pBonus += 10;
            }
          });
        }

        return { 
          ...profile, 
          points: pGroups + pBracket + pBonus,
          points_groups: pGroups,
          points_bracket: pBracket,
          points_bonus: pBonus
        };
      });

      const sorted = [...updates].sort((a, b) => b.points - a.points);
      const ranked = sorted.map((u, i) => ({ ...u, ranking: (i + 1).toString() }));
      
      const { error } = await supabase.from('profiles').upsert(ranked, { onConflict: 'id' });
      if (error) throw error;

      if (syncToast) toast.dismiss(syncToast);
      if (isManual) toast.success("Classifica sincronizzata manualmente!");
      else toast.success("Punti ricalcolati automaticamente!");
      
      fetchData();
    } catch (err: any) { 
      if (syncToast) toast.dismiss(syncToast);
      toast.error("Errore ricalcolo: " + err.message); 
    } finally { 
      setSyncing(false); 
    }
  };

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
      toast.success("Risultato salvato!");
      await syncLeaderboard(false);
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
      best_goalkeeper: bonusData.best_goalkeeper.trim() || null,
      high_scoring_match: bonusData.high || null,
      highest_scoring_group: bonusData.high_group || null,
      lowest_scoring_group: bonusData.low_group || null
    };
    const { error } = await supabase.from('official_bonuses').upsert(payload, { onConflict: 'id' });
    if (error) toast.error(error.message);
    else {
      toast.success("Bonus Ufficiali aggiornati!");
      await syncLeaderboard(false);
    }
  };

  const saveQualif = async () => {
    const team = (document.getElementById('q_team') as HTMLSelectElement).value;
    const stage = (document.getElementById('q_stage') as HTMLSelectElement).value;
    if (!team || !stage) return toast.error('Seleziona squadra e fase!');
    const { error } = await supabase.from('official_bracket').insert([{ stage, team_name: team }]);
    if (error) toast.error(error.message);
    else {
      toast.success('Squadra registrata nel tabellone!');
      await syncLeaderboard(false);
    }
  };

  const deleteQualif = async (id: any) => {
    const { error } = await supabase.from('official_bracket').delete().eq('id', id);
    if (!error) {
      toast.success('Squadra rimossa dal tabellone!');
      await syncLeaderboard(false);
    }
  };

  const togglePayment = async (userId: string, status: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_paid: !status }).eq('id', userId);
    if (!error) fetchData();
  };

  const getAverage = (k: string) => {
    const v = allUserBonuses.filter(b => b[k] != null).map(b => Number(b[k]));
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : 0;
  };

  const getTopPicks = (k: string) => {
    const counts: any = {};
    allUserBonuses.forEach(b => { if (b[k]) { const v = b[k].trim().toUpperCase(); counts[v] = (counts[v] || 0) + 1; } });
    return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);
  };

  const getFlagCode = (team: string) => flagMap[team?.toLowerCase().trim()];

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse uppercase italic">Inizializzazione Control Tower...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-500 font-black border-4 border-rose-500 p-10">ACCESSO NEGATO</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-32 font-sans">
      <header className="text-center mb-12 pt-6">
        <h1 className="text-5xl font-black text-yellow-500 italic uppercase tracking-tighter mb-6">Control Tower</h1>
        <button 
          onClick={() => syncLeaderboard(true)} 
          disabled={syncing} 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95"
        >
          <RefreshCw size={18} className={syncing ? "animate-spin" : ""} /> 
          {syncing ? 'Sincronizzazione...' : 'Sincronizza Classifica'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto space-y-6 text-left">
        
        {/* 1. SEZIONE ISCRIZIONI E UTENTI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <button onClick={() => setOpenSection({...openSection, iscrizioni: !openSection.iscrizioni})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Users className="text-emerald-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Iscrizioni ({profiles.length})</h2>
            </div>
            {openSection.iscrizioni ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.iscrizioni && (
            <div className="bg-slate-900 border-t border-slate-800 divide-y divide-slate-800/50">
              {profiles.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                  <div>
                    <p className="font-black text-sm uppercase italic flex items-center gap-2 text-white">
                      {p.username} <span className="text-yellow-500">#{p.ranking || '--'}</span>
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">
                      {p.points || 0} PT ({p.points_groups}G + {p.points_bracket}F + {p.points_bonus}B)
                    </p>
                  </div>
                  <button 
                    onClick={() => togglePayment(p.id, p.is_paid)} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${p.is_paid ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-950 text-rose-500 border border-rose-500/30'}`}
                  >
                    {p.is_paid ? 'PAGATO' : 'DA PAGARE'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. SEZIONE RISULTATI GIRONI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <button onClick={() => setOpenSection({...openSection, risultati: !openSection.risultati})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Risultati Gironi</h2>
            </div>
            {openSection.risultati ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.risultati && (
            <div className="border-t border-slate-800 p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="text" 
                  placeholder="CERCA SQUADRA..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-4 text-xs font-black uppercase outline-none focus:border-yellow-500 transition-all" 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="grid gap-3">
                {matches.filter(m => m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) || m.away_team.toLowerCase().includes(searchTerm.toLowerCase())).map(m => {
                  const hasResult = m.is_finished && m.home_score_final !== null;
                  return (
                    <div key={m.id} className={`bg-slate-900 p-4 rounded-3xl border transition-all flex items-center gap-4 ${hasResult ? 'border-emerald-500/30 shadow-lg' : 'border-slate-800'}`}>
                      <span className="text-[10px] font-black text-slate-600">#{m.id}</span>
                      <div className="flex-1 flex items-center justify-center gap-2">
                        <span className="text-[10px] font-black uppercase flex-1 text-right truncate italic">{m.home_team}</span>
                        <input id={`h-${m.id}`} type="number" defaultValue={m.home_score_final ?? ''} className="w-10 h-10 bg-slate-950 rounded-lg text-center font-black text-yellow-500 border border-slate-700 outline-none focus:border-yellow-500" />
                        <span className="text-slate-700 font-black">-</span>
                        <input id={`a-${m.id}`} type="number" defaultValue={m.away_score_final ?? ''} className="w-10 h-10 bg-slate-950 rounded-lg text-center font-black text-yellow-500 border border-slate-700 outline-none focus:border-yellow-500" />
                        <span className="text-[10px] font-black uppercase flex-1 text-left truncate italic">{m.away_team}</span>
                      </div>
                      <button 
                        onClick={() => updateScore(m.id)} 
                        className={`p-2 rounded-lg font-black uppercase text-[8px] tracking-tighter transition-all active:scale-90 ${hasResult ? 'bg-emerald-500 text-slate-950' : 'bg-yellow-500 text-slate-950'}`}
                      >
                        {hasResult ? 'MODIFICA' : 'SALVA'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 3. SEZIONE FASE FINALE (TABELLONE) */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <button onClick={() => setOpenSection({...openSection, tabellone: !openSection.tabellone})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Trophy className="text-blue-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Fase Finale</h2>
            </div>
            {openSection.tabellone ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.tabellone && (
            <div className="border-t border-slate-800 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <select id="q_team" className="bg-slate-950 border-2 border-slate-800 p-4 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500 text-white">
                  <option value="">SQUADRA...</option>
                  {TEAMS_2026.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select id="q_stage" className="bg-slate-950 border-2 border-slate-800 p-4 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500 text-white">
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <button onClick={saveQualif} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-lg shadow-blue-600/20 transition-all">
                CONFERMA QUALIFICATA
              </button>
              
              <div className="space-y-4 mt-6">
                {STAGES.map((stg) => {
                  const items = officialBracket.filter(o => normalizeStage(o.stage) === stg.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={stg.id} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 shadow-inner">
                      <h3 className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-[0.2em] border-b border-slate-800 pb-2">{stg.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map(o => (
                          <div key={o.id} className="bg-slate-900 border border-slate-700 pl-3 pr-2 py-2 rounded-xl flex items-center gap-3 shadow-md">
                            <span className="text-[10px] font-black uppercase text-white italic">{o.team_name}</span>
                            <button onClick={() => deleteQualif(o.id)} className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors group">
                              <Trash2 size={12} className="text-rose-500 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 4. SEZIONE BONUS UFFICIALI (CON PORTIERE) */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <button onClick={() => setOpenSection({...openSection, bonus: !openSection.bonus})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <Star className="text-purple-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Bonus Ufficiali</h2>
            </div>
            {openSection.bonus ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.bonus && (
            <div className="border-t border-slate-800 p-6">
              <form onSubmit={saveBonuses} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Rossi</span>
                    <input value={bonusData.red} onChange={(e) => setBonusData({...bonusData, red: e.target.value})} type="number" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Rigori</span>
                    <input value={bonusData.penalties} onChange={(e) => setBonusData({...bonusData, penalties: e.target.value})} type="number" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Autogol</span>
                    <input value={bonusData.own_goals} onChange={(e) => setBonusData({...bonusData, own_goals: e.target.value})} type="number" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none focus:border-purple-500" />
                  </div>
                </div>
                <input value={bonusData.top} onChange={(e) => setBonusData({...bonusData, top: e.target.value})} placeholder="CAPOCANNONIERE" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none focus:border-purple-500 text-white" />
                <input value={bonusData.mvp_world_cup} onChange={(e) => setBonusData({...bonusData, mvp_world_cup: e.target.value})} placeholder="MVP MONDIALE" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none focus:border-purple-500 text-white" />
                
                {/* INPUT MIGLIOR PORTIERE */}
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/50" size={18} />
                  <input value={bonusData.best_goalkeeper} onChange={(e) => setBonusData({...bonusData, best_goalkeeper: e.target.value})} placeholder="MIGLIOR PORTIERE" className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-4 rounded-xl font-black uppercase outline-none focus:border-purple-500 text-purple-400" />
                </div>

                <select value={bonusData.high} onChange={(e) => setBonusData({...bonusData, high: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none focus:border-purple-500 text-white appearance-none">
                  <option value="">PARTITA + GOL...</option>
                  {matches.filter(m => !m.home_team.includes('TBD')).map(m => <option key={m.id} value={`${m.home_team} - ${m.away_team}`}>{m.home_team} - {m.away_team}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                   <select value={bonusData.high_group} onChange={(e) => setBonusData({...bonusData, high_group: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none focus:border-purple-500 text-white appearance-none"><option value="">GIRONE + GOL</option>{GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                   <select value={bonusData.low_group} onChange={(e) => setBonusData({...bonusData, low_group: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none focus:border-purple-500 text-white appearance-none"><option value="">GIRONE - GOL</option>{GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                </div>
                <button type="submit" className="w-full bg-purple-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl shadow-purple-600/20 italic">SALVA BONUS UFFICIALI</button>
              </form>
            </div>
          )}
        </section>

        {/* 5. SEZIONE STATISTICHE GLOBALI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl transition-all">
          <button onClick={() => setOpenSection({...openSection, statistiche: !openSection.statistiche})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-cyan-500" size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Statistiche Globali</h2>
            </div>
            {openSection.statistiche ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.statistiche && (
            <div className="border-t border-slate-800 p-6 space-y-6 bg-slate-950/30">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <p className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter">Rossi Avg</p>
                  <p className="text-2xl font-black text-cyan-400">{getAverage('total_red_cards')}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <p className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter">Rigori Avg</p>
                  <p className="text-2xl font-black text-cyan-400">{getAverage('total_penalties')}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <p className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter">Autogol Avg</p>
                  <p className="text-2xl font-black text-cyan-400">{getAverage('total_own_goals')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[ 
                  { label: 'Capocannoniere', key: 'top_scorer' }, 
                  { label: 'MVP Mondiale', key: 'mvp_world_cup' }, 
                  { label: 'Miglior Portiere', key: 'best_goalkeeper' } 
                ].map(s => (
                  <div key={s.key} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest border-b border-slate-800 pb-1">{s.label} (Top Voti)</p>
                    {getTopPicks(s.key).map(([name, count]: any) => (
                      <div key={name} className="flex justify-between text-[10px] font-black uppercase italic mb-1">
                        <span className="truncate pr-2 text-white">{name}</span>
                        <span className="text-cyan-500 shrink-0 font-mono">{count} voti</span>
                      </div>
                    ))}
                    {getTopPicks(s.key).length === 0 && <p className="text-[8px] text-slate-700 italic">Nessun pronostico inserito dagli utenti</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
