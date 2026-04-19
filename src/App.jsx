import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import OwnerLogin from './pages/OwnerLogin';
import MemberLogin from './pages/MemberLogin';
import OwnerDashboard from './pages/OwnerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import { translations } from './data/translations';

function App() {
  const [lang, setLang] = useState('tr');
  const [view, setView] = useState('landing');
  const [memberId, setMemberId] = useState(null);

  const t = translations[lang];

  // SAYFA YÜKLENDİĞİNDE OTURUMU KONTROL ET (F5 Çözümü)
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedMemberId = localStorage.getItem('memberId');

    if (savedRole === 'owner') {
      setView('ownerDashboard');
    } else if (savedRole === 'member' && savedMemberId) {
      setMemberId(savedMemberId);
      setView('memberDashboard');
    }
  }, []);

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

  // ÇIKIŞ YAPTIĞINDA (Hafızayı Temizle)
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
