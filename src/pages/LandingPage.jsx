import React from 'react';
import Icons from '../components/Icons';

export default function LandingPage({ onSelectRole, t, lang, setLang }) {
  return (
    <div className="min-h-screen bg-[#e9ebe6] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Arka Plan Dekorasyonu */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#bcff00] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#061414] rounded-full mix-blend-multiply filter blur-[120px] opacity-5"></div>

      <div className="max-w-4xl w-full relative z-10 text-center">
        {/* Logo ve Dil Seçimi */}
        <div className="flex flex-col items-center mb-12">
          <div className="bg-[#061414] text-[#bcff00] p-4 rounded-[2rem] shadow-2xl mb-6">
            <Icons.Dumbbell />
          </div>
          <h1 className="text-6xl font-black text-[#061414] tracking-tighter mb-2">GymFlow</h1>
          <p className="text-[#96998c] font-bold text-lg">{t.gymflowDesc}</p>
          
          <div className="mt-6 flex bg-[#d2d3ce]/40 p-1 rounded-2xl">
            <button onClick={() => setLang('tr')} className={`px-6 py-2 rounded-xl font-black transition-all ${lang === 'tr' ? 'bg-white text-[#061414] shadow-sm' : 'text-[#96998c]'}`}>TR</button>
            <button onClick={() => setLang('en')} className={`px-6 py-2 rounded-xl font-black transition-all ${lang === 'en' ? 'bg-white text-[#061414] shadow-sm' : 'text-[#96998c]'}`}>EN</button>
          </div>
        </div>

        {/* Seçim Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Yönetici Kartı */}
          <button 
            onClick={() => onSelectRole('owner')}
            className="group bg-[#061414] p-10 rounded-[3rem] text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#bcff00]/10"
          >
            <div className="text-[#bcff00] mb-6 group-hover:scale-110 transition-transform duration-500">
              <Icons.Dashboard />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">{t.owner}</h3>
            <p className="text-gray-400 font-medium leading-relaxed">{t.ownerDesc}</p>
            <div className="mt-8 flex items-center gap-2 text-[#bcff00] font-black uppercase tracking-widest text-sm">
              {t.loginBtn} <Icons.Globe />
            </div>
          </button>

          {/* Üye Kartı */}
          <button 
            onClick={() => onSelectRole('member')}
            className="group bg-white p-10 rounded-[3rem] text-left border-2 border-[#d2d3ce] transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-[#bcff00]"
          >
            <div className="text-[#061414] mb-6 group-hover:scale-110 transition-transform duration-500">
              <Icons.User />
            </div>
            <h3 className="text-3xl font-black text-[#061414] mb-4">{t.member}</h3>
            <p className="text-[#96998c] font-medium leading-relaxed">{t.memberDesc}</p>
            <div className="mt-8 flex items-center gap-2 text-[#061414] font-black uppercase tracking-widest text-sm">
              {t.loginBtn} <Icons.Globe />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
