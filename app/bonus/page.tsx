'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Award,
  Flame,
  Zap,
  Info,
  Goal,
  ArrowDownToLine,
  ArrowUpToLine,
  Trophy,
  Target,
  Map,
  Trash2,
} from 'lucide-react';

const LOCK_TIME = new Date('2026-06-11T20:00:00+02:00');
const GROUPS = [
  'Gruppo A',
  'Gruppo B',
  'Gruppo C',
  'Gruppo D',
  'Gruppo E',
  'Gruppo F',
  'Gruppo G',
  'Gruppo H',
  'Gruppo I',
  'Gruppo J',
  'Gruppo K',
  'Gruppo L',
];

export default function BonusPage() {
  const [formData, setFormData] = useState({
    total_red_cards: '',
    top_scorer: '',
    high_scoring_match: '',
    total_penalties: '',
    total_own_goals: '',
    highest_scoring_group: '',
    lowest_scoring_group: '',
    mvp_world_cup: '',
  });
  const [availableMatches, setAvailableMatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const isExpired = new Date() > LOCK_TIME;

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [bonusRes, matchesRes] = await Promise.all([
          supabase
            .from('user_bonus_answers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('matches')
            .select('home_team, away_team')
            .order('id', { ascending: true }),
        ]);

        if (matchesRes.data) {
          const validMatches = matchesRes.data
            .filter(
              (m) => m.home_team && m.away_team && !m.home_team.includes('TBD')
            )
            .map((m) => `${m.home_team} - ${m.away_team}`);
          setAvailableMatches(validMatches);
        }

        if (bonusRes.data) {
          setFormData({
            total_red_cards:
              bonusRes.data.total_red_cards != null
                ? bonusRes.data.total_red_cards.toString()
                : '',
            top_scorer: bonusRes.data.top_scorer || '',
            high_scoring_match: bonusRes.data.high_scoring_match || '',
            total_penalties:
              bonusRes.data.total_penalties != null
                ? bonusRes.data.total_penalties.toString()
                : '',
            total_own_goals:
              bonusRes.data.total_own_goals != null
                ? bonusRes.data.total_own_goals.toString()
                : '',
            highest_scoring_group: bonusRes.data.highest_scoring_group || '',
            lowest_scoring_group: bonusRes.data.lowest_scoring_group || '',
            mvp_world_cup: bonusRes.data.mvp_world_cup || '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, []);

  const resetBonus = async () => {
    if (isExpired) return;
    if (
      window.confirm('Sei sicuro di voler svuotare e cancellare tutti i bonus?')
    ) {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Utente non trovato');

        // Cancella tutto dal database
        const { error } = await supabase
          .from('user_bonus_answers')
          .delete()
          .eq('user_id', user.id);
        if (error) throw error;

        // Azzera la UI
        setFormData({
          total_red_cards: '',
          top_scorer: '',
          high_scoring_match: '',
          total_penalties: '',
          total_own_goals: '',
          highest_scoring_group: '',
          lowest_scoring_group: '',
          mvp_world_cup: '',
        });
        toast.success('Bonus azzerati e salvati!', { icon: '🧹' });
      } catch (error: any) {
        toast.error("Errore durante l'azzeramento");
      } finally {
        setLoading(false);
      }
    }
  };

  const saveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) return toast.error('Tempo scaduto!');

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Effettua il login');
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      total_red_cards:
        formData.total_red_cards !== ''
          ? parseInt(formData.total_red_cards)
          : null,
      top_scorer: formData.top_scorer.trim(),
      high_scoring_match: formData.high_scoring_match,
      total_penalties:
        formData.total_penalties !== ''
          ? parseInt(formData.total_penalties)
          : null,
      total_own_goals:
        formData.total_own_goals !== ''
          ? parseInt(formData.total_own_goals)
          : null,
      highest_scoring_group: formData.highest_scoring_group,
      lowest_scoring_group: formData.lowest_scoring_group,
      mvp_world_cup: formData.mvp_world_cup.trim(),
    };

    const { error } = await supabase
      .from('user_bonus_answers')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) toast.error('Errore: ' + error.message);
    else toast.success('Pronostici bonus salvati! 🍀');
    setLoading(false);
  };

  if (fetching)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse uppercase italic">
        Analizzando le quote...
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-48 font-sans">
      <header className="text-center mb-10 pt-4 flex flex-col items-center">
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter">
          Bonus
        </h1>
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl mb-4">
          <Info size={14} className="text-yellow-500" />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            8 Domande = 80 Punti
          </p>
        </div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600/30 active:scale-95 shadow-lg"
        >
          <Map size={14} /> Consulta i Gironi Ufficiali
        </Link>
      </header>

      <form onSubmit={saveBonus} className="max-w-md mx-auto space-y-6">
        <div
          className={`space-y-4 ${
            isExpired ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Zap size={14} />
                Totale Espulsioni (10pt)
              </span>
              <input
                type="number"
                value={formData.total_red_cards}
                placeholder="Inserisci numero"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-xl text-yellow-500 placeholder:text-slate-800"
                onChange={(e) =>
                  setFormData({ ...formData, total_red_cards: e.target.value })
                }
              />
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Goal size={14} /> Totale Rigori (90'e 120') (10pt)
              </span>
              <input
                type="number"
                value={formData.total_penalties}
                placeholder="Rigori totali"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-xl text-yellow-500 placeholder:text-slate-800"
                onChange={(e) =>
                  setFormData({ ...formData, total_penalties: e.target.value })
                }
              />
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Target size={14} /> Totale Autogol (10pt)
              </span>
              <input
                type="number"
                value={formData.total_own_goals}
                placeholder="Inserisci numero"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-xl text-yellow-500 placeholder:text-slate-800"
                onChange={(e) =>
                  setFormData({ ...formData, total_own_goals: e.target.value })
                }
              />
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Award size={14} /> Capocannoniere Mondiale (10pt)
              </span>
              <input
                type="text"
                value={formData.top_scorer}
                placeholder="Es. Mbappé"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-lg uppercase placeholder:text-slate-800"
                onChange={(e) =>
                  setFormData({ ...formData, top_scorer: e.target.value })
                }
              />
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Trophy size={14} /> MVP Mondiale (10pt)
              </span>
              <input
                type="text"
                value={formData.mvp_world_cup}
                placeholder="Es. Lamine Yamal"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-lg uppercase placeholder:text-slate-800"
                onChange={(e) =>
                  setFormData({ ...formData, mvp_world_cup: e.target.value })
                }
              />
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Flame size={14} /> Match con più gol fase a gironi (10pt)
              </span>
              <select
                value={formData.high_scoring_match}
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-sm uppercase appearance-none"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    high_scoring_match: e.target.value,
                  })
                }
              >
                <option value="">Scegli Partita...</option>
                {availableMatches.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <ArrowUpToLine size={14} /> Girone con più gol (10pt)
              </span>
              <select
                value={formData.highest_scoring_group}
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-lg uppercase appearance-none"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    highest_scoring_group: e.target.value,
                  })
                }
              >
                <option value="">Scegli Girone...</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <ArrowDownToLine size={14} /> Girone con meno gol (10pt)
              </span>
              <select
                value={formData.lowest_scoring_group}
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-lg uppercase appearance-none"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lowest_scoring_group: e.target.value,
                  })
                }
              >
                <option value="">Scegli Girone...</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {!isExpired && (
          <div className="fixed bottom-24 left-0 right-0 p-4 sm:p-6 flex justify-center items-center gap-2 sm:gap-3 z-50 pointer-events-none">
            {/* TASTO RESET */}
            <button
              type="button"
              onClick={resetBonus}
              disabled={loading}
              title="Svuota Bonus"
              className="pointer-events-auto flex items-center justify-center p-4 sm:p-5 bg-slate-900 border-2 border-slate-800 rounded-xl sm:rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 shadow-xl"
            >
              <Trash2 size={18} />
            </button>

            {/* TASTO SALVA */}
            <button
              disabled={loading}
              type="submit"
              className="pointer-events-auto max-w-[240px] sm:max-w-xs w-full bg-yellow-500 text-slate-950 font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl uppercase text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-2 sm:gap-3 italic active:scale-95"
            >
              {loading ? 'Salvataggio...' : 'Conferma Bonus'}
              {!loading && <Zap size={16} fill="currentColor" />}
            </button>
          </div>
        )}
      </form>
    </main>
  );
}
