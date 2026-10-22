// Local-first layer: working accounts/leaderboards/rewards without a backend, in-browser AI agent (Groq tool-calling / Gemini),
// AI coach, voice control, webcam motion mode, share card, command palette, PWA install.
(()=>{
const day=()=>new Date().toISOString().slice(0,10),wk=()=>Math.floor(Date.now()/604800000),sb=document.getElementById('as');
const setS2=t=>sb.textContent=t,sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('np:'+s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const blank=()=>({name:'',pw:'',coins:0,streak:0,last:'',friends:[],rounds:[]});
let profiles=store.get('profiles',{}),PR=profiles[store.get('cur','')||'guest']||blank();
const save=()=>{profiles[PR.name||'guest']=PR;store.set('profiles',profiles);store.set('cur',PR.name)};
const who=()=>PR.name||'YOU',loggedIn=()=>!!(A.tok||PR.name);
// ---------- stats, achievements, board ----------
const ACHL=[['first_blood','First Blood','Finish a ranked round',s=>s.rounds>=1],['centurion','Centurion','Score 100+ in a round',s=>s.best>=100],['sharpshooter','Sharpshooter','90%+ accuracy over 3 rounds',s=>s.rounds>=3&&s.accuracy_pct>=90],['regular','Regular','3-day reward streak',s=>s.streak>=3],['veteran','Veteran','Play 25 rounds',s=>s.rounds>=25],['legend','Legend','Score 400+ in a round',s=>s.best>=400]];
const SK={first_blood:'Cyberpunk Neon',sharpshooter:'Retro 8-Bit',regular:'Synthwave 80s',legend:'Ghost Gold'};
function stat(){const r=PR.rounds,h=r.reduce((a,x)=>a+x.hits,0),s=r.reduce((a,x)=>a+x.shots,0);return{rounds:r.length,best:Math.max(0,...r.map(x=>x.sc)),accuracy_pct:s?Math.round(100*h/s):0,coins:PR.coins,streak:PR.streak,persona:r.length?r[r.length-1].persona:'unranked'}}
const BOTS=['NEON_FOX','GhostRun','PixelNova','Byte','Kilobyte','VoltRider','Glitch','Zeroday'];
const bot=(n,p)=>120+hash(n+(p==='today'?day():p==='week'?wk():'all'))%330;
function mine(p){const now=Date.now(),r=PR.rounds.filter(x=>p==='all'||(p==='today'?new Date(x.t).toISOString().slice(0,10)===day():now-x.t<6048e5||false));return r.length?Math.max(...r.map(x=>x.sc)):null}
function rows(p){const m=mine(p==='friends'?'all':p),e=[];if(p==='friends')PR.friends.forEach(n=>e.push([n,bot(n,'all')]));else BOTS.forEach(n=>e.push([n,bot(n,p)]));if(m!==null)e.push([who(),m,1]);return e.sort((a,b)=>b[1]-a[1]).slice(0,10)}
const apiDraw=drawLb;
drawLb=function(){if(A.tok)return apiDraw();const r=rows(A.period);$('lb').innerHTML=r.length?r.map(e=>`<li class="${e[2]?'me':''}">${e[0]} — ${e[1]}</li>`).join(''):'<li>No scores yet. Play a round!</li>'};
function renderAch(){const s=stat(),l=ACHL.map(([id,n,d,fn])=>({id,n,d,u:!!fn(s)})),sk=l.filter(a=>a.u&&SK[a.id]).map(a=>SK[a.id]);A.skins=sk;
$('ach').innerHTML='<h3>Achievements</h3>'+l.map(a=>`<div class="ach ${a.u?'u':'l'}"><b>${a.n}</b><span>${a.u?'unlocked':a.d}</span></div>`).join('')+`<div class="jb" style="font-size:12px;color:var(--lab);margin-top:8px">Skins: ${sk.length?sk.join(', '):'none yet'} · ${s.coins} coins · ${s.streak}-day streak</div><button class="btn g sm" id="dly" style="margin-top:10px">Claim daily reward</button>`;
$('pf').textContent=`Profiler: ${s.persona} · best ${s.best} · ${s.coins} coins`;best=Math.max(best,s.best)}
$('ach').addEventListener('click',e=>{if(e.target.id==='dly'){if(A.tok)f('/api/v1/rewards/daily',{method:'POST'}).then(r=>r.json()).then(j=>say(`+${j.bonus} coins`)).catch(x=>say(x.message));else say(claim())}});
function claim(){const d=day();if(PR.last===d)return 'Daily reward already claimed today.';const y=new Date(Date.now()-864e5).toISOString().slice(0,10);PR.streak=PR.last===y?PR.streak+1:1;PR.last=d;const b=50+10*Math.min(PR.streak,10);PR.coins+=b;save();refresh();return `Claimed +${b} coins · ${PR.streak}-day streak`}
function refresh(){if(A.tok)return;drawLb();renderAch();spark()}
// ---------- accounts (local) ----------
function ui(){const on=loggedIn();$('li').textContent=on?'Log out':'Log in';$('rg').style.display=on?'none':'';$('un').style.display=$('pw').style.display=on?'none':''}
async function auth2(kind){
if(loggedIn()){A.tok=A.key=A.user=null;if(A.ws)try{A.ws.close()}catch(e){}PR=profiles.guest||blank();store.set('cur','');ui();setS2('Logged out. Playing as guest on this device.');refresh();return}
const name=$('un').value.trim(),pw=$('pw').value,base=$('api').value.trim().replace(/\/$/,'');
if(base){setS2('Contacting API…');let ok=false;try{const c=new AbortController();setTimeout(()=>c.abort(),3500);ok=(await fetch(base+'/health',{signal:c.signal})).ok}catch(e){}
if(ok){await auth(kind);if(A.tok){ui();return}}else setS2('API not reachable, using a local profile instead.')}
if(!/^[A-Za-z0-9_]{3,32}$/.test(name)||name.toLowerCase()==='guest'){setS2('Username: 3-32 letters, numbers or _');return}
if(pw.length<8){setS2('Password needs 8+ characters.');return}
const key=await sha(name+pw);
if(kind==='reg'){if(profiles[name]){setS2('That username already exists on this device. Use Log in.');return}const g=profiles.guest||blank();PR={...blank(),name,pw:key,rounds:g.rounds,friends:g.friends,coins:g.coins,streak:g.streak,last:g.last};delete profiles.guest;save();setS2(`Local profile "${name}" created. Saved in this browser only.`)}
else{if(!profiles[name]||profiles[name].pw!==key){setS2('Wrong username or password.');return}PR=profiles[name];store.set('cur',name);setS2(`Signed in locally as ${name}.`)}
ui();refresh()}
$('li').onclick=()=>auth2('login');$('rg').onclick=()=>auth2('reg');
const apiFriend=$('fa').onclick;
$('fa').onclick=()=>{if(A.tok)return apiFriend();const n=$('fr').value.trim();if(!/^[A-Za-z0-9_]{3,32}$/.test(n)){setS2('Friend name: 3-32 letters, numbers or _');return}if(n===PR.name||PR.friends.includes(n)){setS2('Already on your list.');return}PR.friends.push(n);save();$('fr').value='';setS2(`Added rival ${n}. Check the Friends tab.`);if(A.period==='friends')drawLb()};
// record finished rounds
const apiEnd=end;
end=async function(){await apiEnd();if(A.tok)return;if(trust>=40){const acc=shots?hit/shots:0,cps=hit/30;PR.rounds.push({sc,hits:hit,shots,acc:Math.round(acc*100),persona:cps>3.5?'The Speed Demon':acc>.9?'Precision Sniper':'Tactical Strategist',t:Date.now()});PR.rounds=PR.rounds.slice(-100);save();say(`Round saved: ${sc} pts`)}refresh();coach()};
// ---------- AI: llm helper, agent, coach ----------
const gk=()=>$('kg').value.trim(),jk=()=>$('kj').value.trim();
try{['kg','kj'].forEach(i=>{$(i).value=sessionStorage.getItem(i)||'';$(i).addEventListener('input',()=>sessionStorage.setItem(i,$(i).value))})}catch(e){}
async function llm(prompt){try{if(gk()){const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+gk()},body:JSON.stringify({model:'llama-3.3-70b-versatile',max_tokens:200,messages:[{role:'user',content:prompt}]})});if(r.ok)return(await r.json()).choices[0].message.content}
if(jk()){const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+encodeURIComponent(jk()),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});if(r.ok)return(await r.json()).candidates[0].content.parts[0].text}}catch(e){}return null}
const TOOLS={fetch_player_stats:()=>JSON.stringify({...stat(),rank:rows('all').findIndex(r=>r[2])+1||null}),claim_daily_reward:()=>claim(),
trigger_custom_challenge:a=>tools.trigger_custom_challenge(a.difficulty||'medium'),query_knowledge_base:a=>rag(a.question||'').map(c=>c[0]+': '+c[1]).join('\n'),
set_theme:a=>{const b=[...$('themes').children].find(x=>x.dataset.t===a.theme);if(!b)return 'unknown theme';b.click();return 'Theme requested (locked themes stay locked).'},start_round:()=>{$('go').click();return 'Round started.'}};
const TS=[['fetch_player_stats','Get the player stats, rank and persona.',{}],['claim_daily_reward','Claim the daily reward.',{}],['trigger_custom_challenge','Set difficulty for the next round.',{difficulty:{type:'string',enum:['easy','medium','hard']}}],['query_knowledge_base','Search game rules and strategy.',{question:{type:'string'}}],['set_theme','Switch the UI theme if unlocked.',{theme:{type:'string',enum:['neon','retro','sun']}}],['start_round','Start a 30 second round.',{}]].map(([name,description,p])=>({type:'function',function:{name,description,parameters:{type:'object',properties:p}}}));
function typeOut(el,t){return new Promise(r=>{let i=0;const iv=setInterval(()=>{i+=3;el.textContent=t.slice(0,i);L.scrollTop=L.scrollHeight;if(i>=t.length){clearInterval(iv);r()}},12)})}
function speak(t){if(voiceOn&&'speechSynthesis'in window&&t){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(t.slice(0,300)))}}
async function agentAsk(q){add(q,'u');const out=add('…');
if(!gk()&&!jk()){const m=q.match(/challenge\s*(easy|hard|medium)?/i);let r;
if(m)r=TOOLS.trigger_custom_challenge({difficulty:(m[1]||'medium').toLowerCase()});else if(/daily|reward/i.test(q))r=claim();else if(/stat|rank/i.test(q))r=TOOLS.fetch_player_stats();else if(/(start|play).*(round|game)/i.test(q))r=TOOLS.start_round();
else{r=rag(q)[0][1];out.textContent=r;add('Offline answer. Add a free Groq or Gemini key below to unlock the full AI agent.','s');return}
out.textContent=r;return}
const ctx=rag(q).map(c=>c[0]+': '+c[1]).join('\n'),sys='You are Click-Bot Prime, a concise esports coach for a neon clicker game. Use tools for player data and actions. Game facts:\n'+ctx;
try{if(gk()){const msgs=[{role:'system',content:sys},{role:'user',content:q}];
for(let i=0;i<4;i++){const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+gk()},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:msgs,tools:TS,tool_choice:'auto'})});if(!r.ok)throw new Error('Groq '+r.status);
const m=(await r.json()).choices[0].message;
if(m.tool_calls&&m.tool_calls.length){msgs.push(m);for(const tc of m.tool_calls){let a={};try{a=JSON.parse(tc.function.arguments||'{}')}catch(e){}add('tool: '+tc.function.name,'s');msgs.push({role:'tool',tool_call_id:tc.id,content:String(TOOLS[tc.function.name]?TOOLS[tc.function.name](a):'unknown tool')})}continue}
await typeOut(out,m.content||'(no answer)');speak(m.content);return}out.textContent='Agent stopped after 4 steps.'}
else{const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+encodeURIComponent(jk()),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:sys+'\n\nPlayer: '+q}]}]})});if(!r.ok)throw new Error('Gemini '+r.status);const t=(await r.json()).candidates[0].content.parts[0].text;await typeOut(out,t);speak(t)}}
catch(e){out.textContent='AI error: '+e.message+'. Check the key.'}}
const apiAsk=ask;ask=q=>A.tok?apiAsk(q):agentAsk(q);
function spark(){const c=$('spark'),g=c.getContext('2d'),r=PR.rounds.slice(-12).map(x=>x.sc);g.clearRect(0,0,300,60);if(r.length<2)return;const mx=Math.max(...r),mn=Math.min(...r);g.beginPath();r.forEach((v,i)=>{const px=i*(290/(r.length-1))+5,py=55-(mx===mn?.5:(v-mn)/(mx-mn))*48;i?g.lineTo(px,py):g.moveTo(px,py)});g.strokeStyle=THEME.hex;g.lineWidth=2;g.stroke()}
async function coach(){const r=PR.rounds,l=r[r.length-1];if(!l)return;const p=r[r.length-2],iv=A.rec.slice(1).map((t,i)=>t-A.rec[i]),avg=iv.length?iv.reduce((a,b)=>a+b)/iv.length:0,t=[];
if(l.acc<60)t.push('Slow down: accuracy is under 60%. Find a rhythm first.');else if(l.acc>90&&avg>450)t.push('Great aim. Click the next ring sooner to raise your score.');
if(avg&&avg<180)t.push('Very fast, even clicking can look robotic to the anti-cheat.');if(p&&l.sc>p.sc)t.push(`Improving: +${l.sc-p.sc} vs last round.`);if(!t.length)t.push('Solid round. Pre-aim toward the next spawn to extend combos.');
$('ct').textContent=t.join('\n');spark();
if(gk()||jk()){const a=await llm(`You are an esports coach. Give exactly 3 short bullet tips (max 16 words each) for this clicker round: score ${l.sc}, accuracy ${l.acc}%, hits ${l.hits}/${l.shots}, average click gap ${Math.round(avg)}ms, persona ${l.persona}${p?`, previous score ${p.sc}`:''}.`);if(a)$('ct').textContent=a.trim()}}
// ---------- voice ----------
let voiceOn=false,rc=null;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$('vc').onclick=()=>{if(!SR){say('Voice control needs Chrome (SpeechRecognition).');return}
if(voiceOn){voiceOn=false;try{rc.stop()}catch(e){}$('vc').textContent='Voice';return}
rc=new SR();rc.lang='en-US';rc.continuous=true;rc.onresult=e=>{const t=e.results[e.results.length-1][0].transcript.trim();say('Heard: '+t);voiceCmd(t)};rc.onend=()=>{if(voiceOn)try{rc.start()}catch(e){}};rc.onerror=()=>{};try{rc.start();voiceOn=true;$('vc').textContent='Voice: on'}catch(e){say('Mic: '+e.message)}};
function voiceCmd(t){const s=t.toLowerCase(),m=s.match(/theme (neon|retro|sun)/);if(/^(start|play|begin)/.test(s))$('go').click();else if(m)TOOLS.set_theme({theme:m[1]});else if(/^(mute|silence)/.test(s))$('mt').click();else{$('chat').classList.add('o');ask(t)}}
// ---------- motion mode (webcam frame differencing, runs fully in the browser) ----------
let mv=null;
$('mo').onclick=async()=>{if(mv){clearInterval(mv.t);mv.s.getTracks().forEach(k=>k.stop());mv=null;$('mo').textContent='Motion';return}
try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:320,height:240}}),v=document.createElement('video');v.srcObject=s;v.muted=true;v.playsInline=true;await v.play();
const c=document.createElement('canvas');c.width=64;c.height=48;const g=c.getContext('2d',{willReadFrequently:true});let pv=null,cool=0;
mv={s,t:setInterval(()=>{g.drawImage(v,0,0,64,48);const d=g.getImageData(0,0,64,48).data,gr=new Uint8Array(3072);let sx=0,sy=0,n=0;
for(let i=0;i<3072;i++){gr[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/3;if(pv&&Math.abs(gr[i]-pv[i])>38){sx+=i%64;sy+=(i/64|0);n++}}pv=gr;
if(n>60&&run&&T.length&&Date.now()>cool){cool=Date.now()+280;const r=cv.getBoundingClientRect(),dp=devicePixelRatio||1,mx=r.left+(1-sx/n/64)*r.width,my=r.top+(sy/n/48)*r.height;
let b=null,bd=1e9;T.forEach(o=>{const dd=Math.hypot(r.left+o.x/dp-mx,r.top+o.y/dp-my);if(dd<bd){bd=dd;b=o}});
if(b&&bd<r.width*.45){A.gz=true;cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+b.x/dp,clientY:r.top+b.y/dp}));A.gz=false;$('ac1').textContent='Motion: tap detected'}}},90)};
$('mo').textContent='Stop motion'}catch(e){say('Camera: '+e.message)}};
// ---------- share card ----------
function share(){const l=PR.rounds[PR.rounds.length-1];if(!l){say('Play a round first.');return}
const c=document.createElement('canvas');c.width=c.height=1080;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,1080,1080);g.fillStyle=THEME.hex;g.fillRect(0,0,1080,12);
g.fillStyle='#fff';g.font='700 70px "Space Grotesk",sans-serif';g.fillText('NEON-PULSE',70,150);g.fillStyle='#949494';g.font='30px "JetBrains Mono",monospace';g.fillText('Pixel Clicker AI Platform',70,205);
g.fillStyle='#fff';g.font='700 320px "Space Grotesk",sans-serif';g.fillText(String(l.sc),64,620);g.fillStyle=THEME.hex;g.font='700 54px "Space Grotesk",sans-serif';g.fillText(l.persona,70,720);
g.fillStyle='#e6e6e6';g.font='34px "JetBrains Mono",monospace';g.fillText(`${l.acc}% accuracy · ${l.hits} hits · ${who()}`,70,790);g.fillStyle='#949494';g.font='28px "JetBrains Mono",monospace';g.fillText(location.host+location.pathname,70,1010);
c.toBlob(async b=>{const file=new File([b],'neon-pulse-score.png',{type:'image/png'});
if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'My Neon-Pulse score',text:`I scored ${l.sc} on Neon-Pulse! ${location.href}`});return}catch(e){if(e.name==='AbortError')return}}
const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='neon-pulse-score.png';a.click()})}
$('sh').onclick=share;
// ---------- command palette + install ----------
let dip=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e});
const jump=id=>document.getElementById(id).scrollIntoView({behavior:'smooth'}),th=t=>TOOLS.set_theme({theme:t});
const CMDS=[['Start 30s round',()=>{jump('play');$('go').click()}],['Open Click-Bot chat',()=>$('chat').classList.add('o')],['Claim daily reward',()=>say(claim())],['Theme: Cyberpunk Neon',()=>th('neon')],['Theme: Retro 8-Bit',()=>th('retro')],['Theme: Synthwave 80s',()=>th('sun')],['Toggle sound',()=>$('mt').click()],['Toggle voice control',()=>$('vc').click()],['Toggle motion mode',()=>$('mo').click()],['Share my score',share],['Go to Avatar Lab',()=>jump('avatar')],['Go to Features',()=>jump('features')],['Go to Agents',()=>jump('agents')],['Go to Credentials',()=>jump('creds')],['Go to Contact',()=>jump('contact')],['Install app',()=>dip?dip.prompt():say('Use your browser menu: Add to Home screen.')]];
const pal=$('pal'),pi=$('pi'),pl=$('pl');let sel=0,cur=CMDS;
function rl(){pl.innerHTML=cur.map((c,i)=>`<div class="${i===sel?'on':''}" data-i="${i}">${c[0]}</div>`).join('')||'<div>No match</div>'}
function op(){pal.classList.add('o');pi.value='';cur=CMDS;sel=0;rl();setTimeout(()=>pi.focus(),30)}const cl=()=>pal.classList.remove('o');
function run2(i){const c=cur[i];if(c){cl();c[1]()}}
pi.oninput=()=>{const q=pi.value.toLowerCase();cur=CMDS.filter(c=>c[0].toLowerCase().includes(q));sel=0;rl()};
pi.onkeydown=e=>{if(e.key==='ArrowDown'){sel=Math.min(sel+1,cur.length-1);rl();e.preventDefault()}else if(e.key==='ArrowUp'){sel=Math.max(sel-1,0);rl();e.preventDefault()}else if(e.key==='Enter')run2(sel);else if(e.key==='Escape')cl()};
pl.onclick=e=>e.target.dataset.i&&run2(+e.target.dataset.i);pal.onclick=e=>{if(e.target===pal)cl()};$('pk').onclick=op;
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();op()}else if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();op()}});
// ---------- init ----------
ui();setS2(PR.name?`Signed in locally as ${PR.name}.`:'Local mode: profile and scores are saved in this browser. Add a backend URL for global leaderboards.');
refresh();const sv=store.get('theme','neon');if(sv!=='neon'){const b=[...$('themes').children].find(x=>x.dataset.t===sv);b&&b.click()}
})();
