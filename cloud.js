(() => {
  let client = null;
  let session = null;
  let lastAuthEvent = null;
  let realtimeChannel = null;
  let refreshTimer = null;

  const cfg = () => {
    let saved={};
    try{ saved=JSON.parse(localStorage.getItem('mayo2026CloudConfig')||'{}'); }catch(_e){}
    return {...(window.MAYO_CONFIG||{}),...saved};
  };
  const configured = () => {
    const c = cfg();
    return Boolean(c.supabaseUrl && c.supabasePublishableKey);
  };
  async function ensureLibrary(){
    if(window.supabase?.createClient) return;
    await new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-mayo-supabase]');
      if(existing){ existing.addEventListener('load',resolve,{once:true}); existing.addEventListener('error',()=>reject(new Error('Could not load Supabase library.')),{once:true}); return; }
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.dataset.mayoSupabase='1';
      s.onload=resolve; s.onerror=()=>reject(new Error('Could not load Supabase library. Check the internet connection.'));
      document.head.appendChild(s);
    });
  }
  const wantsCloud = () => cfg().dataMode === 'supabase' || (cfg().dataMode === 'auto' && configured());

  function formatDateTime(iso) {
    if (!iso) return {date:'',time:''};
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(d);
    const time = new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(d);
    return {date,time};
  }
  function formatRange(start,end) {
    if (!start) return '';
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    const fmt = x => new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(x);
    return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
  }
  function messageTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(d);
    return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(d);
  }
  function initials(name='') { return name.split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase(); }

  async function init() {
    if (!wantsCloud()) return {mode:'local', configured:configured(), session:null};
    if (!configured()) return {mode:'local', configured:false, session:null, warning:'Supabase is selected but not configured.'};
    await ensureLibrary();
    client = window.supabase.createClient(cfg().supabaseUrl, cfg().supabasePublishableKey, {
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    const {data,error} = await client.auth.getSession();
    if (error) throw error;
    session = data.session;
    client.auth.onAuthStateChange((event,newSession)=>{lastAuthEvent=event;session=newSession; window.dispatchEvent(new CustomEvent('mayo-auth-changed',{detail:{event,session:newSession}}));});
    return {mode:'supabase', configured:true, session};
  }

  async function sendMagicLink(email) {
    if (!client) throw new Error('Supabase is not configured.');
    const redirect = cfg().authRedirectUrl || window.location.href.split('#')[0].split('?')[0];
    const {error} = await client.auth.signInWithOtp({email,options:{emailRedirectTo:redirect}});
    if (error) throw error;
  }
  async function signInWithPassword(email,password) {
    if (!client) throw new Error('Supabase is not configured.');
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error) throw error;
    session=data.session;
    return data.session;
  }
  async function requestPasswordReset(email) {
    if (!client) throw new Error('Supabase is not configured.');
    const redirect = cfg().authRedirectUrl || window.location.href.split('#')[0].split('?')[0];
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect});
    if(error) throw error;
  }
  async function updatePassword(password) {
    if (!client) throw new Error('Supabase is not configured.');
    const {data,error}=await client.auth.updateUser({password});
    if(error) throw error;
    return data.user;
  }
  async function signUpWithPassword({email,password,fullName,organization=''}) {
    if (!client) throw new Error('Supabase is not configured.');
    const redirect = cfg().authRedirectUrl || window.location.href.split('#')[0].split('?')[0];
    const {data,error}=await client.auth.signUp({
      email,
      password,
      options:{
        emailRedirectTo:redirect,
        data:{full_name:fullName||'',organization:organization||''}
      }
    });
    if(error) throw error;
    session=data.session || null;
    return data;
  }
  async function signOut() {
    if (!client) return;
    const {error} = await client.auth.signOut();
    if (error) throw error;
    session = null;
  }
  async function getSession() {
    if (!client) return null;
    const {data,error}=await client.auth.getSession();
    if (error) throw error;
    session=data.session;
    return session;
  }

  async function loadState(seed) {
    if (!client || !session?.user) throw new Error('Not signed in.');
    const uid=session.user.id;
    const [profilesR, membershipsR, scheduleR, missionsR, completionsR, leaderboardR, teamLeaderboardR, kudosR, bookmarksR, announcementsR, readsR, convMembersR, pollsR, pollOptionsR, pollVotesR] = await Promise.all([
      client.from('profiles').select('id,full_name,organization,title,interests,bio,role,avatar_url').order('full_name'),
      client.from('team_members').select('profile_id,team_id,teams(id,name)'),
      client.from('schedule_events').select('*').order('starts_at'),
      client.from('missions').select('*').order('created_at'),
      client.from('mission_completions').select('mission_id,status,completed_at').eq('profile_id',uid),
      client.rpc('get_leaderboard'),
      client.rpc('get_team_leaderboard'),
      client.from('kudos').select('id,from_profile_id,to_profile_id,text,created_at').order('created_at',{ascending:false}),
      client.from('schedule_bookmarks').select('event_id').eq('profile_id',uid),
      client.from('announcements').select('*').order('created_at',{ascending:false}),
      client.from('announcement_reads').select('announcement_id,read_at').eq('profile_id',uid),
      client.from('conversation_members').select('conversation_id,last_read_at,conversations(id,conversation_type,title,team_id,created_at)').eq('profile_id',uid),
      client.from('polls').select('id,question,is_open,created_at').eq('is_open',true).order('created_at',{ascending:false}),
      client.from('poll_options').select('id,poll_id,label'),
      client.from('poll_votes').select('poll_id,option_id,profile_id')
    ]);
    const errors=[profilesR,membershipsR,scheduleR,missionsR,completionsR,leaderboardR,teamLeaderboardR,kudosR,announcementsR,readsR,convMembersR,pollsR,pollOptionsR,pollVotesR].map(x=>x.error).filter(Boolean);
    if(bookmarksR.error) console.warn('Schedule bookmarks are not enabled yet:',bookmarksR.error.message);
    if(errors.length) throw errors[0];

    const teamByProfile={};
    const teamIdByProfile={};
    (membershipsR.data||[]).forEach(m=>{teamByProfile[m.profile_id]=m.teams?.name||'';teamIdByProfile[m.profile_id]=m.team_id;});
    const people=(profilesR.data||[]).map(p=>({
      id:p.id,name:p.full_name,initials:initials(p.full_name),org:p.organization||'',title:p.title||'',interests:p.interests||'',team:teamByProfile[p.id]||'',bio:p.bio||'',role:p.role,avatarUrl:p.avatar_url||''
    }));
    const me=people.find(p=>p.id===uid);
    const completed=new Map((completionsR.data||[]).map(c=>[c.mission_id,c.status]));
    const schedule=(scheduleR.data||[]).map(e=>{
      const dt=formatDateTime(e.starts_at);
      return {id:e.id,date:dt.date,time:formatRange(e.starts_at,e.ends_at),title:e.title,location:e.location||'',locationUrl:e.location_url||'',type:'session',details:e.description||'',attachmentUrl:e.attachment_url||'',startsAt:e.starts_at,endsAt:e.ends_at};
    });
    const missions=(missionsR.data||[]).map(m=>({id:m.id,title:m.title,description:m.description||'',category:m.category,points:m.points,icon:m.category==='Connect'?'👥':m.category==='Stretch'?'🙋':m.category==='Contribute'?'🤝':'⭐',done:completed.get(m.id)==='approved',status:completed.get(m.id)||null,requiresApproval:m.requires_admin_approval}));
    const points={};
    (leaderboardR.data||[]).forEach(r=>{points[r.id]=r.points||0;});
    const teamLeaderboard=(teamLeaderboardR.data||[]).map(r=>({id:r.team_id,name:r.team_name,points:r.points||0}));
    const kudos=(kudosR.data||[]).map(k=>({id:k.id,from:k.from_profile_id,to:k.to_profile_id,text:k.text,createdAt:k.created_at}));
    const bookmarkedEventIds=(bookmarksR.data||[]).map(r=>r.event_id);

    const readSet=new Set((readsR.data||[]).map(r=>r.announcement_id));
    const announcements=(announcementsR.data||[]).map(a=>({id:a.id,title:a.title,text:a.body,ts:messageTime(a.created_at),createdAt:a.created_at}));
    const unread={announcements:announcements.filter(a=>!readSet.has(a.id)).length,team:0};
    const direct={};
    let team=[];
    const conversations=[];
    for (const cm of (convMembersR.data||[])) {
      const conv=cm.conversations;
      if(!conv) continue;
      const {data:members,error:memberErr}=await client.from('conversation_members').select('profile_id').eq('conversation_id',conv.id);
      if(memberErr) throw memberErr;
      const {data:msgs,error:msgErr}=await client.from('messages').select('id,sender_id,body,created_at').eq('conversation_id',conv.id).order('created_at');
      if(msgErr) throw msgErr;
      const mapped=(msgs||[]).map(m=>({id:m.id,from:m.sender_id,text:m.body,ts:messageTime(m.created_at),createdAt:m.created_at}));
      const unreadCount=(msgs||[]).filter(m=>m.sender_id!==uid && (!cm.last_read_at || new Date(m.created_at)>new Date(cm.last_read_at))).length;
      if(conv.conversation_type==='team') { team=mapped; unread.team+=unreadCount; conversations.push({id:conv.id,type:'team'}); }
      else {
        const other=(members||[]).map(x=>x.profile_id).find(x=>x!==uid);
        if(other){ direct[other]=mapped; unread[other]=unreadCount; conversations.push({id:conv.id,type:'direct',otherId:other}); }
      }
    }

    const polls=(pollsR.data||[]).map(p=>({
      id:p.id,question:p.question,isOpen:p.is_open,
      options:(pollOptionsR.data||[]).filter(o=>o.poll_id===p.id).map(o=>({id:o.id,label:o.label,votes:(pollVotesR.data||[]).filter(v=>v.option_id===o.id).length})),
      myVote:(pollVotesR.data||[]).find(v=>v.poll_id===p.id&&v.profile_id===uid)?.option_id||null
    }));

    return {
      ...structuredClone(seed),
      currentUserId:uid,
      role:me?.role||'participant',
      people,schedule,missions,points,polls,kudos,teamLeaderboard,bookmarkedEventIds,
      messages:{direct,team,announcements},unread,
      cloud:{conversations,teamId:teamIdByProfile[uid]||null}
    };
  }

  async function completeMission(missionId) {
    const {data,error}=await client.rpc('complete_mission',{target_mission:missionId});
    if(error) throw error;
    return data;
  }
  async function sendMessage(type,otherId,text) {
    let convId;
    if(type==='team') {
      const {data,error}=await client.rpc('ensure_team_conversation'); if(error) throw error; convId=data;
    } else {
      const {data,error}=await client.rpc('ensure_direct_conversation',{other_profile:otherId}); if(error) throw error; convId=data;
    }
    const {error}=await client.from('messages').insert({conversation_id:convId,sender_id:session.user.id,body:text});
    if(error) throw error;
    await client.from('conversation_members').update({last_read_at:new Date().toISOString()}).eq('conversation_id',convId).eq('profile_id',session.user.id);
  }
  async function markConversationRead(convId) {
    if(!convId) return;
    await client.from('conversation_members').update({last_read_at:new Date().toISOString()}).eq('conversation_id',convId).eq('profile_id',session.user.id);
  }
  async function markAnnouncementsRead(ids) {
    if(!ids?.length) return;
    const rows=ids.map(id=>({announcement_id:id,profile_id:session.user.id,read_at:new Date().toISOString()}));
    const {error}=await client.from('announcement_reads').upsert(rows,{onConflict:'announcement_id,profile_id'}); if(error) throw error;
  }
  async function createAnnouncement(title,body) {
    const {error}=await client.from('announcements').insert({title,body,created_by:session.user.id}); if(error) throw error;
  }
  async function createMission({title,category,points}) {
    const {error}=await client.from('missions').insert({title,category,points,created_by:session.user.id}); if(error) throw error;
  }
  async function votePoll(pollId,optionId) {
    const {error}=await client.from('poll_votes').upsert({poll_id:pollId,option_id:optionId,profile_id:session.user.id},{onConflict:'poll_id,profile_id'}); if(error) throw error;
  }
  async function createSchedule({title,startsAt,endsAt,location,description}) {
    const {error}=await client.from('schedule_events').insert({title,starts_at:startsAt,ends_at:endsAt||null,location,description:description||'',created_by:session.user.id}); if(error) throw error;
  }
  async function updateProfile({fullName,organization,title,interests,bio}) {
    const {error}=await client.from('profiles').update({full_name:fullName,organization,title,interests,bio}).eq('id',session.user.id);
    if(error) throw error;
  }
  async function giveKudos(toProfileId,text) {
    const {error}=await client.from('kudos').insert({from_profile_id:session.user.id,to_profile_id:toProfileId,text});
    if(error) throw error;
  }
  async function toggleScheduleBookmark(eventId,isBookmarked) {
    if(isBookmarked){
      const {error}=await client.from('schedule_bookmarks').delete().eq('profile_id',session.user.id).eq('event_id',eventId);
      if(error) throw error;
      return false;
    }
    const {error}=await client.from('schedule_bookmarks').insert({profile_id:session.user.id,event_id:eventId});
    if(error) throw error;
    return true;
  }
  async function createPoll(question,options) {
    const {data,error}=await client.from('polls').insert({question,is_open:true,created_by:session.user.id}).select('id').single();
    if(error) throw error;
    const rows=(options||[]).map(label=>({poll_id:data.id,label}));
    if(rows.length){
      const {error:optionError}=await client.from('poll_options').insert(rows);
      if(optionError) throw optionError;
    }
    return data.id;
  }

  function subscribe(onChange) {
    if(!client || !session?.user) return;
    if(realtimeChannel) client.removeChannel(realtimeChannel);
    const trigger=()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>onChange?.(),350);};
    realtimeChannel=client.channel(`mayo-beta-${session.user.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'messages'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'announcements'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'points_ledger'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'mission_completions'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'schedule_events'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'missions'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'poll_votes'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'polls'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'poll_options'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'kudos'},trigger)
      .on('postgres_changes',{event:'*',schema:'public',table:'schedule_bookmarks'},trigger)
      .subscribe();
  }

  function saveConfig(values){
    localStorage.setItem('mayo2026CloudConfig',JSON.stringify({dataMode:'supabase',supabaseUrl:(values.supabaseUrl||'').trim(),supabasePublishableKey:(values.supabasePublishableKey||'').trim(),authRedirectUrl:(values.authRedirectUrl||'').trim()}));
  }
  function clearConfig(){ localStorage.removeItem('mayo2026CloudConfig'); }
  function getConfig(){ return cfg(); }

  window.MayoCloud={
    configured,wantsCloud,init,sendMagicLink,signInWithPassword,requestPasswordReset,updatePassword,signUpWithPassword,signOut,getSession,loadState,completeMission,sendMessage,markConversationRead,markAnnouncementsRead,createAnnouncement,createMission,createSchedule,updateProfile,giveKudos,toggleScheduleBookmark,createPoll,votePoll,subscribe,
    saveConfig,clearConfig,getConfig,
    get client(){return client;},get session(){return session;},get lastAuthEvent(){return lastAuthEvent;}
  };
})();
