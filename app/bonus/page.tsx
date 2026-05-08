'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Clover, Award, Flame, Zap, Info } from 'lucide-react';

// Blocco modifiche: 11 Giugno 2026, ore 20:00 (un'ora prima dell'inizio)
const LOCK_TIME = new Date('2026-06-11T20:00:00+02:00');

export default function BonusPage() {
  const [formData, setFormData] = useState({
    total_red_cards: '',
    top_scorer: '',
    high_scoring_match: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const isExpired = new Date() > LOCK_TIME;

  useEffect(() => {
    async function loadUserBonus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('bonuses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setFormData({
            total_red_cards: data.total_red_cards !== null ? data.total_red_cards.toString() : '',
            top_scorer: data.top_scorer || '',
            high_scoring_match: data.high_scoring_match || '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    loadUserBonus();
  }, []);

  const saveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      toast.error("Tempo scaduto! Le scommesse sono chiuse.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Sessione scaduta, effettua il login');
      setLoading(false);
      return;
    }

    // SALVATAGGIO UTENTE: Puntiamo solo allo user_id
    const { error } = await supabase.from('bonuses').upsert({
      user_id: user.id, // Identifica univocamente il TUO pronostico
      total_red_cards: formData.total_red_cards !== '' ? parseInt(formData.total_red_cards) : null,
      top_scorer: formData.top_scorer.trim(),
      high_scoring_match: formData.high_scoring_match.trim(),
    }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Errore nel salvataggio: ' + error.message);
    } else {
      toast.success('Pronostici bonus salvati! 🍀');
    }
    setLoading(false);
  };

  if (fetching) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse uppercase italic">
      Analizzando le quote...
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-40 font-sans">
      <header className="text-center mb-10 pt-4">
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter">Bonus</h1>
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <Info size={14} className="text-yellow-500" />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">3 Domande = 30 Punti in palio</p>
        </div>
      </header>

      <form onSubmit={saveBonus} className="max-w-md mx-auto space-y-6">
        <div className={`space-y-4 ${isExpired ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden group">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Zap size={14} /> Totale Espulsioni (10pt)
              </span>
              <input
                type="number"
                value={formData.total_red_cards}
                placeholder="Inserisci un numero"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-xl text-yellow-500 placeholder:text-slate-800"
                onChange={(e) => setFormData({ ...formData, total_red_cards: e.target.value })}
              />
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden group">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Award size={14} /> Capocannoniere (10pt)
              </span>
              <input
                type="text"
                value={formData.top_scorer}
                placeholder="Es. Mbappé"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-lg uppercase placeholder:text-slate-800"
                onChange={(e) => setFormData({ ...formData, top_scorer: e.target.value })}
              />
            </label>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden group">
            <label className="block relative z-10">
              <span className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-wider">
                <Flame size={14} /> Match con più gol (10pt)
              </span>
              <input
                type="text"
                value={formData.high_scoring_match}
                placeholder="Fase a Gironi"
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none focus:border-yellow-500 transition-all font-black text-lg uppercase placeholder:text-slate-800"
                onChange={(e) => setFormData({ ...formData, high_scoring_match: e.target.value })}
              />
            </label>
          </div>
        </div>

        {!isExpired && (
          <div className="fixed bottom-24 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none">
            <button
              disabled={loading}
              type="submit"
              className="pointer-events-auto max-w-xs w-full bg-yellow-500 text-slate-950 font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 italic"
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