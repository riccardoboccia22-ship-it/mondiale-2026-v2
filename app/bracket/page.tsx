'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ChevronDown, X, Trophy, ShieldCheck, Trash2, Map } from 'lucide-react';

// CONFIGURAZIONE DATA INIZIO MONDIALE
const WORLD_CUP_START_DATE = new Date('2026-06-11T21:00:00+02:00');

const STAGES = [
  { id: 'R32', label: 'Sedicesimi', count: 32, pts: 2 },
  { id: 'R16', label: 'Ottavi', count: 16, pts: 4 },
  { id: 'QF', label: 'Quarti', count: 8, pts: 6 },
  { id: 'SF', label: 'Semifinali', count: 4, pts: 8 },
  { id: 'F', label: 'Finale', count: 2, pts: 10 },
  { id: 'WINNER', label: 'Vincitore Mondiale', count: 1, pts: 20 },
];

const TEAMS_2026 = [
  'Algeria',
  'Arabia Saudita',
  'Argentina',
  'Australia',
  'Austria',
  'Belgio',
  'Bosnia ed Erzegovina',
  'Brasile',
  'Canada',
  'Capo Verde',
  'Colombia',
  'Corea del Sud',
  "Costa d'Avorio",
  'Croazia',
  'Curaçao',
  'Ecuador',
  'Egitto',
  'Francia',
  'Germania',
  'Ghana',
  'Giappone',
  'Giordania',
  'Haiti',
  'Inghilterra',
  'Iran',
  'Iraq',
  'Marocco',
  'Messico',
  'Norvegia',
  'Nuova Zelanda',
  'Olanda',
  'Panama',
  'Paraguay',
  'Portogallo',
  'Qatar',
  'Repubblica Ceca',
  'Repubblica Democratica del Congo',
  'Scozia',
  'Senegal',
  'Spagna',
  'Stati Uniti',
  'Sudafrica',
  'Svezia',
  'Svizzera',
  'Tunisia',
  'Turchia',
  'Uruguay',
  'Uzbekistan',
].sort();

// Mappa bandiere sincronizzata
const flagMap: { [key: string]: string } = {
  algeria: 'dz',
  'arabia saudita': 'sa',
  argentina: 'ar',
  australia: 'au',
  austria: 'at',
  belgio: 'be',
  'bosnia ed erzegovina': 'ba',
  brasile: 'br',
  canada: 'ca',
  'capo verde': 'cv',
  colombia: 'co',
  'corea del sud': 'kr',
  "costa d'avorio": 'ci',
  croazia: 'hr',
  curaçao: 'cw',
  ecuador: 'ec',
  egitto: 'eg',
  francia: 'fr',
  germania: 'de',
  ghana: 'gh',
  giappone: 'jp',
  giordania: 'jo',
  haiti: 'ht',
  inghilterra: 'gb-eng',
  iran: 'ir',
  iraq: 'iq',
  marocco: 'ma',
  messico: 'mx',
  norvegia: 'no',
  'nuova zelanda': 'nz',
  olanda: 'nl',
  panama: 'pa',
  paraguay: 'py',
  portogallo: 'pt',
  qatar: 'qa',
  'repubblica ceca': 'cz',
  'repubblica democratica del congo': 'cd',
  scozia: 'gb-sct',
  senegal: 'sn',
  spagna: 'es',
  'stati uniti': 'us',
  usa: 'us',
  sudafrica: 'za',
  svezia: 'se',
  svizzera: 'ch',
  tunisia: 'tn',
  turchia: 'tr',
  uruguay: 'uy',
  uzbekistan: 'uz',
};

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      toast.error('Errore caricamento');
    } finally {
      setFetching(false);
    }
  }

  const getFlag = (team: string) => {
    const code = flagMap[team?.toLowerCase().trim()];
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
  };

  const handleSelect = (stage: string, index: number, team: string) => {
    if (isExpired) return;
    setSelections((prev: any) => ({ ...prev, [`${stage}-${index}`]: team }));
  };

  const resetBracket = async () => {
    if (isExpired) return;
    if (
      window.confirm(
        'Sei sicuro di voler svuotare e cancellare tutto il tabellone?'
      )
    ) {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Utente non trovato');

        const { error } = await supabase
          .from('brackets')
          .delete()
          .eq('user_id', user.id);
        if (error) throw error;

        setSelections({});
        toast.success('Tabellone azzerato e salvato!', { icon: '🧹' });
      } catch (error: any) {
        toast.error("Errore durante l'azzeramento");
      } finally {
        setLoading(false);
      }
    }
  };

  const saveBracket = async () => {
    if (isExpired) return toast.error('Le giocate sono chiuse!');
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non trovato');

      const rows = Object.entries(selections)
        .filter(([_, t]) => t !== '' && t !== null)
        .map(([k, t]) => ({
          user_id: user.id,
          stage: k.split('-')[0],
          team_name: t,
        }));

      if (rows.length === 0) {
        toast.error(
          'Seleziona almeno una squadra! Usa il cestino per svuotare tutto.'
        );
        setLoading(false);
        return;
      }

      await supabase.from('brackets').delete().eq('user_id', user.id);

      const { error } = await supabase.from('brackets').insert(rows);
      if (error) throw error;

      toast.success('Tabellone salvato! 🏆');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedInStage = (stageId: string, currentIndex: number) => {
    return Object.entries(selections)
      .filter(
        ([key, value]) =>
          key.startsWith(`${stageId}-`) && key !== `${stageId}-${currentIndex}`
      )
      .map(([_, value]) => value);
  };

  if (fetching)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-black animate-pulse italic uppercase">
        Disegno Tabellone...
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 pb-48 font-sans">
      <header className="text-center mb-10 pt-4 flex flex-col items-center">
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter shadow-yellow-500/10">
          Fase Finale
        </h1>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 italic">
          {isExpired
            ? '🔒 Pronostici Conclusi'
            : 'Dalla fase a eliminazione al Titolo'}
        </p>
        {/* Pulsante consultazione Gironi Ufficiali */}
        <Link
          href="/groups"
          className="mt-5 inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600/30 active:scale-95 shadow-lg"
        >
          <Map size={14} /> Consulta i Gironi Ufficiali
        </Link>
      </header>

      <div
        className={`max-w-4xl mx-auto space-y-12 ${
          isExpired ? 'opacity-70 pointer-events-none' : ''
        }`}
      >
        {STAGES.map((stage) => (
          <section key={stage.id} className="relative">
            <div className="flex items-center gap-3 mb-6 px-2">
              <span className="bg-yellow-500 text-slate-950 text-[9px] font-black px-2 py-1 rounded italic flex items-center gap-1">
                <ShieldCheck size={10} strokeWidth={3} /> {stage.pts} PT
              </span>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">
                {stage.label}
              </h2>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-slate-800 to-transparent"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {Array.from({ length: stage.count }).map((_, i) => {
                const alreadySelected = getSelectedInStage(stage.id, i);
                const currentSelection = selections[`${stage.id}-${i}`];

                return (
                  <div key={i} className="group relative">
                    <div
                      className={`absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all ${
                        currentSelection
                          ? 'scale-110 opacity-100'
                          : 'opacity-30'
                      }`}
                    >
                      {currentSelection ? (
                        <img
                          src={getFlag(currentSelection as string)!}
                          className="w-5 sm:w-6 h-auto rounded-sm shadow-sm"
                          alt=""
                        />
                      ) : (
                        <ShieldCheck className="text-slate-600 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>

                    <select
                      disabled={isExpired}
                      className={`w-full bg-slate-900 border-2 rounded-xl sm:rounded-2xl py-3 pl-9 pr-6 sm:p-4 sm:pl-12 text-[8.5px] sm:text-[11px] font-black uppercase transition-all appearance-none outline-none truncate
                        ${
                          currentSelection
                            ? 'border-yellow-500/40 text-yellow-500 shadow-lg shadow-yellow-500/5'
                            : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      onChange={(e) =>
                        handleSelect(stage.id, i, e.target.value)
                      }
                      value={currentSelection || ''}
                    >
                      <option value="">Scegli</option>
                      {TEAMS_2026.map((t) => {
                        if (alreadySelected.includes(t)) return null;
                        return (
                          <option
                            key={t}
                            value={t}
                            className="bg-slate-950 text-white"
                          >
                            {t}
                          </option>
                        );
                      })}
                    </select>

                    <div className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                      {currentSelection && !isExpired ? (
                        <button
                          onClick={() => handleSelect(stage.id, i, '')}
                          className="pointer-events-auto p-1 sm:p-1.5 bg-slate-800 rounded-lg hover:bg-rose-500 transition-colors"
                        >
                          <X className="text-white w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      ) : (
                        <ChevronDown className="text-slate-600 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-24 left-0 right-0 p-4 sm:p-6 flex justify-center items-center gap-2 sm:gap-3 z-50 pointer-events-none">
        {!isExpired && (
          <button
            onClick={resetBracket}
            disabled={loading}
            title="Svuota Tabellone"
            className="pointer-events-auto flex items-center justify-center p-4 sm:p-5 bg-slate-900 border-2 border-slate-800 rounded-xl sm:rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 shadow-xl"
          >
            <Trash2 size={18} />
          </button>
        )}

        <button
          onClick={saveBracket}
          disabled={loading || isExpired}
          className={`max-w-[240px] sm:max-w-xs w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs italic flex items-center justify-center gap-2 sm:gap-3 transition-all tracking-[0.1em] sm:tracking-[0.2em] shadow-2xl pointer-events-auto
            ${
              isExpired
                ? 'bg-slate-900 text-slate-700 border border-slate-800'
                : 'bg-yellow-500 text-slate-950 hover:scale-105 active:scale-95 shadow-yellow-500/30'
            }`}
        >
          {loading
            ? 'Salvataggio...'
            : isExpired
            ? 'Pronostici Chiusi'
            : 'Salva Tabellone 🏆'}
        </button>
      </div>
    </main>
  );
}
