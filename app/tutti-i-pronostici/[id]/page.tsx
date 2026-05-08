'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DettaglioSchedinaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bonusData, setBonusData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);

        // 1. Recupera il Profilo (Cerca sia per ID che per Username)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${id},username.eq.${id}`)
          .maybeSingle();

        if (!profileData) {
          console.error('Profilo non trovato');
          setLoading(false);
          return;
        }
        setProfile(profileData);

        // 2. Recupera i Bonus
        const { data: bData } = await supabase
          .from('user_bonus_answers')
          .select('*')
          .eq('user_id', profileData.id)
          .maybeSingle();
        setBonusData(bData);

        // 3. Recupera tutte le Prediction con i dati dei match associati
        const { data: predData, error: predError } = await supabase
          .from('predictions')
          .select(
            `
            home_score,
            away_score,
            matches (
              home_team,
              away_team,
              stage
            )
          `
          )
          .eq('user_id', profileData.id);

        if (!predError) {
          setPredictions(predData || []);
        } else {
          console.error('Errore recupero pronostici:', predError);
        }
      } catch (err) {
        console.error('Errore generale:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // --- LOGICA FILTRI ---

  // Filtro Fase Finale
  const faseFinale = predictions.filter((p) => {
    const s = p.matches?.stage?.toLowerCase() || '';
    return (
      s.includes('ottav') ||
      s.includes('quart') ||
      s.includes('semi') ||
      s.includes('final')
    );
  });

  // Filtro Fase a Gironi (Tutto ciò che non è finale)
  const gironi = predictions.filter((p) => {
    const s = p.matches?.stage?.toLowerCase() || '';
    const isFinale =
      s.includes('ottav') ||
      s.includes('quart') ||
      s.includes('semi') ||
      s.includes('final');
    return !isFinale;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black uppercase text-[10px] tracking-widest">
        Scansione Schedina...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <p className="text-xs font-black uppercase text-slate-500 mb-4">
          Utente non trovato
        </p>
        <button
          onClick={() => router.push('/tutti-i-pronostici')}
          className="text-yellow-500 font-black uppercase text-[10px] border border-yellow-500/30 px-6 py-3 rounded-full"
        >
          Torna alla lista
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-24 font-sans italic">
      <div className="max-w-md mx-auto">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-yellow-500 transition-colors tracking-widest flex items-center gap-2"
        >
          <span>←</span> Torna alla lista
        </button>

        {/* PROFILO CARD */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] mb-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/20"></div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-yellow-500 mb-2 italic">
            Dettaglio Scommesse
          </p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">
            {profile.username || 'Anonimo'}
          </h1>
          <div className="inline-flex items-center gap-3 bg-yellow-500 text-slate-950 px-8 py-2.5 rounded-full font-black text-sm uppercase italic shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            {profile.points || 0} Punti
          </div>
        </div>

        {/* SEZIONE BONUS */}
        <div className="mb-12">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-4 mb-4 italic">
            🏆 Super Bonus
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            <BonusCard label="Capocannoniere" value={bonusData?.top_scorer} />
            <BonusCard
              label="Partita più gol"
              value={bonusData?.high_scoring_match}
            />
            <BonusCard
              label="Cartellini Rossi"
              value={bonusData?.total_red_cards}
            />
          </div>
        </div>

        {/* FASE A GIRONI */}
        <div className="mb-12">
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] ml-4 mb-4 italic">
            ⚽ Fase a Gironi
          </h2>
          <div className="space-y-3">
            {gironi.length > 0 ? (
              gironi.map((p, i) => <PredictionRow key={i} p={p} />)
            ) : (
              <p className="text-[9px] text-slate-700 uppercase font-black ml-4 italic">
                Nessun pronostico inserito
              </p>
            )}
          </div>
        </div>

        {/* FASE FINALE */}
        <div className="mb-12">
          <h2 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] ml-4 mb-4 italic">
            🔥 Fase Finale
          </h2>
          <div className="space-y-3">
            {faseFinale.length > 0 ? (
              faseFinale.map((p, i) => <PredictionRow key={i} p={p} />)
            ) : (
              <p className="text-[9px] text-slate-700 uppercase font-black ml-4 italic">
                Nessun pronostico fase finale
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// COMPONENTI LOCALI
function PredictionRow({ p }: { p: any }) {
  return (
    <div className="p-5 rounded-[1.8rem] flex justify-between items-center bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
      <div className="flex-1">
        <p className="text-[7px] font-black uppercase mb-1 text-slate-600 tracking-widest">
          {p.matches?.stage || 'Gironi'}
        </p>
        <p className="text-[11px] font-black uppercase text-slate-200 tracking-tight">
          {p.matches?.home_team} <span className="text-slate-600 px-1">vs</span>{' '}
          {p.matches?.away_team}
        </p>
      </div>
      <div className="bg-slate-950 px-5 py-2 rounded-2xl font-black text-xl text-yellow-500 border border-slate-800 min-w-[85px] text-center shadow-inner">
        {p.home_score} - {p.away_score}
      </div>
    </div>
  );
}

function BonusCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
      <span className="text-[9px] font-black uppercase text-slate-500 italic">
        {label}
      </span>
      <span className="text-[11px] font-black uppercase text-yellow-500 tracking-widest">
        {value || '---'}
      </span>
    </div>
  );
}
