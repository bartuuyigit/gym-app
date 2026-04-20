import React, { useState } from 'react';
import Icons from '../components/Icons';

export default function LandingPage({ onSelectRole, t, lang, setLang }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#e9ebe6] flex flex-col items-center p-6 md:p-10 relative overflow-x-hidden">
      
      {/* Arka Plan Dekorasyonları (Neon Yansımalar - Fotoğraf Değil) */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#bcff00] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-[#061414] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-6xl relative z-20">
        
        {/* ÜST BAR: Dil Seçimi */}
        <div className="flex justify-end mb-12">
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-[#d2d3ce] shadow-sm">
            <button onClick={() => setLang('tr')} className={`px-5 py-2 rounded-xl font-black transition-all ${lang === 'tr' ? 'bg-[#061414] text-[#bcff00] shadow-md' : 'text-[#96998c] hover:text-[#061414]'}`}>TR</button>
            <button onClick={() => setLang('en')} className={`px-5 py-2 rounded-xl font-black transition-all ${lang === 'en' ? 'bg-[#061414] text-[#bcff00] shadow-md' : 'text-[#96998c] hover:text-[#061414]'}`}>EN</button>
          </div>
        </div>

        {/* ANA BAŞLIK ALANI */}
        <div className="flex flex-col items-center mb-20 text-center">
          <div className="bg-[#061414] text-[#bcff00] p-6 rounded-[2rem] shadow-2xl mb-8 transform hover:rotate-12 transition-transform duration-500">
            <Icons.Dumbbell />
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-[#061414] tracking-tighter mb-6 drop-shadow-sm">GymFlow</h1>
          <p className="text-[#96998c] font-black text-xl md:text-3xl max-w-2xl leading-relaxed">{t.gymflowDesc}</p>
        </div>

        {/* GİRİŞ KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <button onClick={() => onSelectRole('owner')} className="group bg-[#061414] p-10 rounded-[3rem] text-left transition-all hover:-translate-y-2 hover:shadow-2xl shadow-xl border-2 border-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bcff00] opacity-10 rounded-bl-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="text-[#bcff00] mb-6 transform group-hover:scale-110 transition-transform origin-left"><Icons.Dashboard /></div>
            <h3 className="text-3xl font-black text-white mb-4 relative z-10">{t.owner}</h3>
            <p className="text-gray-400 font-bold leading-relaxed relative z-10">{t.ownerDesc}</p>
            <div className="mt-8 flex items-center gap-2 text-[#bcff00] font-black uppercase text-sm tracking-widest relative z-10">{t.loginBtn} &rarr;</div>
          </button>

          <button onClick={() => onSelectRole('member')} className="group bg-white p-10 rounded-[3rem] text-left border-2 border-[#d2d3ce] shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-[#bcff00] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#061414] opacity-5 rounded-bl-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="text-[#061414] mb-6 transform group-hover:scale-110 transition-transform origin-left"><Icons.User /></div>
            <h3 className="text-3xl font-black text-[#061414] mb-4 relative z-10">{t.member}</h3>
            <p className="text-[#96998c] font-bold leading-relaxed relative z-10">{t.memberDesc}</p>
            <div className="mt-8 flex items-center gap-2 text-[#061414] font-black uppercase text-sm tracking-widest relative z-10">{t.loginBtn} &rarr;</div>
          </button>
        </div>

        {/* SİSTEMİN ÖZELLİKLERİ (İkonlar ve Kartlarla Görselleştirilmiş) */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#061414] mb-4">{t.featuresTitle}</h2>
            <div className="w-24 h-2 bg-[#bcff00] rounded-full mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="bg-[#f8f9f7] border-2 border-[#d2d3ce] rounded-[3rem] p-10 relative overflow-hidden group hover:border-[#061414] transition-colors">
              <div className="absolute top-10 right-10 text-[#d2d3ce] opacity-30 group-hover:text-[#bcff00] transition-colors">
                <Icons.Chart />
              </div>
              <div className="w-20 h-20 bg-[#061414] text-[#bcff00] flex items-center justify-center rounded-3xl mb-8 shadow-xl transform group-hover:-rotate-6 transition-transform">
                <Icons.Chart />
              </div>
              <h3 className="text-3xl font-black text-[#061414] mb-6">{t.featOwnerTitle}</h3>
              <p className="text-[#96998c] font-bold text-lg leading-relaxed">{t.featOwnerDesc}</p>
            </div>

            <div className="bg-white border-2 border-[#bcff00] rounded-[3rem] p-10 shadow-xl shadow-[#bcff00]/10 relative overflow-hidden group">
              <div className="absolute top-10 right-10 text-[#e9ebe6] group-hover:text-[#bcff00]/30 transition-colors">
                <Icons.Calendar />
              </div>
              <div className="w-20 h-20 bg-[#bcff00] text-[#061414] flex items-center justify-center rounded-3xl mb-8 shadow-xl transform group-hover:rotate-6 transition-transform">
                <Icons.Calendar />
              </div>
              <h3 className="text-3xl font-black text-[#061414] mb-6">{t.featMemberTitle}</h3>
              <p className="text-[#96998c] font-bold text-lg leading-relaxed">{t.featMemberDesc}</p>
            </div>

          </div>
        </div>
      </div>

      {/* YÜZEN YARDIM BUTONU */}
      <button 
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#061414] text-[#bcff00] rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 border-2 border-[#bcff00] group"
      >
        <span className="font-black text-3xl group-hover:rotate-12 transition-transform">?</span>
      </button>

      {/* YARDIM MODALI */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsHelpOpen(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 md:p-14 relative z-10 shadow-2xl animate-fade-in-down border-2 border-[#bcff00]">
            
            <div className="w-20 h-20 bg-[#bcff00] text-[#061414] flex items-center justify-center rounded-[2rem] mb-8 shadow-lg font-black text-4xl">
              ?
            </div>
            
            <h2 className="text-4xl font-black text-[#061414] mb-6">{t.helpTitle}</h2>
            <div className="w-16 h-2 bg-[#061414] rounded-full mb-8"></div>
            <p className="text-[#96998c] font-bold leading-relaxed mb-10 text-xl">{t.helpDesc}</p>
            
            <button 
              onClick={() => setIsHelpOpen(false)}
              className="w-full bg-[#061414] text-[#bcff00] font-black text-xl py-5 rounded-[2rem] hover:bg-[#bcff00] hover:text-[#061414] transition-all shadow-lg border-2 border-transparent hover:border-[#061414]"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
