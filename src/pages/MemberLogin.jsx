import React, { useState } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';

export default function MemberLogin({ onLogin, onBack, t }) {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' veya 'phone'
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);

    try {
      // Girilen bilgiye göre (Email veya Telefon) veritabanında arama yap
      const { data, error } = await supabase
        .from('members')
        .select('id, name')
        .eq(loginMethod, inputValue.trim())
        .single(); // Sadece 1 eşleşme bekliyoruz

      if (error || !data) {
        alert("❌ Girilen bilgilere ait bir kullanıcı bulunamadı!");
      } else {
        // Kullanıcı bulunduysa ID'sini ana App'e gönder ve giriş yap
        onLogin(data.id);
      }
    } catch (err) {
      alert("❌ Girilen bilgilere ait bir kullanıcı bulunamadı!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061414] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#bcff00] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
      
      <div className="bg-[#e9ebe6] p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-[#d2d3ce]">
        <div className="flex justify-center mb-6 text-[#061414]"><Icons.User /></div>
        <h2 className="text-3xl font-extrabold text-[#061414] mb-2 text-center">{t.memberLogin}</h2>
        <p className="text-[#96998c] text-center mb-8">E-posta veya telefon numaranızla giriş yapın.</p>
        
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          
          {/* Giriş Yöntemi Seçimi */}
          <div className="flex bg-[#d2d3ce]/30 p-1 rounded-xl">
            <button 
              type="button"
              onClick={() => { setLoginMethod('email'); setInputValue(''); }}
              className={`flex-1 py-2 font-bold rounded-lg transition-all ${loginMethod === 'email' ? 'bg-white text-[#061414] shadow-sm' : 'text-[#96998c] hover:text-[#061414]'}`}
            >
              {t.email}
            </button>
            <button 
              type="button"
              onClick={() => { setLoginMethod('phone'); setInputValue(''); }}
              className={`flex-1 py-2 font-bold rounded-lg transition-all ${loginMethod === 'phone' ? 'bg-white text-[#061414] shadow-sm' : 'text-[#96998c] hover:text-[#061414]'}`}
            >
              Telefon
            </button>
          </div>

          {/* Dinamik Input Alanı */}
          <div>
            <label className="block text-sm font-bold text-[#061414] mb-2">
              {loginMethod === 'email' ? t.email : 'Telefon Numarası'}
            </label>
            <input 
              type={loginMethod === 'email' ? 'email' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={loginMethod === 'email' ? 'ornek@mail.com' : '0555...'}
              className="block w-full rounded-xl border-[#d2d3ce] bg-white p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bcff00] transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !inputValue} 
            className={`w-full font-extrabold py-4 px-4 rounded-xl transition-all shadow-lg shadow-[#bcff00]/10 ${inputValue && !isLoading ? 'bg-[#061414] text-[#bcff00] hover:bg-black hover:-translate-y-0.5' : 'bg-[#d2d3ce] text-[#96998c] cursor-not-allowed'}`}
          >
            {isLoading ? 'Kontrol Ediliyor...' : t.loginBtn}
          </button>
          
          <button 
            type="button"
            onClick={onBack} 
            className="w-full text-[#96998c] font-bold p-3 mt-2 hover:bg-[#d2d3ce] hover:text-[#061414] rounded-xl transition-colors"
          >
            {t.goBack}
          </button>
        </form>
      </div>
    </div>
  );
}