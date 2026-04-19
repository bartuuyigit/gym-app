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
      alert("Kullanıcı Kaydedildi.");
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
      alert("Ders Oluşturuldu.");
    } else {
      alert("Ders Eklenemedi! Hata: " + res.message);
    }
  };

  const handleDrop = async (classId, memberId) => {
    const res = await dropMemberAndTriggerWaitlist(classId, memberId);
    if(res.success) {
      await loadData(); 
      alert("Üye dersten çıkarıldı, jetonu iade edildi.");
    }
  };

  const handleAttendance = async (memberId, classId, isPresent) => {
    await markAttendance(memberId, isPresent);
    await dropMemberAndTriggerWaitlist(classId, memberId); 
    await loadData(); 
    alert(isPresent ? "Yoklama: Geldi olarak işaretlendi." : "Yoklama: Gelmedi olarak işaretlendi ve ceza puanı eklendi.");
  };

  const handleCreditChange = async (memberId, currentCredits, amount) => {
    const safeCredits = currentCredits || 0;
    const newCredits = Math.max(0, safeCredits + amount);
    setMembers(members.map(m => m.id === memberId ? { ...m, credits: newCredits } : m));
    
    const res = await updateMemberCredits(memberId, newCredits);
    if(!res.success) {
      alert("Jeton güncellenemedi! Hata: " + res.message);
      loadData(); 
    }
  };

  // YENİ EKLENEN: DERSİ SİLME İŞLEMİ
  const handleDeleteClass = async (classId) => {
    if (window.confirm("Bu dersi silmek istediğinize emin misiniz? Derse kayıtlı üyelerin jetonları otomatik iade edilecektir.")) {
      const res = await deleteClassAndRefund(classId);
      if (res.success) {
        await loadData(); // Ekranı anında güncelle
        alert("Ders başarıyla silindi.");
      } else {
        alert("Ders silinemedi! Hata: " + res.message);
      }
    }
  };

  const getTabClass = (tabName) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === tabName ? 'bg-[#bcff00] text-[#061414]' : 'text-[#96998c] hover:text-[#bcff00] hover:bg-white/5'}`;

  return (
    <div className="min-h-screen bg-[#e9ebe6] flex relative overflow-hidden">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#061414] text-[#e9ebe6] flex flex-col p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3 text-[#bcff00]"><Icons.Dumbbell /><span className="text-2xl font-black text-white">GymFlow</span></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-[#96998c] hover:text-white">
            <Icons.Close />
          </button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => handleTabChange('dashboard')} className={getTabClass('dashboard')}><Icons.Dashboard /> {t.dashboard}</button>
          <button onClick={() => handleTabChange('members')} className={getTabClass('members')}><Icons.Users /> {t.members}</button>
          <button onClick={() => handleTabChange('classes')} className={getTabClass('classes')}><Icons.Calendar /> {t.classesTab}</button>
          <button onClick={() => handleTabChange('analysis')} className={getTabClass('analysis')}><Icons.Chart /> {t.analysisTab}</button>
        </nav>
        
        <button onClick={onLogout} className="flex items-center gap-3 text-[#96998c] hover:text-white mt-auto px-4 py-3"><Icons.Logout /> {t.logout}</button>
      </aside>

      <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto w-full">
        
        <div className="flex justify-between items-center mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-[#061414] truncate">{t.welcomeOwner}</h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 bg-[#061414] text-[#bcff00] rounded-xl shadow-lg">
            <Icons.Menu />
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#d2d3ce]">
              <h3 className="text-4xl font-black text-[#061414]">{members.length}</h3>
              <p className="text-[#96998c] font-medium">Toplam Üye</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#d2d3ce]">
              <h3 className="text-4xl font-black text-[#061414]">{classes.length}</h3>
              <p className="text-[#96998c] font-medium">Aktif Ders</p>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#d2d3ce]">
              <h3 className="text-2xl font-black mb-6">{t.addMemberTitle}</h3>
              <form onSubmit={handleAddMemberSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <input type="text" placeholder={t.nameInput} value={newMember.name} onChange={e=>setNewMember({...newMember, name: e.target.value})} className="border border-[#d2d3ce] p-4 rounded-2xl focus:ring-2 focus:ring-[#bcff00] outline-none w-full" required/>
                  <input type="email" placeholder={t.email} value={newMember.email} onChange={e=>setNewMember({...newMember, email: e.target.value})} className="border border-[#d2d3ce] p-4 rounded-2xl focus:ring-2 focus:ring-[#bcff00] outline-none w-full" required/>
                  <input type="text" placeholder={t.phoneInput} value={newMember.phone} onChange={e=>setNewMember({...newMember, phone: e.target.value})} className="border border-[#d2d3ce] p-4 rounded-2xl focus:ring-2 focus:ring-[#bcff00] outline-none w-full" required/>
                  <input type="number" placeholder={t.age} value={newMember.age} onChange={e=>setNewMember({...newMember, age: e.target.value})} className="border border-[#d2d3ce] p-4 rounded-2xl focus:ring-2 focus:ring-[#bcff00] outline-none w-full" required min="10" max="100"/>
                  
                  <div className="flex flex-wrap items-center gap-4 p-4 border border-[#d2d3ce] rounded-2xl">
                    <span className="font-bold text-[#061414]">{t.gender}:</span>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="male" checked={newMember.gender === 'male'} onChange={e=>setNewMember({...newMember, gender: e.target.value})} className="accent-[#061414]" /> {t.male}</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="female" checked={newMember.gender === 'female'} onChange={e=>setNewMember({...newMember, gender: e.target.value})} className="accent-[#061414]" /> {t.female}</label>
                  </div>

                  <div className="flex flex-col gap-2 p-4 border border-[#d2d3ce] rounded-2xl">
                    <span className="font-bold text-[#061414]">{t.package}:</span>
                    <select value={newMember.package} onChange={e=>setNewMember({...newMember, package: e.target.value})} className="border border-[#d2d3ce] p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bcff00] bg-white w-full">
                      <option value="pack8">{t.pack8}</option>
                      <option value="pack16">{t.pack16}</option>
                      <option value="pack24">{t.pack24}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#f8f9f7] p-4 rounded-2xl border border-[#d2d3ce]">
                  <input type="checkbox" id="notifToggle" checked={newMember.allowNotifications} onChange={e=>setNewMember({...newMember, allowNotifications: e.target.checked})} className="w-5 h-5 accent-[#061414] cursor-pointer" />
                  <label htmlFor="notifToggle" className="font-medium text-[#061414] cursor-pointer selection:bg-none">{t.allowNotifications}</label>
                </div>

                <button type="submit" className="w-full bg-[#061414] text-[#bcff00] py-4 rounded-2xl font-black text-lg hover:bg-black transition-all">{t.addMemberBtn}</button>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-[#d2d3ce] overflow-x-auto">
               <h3 className="text-xl font-black mb-4">Üye Listesi</h3>
               {members.map(m => (
                 <div key={m.id} className="border-b border-[#d2d3ce] py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div className="w-full md:w-auto">
                     <div className="font-bold text-lg">{m.name} <span className="text-sm text-[#96998c] font-medium block mt-1">{m.email} • {m.age || '-'} Yaş • {m.phone}</span></div>
                     
                     <div className="flex items-center gap-3 mt-3">
                       <span className="bg-[#f8f9f7] text-[#061414] px-3 py-1.5 rounded-lg text-sm font-black border border-[#d2d3ce]">{m.credits || 0} Jeton</span>
                       <div className="flex items-center gap-1 bg-[#e9ebe6] p-1 rounded-lg">
                         <button onClick={() => handleCreditChange(m.id, m.credits, -1)} className="bg-white text-red-600 w-8 h-8 rounded-md font-black flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm">-</button>
                         <button onClick={() => handleCreditChange(m.id, m.credits, 1)} className="bg-white text-green-600 w-8 h-8 rounded-md font-black flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm">+</button>
                       </div>
                     </div>
                   </div>
                   <span className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide whitespace-nowrap ${m.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                     {m.status === 'suspended' ? 'ASKIYA ALINDI' : `AKTİF (Ceza: ${m.absentCount || 0})`}
                   </span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#d2d3ce]">
              <h3 className="text-xl font-black mb-4">Yeni Ders Ekle</h3>
              <form onSubmit={handleAddClassSubmit} className="flex flex-col md:flex-row gap-4">
                <input type="text" placeholder="Ders Adı" value={newClass.name} onChange={e=>setNewClass({...newClass, name: e.target.value})} className="border border-[#d2d3ce] p-3 rounded-xl w-full md:flex-1 focus:ring-2 focus:ring-[#bcff00]" required/>
                <input type="time" value={newClass.time} onChange={e=>setNewClass({...newClass, time: e.target.value})} className="border border-[#d2d3ce] p-3 rounded-xl w-full md:flex-1 focus:ring-2 focus:ring-[#bcff00]" required/>
                <input type="number" placeholder="Kontenjan" value={newClass.capacity} onChange={e=>setNewClass({...newClass, capacity: e.target.value})} className="border border-[#d2d3ce] p-3 rounded-xl w-full md:flex-1 focus:ring-2 focus:ring-[#bcff00]" required min="1"/>
                <button type="submit" className="bg-[#061414] text-[#bcff00] px-6 py-3 rounded-xl font-bold w-full md:w-auto">Dersi Oluştur</button>
              </form>
            </div>

            <h2 className="text-2xl font-black mb-4 mt-8">{t.classesTitle}</h2>
            {classes.map(cls => (
              <div key={cls.id} className="bg-white p-4 md:p-6 rounded-3xl border border-[#d2d3ce] flex flex-col md:flex-row gap-6 shadow-sm">
                <div className="flex-1">
                  
                  {/* SİL BUTONU BURAYA EKLENDİ */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black">{cls.name} <span className="text-sm text-[#96998c]">({cls.time})</span></h3>
                    <button 
                      onClick={() => handleDeleteClass(cls.id)} 
                      className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                      title="Dersi Sil"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(cls.enrolled || []).map(memberId => {
                      const m = members.find(x => x.id === memberId) || { name: memberId };
                      return (
                        <div key={memberId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#e9ebe6] px-4 py-3 rounded-xl">
                          <span className="font-bold">{m.name}</span>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleAttendance(memberId, cls.id, true)} className="bg-green-100 text-green-700 px-3 py-1 rounded font-bold text-sm">Geldi</button>
                            <button onClick={() => handleAttendance(memberId, cls.id, false)} className="bg-red-100 text-red-700 px-3 py-1 rounded font-bold text-sm">Gelmedi</button>
                            <button onClick={() => handleDrop(cls.id, memberId)} className="text-red-500 sm:ml-2 text-sm underline font-bold">Çıkar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-[#061414] p-4 rounded-2xl w-full md:w-1/3 border border-[#bcff00]/30 h-fit">
                  <h4 className="font-bold text-[#bcff00] mb-3">{t.waitlist} ({(cls.waitlist || []).length})</h4>
                  {(cls.waitlist || []).map(wId => {
                    const m = members.find(x => x.id === wId) || { name: wId };
                    return <div key={wId} className="text-white text-sm mb-1">- {m.name}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analysis' && (
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#d2d3ce] overflow-x-auto">
             <h2 className="text-2xl font-black mb-2">{t.densityTitle}</h2>
             <p className="text-[#96998c] mb-10">{t.densityDesc}</p>
             <div className="flex items-end gap-2 h-64 mt-8 min-w-[500px]">
               {densityData.map(d => (
                 <div key={d.time} className="flex flex-col items-center flex-1 group relative">
                   <div className={`w-full rounded-t-xl transition-all ${d.density > 80 ? 'bg-red-500' : d.density > 50 ? 'bg-orange-400' : 'bg-[#bcff00]'}`} style={{ height: `${d.density}%` }}>
                     <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#061414] text-white text-xs px-2 py-1 rounded font-bold">%{d.density}</span>
                   </div>
                   <span className="text-xs font-bold mt-2 text-[#96998c]">{d.time}</span>
                 </div>
               ))}
             </div>
           </div>
        )}
      </main>
    </div>
  );
}
