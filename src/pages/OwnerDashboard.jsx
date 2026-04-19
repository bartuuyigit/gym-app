import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';
import { addMemberToDB, dropMemberAndTriggerWaitlist, analyzeDensityPrediction, markAttendance, addClassToDB, updateMemberCredits, deleteClassAndRefund } from '../services/dbService';

export default function OwnerDashboard({ onLogout, t }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [densityData, setDensityData] = useState([]);
  
  const [newMember, setNewMember] = useState({ 
    name: '', email: '', phone: '', gender: 'male', age: '', 
    allowNotifications: true, package: 'pack8' 
  });
  
  const [newClass, setNewClass] = useState({ name: '', time: '', capacity: '' });

  const loadData = async () => {
    const { data: membersData } = await supabase.from('members').select('*');
    if (membersData) setMembers(membersData);
    
    const { data: classesData } = await supabase.from('classes').select('*');
    if (classesData) setClasses(classesData);
  };

  useEffect(() => {
    loadData();
    const memberSub = supabase.channel('members-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, loadData).subscribe();
    const classesSub = supabase.channel('classes-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, loadData).subscribe();
    return () => { supabase.removeChannel(memberSub); supabase.removeChannel(classesSub); };
  }, []);

  useEffect(() => {
    if (activeTab === 'analysis') analyzeDensityPrediction().then(data => setDensityData(data));
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      await addMemberToDB(newMember);
      setNewMember({ name: '', email: '', phone: '', gender: 'male', age: '', allowNotifications: true, package: 'pack8' });
      await loadData();
      alert("Kullanici Kaydedildi.");
    } catch (error) {
      alert("Hata! Sebep: " + error.message);
    }
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    const res = await addClassToDB(newClass);
    if(res.success) {
      setNewClass({ name: '', time: '', capacity: '' });
      await loadData();
      alert("Ders Olusturuldu.");
    } else {
      alert("Ders Eklenemedi! Hata: " + res.message);
    }
  };

  const handleDrop = async (classId, memberId) => {
    const res = await dropMemberAndTriggerWaitlist(classId, memberId);
    if(res.success) {
      await loadData();
      alert("Uye dersten cikarildi, jetonu iade edildi.");
    }
  };

  const handleAttendance = async (memberId, classId, isPresent) => {
    await markAttendance(memberId, isPresent);
    await dropMemberAndTriggerWaitlist(classId, memberId); 
    await loadData();
    alert(isPresent ? "Yoklama: Geldi." : "Yoklama: Gelmedi.");
  };

  const handleCreditChange = async (memberId, currentCredits, amount) => {
    const safeCredits = currentCredits || 0;
    const newCredits = Math.max(0, safeCredits + amount);
    setMembers(members.map(m => m.id === memberId ? { ...m, credits: newCredits } : m));
    const res = await updateMemberCredits(memberId, newCredits);
    if(!res.success) {
      alert("Hata: " + res.message);
      loadData();
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm("Bu dersi silmek istediginize emin misiniz? Kayitli uyelere jetonlari iade edilecektir.")) {
      const res = await deleteClassAndRefund(classId);
      if (res.success) {
        await loadData();
        alert("Ders silindi.");
      }
    }
  };

  const getTabClass = (tabName) => `flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all w-full text-left ${activeTab === tabName ? 'bg-[#bcff00] text-[#061414]' : 'text-[#96998c] hover:text-[#bcff00]'}`;

  return (
    <div className="min-h-screen bg-[#e9ebe6] flex relative">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar - Mobile Responsive */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#061414] text-[#e9ebe6] flex flex-col p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3 text-[#bcff00]"><Icons.Dumbbell /><span className="text-2xl font-black text-white tracking-tighter">GymFlow</span></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-[#96998c]"><Icons.Close /></button>
        </div>
        
        <nav className="flex-1 space-y-3">
          <button onClick={() => handleTabChange('dashboard')} className={getTabClass('dashboard')}><Icons.Dashboard /> {t.dashboard}</button>
          <button onClick={() => handleTabChange('members')} className={getTabClass('members')}><Icons.Users /> {t.members}</button>
          <button onClick={() => handleTabChange('classes')} className={getTabClass('classes')}><Icons.Calendar /> {t.classesTab}</button>
          <button onClick={() => handleTabChange('analysis')} className={getTabClass('analysis')}><Icons.Chart /> {t.analysisTab}</button>
        </nav>
        
        <button onClick={onLogout} className="flex items-center gap-3 text-[#96998c] hover:text-white mt-auto px-4 py-4 border-t border-white/10"><Icons.Logout /> {t.logout}</button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto w-full relative">
        
        {/* Top Header - Mobile Optimized */}
        <header className="sticky top-0 bg-[#e9ebe6]/90 backdrop-blur-md z-30 px-4 py-4 md:px-8 md:py-6 flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-3 bg-[#061414] text-[#bcff00] rounded-2xl shadow-xl">
            <Icons.Menu />
          </button>
          <h1 className="text-xl md:text-3xl font-black text-[#061414] truncate">{t.welcomeOwner}</h1>
        </header>

        <div className="p-4 md:p-8 pt-2">
          {/* Dashboard Stats */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-[#d2d3ce] flex flex-col items-center text-center">
                <span className="text-5xl font-black text-[#061414] mb-2">{members.length}</span>
                <p className="text-[#96998c] font-bold uppercase tracking-widest text-xs">Toplam Uye</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-[#d2d3ce] flex flex-col items-center text-center">
                <span className="text-5xl font-black text-[#061414] mb-2">{classes.length}</span>
                <p className="text-[#96998c] font-bold uppercase tracking-widest text-xs">Aktif Ders</p>
              </div>
            </div>
          )}

          {/* Members View */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-[#d2d3ce]">
                <h3 className="text-2xl font-black mb-8 text-[#061414]">{t.addMemberTitle}</h3>
                <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t.nameInput} value={newMember.name} onChange={e=>setNewMember({...newMember, name: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none w-full font-bold" required/>
                    <input type="email" placeholder={t.email} value={newMember.email} onChange={e=>setNewMember({...newMember, email: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none w-full font-bold" required/>
                    <input type="text" placeholder={t.phoneInput} value={newMember.phone} onChange={e=>setNewMember({...newMember, phone: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none w-full font-bold" required/>
                    <input type="number" placeholder={t.age} value={newMember.age} onChange={e=>setNewMember({...newMember, age: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none w-full font-bold" required min="10"/>
                    
                    <div className="flex items-center justify-around p-4 border-2 border-[#d2d3ce] rounded-2xl">
                      <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="radio" name="gender" value="male" checked={newMember.gender === 'male'} onChange={e=>setNewMember({...newMember, gender: e.target.value})} className="w-5 h-5 accent-[#061414]" /> {t.male}</label>
                      <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="radio" name="gender" value="female" checked={newMember.gender === 'female'} onChange={e=>setNewMember({...newMember, gender: e.target.value})} className="w-5 h-5 accent-[#061414]" /> {t.female}</label>
                    </div>

                    <select value={newMember.package} onChange={e=>setNewMember({...newMember, package: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none w-full font-bold bg-white">
                      <option value="pack8">{t.pack8}</option>
                      <option value="pack16">{t.pack16}</option>
                      <option value="pack24">{t.pack24}</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#061414] text-[#bcff00] py-5 rounded-2xl font-black text-lg hover:scale-[1.01] transition-transform">{t.addMemberBtn}</button>
                </form>
              </div>

              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-[#d2d3ce]">
                 <h3 className="text-2xl font-black mb-8 text-[#061414]">Uye Listesi</h3>
                 <div className="space-y-4">
                  {members.map(m => (
                    <div key={m.id} className="bg-[#f8f9f7] p-6 rounded-3xl border border-[#d2d3ce] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <div className="font-black text-xl text-[#061414]">{m.name}</div>
                        <div className="text-[#96998c] font-bold text-sm mt-1">{m.email} • {m.phone}</div>
                        <div className="flex items-center gap-2 mt-4">
                          <span className="bg-[#061414] text-white px-4 py-2 rounded-xl text-sm font-black">{m.credits || 0} Jeton</span>
                          <button onClick={() => handleCreditChange(m.id, m.credits, -1)} className="bg-white border-2 border-[#d2d3ce] text-[#061414] w-10 h-10 rounded-xl font-black flex items-center justify-center hover:bg-red-50">-</button>
                          <button onClick={() => handleCreditChange(m.id, m.credits, 1)} className="bg-white border-2 border-[#d2d3ce] text-[#061414] w-10 h-10 rounded-xl font-black flex items-center justify-center hover:bg-green-50">+</button>
                        </div>
                      </div>
                      <span className={`w-full md:w-auto text-center px-6 py-3 rounded-2xl text-xs font-black tracking-tighter ${m.status === 'suspended' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-[#bcff00]/20 text-[#061414] border border-[#bcff00]'}`}>
                        {m.status === 'suspended' ? 'ASKIYA ALINDI' : `AKTIF (Ceza: ${m.absentCount || 0})`}
                      </span>
                    </div>
                  ))}
                 </div>
              </div>
            </div>
          )}

          {/* Classes View */}
          {activeTab === 'classes' && (
            <div className="space-y-8">
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-[#d2d3ce]">
                <h3 className="text-2xl font-black mb-8 text-[#061414]">Yeni Ders Ekle</h3>
                <form onSubmit={handleAddClassSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="Ders Adi" value={newClass.name} onChange={e=>setNewClass({...newClass, name: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none font-bold" required/>
                  <input type="time" value={newClass.time} onChange={e=>setNewClass({...newClass, time: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none font-bold" required/>
                  <input type="number" placeholder="Kontenjan" value={newClass.capacity} onChange={e=>setNewClass({...newClass, capacity: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl focus:border-[#bcff00] outline-none font-bold" required min="1"/>
                  <button type="submit" className="bg-[#061414] text-[#bcff00] p-4 rounded-2xl font-black hover:scale-[1.02] transition-transform">Olustur</button>
                </form>
              </div>

              {classes.map(cls => (
                <div key={cls.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-[#d2d3ce] shadow-sm relative">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-[#061414]">{cls.name}</h3>
                      <p className="text-[#96998c] font-black mt-1 uppercase tracking-widest text-sm">{cls.time} • Kontenjan: {(cls.enrolled || []).length}/{cls.capacity}</p>
                    </div>
                    <button onClick={() => handleDeleteClass(cls.id)} className="bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-100 transition-colors"><Icons.Trash /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="font-black text-[#061414] mb-4 flex items-center gap-2 underline decoration-[#bcff00] decoration-4">Kayitli Uyeler</h4>
                      {(cls.enrolled || []).map(memberId => {
                        const m = members.find(x => x.id === memberId) || { name: memberId };
                        return (
                          <div key={memberId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f8f9f7] p-5 rounded-3xl border border-[#d2d3ce]">
                            <span className="font-black text-lg">{m.name}</span>
                            <div className="flex gap-2">
                              <button onClick={() => handleAttendance(memberId, cls.id, true)} className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-black text-xs uppercase">Geldi</button>
                              <button onClick={() => handleAttendance(memberId, cls.id, false)} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-black text-xs uppercase">Gelmedi</button>
                              <button onClick={() => handleDrop(cls.id, memberId)} className="p-2 text-red-400 hover:text-red-600"><Icons.Close /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-[#061414] p-8 rounded-[2rem]">
                      <h4 className="font-black text-[#bcff00] mb-6 flex items-center gap-2">Yedek Liste ({(cls.waitlist || []).length})</h4>
                      <div className="space-y-3">
                        {(cls.waitlist || []).map(wId => {
                          const m = members.find(x => x.id === wId) || { name: wId };
                          return <div key={wId} className="text-white font-bold bg-white/5 p-4 rounded-2xl border border-white/10">- {m.name}</div>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analysis View */}
          {activeTab === 'analysis' && (
             <div className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-sm border border-[#d2d3ce] overflow-x-auto">
               <h2 className="text-3xl font-black text-[#061414] mb-4">{t.densityTitle}</h2>
               <p className="text-[#96998c] font-bold mb-12">{t.densityDesc}</p>
               <div className="flex items-end gap-3 h-80 min-w-[600px]">
                 {densityData.map(d => (
                   <div key={d.time} className="flex flex-col items-center flex-1 group relative">
                     <div className={`w-full rounded-t-3xl transition-all duration-500 ${d.density > 80 ? 'bg-red-500' : d.density > 50 ? 'bg-orange-400' : 'bg-[#bcff00]'}`} style={{ height: `${d.density}%` }}>
                       <span className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[#061414] text-white text-xs px-3 py-2 rounded-xl font-black shadow-xl">%{d.density}</span>
                     </div>
                     <span className="text-sm font-black mt-4 text-[#061414]">{d.time}</span>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
