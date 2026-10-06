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
  teams: [
    {id:'t1',name:'Alpha'},{id:'t2',name:'Beta'},{id:'t3',name:'Gamma'}
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
  unread:{announcements:2,team:1,p2:0,p3:0,p4:0}, polls:[{id:'poll1',question:'Which activity helped you connect most today?',isOpen:true,resultsPublished:false,closesAt:null,createdAt:new Date().toISOString(),options:[{id:'po1',label:'Partner interview',votes:3},{id:'po2',label:'Drawing challenge',votes:5},{id:'po3',label:'Free networking',votes:2}],myVote:null}]
};

const storageKey='mayo2026PrototypeStateV2';
const routeKey='mayo2026ActiveRoute';
let state=loadLocalState();
let route=sessionStorage.getItem(routeKey)||'home';
if(!['home','schedule','challenge','people','messages','more'].includes(route))route='home';
let interval=null;
let audioCtx=null;
let timerWakeLock=null;
const PUSH_VAPID_PUBLIC_KEY='BG6cErWnJazOeeBi1Y2ZRC2ZIvUAWIJnPg0PJSg8y1McWpbbfLqvVY-Uq4Aa3OxGuh_wGeuwS7bj6UpkWB-JZ80';
let timer={total:180,remaining:180,running:false};
let backendMode='local';
let cloudRefreshing=false;
let cloudRefreshPromise=null;
let signInFlowActive=false;

// Preserve the participant's Schedule view when the app re-renders after
// backgrounding, realtime updates, or an auth token refresh.
const scheduleTabKey='mayo2026ScheduleTab';
const scheduleScrollKey='mayo2026ScheduleScrollY';
let scheduleTab=sessionStorage.getItem(scheduleTabKey)||'today';
let scheduleScrollY=Number(sessionStorage.getItem(scheduleScrollKey)||0);
if(!['today','full','mine'].includes(scheduleTab))scheduleTab='today';

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
function privacyNoticeHtml(){return `<h2 id="modalTitle">Privacy Notice</h2>
  <p class="muted"><b>Effective:</b> September 24, 2026</p>
  <p><b>Data Controller.</b> PlanEx operates the Mayo 2026 Program Companion and is responsible for the participant information processed through this app.</p>
  <h3>Information we collect</h3>
  <p>We may collect information you provide to use the program, including your name, email address, organization or affiliation, profile information, team assignment, program participation activity, messages, mission and point activity, poll responses, and account/authentication information.</p>
  <h3>Please do not submit sensitive information</h3>
  <p>This app is intended for program coordination and participant interaction only. Please do <b>not</b> enter, upload, send, or exchange confidential business information, medical or health information, financial information, government identification numbers, passwords, sensitive personal information, or any other information that you or another person would not want disclosed.</p>
  <h3>How we use information</h3>
  <p>Information is used to operate the Mayo 2026 program, manage accounts and participation, provide schedules and announcements, enable participant communication, administer teams, missions, points and polls, maintain security, and support the program.</p>
  <p>PlanEx does not sell participant personal information or use it for third-party advertising.</p>
  <h3>Service providers and international processing</h3>
  <p>The app uses third-party technology providers for hosting, authentication, database, realtime functions and transactional email. Information may therefore be processed or stored in the United States, including information submitted by participants located in Japan or other countries.</p>
  <h3>Retention and program closure</h3>
  <p>PlanEx intends to close the Mayo 2026 Program Companion and delete participant-entered information and the active program database <b>within 12 months after the program ends</b>. After closure, the app will not be maintained as an archive of participant content. Limited residual copies may remain temporarily in provider backups, security logs, or records required by law until those systems complete their normal retention cycles.</p>
  <h3>Security and participant responsibility</h3>
  <p>PlanEx uses reasonable administrative and technical safeguards, but no online service can guarantee absolute confidentiality or security. Participants are responsible for avoiding submission of confidential, sensitive, or private information. To the extent permitted by applicable law, PlanEx cannot accept responsibility for disclosure or other consequences resulting from a participant voluntarily submitting information that this notice instructs participants not to submit.</p>
  <h3>Your choices</h3>
  <p>You may contact PlanEx regarding access, correction, or deletion of your account information. Interim contact: <b>no-reply@auth.planex-bp.com</b>.</p>
  <p class="muted">This notice may be updated if the program's data practices change.</p>`}
function termsOfUseHtml(){return `<h2 id="modalTitle">Terms of Use</h2>
  <p class="muted"><b>Effective:</b> September 24, 2026</p>
  <p>The Mayo 2026 Program Companion is provided by PlanEx for authorized program participants and program administration.</p>
  <h3>Appropriate use</h3>
  <p>Use the app only for legitimate program-related coordination, networking, communication and activities. Do not share your account credentials or use another participant's account.</p>
  <h3>No confidential or sensitive content</h3>
  <p>Do not use the app to enter, upload, transmit, request, or exchange confidential information, sensitive personal information, medical or health information, financial information, passwords, regulated information, or any information about yourself or another person that should remain private.</p>
  <h3>Respect other participants</h3>
  <p>Do not harass others, impersonate another person, post unlawful or inappropriate content, or disclose another participant's information outside the program without permission.</p>
  <h3>Security and responsibility</h3>
  <p>PlanEx will use reasonable safeguards but cannot guarantee that an online service will be error-free, continuously available, or absolutely secure. Participants accept responsibility for the information they choose to submit and agree to avoid information that should not be disclosed. To the extent permitted by applicable law, PlanEx is not responsible for disclosure or consequences arising from a participant's voluntary submission of information prohibited by these Terms.</p>
  <h3>Program end</h3>
  <p>The app is temporary. PlanEx intends to shut down the site/app and delete participant-entered information and the active program database within 12 months after the Mayo 2026 program ends, subject to temporary provider backups, security logs, and legal retention requirements.</p>
  <h3>Account administration</h3>
  <p>PlanEx may suspend or remove access when reasonably necessary for security, program administration, misuse, or compliance with applicable requirements.</p>`}
function openPrivacyNotice(){openModal(privacyNoticeHtml())}
function openTermsOfUse(){openModal(termsOfUseHtml())}
function totalUnread(){return Object.values(state.unread||{}).reduce((a,b)=>a+(Number(b)||0),0)}
function updateBadge(){const b=$('#messageBadge');if(!b)return;const n=totalUnread();b.textContent=n;b.classList.toggle('hidden',!n)}
function navTo(r){
  route=r;
  sessionStorage.setItem(routeKey,route);
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===r));
  render();
  requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}));
}
function setTitle(t){$('#pageTitle').textContent=t}
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden');$('#modalContent').innerHTML=''}
function setSyncBadge(text,kind='local'){const el=$('#syncBadge');if(!el)return;el.textContent=text;el.className=`sync-badge ${kind}`}
function showError(err){console.error(err);alert(err?.message||String(err))}

async function refreshCloudState({renderPage=true,throwOnError=false}={}){
  if(backendMode!=='supabase')return false;
  if(cloudRefreshPromise){
    try{await cloudRefreshPromise;if(renderPage)render();return true;}
    catch(e){if(throwOnError)throw e;return false;}
  }
  cloudRefreshing=true;setSyncBadge('Syncing…','syncing');
  cloudRefreshPromise=(async()=>{
    const nextState=await window.MayoCloud.loadState(seed);
    state=nextState;
    setSyncBadge('Cloud Beta','cloud');
    return true;
  })();
  try{
    await cloudRefreshPromise;
    if(renderPage)render();
    return true;
  }catch(e){
    setSyncBadge('Sync error','error');
    console.error(e);
    if(throwOnError)throw e;
    return false;
  }finally{
    cloudRefreshPromise=null;
    cloudRefreshing=false;
  }
}

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function loadSignedInStateWithRetry(){
  let lastError=null;
  for(const waitMs of [0,150,500,1000]){
    if(waitMs)await delay(waitMs);
    try{
      await MayoCloud.getSession();
      const ok=await refreshCloudState({renderPage:false,throwOnError:true});
      if(ok)return true;
    }catch(e){lastError=e;console.warn('Post-sign-in state load retry',e);}
  }
  if(lastError)throw lastError;
  return false;
}

function render(){
  const map={home:renderHome,schedule:renderSchedule,challenge:renderChallenge,people:renderPeople,messages:renderMessages,more:renderMore};
  sessionStorage.setItem(routeKey,route);
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
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
          The confirmation email will come from <b>no-reply@auth.planex-bp.com</b>. If you do not see it, please check your <b>Junk/Spam</b> folder.
        </div>
        <div class="retry-notice"><b>Having trouble?</b> Please wait a few minutes before trying again. If you have made several attempts, wait up to one hour before requesting another email.</div>
        <label class="consent-row"><input id="privacyConsent" type="checkbox"><span>I have read the <button type="button" class="text-link" id="openPrivacySignup">Privacy Notice</button> and understand that my information may be processed and stored in the United States for operation of the Mayo 2026 Program Companion.</span></label>
        <label class="consent-row"><input id="termsConsent" type="checkbox"><span>I agree to the <button type="button" class="text-link" id="openTermsSignup">Terms of Use</button>, including the requirement not to submit or exchange confidential, sensitive, private, or other information that should not be disclosed.</span></label>
        <button class="btn pink full" id="createAccountBtn">Create Account</button>
        <div class="policy-links"><button type="button" class="text-link" id="openPrivacyFooter">Privacy Notice</button><span>•</span><button type="button" class="text-link" id="openTermsFooter">Terms of Use</button></div>
        <div id="signupStatus" class="muted center auth-status"></div>
      </div>

      <div id="signInPanel" class="hidden">
        <h3>Sign in</h3>
        <p class="muted">Already registered? Sign in with your email and password.</p>
        <div class="form-group"><label>Email</label><input id="loginEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
        <div class="form-group"><label>Password</label><input id="loginPassword" type="password" autocomplete="current-password"></div>
        <button class="btn pink full" id="passwordSignIn">Sign In</button>
        <button class="btn ghost full" id="forgotPasswordBtn" type="button">Forgot password?</button>
        <div class="retry-notice compact"><b>Having trouble?</b> If sign-in or password reset does not work after several attempts, wait a few minutes and try again. You may need to wait up to one hour before requesting another email.</div>
        <div class="policy-links"><button type="button" class="text-link" id="openPrivacySignin">Privacy Notice</button><span>•</span><button type="button" class="text-link" id="openTermsSignin">Terms of Use</button></div>
        <div id="loginStatus" class="muted center auth-status"></div>
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
  $('#openPrivacySignup').onclick=openPrivacyNotice;$('#openTermsSignup').onclick=openTermsOfUse;
  $('#openPrivacyFooter').onclick=openPrivacyNotice;$('#openTermsFooter').onclick=openTermsOfUse;
  $('#openPrivacySignin').onclick=openPrivacyNotice;$('#openTermsSignin').onclick=openTermsOfUse;

  $('#createAccountBtn').onclick=async()=>{
    const fullName=$('#signupName').value.trim(),organization=$('#signupOrg').value.trim(),email=$('#signupEmail').value.trim(),password=$('#signupPassword').value,password2=$('#signupPassword2').value;
    if(!fullName||!email||!password)return alert('Enter your name, email, and password.');
    if(password.length<6)return alert('Use a password with at least 6 characters.');
    if(password!==password2)return alert('The passwords do not match.');
    if(!$('#privacyConsent').checked||!$('#termsConsent').checked)return alert('Please review and accept the Privacy Notice and Terms of Use before creating your account.');
    const btn=$('#createAccountBtn');btn.disabled=true;$('#signupStatus').textContent='Creating your account…';
    try{
      const data=await MayoCloud.signUpWithPassword({email,password,fullName,organization});
      if(data.session){
        $('#signupStatus').innerHTML='<b>Account created.</b><br>Signing you in…';
        await refreshCloudState();MayoCloud.subscribe(()=>refreshCloudState());
      }else{
        $('#signupStatus').innerHTML='<b>Almost done — check your email.</b><br>Open the confirmation message from <b>no-reply@auth.planex-bp.com</b>. If you do not see the message, check your Junk/Spam folder. After confirming, return here and sign in with your email and password.';
      }
    }catch(e){showError(e);$('#signupStatus').textContent='Could not create the account. If you already registered, switch to Sign in. Otherwise, wait a few minutes and try again; after several attempts, you may need to wait up to one hour.';}
    finally{btn.disabled=false;}
  };

  $('#passwordSignIn').onclick=async()=>{
    const email=$('#loginEmail').value.trim(),password=$('#loginPassword').value;if(!email||!password)return alert('Enter email and password.');
    const btn=$('#passwordSignIn');btn.disabled=true;signInFlowActive=true;$('#loginStatus').textContent='Signing in…';
    try{
      await MayoCloud.signInWithPassword(email,password);
      $('#loginStatus').textContent='Loading your account…';
      await loadSignedInStateWithRetry();
      MayoCloud.subscribe(()=>refreshCloudState());
      route='home';
      render();
    }
    catch(e){
      console.error(e);
      const hasSession=await MayoCloud.getSession().catch(()=>null);
      if(hasSession){
        $('#loginStatus').innerHTML='<b>You are signed in, but your account data did not finish loading.</b><br>Please try again in a moment or refresh this page.';
      }else{
        $('#loginStatus').textContent='Could not sign in. Make sure your email is confirmed and your password is correct.';
      }
    }
    finally{signInFlowActive=false;btn.disabled=false;}
  };

  $('#forgotPasswordBtn').onclick=()=>renderForgotPassword();

}

function renderForgotPassword(){
  document.body.classList.add('auth-screen');setTitle('Reset Password');$('#roleBadge').classList.add('hidden');setSyncBadge('Cloud Beta','cloud');
  $('#view').innerHTML=`<section class="auth-wrap">
    <div class="hero"><div class="eyebrow" style="color:#FFD5E6">Mayo 2026 Program Companion</div><h2>Reset your password</h2><p>Enter your registered email address and we’ll send you a secure reset link.</p></div>
    <div class="card auth-card">
      <div class="form-group"><label>Email</label><input id="resetEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
      <div class="email-notice compact">The reset email will come from <b>no-reply@auth.planex-bp.com</b>. If you do not see it, please check your <b>Junk/Spam</b> folder.</div><div class="retry-notice compact"><b>Having trouble?</b> Please wait a few minutes before trying again. If you have made several attempts, wait up to one hour before requesting another reset email.</div>
      <button class="btn pink full" id="sendResetBtn">Send Password Reset Link</button>
      <button class="btn ghost full" id="backToSignInBtn">Back to Sign In</button>
      <div id="resetStatus" class="muted center auth-status"></div>
    </div>
  </section>`;
  $('#backToSignInBtn').onclick=()=>renderLogin();
  $('#sendResetBtn').onclick=async()=>{
    const email=$('#resetEmail').value.trim();if(!email)return alert('Enter your email address.');
    const btn=$('#sendResetBtn');btn.disabled=true;$('#resetStatus').textContent='Sending…';
    try{await MayoCloud.requestPasswordReset(email);$('#resetStatus').innerHTML='<b>Check your email.</b><br>If an account exists for this address, a password reset link has been sent. If you do not see it, check your Junk/Spam folder.';}
    catch(e){showError(e);$('#resetStatus').textContent='Could not send the reset link. Please wait a few minutes and try again. After several attempts, you may need to wait up to one hour.';}
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


function inviteSetupRequested(){
  try{return new URLSearchParams(window.location.search).get('setup')==='invite';}catch(_e){return false;}
}
function clearInviteSetupFlag(){
  try{history.replaceState({},document.title,window.location.pathname);}catch(_e){}
}
function renderInviteSetup(){
  document.body.classList.add('auth-screen');setTitle('Finish Account Setup');$('#roleBadge').classList.add('hidden');setSyncBadge('Cloud Beta','cloud');
  $('#view').innerHTML=`<section class="auth-wrap">
    <div class="hero"><div class="eyebrow" style="color:#FFD5E6">Mayo 2026 Program Companion</div><h2>Finish your account setup</h2><p>Create your password and review the program’s Privacy Notice and Terms of Use.</p></div>
    <div class="card auth-card">
      <div class="form-group"><label>New password</label><input id="invitePassword" type="password" autocomplete="new-password" placeholder="At least 6 characters"></div>
      <div class="form-group"><label>Confirm new password</label><input id="invitePassword2" type="password" autocomplete="new-password" placeholder="Re-enter your password"></div>
      <label class="consent-row"><input id="invitePrivacyConsent" type="checkbox"><span>I have read the <button type="button" class="text-link" id="invitePrivacyLink">Privacy Notice</button> and understand that my information may be processed and stored in the United States for operation of the Mayo 2026 Program Companion.</span></label>
      <label class="consent-row"><input id="inviteTermsConsent" type="checkbox"><span>I agree to the <button type="button" class="text-link" id="inviteTermsLink">Terms of Use</button>, including the requirement not to submit or exchange confidential, sensitive, private, or other information that should not be disclosed.</span></label>
      <button class="btn pink full" id="finishInviteSetup">Set Password & Enter App</button>
      <div id="inviteSetupStatus" class="muted center auth-status"></div>
    </div>
  </section>`;
  $('#invitePrivacyLink').onclick=openPrivacyNotice;$('#inviteTermsLink').onclick=openTermsOfUse;
  $('#finishInviteSetup').onclick=async()=>{
    const p1=$('#invitePassword').value,p2=$('#invitePassword2').value;
    if(p1.length<6)return alert('Use a password with at least 6 characters.');
    if(p1!==p2)return alert('The passwords do not match.');
    if(!$('#invitePrivacyConsent').checked||!$('#inviteTermsConsent').checked)return alert('Please review and accept the Privacy Notice and Terms of Use.');
    const btn=$('#finishInviteSetup');btn.disabled=true;$('#inviteSetupStatus').textContent='Finishing setup…';
    try{
      await MayoCloud.updatePassword(p1);
      clearInviteSetupFlag();
      document.body.classList.remove('auth-screen');$('#roleBadge').classList.remove('hidden');
      await refreshCloudState({renderPage:false});
      MayoCloud.subscribe(()=>refreshCloudState());
      route='home';render();
    }catch(e){showError(e);$('#inviteSetupStatus').textContent='Could not finish account setup. Please reopen the invitation email and try again.';btn.disabled=false;}
  };
}

function renderHome(){
  setTitle('Home');const u=currentUser();const now=Date.now();const next=state.schedule.find(e=>!e.startsAt||new Date(e.startsAt).getTime()>=now)||state.schedule[0];const done=state.missions.filter(m=>m.done).length;
  $('#view').innerHTML=`<section class="hero"><h2>Welcome, ${esc((u.name||'Participant').split(' ')[0])}!</h2><p class="hero-message"><strong>Connect • Contribute • Stretch</strong><br><span>Stay coachable. Step outside your comfort zone.</span></p></section>
    <section class="section"><div class="section-head"><h3>Up Next</h3><span class="pill">Program</span></div>${next?`<div class="card clickable" data-event="${next.id}"><div class="time">${esc(next.time)}</div><h3 style="margin:6px 0">${esc(next.title)}</h3><p class="muted">📍 ${esc(next.location)}</p><button class="btn ghost" style="margin-top:8px">View details</button></div>`:'<div class="card empty">No schedule has been published yet.</div>'}</section>
    <section class="section"><div class="section-head"><h3>Today’s Mission</h3><span class="pill pink">${done}/${state.missions.length} complete</span></div>${state.missions.length?missionCard(state.missions.find(m=>!m.done)||state.missions[0]):'<div class="card empty">No missions have been published yet.</div>'}</section>
    <section class="section"><div class="grid two"><div class="card"><div class="kpi"><div class="kpi-icon">★</div><div><strong>${state.points[u.id]||0}</strong><small>My points</small></div></div></div><div class="card"><div class="kpi"><div class="kpi-icon">✉</div><div><strong>${totalUnread()}</strong><small>Unread messages</small></div></div></div></div></section>
    <section class="section"><div class="section-head"><h3>Quick Access</h3></div><div class="grid three">${quick('schedule','▣','Schedule')}${quick('challenge','◆','Challenge')}${quick('people','◉','People')}${quick('messages','✉','Messages')}${quick('more','⏱','Tools')}${quick('more','⚙','More')}</div></section>`;
  $$('[data-go]').forEach(b=>b.onclick=()=>navTo(b.dataset.go));$$('[data-event]').forEach(el=>el.onclick=()=>showEvent(el.dataset.event));$$('[data-mission]').forEach(el=>el.onclick=()=>showMission(el.dataset.mission));
}
function quick(r,i,l){return `<button class="quick-button" data-go="${r}"><span>${i}</span><b>${l}</b></button>`}
function missionCard(m){return `<div class="card mission-row ${m.done?'completed':''}" data-mission="${m.id}"><div class="icon-box">${m.icon||'⭐'}</div><div><h4>${esc(m.title)}</h4><span class="pill ${m.category==='Stretch'?'orange':m.category==='Contribute'?'green':'pink'}">${esc(m.category)}</span>${m.status==='pending'?'<span class="pill orange" style="margin-left:5px">Pending</span>':''}</div><div class="points">+${m.points}</div></div>`}


function eventMapUrl(e){
  if(e?.locationUrl)return e.locationUrl;
  const details=String(e?.details||'');
  const addressMatch=details.match(/(?:^|\n|\.\s+)Address:\s*([^\n]+)/i);
  const query=(addressMatch?.[1]||e?.location||'').trim();
  if(!query)return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
function dateKeyInZone(value,timeZone){
  if(!value)return '';
  const d=value instanceof Date?value:new Date(value);
  const fmt=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:timeZone||undefined});
  const parts=Object.fromEntries(fmt.formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function eventEnded(e,now=Date.now()){
  if(!e?.startsAt)return false;
  const start=new Date(e.startsAt).getTime();
  const end=e.endsAt?new Date(e.endsAt).getTime():start+(60*60*1000);
  return end<=now;
}
function scheduleDescriptionHtml(e){
  const raw=String(e?.details||'').trim();
  if(!raw)return '';
  let about=raw, speaker='', address='';
  const speakerMatch=about.match(/(?:^|\n|\s)Speaker(?:\(s\))?\s*\/\s*Host:\s*([\s\S]*?)(?=(?:\n|\s)Address:|$)/i);
  if(speakerMatch){speaker=speakerMatch[1].trim();about=about.replace(speakerMatch[0],' ').trim();}
  const addressMatch=about.match(/(?:^|\n|\s)Address:\s*([\s\S]*?)$/i);
  if(addressMatch){address=addressMatch[1].trim();about=about.replace(addressMatch[0],' ').trim();}
  about=about.replace(/\s{2,}/g,' ').trim();
  const rows=[];
  // The general About text is intentionally omitted because most schedule
  // descriptions duplicate the event title. Keep only actionable metadata.
  if(speaker)rows.push(`<div class="schedule-info-row"><span class="schedule-info-label speaker">Speaker / Host</span><span>${esc(speaker)}</span></div>`);
  if(address)rows.push(`<div class="schedule-info-row"><span class="schedule-info-label address">Address</span><span>${esc(address)}</span></div>`);
  return rows.length?`<div class="schedule-info">${rows.join('')}</div>`:'';
}
function rememberSchedulePosition(){
  if(route!=='schedule')return;
  scheduleScrollY=window.scrollY||0;
  sessionStorage.setItem(scheduleScrollKey,String(scheduleScrollY));
}
window.addEventListener('scroll',()=>{if(route==='schedule')rememberSchedulePosition()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)rememberSchedulePosition();});

function renderSchedule(){
  setTitle('Schedule');
  $('#view').innerHTML=`<div class="tabs"><button class="tab ${scheduleTab==='today'?'active':''}" data-stab="today">Today</button><button class="tab ${scheduleTab==='full'?'active':''}" data-stab="full">Full Program</button><button class="tab ${scheduleTab==='mine'?'active':''}" data-stab="mine">My Schedule</button></div><div id="scheduleBody"></div>`;
  $$('[data-stab]').forEach(b=>b.onclick=()=>{
    scheduleTab=b.dataset.stab;
    sessionStorage.setItem(scheduleTabKey,scheduleTab);
    scheduleScrollY=0;sessionStorage.setItem(scheduleScrollKey,'0');
    $$('[data-stab]').forEach(x=>x.classList.toggle('active',x===b));
    renderScheduleList(scheduleTab);
    window.scrollTo({top:0,behavior:'auto'});
  });
  renderScheduleList(scheduleTab);
  requestAnimationFrame(()=>{if(route==='schedule'&&scheduleScrollY>0)window.scrollTo({top:scheduleScrollY,behavior:'auto'});});
}
function renderScheduleList(tab){
  const body=$('#scheduleBody');if(!body)return;
  const bookmarks=new Set(state.bookmarkedEventIds||[]);
  let list=[...state.schedule];let heading='Full Program';let emptyMessage='No events in this view.';
  if(tab==='mine'){list=list.filter(e=>bookmarks.has(e.id));heading='My Schedule';}
  if(tab==='today'){
    const now=new Date();
    const allToday=list.filter(e=>e.startsAt&&dateKeyInZone(e.startsAt,e.timeZone)===dateKeyInZone(now,e.timeZone));
    if(allToday.length){
      list=allToday.filter(e=>!eventEnded(e,now.getTime()));
      heading='Today';
      if(!list.length)emptyMessage="Today's program is complete.";
    }else{
      const future=list.filter(e=>e.startsAt&&new Date(e.startsAt)>now).sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));
      if(future.length){
        const first=future[0];
        const key=dateKeyInZone(first.startsAt,first.timeZone);
        list=future.filter(e=>dateKeyInZone(e.startsAt,e.timeZone)===key);
        heading=`Next program day · ${first.date}`;
      }else {list=[];heading='Today';emptyMessage='No upcoming program events.';}
    }
  }
  body.innerHTML=`<div class="section-head"><h3>${esc(heading)}</h3><span class="pill">${list.length} events</span></div><div class="detail-list">${list.map(e=>scheduleDetailCard(e,bookmarks.has(e.id))).join('')||`<div class="empty">${esc(emptyMessage)}</div>`}</div>`;
  $$('[data-schedule-toggle]').forEach(btn=>btn.onclick=async()=>{
    const id=btn.dataset.scheduleToggle;
    const saved=(state.bookmarkedEventIds||[]).includes(id);
    btn.disabled=true;const previous=btn.textContent;btn.textContent='Saving…';
    try{
      if(backendMode==='supabase'){await MayoCloud.toggleScheduleBookmark(id,saved);await refreshCloudState({renderPage:false});}
      else{state.bookmarkedEventIds=state.bookmarkedEventIds||[];state.bookmarkedEventIds=saved?state.bookmarkedEventIds.filter(x=>x!==id):[...state.bookmarkedEventIds,id];save();}
      renderScheduleList(tab);
    }catch(err){showError(err);btn.disabled=false;btn.textContent=previous;}
  });
  $$('[data-map-event]').forEach(btn=>btn.onclick=()=>{const e=state.schedule.find(x=>x.id===btn.dataset.mapEvent);const url=eventMapUrl(e);if(url)window.open(url,'_blank');});
  $$('[data-attachment-event]').forEach(btn=>btn.onclick=()=>{const e=state.schedule.find(x=>x.id===btn.dataset.attachmentEvent);if(e?.attachmentUrl)window.open(e.attachmentUrl,'_blank');});
}
function scheduleDetailCard(e,saved){
  const mapUrl=eventMapUrl(e);
  const attachment=e.attachmentUrl?`<button class="btn pink" data-attachment-event="${e.id}">Open File</button>`:'';
  return `<article class="card detail-card schedule-detail-card">
    <div class="detail-main">
      <div class="detail-meta"><span class="pill">${esc(e.date||'Program')}</span><span class="time">${esc(e.time||'TBD')}</span></div>
      <h3>${esc(e.title)}</h3>
      ${e.location?`<p class="detail-location">📍 ${esc(e.location)}</p>`:''}
      ${scheduleDescriptionHtml(e)}
    </div>
    <div class="detail-actions schedule-actions">
      <button class="btn pink" data-map-event="${e.id}" ${mapUrl?'':'disabled'}>Open Map</button>
      ${attachment}
      <button class="btn pink" data-schedule-toggle="${e.id}">${saved?'★ Remove from My Schedule':'☆ Add to My Schedule'}</button>
    </div>
  </article>`;
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
  openModal(`<h2 id="modalTitle">${esc(e.title)}</h2><span class="pill">${esc(e.date)}</span><p><b>${esc(e.time)}</b></p><p>📍 ${esc(e.location)}</p><div class="card notice"><b>About</b><p>${esc(e.details)}</p></div><div class="spacer"></div>${mapButton}<button class="btn ghost full" id="bookmarkEvent">${saved?'★ Remove from My Schedule':'☆ Add to My Schedule'}</button>`);
  if($('#openMap'))$('#openMap').onclick=()=>window.open(e.locationUrl,'_blank');
  $('#bookmarkEvent').onclick=async()=>{try{if(backendMode==='supabase'){await MayoCloud.toggleScheduleBookmark(id,saved);await refreshCloudState({renderPage:false});}else{state.bookmarkedEventIds=state.bookmarkedEventIds||[];state.bookmarkedEventIds=saved?state.bookmarkedEventIds.filter(x=>x!==id):[...state.bookmarkedEventIds,id];save();}closeModal();renderSchedule();}catch(err){showError(err)}};
}
function renderChallenge(){setTitle('Challenge');$('#view').innerHTML=`<div class="tabs"><button class="tab active" data-ctab="missions">Missions</button><button class="tab" data-ctab="points">My Points</button><button class="tab" data-ctab="leaderboard">Leaderboard</button></div><div id="challengeBody"></div>`;$$('[data-ctab]').forEach(b=>b.onclick=()=>{$$('[data-ctab]').forEach(x=>x.classList.toggle('active',x===b));renderChallengeTab(b.dataset.ctab)});renderChallengeTab('missions');}
function renderChallengeTab(tab){
  const body=$('#challengeBody');const u=currentUser();
  if(tab==='missions'){
    body.innerHTML=`<div class="section-head"><h3>Today’s Missions</h3><span class="pill pink">${state.missions.filter(m=>m.done).length}/${state.missions.length}</span></div><div class="detail-list">${state.missions.map(m=>missionDetailCard(m)).join('')||'<div class="empty">No missions published yet.</div>'}</div>`;
    $$('[data-complete-mission]').forEach(btn=>btn.onclick=async()=>{
      const id=btn.dataset.completeMission;const m=state.missions.find(x=>x.id===id);if(!m)return;
      const undoing=m.done;
      if(undoing){
        const message=`Undo completion of "${m.title}"? ${m.points} points will be removed.`;
        if(!confirm(message))return;
      }
      btn.disabled=true;const previous=btn.textContent;btn.textContent=undoing?'Undoing…':'Saving…';
      try{
        if(backendMode==='supabase'){
          if(undoing)await MayoCloud.undoMission(id);else await MayoCloud.completeMission(id);
          await refreshCloudState({renderPage:false});
          renderChallengeTab('missions');
        }else{
          const wasDone=m.done;
          if(undoing){
            m.done=false;m.status=null;
            if(wasDone)state.points[state.currentUserId]=Math.max(0,(state.points[state.currentUserId]||0)-m.points);
          }else{
            m.done=true;m.status='approved';
            state.points[state.currentUserId]=(state.points[state.currentUserId]||0)+m.points;
          }
          save();renderChallengeTab('missions');
        }
      }catch(e){showError(e);btn.disabled=false;btn.textContent=previous;}
    });
  }
  if(tab==='points')body.innerHTML=`<div class="hero center"><div class="eyebrow" style="color:#FFD5E6">My Score</div><h2>${state.points[u.id]||0} pts</h2><p>Keep connecting, contributing, and stretching.</p></div><section class="section"><div class="card"><h3>Recent Kudos</h3>${(state.kudos||[]).filter(k=>k.to===u.id).slice(0,8).map(k=>`<p>💗 <b>${esc(person(k.from)?.name||'Someone')}</b>: ${esc(k.text)}</p>`).join('')||'<p class="muted">No kudos yet.</p>'}</div></section>`;
  if(tab==='leaderboard')body.innerHTML=leaderboardHtml();
  $$('[data-ltab]').forEach(b=>b.onclick=()=>{$$('[data-ltab]').forEach(x=>x.classList.toggle('active',x===b));$('#leaderboardRows').innerHTML=b.dataset.ltab==='team'?teamLeaderboardRows():individualLeaderboardRows();});
}
function missionDetailCard(m){
  const label=m.done?'Undo Completion':'Complete Mission';
  const disabled=false;
  return `<article class="card detail-card mission-detail-card ${m.done?'completed':''}">
    <div class="detail-main">
      <div class="detail-title-row"><div class="icon-box">${m.icon||'⭐'}</div><div><h3>${esc(m.title)}</h3><div class="inline-actions"><span class="pill ${m.category==='Stretch'?'orange':m.category==='Contribute'?'green':'pink'}">${esc(m.category)}</span><span class="pill green">+${m.points} pts</span></div></div></div>
      <p class="detail-description">${esc(m.description||'Complete this mission during the program.')}</p>
    </div>
    <div class="detail-actions">
      <button class="btn ${m.done?'ghost':'pink'}" data-complete-mission="${m.id}" ${disabled?'disabled':''}>${label}</button>
    </div>
  </article>`;
}
function individualLeaderboardRows(){const rows=state.people.map(p=>({p,pts:state.points[p.id]||0})).sort((a,b)=>b.pts-a.pts);return `<table class="score-table">${rows.map((r,i)=>`<tr class="${i===0?'winner':''}"><td>${i+1}. ${esc(r.p.name)}</td><td>${r.pts} pts</td></tr>`).join('')}</table>`}
function teamLeaderboardRows(){let rows=state.teamLeaderboard||[];if(!rows.length){const map={};state.people.forEach(p=>{if(p.team)map[p.team]=(map[p.team]||0)+(state.points[p.id]||0)});rows=Object.entries(map).map(([name,points])=>({name,points})).sort((a,b)=>b.points-a.points)}return `<table class="score-table">${rows.map((r,i)=>`<tr class="${i===0?'winner':''}"><td>${i+1}. ${esc(r.name)}</td><td>${r.points} pts</td></tr>`).join('')||'<tr><td>No teams yet.</td><td></td></tr>'}</table>`}
function leaderboardHtml(){return `<div class="tabs"><button class="tab active" data-ltab="individual">Individual</button><button class="tab" data-ltab="team">Team</button></div><div id="leaderboardRows">${individualLeaderboardRows()}</div>`}
function showMission(id){
  const m=state.missions.find(x=>x.id===id);if(!m)return;
  openModal(`<h2 id="modalTitle">${m.icon||'⭐'} ${esc(m.title)}</h2>
    <p><span class="pill">${esc(m.category)}</span> <span class="pill green">+${m.points} pts</span></p>
    <p class="muted">${esc(m.description||'Complete this mission during the program.')}</p>
    <button class="btn ${m.done?'ghost':'pink'} full" id="toggleMission">${m.done?'Undo Completion':'Complete Mission'}</button>`);
  $('#toggleMission').onclick=async()=>{
    const undoing=m.done;
    if(undoing&&!confirm(`Undo completion of "${m.title}"? ${m.points} points will be removed.`))return;
    const btn=$('#toggleMission');btn.disabled=true;btn.textContent=undoing?'Undoing…':'Saving…';
    try{
      if(backendMode==='supabase'){
        if(undoing)await MayoCloud.undoMission(id);else await MayoCloud.completeMission(id);
        closeModal();await refreshCloudState();
      }else{
        m.done=!m.done;m.status=m.done?'approved':null;
        state.points[state.currentUserId]=Math.max(0,(state.points[state.currentUserId]||0)+(m.done?m.points:-m.points));
        save();closeModal();render();
      }
    }catch(e){showError(e);btn.disabled=false;btn.textContent=undoing?'Undo Completion':'Complete Mission';}
  };
}

function renderPeople(){setTitle('People');$('#view').innerHTML=`<div class="tabs"><button class="tab active" data-ptab="all">All Participants</button><button class="tab" data-ptab="team">My Team</button></div><input id="peopleSearch" class="search" placeholder="Search by name, affiliation, or interest…"><div id="peopleList" class="people-grid"></div>`;$('#peopleSearch').oninput=()=>renderPeopleList($('#peopleSearch').value,$('.tab.active')?.dataset.ptab||'all');$$('[data-ptab]').forEach(b=>b.onclick=()=>{$$('[data-ptab]').forEach(x=>x.classList.toggle('active',x===b));renderPeopleList($('#peopleSearch').value,b.dataset.ptab)});renderPeopleList('','all');}
function renderPeopleList(q,tab){const u=currentUser();q=(q||'').toLowerCase();const list=state.people.filter(p=>p.id!==u.id).filter(p=>tab!=='team'||p.team===u.team).filter(p=>[p.name,p.org,p.title,p.interests,p.bio].join(' ').toLowerCase().includes(q));$('#peopleList').innerHTML=list.map(p=>`<article class="person-card"><div class="person-top"><div class="avatar">${esc(p.initials)}</div><div class="main"><h3>${esc(p.name)}</h3><p class="person-role">${esc(p.org)}${p.title?' • '+esc(p.title):''}</p>${p.team?`<span class="pill">Team ${esc(p.team)}</span>`:''}</div></div>${p.interests?`<div class="person-field"><b>Interests</b><span>${esc(p.interests)}</span></div>`:''}${p.bio?`<div class="person-field"><b>About</b><span>${esc(p.bio)}</span></div>`:''}<div class="person-actions"><button class="btn pink" data-message-person="${p.id}">Message</button><button class="btn ghost" data-kudos-person="${p.id}">Kudo</button></div></article>`).join('')||'<div class="empty">No participants found.</div>';$$('[data-message-person]').forEach(el=>el.onclick=()=>{route='messages';render();openChat('direct',el.dataset.messagePerson)});$$('[data-kudos-person]').forEach(el=>el.onclick=()=>openKudosComposer(el.dataset.kudosPerson));}
function openKudosComposer(id){
  const p=person(id);if(!p)return;
  openModal(`<h2 id="modalTitle">Give Kudos to ${esc(p.name)}</h2>
    <p class="muted">Recognize something specific they did that made the program or team better.</p>
    <div class="kudo-points-note">Giving Kudos: <b>+5 pts</b> to you · <b>+3 pts</b> to the recipient<br><small>One Kudo per person per program day.</small></div>
    <textarea id="kudosText" placeholder="Thanks for making the discussion inclusive…"></textarea>
    <div class="spacer"></div><button class="btn pink full" id="sendKudos">Send Kudos</button>`);
  $('#sendKudos').onclick=async()=>{
    const text=$('#kudosText').value.trim();if(!text)return alert('Write a short kudos message.');
    try{
      if(backendMode==='supabase'){
        await MayoCloud.giveKudos(id,text);
        await refreshCloudState({renderPage:false});
      }else{
        const today=new Date().toISOString().slice(0,10);
        const already=(state.kudos||[]).some(k=>k.from===state.currentUserId&&k.to===id&&String(k.createdAt||'').slice(0,10)===today);
        if(already)throw new Error('You already gave this participant Kudos today. Try again tomorrow.');
        state.kudos.push({id:'k'+Date.now(),from:state.currentUserId,to:id,text,createdAt:new Date().toISOString()});save();
      }
      closeModal();alert('Kudos sent. +5 points to you and +3 points to the recipient.');
    }catch(e){
      const msg=String(e?.message||e);
      if(msg.includes('kudos_one_per_recipient_per_program_day')||msg.toLowerCase().includes('duplicate key')){
        alert('You already gave this participant Kudos today. Try again tomorrow.');
      }else showError(e);
    }
  };
}
function showPerson(id){const p=person(id);if(!p)return;openModal(`<h2 id="modalTitle">${esc(p.name)}</h2><div class="avatar" style="width:74px;height:74px;font-size:20px">${esc(p.initials)}</div><p><b>${esc(p.org)}</b><br>${esc(p.title)}</p><p><b>Interests</b><br>${esc(p.interests)}</p><p><b>About</b><br>${esc(p.bio)}</p><div class="person-actions"><button class="btn pink" id="messagePerson">Message</button><button class="btn ghost" id="kudosPerson">Kudo</button></div>`);$('#messagePerson').onclick=()=>{closeModal();route='messages';render();openChat('direct',id)};$('#kudosPerson').onclick=()=>openKudosComposer(id);}
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
  setTitle('More');const u=currentUser();const isAdmin=state.role==='admin';
  const account=`<section class="account-strip"><div><b>${esc(u.name)}</b><small>${esc(MayoCloud.session?.user?.email||u.org||'Participant')}</small></div><div class="account-actions"><button class="btn ghost compact" id="editProfile">Edit Profile</button>${backendMode==='supabase'?'<button class="btn ghost compact" id="signOutBtn">Sign Out</button>':''}</div></section>`;
  const participantTools=`<div class="grid two">${toolCard('timer','⏱','Presentation Timer','30 sec, 1, 2, 3 & 5 min')}${toolCard('poll','▥','Quick Poll','Vote and review your poll history')}</div>`;
  const adminTools=isAdmin?`<section class="section"><div class="section-head"><h3>Admin Tools</h3><span class="pill orange">Admin only</span></div><div class="grid two">${toolCard('grouping','👥','Grouping','Balanced random groups')}${toolCard('random','🎲','Random Pick','Pick a participant')}</div><div class="spacer"></div><button class="btn full" id="openAdmin">Open Admin Panel</button></section>`:'';
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const notificationSection=backendMode==='supabase'?`<section class="section"><div class="section-head"><h3>Notifications</h3><span class="pill" id="notificationStatus">Checking…</span></div><div class="card notification-card"><div><b>Message notifications</b><p>Direct messages, team messages, and program announcements. Schedule/event notifications are off.</p><small>${standalone?'Notifications can appear on your Lock Screen after you allow them.':'Add Mayo 2026 to the iPhone Home Screen and open the installed app to enable notifications.'}</small></div><button class="btn pink" id="notificationToggle" ${standalone?'':'disabled'}>${standalone?'Enable Notifications':'Home Screen App Required'}</button></div></section>`:'';
  $('#view').innerHTML=`${account}<section class="section"><div class="section-head"><h3>Program Tools</h3><span class="pill">${backendMode==='supabase'?'Live':'Prototype'}</span></div>${participantTools}</section>${notificationSection}${adminTools}<section class="section"><div class="section-head"><h3>Privacy & Use</h3></div><div class="policy-inline"><button class="text-link" id="morePrivacy">Privacy Notice</button><span>•</span><button class="text-link" id="moreTerms">Terms of Use</button></div></section>`;
  $$('[data-tool]').forEach(el=>el.onclick=()=>openTool(el.dataset.tool));
  if($('#openAdmin'))$('#openAdmin').onclick=openAdmin;
  if($('#notificationToggle')){
    $('#notificationToggle').onclick=togglePushNotifications;
    syncNotificationUI();
  }
  $('#editProfile').onclick=editMyProfile;$('#morePrivacy').onclick=openPrivacyNotice;$('#moreTerms').onclick=openTermsOfUse;
  if($('#signOutBtn'))$('#signOutBtn').onclick=async()=>{await MayoCloud.signOut();renderLogin();};
}
async function syncNotificationUI(){
  const status=$('#notificationStatus'),btn=$('#notificationToggle');if(!status||!btn)return;
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(!standalone){status.textContent='PWA only';status.className='pill orange';btn.disabled=true;return;}
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window)){
    status.textContent='Not supported';status.className='pill orange';btn.disabled=true;return;
  }
  try{
    const sub=await MayoCloud.getPushSubscription();
    if(Notification.permission==='denied'){
      status.textContent='Blocked';status.className='pill orange';btn.textContent='Notifications Blocked';btn.disabled=true;
    }else if(sub){
      status.textContent='On';status.className='pill green';btn.textContent='Disable Notifications';btn.disabled=false;
    }else{
      status.textContent=Notification.permission==='granted'?'Off':'Not enabled';status.className='pill orange';btn.textContent='Enable Notifications';btn.disabled=false;
    }
  }catch(e){console.warn(e);status.textContent='Unavailable';status.className='pill orange';}
}
async function togglePushNotifications(){
  const btn=$('#notificationToggle');if(!btn)return;
  btn.disabled=true;
  try{
    const existing=await MayoCloud.getPushSubscription();
    if(existing){
      await MayoCloud.disablePushNotifications();
    }else{
      const result=await MayoCloud.enablePushNotifications(PUSH_VAPID_PUBLIC_KEY);
      if(result==='denied')alert('Notifications are blocked for Mayo 2026. You can change this in iPhone Settings > Notifications > Mayo 2026.');
    }
  }catch(e){showError(e)}
  finally{btn.disabled=false;await syncNotificationUI();}
}

function editMyProfile(){
  const u=currentUser();
  openModal(`<h2 id="modalTitle">Edit My Profile</h2><div class="form-group"><label>Name</label><input id="pName" value="${esc(u.name)}"></div><div class="form-group"><label>Organization</label><input id="pOrg" value="${esc(u.org)}"></div><div class="form-group"><label>Title / Role</label><input id="pTitle" value="${esc(u.title)}"></div><div class="form-group"><label>Interests</label><input id="pInterests" value="${esc(u.interests)}"></div><div class="form-group"><label>About me</label><textarea id="pBio">${esc(u.bio)}</textarea></div><button class="btn pink full" id="saveProfile">Save Profile</button>`);
  $('#saveProfile').onclick=async()=>{
    const values={
      fullName:$('#pName').value.trim(),
      organization:$('#pOrg').value.trim(),
      title:$('#pTitle').value.trim(),
      interests:$('#pInterests').value.trim(),
      bio:$('#pBio').value.trim()
    };
    if(!values.fullName)return alert('Enter your name.');
    try{
      if(backendMode==='supabase'){
        await MayoCloud.updateProfile(values);
        await refreshCloudState({renderPage:false});
      }else{
        Object.assign(u,{name:values.fullName,org:values.organization,title:values.title,interests:values.interests,bio:values.bio,initials:values.fullName.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()});
        save();
      }
      closeModal();
      render();
    }catch(e){showError(e)}
  };
}

function toolCard(id,icon,title,sub){return `<button class="card tool-card clickable" data-tool="${id}"><div class="big">${icon}</div><b>${title}</b><small>${sub}</small></button>`}
function openTool(id){if(id==='grouping')toolGrouping();if(id==='timer')toolTimer();if(id==='random')toolRandom();if(id==='poll')toolPoll();}
function toolGrouping(){
  openModal(`<h2 id="modalTitle">Grouping</h2><p class="muted">Creates random groups while reducing repeat clustering of existing teams.</p><div class="form-group"><label>Group size</label><select id="groupSize"><option>2</option><option selected>4</option><option>5</option></select></div><button class="btn pink full" id="makeGroups">Generate Groups</button><div id="groupResult" class="section"></div>`);
  $('#makeGroups').onclick=()=>{const size=+$('#groupSize').value;const people=[...state.people];const groupCount=Math.max(1,Math.ceil(people.length/size));const groups=Array.from({length:groupCount},()=>[]);const byTeam={};people.forEach(p=>(byTeam[p.team||'_none']||(byTeam[p.team||'_none']=[])).push(p));Object.values(byTeam).forEach(bucket=>bucket.sort(()=>Math.random()-.5));Object.values(byTeam).sort((a,b)=>b.length-a.length).forEach(bucket=>bucket.forEach(p=>{const choices=groups.map((g,i)=>({i,len:g.length,same:g.filter(x=>(x.team||'_none')===(p.team||'_none')).length})).filter(x=>x.len<size).sort((a,b)=>a.same-b.same||a.len-b.len||Math.random()-.5);groups[choices[0]?.i??0].push(p)}));$('#groupResult').innerHTML=groups.filter(g=>g.length).map((g,i)=>`<div class="card" style="margin-bottom:8px"><b>Group ${i+1}</b><p>${g.map(x=>`${esc(x.name)}${x.team?` <small>(${esc(x.team)})</small>`:''}`).join(' • ')}</p></div>`).join('')};
}
function toolRandom(){openModal(`<h2 id="modalTitle">Random Pick</h2><p class="muted">Pick one participant at random.</p><button class="btn pink full" id="pickPerson">Pick Someone</button><div id="pickResult" class="center" style="padding:28px"></div>`);$('#pickPerson').onclick=()=>{if(!state.people.length)return;const p=state.people[Math.floor(Math.random()*state.people.length)];$('#pickResult').innerHTML=`<div class="avatar" style="margin:auto;width:84px;height:84px;font-size:24px">${esc(p.initials)}</div><h2>${esc(p.name)}</h2><p>${esc(p.org)}</p>`}}
function pollIsOpen(p){return !!p.isOpen && (!p.closesAt || new Date(p.closesAt)>new Date())}
function pollStatusText(p){if(pollIsOpen(p))return p.closesAt?`Open until ${new Date(p.closesAt).toLocaleString()}`:'Open';return 'Closed'}
function voteLabel(p){return p.options.find(o=>o.id===p.myVote)?.label||'No vote recorded'}
function pollResultsHtml(p){const total=pollTotal(p);return `<div class="poll-results">${p.options.map(o=>{const pct=total?Math.round(o.votes/total*100):0;return `<div class="poll-result-row"><div><b>${esc(o.label)}</b><span>${o.votes} vote${o.votes===1?'':'s'} • ${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div></div>`}).join('')}<p class="muted">${total} total vote${total===1?'':'s'}</p></div>`}
function toolPoll(){const polls=[...(state.polls||[])].filter(p=>state.role==='admin'||p.isActive!==false).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));if(!polls.length)return openModal('<h2 id="modalTitle">Quick Poll</h2><div class="empty">No polls yet.</div>');const isAdmin=state.role==='admin';openModal(`<h2 id="modalTitle">Quick Poll</h2><p class="muted">${isAdmin?'Live results are visible to admins. Participants see results only after a poll closes.':'Vote while a poll is open. Your past choices remain visible here.'}</p><div id="pollList" class="list">${polls.map(p=>pollCardHtml(p,isAdmin)).join('')}</div>`);bindPollActions();}
function pollCardHtml(p,isAdmin){const open=pollIsOpen(p),my=voteLabel(p);if(isAdmin){return `<section class="card poll-card"><div class="section-head"><h3>${esc(p.question)}</h3><span class="pill ${open?'green':'orange'}">${esc(pollStatusText(p))}</span></div>${pollResultsHtml(p)}${open?`<button class="btn pink full" data-close-poll="${p.id}">Close & Publish Results</button>`:'<p class="muted">Results published to participants.</p>'}</section>`}return `<section class="card poll-card"><div class="section-head"><h3>${esc(p.question)}</h3><span class="pill ${open?'green':'orange'}">${esc(pollStatusText(p))}</span></div>${open?`<div class="poll-choice-list">${p.options.map(o=>`<button class="poll-choice ${p.myVote===o.id?'selected-option':''}" data-vote-poll="${p.id}" data-vote-option="${o.id}">${esc(o.label)}${p.myVote===o.id?' ✓':''}</button>`).join('')}</div><p class="muted">Your vote: <b>${esc(my)}</b>. Interim results are hidden until the poll closes.</p>`:`<p class="muted">You voted: <b>${esc(my)}</b></p>${pollResultsHtml(p)}`}</section>`}
function bindPollActions(){$$('[data-vote-poll]').forEach(b=>b.onclick=async()=>{const pollId=b.dataset.votePoll,optId=b.dataset.voteOption;try{if(backendMode==='supabase'){await MayoCloud.votePoll(pollId,optId);await refreshCloudState({renderPage:false});}else{const p=state.polls.find(x=>x.id===pollId);if(p){p.myVote=optId;save();}}toolPoll();}catch(e){showError(e)}});$$('[data-close-poll]').forEach(b=>b.onclick=async()=>{if(!confirm('Close this poll and publish results to participants?'))return;try{if(backendMode==='supabase'){await MayoCloud.closePoll(b.dataset.closePoll);await refreshCloudState({renderPage:false});}else{const p=state.polls.find(x=>x.id===b.dataset.closePoll);if(p){p.isOpen=false;p.resultsPublished=true;save();}}toolPoll();}catch(e){showError(e)}})}
function pollTotal(p){return p.options.reduce((a,b)=>a+(Number(b.votes)||0),0)}
function toolTimer(){timer.running=false;if(interval)clearInterval(interval);releaseTimerWakeLock();openModal(`<h2 id="modalTitle">Presentation Timer</h2><div class="tabs"><button class="tab" data-preset="30">30 sec</button><button class="tab" data-preset="60">1 min</button><button class="tab" data-preset="120">2 min</button><button class="tab active" data-preset="180">3 min</button><button class="tab" data-preset="300">5 min</button></div><div id="timerRing" class="timer-ring"><div id="timerDisplay" class="timer-display">03:00</div></div><div class="controls"><button class="btn green" id="timerStart">Start</button><button class="btn ghost" id="timerTestSound">Test Sound</button><button class="btn ghost" id="timerReset">Reset</button></div><p class="muted center">For 2, 3 and 5 minute timers: one bell at 1 minute remaining. All timers: two bells at time up. On iPhone, tap Test Sound once before a presentation to confirm audible playback.</p>`);timer={total:180,remaining:180,running:false};renderTimer();$$('[data-preset]').forEach(b=>b.onclick=()=>{timer.total=timer.remaining=+b.dataset.preset;$$('[data-preset]').forEach(x=>x.classList.toggle('active',x===b));renderTimer()});$('#timerStart').onclick=toggleTimer;$('#timerTestSound').onclick=async()=>{await unlockTimerAudio();beep(880,.18,1)};$('#timerReset').onclick=()=>{timer.remaining=timer.total;timer.running=false;clearInterval(interval);releaseTimerWakeLock();$('#timerStart').textContent='Start';renderTimer()};}
async function unlockTimerAudio(){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return false;audioCtx=audioCtx||new Ctx();if(audioCtx.state==='suspended')await audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();g.gain.value=.0001;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.02);return true}catch(e){console.warn('Timer audio unlock failed',e);return false}}
function beep(freq=880,duration=.16,count=1){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;audioCtx=audioCtx||new Ctx();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});let t=audioCtx.currentTime+.02;for(let i=0;i<count;i++){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;o.connect(g);g.connect(audioCtx.destination);g.gain.setValueAtTime(.22,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.start(t);o.stop(t+duration);t+=duration+.14}}catch(e){console.warn('Timer beep failed',e)}}
async function requestTimerWakeLock(){try{if('wakeLock' in navigator&&!timerWakeLock)timerWakeLock=await navigator.wakeLock.request('screen')}catch(e){console.warn('Wake lock unavailable',e)}}
function releaseTimerWakeLock(){try{timerWakeLock?.release?.()}catch(_e){}timerWakeLock=null}
async function toggleTimer(){timer.running=!timer.running;$('#timerStart').textContent=timer.running?'Pause':'Start';clearInterval(interval);if(timer.running){await unlockTimerAudio();requestTimerWakeLock();interval=setInterval(()=>{timer.remaining--;const oneMinuteAlert=[120,180,300].includes(timer.total)&&timer.remaining===60;if(oneMinuteAlert){if(navigator.vibrate)navigator.vibrate(120);beep(880,.16,1)}if(timer.remaining===0){if(navigator.vibrate)navigator.vibrate([180,120,180]);beep(620,.18,2);timer.running=false;clearInterval(interval);releaseTimerWakeLock();$('#timerStart').textContent='Start'}if(timer.remaining<0)timer.remaining=0;renderTimer();},1000)}else{releaseTimerWakeLock()}}

function renderTimer(){const d=$('#timerDisplay'),r=$('#timerRing');if(!d)return;const m=Math.floor(timer.remaining/60),s=timer.remaining%60;d.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;r.classList.toggle('warning',timer.remaining<=60&&timer.remaining>30);r.classList.toggle('danger',timer.remaining<=30&&timer.remaining>0);r.classList.toggle('done',timer.remaining===0)}


function adminFmtDate(iso){
  if(!iso)return '';
  try{return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(iso));}
  catch(_e){return '';}
}
function isoToInputInZone(iso,timeZone){
  if(!iso)return '';
  const d=new Date(iso);
  const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:timeZone||undefined,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const p=Object.fromEntries(fmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
function zoneOffsetMs(date,timeZone){
  const fmt=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const p=Object.fromEntries(fmt.formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const asUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
  return asUtc-date.getTime();
}
function localInputToIso(value,timeZone){
  if(!value)return null;
  const m=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if(!m)return new Date(value).toISOString();
  const wall=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],0);
  let probe=new Date(wall);
  let actual=wall-zoneOffsetMs(probe,timeZone);
  probe=new Date(actual);
  actual=wall-zoneOffsetMs(probe,timeZone);
  return new Date(actual).toISOString();
}
function openAdmin(){
  if(state.role!=='admin'){
    openModal(`<h2 id="modalTitle">Admin Panel</h2><div class="admin-note">Your account is a Participant. Admin privileges are required.</div>`);
    return;
  }
  openModal(`<h2 id="modalTitle">Program Admin</h2>
    <p class="muted admin-intro">Manage operational data here. Changes are saved to Supabase and appear in the participant app without a GitHub update.</p>
    <div class="tabs admin-tabs">
      <button class="tab active" data-atab="users">Users</button>
      <button class="tab" data-atab="mission">Missions</button>
      <button class="tab" data-atab="teams">Teams</button>
      <button class="tab" data-atab="schedule">Schedule</button>
      <button class="tab" data-atab="announce">Announcement</button>
      <button class="tab" data-atab="poll">Poll</button>
    </div>
    <div id="adminBody"></div>`);
  $$('[data-atab]').forEach(b=>b.onclick=()=>{
    $$('[data-atab]').forEach(x=>x.classList.toggle('active',x===b));
    renderAdminTab(b.dataset.atab);
  });
  renderAdminTab('users');
}
function renderAdminTab(tab){
  const b=$('#adminBody');if(!b)return;
  if(tab==='users')return renderUserAdmin();
  if(tab==='mission')return renderMissionAdmin();
  if(tab==='teams')return renderTeamAdmin();
  if(tab==='schedule')return renderScheduleAdmin();
  if(tab==='announce')return renderAnnouncementAdmin();
  if(tab==='poll')return renderPollAdmin();
}
function renderAnnouncementAdmin(){
  const b=$('#adminBody');
  const items=[...(state.messages?.announcements||[])].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  b.innerHTML=`<div class="admin-toolbar"><div><h3>Announcements</h3><p class="muted">Create, edit, and archive program-wide announcements.</p></div><button class="btn pink compact" id="adminAddAnnouncement">+ New Announcement</button></div>
    <div class="admin-list">${items.map(a=>`<article class="admin-row ${a.isActive===false?'admin-inactive':''}">
      <div class="admin-row-main">
        <div class="admin-row-title"><b>${esc(a.title)}</b><span class="pill ${a.isActive===false?'orange':'green'}">${a.isActive===false?'Archived':'Published'}</span></div>
        <div class="admin-meta"><span>${esc(a.ts||'')}</span></div>
        <div class="admin-desc">${esc(a.text||'')}</div>
      </div>
      <div class="admin-row-actions">
        <button class="btn ghost compact" data-edit-announcement="${a.id}">Edit</button>
        <button class="btn ${a.isActive===false?'pink':'ghost'} compact" data-toggle-announcement="${a.id}">${a.isActive===false?'Restore':'Archive'}</button>
        <button class="btn ghost compact danger-lite" data-delete-announcement="${a.id}">Delete</button>
      </div>
    </article>`).join('')||'<div class="empty">No announcements yet.</div>'}</div>`;
  $('#adminAddAnnouncement').onclick=()=>renderAnnouncementEditor(null);
  $$('[data-edit-announcement]').forEach(x=>x.onclick=()=>renderAnnouncementEditor(x.dataset.editAnnouncement));
  $$('[data-toggle-announcement]').forEach(x=>x.onclick=async()=>{
    const a=(state.messages?.announcements||[]).find(y=>y.id===x.dataset.toggleAnnouncement);if(!a)return;
    try{
      if(backendMode==='supabase'){await MayoCloud.setAnnouncementActive(a.id,a.isActive===false);await refreshCloudState({renderPage:false});}
      else{a.isActive=a.isActive===false;save();}
      renderAnnouncementAdmin();
    }catch(e){showError(e)}
  });
  $$('[data-delete-announcement]').forEach(x=>x.onclick=async()=>{
    const a=(state.messages?.announcements||[]).find(y=>y.id===x.dataset.deleteAnnouncement);if(!a)return;
    if(!confirm(`Permanently delete announcement "${a.title}"? Read-status records will also be removed. This cannot be undone.`))return;
    try{
      if(backendMode==='supabase'){
        await MayoCloud.deleteAnnouncement(a.id);
        await refreshCloudState({renderPage:false});
      }else{
        state.messages.announcements=(state.messages?.announcements||[]).filter(y=>y.id!==a.id);
        save();
      }
      renderAnnouncementAdmin();
    }catch(e){showError(e)}
  });
}
function renderAnnouncementEditor(id){
  const b=$('#adminBody'),a=id?(state.messages?.announcements||[]).find(x=>x.id===id):null;
  b.innerHTML=`<div class="admin-editor">
    <div class="admin-toolbar"><h3>${a?'Edit Announcement':'New Announcement'}</h3><button class="btn ghost compact" id="announcementBack">← Back</button></div>
    <div class="form-group"><label>Title</label><input id="aTitle" value="${esc(a?.title||'')}" placeholder="Program Update"></div>
    <div class="form-group"><label>Message</label><textarea id="aText" placeholder="Announcement to all participants">${esc(a?.text||'')}</textarea></div>
    <p class="muted">${a?'Changes appear to participants immediately.':'The announcement is published immediately after you save it.'}</p>
    <button class="btn pink full" id="aSave">${a?'Save Changes':'Publish Announcement'}</button>
  </div>`;
  $('#announcementBack').onclick=renderAnnouncementAdmin;
  $('#aSave').onclick=async()=>{
    const title=$('#aTitle').value.trim(),body=$('#aText').value.trim();
    if(!title||!body)return alert('Enter title and message.');
    try{
      if(backendMode==='supabase'){
        if(a)await MayoCloud.updateAnnouncement(a.id,{title,body});else await MayoCloud.createAnnouncement(title,body);
        await refreshCloudState({renderPage:false});
      }else{
        if(a){a.title=title;a.text=body;}
        else{state.messages.announcements.unshift({id:'a'+Date.now(),title,text:body,ts:'Now',createdAt:new Date().toISOString(),isActive:true});state.unread.announcements++;}save();
      }
      renderAnnouncementAdmin();
    }catch(e){showError(e)}
  };
}
function pollAdminVoteCount(p){return (p.options||[]).reduce((sum,o)=>sum+(Number(o.votes)||0),0)}
function renderPollAdmin(){
  const b=$('#adminBody');
  const polls=[...(state.polls||[])].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  b.innerHTML=`<div class="admin-toolbar"><div><h3>Quick Polls</h3><p class="muted">Create polls, edit settings, monitor votes, and control when results are published.</p></div><button class="btn pink compact" id="adminAddPoll">+ New Poll</button></div>
    <div class="admin-list">${polls.map(p=>{
      const open=pollIsOpen(p),votes=pollAdminVoteCount(p);
      return `<article class="admin-row ${p.isActive===false?'admin-inactive':''}">
        <div class="admin-row-main">
          <div class="admin-row-title"><b>${esc(p.question)}</b>
            <span class="pill ${p.isActive===false?'orange':open?'green':'orange'}">${p.isActive===false?'Archived':open?'Open':'Closed'}</span>
          </div>
          <div class="admin-meta"><span>${votes} vote${votes===1?'':'s'}</span><span>${p.closesAt?`Closes ${esc(new Date(p.closesAt).toLocaleString())}`:'No automatic close'}</span></div>
          <div class="admin-desc">${(p.options||[]).map(o=>`${esc(o.label)} (${Number(o.votes)||0})`).join(' • ')}</div>
        </div>
        <div class="admin-row-actions">
          <button class="btn ghost compact" data-edit-poll="${p.id}">Edit</button>
          ${open?`<button class="btn pink compact" data-close-admin-poll="${p.id}">Close & Publish</button>`:`<button class="btn ghost compact" data-reopen-poll="${p.id}">Reopen</button>`}
          <button class="btn ${p.isActive===false?'pink':'ghost'} compact" data-toggle-poll="${p.id}">${p.isActive===false?'Restore':'Archive'}</button>
          <button class="btn ghost compact danger-lite" data-delete-poll="${p.id}">Delete</button>
        </div>
      </article>`}).join('')||'<div class="empty">No polls yet.</div>'}</div>`;
  $('#adminAddPoll').onclick=()=>renderPollEditor(null);
  $$('[data-edit-poll]').forEach(x=>x.onclick=()=>renderPollEditor(x.dataset.editPoll));
  $$('[data-close-admin-poll]').forEach(x=>x.onclick=async()=>{
    if(!confirm('Close voting and publish the results to participants?'))return;
    try{if(backendMode==='supabase'){await MayoCloud.closePoll(x.dataset.closeAdminPoll);await refreshCloudState({renderPage:false});}else{const p=state.polls.find(y=>y.id===x.dataset.closeAdminPoll);if(p){p.isOpen=false;p.resultsPublished=true;p.closedAt=new Date().toISOString();save();}}renderPollAdmin();}catch(e){showError(e)}
  });
  $$('[data-reopen-poll]').forEach(x=>x.onclick=async()=>{
    if(!confirm('Reopen this poll? Published results will be hidden again until it closes.'))return;
    try{if(backendMode==='supabase'){await MayoCloud.reopenPoll(x.dataset.reopenPoll,null);await refreshCloudState({renderPage:false});}else{const p=state.polls.find(y=>y.id===x.dataset.reopenPoll);if(p){p.isOpen=true;p.resultsPublished=false;p.closedAt=null;save();}}renderPollAdmin();}catch(e){showError(e)}
  });
  $$('[data-toggle-poll]').forEach(x=>x.onclick=async()=>{
    const p=state.polls.find(y=>y.id===x.dataset.togglePoll);if(!p)return;
    try{if(backendMode==='supabase'){await MayoCloud.setPollActive(p.id,p.isActive===false);await refreshCloudState({renderPage:false});}else{p.isActive=p.isActive===false;save();}renderPollAdmin();}catch(e){showError(e)}
  });
  $$('[data-delete-poll]').forEach(x=>x.onclick=async()=>{
    const p=state.polls.find(y=>y.id===x.dataset.deletePoll);if(!p)return;
    const votes=pollAdminVoteCount(p);
    if(!confirm(`Permanently delete this poll${votes?` and its ${votes} vote${votes===1?'':'s'}`:''}? This cannot be undone.`))return;
    try{
      if(backendMode==='supabase'){
        await MayoCloud.deletePoll(p.id);
        await refreshCloudState({renderPage:false});
      }else{
        state.polls=state.polls.filter(y=>y.id!==p.id);
        save();
      }
      renderPollAdmin();
    }catch(e){showError(e)}
  });
}
function renderPollEditor(id){
  const b=$('#adminBody'),p=id?state.polls.find(x=>x.id===id):null;
  const votes=p?pollAdminVoteCount(p):0;
  const optionsText=(p?.options||[]).map(o=>o.label).join('\n');
  const closeValue=p?.closesAt?new Date(new Date(p.closesAt).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):'';
  b.innerHTML=`<div class="admin-editor">
    <div class="admin-toolbar"><h3>${p?'Edit Poll':'New Poll'}</h3><button class="btn ghost compact" id="pollBack">← Back</button></div>
    <div class="form-group"><label>Question</label><input id="qQuestion" value="${esc(p?.question||'')}" placeholder="Which activity helped you connect most?"></div>
    <div class="form-group"><label>Options (one per line)</label><textarea id="qOptions" ${votes>0?'disabled':''}>${esc(optionsText||'Partner interview\nDrawing challenge\nFree networking')}</textarea>${votes>0?'<small class="muted">Options are locked because voting has already started.</small>':''}</div>
    <div class="form-group"><label>Automatic close time (optional)</label><input id="qCloseAt" type="datetime-local" value="${closeValue}"></div>
    <p class="muted">Participants cannot see interim results. Admins can monitor results in real time.</p>
    <button class="btn pink full" id="qSave">${p?'Save Changes':'Publish Poll'}</button>
  </div>`;
  $('#pollBack').onclick=renderPollAdmin;
  $('#qSave').onclick=async()=>{
    const question=$('#qQuestion').value.trim(),options=$('#qOptions').value.split(/\n/).map(x=>x.trim()).filter(Boolean),closeRaw=$('#qCloseAt').value,closesAt=closeRaw?new Date(closeRaw).toISOString():null;
    if(!question||(!p&&options.length<2)||(!votes&&options.length<2))return alert('Enter a question and at least two options.');
    try{
      if(backendMode==='supabase'){
        if(p)await MayoCloud.updatePoll(p.id,{question,options:votes>0?null:options,closesAt});
        else await MayoCloud.createPoll(question,options,closesAt);
        await refreshCloudState({renderPage:false});
      }else{
        if(p){p.question=question;p.closesAt=closesAt;if(votes===0)p.options=options.map((label,i)=>({id:`local-${p.id}-${i}`,label,votes:0}));}
        else state.polls.unshift({id:'poll'+Date.now(),question,isOpen:true,resultsPublished:false,isActive:true,closesAt,createdAt:new Date().toISOString(),options:options.map((label,i)=>({id:'local-'+Date.now()+'-'+i,label,votes:0})),myVote:null});save();
      }
      renderPollAdmin();
    }catch(e){showError(e)}
  };
}


let adminUserCache=[];
function adminUserStatus(u){
  return u.emailConfirmedAt?'<span class="pill green">Active</span>':'<span class="pill orange">Invited</span>';
}
async function renderUserAdmin(){
  const b=$('#adminBody');if(!b)return;
  b.innerHTML=`<div class="admin-toolbar"><div><h3>User Management</h3><p class="muted">Invite, edit, reset, or remove program users. Authentication operations are handled securely by Supabase.</p></div><button class="btn pink compact" id="adminInviteUser">+ Invite User</button></div>
    <input class="search" id="adminUserSearch" placeholder="Search name, email, organization, or team">
    <div id="adminUserList"><div class="empty">Loading users…</div></div>`;
  $('#adminInviteUser').onclick=()=>renderUserEditor(null);
  $('#adminUserSearch').oninput=()=>renderAdminUserList($('#adminUserSearch').value);
  try{
    if(backendMode!=='supabase')throw new Error('User management is available only in Cloud mode.');
    const data=await MayoCloud.adminUserRequest('list');
    adminUserCache=data.users||[];
    renderAdminUserList('');
  }catch(e){
    $('#adminUserList').innerHTML=`<div class="admin-note"><b>User management is not connected yet.</b><br>${esc(e.message||String(e))}<br><br><span class="muted">Deploy the Supabase Edge Function named <b>admin-users</b>, then reopen this tab.</span></div>`;
  }
}
function renderAdminUserList(query=''){
  const box=$('#adminUserList');if(!box)return;
  const q=String(query||'').trim().toLowerCase();
  const users=adminUserCache.filter(u=>!q||[u.fullName,u.email,u.organization,u.title,u.role,u.teamName].join(' ').toLowerCase().includes(q));
  box.innerHTML=`<div class="admin-list">${users.map(u=>`<article class="admin-row admin-user-row">
    <div class="admin-row-main">
      <div class="admin-row-title"><b>${esc(u.fullName||u.email||'User')}</b>${adminUserStatus(u)}<span class="pill ${u.role==='admin'?'orange':''}">${esc(u.role||'participant')}</span></div>
      <div class="admin-meta"><span>${esc(u.email||'')}</span>${u.organization?`<span>${esc(u.organization)}</span>`:''}${u.teamName?`<span>Team: ${esc(u.teamName)}</span>`:'<span>Unassigned</span>'}</div>
      <div class="admin-desc">${u.lastSignInAt?`Last sign in: ${esc(new Date(u.lastSignInAt).toLocaleString())}`:'No sign-in yet'}</div>
    </div>
    <div class="admin-row-actions">
      <button class="btn ghost compact" data-edit-user="${u.id}">Edit</button>
      <button class="btn ghost compact" data-reset-user="${u.id}" ${u.email?'':'disabled'}>Reset Password</button>
      <button class="btn ghost compact danger-lite" data-delete-user="${u.id}" ${u.id===MayoCloud.session?.user?.id?'disabled':''}>Delete</button>
    </div>
  </article>`).join('')||'<div class="empty">No matching users.</div>'}</div>`;
  $$('[data-edit-user]').forEach(btn=>btn.onclick=()=>renderUserEditor(btn.dataset.editUser));
  $$('[data-reset-user]').forEach(btn=>btn.onclick=async()=>{
    const u=adminUserCache.find(x=>x.id===btn.dataset.resetUser);if(!u?.email)return;
    if(!confirm(`Send a password reset email to ${u.email}?`))return;
    btn.disabled=true;const old=btn.textContent;btn.textContent='Sending…';
    try{
      await MayoCloud.adminUserRequest('reset-password',{userId:u.id});
      alert(`Password reset email sent to ${u.email}.`);
    }catch(e){showError(e);}
    finally{btn.disabled=false;btn.textContent=old;}
  });
  $$('[data-delete-user]').forEach(btn=>btn.onclick=async()=>{
    const u=adminUserCache.find(x=>x.id===btn.dataset.deleteUser);if(!u)return;
    const typed=prompt(`Permanently delete ${u.fullName||u.email}?\n\nThis removes the login account and participant data. Program announcements they created will be preserved.\n\nType the user's email to confirm:`);
    if(typed!==u.email)return;
    btn.disabled=true;
    try{
      await MayoCloud.adminUserRequest('delete',{userId:u.id});
      adminUserCache=adminUserCache.filter(x=>x.id!==u.id);
      renderAdminUserList($('#adminUserSearch')?.value||'');
      await refreshCloudState({renderPage:false});
    }catch(e){btn.disabled=false;showError(e);}
  });
}
function renderUserEditor(id){
  const b=$('#adminBody');if(!b)return;
  const u=id?adminUserCache.find(x=>x.id===id):null;
  const teams=[...(state.teams||[])].sort((a,b)=>a.name.localeCompare(b.name));
  b.innerHTML=`<div class="admin-editor">
    <div class="admin-toolbar"><div><h3>${u?'Edit User':'Invite User'}</h3><p class="muted">${u?'Update program profile, role, and team.':'The user will receive an email invitation and choose their own password.'}</p></div><button class="btn ghost compact" id="userBack">← Back</button></div>
    <div class="admin-form-grid">
      <div class="form-group"><label>Full name</label><input id="uName" value="${esc(u?.fullName||'')}" placeholder="First Last"></div>
      <div class="form-group"><label>Email</label><input id="uEmail" type="email" value="${esc(u?.email||'')}" ${u?'disabled':''} placeholder="user@example.com"></div>
    </div>
    <div class="admin-form-grid">
      <div class="form-group"><label>Organization</label><input id="uOrg" value="${esc(u?.organization||'')}"></div>
      <div class="form-group"><label>Title</label><input id="uTitle" value="${esc(u?.title||'')}"></div>
    </div>
    <div class="admin-form-grid">
      <div class="form-group"><label>Role</label><select id="uRole"><option value="participant" ${u?.role!=='admin'?'selected':''}>Participant</option><option value="admin" ${u?.role==='admin'?'selected':''}>Admin</option></select></div>
      <div class="form-group"><label>Team</label><select id="uTeam"><option value="">Unassigned</option>${teams.map(t=>`<option value="${t.id}" ${u?.teamId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>
    </div>
    ${u?'':`<div class="email-notice compact"><b>Invitation flow:</b> the user opens the email invitation, accepts the Privacy Notice / Terms, and creates a password before entering the app.</div>`}
    <button class="btn pink full" id="uSave">${u?'Save Changes':'Send Invitation'}</button>
  </div>`;
  $('#userBack').onclick=renderUserAdmin;
  $('#uSave').onclick=async()=>{
    const payload={
      fullName:$('#uName').value.trim(),
      email:$('#uEmail').value.trim(),
      organization:$('#uOrg').value.trim(),
      title:$('#uTitle').value.trim(),
      role:$('#uRole').value,
      teamId:$('#uTeam').value||null
    };
    if(!payload.fullName||!payload.email)return alert('Enter a full name and email.');
    const btn=$('#uSave');btn.disabled=true;const old=btn.textContent;btn.textContent=u?'Saving…':'Sending…';
    try{
      if(u)await MayoCloud.adminUserRequest('update',{userId:u.id,...payload});
      else await MayoCloud.adminUserRequest('invite',payload);
      await refreshCloudState({renderPage:false});
      await renderUserAdmin();
    }catch(e){showError(e);btn.disabled=false;btn.textContent=old;}
  };
}

function renderMissionAdmin(){
  const b=$('#adminBody');
  const missions=[...(state.missions||[])].sort((a,b)=>(a.isActive===b.isActive?0:a.isActive?-1:1)||a.category.localeCompare(b.category)||a.title.localeCompare(b.title));
  b.innerHTML=`<div class="admin-toolbar"><div><h3>Challenge Missions</h3><p class="muted">Edit points, category, description, timing, and visibility.</p></div><button class="btn pink compact" id="adminAddMission">+ Add Mission</button></div>
    <div class="admin-list">${missions.map(m=>`<article class="admin-row ${m.isActive===false?'admin-inactive':''}">
      <div class="admin-row-main">
        <div class="admin-row-title"><b>${esc(m.title)}</b><span class="pill ${m.isActive===false?'orange':'green'}">${m.isActive===false?'Inactive':'Active'}</span></div>
        <div class="admin-meta"><span>${esc(m.category)}</span><span>${m.points} pts</span></div>
        ${m.description?`<div class="admin-desc">${esc(m.description)}</div>`:''}
      </div>
      <div class="admin-row-actions">
        <button class="btn ghost compact" data-edit-mission="${m.id}">Edit</button>
        <button class="btn ${m.isActive===false?'pink':'ghost'} compact" data-toggle-mission="${m.id}">${m.isActive===false?'Activate':'Deactivate'}</button>
        <button class="btn ghost compact danger-lite" data-delete-mission="${m.id}">Delete</button>
      </div>
    </article>`).join('')||'<div class="empty">No missions yet.</div>'}</div>`;
  $('#adminAddMission').onclick=()=>renderMissionEditor(null);
  $$('[data-edit-mission]').forEach(x=>x.onclick=()=>renderMissionEditor(x.dataset.editMission));
  $$('[data-toggle-mission]').forEach(x=>x.onclick=async()=>{
    const m=state.missions.find(y=>y.id===x.dataset.toggleMission);if(!m)return;
    try{
      if(backendMode==='supabase'){await MayoCloud.setMissionActive(m.id,m.isActive===false);await refreshCloudState({renderPage:false});}
      else{m.isActive=m.isActive===false;save();}
      renderMissionAdmin();
    }catch(e){showError(e)}
  });
  $$('[data-delete-mission]').forEach(x=>x.onclick=async()=>{
    const m=state.missions.find(y=>y.id===x.dataset.deleteMission);if(!m)return;
    if(!confirm(`Permanently delete "${m.title}"? Completed records and points awarded by this mission will also be removed. This cannot be undone.`))return;
    try{
      if(backendMode==='supabase'){
        await MayoCloud.deleteMission(m.id);
        await refreshCloudState({renderPage:false});
      }else{
        state.missions=state.missions.filter(y=>y.id!==m.id);
        save();
      }
      renderMissionAdmin();
    }catch(e){showError(e)}
  });
}
function renderMissionEditor(id){
  const b=$('#adminBody'),m=id?state.missions.find(x=>x.id===id):null;
  b.innerHTML=`<div class="admin-editor">
    <div class="admin-toolbar"><h3>${m?'Edit Mission':'Add Mission'}</h3><button class="btn ghost compact" id="missionBack">← Back</button></div>
    <div class="form-group"><label>Mission title</label><input id="mTitle" value="${esc(m?.title||'')}" placeholder="Talk to someone new"></div>
    <div class="form-group"><label>Description</label><textarea id="mDesc" placeholder="What should participants do?">${esc(m?.description||'')}</textarea></div>
    <div class="admin-form-grid">
      <div class="form-group"><label>Category</label><select id="mCat">${['Connect','Contribute','Stretch'].map(c=>`<option ${m?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Points</label><input id="mPoints" type="number" min="0" value="${m?.points??20}"></div>
    </div>
    <label class="admin-check"><input id="mActive" type="checkbox" ${m?.isActive===false?'':'checked'}> Active / visible to participants</label>
    <div class="admin-form-grid">
      <div class="form-group"><label>Active from (optional)</label><input id="mFrom" type="datetime-local" value="${m?.activeFrom?new Date(m.activeFrom).toISOString().slice(0,16):''}"></div>
      <div class="form-group"><label>Active until (optional)</label><input id="mUntil" type="datetime-local" value="${m?.activeUntil?new Date(m.activeUntil).toISOString().slice(0,16):''}"></div>
    </div>
    <button class="btn pink full" id="mSave">${m?'Save Changes':'Add Mission'}</button>
  </div>`;
  $('#missionBack').onclick=renderMissionAdmin;
  $('#mSave').onclick=async()=>{
    const payload={
      title:$('#mTitle').value.trim(),
      description:$('#mDesc').value.trim(),
      category:$('#mCat').value,
      points:Math.max(0,+$('#mPoints').value||0),
      isActive:$('#mActive').checked,
      activeFrom:$('#mFrom').value?new Date($('#mFrom').value).toISOString():null,
      activeUntil:$('#mUntil').value?new Date($('#mUntil').value).toISOString():null
    };
    if(!payload.title)return alert('Enter a mission title.');
    if(payload.activeFrom&&payload.activeUntil&&new Date(payload.activeUntil)<new Date(payload.activeFrom))return alert('Active until must be after Active from.');
    try{
      if(backendMode==='supabase'){
        if(m)await MayoCloud.updateMission(m.id,payload);else await MayoCloud.createMission(payload);
        await refreshCloudState({renderPage:false});
      }else{
        if(m)Object.assign(m,payload);else state.missions.push({id:'m'+Date.now(),...payload,icon:'⭐',done:false});
        save();
      }
      renderMissionAdmin();
    }catch(e){showError(e)}
  };
}

let pendingBalancedTeamDraft=null;

function normAttr(v=''){
  return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
}
function attrTokens(v=''){
  return [...new Set(normAttr(v).split(/[,\|;/]+|\s{2,}/).map(x=>x.trim()).filter(x=>x.length>=3))];
}
function randomShuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function buildBalancedTeamDraft(){
  const teams=[...(state.teams||[])];
  const people=(state.people||[]).filter(p=>p.role!=='admin');
  if(teams.length<2)throw new Error('Create at least two teams first.');
  if(!people.length)throw new Error('No participants are available for team assignment.');

  // Exact capacities keep team sizes within one person of each other.
  const shuffledTeams=randomShuffle(teams);
  const base=Math.floor(people.length/teams.length);
  const extra=people.length%teams.length;
  const buckets=shuffledTeams.map((t,i)=>({
    team:t,
    capacity:base+(i<extra?1:0),
    people:[],
    orgCount:{},
    titleCount:{},
    interests:new Set()
  }));

  // Put harder-to-place affiliations first, while preserving randomness within ties.
  const orgFreq={};
  people.forEach(p=>{const k=normAttr(p.org)||'__none__';orgFreq[k]=(orgFreq[k]||0)+1;});
  const ordered=randomShuffle(people).sort((a,b)=>
    (orgFreq[normAttr(b.org)||'__none__']||0)-(orgFreq[normAttr(a.org)||'__none__']||0)
  );

  for(const p of ordered){
    const org=normAttr(p.org);
    const title=normAttr(p.title);
    const interests=attrTokens(p.interests);
    const choices=buckets.filter(b=>b.people.length<b.capacity);
    choices.forEach(b=>{
      let penalty=0;
      // Organization is the strongest diversity constraint.
      if(org)penalty+=(b.orgCount[org]||0)*120;
      // Exact same title is next strongest.
      if(title)penalty+=(b.titleCount[title]||0)*30;
      // Shared stated interests are a softer attribute constraint.
      interests.forEach(x=>{if(b.interests.has(x))penalty+=8;});
      // Prefer the less-full bucket when diversity scores are close.
      penalty+=(b.people.length/Math.max(1,b.capacity))*12;
      // Small jitter makes repeated "Generate" clicks produce alternative valid drafts.
      penalty+=Math.random()*3;
      b._score=penalty;
    });
    choices.sort((a,b)=>a._score-b._score);
    const target=choices[0];
    target.people.push(p);
    if(org)target.orgCount[org]=(target.orgCount[org]||0)+1;
    if(title)target.titleCount[title]=(target.titleCount[title]||0)+1;
    interests.forEach(x=>target.interests.add(x));
  }

  return {
    createdAt:Date.now(),
    buckets:buckets.map(b=>({team:b.team,people:b.people})),
    assignments:buckets.flatMap(b=>b.people.map(p=>({profile_id:p.id,team_id:b.team.id})))
  };
}
function teamDraftHtml(draft){
  if(!draft)return '';
  return `<div class="team-draft">
    <div class="team-draft-head"><div><b>Balanced Draft</b><small>Preview only — current teams are unchanged until Confirm is clicked.</small></div><span class="pill pink">${draft.assignments.length} participants</span></div>
    <div class="team-draft-grid">${draft.buckets.map(b=>`<section class="team-draft-card">
      <div class="team-draft-title"><b>${esc(b.team.name)}</b><span>${b.people.length}</span></div>
      ${b.people.map(p=>`<div class="team-draft-person"><b>${esc(p.name)}</b><small>${esc(p.org||'No organization')}${p.title?` · ${esc(p.title)}`:''}</small></div>`).join('')}
    </section>`).join('')}</div>
    <div class="team-draft-actions">
      <button class="btn ghost" id="regenerateBalancedTeams">↻ Generate Another Draft</button>
      <button class="btn pink" id="confirmBalancedTeams">Confirm Assignment</button>
    </div>
  </div>`;
}
function renderTeamAdmin(){
  const b=$('#adminBody');
  const teams=[...(state.teams||[])].sort((a,b)=>a.name.localeCompare(b.name));
  b.innerHTML=`<div class="admin-toolbar"><div><h3>Teams</h3><p class="muted">Create teams, assign participants manually, or generate a balanced draft automatically.</p></div></div>
    <div class="team-auto-box">
      <div><b>Balanced Auto-Assignment</b><p>Distributes all participants evenly while trying to avoid duplicate organization, title, and stated interests in the same team.</p></div>
      <button class="btn pink" id="generateBalancedTeams" ${teams.length<2?'disabled':''}>Generate Balanced Draft</button>
    </div>
    <div id="teamDraftArea">${teamDraftHtml(pendingBalancedTeamDraft)}</div>
    <div class="admin-inline-create"><input id="newTeamName" placeholder="New team name"><button class="btn pink compact" id="addTeamBtn">+ Create Team</button></div>
    <div class="admin-team-summary">${teams.map(t=>{const members=state.people.filter(p=>p.teamId===t.id);return `<div class="admin-team-card"><div><b>${esc(t.name)}</b><small>${members.length} participant${members.length===1?'':'s'}</small></div><div><button class="btn ghost compact" data-rename-team="${t.id}">Rename</button><button class="btn ghost compact" data-delete-team="${t.id}" ${members.length?'disabled':''}>Delete</button></div></div>`}).join('')||'<div class="empty">No teams yet.</div>'}</div>
    <h3 class="admin-subhead">Participant Assignments</h3>
    <div class="admin-list">${state.people.filter(p=>p.role!=='admin').map(p=>`<div class="admin-person-row"><div><b>${esc(p.name)}</b><small>${esc(p.org||'')}${p.title?` · ${esc(p.title)}`:''}</small></div><select data-team-person="${p.id}"><option value="">Unassigned</option>${teams.map(t=>`<option value="${t.id}" ${p.teamId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>`).join('')}</div>`;
  const wireDraft=()=>{
    const gen=$('#generateBalancedTeams');
    if(gen)gen.onclick=()=>{
      try{pendingBalancedTeamDraft=buildBalancedTeamDraft();renderTeamAdmin();}catch(e){alert(e.message||String(e));}
    };
    const regen=$('#regenerateBalancedTeams');
    if(regen)regen.onclick=()=>{
      try{pendingBalancedTeamDraft=buildBalancedTeamDraft();renderTeamAdmin();}catch(e){alert(e.message||String(e));}
    };
    const confirmBtn=$('#confirmBalancedTeams');
    if(confirmBtn)confirmBtn.onclick=async()=>{
      if(!pendingBalancedTeamDraft)return;
      if(!confirm('Apply this balanced team assignment to all participants?'))return;
      confirmBtn.disabled=true;confirmBtn.textContent='Applying…';
      try{
        if(backendMode==='supabase'){
          await MayoCloud.applyTeamAssignments(pendingBalancedTeamDraft.assignments);
          await refreshCloudState({renderPage:false});
        }else{
          pendingBalancedTeamDraft.assignments.forEach(a=>{
            const p=state.people.find(x=>x.id===a.profile_id),t=state.teams.find(x=>x.id===a.team_id);
            if(p){p.teamId=a.team_id;p.team=t?.name||'';}
          });save();
        }
        pendingBalancedTeamDraft=null;
        renderTeamAdmin();
      }catch(e){showError(e);confirmBtn.disabled=false;confirmBtn.textContent='Confirm Assignment';}
    };
  };
  wireDraft();
  $('#addTeamBtn').onclick=async()=>{
    const name=$('#newTeamName').value.trim();if(!name)return alert('Enter a team name.');
    try{
      if(backendMode==='supabase'){await MayoCloud.createTeam(name);await refreshCloudState({renderPage:false});}
      else{state.teams=state.teams||[];state.teams.push({id:'t'+Date.now(),name});save();}
      pendingBalancedTeamDraft=null;renderTeamAdmin();
    }catch(e){showError(e)}
  };
  $$('[data-rename-team]').forEach(btn=>btn.onclick=async()=>{
    const t=(state.teams||[]).find(x=>x.id===btn.dataset.renameTeam);if(!t)return;
    const name=prompt('New team name',t.name)?.trim();if(!name||name===t.name)return;
    try{
      if(backendMode==='supabase'){await MayoCloud.renameTeam(t.id,name);await refreshCloudState({renderPage:false});}
      else{t.name=name;state.people.filter(p=>p.teamId===t.id).forEach(p=>p.team=name);save();}
      pendingBalancedTeamDraft=null;renderTeamAdmin();
    }catch(e){showError(e)}
  });
  $$('[data-delete-team]').forEach(btn=>btn.onclick=async()=>{
    const t=(state.teams||[]).find(x=>x.id===btn.dataset.deleteTeam);if(!t||btn.disabled)return;
    if(!confirm(`Delete empty team "${t.name}"?`))return;
    try{
      if(backendMode==='supabase'){await MayoCloud.deleteTeam(t.id);await refreshCloudState({renderPage:false});}
      else{state.teams=state.teams.filter(x=>x.id!==t.id);save();}
      pendingBalancedTeamDraft=null;renderTeamAdmin();
    }catch(e){showError(e)}
  });
  $$('[data-team-person]').forEach(sel=>sel.onchange=async()=>{
    const profileId=sel.dataset.teamPerson,teamId=sel.value||null;
    sel.disabled=true;
    try{
      if(backendMode==='supabase'){await MayoCloud.setParticipantTeam(profileId,teamId);await refreshCloudState({renderPage:false});}
      else{
        const p=state.people.find(x=>x.id===profileId),t=(state.teams||[]).find(x=>x.id===teamId);
        if(p){p.teamId=teamId;p.team=t?.name||'';}save();
      }
      pendingBalancedTeamDraft=null;renderTeamAdmin();
    }catch(e){sel.disabled=false;showError(e)}
  });
}

function renderScheduleAdmin(){
  const b=$('#adminBody');
  const events=[...(state.schedule||[])].sort((a,b)=>new Date(a.startsAt||0)-new Date(b.startsAt||0));
  b.innerHTML=`<div class="admin-toolbar"><div><h3>Schedule</h3><p class="muted">Edit program content without changing GitHub files.</p></div><button class="btn pink compact" id="adminAddEvent">+ Add Event</button></div>
    <div class="admin-list schedule-admin-list">${events.map(e=>`<article class="admin-row">
      <div class="admin-row-main"><div class="admin-row-title"><b>${esc(e.title)}</b></div><div class="admin-meta"><span>${esc(e.date||'')}</span><span>${esc(e.time||'')}</span></div><div class="admin-desc">${esc(e.location||'No location')}</div></div>
      <div class="admin-row-actions"><button class="btn ghost compact" data-edit-event="${e.id}">Edit</button><button class="btn ghost compact danger-lite" data-delete-event="${e.id}">Delete</button></div>
    </article>`).join('')||'<div class="empty">No schedule events.</div>'}</div>`;
  $('#adminAddEvent').onclick=()=>renderScheduleEditor(null);
  $$('[data-edit-event]').forEach(x=>x.onclick=()=>renderScheduleEditor(x.dataset.editEvent));
  $$('[data-delete-event]').forEach(x=>x.onclick=async()=>{
    const e=state.schedule.find(y=>y.id===x.dataset.deleteEvent);if(!e)return;
    if(!confirm(`Delete "${e.title}"? This will also remove participant bookmarks for this event.`))return;
    try{
      if(backendMode==='supabase'){await MayoCloud.deleteSchedule(e.id);await refreshCloudState({renderPage:false});}
      else{state.schedule=state.schedule.filter(y=>y.id!==e.id);save();}
      renderScheduleAdmin();
    }catch(err){showError(err)}
  });
}
function renderScheduleEditor(id){
  const b=$('#adminBody'),e=id?state.schedule.find(x=>x.id===id):null;
  const tz=e?.timeZone||'America/Chicago';
  b.innerHTML=`<div class="admin-editor">
    <div class="admin-toolbar"><h3>${e?'Edit Event':'Add Event'}</h3><button class="btn ghost compact" id="eventBack">← Back</button></div>
    <div class="form-group"><label>Event title</label><input id="eTitle" value="${esc(e?.title||'')}"></div>
    <div class="form-group"><label>Time zone</label><select id="eZone"><option value="America/Chicago" ${tz==='America/Chicago'?'selected':''}>Rochester — Central Time</option><option value="America/Phoenix" ${tz==='America/Phoenix'?'selected':''}>Phoenix — Arizona Time</option><option value="America/New_York" ${tz==='America/New_York'?'selected':''}>Eastern Time</option></select></div>
    <div class="admin-form-grid">
      <div class="form-group"><label>Start</label><input id="eStart" type="datetime-local" value="${e?.startsAt?isoToInputInZone(e.startsAt,tz):''}"></div>
      <div class="form-group"><label>End</label><input id="eEnd" type="datetime-local" value="${e?.endsAt?isoToInputInZone(e.endsAt,tz):''}"></div>
    </div>
    <div class="form-group"><label>Location</label><input id="eLocation" value="${esc(e?.location||'')}" placeholder="Two Discovery Square, Rochester, MN"></div>
    <div class="form-group"><label>Map URL (optional)</label><input id="eMap" value="${esc(e?.locationUrl||'')}" placeholder="https://..."></div>
    <div class="form-group"><label>Description / Speaker / Address</label><textarea id="eDesc" placeholder="Speaker / Host: ...&#10;Address: ...">${esc(e?.details||'')}</textarea></div>
    <button class="btn pink full" id="eSave">${e?'Save Changes':'Add Event'}</button>
  </div>`;
  $('#eventBack').onclick=renderScheduleAdmin;
  $('#eSave').onclick=async()=>{
    const zone=$('#eZone').value,start=$('#eStart').value,end=$('#eEnd').value;
    const payload={
      title:$('#eTitle').value.trim(),
      startsAt:localInputToIso(start,zone),
      endsAt:end?localInputToIso(end,zone):null,
      timeZone:zone,
      location:$('#eLocation').value.trim(),
      locationUrl:$('#eMap').value.trim(),
      description:$('#eDesc').value.trim()
    };
    if(!payload.title||!payload.startsAt)return alert('Enter an event title and start time.');
    if(payload.endsAt&&new Date(payload.endsAt)<new Date(payload.startsAt))return alert('End time must be after start time.');
    try{
      if(backendMode==='supabase'){
        if(e)await MayoCloud.updateSchedule(e.id,payload);else await MayoCloud.createSchedule(payload);
        await refreshCloudState({renderPage:false});
      }else{
        if(e)Object.assign(e,{...payload,details:payload.description,locationUrl:payload.locationUrl});else state.schedule.push({id:'e'+Date.now(),...payload,details:payload.description,date:'Program Day',time:start});
        save();
      }
      renderScheduleAdmin();
    }catch(err){showError(err)}
  };
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
      if(inviteSetupRequested()){renderInviteSetup();return;}
      await refreshCloudState({renderPage:false});window.MayoCloud.subscribe(()=>refreshCloudState());render();
    }else{state=loadLocalState();setSyncBadge('Local Demo','local');render();}
  }catch(e){console.error(e);backendMode='local';state=loadLocalState();setSyncBadge('Local fallback','error');render();openModal(`<h2 id="modalTitle">Cloud connection issue</h2><p>The app could not start Supabase, so it opened in Local Demo mode.</p><p class="muted">${esc(e.message||String(e))}</p>`);}
}

$$('.nav-item').forEach(b=>b.onclick=()=>navTo(b.dataset.route));
$('#modalClose').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
$('#roleBadge').onclick=showAccount;
window.addEventListener('mayo-auth-changed',async(e)=>{
  if(backendMode!=='supabase')return;
  const authEvent=e?.detail?.event;
  // Supabase may refresh the access token after the tab/browser has been in the
  // background. A token refresh does not require a page re-render and should not
  // reset the participant's current Schedule view.
  if(authEvent==='TOKEN_REFRESHED')return;
  if(authEvent==='PASSWORD_RECOVERY') enterRecoveryMode();
  if(recoveryModeActive()){renderPasswordRecovery();return;}
  if(inviteSetupRequested() && e?.detail?.session){renderInviteSetup();return;}
  if(signInFlowActive && e?.detail?.event==='SIGNED_IN')return;
  try{
    const s=e?.detail?.session || await MayoCloud.getSession();
    if(s){
      const ok=await refreshCloudState({renderPage:false});
      if(ok){MayoCloud.subscribe(()=>refreshCloudState());render();}
    }else renderLogin();
  }catch(err){console.error('Auth state refresh failed',err);}
});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
bootstrap();
