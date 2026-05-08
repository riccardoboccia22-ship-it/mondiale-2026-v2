'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, Star, LayoutGrid, ChevronDown, ChevronUp, 
  Flame, Award, Zap, Target, CheckCircle2, XCircle 
} from 'lucide-react';

const STAGE_POINTS: { [key: string]: number } = { 'R32': 2, 'R16': 4, 'QF': 6, 'SF': 8, 'F': 10, 'WINNER': 20 };

// FlagMap consolidata
const flagMap: { [key: string]: string } = {
  'algeria': 'dz', 'arabia saudita': 'sa', 'argentina': 'ar', 'australia': 'au', 'austria': 'at',
  'belgio': 'be', 'bosnia ed erzegovina': 'ba', 'brasile': 'br', 'canada': 'ca', 'capo verde': 'cv',
  'colombia': 'co', 'corea del sud': 'kr', 'costa d\'avorio': 'ci', 'croazia': 'hr', 'curaçao': 'cw', 
  'ecuador': 'ec', 'egitto': 'eg', 'francia': 'fr', 'germania': 'de', 'ghana': 'gh', 'giappone': 'jp', 
  'giordania': 'jo', 'haiti': 'ht', 'inghilterra': 'gb-eng', 'iran': 'ir', 'iraq': 'iq', 'marocco': 'ma', 
  'messico': 'mx', 'norvegia': 'no', 'nuova zelanda': 'nz', 'olanda': 'nl', 'panama': 'pa', 'paraguay': 'py',
  'portogallo': 'pt', 'qatar': 'qa', 'repubblica ceca': 'cz', 'repubblica democratica del congo': 'cd',
  'scozia': 'gb-sct', 'senegal': 'sn', 'spagna': 'es', 'stati uniti': 'us', 'usa': 'us',
  'sudafrica': 'za', 'svezia': 'se', 'svizzera': 'ch', 'tunisia': 'tn', 'turchia': 'tr', 
  'uruguay': 'uy', 'uzbekistan': 'uz'
};

const normalizeStage = (s: string) => {
  const u = s?.toUpperCase() || '';
  if (u.includes('SEDICESIM') || u === 'R32') return 'R32';
  if (u.includes('OTTAV') || u === 'R16') return 'R16';
  if (u.includes('QUART') || u === 'QF') return 'QF';
  if (u.includes('SEMIFINAL') || u === 'SF') return 'SF';
  if (u.includes('VINCITORE') || u === 'WINNER') return 'WINNER';
  return 'F';
};

export default function TuttiPronosticiPage() {
  const [activeTab, setActiveTab] = useState<'GIRONI' | 'BRACKET' | 'BONUS'>('GIRONI');
  const [data, setData] = useState<any>({ profiles: [], matches: [], predictions: [], brackets: [], bonuses: [], officialResults: [] });
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [p, m, pr, br, bo, off] = await Promise.all([
          supabase.from('profiles').select('*').order('username'),
          supabase.from('matches').select('*').order('id'),
          supabase.from('predictions').select('*'),
          supabase.from('brackets').select('*'),
          supabase.from('bonuses').select('*'),
          supabase.from('official_bracket').select('*')
        ]);
        setData({ profiles: p.data || [], matches: m.data || [], predictions: pr.data || [], brackets: br.data || [], bonuses: bo.data || [], officialResults: off.data || [] });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const getFlagUrl = (team: string) => {
    const code = flagMap[team?.toLowerCase().trim()];
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
  };

  const officialBonus = data.bonuses.find((b: any) => b.id === '00000000-0000-0000-0000-000000000000');

  // Helper per calcolo punti gironi e colori
  const getMatchResultInfo = (pred: any, match: any) => {
    if (!pred || match.home_score_final === null) return { pts: 0, color: 'text-slate-600', label: '' };
    
    const ph = Number(pred.home_score); const pa = Number(pred.away_score);
    const mh = Number(match.home_score_final); const ma = Number(match.away_score_final);
    const pRes = ph > pa ? '1' : ph < pa ? '2' : 'X';
    const mRes = mh > ma ? '1' : mh < ma ? '2' : 'X';

    if (ph === mh && pa === ma) return { pts: 10, color: 'text-emerald-400', border: 'border-emerald-500/50', label: 'ESATTO' };
    if (pRes === mRes && (ph === mh || pa === ma)) return { pts: 6, color: 'text-yellow-500', border: 'border-yellow-500/50', label: 'SEGNO+GOL' };
    if (pRes === mRes) return { pts: 4, color: 'text-amber-600', border: 'border-amber-600/30', label: 'SEGNO' };
    if (ph === mh || pa === ma) return { pts: 2, color: 'text-slate-400', border: 'border-slate-800', label: 'GOL' };
    
    return { pts: 0, color: 'text-rose-500', border: 'border-rose-900/50', label: 'ZERO' };
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse uppercase italic tracking-widest">Sincronizzazione Mondiale...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-32 font-sans">
      <header className="text-center mb-8 pt-4">
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter">Pronostici Globali</h1>
        
        {/* Navigazione Tab Glassmorphism */}
        <div className="flex bg-slate-900/50 backdrop-blur-md p-1 rounded-2xl border border-slate-800 mt-6 max-w-sm mx-auto">
          {([{ id: 'GIRONI', icon: <LayoutGrid size={14}/> }, { id: 'BRACKET', icon: <Trophy size={14}/> }, { id: 'BONUS', icon: <Star size={14}/> }] as any).map((tab: any) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === tab.id ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab.icon} {tab.id}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* --- SEZIONE GIRONI (COLORI E PUNTI) --- */}
        {activeTab === 'GIRONI' && data.matches.map((match: any) => {
          const isExpanded = expandedMatch === match.id;
          return (
            <div key={match.id} className={`bg-slate-900/40 border rounded-[2rem] overflow-hidden transition-all ${isExpanded ? 'border-yellow-500/30' : 'border-slate-800'}`}>
              <button onClick={() => setExpandedMatch(isExpanded ? null : match.id)} className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition-all">
                <div className="flex flex-col items-start">
                  <span className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest italic">Match #{match.id}</span>
                  <div className="flex items-center gap-2 font-black italic uppercase text-xs">
                    {match.home_team} <span className="text-yellow-500 text-[10px]">VS</span> {match.away_team}
                  </div>
                </div>
                {match.home_score_final !== null && (
                  <div className="bg-yellow-500 text-slate-950 px-3 py-1 rounded-lg text-sm font-black italic shadow-lg shadow-yellow-500/20">
                    {match.home_score_final} - {match.away_score_final}
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  {data.profiles.map((user: any) => {
                    const pred = data.predictions.find((p: any) => p.match_id === match.id && p.user_id === user.id);
                    const info = getMatchResultInfo(pred, match);
                    return (
                      <div key={user.id} className={`flex justify-between items-center px-4 py-3 bg-slate-900/50 rounded-2xl border ${info.border || 'border-slate-800/50'}`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase italic">{user.username}</span>
                          {info.label && <span className={`${info.color} text-[7px] font-black tracking-widest`}>{info.label}</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-black text-lg italic ${pred ? info.color : 'text-slate-800'}`}>
                            {pred ? `${pred.home_score} - ${pred.away_score}` : '--'}
                          </span>
                          {match.home_score_final !== null && (
                            <span className={`w-8 text-center font-black italic text-xs ${info.color}`}>
                              {info.pts > 0 ? `+${info.pts}` : '0'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* --- SEZIONE BRACKET (VISUAL FEEDBACK CORRETTO/ERRATO) --- */}
        {activeTab === 'BRACKET' && data.profiles.map((user: any) => {
          const userPicks = data.brackets.filter((b: any) => b.user_id === user.id);
          return (
            <div key={user.id} className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-6 mb-6 shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <span className="font-black uppercase italic text-sm text-yellow-500">{user.username}</span>
                <Trophy size={16} className="text-slate-700" />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {Object.entries({
                  'R32': 'Sedicesimi', 'R16': 'Ottavi', 'QF': 'Quarti', 'SF': 'Semi', 'F': 'Finale', 'WINNER': 'Campione'
                }).map(([stageKey, label]) => {
                  const picks = userPicks.filter((p: any) => normalizeStage(p.stage) === stageKey);
                  return (
                    <div key={stageKey} className="space-y-2">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {picks.map((p: any) => {
                          const isCorrect = data.officialResults.some((off: any) => 
                            normalizeStage(off.stage) === stageKey && off.team_name.trim().toLowerCase() === p.team_name.trim().toLowerCase()
                          );
                          const isFinalized = data.officialResults.some((off: any) => normalizeStage(off.stage) === stageKey);

                          return (
                            <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase italic transition-all ${
                              isCorrect 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : (isFinalized ? 'bg-rose-500/10 border-rose-950 text-rose-800 opacity-50' : 'bg-slate-950 border-slate-800 text-slate-400')
                            }`}>
                              {getFlagUrl(p.team_name) && <img src={getFlagUrl(p.team_name)!} className="w-4 h-auto rounded-sm" />}
                              {p.team_name}
                              {isCorrect && <span className="ml-1">+{STAGE_POINTS[stageKey]}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* --- SEZIONE BONUS (DETTAGLIO PUNTI) --- */}
        {activeTab === 'BONUS' && data.profiles.map((user: any) => {
          const b = data.bonuses.find((bonus: any) => bonus.user_id === user.id);
          const checks = {
            red: String(b?.total_red_cards) === String(officialBonus?.total_red_cards),
            top: b?.top_scorer?.trim().toLowerCase() === officialBonus?.top_scorer?.trim().toLowerCase(),
            match: b?.high_scoring_match?.trim().toLowerCase() === officialBonus?.high_scoring_match?.trim().toLowerCase()
          };

          return (
            <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-xl mb-4">
              <h4 className="font-black uppercase italic text-sm text-yellow-500 mb-6 flex justify-between">
                {user.username}
                <Star size={16} />
              </h4>
              <div className="space-y-3">
                {[
                  { id: 'Rossi', val: b?.total_red_cards, ok: checks.red, icon: <Zap size={14}/> },
                  { id: 'Capocannoniere', val: b?.top_scorer, ok: checks.top, icon: <Award size={14}/> },
                  { id: 'Goleada', val: b?.high_scoring_match, ok: checks.match, icon: <Flame size={14}/> }
                ].map((bonus) => (
                  <div key={bonus.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    bonus.ok && officialBonus?.total_red_cards !== null ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-3">
                      {bonus.icon}
                      <span className="text-[10px] font-black uppercase italic">{bonus.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs uppercase">{bonus.val || '--'}</span>
                      {bonus.ok && officialBonus?.total_red_cards !== null && <span className="font-black text-xs">+10</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}