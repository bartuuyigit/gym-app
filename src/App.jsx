import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import OwnerLogin from './pages/OwnerLogin';
import MemberLogin from './pages/MemberLogin';
import OwnerDashboard from './pages/OwnerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import { translations } from './data/translations';

function App() {
  const [lang, setLang] = useState('tr');
  
  // BURASI KRİTİK: State'i doğrudan localStorage'dan başlatıyoruz
  const [view, setView] = useState(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole === 'owner') return 'ownerDashboard';
    if (savedRole === 'member') return 'memberDashboard';
    return 'landing';
  });

  const [memberId, setMemberId] = useState(() => {
    return localStorage.getItem('memberId') || null;
  });

  const t = translations[lang];

  // YÖNETİCİ GİRİŞ YAPTIĞINDA
  const handleOwnerLogin = () => {
    localStorage.setItem('userRole', 'owner');
    setView('ownerDashboard');
  };

  // ÜYE GİRİŞ YAPTIĞINDA
  const handleMemberLogin = (id) => {
    localStorage.setItem('userRole', 'member');
    localStorage.setItem('memberId', id);
    setMemberId(id);
    setView('memberDashboard');
  };

  // ÇIKIŞ YAPTIĞINDA
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('memberId');
    setMemberId(null);
    setView('landing');
  };

  return (
    <div className="font-sans antialiased text-slate-900">
      {view === 'landing' && (
        <LandingPage 
          onSelectRole={(role) => setView(role === 'owner' ? 'ownerLogin' : 'memberLogin')} 
          t={t} 
          lang={lang} 
          setLang={setLang} 
        />
      )}
      
      {view === 'ownerLogin' && (
        <OwnerLogin 
          onLogin={handleOwnerLogin} 
          onBack={() => setView('landing')} 
          t={t} 
        />
      )}
      
      {view === 'memberLogin' && (
        <MemberLogin 
          onLogin={handleMemberLogin} 
          onBack={() => setView('landing')} 
          t={t} 
        />
      )}
      
      {view === 'ownerDashboard' && (
        <OwnerDashboard 
          onLogout={handleLogout} 
          t={t} 
        />
      )}
      
      {view === 'memberDashboard' && (
        <MemberDashboard 
          memberId={memberId} 
          onLogout={handleLogout} 
          t={t} 
        />
      )}
    </div>
  );
}

export default App;
