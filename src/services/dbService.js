import { supabase } from '../config/supabase';

// 1. KULLANICI EKLEME
export const addMemberToDB = async (memberData) => {
  let initialCredits = 8; 
  if(memberData.package === 'pack16') initialCredits = 16;
  if(memberData.package === 'pack24') initialCredits = 24;

  try {
    const { data, error } = await supabase.from('members').insert([{
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone,
      gender: memberData.gender,
      age: parseInt(memberData.age),
      allowNotifications: memberData.allowNotifications,
      membershipType: memberData.package,
      credits: initialCredits,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      absentCount: 0
    }]).select();
    
    if (error) throw error;
    return data[0].id;
  } catch (error) {
    console.error("Veritabanı hatası:", error);
    throw error;
  }
};

// 2. ÜYE DERSE KATILMA
export const enrollInClass = async (classId, memberId, isSuspended) => {
  if (isSuspended) return { success: false, message: "Hesabınız askıya alınmış!" };

  try {
    const { data: member } = await supabase.from('members').select('credits').eq('id', memberId).single();
    if (!member || member.credits <= 0) {
      throw new Error("Yetersiz jeton! Lütfen paket yenileyin.");
    }

    const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (!cls) throw new Error("Ders bulunamadı.");

    const enrolled = cls.enrolled || [];
    const waitlist = cls.waitlist || [];

    if (enrolled.includes(memberId) || waitlist.includes(memberId)) {
      throw new Error("Zaten bu derse kayıtlısınız.");
    }

    if (enrolled.length < cls.capacity) {
      enrolled.push(memberId);
      await supabase.from('classes').update({ enrolled }).eq('id', classId);
    } else {
      waitlist.push(memberId);
      await supabase.from('classes').update({ waitlist }).eq('id', classId);
    }

    await supabase.from('members').update({ credits: member.credits - 1 }).eq('id', memberId);

    return { success: true, message: "İşlem başarılı!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 3. İPTAL KONTROLÜ
export const cancelClassByMember = async (classId, memberId, classTimeStr) => {
  const now = new Date();
  const [hours, minutes] = classTimeStr.split(':');
  const classTime = new Date();
  classTime.setHours(parseInt(hours), parseInt(minutes), 0);

  const diffInHours = (classTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffInHours > 0 && diffInHours < 2) {
    return { success: false, message: "Derse 2 saatten az kaldığı için iptal edilemez!" };
  }

  return await dropMemberAndTriggerWaitlist(classId, memberId);
};

// 4. KONTENJAN TETİKLEYİCİSİ VE JETON İADESİ
export const dropMemberAndTriggerWaitlist = async (classId, memberIdToDrop) => {
  try {
    const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).single();
    
    let enrolled = cls.enrolled || [];
    let waitlist = cls.waitlist || [];
    let promotedUserId = null;

    enrolled = enrolled.filter(id => id !== memberIdToDrop);
    waitlist = waitlist.filter(id => id !== memberIdToDrop);

    if (cls.enrolled.includes(memberIdToDrop) && waitlist.length > 0) {
      promotedUserId = waitlist.shift(); 
      enrolled.push(promotedUserId);     
    }

    await supabase.from('classes').update({ enrolled, waitlist }).eq('id', classId);

    const { data: droppedMember } = await supabase.from('members').select('credits').eq('id', memberIdToDrop).single();
    if (droppedMember) {
      await supabase.from('members').update({ credits: droppedMember.credits + 1 }).eq('id', memberIdToDrop);
    }

    if (promotedUserId) {
      await supabase.from('notifications').insert([{
        memberId: promotedUserId,
        message: `Müjde! Kontenjan açıldı. ${cls.name} dersine otomatik olarak eklendiniz.`,
        date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        read: false
      }]);
    }
    return { success: true, message: "İptal/Çıkarma işlemi başarılı." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "İşlem başarısız oldu." };
  }
};

// 5. YOKLAMA VE CEZA
export const markAttendance = async (memberId, isPresent) => {
  try {
    if (!isPresent) {
      const { data: member } = await supabase.from('members').select('*').eq('id', memberId).single();
      const newAbsentCount = (member.absentCount || 0) + 1;
      
      let newStatus = member.status;
      if (newAbsentCount >= 3) {
        newStatus = 'suspended';
        await supabase.from('notifications').insert([{
          memberId: memberId,
          message: `DİKKAT: Devamsızlık sınırını aştığınız için hesabınız askıya alındı.`,
          date: new Date().toLocaleTimeString('tr-TR'),
          read: false
        }]);
      }
      await supabase.from('members').update({ absentCount: newAbsentCount, status: newStatus }).eq('id', memberId);
    }
    return true;
  } catch (error) {
    return false;
  }
};

// 6. YENİ DERS EKLEME
export const addClassToDB = async (classData) => {
  try {
    const { data, error } = await supabase.from('classes').insert([{
      name: classData.name,
      time: classData.time,
      capacity: parseInt(classData.capacity),
      enrolled: [],
      waitlist: []
    }]).select();
    
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 7. VERİ ANALİZİ
export const analyzeDensityPrediction = async () => {
    const historicalData = [
      { time: '08:00', avgCount: 15, maxCapacity: 50 },
      { time: '10:00', avgCount: 22, maxCapacity: 50 },
      { time: '12:00', avgCount: 30, maxCapacity: 50 },
      { time: '14:00', avgCount: 20, maxCapacity: 50 },
      { time: '16:00', avgCount: 38, maxCapacity: 50 },
      { time: '18:00', avgCount: 49, maxCapacity: 50 },
      { time: '20:00', avgCount: 42, maxCapacity: 50 },
    ];
    return historicalData.map(data => {
      const densityPercent = Math.round((data.avgCount / data.maxCapacity) * 100);
      let category = 'Sakin';
      if(densityPercent > 80) category = 'Çok Yoğun';
      else if(densityPercent > 50) category = 'Normal';
      return { time: data.time, density: densityPercent, category: category };
    });
};

// 8. YÖNETİCİ JETON GÜNCELLEME
export const updateMemberCredits = async (memberId, newCredits) => {
  try {
    const { error } = await supabase.from('members').update({ credits: newCredits }).eq('id', memberId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 9. DERSİ SİL VE KAYITLILARA JETON İADE ET
export const deleteClassAndRefund = async (classId) => {
  try {
    // Önce dersi bul
    const { data: cls } = await supabase.from('classes').select('enrolled').eq('id', classId).single();
    
    // Eğer derse kayıtlı birileri varsa, jetonlarını geri ver
    if (cls && cls.enrolled && cls.enrolled.length > 0) {
      for (const memberId of cls.enrolled) {
        const { data: member } = await supabase.from('members').select('credits').eq('id', memberId).single();
        if (member) {
          await supabase.from('members').update({ credits: member.credits + 1 }).eq('id', memberId);
        }
      }
    }

    // Dersi tamamen sil
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Silme hatası:", error);
    return { success: false, message: error.message };
  }
};
// 10. ÜYEYİ SİL VE DERS LİSTELERİNDEN TEMİZLE
export const deleteMemberFromDB = async (memberId) => {
  try {
    // 1. Önce tüm dersleri kontrol et ve bu üyeyi listelerden çıkar
    const { data: classes } = await supabase.from('classes').select('*');
    
    for (const cls of classes) {
      const updatedEnrolled = (cls.enrolled || []).filter(id => id !== memberId);
      const updatedWaitlist = (cls.waitlist || []).filter(id => id !== memberId);
      
      // Eğer üye bu dersteyse listeyi güncelle
      if (updatedEnrolled.length !== (cls.enrolled || []).length || 
          updatedWaitlist.length !== (cls.waitlist || []).length) {
        await supabase.from('classes').update({ 
          enrolled: updatedEnrolled, 
          waitlist: updatedWaitlist 
        }).eq('id', cls.id);
      }
    }

    // 2. Üyeye ait bildirimleri sil (Foreign Key hatası almamak için)
    await supabase.from('notifications').delete().eq('memberId', memberId);

    // 3. Üyeyi ana tablodan sil
    const { error } = await supabase.from('members').delete().eq('id', memberId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Uye silme hatasi:", error);
    return { success: false, message: error.message };
  }
};
