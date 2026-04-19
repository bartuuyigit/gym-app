import React, { useState } from 'react';
import Icons from '../components/Icons';

export default function OwnerLogin({ onLogin, onBack, t }) {
  // Giriş bilgilerini tuttuğumuz state'ler
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // BURADAN KENDİ YÖNETİCİ GİRİŞ BİLGİLERİNİ BELİRLEYEBİLİRSİN!
    const ADMIN_EMAIL = "admin@gym.com";
    const ADMIN_PASS = "1234";

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      onLogin(); // Bilgiler doğruysa paneli aç
    } else {
      alert("Hatalı E-posta veya Şifre girdiniz!"); // Yanlışsa uyarı ver
    }
  };

  return (
    <div className="min-h-screen bg-[#061414] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#bcff00] rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none"></div>
      
      <div className="bg-[#e9ebe6] p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-[#d2d3ce]">
        <div className="flex justify-center mb-6 text-[#061414]"><Icons.Dumbbell /></div>
        <h2 className="text-3xl font-extrabold text-[#061414] mb-2 text-center">{t.ownerLogin}</h2>
        <p className="text-[#96998c] text-center mb-8">{t.ownerLoginDesc}</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#061414] mb-1">{t.email}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gymflow.com" 
              className="block w-full rounded-xl border-[#d2d3ce] bg-white p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bcff00]" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#061414] mb-1">{t.password}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******" 
              className="block w-full rounded-xl border-[#d2d3ce] bg-white p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bcff00]" 
              required
            />
          </div>
          <button type="submit" className="w-full bg-[#bcff00] text-[#061414] font-extrabold py-3 px-4 rounded-xl hover:bg-[#a6e000] hover:-translate-y-0.5 transition-all mt-4">
            {t.loginBtn}
          </button>
          <button type="button" onClick={onBack} className="w-full text-[#96998c] font-bold p-3 mt-2 hover:bg-[#d2d3ce] hover:text-[#061414] rounded-xl transition-colors">
            {t.goBack}
          </button>
        </form>
      </div>
    </div>
  );
}