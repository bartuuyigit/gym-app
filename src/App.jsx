import React, { useState, useMemo } from 'react';
import { translations } from './data/translations';
import Icons from './components/Icons';

// Firebase sayfalarımız
import OwnerLogin from './pages/OwnerLogin';
import MemberLogin from './pages/MemberLogin';
import OwnerDashboard from './pages/OwnerDashboard';
import MemberDashboard from './pages/MemberDashboard';

export default function App() {
  const [view, setView] = useState('landing');
  const [activeMemberId, setActiveMemberId] = useState(null);
  
  // Dil Durumu (State)
  const [lang, setLang] = useState('tr');
  const t = useMemo(() => translations[lang], [lang]);

  const toggleLanguage = () => {
    setLang(prevLang => prevLang === 'tr' ? 'en' : 'tr');
  };

  // Dil değiştirme butonu (Sabit ve Erişilebilir)
  const LanguageToggle = () => (
    <button 
      onClick={toggleLanguage}
      aria-label="Dil Değiştir / Change Language"
      className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-[#e9ebe6] text-[#061414] px-4 py-2 rounded-full font-bold border border-[#d2d3ce] hover:bg-[#bcff00] hover:border-[#bcff00] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#061414]"
    >
      <Icons.Globe /> {lang === 'tr' ? 'EN' : 'TR'}
    </button>
  );

  // Yönlendirme (Routing) - Her sayfaya "t" (dil çevirilerini) gönderiyoruz
  if (view === 'owner-login') return (
    <>
      <LanguageToggle />
      <OwnerLogin onLogin={() => setView('owner-dashboard')} onBack={() => setView('landing')} t={t} />
    </>
  );
  
  if (view === 'member-login') return (
    <>
      <LanguageToggle />
      <MemberLogin onLogin={(id) => { setActiveMemberId(id); setView('member-dashboard'); }} onBack={() => setView('landing')} t={t} />
    </>
  );
  
  if (view === 'owner-dashboard') return (
    <>
      <LanguageToggle />
      <OwnerDashboard onLogout={() => setView('landing')} t={t} />
    </>
  );
  
  if (view === 'member-dashboard' && activeMemberId) return (
    <>
      <LanguageToggle />
      <MemberDashboard memberId={activeMemberId} onLogout={() => { setActiveMemberId(null); setView('landing'); }} t={t} />
    </>
  );

  // ANA SAYFA (LANDING PAGE) - TabIndex ve Erişilebilirlik Eklendi
  return (
    <div className="min-h-screen bg-[#061414] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <LanguageToggle />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#bcff00] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>
      
      <div className="text-center z-10 mb-12" tabIndex={0}>
        <div className="flex justify-center mb-6 text-[#bcff00]"><Icons.Dumbbell /></div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4">GymFlow</h1>
        <p className="text-xl text-[#96998c]">{t.gymflowDesc}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl z-10">
        <button 
          onClick={() => setView('owner-login')} 
          aria-label={t.owner}
          className="bg-[#e9ebe6] p-8 rounded-3xl border border-[#d2d3ce] text-left hover:scale-105 transition-transform duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#bcff00] group"
        >
          <div className="w-12 h-12 bg-[#061414] rounded-xl flex items-center justify-center text-[#bcff00] mb-6 group-hover:bg-[#bcff00] group-hover:text-[#061414] transition-colors"><Icons.Dashboard /></div>
          <h2 className="text-2xl font-black text-[#061414] mb-2">{t.owner}</h2>
          <p className="text-[#96998c] font-medium">{t.ownerDesc}</p>
        </button>

        <button 
          onClick={() => setView('member-login')} 
          aria-label={t.member}
          className="bg-[#061414] p-8 rounded-3xl border border-[#96998c]/30 text-left hover:scale-105 transition-transform duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#bcff00] group"
        >
          <div className="w-12 h-12 bg-[#bcff00] rounded-xl flex items-center justify-center text-[#061414] mb-6"><Icons.User /></div>
          <h2 className="text-2xl font-black text-white mb-2">{t.member}</h2>
          <p className="text-[#96998c] font-medium">{t.memberDesc}</p>
        </button>
      </div>
    </div>
  );
}