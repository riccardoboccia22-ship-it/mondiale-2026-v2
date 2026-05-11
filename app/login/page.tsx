'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile({ ...user, username: profile.username || 'Guerriero' });
        setStats({
          total: profile.points || 0,
          groups: profile.points_groups || 0,
          bracket: profile.points_bracket || 0,
          bonus: profile.points_bonus || 0,
          rank: profile.ranking || '--',
          isPaid: profile.is_paid || false,
        });
      }
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // FIX: Rimuoviamo gli spazi vuoti dall'username per creare una email finta valida per Supabase
    const safeUsernameForEmail = username.trim().toLowerCase().replace(/\s+/g, '');
    const fakeEmail = `${safeUsernameForEmail}@mondiale.it`;

    if (isRegistering) {
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
      });

      if (error) {
        toast.error('Errore: Username occupato o password troppo corta');
      } else if (data.user) {
        await supabase.from('profiles').insert([{
          id: data.user.id,
          username: username.trim(), // Salviamo il vero nome con gli spazi se ci sono
          points: 0,
          points_groups: 0,
          points_bracket: 0,
          points_bonus: 0,
          is_paid: false,
        }]);
        toast.success('Registrazione completata!');
        router.refresh();
        window.location.reload();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });
      if (error) toast.error('Credenziali errate');
      else {
        router.refresh();
        window.location.reload();
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    window.location.reload();
  };

  const checkIsAdmin = () => {
    if (!userProfile) return false;
    return userProfile.email?.toLowerCase() === ADMIN_EMAIL || userProfile.username?.toLowerCase() === 'ricky';
  };

  const copyPaymentInfo = () => {
    navigator.clipboard.writeText("Quota Mondiale 2026 - Contattare Ricky per saldo");
    toast.success("Info pagamento copiate!");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-32 flex items-start justify-center font-sans">
      <div className="max-w-md w-full mt-4">
        {userProfile ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* CARD PROFILO SUPERIORE */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] text-center relative shadow-2xl">
              <div className="w-20 h-20 bg-gradient-to-tr from-yellow-600 to-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-950 text-3xl font-black border-4 border-slate-800 shadow-xl">
                {userProfile.username.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter">{userProfile.username}</h1>
              
              <div className="mt-4 flex justify-center">
                {stats.isPaid ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-4 py-1.5 rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center gap-2">
                    Quota Versata ✓
                  </span>
                ) : (
                  <button onClick={copyPaymentInfo} className="bg-rose-500/10 text-rose-500 text-[9px] font-black px-4 py-1.5 rounded-full border border-rose-500/20 uppercase tracking-widest animate-pulse hover:bg-rose-500 hover:text-white transition-all">
                    Quota Mancante ✘
                  </button>
                )}
              </div>
            </div>

            {/* BOX PUNTEGGIO E RANKING */}
            <div className="bg-yellow-500 p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-yellow-500/10">
              <div>
                <p className="text-[10px] font-black text-slate-950 uppercase tracking-widest opacity-70 italic">Punti Totali</p>
                <p className="text-6xl font-black text-slate-950 tracking-tighter leading-none">{stats.total}</p>
              </div>
              <div className="text-right bg-slate-950/10 p-4 rounded-3xl">
                <p className="text-[9px] font-black text-slate-950/60 uppercase tracking-widest">Ranking</p>
                <p className="text-3xl font-black text-slate-950 leading-none">#{stats.rank}</p>
              </div>
            </div>

            {/* GRIGLIA DETTAGLI */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Gironi', val: stats.groups },
                { label: 'Fase Finale', val: stats.bracket },
                { label: 'Bonus', val: stats.bonus }
              ].map((s) => (
                <div key={s.label} className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl text-center shadow-lg">
                  <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1">{s.label}</p>
                  <p className="text-xl font-black text-white">{s.val}</p>
                </div>
              ))}
            </div>

            {/* AZIONI DI GIOCO */}
            <div className="space-y-3 pt-6 border-t border-slate-900">
              <button onClick={() => router.push('/matches')} className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-xl">
                Fase a Gironi ⚽
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => router.push('/bracket')} className="py-4 bg-slate-900 border border-slate-800 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] hover:border-yellow-500/50 transition-all shadow-md">
                  Fase Finale 🏆
                </button>
                <button onClick={() => router.push('/bonus')} className="py-4 bg-slate-900 border border-slate-800 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] hover:border-yellow-500/50 transition-all shadow-md">
                  Super Bonus ⭐
                </button>
              </div>
              <button onClick={() => router.push('/leaderboard')} className="w-full py-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-yellow-500 hover:text-slate-950 transition-all">
                Classifica 🥇
              </button>
              {checkIsAdmin() && (
                <Link href="/admin" className="w-full flex items-center justify-center py-4 bg-red-600/10 text-red-500 border border-red-600/20 font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all">
                  ⚙️ Pannello Admin
                </Link>
              )}
              <button onClick={handleLogout} className="w-full py-4 text-slate-600 font-black rounded-2xl uppercase tracking-[0.2em] text-[8px] hover:text-rose-500 transition-all">
                Esci dal Gioco
              </button>
            </div>
          </div>
        ) : (
          /* FORM LOGIN/REGISTRAZIONE */
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-yellow-500 uppercase italic">
                {isRegistering ? 'Iscriviti' : 'Entra'}
              </h1>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">World Cup 2026 Access</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="text" placeholder="USERNAME" className="w-full p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl focus:border-yellow-500 outline-none text-white font-black text-xs uppercase" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder="PASSWORD" className="w-full p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl focus:border-yellow-500 outline-none text-white font-black text-xs uppercase" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" disabled={loading} className="w-full py-5 bg-yellow-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs mt-4 active:scale-95 shadow-xl shadow-yellow-500/10 transition-all">
                {loading ? 'Sincronizzazione...' : isRegistering ? 'Crea Account' : 'Inizia a Giocare'}
              </button>
            </form>
            <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-8 text-[9px] font-black text-slate-500 hover:text-yellow-500 transition-colors uppercase tracking-widest italic text-center">
              {isRegistering ? 'Hai già un account? Accedi' : 'Nuovo giocatore? Registrati'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}