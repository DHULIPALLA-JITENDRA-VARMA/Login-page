// auth.js — client-side demo authentication using Web Crypto and localStorage
// Keys/structure:
// localStorage 'auth_users_v1' => [{user, salt (base64), hash (hex), createdAt}]
// sessionStorage 'auth_session' => {token, user, createdAt, expiresAt}

(function(){
  const USERS_KEY = 'auth_users_v1';
  const SESSION_KEY = 'auth_session';

  // helpers
  function b64ToHex(b64){
    const bin = atob(b64);
    let out = '';
    for(let i=0;i<bin.length;i++) out += ('0' + bin.charCodeAt(i).toString(16)).slice(-2);
    return out;
  }

  function hexToHexString(buf){
    // buf is ArrayBuffer
    const view = new Uint8Array(buf);
    return Array.from(view).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function sha256(data){
    const enc = new TextEncoder();
    const hashed = await crypto.subtle.digest('SHA-256', enc.encode(data));
    return hexToHexString(hashed);
  }

  function randSalt(){
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    // base64
    let s = '';
    for(const b of arr) s += String.fromCharCode(b);
    return btoa(s);
  }

  function loadUsers(){
    try{ const raw = localStorage.getItem(USERS_KEY); return raw ? JSON.parse(raw) : []; } catch(e){return []}
  }
  function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  function findUser(name){
    const users = loadUsers();
    return users.find(x=>x.user.toLowerCase() === name.toLowerCase());
  }

  function setSession(obj){ sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj)); }
  function getSession(){ try{ const s = sessionStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null;}catch(e){return null} }
  function clearSession(){ sessionStorage.removeItem(SESSION_KEY); }

  function createToken(){
    const arr = new Uint8Array(24); crypto.getRandomValues(arr);
    let s=''; for(const b of arr) s += ('0'+b.toString(16)).slice(-2);
    return s;
  }

  // registration
  async function handleRegister(ev){
    ev && ev.preventDefault();
    const user = (document.getElementById('reg-user')||{}).value?.trim();
    const pass = (document.getElementById('reg-pass')||{}).value || '';
    const pass2 = (document.getElementById('reg-pass2')||{}).value || '';
    const msg = document.getElementById('reg-msg');
    if(!user || !pass){ msg.textContent = 'Please fill both fields.'; return; }
    if(pass !== pass2){ msg.textContent = 'Passwords do not match.'; return; }
    if(findUser(user)){ msg.textContent = 'A user with that name already exists.'; return; }
    const salt = randSalt();
    const hashed = await sha256(salt + '|' + pass);
    const users = loadUsers();
    users.push({ user, salt, hash: hashed, createdAt: new Date().toISOString() });
    saveUsers(users);
    msg.style.color = 'var(--accent-2)';
    msg.textContent = 'Registered. Redirecting to login...';
    setTimeout(()=> window.location.href = 'index.html', 900);
  }

  // login
  async function handleLogin(ev){
    ev && ev.preventDefault();
    const user = (document.getElementById('login-user')||{}).value?.trim();
    const pass = (document.getElementById('login-pass')||{}).value || '';
    const rememberEl = document.getElementById('remember');
    const msg = document.getElementById('login-msg');
    if(!user || !pass){ msg.textContent = 'Enter username and password.'; return; }
    const u = findUser(user);
    if(!u){ msg.textContent = 'Invalid credentials.'; return; }
    const hashed = await sha256(u.salt + '|' + pass);
    if(hashed !== u.hash){ msg.textContent = 'Invalid credentials.'; return; }
    // ok create session
    const token = createToken();
    const session = { token, user: u.user, createdAt: new Date().toISOString(), expiresAt: null };
    setSession(session);
    // remember username if asked
    try{ if(rememberEl && rememberEl.checked){ localStorage.setItem('auth_remember', u.user); } else { localStorage.removeItem('auth_remember'); } }catch(e){}
    msg.style.color = 'var(--accent-2)';
    msg.textContent = 'Login successful — redirecting...';
    setTimeout(()=> window.location.href = 'dashboard.html', 600);
  }

  // guard dashboard
  function ensureAuth(){
    const s = getSession();
    if(!s || !s.user){ window.location.href = 'index.html'; return null; }
    return s;
  }

  // on dashboard: show user and allow logout
  function initDashboard(){
    const s = ensureAuth(); if(!s) return;
    document.getElementById('user-info').textContent = `Signed in as: ${s.user}`;
    document.getElementById('dash-welcome').textContent = `Hello, ${s.user}. This is protected content.`;
    document.getElementById('logout').addEventListener('click', ()=>{ clearSession(); window.location.href = 'index.html'; });
  }

  // attach page handlers
  document.addEventListener('DOMContentLoaded', ()=>{
    const regForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    if(regForm) regForm.addEventListener('submit', handleRegister);
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    // if on dashboard, init
    if(document.getElementById('dash-title')) initDashboard();

    // Helpful: if already logged in and visiting index/register, auto-redirect to dashboard
    const s = getSession();
    if(s && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') )){
      // small delay to show login page briefly
      setTimeout(()=>{ window.location.href = 'dashboard.html'; }, 400);
    }
    // UI enhancements: remember-me prefilling
    try{
      const remembered = localStorage.getItem('auth_remember');
      if(remembered){ const el = document.getElementById('login-user'); if(el) el.value = remembered; const rem = document.getElementById('remember'); if(rem) rem.checked = true; }
    }catch(e){}

    // show/hide password and strength meter
    const passEl = document.getElementById('login-pass');
    const toggle = document.getElementById('toggle-pass');
    const strength = document.getElementById('pw-strength');
    const strengthBar = strength ? strength.querySelector('.bar') : null;
    const strengthText = strength ? strength.querySelector('.pw-text') : null;
    if(toggle && passEl){
      toggle.addEventListener('click', ()=>{
        if(passEl.type === 'password'){ passEl.type = 'text'; toggle.textContent = '🙈'; toggle.setAttribute('aria-label','Hide password'); }
        else { passEl.type = 'password'; toggle.textContent = '👁️'; toggle.setAttribute('aria-label','Show password'); }
      });
      passEl.addEventListener('input', ()=>{
        const val = passEl.value || '';
        const score = passwordScore(val);
        if(strengthBar) strengthBar.style.width = (score*25) + '%';
        if(strengthText) strengthText.textContent = scoreLabel(score);
      });
    }
  });

  // very simple client-side password strength heuristic (0..4)
  function passwordScore(pw){
    if(!pw) return 0;
    let score = 0;
    if(pw.length >= 8) score++;
    if(/[A-Z]/.test(pw)) score++;
    if(/[0-9]/.test(pw)) score++;
    if(/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(4, score);
  }
  function scoreLabel(s){
    return ['very weak','weak','ok','strong','very strong'][s] || '';
  }
})();
