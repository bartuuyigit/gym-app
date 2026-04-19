import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';
import { enrollInClass, cancelClassByMember } from '../services/dbService';

export default function MemberDashboard({ memberId, onLogout, t }) {
  const [member, setMember] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: memberData } = await supabase.from('members').select('*').eq('id', memberId).single();
      if (memberData) setMember(memberData);

      const { data: notifData } = await supabase.from('notifications').select('*').eq('memberId', memberId);
      if (notifData) setNotifications(notifData);

      const { data: clsData } = await supabase.from('classes').select('*');
      if (clsData) setClasses(clsData);
    };
    fetchData();

    const sub = supabase.channel('member-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [memberId]);

  const handleEnroll = async (classId) => {
    const res = await enrollInClass(classId, memberId, member?.status === 'suspended');
    if(!res.success) alert(res.message);
  };

  const handleCancel = async (classId, classTime) => {
    const res = await cancelClassByMember(classId, memberId, classTime);
    if(!res.success) alert(res.message);
  };

  return (
    <div className="min-h-screen bg-[#e9ebe6] flex flex-col p-2 sm:p-4 md:p-8 items-center">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-[#d2d3ce] overflow-hidden pb-8">
        
        <div className="bg-[#061414] p-6 sm:p-8 pb-16 relative">
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[#bcff00] font-black text-xl flex items-center gap-2"><Icons.Dumbbell /> GymFlow</span>
            <button onClick={onLogout} className="text-[#96998c] hover:text-white transition-colors"><Icons.Logout /></button>
          </div>
        </div>

        <div className="px-4 sm:px-8 relative -mt-10">
          <div className="flex justify-between items-end">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#e9ebe6] border-4 border-white rounded-2xl flex items-center justify-center text-[#061414] shadow-md">
              <Icons.User />
            </div>
            
            <div className="bg-[#bcff00] text-[#061414] px-4 py-2 rounded-2xl border-4 border-white shadow-md flex items-center gap-2 font-black text-sm sm:text-lg">
              {member?.credits || 0} Jeton
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-[#061414] mt-4">{member?.name || 'Yükleniyor...'}</h2>
          
          {member?.status === 'suspended' && (
            <div className="mt-4 bg-red-100 border border-red-500 text-red-700 p-4 rounded-2xl font-bold text-sm sm:text-base">
              {t.suspendedMsg}
            </div>
          )}

          {member?.credits <= 0 && (
            <div className="mt-4 bg-orange-100 border border-orange-400 text-orange-800 p-4 rounded-2xl font-bold text-sm sm:text-base">
              {t.noCreditsMsg}
            </div>
          )}

          <div className="mt-8">
            <h4 className="font-bold text-[#061414] mb-4 text-xl flex items-center gap-2"><Icons.Calendar /> {t.calendarTitle}</h4>
            <div className="space-y-4">
              {classes.map(cls => {
                const enrolled = cls.enrolled || [];
                const waitlist = cls.waitlist || [];
                const isEnrolled = enrolled.includes(memberId);
                const isWaitlisted = waitlist.includes(memberId);
                const isFull = enrolled.length >= cls.capacity;
                const outOfCredits = member?.credits <= 0;

                return (
                  <div key={cls.id} className="border border-[#d2d3ce] p-4 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#f8f9f7]">
                    <div>
                      <p className="font-black text-[#061414] text-lg">{cls.name}</p>
                      <p className="text-sm text-[#96998c] font-medium">Saat: {cls.time} • Kontenjan: {enrolled.length}/{cls.capacity}</p>
                    </div>
                    <div className="w-full sm:w-auto flex">
                      {(isEnrolled || isWaitlisted) ? (
                        <button onClick={() => handleCancel(cls.id, cls.time)} className="w-full sm:w-auto bg-[#061414] text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-all">
                          {t.cancelClass}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEnroll(cls.id)} 
                          disabled={member?.status === 'suspended' || outOfCredits}
                          className={`w-full sm:w-auto px-4 py-2 rounded-xl font-bold transition-all ${(member?.status === 'suspended' || outOfCredits) ? 'bg-[#d2d3ce] text-[#96998c] cursor-not-allowed' : 'bg-[#bcff00] text-[#061414] hover:-translate-y-1 shadow-md shadow-[#bcff00]/20'}`}
                        >
                          {isFull ? t.joinWaitlist : t.joinClass}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="mt-10 border-t border-[#d2d3ce] pt-6">
            <h4 className="font-bold text-[#061414] mb-4 flex items-center gap-2"><Icons.Bell /> Bildirimler</h4>
            {notifications.length === 0 ? <p className="text-sm text-[#96998c]">Bildiriminiz yok.</p> : (
              notifications.map(n => (
                <div key={n.id} className="bg-[#bcff00]/20 border border-[#bcff00] p-4 rounded-2xl mb-3">
                  <p className="text-sm font-bold text-[#061414]">{n.message}</p>
                  <span className="text-xs text-[#96998c] mt-1 block">{n.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
