'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    groups: 0,
    bracket: 0,
    bonus: 0,
    rank: '--',
    isPaid: false,
  });
  const router = useRouter();

  const ADMIN_EMAIL = 'ricky@mondiale.it';

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Recupero dati freschi dal DB per riflettere il ricalcolo della classifica
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile({
          ...user,
          username: profile.username || 'Guerriero',
        });

        setStats({
          total: profile.points || 0,
          groups: profile.points_groups || 0,
          bracket: profile.points_bracket || 0,
          bonus: profile.points_bonus || 0,
          rank: profile.ranking || '--', // Corretto da .rank a .ranking
          isPaid: profile.is_paid || false,
        });
      }
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fakeEmail = `${username.trim().toLowerCase()}@mondiale.it`;

    if (isRegistering) {
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
      });

      if (error) {
        toast.error('Username già occupato o password troppo corta');
      } else if (data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            username: username,
            points: 0,
            points_groups: 0,
            points_bracket: 0,
            points_bonus: 0,
            ranking: null,
            is_paid: false,
          },
        ]);
        toast.success('Benvenuto nel Mondiale!');
        window.location.reload();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });
      if (error) {
        toast.error('Nome o Password errati');
      } else {
        window.location.reload();
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    router.push('/');
    window.location.reload();
  };

  const checkIsAdmin = () => {
    if (!userProfile) return false;
    const isEmailAdmin =
      userProfile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const isUsernameAdmin = userProfile.username?.toLowerCase() === 'ricky';
    return isEmailAdmin || isUsernameAdmin;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-32 flex items-start justify-center overflow-y-auto font-sans">
      <div className="max-w-md w-full mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {userProfile ? (
          <div className="space-y-6">
            {/* SCHEDA PROFILO */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-4 right-4">
                {checkIsAdmin() && (
                  <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-2 py-1 rounded-full border border-red-500/20 uppercase tracking-widest">
                    Admin
                  </span>
                )}
              </div>

              <div className="w-20 h-20 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-950 text-3xl font-black border-4 border-slate-800 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                {userProfile.username.charAt(0).toUpperCase()}
              </div>

              <h1 className="text-2xl font-black uppercase italic tracking-tighter">
                {userProfile.username}
              </h1>

              <div className="mt-2 flex justify-center">
                {stats.isPaid ? (
                  <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                    Quota Versata ✓
                  </span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-500 text-[8px] font-black px-3 py-1 rounded-full border border-rose-500/20 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                    Quota Mancante ✘
                  </span>
                )}
              </div>
            </div>

            {/* BOX PUNTEGGIO TOTALE */}
            <div className="bg-yellow-500 p-6 rounded-[2rem] flex items-center justify-between shadow-lg shadow-yellow-500/20">
              <div>
                <p className="text-[9px] font-black text-slate-950 uppercase tracking-widest italic">
                  Punteggio Totale
                </p>
                <p className="text-5xl font-black text-slate-950 tracking-tighter">
                  {stats.total}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-950/60 uppercase tracking-widest italic">
                  Ranking
                </p>
                <p className="text-2xl font-black text-slate-950">
                  #{stats.rank}
                </p>
              </div>
            </div>

            {/* GRIGLIA DETTAGLIO PUNTI */}
            <div className="space-y-3">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">
                Dettaglio Punteggi
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1 tracking-widest leading-none">
                    Gironi
                  </p>
                  <p className="text-xl font-black text-white">
                    {stats.groups}
                  </p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1 tracking-widest leading-none">
                    Tabellone
                  </p>
                  <p className="text-xl font-black text-white">
                    {stats.bracket}
                  </p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1 tracking-widest leading-none">
                    Bonus
                  </p>
                  <p className="text-xl font-black text-white">{stats.bonus}</p>
                </div>
              </div>
            </div>

            {/* AZIONI DI GIOCO */}
            <div className="space-y-3 pt-6 border-t border-slate-900">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">
                Gestisci Pronostici
              </h2>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => router.push('/matches')}
                  className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Fase a Gironi ⚽
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/bracket')}
                    className="py-4 bg-slate-900 border border-slate-800 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] hover:border-yellow-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Fase Finale 🏆
                  </button>
                  <button
                    onClick={() => router.push('/bonus')}
                    className="py-4 bg-slate-900 border border-slate-800 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] hover:border-yellow-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Super Bonus ⭐
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  onClick={() => router.push('/leaderboard')}
                  className="w-full py-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-yellow-500 hover:text-slate-950 transition-all"
                >
                  Classifica 🥇
                </button>

                {checkIsAdmin() && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-center py-4 bg-red-600/10 text-red-500 border border-red-600/20 font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all"
                  >
                    ⚙️ Pannello Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full py-4 text-slate-600 font-black rounded-2xl uppercase tracking-[0.2em] text-[8px] hover:text-rose-500 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* FORM LOGIN/REGISTRAZIONE */
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter">
                {isRegistering ? 'Iscriviti' : 'Bentornato'}
              </h1>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">
                World Cup 2026 Access
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="text"
                placeholder="USERNAME"
                className="w-full p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl focus:border-yellow-500 outline-none text-white font-black text-xs uppercase"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="PASSWORD"
                className="w-full p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl focus:border-yellow-500 outline-none text-white font-black text-xs uppercase"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-yellow-500 text-slate-950 font-black rounded-2xl hover:bg-yellow-400 transition-all uppercase tracking-widest text-xs mt-4 active:scale-95 shadow-xl shadow-yellow-500/10"
              >
                {loading
                  ? 'Sincronizzazione...'
                  : isRegistering
                  ? 'Crea Account'
                  : 'Entra in Gioco'}
              </button>
            </form>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full mt-8 text-[9px] font-black text-slate-500 hover:text-yellow-500 transition-colors uppercase tracking-widest italic text-center"
            >
              {isRegistering
                ? 'Hai già un account? Accedi'
                : 'Nuovo giocatore? Registrati'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
