import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';
import { enrollInClass, cancelClassByMember } from '../services/dbService';

export default function MemberDashboard({ memberId, onLogout, t }) {
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadData = async () => {
    const { data: m } = await supabase.from('members').select('*').eq('id', memberId).single();
    if (m) setMember(m);
    
    const { data: c } = await supabase.from('classes').select('*').order('time', { ascending: true });
    if (c) setClasses(c);
    
    const { data: n } = await supabase.from('notifications').select('*').eq('memberId', memberId);
    if (n) setNotifications(n);
  };

  useEffect(() => {
    loadData();
    const sub1 = supabase.channel('member-db-classes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, loadData).subscribe();
    const sub2 = supabase.channel('member-db-members').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, loadData).subscribe();
    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2); };
  }, [memberId]);

  const handleAction = async (cls) => {
    const isEnrolled = (cls.enrolled || []).includes(memberId) || (cls.waitlist || []).includes(memberId);
    
    if (isEnrolled) {
      const res = await cancelClassByMember(cls.id, memberId, cls.time);
      if (res.success) loadData();
      else alert(res.message || "İptal edilemedi!");
    } else {
      const res = await enrollInClass(cls.id, memberId, member?.status === 'suspended');
      if (res.success) loadData();
      else alert(res.message || t.noCreditsMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#e9ebe6] p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-[#d2d3ce]">
        
        {/* Header: Siyah Alan (Margin'ler temizlendi, taşıma iptal) */}
        <div className="bg-[#061414] p-8 flex justify-between items-center text-[#bcff00] rounded-t-[2.5rem]">
          <span className="font-black text-2xl tracking-tighter">GymFlow</span>
          <button onClick={onLogout} className="text-[#96998c] hover:text-white"><Icons.Logout /></button>
        </div>

        {/* İçerik: Beyaz Alan */}
        <div className="p-6 md:p-10">
          
          {/* Profil ve Jeton Kısmı (Yan Yana Hizalandı) */}
          <div className="flex justify-between items-center mb-8 border-b border-[#d2d3ce] pb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#f8f9f7] rounded-2xl flex items-center justify-center border-2 border-[#d2d3ce] text-[#061414] shadow-sm">
                <Icons.User />
              </div>
              <h2 className="text-2xl font-black text-[#061414]">{member?.name}</h2>
            </div>
            <div className="bg-[#bcff00] text-[#061414] px-5 py-3 rounded-xl font-black shadow-sm border border-[#bcff00]">
              {member?.credits || 0} {t.credits}
            </div>
          </div>

          {/* Jeton 0 İse Çıkan Hata Mesajı */}
          {(member?.credits || 0) <= 0 && (
            <div className="bg-orange-100 border border-orange-400 text-orange-800 p-4 rounded-xl font-bold mb-8">
              {t.noCreditsMsg}
            </div>
          )}

          {/* Ders Takvimi */}
          <div className="space-y-6">
            <h4 className="font-black text-[#061414] text-xl flex items-center gap-2">
              <Icons.Calendar /> {t.calendarTitle}
            </h4>
            <div className="space-y-3">
              {classes.map(cls => {
                const enrolledList = cls.enrolled || [];
                const waitlist = cls.waitlist || [];
                const isEnrolled = enrolledList.includes(memberId) || waitlist.includes(memberId);
                const isFull = enrolledList.length >= cls.capacity;
                const isDisabled = !isEnrolled && (member?.credits || 0) <= 0;

                return (
                  <div key={cls.id} className="bg-[#f8f9f7] p-5 rounded-2xl border border-[#d2d3ce] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-black text-lg text-[#061414]">{cls.name}</p>
                      <p className="text-[#96998c] font-bold text-sm">
                        {t.time}: {cls.time} • {t.capacity}: {enrolledList.length}/{cls.capacity}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleAction(cls)}
                      disabled={isDisabled}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black transition-all ${
                        isEnrolled 
                          ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200' // İPTAL BUTONU
                          : isDisabled 
                            ? 'bg-[#d2d3ce] text-[#96998c] cursor-not-allowed' // YETERSİZ JETON
                            : 'bg-[#bcff00] text-[#061414] hover:scale-[1.02] shadow-sm' // KATIL BUTONU
                      }`}
                    >
                      {isEnrolled ? t.cancelClass : (isFull ? t.joinWaitlist : t.joinClass)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bildirimler */}
          <div className="mt-10 border-t border-[#d2d3ce] pt-8">
            <h4 className="font-black text-[#061414] mb-4 flex items-center gap-2">
              <Icons.Bell /> {t.notificationsTitle}
            </h4>
            {notifications.length === 0 ? (
              <p className="text-[#96998c] font-medium">{t.noNotifications}</p>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="bg-[#bcff00]/10 border border-[#bcff00]/50 p-4 rounded-xl">
                    <p className="text-sm font-bold text-[#061414]">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
