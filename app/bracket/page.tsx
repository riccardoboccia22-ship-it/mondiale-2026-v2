'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// CONFIGURAZIONE
const WORLD_CUP_START_DATE = new Date('2026-06-11T21:00:00+02:00'); 

const STAGES = [
  { id: 'R32', label: 'Sedicesimi', count: 32, pts: 2 },
  { id: 'R16', label: 'Ottavi', count: 16, pts: 4 },
  { id: 'QF', label: 'Quarti', count: 8, pts: 6 },
  { id: 'SF', label: 'Semifinali', count: 4, pts: 8 },
  { id: 'F', label: 'Finale', count: 2, pts: 10 },
  { id: 'WINNER', label: 'Vincitore Mondiale', count: 1, pts: 20 },
];

const TEAMS = [
  "Algeria", "Angola", "Argentina", "Australia", "Austria", "Belgio", "Brasile", 
  "Camerun", "Canada", "Cile", "Colombia", "Corea del Sud", "Costa d'Avorio", 
  "Croazia", "Danimarca", "Ecuador", "Egitto", "Francia", "Germania", "Ghana", 
  "Giappone", "Inghilterra", "Iran", "Iraq", "Mali", "Marocco", "Messico", 
  "Nigeria", "Norvegia", "Olanda", "Polonia", "Portogallo", "Qatar", "Senegal", 
  "Serbia", "Spagna", "Stati Uniti", "Sudafrica", "Svizzera", "Uruguay"
].sort();

export default function BracketPage() {
  const [selections, setSelections] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const isExpired = new Date() > WORLD_CUP_START_DATE;

  useEffect(() => {
    loadSavedBracket();
  }, []);

  async function loadSavedBracket() {
    try {
      setFetching(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('brackets')
        .select('stage, team_name')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const saved: any = {};
        const stageCounts: any = {};
        data.forEach((row) => {
          const count = stageCounts[row.stage] || 0;
          saved[`${row.stage}-${count}`] = row.team_name;
          stageCounts[row.stage] = count + 1;
        });
        setSelections(saved);
      }
    } catch (err) {
      console.error(err);
      toast.error("Errore nel recupero dati");
    } finally {
      setFetching(false);
    }
  }

  const handleSelect = (stage: string, index: number, team: string) => {
    if (isExpired) return;
    setSelections((prev: any) => ({ ...prev, [`${stage}-${index}`]: team }));
  };

  const saveBracket = async () => {
    if (isExpired) return toast.error("Le giocate sono chiuse!");
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Effettua il login per salvare!");
        return;
      }

      // 1. Pulizia vecchi dati
      await supabase.from('brackets').delete().eq('user_id', user.id);
      
      // 2. Preparazione righe
      const rows = Object.entries(selections)
        .filter(([_, t]) => t !== "" && t !== null)
        .map(([k, t]) => ({
          user_id: user.id, 
          stage: k.split('-')[0], 
          team_name: t
        }));

      if (rows.length === 0) {
        toast.error("Seleziona almeno una squadra!");
        setLoading(false);
        return;
      }

      // 3. Salvataggio
      const { error } = await supabase.from('brackets').insert(rows);
      if (error) throw error;

      toast.success("Tabellone salvato! 🏆");
    } catch (error: any) {
      toast.error("Errore: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper per sapere quali squadre sono già "occupate" in una fase
  const getSelectedInStage = (stageId: string, currentIndex: number) => {
    return Object.entries(selections)
      .filter(([key, value]) => key.startsWith(`${stageId}-`) && key !== `${stageId}-${currentIndex}`)
      .map(([_, value]) => value);
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-yellow-500 font-black animate-pulse italic uppercase tracking-widest text-sm">
          Caricamento Tabellone...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-48 font-sans">
      <header className="text-center mb-10 mt-4">
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter drop-shadow-2xl">
          Fase Finale
        </h1>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 italic border-t border-slate-900 pt-2 inline-block">
          {isExpired ? '🔒 Pronostici Chiusi' : 'Disegna il tuo Mondiale'}
        </p>
      </header>

      <div className={`max-w-4xl mx-auto space-y-12 ${isExpired ? 'opacity-60 pointer-events-none' : ''}`}>
        {STAGES.map((stage) => (
          <section key={stage.id} className="relative">
            <div className="flex items-center gap-3 mb-6">
               <span className="bg-yellow-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded italic">
                 {stage.pts}PT
               </span>
               <h2 className="text-lg font-black text-white uppercase italic tracking-tight">
                 {stage.label}
               </h2>
               <div className="flex-1 h-[1px] bg-gradient-to-r from-slate-800 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: stage.count }).map((_, i) => {
                const alreadySelected = getSelectedInStage(stage.id, i);
                const currentSelection = selections[`${stage.id}-${i}`];

                return (
                  <div key={i} className="group relative">
                    <select
                      disabled={isExpired}
                      className={`w-full bg-slate-900/50 border-2 rounded-2xl p-3.5 text-[10px] font-black uppercase transition-all appearance-none focus:outline-none 
                        ${currentSelection 
                          ? 'border-blue-500/40 text-white pr-10' 
                          : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      onChange={(e) => handleSelect(stage.id, i, e.target.value)}
                      value={currentSelection || ""}
                    >
                      <option value="">Scegli Squadra</option>
                      {TEAMS.map(t => {
                        // Nasconde la squadra se già scelta in un altro slot della stessa fase
                        if (alreadySelected.includes(t)) return null;
                        return (
                          <option key={t} value={t} className="bg-slate-950 text-white">
                            {t}
                          </option>
                        );
                      })}
                    </select>

                    {/* TASTO RESET RAPIDO (X) */}
                    {currentSelection && !isExpired && (
                      <button
                        onClick={() => handleSelect(stage.id, i, "")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 hover:text-red-500 text-slate-400 rounded-xl transition-all border border-slate-700 z-10"
                      >
                        <span className="text-[14px] leading-none">×</span>
                      </button>
                    )}

                    {/* FRECCIETTA DROPDOWN */}
                    {!currentSelection && !isExpired && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-slate-600 group-focus-within:text-yellow-500 transition-colors">
                        ▼
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* FOOTER BUTTON */}
      <div className="fixed bottom-24 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none">
        <button 
          onClick={saveBracket}
          disabled={loading || isExpired}
          className={`group max-w-xs w-full font-black py-4 rounded-2xl uppercase text-[11px] italic flex items-center justify-center gap-3 transition-all tracking-[0.2em] shadow-2xl pointer-events-auto
            ${isExpired 
              ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed' 
              : 'bg-yellow-500 text-slate-950 hover:scale-105 active:scale-95 hover:bg-yellow-400'
            }`}
        >
          {loading ? 'Salvataggio...' : isExpired ? 'Giocate Concluse' : 'Salva Tabellone'}
          {!loading && !isExpired && <span className="group-hover:translate-x-1 transition-transform">🏆</span>}
        </button>
      </div>
    </main>
  );
}