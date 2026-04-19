import React, { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { supabase } from '../config/supabase';
import { 
  addMemberToDB, 
  dropMemberAndTriggerWaitlist, 
  analyzeDensityPrediction, 
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
  const [densityData, setDensityData] = useState([]);
  
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
    const mSub = supabase.channel('m-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, loadData).subscribe();
    const cSub = supabase.channel('c-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, loadData).subscribe();
    return () => { supabase.removeChannel(mSub); supabase.removeChannel(cSub); };
  }, []);

  useEffect(() => {
    if (activeTab === 'analysis') analyzeDensityPrediction().then(setDensityData);
  }, [activeTab]);

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      await addMemberToDB(newMember);
      setNewMember({ name: '', email: '', phone: '', gender: 'male', age: '', allowNotifications: true, package: 'pack8' });
      await loadData();
      alert("Uye Kaydedildi.");
    } catch (err) { alert("Hata: " + err.message); }
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    const res = await addClassToDB(newClass);
    if(res.success) {
      setNewClass({ name: '', time: '', capacity: '' });
      await loadData();
      alert("Ders Olusturuldu.");
    }
  };

  const handleDeleteMember = async (id) => {
    if (confirm("Bu uyeyi silmek istediginize emin misiniz?")) {
      const res = await deleteMemberFromDB(id);
      if (res.success) { await loadData(); alert("Uye silindi."); }
    }
  };

  const handleDeleteClass = async (id) => {
    if (confirm("Bu dersi silmek istediginize emin misiniz?")) {
      const res = await deleteClassAndRefund(id);
      if (res.success) { await loadData(); alert("Ders silindi."); }
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

  const navClass = (tab) => `flex items-center gap-3 px-4 py-4 rounded-2xl font-bold w-full text-left transition-all ${activeTab === tab ? 'bg-[#bcff00] text-[#061414]' : 'text-[#96998c] hover:text-[#bcff00]'}`;

  return (
    <div className="min-h-screen bg-[#e9ebe6] flex relative">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#061414] p-6 transform transition-transform md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10 text-[#bcff00]"><Icons.Dumbbell /><button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden"><Icons.Close /></button></div>
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
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-10 rounded-[2.5rem] border border-[#d2d3ce] text-center">
                <div className="text-5xl font-black">{members.length}</div>
                <div className="text-[#96998c] font-bold text-xs uppercase mt-2">Toplam Uye</div>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-[#d2d3ce] text-center">
                <div className="text-5xl font-black">{classes.length}</div>
                <div className="text-[#96998c] font-bold text-xs uppercase mt-2">Aktif Ders</div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-[#d2d3ce]">
                <h3 className="text-2xl font-black mb-8">{t.addMemberTitle}</h3>
                <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t.nameInput} value={newMember.name} onChange={e=>setNewMember({...newMember, name: e.target.value})} className="border-2 p-4 rounded-2xl outline-none font-bold" required/>
                    <input type="email" placeholder={t.email} value={newMember.email} onChange={e=>setNewMember({...newMember, email: e.target.value})} className="border-2 p-4 rounded-2xl outline-none font-bold" required/>
                    <input type="text" placeholder={t.phoneInput} value={newMember.phone} onChange={e=>setNewMember({...newMember, phone: e.target.value})} className="border-2 p-4 rounded-2xl outline-none font-bold" required/>
                    <input type="number" placeholder={t.age} value={newMember.age} onChange={e=>setNewMember({...newMember, age: e.target.value})} className="border-2 p-4 rounded-2xl outline-none font-bold" required/>
                    <select value={newMember.package} onChange={e=>setNewMember({...newMember, package: e.target.value})} className="border-2 p-4 rounded-2xl outline-none font-bold bg-white">
                      <option value="pack8">{t.pack8}</option><option value="pack16">{t.pack16}</option><option value="pack24">{t.pack24}</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#061414] text-[#bcff00] py-5 rounded-2xl font-black text-lg">{t.addMemberBtn}</button>
                </form>
              </div>
              <div className="space-y-4">
                {members.map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-[#d2d3ce] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="font-black text-xl">{m.name}</div>
                      <div className="text-[#96998c] font-bold text-sm">{m.email} • {m.phone}</div>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="bg-[#061414] text-white px-4 py-2 rounded-xl text-sm font-black">{m.credits || 0} Jeton</span>
                        <button onClick={() => handleCreditChange(m.id, m.credits, -1)} className="border-2 w-10 h-10 rounded-xl font-black">-</button>
                        <button onClick={() => handleCreditChange(m.id, m.credits, 1)} className="border-2 w-10 h-10 rounded-xl font-black">+</button>
                        <button onClick={() => handleDeleteMember(m.id)} className="ml-4 text-red-500 p-2"><Icons.Trash /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-[#d2d3ce]">
                <form onSubmit={handleAddClassSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="Ders Adi" value={newClass.name} onChange={e=>setNewClass({...newClass, name: e.target.value})} className="border-2 p-4 rounded-2xl font-bold" required/>
                  <input type="time" value={newClass.time} onChange={e=>setNewClass({...newClass, time: e.target.value})} className="border-2 p-4 rounded-2xl font-bold" required/>
                  <input type="number" placeholder="Kontenjan" value={newClass.capacity} onChange={e=>setNewClass({...newClass, capacity: e.target.value})} className="border-2 p-4 rounded-2xl font-bold" required/>
                  <button type="submit" className="bg-[#061414] text-[#bcff00] rounded-2xl font-black">Olustur</button>
                </form>
              </div>
              {classes.map(cls => (
                <div key={cls.id} className="bg-white p-8 rounded-[2.5rem] border border-[#d2d3ce] relative">
                  <div className="flex justify-between items-start mb-8">
                    <div><h3 className="text-3xl font-black">{cls.name}</h3><p className="text-[#96998c] font-black uppercase text-sm">{cls.time} • { (cls.enrolled || []).length }/{cls.capacity}</p></div>
                    <button onClick={() => handleDeleteClass(cls.id)} className="text-red-500 p-4 bg-red-50 rounded-2xl"><Icons.Trash /></button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      {(cls.enrolled || []).map(mId => {
                        const m = members.find(x => x.id === mId) || { name: mId };
                        return (
                          <div key={mId} className="flex justify-between items-center bg-[#f8f9f7] p-5 rounded-3xl border">
                            <span className="font-black">{m.name}</span>
                            <div className="flex gap-2">
                              <button onClick={() => handleAttendance(mId, cls.id, true)} className="bg-green-100 text-green-700 px-3 py-1 rounded-xl text-xs font-black">GELDI</button>
                              <button onClick={() => handleAttendance(mId, cls.id, false)} className="bg-red-100 text-red-700 px-3 py-1 rounded-xl text-xs font-black">GELMEDI</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
