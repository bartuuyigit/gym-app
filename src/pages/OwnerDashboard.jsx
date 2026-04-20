import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';
import { 
  addMemberToDB, 
  dropMemberAndTriggerWaitlist, 
  markAttendance, 
  addClassToDB, 
  updateMemberCredits, 
  deleteClassAndRefund, 
  deleteMemberFromDB 
} from '../services/dbService';

export default function OwnerDashboard({ onLogout, t }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', gender: 'male', age: '', allowNotifications: true, package: 'pack8' });
  const [newClass, setNewClass] = useState({ name: '', time: '', capacity: '' });

  const loadData = async () => {
    const { data: mData } = await supabase.from('members').select('*');
    if (mData) setMembers(mData);
    const { data: cData } = await supabase.from('classes').select('*');
    if (cData) setClasses(cData);
  };

  useEffect(() => {
    loadData();
    const mSub = supabase.channel('owner-m').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, loadData).subscribe();
    const cSub = supabase.channel('owner-c').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, loadData).subscribe();
    return () => { supabase.removeChannel(mSub); supabase.removeChannel(cSub); };
  }, []);

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      await addMemberToDB(newMember);
      setNewMember({ name: '', email: '', phone: '', gender: 'male', age: '', allowNotifications: true, package: 'pack8' });
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    const res = await addClassToDB(newClass);
    if(res.success) {
      setNewClass({ name: '', time: '', capacity: '' });
      await loadData();
    }
  };

  const handleDeleteMember = async (id) => {
    if (confirm(t.deleteMemberConfirm)) {
      const res = await deleteMemberFromDB(id);
      if (res.success) loadData();
    }
  };

  const handleDeleteClass = async (id) => {
    if (confirm(t.deleteClassConfirm)) {
      const res = await deleteClassAndRefund(id);
      if (res.success) loadData();
    }
  };

  const handleCreditChange = async (id, current, amount) => {
    const newVal = Math.max(0, (current || 0) + amount);
    setMembers(members.map(m => m.id === id ? { ...m, credits: newVal } : m));
    await updateMemberCredits(id, newVal);
  };

  const handleAttendance = async (mId, cId, present) => {
    await markAttendance(mId, present);
    await dropMemberAndTriggerWaitlist(cId, mId);
    await loadData();
  };

  // ANALİZ VERİLERİ (Gerçek zamanlı hesaplama)
  const totalCapacity = classes.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const totalEnrolled = classes.reduce((acc, curr) => acc + (curr.enrolled?.length || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const maleCount = members.filter(m => m.gender === 'male').length;
  const femaleCount = members.filter(m => m.gender === 'female').length;

  const navClass = (tab) => `flex items-center gap-3 px-4 py-4 rounded-2xl font-bold w-full text-left transition-all ${activeTab === tab ? 'bg-[#bcff00] text-[#061414]' : 'text-[#96998c] hover:text-[#bcff00]'}`;

  return (
    <div className="min-h-screen bg-[#e9ebe6] flex relative">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#061414] p-6 transform transition-transform md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10 text-[#bcff00]"><Icons.Dumbbell /><span className="font-black text-2xl tracking-tighter">GymFlow</span><button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden"><Icons.Close /></button></div>
        <nav className="space-y-3">
          <button onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false);}} className={navClass('dashboard')}><Icons.Dashboard /> {t.dashboard}</button>
          <button onClick={() => {setActiveTab('members'); setIsMobileMenuOpen(false);}} className={navClass('members')}><Icons.Users /> {t.members}</button>
          <button onClick={() => {setActiveTab('classes'); setIsMobileMenuOpen(false);}} className={navClass('classes')}><Icons.Calendar /> {t.classesTab}</button>
          <button onClick={() => {setActiveTab('analysis'); setIsMobileMenuOpen(false);}} className={navClass('analysis')}><Icons.Chart /> {t.analysisTab}</button>
        </nav>
        <button onClick={onLogout} className="mt-auto flex items-center gap-3 text-[#96998c] p-4 border-t border-white/10 w-full"><Icons.Logout /> {t.logout}</button>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="sticky top-0 bg-[#e9ebe6]/90 backdrop-blur-md z-30 p-4 md:p-8 flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-3 bg-[#061414] text-[#bcff00] rounded-2xl"><Icons.Menu /></button>
          <h1 className="text-xl md:text-3xl font-black text-[#061414]">{t.welcomeOwner}</h1>
        </header>

        <div className="p-4 md:p-8 pt-0">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-10 rounded-[2.5rem] border border-[#d2d3ce] text-center shadow-sm">
                <div className="text-5xl font-black text-[#061414]">{members.length}</div>
                <div className="text-[#96998c] font-bold text-xs uppercase mt-2">{t.totalMembers}</div>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-[#d2d3ce] text-center shadow-sm">
                <div className="text-5xl font-black text-[#061414]">{classes.length}</div>
                <div className="text-[#96998c] font-bold text-xs uppercase mt-2">{t.activeClasses}</div>
              </div>
            </div>
          )}

          {/* MEMBERS TAB (Gelişmiş Profil Görünümü) */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-[#d2d3ce] shadow-sm">
                <h3 className="text-2xl font-black mb-8">{t.addMemberTitle}</h3>
                <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t.nameInput} value={newMember.name} onChange={e=>setNewMember({...newMember, name: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl outline-none font-bold focus:border-[#bcff00]" required/>
                    <input type="email" placeholder={t.email} value={newMember.email} onChange={e=>setNewMember({...newMember, email: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl outline-none font-bold focus:border-[#bcff00]" required/>
                    <input type="text" placeholder={t.phoneInput} value={newMember.phone} onChange={e=>setNewMember({...newMember, phone: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl outline-none font-bold focus:border-[#bcff00]" required/>
                    <input type="number" placeholder={t.age} value={newMember.age} onChange={e=>setNewMember({...newMember, age: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl outline-none font-bold focus:border-[#bcff00]" required/>
                    <select value={newMember.package} onChange={e=>setNewMember({...newMember, package: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl outline-none font-bold bg-white focus:border-[#bcff00]">
                      <option value="pack8">{t.pack8}</option><option value="pack16">{t.pack16}</option><option value="pack24">{t.pack24}</option>
                    </select>
                    <div className="flex items-center gap-4 p-4 border-2 border-[#d2d3ce] rounded-2xl">
                      <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="radio" name="gender" value="male" checked={newMember.gender === 'male'} onChange={e=>setNewMember({...newMember, gender: e.target.value})} className="w-5 h-5 accent-[#061414]" /> {t.male}</label>
                      <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="radio" name="gender" value="female" checked={newMember.gender === 'female'} onChange={e=>setNewMember({...newMember, gender: e.target.value})} className="w-5 h-5 accent-[#061414]" /> {t.female}</label>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#061414] text-[#bcff00] py-5 rounded-2xl font-black text-lg hover:scale-[1.01] transition-transform">{t.addMemberBtn}</button>
                </form>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {members.map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-[#d2d3ce] shadow-sm relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full ${m.status === 'suspended' ? 'bg-red-500' : 'bg-[#bcff00]'}`}></div>
                    <div className="pl-4 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-xl text-[#061414]">{m.name}</h4>
                          <p className="text-sm font-bold text-[#96998c]">{m.email} • {m.phone}</p>
                        </div>
                        <button onClick={() => handleDeleteMember(m.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-xl transition-colors"><Icons.Trash /></button>
                      </div>
                      
                      <div className="bg-[#f8f9f7] p-4 rounded-2xl mb-4 text-sm font-bold text-[#061414] grid grid-cols-2 gap-2 border border-[#d2d3ce]">
                        <div><span className="text-[#96998c] block text-xs">{t.registerDate}</span> {m.startDate || '-'}</div>
                        <div><span className="text-[#96998c] block text-xs">{t.package}</span> {m.membershipType === 'pack24' ? '24' : m.membershipType === 'pack16' ? '16' : '8'}</div>
                        <div><span className="text-[#96998c] block text-xs">{t.gender}</span> {m.gender === 'female' ? t.female : t.male}</div>
                        <div><span className="text-[#96998c] block text-xs">Durum</span> {m.status === 'suspended' ? <span className="text-red-500">{t.suspendedStatus}</span> : <span className="text-green-600">{t.activeStatus}</span>}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="bg-[#061414] text-white px-4 py-2 rounded-xl text-sm font-black">{m.credits || 0} {t.credits}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleCreditChange(m.id, m.credits, -1)} className="bg-white border-2 border-[#d2d3ce] w-10 h-10 rounded-xl font-black text-[#061414] hover:bg-red-50">-</button>
                          <button onClick={() => handleCreditChange(m.id, m.credits, 1)} className="bg-white border-2 border-[#d2d3ce] w-10 h-10 rounded-xl font-black text-[#061414] hover:bg-green-50">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLASSES TAB */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-[#d2d3ce] shadow-sm">
                <form onSubmit={handleAddClassSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder={t.className} value={newClass.name} onChange={e=>setNewClass({...newClass, name: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl font-bold focus:border-[#bcff00] outline-none" required/>
                  <input type="time" value={newClass.time} onChange={e=>setNewClass({...newClass, time: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl font-bold focus:border-[#bcff00] outline-none" required/>
                  <input type="number" placeholder={t.capacity} value={newClass.capacity} onChange={e=>setNewClass({...newClass, capacity: e.target.value})} className="border-2 border-[#d2d3ce] p-4 rounded-2xl font-bold focus:border-[#bcff00] outline-none" required/>
                  <button type="submit" className="bg-[#061414] text-[#bcff00] rounded-2xl font-black py-4 hover:scale-[1.02] transition-transform">{t.createClassBtn || 'Oluştur'}</button>
                </form>
              </div>
              
              {classes.map(cls => (
                <div key={cls.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-[#d2d3ce] shadow-sm relative">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-[#061414]">{cls.name}</h3>
                      <p className="text-[#96998c] font-black uppercase text-sm mt-1">{t.time}: {cls.time} • {t.capacity}: { (cls.enrolled || []).length }/{cls.capacity}</p>
                    </div>
                    <button onClick={() => handleDeleteClass(cls.id)} className="text-red-500 p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"><Icons.Trash /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      {(cls.enrolled || []).map(mId => {
                        // BURASI DÜZELTİLDİ: ID'ler artık string olarak tam eşleşiyor
                        const m = members.find(x => String(x.id) === String(mId)); 
                        const displayName = m ? m.name : 'Silinmiş Üye';
                        
                        return (
                          <div key={mId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#f8f9f7] p-4 rounded-2xl border border-[#d2d3ce] gap-3">
                            <span className="font-black text-[#061414]">{displayName}</span>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button onClick={() => handleAttendance(mId, cls.id, true)} className="flex-1 sm:flex-none bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-black uppercase border border-green-200 hover:bg-green-200">GELDİ</button>
                              <button onClick={() => handleAttendance(mId, cls.id, false)} className="flex-1 sm:flex-none bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-black uppercase border border-red-200 hover:bg-red-200">GELMEDİ</button>
                            </div>
                          </div>
                        );
                      })}
                      {(cls.enrolled || []).length === 0 && <div className="text-[#96998c] font-bold text-sm bg-[#f8f9f7] p-4 rounded-2xl border border-[#d2d3ce]">Derse henüz kayıt olan yok.</div>}
                    </div>
                    
                    <div className="bg-[#061414] p-6 rounded-[2rem]">
                       <h4 className="font-black text-[#bcff00] mb-4">{t.waitlist} ({(cls.waitlist || []).length})</h4>
                       <div className="space-y-2">
                          {(cls.waitlist || []).map(wId => {
                            const m = members.find(x => String(x.id) === String(wId));
                            return <div key={wId} className="text-white font-bold bg-white/10 p-3 rounded-xl border border-white/5">- {m ? m.name : 'Bilinmiyor'}</div>;
                          })}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ANALYSIS TAB (YENİ VE DİNAMİK) */}
          {activeTab === 'analysis' && (
             <div className="space-y-6">
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-[#d2d3ce] shadow-sm">
                  <h2 className="text-3xl font-black text-[#061414] mb-2">{t.analysisTab}</h2>
                  <p className="text-[#96998c] font-bold mb-10">Gerçek zamanlı salon verileri.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#f8f9f7] p-6 rounded-3xl border border-[#d2d3ce] text-center">
                       <div className="text-4xl font-black text-[#bcff00] drop-shadow-sm mb-2">%{occupancyRate}</div>
                       <div className="text-[#061414] font-black text-sm uppercase">Genel Doluluk</div>
                    </div>
                    <div className="bg-[#f8f9f7] p-6 rounded-3xl border border-[#d2d3ce] text-center">
                       <div className="text-4xl font-black text-[#061414] mb-2">{totalCapacity}</div>
                       <div className="text-[#96998c] font-bold text-sm uppercase">Toplam Kontenjan</div>
                    </div>
                    <div className="bg-[#f8f9f7] p-6 rounded-3xl border border-[#d2d3ce] text-center">
                       <div className="text-4xl font-black text-[#061414] mb-2">{totalEnrolled}</div>
                       <div className="text-[#96998c] font-bold text-sm uppercase">Dolu Koltuk</div>
                    </div>
                  </div>

                  <h3 className="font-black text-[#061414] text-xl mb-4">Cinsiyet Dağılımı</h3>
                  <div className="flex h-12 rounded-2xl overflow-hidden border border-[#d2d3ce]">
                    <div className="bg-[#061414] flex items-center justify-center text-[#bcff00] font-black text-sm transition-all" style={{ width: `${members.length > 0 ? (maleCount/members.length)*100 : 50}%` }}>
                      {maleCount} {t.male}
                    </div>
                    <div className="bg-[#bcff00] flex items-center justify-center text-[#061414] font-black text-sm transition-all" style={{ width: `${members.length > 0 ? (femaleCount/members.length)*100 : 50}%` }}>
                      {femaleCount} {t.female}
                    </div>
                  </div>
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
