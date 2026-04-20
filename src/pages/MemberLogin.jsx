import React, { useState } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';

export default function MemberLogin({ onLogin, onBack, t }) {
  const [method, setMethod] = useState('email');
  const [val, setVal] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('members').select('id').eq(method === 'email' ? 'email' : 'phone', val).single();
    if (data) onLogin(data.id);
    else alert(t.noCreditsMsg);
  };

  return (
    <div className="min-h-screen bg-[#061414] flex items-center justify-center p-4">
      <div className="bg-[#e9ebe6] p-8 rounded-[2rem] w-full max-w-md">
        <h2 className="text-3xl font-black text-[#061414] mb-2 text-center">{t.memberLogin}</h2>
        <div className="flex bg-[#d2d3ce]/30 p-1 rounded-xl mb-6">
          <button onClick={() => setMethod('email')} className={`flex-1 py-2 font-bold rounded-lg ${method === 'email' ? 'bg-white' : ''}`}>{t.email}</button>
          <button onClick={() => setMethod('phone')} className={`flex-1 py-2 font-bold rounded-lg ${method === 'phone' ? 'bg-white' : ''}`}>{t.phoneInput}</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={val} onChange={e => setVal(e.target.value)} placeholder={method === 'email' ? 'Email' : '05xx'} className="w-full p-4 rounded-xl border-2 font-bold" />
          <button type="submit" className="w-full bg-[#061414] text-[#bcff00] py-4 rounded-xl font-black">{t.loginBtn}</button>
          <button type="button" onClick={onBack} className="w-full font-bold text-[#96998c]">{t.goBack}</button>
        </form>
      </div>
    </div>
  );
}
