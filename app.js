const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const seed = {
  currentUserId: 'p1', role: 'participant',
  people: [
    {id:'p1',name:'Yuki Sato',initials:'YS',org:'PlanEx / Mayo 2026',title:'Participant',interests:'Medtech, AI, Business',team:'Alpha',bio:'Interested in connecting people and turning ideas into action.'},
    {id:'p2',name:'Alex Tan',initials:'AT',org:'Mayo Clinic',title:'Cardiology',interests:'Innovation, Running',team:'Alpha',bio:'Cardiologist interested in practical healthcare innovation.'},
    {id:'p3',name:'Maria Lopez',initials:'ML',org:'University of Tokyo',title:'Public Health',interests:'Global Health, Travel',team:'Alpha',bio:'Working on health equity and better access to care.'},
    {id:'p4',name:'Kenji Tanaka',initials:'KT',org:'Kyoto University',title:'Surgery',interests:'AI, Photography',team:'Beta',bio:'Exploring how technology can improve surgical care.'},
    {id:'p5',name:'Sarah Wilson',initials:'SW',org:'Johns Hopkins University',title:'Oncology',interests:'Hiking, Music',team:'Beta',bio:'Interested in patient-centered cancer care and collaboration.'},
    {id:'p6',name:'Priya Kumar',initials:'PK',org:'Stanford University',title:'Pediatrics',interests:'Education, Food',team:'Beta',bio:'Pediatrician focused on education and interdisciplinary teams.'},
    {id:'p7',name:'Daniel Miller',initials:'DM',org:'MedTech Startup',title:'Founder',interests:'Devices, Cycling',team:'Gamma',bio:'Building tools that simplify care delivery.'},
    {id:'p8',name:'Aiko Mori',initials:'AM',org:'Osaka University',title:'Researcher',interests:'Diagnostics, Coffee',team:'Gamma',bio:'Researcher focused on point-of-care diagnostics.'}
  ],
  schedule: [
    {id:'e1',date:'Mon, Sep 14, 2026',time:'8:00 AM – 8:45 AM',title:'Breakfast',location:'Main Dining Area',type:'meal',details:'Casual breakfast and arrival.'},
    {id:'e2',date:'Mon, Sep 14, 2026',time:'9:00 AM – 10:00 AM',title:'Opening Session',location:'Plummer Building – Auditorium',type:'session',details:'Program opening, orientation, and introductions.'},
    {id:'e3',date:'Mon, Sep 14, 2026',time:'10:00 AM – 11:00 AM',title:'Mayo Clinic Tour',location:'Gonda Building – 1st Floor',type:'tour',details:'Guided tour of Mayo Clinic facilities. Meet at Gonda Building lobby.'},
    {id:'e4',date:'Mon, Sep 14, 2026',time:'12:00 PM – 1:00 PM',title:'Lunch',location:'Discovery Square',type:'meal',details:'Group lunch.'},
    {id:'e5',date:'Mon, Sep 14, 2026',time:'2:00 PM – 3:30 PM',title:'Innovation Session',location:'Plummer Building – Room 302',type:'session',details:'Interactive innovation session and discussion.'},
    {id:'e6',date:'Mon, Sep 14, 2026',time:'6:00 PM – 8:00 PM',title:'Dinner & Networking',location:'The Kahler Grand Hotel',type:'network',details:'Dinner and informal networking.'}
  ],
  missions: [
    {id:'m1',title:'Meet 3 new people',category:'Connect',points:50,icon:'👥',done:false},
    {id:'m2',title:'Join a session and ask one question',category:'Stretch',points:30,icon:'🙋',done:false},
    {id:'m3',title:'Post a reflection in the app',category:'Contribute',points:20,icon:'✍️',done:false},
    {id:'m4',title:'Take a walk (2 km or more)',category:'Engage',points:20,icon:'🚶',done:false},
    {id:'m5',title:'Help another participant without being asked',category:'Contribute',points:40,icon:'🤝',done:false}
  ],
  kudos: [{from:'p3',to:'p1',text:'Thanks for making the conversation easy and inclusive.',points:10},{from:'p2',to:'p4',text:'Great question in the session.',points:10}],
  points: {p1:80,p2:520,p3:410,p4:390,p5:360,p6:460,p7:430,p8:340},
  messages: {direct:{p2:[{from:'p2',text:'Great meeting you today!',ts:'8:45 AM'},{from:'p1',text:'Likewise! Would you be interested in grabbing coffee tomorrow after the 2 PM session?',ts:'9:00 AM'},{from:'p2',text:'That sounds great. Let’s meet at the lobby.',ts:'9:05 AM'}],p3:[{from:'p3',text:'Let’s grab coffee tomorrow?',ts:'8:20 AM'}],p4:[{from:'p4',text:'Thanks for the info!',ts:'Yesterday'}]},team:[{from:'p5',text:'Looking forward to dinner tonight!',ts:'9:12 AM'},{from:'p4',text:'Does everyone want to meet at 6 PM in the lobby?',ts:'9:14 AM'},{from:'p1',text:'Yes, see you there!',ts:'9:15 AM'}],announcements:[{id:'a1',title:'Welcome to Mayo 2026!',text:'Please check today’s schedule and don’t forget to complete your first mission. Let’s make this an inspiring week together.',ts:'9:30 AM'},{id:'a2',title:'Dinner meeting point',text:'Please meet in the hotel lobby at 5:50 PM.',ts:'1:45 PM'}]},
  unread:{announcements:2,team:1,p2:0,p3:0,p4:0}, polls:[{id:'poll1',question:'Which activity helped you connect most today?',options:[{label:'Partner interview',votes:3},{label:'Drawing challenge',votes:5},{label:'Free networking',votes:2}]}]
};

const storageKey='mayo2026PrototypeStateV2';
let state=loadLocalState();
let route='home';
let interval=null;
let audioCtx=null;
let timer={total:180,remaining:180,running:false};
let backendMode='local';
let cloudRefreshing=false;

const recoveryModeKey='mayo2026PasswordRecoveryMode';
function urlHasRecoveryMarker(){
  const raw=(window.location.search+' '+window.location.hash).toLowerCase();
  return raw.includes('type=recovery') || raw.includes('type%3drecovery');
}
function recoveryModeActive(){
  return urlHasRecoveryMarker() || sessionStorage.getItem(recoveryModeKey)==='1';
}
function enterRecoveryMode(){
  sessionStorage.setItem(recoveryModeKey,'1');
}
function exitRecoveryMode(){
  sessionStorage.removeItem(recoveryModeKey);
}
// Capture the recovery marker before Supabase consumes/cleans the URL.
if(urlHasRecoveryMarker()) enterRecoveryMode();

function loadLocalState(){try{const raw=localStorage.getItem(storageKey);return raw?JSON.parse(raw):structuredClone(seed)}catch(e){return structuredClone(seed)}}
function save(){if(backendMode==='local')localStorage.setItem(storageKey,JSON.stringify(state));updateBadge();}
function currentUser(){return state.people.find(p=>p.id===state.currentUserId)||{id:state.currentUserId,name:'Participant',initials:'P',org:'',title:'',interests:'',team:'',bio:''}}
function person(id){return state.people.find(p=>p.id===id)}
function esc(str=''){return String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function totalUnread(){return Object.values(state.unread||{}).reduce((a,b)=>a+(Number(b)||0),0)}
function updateBadge(){const b=$('#messageBadge');if(!b)return;const n=totalUnread();b.textContent=n;b.classList.toggle('hidden',!n)}
function navTo(r){route=r;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===r));render()}
function setTitle(t){$('#pageTitle').textContent=t}
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden');$('#modalContent').innerHTML=''}
function setSyncBadge(text,kind='local'){const el=$('#syncBadge');if(!el)return;el.textContent=text;el.className=`sync-badge ${kind}`}
function showError(err){console.error(err);alert(err?.message||String(err))}

async function refreshCloudState({renderPage=true}={}){
  if(backendMode!=='supabase'||cloudRefreshing)return;
  cloudRefreshing=true;setSyncBadge('Syncing…','syncing');
  try{state=await window.MayoCloud.loadState(seed);setSyncBadge('Cloud Beta','cloud');if(renderPage)render();}
  catch(e){setSyncBadge('Sync error','error');console.error(e);}
  finally{cloudRefreshing=false;}
}

function render(){
  const map={home:renderHome,schedule:renderSchedule,challenge:renderChallenge,people:renderPeople,messages:renderMessages,more:renderMore};
  (map[route]||renderHome)();updateBadge();
  const rb=$('#roleBadge');rb.classList.remove('hidden');rb.textContent=state.role==='admin'?'Admin':'Participant';
  document.body.classList.remove('auth-screen');
}

function renderLogin(){
  document.body.classList.add('auth-screen');setTitle('Welcome');$('#roleBadge').classList.add('hidden');setSyncBadge('Cloud Beta','cloud');
  $('#view').innerHTML=`<section class="auth-wrap">
    <div class="hero">
      <div class="eyebrow" style="color:#FFD5E6">Mayo 2026 Program Companion</div>
      <h2>Welcome</h2>
      <p>Create your account once, then use your email and password to sign in.</p>
    </div>
    <div class="card auth-card">
      <div class="auth-switch" role="tablist" aria-label="Account access">
        <button class="auth-switch-btn active" id="showCreateAccount" type="button">Create account</button>
        <button class="auth-switch-btn" id="showSignIn" type="button">Sign in</button>
      </div>

      <div id="createAccountPanel">
        <h3>Create your account</h3>
        <p class="muted">Use the email address you use for the Mayo 2026 program.</p>
        <div class="form-group"><label>Full name</label><input id="signupName" type="text" placeholder="First Last" autocomplete="name"></div>
        <div class="form-group"><label>Organization <span class="muted" style="font-weight:500">(optional)</span></label><input id="signupOrg" type="text" placeholder="Organization" autocomplete="organization"></div>
        <div class="form-group"><label>Email</label><input id="signupEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
        <div class="form-group"><label>Password</label><input id="signupPassword" type="password" placeholder="Create a password" autocomplete="new-password"></div>
        <div class="form-group"><label>Confirm password</label><input id="signupPassword2" type="password" placeholder="Re-enter your password" autocomplete="new-password"></div>
        <div class="email-notice">
          <b>After you register, check your email to confirm your account.</b><br>
          The confirmation email will come from <b>no-reply@auth.planex-bp.com</b>.<br>
          <span>If you use Outlook or Hotmail, please also check your Junk/Spam folder.</span>
        </div>
        <button class="btn pink full" id="createAccountBtn">Create Account</button>
        <div id="signupStatus" class="muted center auth-status"></div>
      </div>

      <div id="signInPanel" class="hidden">
        <h3>Sign in</h3>
        <p class="muted">Already registered? Sign in with your email and password.</p>
        <div class="form-group"><label>Email</label><input id="loginEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
        <div class="form-group"><label>Password</label><input id="loginPassword" type="password" autocomplete="current-password"></div>
        <button class="btn pink full" id="passwordSignIn">Sign In</button>
        <button class="btn ghost full" id="forgotPasswordBtn" type="button">Forgot password?</button>
        <div id="loginStatus" class="muted center auth-status"></div>
        <details class="magic-link-details">
          <summary>Prefer a one-time email link?</summary>
          <p class="muted">We can send a secure Magic Link to the email above.</p>
          <div class="email-notice compact">The email comes from <b>no-reply@auth.planex-bp.com</b>. Outlook/Hotmail users should check Junk/Spam if it is not in the Inbox.</div>
          <button class="btn ghost full" id="sendMagic">Send Magic Link</button>
        </details>
      </div>
    </div>
  </section>`;

  const activate=(mode)=>{
    const create=mode==='create';
    $('#createAccountPanel').classList.toggle('hidden',!create);
    $('#signInPanel').classList.toggle('hidden',create);
    $('#showCreateAccount').classList.toggle('active',create);
    $('#showSignIn').classList.toggle('active',!create);
    setTitle(create?'Create Account':'Sign In');
  };
  $('#showCreateAccount').onclick=()=>activate('create');
  $('#showSignIn').onclick=()=>activate('signin');

  $('#createAccountBtn').onclick=async()=>{
    const fullName=$('#signupName').value.trim(),organization=$('#signupOrg').value.trim(),email=$('#signupEmail').value.trim(),password=$('#signupPassword').value,password2=$('#signupPassword2').value;
    if(!fullName||!email||!password)return alert('Enter your name, email, and password.');
    if(password.length<6)return alert('Use a password with at least 6 characters.');
    if(password!==password2)return alert('The passwords do not match.');
    const btn=$('#createAccountBtn');btn.disabled=true;$('#signupStatus').textContent='Creating your account…';
    try{
      const data=await MayoCloud.signUpWithPassword({email,password,fullName,organization});
      if(data.session){
        $('#signupStatus').innerHTML='<b>Account created.</b><br>Signing you in…';
        await refreshCloudState();MayoCloud.subscribe(()=>refreshCloudState());
      }else{
        $('#signupStatus').innerHTML='<b>Almost done — check your email.</b><br>Open the confirmation message from <b>no-reply@auth.planex-bp.com</b>. If you use Outlook or Hotmail, check Junk/Spam too. After confirming, return here and sign in with your email and password.';
      }
    }catch(e){showError(e);$('#signupStatus').textContent='Could not create the account. If you already registered, switch to Sign in.';}
    finally{btn.disabled=false;}
  };

  $('#passwordSignIn').onclick=async()=>{
    const email=$('#loginEmail').value.trim(),password=$('#loginPassword').value;if(!email||!password)return alert('Enter email and password.');
    const btn=$('#passwordSignIn');btn.disabled=true;$('#loginStatus').textContent='Signing in…';
    try{await MayoCloud.signInWithPassword(email,password);await refreshCloudState();MayoCloud.subscribe(()=>refreshCloudState());}
    catch(e){showError(e);$('#loginStatus').textContent='Could not sign in. Make sure your email is confirmed and your password is correct.';}
    finally{btn.disabled=false;}
  };

  $('#forgotPasswordBtn').onclick=()=>renderForgotPassword();

  $('#sendMagic').onclick=async()=>{
    const email=$('#loginEmail').value.trim();if(!email)return alert('Enter your email first.');
    const btn=$('#sendMagic');btn.disabled=true;$('#loginStatus').textContent='Sending…';
    try{await window.MayoCloud.sendMagicLink(email);$('#loginStatus').innerHTML='<b>Check your email.</b><br>The link comes from <b>no-reply@auth.planex-bp.com</b>. Outlook/Hotmail users: check Junk/Spam too.';}
    catch(e){showError(e);$('#loginStatus').textContent='Could not send the sign-in link.';}
    finally{btn.disabled=false;}
  };
}

function renderForgotPassword(){
  document.body.classList.add('auth-screen');setTitle('Reset Password');$('#roleBadge').classList.add('hidden');setSyncBadge('Cloud Beta','cloud');
  $('#view').innerHTML=`<section class="auth-wrap">
    <div class="hero"><div class="eyebrow" style="color:#FFD5E6">Mayo 2026 Program Companion</div><h2>Reset your password</h2><p>Enter your registered email address and we’ll send you a secure reset link.</p></div>
    <div class="card auth-card">
      <div class="form-group"><label>Email</label><input id="resetEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
      <div class="email-notice compact">The reset email will come from <b>no-reply@auth.planex-bp.com</b>. Outlook/Hotmail users should also check Junk/Spam.</div>
      <button class="btn pink full" id="sendResetBtn">Send Password Reset Link</button>
      <button class="btn ghost full" id="backToSignInBtn">Back to Sign In</button>
      <div id="resetStatus" class="muted center auth-status"></div>
    </div>
  </section>`;
  $('#backToSignInBtn').onclick=()=>renderLogin();
  $('#sendResetBtn').onclick=async()=>{
    const email=$('#resetEmail').value.trim();if(!email)return alert('Enter your email address.');
    const btn=$('#sendResetBtn');btn.disabled=true;$('#resetStatus').textContent='Sending…';
    try{await MayoCloud.requestPasswordReset(email);$('#resetStatus').innerHTML='<b>Check your email.</b><br>If an account exists for this address, a password reset link has been sent. Outlook/Hotmail users: check Junk/Spam too.';}
    catch(e){showError(e);$('#resetStatus').textContent='Could not send the reset link. Please try again.';}
    finally{btn.disabled=false;}
  };
}

function renderPasswordRecovery(){
  document.body.classList.add('auth-screen');setTitle('Choose New Password');$('#roleBadge').classList.add('hidden');setSyncBadge('Cloud Beta','cloud');
  $('#view').innerHTML=`<section class="auth-wrap">
    <div class="hero"><div class="eyebrow" style="color:#FFD5E6">Mayo 2026 Program Companion</div><h2>Choose a new password</h2><p>Create a new password for your account.</p></div>
    <div class="card auth-card">
      <div class="form-group"><label>New password</label><input id="newPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters"></div>
      <div class="form-group"><label>Confirm new password</label><input id="newPassword2" type="password" autocomplete="new-password" placeholder="Re-enter your password"></div>
      <button class="btn pink full" id="updatePasswordBtn">Update Password</button>
      <button class="btn ghost full" id="cancelRecoveryBtn">Cancel and return to Sign In</button>
      <div id="updatePasswordStatus" class="muted center auth-status"></div>
    </div>
  </section>`;
  enterRecoveryMode();
  $('#cancelRecoveryBtn').onclick=async()=>{
    exitRecoveryMode();
    try{history.replaceState({},document.title,window.location.pathname);}catch(_e){}
    try{await MayoCloud.signOut();}catch(_e){}
    renderLogin();
  };
  $('#updatePasswordBtn').onclick=async()=>{
    const p1=$('#newPassword').value,p2=$('#newPassword2').value;
    if(p1.length<6)return alert('Use a password with at least 6 characters.');
    if(p1!==p2)return alert('The passwords do not match.');
    const btn=$('#updatePasswordBtn');btn.disabled=true;$('#updatePasswordStatus').textContent='Updating…';
    try{
      await MayoCloud.updatePassword(p1);
      $('#updatePasswordStatus').innerHTML='<b>Password updated successfully.</b><br>Returning to Sign In…';
      exitRecoveryMode();
      try{history.replaceState({},document.title,window.location.pathname);}catch(_e){}
      await MayoCloud.signOut();
      setTimeout(()=>renderLogin(),700);
    }catch(e){showError(e);$('#updatePasswordStatus').textContent='Could not update the password. Please request a new reset link.';btn.disabled=false;}
  };
}

function renderHome(){
  setTitle('Home');const u=currentUser();const now=Date.now();const next=state.schedule.find(e=>!e.startsAt||new Date(e.startsAt).getTime()>=now)||state.schedule[0];const done=state.missions.filter(m=>m.done).length;
  $('#view').innerHTML=`<section class="hero"><div class="eyebrow" style="color:#FFD5E6">Connect • Contribute • Stretch</div><h2>Welcome, ${esc((u.name||'Participant').split(' ')[0])}!</h2><p>People. Learning. Impact. Together.</p></section>
    <section class="section"><div class="section-head"><h3>Up Next</h3><span class="pill">Program</span></div>${next?`<div class="card clickable" data-event="${next.id}"><div class="time">${esc(next.time)}</div><h3 style="margin:6px 0">${esc(next.title)}</h3><p class="muted">📍 ${esc(next.location)}</p><button class="btn ghost" style="margin-top:8px">View details</button></div>`:'<div class="card empty">No schedule has been published yet.</div>'}</section>
    <section class="section"><div class="section-head"><h3>Today’s Mission</h3><span class="pill pink">${done}/${state.missions.length} complete</span></div>${state.missions.length?missionCard(state.missions.find(m=>!m.done)||state.missions[0]):'<div class="card empty">No missions have been published yet.</div>'}</section>
    <section class="section"><div class="grid two"><div class="card"><div class="kpi"><div class="kpi-icon">★</div><div><strong>${state.points[u.id]||0}</strong><small>My points</small></div></div></div><div class="card"><div class="kpi"><div class="kpi-icon">✉</div><div><strong>${totalUnread()}</strong><small>Unread messages</small></div></div></div></div></section>
    <section class="section"><div class="section-head"><h3>Quick Access</h3></div><div class="grid three">${quick('schedule','▣','Schedule')}${quick('challenge','◆','Challenge')}${quick('people','◉','People')}${quick('messages','✉','Messages')}${quick('more','⏱','Tools')}${quick('more','⚙','More')}</div></section>`;
  $$('[data-go]').forEach(b=>b.onclick=()=>navTo(b.dataset.go));$$('[data-event]').forEach(el=>el.onclick=()=>showEvent(el.dataset.event));$$('[data-mission]').forEach(el=>el.onclick=()=>showMission(el.dataset.mission));
}
function quick(r,i,l){return `<button class="quick-button" data-go="${r}"><span>${i}</span><b>${l}</b></button>`}
function missionCard(m){return `<div class="card mission-row ${m.done?'completed':''}" data-mission="${m.id}"><div class="icon-box">${m.icon||'⭐'}</div><div><h4>${esc(m.title)}</h4><span class="pill ${m.category==='Stretch'?'orange':m.category==='Contribute'?'green':'pink'}">${esc(m.category)}</span>${m.status==='pending'?'<span class="pill orange" style="margin-left:5px">Pending</span>':''}</div><div class="points">+${m.points}</div></div>`}

function renderSchedule(){
  setTitle('Schedule');
  $('#view').innerHTML=`<div class="tabs"><button class="tab active" data-stab="today">Today</button><button class="tab" data-stab="full">Full Program</button><button class="tab" data-stab="mine">My Schedule</button></div><div id="scheduleBody"></div>`;
  $$('[data-stab]').forEach(b=>b.onclick=()=>{$$('[data-stab]').forEach(x=>x.classList.toggle('active',x===b));renderScheduleList(b.dataset.stab)});
  renderScheduleList('today');
}
function renderScheduleList(tab){
  const body=$('#scheduleBody');if(!body)return;
  const bookmarks=new Set(state.bookmarkedEventIds||[]);
  let list=[...state.schedule];let heading='Full Program';
  if(tab==='mine'){list=list.filter(e=>bookmarks.has(e.id));heading='My Schedule';}
  if(tab==='today'){
    const today=new Date();
    const sameDay=e=>e.startsAt&&new Date(e.startsAt).toDateString()===today.toDateString();
    let todayList=list.filter(sameDay);
    if(todayList.length){list=todayList;heading='Today';}
    else {
      const future=list.filter(e=>e.startsAt&&new Date(e.startsAt)>=today).sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));
      if(future.length){const d=new Date(future[0].startsAt).toDateString();list=future.filter(e=>new Date(e.startsAt).toDateString()===d);heading=`Next program day · ${list[0].date}`;}
      else {list=[];heading='Today';}
    }
  }
  body.innerHTML=`<div class="section-head"><h3>${esc(heading)}</h3><span class="pill">${list.length} events</span></div><div class="list">${list.map(e=>`<div class="list-row clickable" data-event="${e.id}"><div class="time">${esc((e.time||'').split(' – ')[0])}</div><div class="main"><h4>${esc(e.title)} ${bookmarks.has(e.id)?'★':''}</h4><p>${esc(e.location)}</p></div><div>›</div></div>`).join('')||'<div class="empty">No events in this view.</div>'}</div>`;
  $$('[data-event]').forEach(el=>el.onclick=()=>showEvent(el.dataset.event));
}
function icsEscape(v=''){return String(v).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function icsDate(iso){return new Date(iso).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}
function downloadCalendarEvent(e){
  if(!e.startsAt)return alert('This event does not have a calendar start time yet.');
  const end=e.endsAt||new Date(new Date(e.startsAt).getTime()+60*60*1000).toISOString();
  const text=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mayo 2026//Program Companion//EN','BEGIN:VEVENT',`UID:${e.id}@mayo2026`,`DTSTAMP:${icsDate(new Date().toISOString())}`,`DTSTART:${icsDate(e.startsAt)}`,`DTEND:${icsDate(end)}`,`SUMMARY:${icsEscape(e.title)}`,`LOCATION:${icsEscape(e.location||'')}`,`DESCRIPTION:${icsEscape(e.details||'')}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob=new Blob([text],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${(e.title||'mayo-event').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')}.ics`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showEvent(id){
  const e=state.schedule.find(x=>x.id===id);if(!e)return;const saved=(state.bookmarkedEventIds||[]).includes(id);const mapButton=e.locationUrl?`<button class="btn ghost full" id="openMap">Open Map</button><div class="spacer"></div>`:'';
  openModal(`<h2 id="modalTitle">${esc(e.title)}</h2><span class="pill">${esc(e.date)}</span><p><b>${esc(e.time)}</b></p><p>📍 ${esc(e.location)}</p><div class="card notice"><b>About</b><p>${esc(e.details)}</p></div><div class="spacer"></div>${mapButton}<button class="btn ghost full" id="bookmarkEvent">${saved?'★ Remove from My Schedule':'☆ Add to My Schedule'}</button><div class="spacer"></div><button class="btn full" id="calendarBtn">Add to My Calendar</button>`);
  if($('#openMap'))$('#openMap').onclick=()=>window.open(e.locationUrl,'_blank');
  $('#calendarBtn').onclick=()=>downloadCalendarEvent(e);
  $('#bookmarkEvent').onclick=async()=>{try{if(backendMode==='supabase'){await MayoCloud.toggleScheduleBookmark(id,saved);await refreshCloudState({renderPage:false});}else{state.bookmarkedEventIds=state.bookmarkedEventIds||[];state.bookmarkedEventIds=saved?state.bookmarkedEventIds.filter(x=>x!==id):[...state.bookmarkedEventIds,id];save();}closeModal();renderSchedule();}catch(err){showError(err)}};
}
function renderChallenge(){setTitle('Challenge');$('#view').innerHTML=`<div class="tabs"><button class="tab active" data-ctab="missions">Missions</button><button class="tab" data-ctab="points">My Points</button><button class="tab" data-ctab="leaderboard">Leaderboard</button></div><div id="challengeBody"></div>`;$$('[data-ctab]').forEach(b=>b.onclick=()=>{$$('[data-ctab]').forEach(x=>x.classList.toggle('active',x===b));renderChallengeTab(b.dataset.ctab)});renderChallengeTab('missions');}
function renderChallengeTab(tab){
  const body=$('#challengeBody');const u=currentUser();
  if(tab==='missions')body.innerHTML=`<div class="section-head"><h3>Today’s Missions</h3><span class="pill pink">${state.missions.filter(m=>m.done).length}/${state.missions.length}</span></div><div class="list">${state.missions.map(m=>missionCard(m)).join('')||'<div class="empty">No missions published yet.</div>'}</div>`;
  if(tab==='points')body.innerHTML=`<div class="hero center"><div class="eyebrow" style="color:#FFD5E6">My Score</div><h2>${state.points[u.id]||0} pts</h2><p>Keep connecting, contributing, and stretching.</p></div><section class="section"><div class="card"><h3>Recent Kudos</h3>${(state.kudos||[]).filter(k=>k.to===u.id).slice(0,8).map(k=>`<p>💗 <b>${esc(person(k.from)?.name||'Someone')}</b>: ${esc(k.text)}</p>`).join('')||'<p class="muted">No kudos yet.</p>'}</div></section>`;
  if(tab==='leaderboard')body.innerHTML=leaderboardHtml();
  $$('[data-mission]').forEach(el=>el.onclick=()=>showMission(el.dataset.mission));
  $$('[data-ltab]').forEach(b=>b.onclick=()=>{$$('[data-ltab]').forEach(x=>x.classList.toggle('active',x===b));$('#leaderboardRows').innerHTML=b.dataset.ltab==='team'?teamLeaderboardRows():individualLeaderboardRows();});
}
function individualLeaderboardRows(){const rows=state.people.map(p=>({p,pts:state.points[p.id]||0})).sort((a,b)=>b.pts-a.pts);return `<table class="score-table">${rows.map((r,i)=>`<tr class="${i===0?'winner':''}"><td>${i+1}. ${esc(r.p.name)}</td><td>${r.pts} pts</td></tr>`).join('')}</table>`}
function teamLeaderboardRows(){let rows=state.teamLeaderboard||[];if(!rows.length){const map={};state.people.forEach(p=>{if(p.team)map[p.team]=(map[p.team]||0)+(state.points[p.id]||0)});rows=Object.entries(map).map(([name,points])=>({name,points})).sort((a,b)=>b.points-a.points)}return `<table class="score-table">${rows.map((r,i)=>`<tr class="${i===0?'winner':''}"><td>${i+1}. ${esc(r.name)}</td><td>${r.points} pts</td></tr>`).join('')||'<tr><td>No teams yet.</td><td></td></tr>'}</table>`}
function leaderboardHtml(){return `<div class="tabs"><button class="tab active" data-ltab="individual">Individual</button><button class="tab" data-ltab="team">Team</button></div><div id="leaderboardRows">${individualLeaderboardRows()}</div>`}
function showMission(id){const m=state.missions.find(x=>x.id===id);if(!m)return;const disabled=backendMode==='supabase'&&(m.done||m.status==='pending');openModal(`<h2 id="modalTitle">${m.icon||'⭐'} ${esc(m.title)}</h2><p><span class="pill">${esc(m.category)}</span> <span class="pill green">+${m.points} pts</span></p><p class="muted">${esc(m.description||'Complete this mission during the program.')}${m.requiresApproval?' This mission requires admin approval.':''}</p><button class="btn ${m.done?'ghost':'pink'} full" id="toggleMission" ${disabled?'disabled':''}>${m.done?'Completed':m.status==='pending'?'Pending approval':backendMode==='local'?'Complete / Undo':'Complete mission'}</button>`);$('#toggleMission').onclick=async()=>{if(backendMode==='supabase'){const btn=$('#toggleMission');btn.disabled=true;btn.textContent='Saving…';try{await MayoCloud.completeMission(id);closeModal();await refreshCloudState();}catch(e){showError(e);btn.disabled=false;btn.textContent='Complete mission';}}else{m.done=!m.done;state.points[state.currentUserId]=(state.points[state.currentUserId]||0)+(m.done?m.points:-m.points);save();closeModal();render();}};}

function renderPeople(){setTitle('People');$('#view').innerHTML=`<div class="tabs"><button class="tab active" data-ptab="all">All Participants</button><button class="tab" data-ptab="team">My Team</button></div><input id="peopleSearch" class="search" placeholder="Search by name, affiliation, or interest…"><div id="peopleList" class="list"></div>`;$('#peopleSearch').oninput=()=>renderPeopleList($('#peopleSearch').value,$('.tab.active')?.dataset.ptab||'all');$$('[data-ptab]').forEach(b=>b.onclick=()=>{$$('[data-ptab]').forEach(x=>x.classList.toggle('active',x===b));renderPeopleList($('#peopleSearch').value,b.dataset.ptab)});renderPeopleList('','all');}
function renderPeopleList(q,tab){const u=currentUser();q=(q||'').toLowerCase();const list=state.people.filter(p=>p.id!==u.id).filter(p=>tab!=='team'||p.team===u.team).filter(p=>[p.name,p.org,p.title,p.interests].join(' ').toLowerCase().includes(q));$('#peopleList').innerHTML=list.map(p=>`<div class="list-row clickable" data-person="${p.id}"><div class="avatar">${esc(p.initials)}</div><div class="main"><h4>${esc(p.name)}</h4><p>${esc(p.org)} • ${esc(p.title)}</p><p>${esc(p.interests)}</p></div><div>›</div></div>`).join('')||'<div class="empty">No participants found.</div>';$$('[data-person]').forEach(el=>el.onclick=()=>showPerson(el.dataset.person));}
function showPerson(id){
  const p=person(id);if(!p)return;
  openModal(`<h2 id="modalTitle">${esc(p.name)}</h2><div class="avatar" style="width:74px;height:74px;font-size:20px">${esc(p.initials)}</div><p><b>${esc(p.org)}</b><br>${esc(p.title)}</p><p><b>Interests</b><br>${esc(p.interests)}</p><p><b>About</b><br>${esc(p.bio)}</p><button class="btn pink full" id="messagePerson">Message</button><div class="spacer"></div><button class="btn ghost full" id="kudosPerson">Give Kudos</button>`);
  $('#messagePerson').onclick=()=>{closeModal();route='messages';render();openChat('direct',id)};
  $('#kudosPerson').onclick=()=>{openModal(`<h2 id="modalTitle">Give Kudos to ${esc(p.name)}</h2><p class="muted">Recognize something specific they did that made the program or team better.</p><textarea id="kudosText" placeholder="Thanks for making the discussion inclusive…"></textarea><div class="spacer"></div><button class="btn pink full" id="sendKudos">Send Kudos</button>`);$('#sendKudos').onclick=async()=>{const text=$('#kudosText').value.trim();if(!text)return alert('Write a short kudos message.');try{if(backendMode==='supabase'){await MayoCloud.giveKudos(id,text);await refreshCloudState({renderPage:false});}else{state.kudos.push({id:'k'+Date.now(),from:state.currentUserId,to:id,text});save();}closeModal();alert('Kudos sent.');}catch(e){showError(e)}}};
}
function renderMessages(){setTitle('Messages');$('#view').innerHTML=`<div class="tabs"><button class="tab active" data-mtab="all">All</button><button class="tab" data-mtab="direct">Direct</button><button class="tab" data-mtab="team">Team</button><button class="tab" data-mtab="announcements">Announcements</button></div><div id="messageList" class="list"></div>`;$$('[data-mtab]').forEach(b=>b.onclick=()=>{$$('[data-mtab]').forEach(x=>x.classList.toggle('active',x===b));renderMessageList(b.dataset.mtab)});renderMessageList('all');}
function renderMessageList(tab){const items=[];if(['all','announcements'].includes(tab)){const a=state.messages.announcements[0];items.push({type:'announcements',title:'Announcements',sub:a?.title||'No announcements yet',time:a?.ts||'',unread:state.unread.announcements||0,avatar:'📣'});}if(['all','team'].includes(tab)&&currentUser().team){const last=state.messages.team.at(-1);items.push({type:'team',title:`Team ${currentUser().team}`,sub:last?.text||'Start your team chat',time:last?.ts||'',unread:state.unread.team||0,avatar:'👥'});}if(['all','direct'].includes(tab))Object.entries(state.messages.direct||{}).forEach(([pid,msgs])=>{const p=person(pid);if(!p)return;const last=msgs.at(-1);items.push({type:'direct',id:pid,title:p.name,sub:last?.text||'',time:last?.ts||'',unread:state.unread[pid]||0,avatar:p.initials});});$('#messageList').innerHTML=items.map(x=>`<div class="list-row clickable" data-chat-type="${x.type}" data-chat-id="${x.id||''}"><div class="avatar">${esc(x.avatar)}</div><div class="main message-preview"><div class="main"><div class="meta"><h4 class="${x.unread?'unread':''}">${esc(x.title)}</h4><span class="time">${esc(x.time)}</span></div><div class="snippet ${x.unread?'unread':''}">${esc(x.sub)}</div></div></div>${x.unread?`<span class="badge" style="position:static">${x.unread}</span>`:'›'}</div>`).join('')||'<div class="empty">No messages yet.</div>';$$('[data-chat-type]').forEach(el=>el.onclick=()=>openChat(el.dataset.chatType,el.dataset.chatId));}
function findConversation(type,id){return state.cloud?.conversations?.find(c=>c.type===type&&(type!=='direct'||c.otherId===id));}
async function openChat(type,id){
  if(type==='announcements'){state.unread.announcements=0;save();if(backendMode==='supabase')MayoCloud.markAnnouncementsRead(state.messages.announcements.map(a=>a.id)).catch(console.error);openModal(`<h2 id="modalTitle">Announcements</h2>${state.messages.announcements.map(a=>`<div class="card notice" style="margin-bottom:10px"><div class="time">${esc(a.ts)}</div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div>`).join('')||'<div class="empty">No announcements yet.</div>'}`);return;
  }
  let title,msgs;if(type==='team'){title=`Team ${currentUser().team||''}`;msgs=state.messages.team||[];state.unread.team=0;}else{const p=person(id);title=p?.name||'Direct Message';msgs=state.messages.direct[id]||(state.messages.direct[id]=[]);state.unread[id]=0;}save();
  if(backendMode==='supabase'){const conv=findConversation(type,id);if(conv)MayoCloud.markConversationRead(conv.id).catch(console.error);}
  openModal(`<h2 id="modalTitle">${esc(title)}</h2><div id="chatBody" class="chat">${msgs.map(m=>chatBubble(m)).join('')||'<div class="empty">No messages yet. Say hello!</div>'}</div><div class="composer"><input id="chatInput" placeholder="Type a message…"><button id="sendChat">➤</button></div>`);$('#chatBody').scrollTop=$('#chatBody').scrollHeight;$('#sendChat').onclick=()=>sendChat(type,id);$('#chatInput').onkeydown=e=>{if(e.key==='Enter')sendChat(type,id)};
}
function chatBubble(m){const me=m.from===state.currentUserId;return `<div class="bubble ${me?'me':'them'}">${esc(m.text)}<div class="chat-time">${esc(m.ts||'Now')}</div></div>`}
async function sendChat(type,id){const input=$('#chatInput');const text=input.value.trim();if(!text)return;input.disabled=true;try{if(backendMode==='supabase'){await MayoCloud.sendMessage(type,id,text);await refreshCloudState({renderPage:false});render();await openChat(type,id);}else{const m={from:state.currentUserId,text,ts:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})};if(type==='team')state.messages.team.push(m);else(state.messages.direct[id]||(state.messages.direct[id]=[])).push(m);save();openChat(type,id);}}catch(e){showError(e);input.disabled=false;}}

function renderMore(){
  setTitle('Tools & Admin');const u=currentUser();const dataHtml=backendMode==='supabase'?`<div class="card"><div class="section-head"><h3>Cloud Beta</h3><span class="pill green">Connected</span></div><p class="muted">Signed in as ${esc(MayoCloud.session?.user?.email||'participant')}. Shared data and realtime updates are enabled.</p><button class="btn ghost full" id="signOutBtn">Sign Out</button></div>`:`<div class="card"><div class="section-head"><h3>Local Demo</h3><span class="pill orange">This device only</span></div><p class="muted">Points, messages, and admin changes are saved only in this browser.</p><button class="btn pink full" id="connectBackend">Connect Beta Backend</button><div class="spacer"></div><button class="btn ghost full" id="resetPrototype">Reset Local Demo Data</button></div>`;
  $('#view').innerHTML=`<div class="section-head"><h3>Program Tools</h3><span class="pill">${backendMode==='supabase'?'Beta':'Prototype'}</span></div><div class="grid two">${toolCard('grouping','👥','Grouping','Balanced random groups')}${toolCard('timer','⏱','Presentation Timer','Presets + sound/vibration alerts')}${toolCard('random','🎲','Random Pick','Pick a participant')}${toolCard('poll','▥','Quick Poll','Live shared voting')}</div><section class="section"><div class="section-head"><h3>My Profile</h3></div><div class="card"><h3>${esc(u.name)}</h3><p class="muted">${esc(u.org)}${u.title?' • '+esc(u.title):''}</p><button class="btn ghost full" id="editProfile">Edit Profile</button></div></section><section class="section"><div class="section-head"><h3>Data & Sync</h3></div>${dataHtml}</section><section class="section"><div class="section-head"><h3>Admin</h3><span class="pill orange">${state.role==='admin'?'Enabled':'Participant'}</span></div><div class="card"><p class="muted">Admin users can publish announcements, missions, schedule items, and quick polls.</p><button class="btn full" id="openAdmin">Open Admin Panel</button></div></section>`;
  $$('[data-tool]').forEach(el=>el.onclick=()=>openTool(el.dataset.tool));$('#openAdmin').onclick=openAdmin;$('#editProfile').onclick=editMyProfile;if($('#connectBackend'))$('#connectBackend').onclick=openBackendSetup;if($('#resetPrototype'))$('#resetPrototype').onclick=()=>{if(confirm('Reset all local demo data?')){localStorage.removeItem(storageKey);state=structuredClone(seed);render();}};if($('#signOutBtn'))$('#signOutBtn').onclick=async()=>{await MayoCloud.signOut();renderLogin();};
}
function editMyProfile(){
  const u=currentUser();
  openModal(`<h2 id="modalTitle">Edit My Profile</h2><div class="form-group"><label>Name</label><input id="pName" value="${esc(u.name)}"></div><div class="form-group"><label>Organization</label><input id="pOrg" value="${esc(u.org)}"></div><div class="form-group"><label>Title / Role</label><input id="pTitle" value="${esc(u.title)}"></div><div class="form-group"><label>Interests</label><input id="pInterests" value="${esc(u.interests)}"></div><div class="form-group"><label>About me</label><textarea id="pBio">${esc(u.bio)}</textarea></div><button class="btn pink full" id="saveProfile">Save Profile</button>`);
  $('#saveProfile').onclick=async()=>{const values={fullName:$('#pName').value.trim(),organization:$('#pOrg').value.trim(),title:$('#pTitle').value.trim(),interests:$('#pInterests').value.trim(),bio:$('#pBio').value.trim()};if(!values.fullName)return alert('Enter your name.');try{if(backendMode==='supabase'){await MayoCloud.updateProfile(values);await refreshCloudState({renderPage:false});}else{Object.assign(u,{name:values.fullName,org:values.organization,title:values.title,interests:values.interests,bio:values.bio,initials:values.fullName.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()});save();}closeModal();render();}catch(e){showError(e)}};
}

function openBackendSetup(){
  const c=MayoCloud.getConfig?.()||{};
  openModal(`<h2 id="modalTitle">Connect Beta Backend</h2><div class="admin-note">First create the Supabase project and run <b>supabase/schema.sql</b> in its SQL Editor. Then paste the Project URL and publishable key below.</div><div class="spacer"></div><div class="form-group"><label>Supabase Project URL</label><input id="sbUrl" placeholder="https://xxxxx.supabase.co" value="${esc(c.supabaseUrl||'')}"></div><div class="form-group"><label>Publishable / anon key</label><textarea id="sbKey" placeholder="sb_publishable_... or anon key">${esc(c.supabasePublishableKey||'')}</textarea></div><div class="form-group"><label>Auth redirect URL (optional)</label><input id="sbRedirect" placeholder="Leave blank while testing locally" value="${esc(c.authRedirectUrl||'')}"></div><button class="btn pink full" id="saveBackend">Save & Restart in Cloud Mode</button><div class="spacer"></div><button class="btn ghost full" id="clearBackend">Clear Saved Cloud Settings</button><p class="muted" style="margin-top:12px">Never paste a service-role key here. The browser should use only the publishable/anon key protected by Row Level Security.</p>`);
  $('#saveBackend').onclick=()=>{const url=$('#sbUrl').value.trim(),key=$('#sbKey').value.trim();if(!url||!key)return alert('Enter both the Project URL and publishable/anon key.');MayoCloud.saveConfig({supabaseUrl:url,supabasePublishableKey:key,authRedirectUrl:$('#sbRedirect').value.trim()});location.reload();};
  $('#clearBackend').onclick=()=>{MayoCloud.clearConfig();alert('Saved cloud settings cleared.');closeModal();};
}

function toolCard(id,icon,title,sub){return `<button class="card tool-card clickable" data-tool="${id}"><div class="big">${icon}</div><b>${title}</b><small>${sub}</small></button>`}
function openTool(id){if(id==='grouping')toolGrouping();if(id==='timer')toolTimer();if(id==='random')toolRandom();if(id==='poll')toolPoll();}
function toolGrouping(){
  openModal(`<h2 id="modalTitle">Grouping</h2><p class="muted">Creates random groups while reducing repeat clustering of existing teams.</p><div class="form-group"><label>Group size</label><select id="groupSize"><option>2</option><option selected>4</option><option>5</option></select></div><button class="btn pink full" id="makeGroups">Generate Groups</button><div id="groupResult" class="section"></div>`);
  $('#makeGroups').onclick=()=>{const size=+$('#groupSize').value;const people=[...state.people];const groupCount=Math.max(1,Math.ceil(people.length/size));const groups=Array.from({length:groupCount},()=>[]);const byTeam={};people.forEach(p=>(byTeam[p.team||'_none']||(byTeam[p.team||'_none']=[])).push(p));Object.values(byTeam).forEach(bucket=>bucket.sort(()=>Math.random()-.5));Object.values(byTeam).sort((a,b)=>b.length-a.length).forEach(bucket=>bucket.forEach(p=>{const choices=groups.map((g,i)=>({i,len:g.length,same:g.filter(x=>(x.team||'_none')===(p.team||'_none')).length})).filter(x=>x.len<size).sort((a,b)=>a.same-b.same||a.len-b.len||Math.random()-.5);groups[choices[0]?.i??0].push(p)}));$('#groupResult').innerHTML=groups.filter(g=>g.length).map((g,i)=>`<div class="card" style="margin-bottom:8px"><b>Group ${i+1}</b><p>${g.map(x=>`${esc(x.name)}${x.team?` <small>(${esc(x.team)})</small>`:''}`).join(' • ')}</p></div>`).join('')};
}
function toolRandom(){openModal(`<h2 id="modalTitle">Random Pick</h2><p class="muted">Pick one participant at random.</p><button class="btn pink full" id="pickPerson">Pick Someone</button><div id="pickResult" class="center" style="padding:28px"></div>`);$('#pickPerson').onclick=()=>{if(!state.people.length)return;const p=state.people[Math.floor(Math.random()*state.people.length)];$('#pickResult').innerHTML=`<div class="avatar" style="margin:auto;width:84px;height:84px;font-size:24px">${esc(p.initials)}</div><h2>${esc(p.name)}</h2><p>${esc(p.org)}</p>`}}
function toolPoll(){const poll=state.polls[0];if(!poll)return openModal('<h2 id="modalTitle">Quick Poll</h2><div class="empty">No poll is active.</div>');openModal(`<h2 id="modalTitle">Quick Poll</h2><h3>${esc(poll.question)}</h3><div id="pollOptions" class="list">${poll.options.map((o,i)=>`<button class="card clickable ${poll.myVote===o.id?'selected-option':''}" data-vote="${i}"><b>${esc(o.label)} ${poll.myVote===o.id?'✓':''}</b><div class="progress"><span style="width:${pollTotal(poll)?o.votes/pollTotal(poll)*100:0}%"></span></div><small>${o.votes} votes</small></button>`).join('')}</div>`);$$('[data-vote]').forEach(b=>b.onclick=async()=>{const idx=+b.dataset.vote;if(backendMode==='supabase'){try{await MayoCloud.votePoll(poll.id,poll.options[idx].id);await refreshCloudState({renderPage:false});toolPoll();}catch(e){showError(e)}}else{poll.options[idx].votes++;save();toolPoll();}})}
function pollTotal(p){return p.options.reduce((a,b)=>a+b.votes,0)}
function toolTimer(){timer.running=false;if(interval)clearInterval(interval);openModal(`<h2 id="modalTitle">Presentation Timer</h2><div class="tabs"><button class="tab" data-preset="30">30 sec</button><button class="tab" data-preset="60">1 min</button><button class="tab active" data-preset="180">3 min</button><button class="tab" data-preset="300">5 min</button></div><div id="timerRing" class="timer-ring"><div id="timerDisplay" class="timer-display">03:00</div></div><div class="controls"><button class="btn green" id="timerStart">Start</button><button class="btn ghost" id="timerReset">Reset</button></div><p class="muted center">Alert at 1 minute, 30 seconds, and time up. Sound and vibration are used when supported.</p>`);timer={total:180,remaining:180,running:false};renderTimer();$$('[data-preset]').forEach(b=>b.onclick=()=>{timer.total=timer.remaining=+b.dataset.preset;$$('[data-preset]').forEach(x=>x.classList.toggle('active',x===b));renderTimer()});$('#timerStart').onclick=toggleTimer;$('#timerReset').onclick=()=>{timer.remaining=timer.total;timer.running=false;clearInterval(interval);$('#timerStart').textContent='Start';renderTimer()};}
function beep(freq=880,duration=.12,count=1){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();let t=audioCtx.currentTime;for(let i=0;i<count;i++){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.connect(g);g.connect(audioCtx.destination);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.start(t);o.stop(t+duration);t+=duration+.08}}catch(_e){}}
function toggleTimer(){timer.running=!timer.running;$('#timerStart').textContent=timer.running?'Pause':'Start';clearInterval(interval);if(timer.running){if(audioCtx?.state==='suspended')audioCtx.resume();interval=setInterval(()=>{timer.remaining--;if([60,30,0].includes(timer.remaining)){if(navigator.vibrate)navigator.vibrate(timer.remaining===0?[200,100,200]:120);beep(timer.remaining===0?520:timer.remaining===30?740:880,.12,timer.remaining===0?3:1)}if(timer.remaining<=0){timer.remaining=0;timer.running=false;clearInterval(interval);$('#timerStart').textContent='Start'}renderTimer();},1000)}}

function renderTimer(){const d=$('#timerDisplay'),r=$('#timerRing');if(!d)return;const m=Math.floor(timer.remaining/60),s=timer.remaining%60;d.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;r.classList.toggle('warning',timer.remaining<=60&&timer.remaining>30);r.classList.toggle('danger',timer.remaining<=30&&timer.remaining>0);r.classList.toggle('done',timer.remaining===0)}

function openAdmin(){if(state.role!=='admin'){openModal(`<h2 id="modalTitle">Admin Panel</h2><div class="admin-note">Your account is a Participant. Admin privileges are assigned in the beta database.</div>`);return;}openModal(`<h2 id="modalTitle">Admin Panel</h2><div class="tabs"><button class="tab active" data-atab="announce">Announcement</button><button class="tab" data-atab="mission">Mission</button><button class="tab" data-atab="schedule">Schedule</button><button class="tab" data-atab="poll">Poll</button></div><div id="adminBody"></div>`);$$('[data-atab]').forEach(b=>b.onclick=()=>{$$('[data-atab]').forEach(x=>x.classList.toggle('active',x===b));renderAdminTab(b.dataset.atab)});renderAdminTab('announce');}
function renderAdminTab(tab){
  const b=$('#adminBody');if(!b)return;
  if(tab==='announce')b.innerHTML=`<div class="form-group"><label>Title</label><input id="aTitle" value="Program Update"></div><div class="form-group"><label>Message</label><textarea id="aText" placeholder="Announcement to all participants"></textarea></div><button class="btn pink full" id="aSend">Send Announcement</button>`;
  if(tab==='mission')b.innerHTML=`<div class="form-group"><label>Mission title</label><input id="mTitle" placeholder="Talk to someone new"></div><div class="form-group"><label>Category</label><select id="mCat"><option>Connect</option><option>Contribute</option><option>Stretch</option><option>Engage</option></select></div><div class="form-group"><label>Points</label><input id="mPoints" type="number" value="20"></div><button class="btn pink full" id="mAdd">Add Mission</button>`;
  if(tab==='schedule')b.innerHTML=`<div class="form-group"><label>Event title</label><input id="eTitle" placeholder="Evening Reflection"></div><div class="form-group"><label>Start</label><input id="eStart" type="datetime-local"></div><div class="form-group"><label>End</label><input id="eEnd" type="datetime-local"></div><div class="form-group"><label>Location</label><input id="eLocation" placeholder="Hotel Lobby"></div><button class="btn pink full" id="eAdd">Add Event</button>`;
  if(tab==='poll')b.innerHTML=`<div class="form-group"><label>Question</label><input id="qQuestion" placeholder="Which activity helped you connect most?"></div><div class="form-group"><label>Options (one per line)</label><textarea id="qOptions">Partner interview\nDrawing challenge\nFree networking</textarea></div><button class="btn pink full" id="qAdd">Publish Poll</button>`;
  if($('#aSend'))$('#aSend').onclick=async()=>{const title=$('#aTitle').value.trim(),text=$('#aText').value.trim();if(!title||!text)return alert('Enter title and message.');try{if(backendMode==='supabase'){await MayoCloud.createAnnouncement(title,text);closeModal();await refreshCloudState();}else{state.messages.announcements.unshift({id:'a'+Date.now(),title,text,ts:'Now'});state.unread.announcements++;save();alert('Announcement sent in local demo.');openAdmin();}}catch(e){showError(e)}};
  if($('#mAdd'))$('#mAdd').onclick=async()=>{const title=$('#mTitle').value.trim(),category=$('#mCat').value,points=+$('#mPoints').value||0;if(!title)return alert('Enter a mission title.');try{if(backendMode==='supabase'){await MayoCloud.createMission({title,category,points});closeModal();await refreshCloudState();}else{state.missions.push({id:'m'+Date.now(),title,category,points,icon:'⭐',done:false});save();alert('Mission added.');openAdmin();}}catch(e){showError(e)}};
  if($('#eAdd'))$('#eAdd').onclick=async()=>{const title=$('#eTitle').value.trim(),start=$('#eStart').value,end=$('#eEnd').value,location=$('#eLocation').value.trim();if(!title)return alert('Enter event title.');try{if(backendMode==='supabase'){if(!start)return alert('Enter a start date/time.');await MayoCloud.createSchedule({title,startsAt:new Date(start).toISOString(),endsAt:end?new Date(end).toISOString():null,location});closeModal();await refreshCloudState();}else{state.schedule.push({id:'e'+Date.now(),date:'Program Day',time:start||'TBD',location,type:'session',details:'Added by admin in local demo.'});save();alert('Event added.');openAdmin();}}catch(e){showError(e)}};
  if($('#qAdd'))$('#qAdd').onclick=async()=>{const question=$('#qQuestion').value.trim(),options=$('#qOptions').value.split(/\n/).map(x=>x.trim()).filter(Boolean);if(!question||options.length<2)return alert('Enter a question and at least two options.');try{if(backendMode==='supabase'){await MayoCloud.createPoll(question,options);closeModal();await refreshCloudState();}else{state.polls.unshift({id:'poll'+Date.now(),question,options:options.map(label=>({label,votes:0})),myVote:null});save();closeModal();render();}}catch(e){showError(e)}};
}

async function showAccount(){if(backendMode==='local'){state.role=state.role==='admin'?'participant':'admin';save();render();return;}openModal(`<h2 id="modalTitle">My Account</h2><p><b>${esc(currentUser().name)}</b><br>${esc(MayoCloud.session?.user?.email||'')}</p><p><span class="pill">${esc(state.role)}</span> <span class="pill green">Cloud Beta</span></p><button class="btn ghost full" id="accountEdit">Edit Profile</button><div class="spacer"></div><button class="btn ghost full" id="accountSignOut">Sign Out</button>`);$('#accountEdit').onclick=editMyProfile;$('#accountSignOut').onclick=async()=>{await MayoCloud.signOut();closeModal();renderLogin();};}
async function bootstrap(){
  setSyncBadge('Starting…','syncing');
  try{
    const result=await window.MayoCloud.init();
    backendMode=result.mode;
    if(backendMode==='supabase'){
      if(window.MayoCloud.lastAuthEvent==='PASSWORD_RECOVERY') enterRecoveryMode();
      if(recoveryModeActive()){renderPasswordRecovery();return;}
      if(!result.session){renderLogin();return;}
      await refreshCloudState({renderPage:false});window.MayoCloud.subscribe(()=>refreshCloudState());render();
    }else{state=loadLocalState();setSyncBadge('Local Demo','local');render();}
  }catch(e){console.error(e);backendMode='local';state=loadLocalState();setSyncBadge('Local fallback','error');render();openModal(`<h2 id="modalTitle">Cloud connection issue</h2><p>The app could not start Supabase, so it opened in Local Demo mode.</p><p class="muted">${esc(e.message||String(e))}</p>`);}
}

$$('.nav-item').forEach(b=>b.onclick=()=>navTo(b.dataset.route));
$('#modalClose').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
$('#roleBadge').onclick=showAccount;
window.addEventListener('mayo-auth-changed',async(e)=>{
  if(backendMode!=='supabase')return;
  if(e?.detail?.event==='PASSWORD_RECOVERY') enterRecoveryMode();
  if(recoveryModeActive()){renderPasswordRecovery();return;}
  const s=await MayoCloud.getSession();
  if(s){await refreshCloudState();MayoCloud.subscribe(()=>refreshCloudState());}
  else renderLogin();
});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
bootstrap();
