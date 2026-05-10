'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, Star, LayoutGrid, ChevronDown, ChevronUp, 
  Flame, Award, Zap, Target, CheckCircle2, XCircle, Shield,
  Goal, ArrowDownToLine, ArrowUpToLine
} from 'lucide-react';

const STAGE_POINTS: { [key: string]: number } = { 'R32': 2, 'R16': 4, 'QF': 6, 'SF': 8, 'F': 10, 'WINNER': 20 };
const STAGE_CAPACITY: { [key: string]: number } = { 'R32': 32, 'R16': 16, 'QF': 8, 'SF': 4, 'F': 2, 'WINNER': 1 };

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

export default function TuttiPronosticiPage() {
  const [activeTab, setActiveTab] = useState<'GIRONI' | 'BRACKET' | 'BONUS'>('GIRONI');
  const [data, setData] = useState<any>({ 
    profiles: [], matches: [], predictions: [], brackets: [], 
    userBonuses: [], officialBonus: null, officialResults: [] 
  });
  const [loading, setLoading] = useState(true);
  
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [expandedBracketUser, setExpandedBracketUser] = useState<string | null>(null);
  const [expandedBonusUser, setExpandedBonusUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [p, m, pr, br, off, offBo, usrBo] = await Promise.all([
          supabase.from('profiles').select('*').order('username'),
          supabase.from('matches').select('*').order('id'),
          supabase.from('predictions').select('*'),
          supabase.from('brackets').select('*'),
          supabase.from('official_bracket').select('*'),
          supabase.from('official_bonuses').select('*').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
          supabase.from('user_bonus_answers').select('*')
        ]);
        
        setData({ 
          profiles: p.data || [], 
          matches: m.data || [], 
          predictions: pr.data || [], 
          brackets: br.data || [], 
          officialResults: off.data || [],
          officialBonus: offBo.data || null,
          userBonuses: usrBo.data || [] 
        });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const getFlagUrl = (team: string) => {
    const code = flagMap[team?.toLowerCase().trim()];
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
  };

  const getMatchResultInfo = (pred: any, match: any) => {
    if (!pred || match.home_score_final === null || match.away_score_final === null || !match.is_finished) {
      return { pts: 0, color: 'text-slate-600', label: '' };
    }
    
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
        
        <div className="flex bg-slate-900/50 backdrop-blur-md p-1 rounded-2xl border border-slate-800 mt-6 max-w-sm mx-auto">
          {([{ id: 'GIRONI', icon: <LayoutGrid size={14}/> }, { id: 'BRACKET', icon: <Trophy size={14}/> }, { id: 'BONUS', icon: <Star size={14}/> }] as any).map((tab: any) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === tab.id ? 'bg-yellow-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab.icon} {tab.id}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* --- SEZIONE GIRONI --- */}
        {activeTab === 'GIRONI' && data.matches.map((match: any) => {
          const isExpanded = expandedMatch === match.id;
          const homeFlag = getFlagUrl(match.home_team);
          const awayFlag = getFlagUrl(match.away_team);
          const isFinished = match.is_finished && match.home_score_final !== null && match.away_score_final !== null;

          return (
            <div key={match.id} className={`bg-slate-900/40 border rounded-[2rem] overflow-hidden transition-all ${isExpanded ? 'border-yellow-500/30' : 'border-slate-800'}`}>
              
              <button onClick={() => setExpandedMatch(isExpanded ? null : match.id)} className="w-full p-4 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-800/30 transition-all gap-2 sm:gap-4">
                
                <div className="w-full sm:w-auto flex justify-between items-center sm:block text-left">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">#{match.id}</span>
                  {isFinished && <span className="text-[8px] text-emerald-400 font-black uppercase italic bg-emerald-500/10 px-2 py-0.5 rounded-full sm:hidden">FINITA</span>}
                </div>

                <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 w-full">
                  
                  <div className="flex flex-1 items-center justify-end gap-2 text-right min-w-0">
                    <span className="font-black uppercase italic text-xs tracking-tight hidden sm:block truncate">{match.home_team}</span>
                    <span className="font-black uppercase italic text-[10px] tracking-tight sm:hidden truncate">{match.home_team.substring(0, 3)}</span>
                    {homeFlag ? (
                      <img src={homeFlag} className="w-6 h-auto rounded-sm shadow-md flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-6 h-4 bg-slate-800 rounded-sm flex items-center justify-center flex-shrink-0"><Shield size={10} className="text-slate-600"/></div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 font-black text-sm italic w-14 sm:w-20 text-center">
                    {isFinished ? (
                      <span className="bg-yellow-500 text-slate-950 px-2 sm:px-3 py-1 rounded-lg shadow-lg text-xs sm:text-sm">
                        {match.home_score_final} - {match.away_score_final}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px] sm:text-xs">VS</span>
                    )}
                  </div>

                  <div className="flex flex-1 items-center justify-start gap-2 text-left min-w-0">
                    {awayFlag ? (
                      <img src={awayFlag} className="w-6 h-auto rounded-sm shadow-md flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-6 h-4 bg-slate-800 rounded-sm flex items-center justify-center flex-shrink-0"><Shield size={10} className="text-slate-600"/></div>
                    )}
                    <span className="font-black uppercase italic text-xs tracking-tight hidden sm:block truncate">{match.away_team}</span>
                    <span className="font-black uppercase italic text-[10px] tracking-tight sm:hidden truncate">{match.away_team.substring(0, 3)}</span>
                  </div>

                </div>

                <div className="hidden sm:flex w-16 justify-end">
                   {isFinished && <span className="text-[8px] text-emerald-400 font-black uppercase italic bg-emerald-500/10 px-2 py-0.5 rounded-full">FINITA</span>}
                </div>

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
                          {isFinished && (
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

        {/* --- SEZIONE BRACKET --- */}
        {activeTab === 'BRACKET' && data.profiles.map((user: any) => {
          const userPicks = data.brackets.filter((b: any) => b.user_id === user.id);
          const isExpanded = expandedBracketUser === user.id;

          let userBracketPts = 0;
          Object.entries(STAGE_POINTS).forEach(([stageKey, pts]) => {
            const picks = userPicks.filter((p: any) => normalizeStage(p.stage) === stageKey);
            const officialTeamsInStage = data.officialResults.filter((off: any) => normalizeStage(off.stage) === stageKey && off.team_name && off.team_name.trim() !== '');
            picks.forEach((p: any) => {
              const isCorrect = officialTeamsInStage.some((off: any) => off.team_name.trim().toLowerCase() === p.team_name.trim().toLowerCase());
              if (isCorrect) userBracketPts += pts;
            });
          });

          return (
            <div key={user.id} className={`bg-slate-900/40 border rounded-[2.5rem] overflow-hidden transition-all shadow-xl ${isExpanded ? 'border-blue-500/30' : 'border-slate-800'}`}>
              
              <button onClick={() => setExpandedBracketUser(isExpanded ? null : user.id)} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${isExpanded ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Trophy size={16} />
                  </div>
                  <span className="font-black uppercase italic text-sm text-white">{user.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 shadow-sm">{userBracketPts} PT</span>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-6 grid grid-cols-1 gap-4">
                  {Object.entries({
                    'R32': 'Sedicesimi', 'R16': 'Ottavi', 'QF': 'Quarti', 'SF': 'Semi', 'F': 'Finale', 'WINNER': 'Campione'
                  }).map(([stageKey, label]) => {
                    const picks = userPicks.filter((p: any) => normalizeStage(p.stage) === stageKey);
                    
                    const officialTeamsInStage = data.officialResults.filter((off: any) => 
                      normalizeStage(off.stage) === stageKey && 
                      off.team_name && 
                      off.team_name.trim() !== ''
                    );
                    
                    const isStageFull = officialTeamsInStage.length >= (STAGE_CAPACITY[stageKey] || 99);

                    return (
                      <div key={stageKey} className="space-y-2">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
                        <div className="flex flex-wrap gap-2">
                          {picks.map((p: any) => {
                            const isCorrect = officialTeamsInStage.some((off: any) => 
                              off.team_name.trim().toLowerCase() === p.team_name.trim().toLowerCase()
                            );
                            
                            const isWrong = isStageFull && !isCorrect;

                            return (
                              <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase italic transition-all ${
                                isCorrect 
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                  : (isWrong ? 'bg-rose-500/10 border-rose-950 text-rose-800 opacity-50' : 'bg-slate-950 border-slate-800 text-slate-400')
                              }`}>
                                {getFlagUrl(p.team_name) ? (
                                  <img src={getFlagUrl(p.team_name)!} className="w-4 h-auto rounded-sm" alt="" />
                                ) : (
                                  <Shield size={10} className="text-slate-600"/>
                                )}
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
              )}
            </div>
          );
        })}

        {/* --- SEZIONE BONUS --- */}
        {activeTab === 'BONUS' && data.profiles.map((user: any) => {
          const b = data.userBonuses.find((bonus: any) => bonus.user_id === user.id);
          const offBonus = data.officialBonus;
          const isExpanded = expandedBonusUser === user.id;
          
          // FIX: Aggiornati i controlli includendo mvp_world_cup e rimuovendo best_goalkeeper
          const checks = {
            red: offBonus?.total_red_cards != null && b?.total_red_cards != null && String(b.total_red_cards) === String(offBonus.total_red_cards),
            top: !!offBonus?.top_scorer?.trim() && !!b?.top_scorer?.trim() && b.top_scorer.trim().toLowerCase() === offBonus.top_scorer.trim().toLowerCase(),
            match: !!offBonus?.high_scoring_match?.trim() && !!b?.high_scoring_match?.trim() && b.high_scoring_match.trim().toLowerCase() === offBonus.high_scoring_match.trim().toLowerCase(),
            penalties: offBonus?.total_penalties != null && b?.total_penalties != null && String(b.total_penalties) === String(offBonus.total_penalties),
            own_goals: offBonus?.total_own_goals != null && b?.total_own_goals != null && String(b.total_own_goals) === String(offBonus.total_own_goals),
            high_group: !!offBonus?.highest_scoring_group?.trim() && !!b?.highest_scoring_group?.trim() && b.highest_scoring_group.trim().toLowerCase() === offBonus.highest_scoring_group.trim().toLowerCase(),
            low_group: !!offBonus?.lowest_scoring_group?.trim() && !!b?.lowest_scoring_group?.trim() && b.lowest_scoring_group.trim().toLowerCase() === offBonus.lowest_scoring_group.trim().toLowerCase(),
            mvp: !!offBonus?.mvp_world_cup?.trim() && !!b?.mvp_world_cup?.trim() && b.mvp_world_cup.trim().toLowerCase() === offBonus.mvp_world_cup.trim().toLowerCase(),
          };

          let userBonusPts = 0;
          Object.values(checks).forEach(isOk => { if (isOk) userBonusPts += 10; });

          return (
            <div key={user.id} className={`bg-slate-900/40 border rounded-[2.5rem] overflow-hidden transition-all shadow-xl ${isExpanded ? 'border-purple-500/30' : 'border-slate-800'}`}>
              
              <button onClick={() => setExpandedBonusUser(isExpanded ? null : user.id)} className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${isExpanded ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Star size={16} />
                  </div>
                  <span className="font-black uppercase italic text-sm text-white">{user.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 shadow-sm">{userBonusPts} PT</span>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-6 space-y-3">
                  {[
                    { id: 'Totale Espulsioni', val: b?.total_red_cards, ok: checks.red, icon: <Zap size={14}/> },
                    { id: 'Totale Rigori', val: b?.total_penalties, ok: checks.penalties, icon: <Goal size={14}/> },
                    { id: 'Totale Autogol', val: b?.total_own_goals, ok: checks.own_goals, icon: <Target size={14}/> },
                    { id: 'Capocannoniere', val: b?.top_scorer, ok: checks.top, icon: <Award size={14}/> },
                    { id: 'MVP Mondiale', val: b?.mvp_world_cup, ok: checks.mvp, icon: <Trophy size={14}/> }, // FIX: Modificato in MVP
                    { id: 'Match con più gol', val: b?.high_scoring_match, ok: checks.match, icon: <Flame size={14}/> },
                    { id: 'Girone con più gol', val: b?.highest_scoring_group, ok: checks.high_group, icon: <ArrowUpToLine size={14}/> },
                    { id: 'Girone con meno gol', val: b?.lowest_scoring_group, ok: checks.low_group, icon: <ArrowDownToLine size={14}/> },
                  ].map((bonus) => (
                    <div key={bonus.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-2 ${
                      bonus.ok ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}>
                      <div className="flex items-center gap-3">
                        {bonus.icon}
                        <span className="text-[10px] font-black uppercase italic">{bonus.id}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className="font-black text-xs uppercase truncate max-w-[150px]">{bonus.val || '--'}</span>
                        {bonus.ok && <span className="font-black text-xs bg-emerald-500/20 px-2 py-0.5 rounded-md">+10</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}