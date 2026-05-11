'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Trophy, Users, Zap, Search, Trash2, CheckCircle2, Star, Shield, ChevronDown, ChevronUp, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';

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
  const [bonusData, setBonusData] = useState({ red: '', top: '', high: '', penalties: '', own_goals: '', high_group: '', low_group: '', mvp_world_cup: '', best_goalkeeper: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) { setIsAdmin(true); fetchData(); }
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
    setMatches(mRes.data || []); setProfiles(pRes.data || []); setOfficialBracket(obRes.data || []); setAllUserBonuses(ubRes.data || []);
    if (bRes.data) {
      setBonusData({
        red: bRes.data.total_red_cards?.toString() || '', top: bRes.data.top_scorer || '', high: bRes.data.high_scoring_match || '',
        penalties: bRes.data.total_penalties?.toString() || '', own_goals: bRes.data.total_own_goals?.toString() || '',
        high_group: bRes.data.highest_scoring_group || '', low_group: bRes.data.lowest_scoring_group || '',
        mvp_world_cup: bRes.data.mvp_world_cup || '', best_goalkeeper: bRes.data.best_goalkeeper || ''
      });
    }
  }

  const syncLeaderboard = async (isManual = true) => {
    if (isManual && !window.confirm("Ricalcolare la classifica?")) return;
    setSyncing(true);
    try {
      const [{ data: profs }, { data: allMatches }, { data: allPreds }, { data: offBonuses }, { data: userBonuses }, { data: offBracket }, { data: userBrackets }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('matches').select('*').eq('is_finished', true),
        supabase.from('predictions').select('*'),
        supabase.from('official_bonuses').select('*').maybeSingle(),
        supabase.from('user_bonus_answers').select('*'),
        supabase.from('official_bracket').select('*'),
        supabase.from('brackets').select('*')
      ]);

      const updates = profs!.map(profile => {
        let pGroups = 0; let pBracket = 0; let pBonus = 0;
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
        userBrackets?.filter(b => b.user_id === profile.id).forEach(ub => {
          const uStg = normalizeStage(ub.stage);
          if (offBracket?.some(ob => normalizeStage(ob.stage) === uStg && ob.team_name.toLowerCase().trim() === ub.team_name.toLowerCase().trim()))
            pBracket += STAGES.find(s => s.id === uStg)?.pts || 0;
        });
        const ub = userBonuses?.find(b => b.user_id === profile.id);
        if (ub && offBonuses) {
          ['total_red_cards', 'total_penalties', 'total_own_goals', 'top_scorer', 'mvp_world_cup', 'best_goalkeeper', 'high_scoring_match', 'highest_scoring_group', 'lowest_scoring_group'].forEach(k => {
            if (offBonuses[k] != null && String(offBonuses[k]).trim().toLowerCase() === String(ub[k]).trim().toLowerCase()) pBonus += 10;
          });
        }
        return { ...profile, points: pGroups + pBracket + pBonus, points_groups: pGroups, points_bracket: pBracket, points_bonus: pBonus };
      });

      const sorted = [...updates].sort((a, b) => b.points - a.points);
      const ranked = sorted.map((u, i) => ({ ...u, ranking: (i + 1).toString() }));
      await supabase.from('profiles').upsert(ranked, { onConflict: 'id' });
      if (isManual) toast.success("Classifica sincronizzata!");
      fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setSyncing(false); }
  };

  const updateScore = async (id: number) => {
    const h = (document.getElementById(`h-${id}`) as HTMLInputElement).value;
    const a = (document.getElementById(`a-${id}`) as HTMLInputElement).value;
    await supabase.from('matches').update({ home_score_final: h !== '' ? parseInt(h) : null, away_score_final: a !== '' ? parseInt(a) : null, is_finished: h !== '' && a !== '' }).eq('id', id);
    toast.success("Salvato"); await syncLeaderboard(false);
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
    await supabase.from('official_bonuses').upsert(payload, { onConflict: 'id' });
    toast.success("Bonus aggiornati"); await syncLeaderboard(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse">CARICAMENTO...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-500 font-black">ACCESSO NEGATO</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-32 font-sans">
      <header className="text-center mb-12 pt-6">
        <h1 className="text-5xl font-black text-yellow-500 italic uppercase tracking-tighter mb-6">Control Tower</h1>
        <button onClick={() => syncLeaderboard(true)} disabled={syncing} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all">
          <RefreshCw size={18} className={syncing ? "animate-spin" : ""} /> {syncing ? 'Sincronizzazione...' : 'Sincronizza Classifica'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* ISCRIZIONI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <button onClick={() => setOpenSection({...openSection, iscrizioni: !openSection.iscrizioni})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
            <div className="flex items-center gap-3"><Users className="text-emerald-500" size={24} /><h2 className="text-xl font-black uppercase italic">Iscrizioni ({profiles.length})</h2></div>
            {openSection.iscrizioni ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.iscrizioni && (
            <div className="bg-slate-900 border-t border-slate-800 divide-y divide-slate-800/50">
              {profiles.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase italic">{p.username} <span className="text-yellow-500">#{p.ranking || '--'}</span></p>
                    <p className="text-[9px] text-slate-500 uppercase">{p.points || 0} PT ({p.points_groups}G + {p.points_bracket}F + {p.points_bonus}B)</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${p.is_paid ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-rose-500 border border-rose-500/30'}`}>{p.is_paid ? 'PAGATO' : 'DA PAGARE'}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FASE A GIRONI */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <button onClick={() => setOpenSection({...openSection, risultati: !openSection.risultati})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
            <div className="flex items-center gap-3"><Zap className="text-yellow-500" size={24} /><h2 className="text-xl font-black uppercase italic">Fase a Gironi</h2></div>
            {openSection.risultati ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection.risultati && (
            <div className="border-t border-slate-800 p-6 space-y-4">
              <input type="text" placeholder="CERCA SQUADRA..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-black uppercase outline-none focus:border-yellow-500" onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="grid gap-3">
                {matches.filter(m => m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) || m.away_team.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                  <div key={m.id} className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-600">#{m.id}</span>
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black uppercase flex-1 text-right truncate">{m.home_team}</span>
                      <input id={`h-${m.id}`} type="number" defaultValue={m.home_score_final ?? ''} className="w-10 h-10 bg-slate-950 rounded-lg text-center font-black text-yellow-500 border border-slate-700 outline-none" />
                      <span className="text-slate-700 font-black">-</span>
                      <input id={`a-${m.id}`} type="number" defaultValue={m.away_score_final ?? ''} className="w-10 h-10 bg-slate-950 rounded-lg text-center font-black text-yellow-500 border border-slate-700 outline-none" />
                      <span className="text-[10px] font-black uppercase flex-1 text-left truncate">{m.away_team}</span>
                    </div>
                    <button onClick={() => updateScore(m.id)} className="p-2 rounded-lg font-black uppercase text-[8px] tracking-tighter bg-yellow-500 text-slate-950">SALVA</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* BONUS UFFICIALI (CON MIGLIOR PORTIERE) */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <button onClick={() => setOpenSection({...openSection, bonus: !openSection.bonus})} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30">
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
                
                {/* NUOVO INPUT: MIGLIOR PORTIERE */}
                <input value={bonusData.best_goalkeeper} onChange={(e) => setBonusData({...bonusData, best_goalkeeper: e.target.value})} placeholder="MIGLIOR PORTIERE" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none text-purple-400" />
                
                <select value={bonusData.high} onChange={(e) => setBonusData({...bonusData, high: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-black uppercase outline-none">
                  <option value="">PARTITA + GOL...</option>
                  {matches.map(m => <option key={m.id} value={`${m.home_team} - ${m.away_team}`}>{m.home_team} - {m.away_team}</option>)}
                </select>
                <button type="submit" className="w-full bg-purple-600 py-4 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95">SALVA BONUS</button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
