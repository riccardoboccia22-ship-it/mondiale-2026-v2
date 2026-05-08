'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BonusPage() {
  const [formData, setFormData] = useState({
    total_red_cards: '',
    top_scorer: '',
    high_scoring_match: '',
  });
  const [loading, setLoading] = useState(false);

  const saveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return alert('Devi essere loggato!');

    const { error } = await supabase.from('bonuses').upsert({
      user_id: user.id,
      total_red_cards: parseInt(formData.total_red_cards),
      top_scorer: formData.top_scorer,
      high_scoring_match: formData.high_scoring_match,
    });

    if (error) alert('Errore: ' + error.message);
    else alert('Bonus salvati! Buona fortuna 🍀');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-32">
      <header className="text-center mb-10 mt-6">
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic italic">
          Super Bonus
        </h1>
        <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">
          Guadagna 30 punti extra
        </p>
      </header>

      <form onSubmit={saveBonus} className="max-w-md mx-auto space-y-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 space-y-4 shadow-xl">
          <label className="block">
            <span className="text-[10px] font-black text-yellow-500 uppercase mb-2 block">
              🔴 Totale Espulsioni mondiale (10pt)
            </span>
            <input
              type="number"
              placeholder="Inserisci numero"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 outline-none focus:border-yellow-500 transition-all font-bold"
              onChange={(e) =>
                setFormData({ ...formData, total_red_cards: e.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black text-yellow-500 uppercase mb-2 block">
              👟 Capocannoniere mondiale (10pt)
            </span>
            <input
              type="text"
              placeholder="Esempio: Mbappé"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 outline-none focus:border-yellow-500 transition-all font-bold"
              onChange={(e) =>
                setFormData({ ...formData, top_scorer: e.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black text-yellow-500 uppercase mb-2 block">
              🔥 Partita con più gol fase a gironi (10pt)
            </span>
            <input
              type="text"
              placeholder="Esempio: Messico-Sud Africa"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 outline-none focus:border-yellow-500 transition-all font-bold"
              onChange={(e) =>
                setFormData({ ...formData, high_scoring_match: e.target.value })
              }
            />
          </label>
        </div>

        <button
          disabled={loading}
          className="w-full bg-yellow-500 text-slate-950 font-black py-5 rounded-[2rem] uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all"
        >
          {loading ? 'Salvataggio...' : 'Conferma Scommesse Bonus'}
        </button>
      </form>
    </main>
  );
}
