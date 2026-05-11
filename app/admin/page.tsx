'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import {
  Trophy,
  Users,
  Zap,
  Search,
  Trash2,
  CheckCircle2,
  Star,
  Shield,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  RefreshCw,
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

const GROUPS = [
  'Gruppo A', 'Gruppo B', 'Gruppo C', 'Gruppo D', 'Gruppo E', 'Gruppo F',
  'Gruppo G', 'Gruppo H', 'Gruppo I', 'Gruppo J', 'Gruppo K', 'Gruppo L',
];

const TEAMS_2026 = [
  'Algeria', 'Arabia Saudita', 'Argentina', 'Australia', 'Austria', 'Belgio',
  'Bosnia ed Erzegovina', 'Brasile', 'Canada', 'Capo Verde', 'Colombia',
  'Corea del Sud', "Costa d'Avorio", 'Croazia', 'Curaçao', 'Ecuador', 'Egitto',
  'Francia', 'Germania', 'Ghana', 'Giappone', 'Giordania', 'Haiti', 'Inghilterra',
  'Iran', 'Iraq', 'Marocco', 'Messico', 'Norvegia', 'Nuova Zelanda', 'Olanda',
  'Panama', 'Paraguay', 'Portogallo', 'Qatar', 'Repubblica Ceca',
  'Repubblica Democratica del Congo', 'Scozia', 'Senegal', 'Spagna',
  'Stati Uniti', 'Sudafrica', 'Svezia', 'Svizzera', 'Tunisia', 'Turchia',
  'Uruguay', 'Uzbekistan',
].sort();

const flagMap: { [key: string]: string } = {
  algeria: 'dz', 'arabia saudita': 'sa', argentina: 'ar', australia: 'au', austria: 'at',
  belgio: 'be', 'bosnia ed erzegovina': 'ba', 'bosnia erzegovina': 'ba',
  brasile: 'br', canada: 'ca', 'capo verde': 'cv', colombia: 'co', 'corea del sud': 'kr',
  "costa d'avorio": 'ci', croazia: 'hr', curaçao: 'cw', curacao: 'cw',
  ecuador: 'ec', egitto: 'eg', francia: 'fr', germania: 'de', ghana: 'gh', giappone: 'jp',
  giordania: 'jo', haiti: 'ht', inghilterra: 'gb-eng', iran: 'ir', iraq: 'iq', marocco: 'ma',
  messico: 'mx', norvegia: 'no', 'nuova zelanda': 'nz', olanda: 'nl', panama: 'pa', paraguay: 'py',
  portogallo: 'pt', qatar: 'qa', 'repubblica ceca': 'cz',
  'repubblica democratica del congo': 'cd', congo: 'cd',
  scozia: 'gb-sct', senegal: 'sn', spagna: 'es', 'stati uniti': 'us', usa: 'us',
  sudafrica: 'za', svezia: 'se', svizzera: 'ch', tunisia: 'tn', turchia: 'tr',
  uruguay: 'uy', uzbekistan: 'uz',
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
  const [syncing, setSyncing] = useState(false);

  const [openSection, setOpenSection] = useState({
    iscrizioni: false, risultati: false, tabellone: false, bonus: false, statistiche: false
  });

  const [matches, setMatches] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [officialBracket, setOfficialBracket] = useState<any[]>([]);
  const [allUserBonuses, setAllUserBonuses] = useState<any[]>([]);
  const [allWinnerBrackets, setAllWinnerBrackets] = useState<any[]>([]);

  const [bonusData, setBonusData] = useState({
    red: '', top: '', high: '', penalties: '', own_goals: '', high_group: '', low_group: '', mvp_world_cup: ''
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
    const [mRes, bRes, pRes, obRes, ubRes, brkRes] = await Promise.all([
      supabase.from('matches').select('*').order('id', { ascending: true }),
      supabase.from('official_bonuses').select('*').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
      supabase.from('profiles').select('*').order('username', { ascending: true }),
      supabase.from('official_bracket').select('*').order('id', { ascending: true }),
      supabase.from('user_bonus_answers').select('*'),
      supabase.from('brackets').select('team_name').eq('stage', 'WINNER'),
    ]);

    setMatches(mRes.data || []);
    setProfiles(pRes.data || []);
    setOfficialBracket(obRes.data || []);
    setAllUserBonuses(ubRes.data || []);
    setAllWinnerBrackets(brkRes.data || []);

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

  const syncLeaderboard = async () => {
    if (!window.confirm("Vuoi ricalcolare i punti e la classifica per tutti i giocatori? L'operazione sovrascriverà la classifica attuale.")) return;

    setSyncing(true);
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
        supabase.from('profiles').select('*'), // Carichiamo tutto per non perdere username/email
        supabase.from('matches').select('*').eq('is_finished', true),
        supabase.from('predictions').select('*'),
        supabase.from('official_bonuses').select('*').maybeSingle(),
        supabase.from('user_bonus_answers').select('*'),
        supabase.from('official_bracket').select('*'),
        supabase.from('brackets').select('*')
      ]);

      if (!profs) throw new Error("Errore caricamento profili");

      // 1. Calcolo Punti
      const calculatedData = profs.map(profile => {
        let pGroups = 0; let pBracket = 0; let pBonus = 0;

        // Punti Gironi (10, 6, 4, 2)
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

        // Punti Tabellone
        const uBrackets = userBrackets?.filter(b => b.user_id === profile.id) || [];
        uBrackets.forEach(ub => {
          const uStg = normalizeStage(ub.stage);
          const isCorrect = offBracket?.some(ob => normalizeStage(ob.stage) === uStg && ob.team_name.toLowerCase().trim() === ub.team_name.toLowerCase().trim());
          if (isCorrect) pBracket += STAGES.find(s => s.id === uStg)?.pts || 0;
        });

        // Punti Bonus
        const ub = userBonuses?.find(b => b.user_id === profile.id);
        if (ub && offBonuses) {
          const check = (k: string) => {
            if (offBonuses[k] != null && String(offBonuses[k]).trim().toLowerCase() === String(ub[k]).trim().toLowerCase()) pBonus += 10;
          };
          ['total_red_cards', 'total_penalties', 'total_own_goals', 'top_scorer', 'mvp_world_cup', 'high_scoring_match', 'highest_scoring_group', 'lowest_scoring_group'].forEach(check);
        }

        return { 
          ...profile, 
          points: pGroups + pBracket + pBonus,
          points_groups: pGroups,
          points_bracket: pBracket,
          points_bonus: pBonus
        };
      });

      // 2. Calcolo Ranking
      const sorted = [...calculatedData].sort((a, b) => b.points - a.points);
      const updates = sorted.map((u, index) => ({
        ...u,
        ranking: (index + 1).toString()
      }));

      // 3. Upsert
      const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'id' });
      if (error) throw error;

      toast.success("Sincronizzazione completata! 🏆");
      fetchData();
    } catch (err: any) {
      toast.error("Errore: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const toggleSection = (section: keyof typeof openSection) => {
    setOpenSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateScore = async (id: number) => {
    const h = (document.getElementById(`h-${id}`) as HTMLInputElement).value;
    const a = (document.getElementById(`a-${id}`) as HTMLInputElement).value;
    const isFinished = h !== '' && a !== '';
    const { error } = await supabase.from('matches').update({
      home_score_final: isFinished ? parseInt(h) : null,
      away_score_final: isFinished ? parseInt(a) : null,
      is_finished: isFinished,
    }).eq('id', id);

    if (error) toast.error(error.message);
    else { toast.success(isFinished ? 'Risultato salvato!' : 'Resettato'); fetchData(); }
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
      lowest_scoring_group: bonusData.low_group || null,
    };
    const { error } = await supabase.from('official_bonuses').upsert(payload, { onConflict: 'id' });
    if (error) toast.error(error.message);
    else toast.success('Bonus Ufficiali aggiornati!');
  };

  const saveQualif = async () => {
    const team = (document.getElementById('q_team') as HTMLSelectElement).value;
    const stage = (document.getElementById('q_stage') as HTMLSelectElement).value;
    if (!team || !stage) return toast.error('Mancano dati!');
    const { error } = await supabase.from('official_bracket').insert([{ stage, team_name: team }]);
    if (error) toast.error(error.message);
    else { toast.success('Registrata!'); fetchData(); }
  };

  const deleteQualif = async (id: any) => {
    const { error } = await supabase.from('official_bracket').delete().eq('id', id);
    if (!error) { toast.success('Rimosso!'); fetchData(); }
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

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse">CARICAMENTO...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-500 font-black">ACCESSO NEGATO</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-32 font-sans">
      <header className="text-center mb-12 pt-6">
        <h1 className="text-5xl font-black text-yellow-500 italic uppercase tracking-tighter mb-6">Control Tower</h1>
        <button onClick={syncLeaderboard} disabled={syncing} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50">
          <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
          {syncing ? 'Sincronizzazione...' : 'Sincronizza Classifica'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* SEZIONE ISCRIZIONI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('iscrizioni')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
            <div className="flex items-center gap-3"><Users className="text-emerald-500" size={24} /><h2 className="text-xl font-black uppercase italic">Iscrizioni ({profiles.length})</h2></div>
            {openSection.iscrizioni ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.iscrizioni && (
            <div className="bg-slate-900 border-t border-slate-800 divide-y divide-slate-800/50">
              {profiles.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase italic">{p.username} <span className="text-yellow-500">#{p.ranking || '--'}</span></p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase">{p.points || 0} PT ({p.points_groups || 0}G + {p.points_bracket || 0}F + {p.points_bonus || 0}B)</p>
                  </div>
                  <button onClick={() => togglePayment(p.id, p.is_paid)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${p.is_paid ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-rose-500 border border-rose-500/30'}`}>
                    {p.is_paid ? 'PAGATO' : 'DA PAGARE'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEZIONE RISULTATI GIRONI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('risultati')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
            <div className="flex items-center gap-3"><Zap className="text-yellow-500" size={24} /><h2 className="text-xl font-black uppercase italic">Fase a Gironi</h2></div>
            {openSection.risultati ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.risultati && (
            <div className="border-t border-slate-800 p-6 space-y-4">
              <input type="text" placeholder="CERCA SQUADRA..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-black uppercase outline-none focus:border-yellow-500" onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="grid gap-3">
                {matches.filter(m => m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) || m.away_team.toLowerCase().includes(searchTerm.toLowerCase())).map(m => {
                   const hasResult = m.is_finished && m.home_score_final !== null && m.away_score_final !== null;
                   return (
                  <div key={m.id} className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-600">#{m.id}</span>
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black uppercase flex-1 text-right truncate">{m.home_team}</span>
                      <input id={`h-${m.id}`} type="number" defaultValue={m.home_score_final ?? ''} className="w-10 h-10 bg-slate-950 rounded-lg text-center font-black text-yellow-500 border border-slate-700 outline-none" />
                      <span className="text-slate-700 font-black">-</span>
                      <input id={`a-${m.id}`} type="number" defaultValue={m.away_score_final ?? ''} className="w-10 h-10 bg-slate-950 rounded-lg text-center font-black text-yellow-500 border border-slate-700 outline-none" />
                      <span className="text-[10px] font-black uppercase flex-1 text-left truncate">{m.away_team}</span>
                    </div>
                    <button onClick={() => updateScore(m.id)} className={`p-2 rounded-lg font-black uppercase text-[8px] tracking-tighter ${hasResult ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500 text-slate-950'}`}>
                      {hasResult ? 'AGGIORNA' : 'SALVA'}
                    </button>
                  </div>
                )})}
              </div>
            </div>
          )}
        </section>

        {/* SEZIONE FASE FINALE */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('tabellone')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
            <div className="flex items-center gap-3"><Trophy className="text-blue-500" size={24} /><h2 className="text-xl font-black uppercase italic">Fase Finale</h2></div>
            {openSection.tabellone ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.tabellone && (
            <div className="border-t border-slate-800 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <select id="q_team" className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500">
                  <option value="">SQUADRA...</option>
                  {TEAMS_2026.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select id="q_stage" className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500">
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <button onClick={saveQualif} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest">CONFERMA QUALIFICATA</button>
              <div className="space-y-4 mt-6">
                {STAGES.map((stg) => {
                  const items = officialBracket.filter(o => normalizeStage(o.stage) === stg.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={stg.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <h3 className="text-[10px] font-black text-blue-500 uppercase mb-2">{stg.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map(o => (
                          <div key={o.id} className="bg-slate-900 border border-slate-700 pl-2 pr-1 py-1 rounded-lg flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase">{o.team_name}</span>
                            <button onClick={() => deleteQualif(o.id)} className="p-1"><Trash2 size={12} className="text-rose-500" /></button>
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

        {/* SEZIONE BONUS UFFICIALI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('bonus')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
            <div className="flex items-center gap-3"><Star className="text-purple-500" size={24} /><h2 className="text-xl font-black uppercase italic">Bonus Ufficiali</h2></div>
            {openSection.bonus ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.bonus && (
            <div className="border-t border-slate-800 p-6">
              <form onSubmit={saveBonuses} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <input value={bonusData.red} onChange={(e) => setBonusData({...bonusData, red: e.target.value})} type="number" placeholder="ROSSI" className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none" />
                  <input value={bonusData.penalties} onChange={(e) => setBonusData({...bonusData, penalties: e.target.value})} type="number" placeholder="RIGORI" className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none" />
                  <input value={bonusData.own_goals} onChange={(e) => setBonusData({...bonusData, own_goals: e.target.value})} type="number" placeholder="AUTOGOL" className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black text-purple-400 outline-none" />
                </div>
                <input value={bonusData.top} onChange={(e) => setBonusData({...bonusData, top: e.target.value})} placeholder="CAPOCANNONIERE" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none" />
                <input value={bonusData.mvp_world_cup} onChange={(e) => setBonusData({...bonusData, mvp_world_cup: e.target.value})} placeholder="MVP MONDIALE" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none" />
                <select value={bonusData.high} onChange={(e) => setBonusData({...bonusData, high: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none">
                  <option value="">PARTITA + GOL...</option>
                  {matches.map(m => <option key={m.id} value={`${m.home_team} - ${m.away_team}`}>{m.home_team} - {m.away_team}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                   <select value={bonusData.high_group} onChange={(e) => setBonusData({...bonusData, high_group: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none"><option value="">GIRONE + GOL</option>{GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                   <select value={bonusData.low_group} onChange={(e) => setBonusData({...bonusData, low_group: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none"><option value="">GIRONE - GOL</option>{GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                </div>
                <button type="submit" className="w-full bg-purple-600 py-4 rounded-xl font-black uppercase tracking-widest text-xs">SALVA BONUS</button>
              </form>
            </div>
          )}
        </section>

        {/* SEZIONE STATISTICHE */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden transition-all shadow-xl">
          <button onClick={() => toggleSection('statistiche')} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
            <div className="flex items-center gap-3"><BarChart3 className="text-cyan-500" size={24} /><h2 className="text-xl font-black uppercase italic">Statistiche Globali</h2></div>
            {openSection.statistiche ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.statistiche && (
            <div className="border-t border-slate-800 p-6 space-y-6 bg-slate-950/30">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 p-4 rounded-2xl text-center border border-slate-800">
                  <p className="text-[8px] font-black text-slate-500 mb-1">ROSSI AVG</p>
                  <p className="text-2xl font-black text-cyan-400">{getAverage('total_red_cards')}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl text-center border border-slate-800">
                  <p className="text-[8px] font-black text-slate-500 mb-1">RIGORI AVG</p>
                  <p className="text-2xl font-black text-cyan-400">{getAverage('total_penalties')}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl text-center border border-slate-800">
                  <p className="text-[8px] font-black text-slate-500 mb-1">AUTOGOL AVG</p>
                  <p className="text-2xl font-black text-cyan-400">{getAverage('total_own_goals')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Capocannoniere', key: 'top_scorer' },
                  { label: 'MVP Mondiale', key: 'mvp_world_cup' }
                ].map(s => (
                  <div key={s.key} className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-3">{s.label} (Top)</p>
                    {getTopPicks(s.key).map(([name, count]: any) => (
                      <div key={name} className="flex justify-between text-[10px] font-black uppercase italic mb-1">
                        <span className="truncate">{name}</span>
                        <span className="text-cyan-500">{count} voti</span>
                      </div>
                    ))}
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
