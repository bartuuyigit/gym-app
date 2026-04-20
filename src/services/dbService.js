import { supabase } from '../config/supabase';

export const enrollInClass = async (classId, memberId, isSuspended) => {
  if (isSuspended) return { success: false, message: "Suspended!" };
  try {
    const { data: member } = await supabase.from('members').select('credits').eq('id', memberId).single();
    if (!member || (member.credits || 0) <= 0) return { success: false, message: "Insufficient credits!" };
    
    const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).single();
    let enrolled = cls.enrolled || [];
    let waitlist = cls.waitlist || [];

    const strMemberId = String(memberId);
    const isEnrolled = enrolled.some(id => String(id) === strMemberId);
    const isWaitlisted = waitlist.some(id => String(id) === strMemberId);

    if (isEnrolled || isWaitlisted) return { success: false };

    if (enrolled.length < cls.capacity) {
      enrolled.push(memberId);
      enrolled = [...new Set(enrolled.map(String))];
      await supabase.from('classes').update({ enrolled }).eq('id', classId);
    } else {
      waitlist.push(memberId);
      waitlist = [...new Set(waitlist.map(String))];
      await supabase.from('classes').update({ waitlist }).eq('id', classId);
    }
    
    await supabase.from('members').update({ credits: member.credits - 1 }).eq('id', memberId);
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const dropMemberAndTriggerWaitlist = async (classId, memberIdToDrop) => {
  try {
    const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).single();
    let enrolled = cls.enrolled || [];
    let waitlist = cls.waitlist || [];
    
    const strMemberIdToDrop = String(memberIdToDrop);
    const wasEnrolled = enrolled.some(id => String(id) === strMemberIdToDrop);
    
    enrolled = enrolled.filter(id => String(id) !== strMemberIdToDrop);
    waitlist = waitlist.filter(id => String(id) !== strMemberIdToDrop);
    
    if (wasEnrolled && waitlist.length > 0) {
      enrolled.push(waitlist.shift());
      enrolled = [...new Set(enrolled.map(String))];
    }
    
    await supabase.from('classes').update({ enrolled, waitlist }).eq('id', classId);
    const { data: m } = await supabase.from('members').select('credits').eq('id', memberIdToDrop).single();
    await supabase.from('members').update({ credits: (m.credits || 0) + 1 }).eq('id', memberIdToDrop);
    return { success: true };
  } catch (err) { return { success: false }; }
};

export const cancelClassByMember = async (classId, memberId) => {
  return await dropMemberAndTriggerWaitlist(classId, memberId);
};

export const addMemberToDB = async (m) => {
  const credits = m.package === 'pack24' ? 24 : m.package === 'pack16' ? 16 : 8;
  const { data, error } = await supabase.from('members').insert([{
    ...m, credits, membershipType: m.package, status: 'active', absentCount: 0, startDate: new Date().toISOString().split('T')[0]
  }]).select();
  if (error) throw error;
  return data[0].id;
};

export const deleteClassAndRefund = async (id) => {
  const { data: cls } = await supabase.from('classes').select('enrolled').eq('id', id).single();
  if (cls?.enrolled) {
    for (const mId of cls.enrolled) {
      const { data: m } = await supabase.from('members').select('credits').eq('id', mId).single();
      await supabase.from('members').update({ credits: (m.credits || 0) + 1 }).eq('id', mId);
    }
  }
  return await supabase.from('classes').delete().eq('id', id);
};

export const deleteMemberFromDB = async (id) => {
  const { data: classes } = await supabase.from('classes').select('*');
  for (const cls of classes) {
    const enrolled = (cls.enrolled || []).filter(mId => String(mId) !== String(id));
    const waitlist = (cls.waitlist || []).filter(mId => String(mId) !== String(id));
    await supabase.from('classes').update({ enrolled, waitlist }).eq('id', cls.id);
  }
  await supabase.from('notifications').delete().eq('memberId', id);
  return await supabase.from('members').delete().eq('id', id);
};

export const markAttendance = async (mId, present) => {
  if (!present) {
    const { data: m } = await supabase.from('members').select('absentCount').eq('id', mId).single();
    const count = (m.absentCount || 0) + 1;
    await supabase.from('members').update({ absentCount: count, status: count >= 3 ? 'suspended' : 'active' }).eq('id', mId);
  }
};

// YENİ EKLENEN: CEZA KALDIRMA FONKSİYONU
export const liftSuspension = async (memberId) => {
  try {
    const { error } = await supabase.from('members').update({ status: 'active', absentCount: 0 }).eq('id', memberId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false };
  }
};

export const addClassToDB = async (c) => await supabase.from('classes').insert([{...c, enrolled:[], waitlist:[]}]).select();
export const updateMemberCredits = async (id, c) => await supabase.from('members').update({ credits: c }).eq('id', id);
export const analyzeDensityPrediction = async () => [
  { time: '08:00', density: 20 }, { time: '12:00', density: 50 }, { time: '18:00', density: 90 }, { time: '20:00', density: 40 }
];
