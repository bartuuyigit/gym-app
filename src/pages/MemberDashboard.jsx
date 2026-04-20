import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';
import { enrollInClass, cancelClassByMember } from '../services/dbService';

export default function MemberDashboard({ memberId, onLogout, t }) {
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Yeni menü state'i

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
      else alert(t.cancelError); // Veritabanından gelen değil, bizim çeviri dosyasından!
    } else {
      const res = await enrollInClass(cls.id, memberId, member?.status === 'suspended');
      if (res.success) loadData();
      else alert(t.noCreditsMsg); // İngilizce veri sızıntısını engelledik!
    }
  };

  return (
    <div className="min-h-screen bg-[#e9ebe6] p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-[#d2d3ce]">
        
        {/* HEADER: Siyah alan uzatıldı (pb-24 ile aşağı pay bırakıldı) */}
        <div className="bg-[#061414] px-8 pt-8 pb-24 flex justify-between items-start text-[#bcff00] rounded-t-[2.5rem]">
          <div className="flex items-center gap-3">
            <Icons.Dumbbell />
            <span className="font-black text-2xl tracking-tighter">GymFlow</span>
          </div>
        </div>

        {/* İÇERİK: -mt-16 ile beyaz alan yukarı çekildi ama logoya asla değmez */}
        <div className="px-6 md:px-10 -mt-16 relative z-10">
          
          <div className="flex justify-between items-end mb-8">
            
            {/* Profil İkonu ve Açılır Menü */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="w-20 h-20 bg-[#e9ebe6] rounded-3xl flex items-center justify-center border-4 border-white text-[#061414] shadow-lg hover:scale-105 transition-all"
              >
                <Icons.User />
              </button>

              {/* Profil Menüsü Tıklandığında Açılır */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute top-24 left-0 w-64 bg-white rounded-[2rem] shadow-2xl border border-[#d2d3ce] p-6 z-50 animate-fade-in-down">
                    <h3 className="font-black text-xl text-[#061414] text-center mb-1">{member?.name}</h3>
                    <p className="text-xs text-[#96998c] font-bold text-center mb-6">{member?.email}</p>
                    
                    <div className="space-y-3 mb-6 bg-[#f8f9f7] p-4 rounded-2xl border border-[#d2d3ce]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#96998c] font-bold">{t.phoneInput}</span>
                        <span className="text-sm font-black text-[#061414]">{member?.phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#96998c] font-bold">{t.package}</span>
                        <span className="text-sm font-black text-[#061414]">{member?.membershipType === 'pack24' ? '24' : member?.membershipType === 'pack16' ? '16' : '8'}</span>
                      </div>
                    </div>
                    
                    {/* Çıkış Yap Butonu Menüye Alındı */}
                    <button 
                      onClick={onLogout} 
                      className="w-full bg-red-50 text-red-500 font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all border border-red-100"
                    >
                      <Icons.Logout /> {t.logout}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Jeton Göstergesi */}
            <div className="bg-[#bcff00] text-[#061414] px-5 py-3 rounded-2xl font-black shadow-md border-4 border-white">
              {member?.credits || 0} {t.credits}
            </div>
          </div>

          <h2 className="text-3xl font-black text-[#061414] mb-8">{member?.name}</h2>

          {/* Jeton 0 İse Çıkan Hata Mesajı (Artık %100 Çevirili) */}
          {(member?.credits || 0) <= 0 && (
            <div className="bg-orange-100 border border-orange-400 text-orange-800 p-4 rounded-2xl font-bold mb-8">
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
                  <div key={cls.id} className="bg-[#f8f9f7] p-5 rounded-3xl border border-[#d2d3ce] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-black text-lg text-[#061414]">{cls.name}</p>
                      <p className="text-[#96998c] font-bold text-sm">
                        {t.time}: {cls.time} • {t.capacity}: {enrolledList.length}/{cls.capacity}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleAction(cls)}
                      disabled={isDisabled}
                      className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black transition-all ${
                        isEnrolled 
                          ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200' 
                          : isDisabled 
                            ? 'bg-[#d2d3ce] text-[#96998c] cursor-not-allowed'
                            : 'bg-[#bcff00] text-[#061414] hover:scale-[1.02] shadow-sm'
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
        <div className="h-10"></div>
      </div>
    </div>
  );
}
