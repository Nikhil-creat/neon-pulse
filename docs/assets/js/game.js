let THEME={hex:'#c81b1c',rgb:'200,27,28'};
const $=i=>document.getElementById(i),cv=$('cv'),x=cv.getContext('2d');
let W,H,T=[],P=[],run=false,st,sc=0,cb=0,hit=0,shots=0,clicks=[],spawnMs=800,life=1400,rad=26,last=0,nextSp=0,trust=100,best=0,daily=false;
let MODE='classic',DUR=30,lives=0,SEEDED=null,rng=Math.random,freeze=0,PRESET=null,DUEL_SEED=null,HAP=store0('hap',true);
function store0(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}}
const MODES={classic:{dur:30},survival:{dur:0,lives:3},precision:{dur:30,rad:16},rush:{dur:15,spawn:450,life:1000},daily:{dur:30}};
const DM=[['Tiny rings',{rad:15}],['Fast spawns',{spawn:450,life:1000}],['Long and slow',{spawn:1000,life:1800,rad:30}],['Mixed',{rad:20,spawn:600}]];
const mb=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296},dh=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function loseLife(){if(!run)return;lives--;$('tm').textContent='♥'.repeat(Math.max(0,lives));if(lives<=0)end()}
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let board=store.get('lb',[["NEON_FOX",410],["GhostRun",330],["PixelNova",260],["Byte",190]]),hist=store.get('hist',[]);
function rs(){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;W=cv.width=r.width*d;H=cv.height=r.height*d}rs();addEventListener('resize',rs);
function drawLb(){$('lb').innerHTML=board.slice().sort((a,b)=>b[1]-a[1]).slice(0,8).map(e=>`<li class="${e[0]==='YOU'?'me':''}">${e[0]} — ${e[1]}</li>`).join('')}drawLb();
const say=t=>$('cm').textContent='Commentator: '+t;
function spawn(){const r=rad*(devicePixelRatio||1),px=rng(),py=rng(),q=rng();T.push({x:r+px*(W-2*r),y:r+py*(H-2*r),r,b:performance.now(),type:q<.07?'gold':q<.13?'ice':q<.2?'bomb':'n'})}
function burst(px,py,c){for(let i=0;i<18;i++){const a=Math.random()*6.28,v=1+Math.random()*4;P.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c})}}
function setTrust(v){trust=Math.max(0,Math.min(100,v));$('tr').textContent=Math.round(trust);const b=$('tb');b.style.width=trust+'%';b.style.background=trust>70?'#fff':trust>40?'#e0a030':'#c81b1c'}
function audit(e){if(!e.isTrusted){setTrust(trust-40);$('ac1').textContent='Anti-Cheat: synthetic event!';return}
clicks.push(e.timeStamp);if(clicks.length>40)clicks.shift();if(clicks.length<12)return;
const iv=clicks.slice(1).map((t,i)=>t-clicks[i]),m=iv.reduce((a,b)=>a+b)/iv.length,sd=Math.sqrt(iv.reduce((a,b)=>a+(b-m)**2,0)/iv.length),bins={};
iv.forEach(v=>{const k=Math.round(v/10);bins[k]=(bins[k]||0)+1});let en=0;Object.values(bins).forEach(c=>{const p=c/iv.length;en-=p*Math.log2(p)});
let f='clean';if(sd<6&&m<400){f='macro-like regularity';setTrust(trust-6)}else if(1000/m>14){f='superhuman CPS';setTrust(trust-6)}else setTrust(trust+.5);
$('ac1').textContent=`Anti-Cheat: ${f} (σ ${sd.toFixed(0)}ms, H ${en.toFixed(1)})`}
function direct(){const cps=clicks.filter(t=>performance.now()-t<3000).length/3,acc=shots?hit/shots:1;$('cps').textContent=cps.toFixed(1);let n='steady';
if(SEEDED){$('dr').textContent='Director: locked (seeded round)';return}if(MODE==='survival'){spawnMs=Math.max(320,800-(performance.now()-st)/1000*9);$('dr').textContent='Director: survival ramp · spawn '+Math.round(spawnMs)+'ms';return}
if(acc>.85&&cps>2.5){spawnMs=Math.max(300,spawnMs-60);life=Math.max(700,life-60);rad=Math.max(14,rad-1);n='hard: faster, smaller'}else if(acc<.6){spawnMs=Math.min(1100,spawnMs+60);life=Math.min(1800,life+60);rad=Math.min(34,rad+1);n='easing: slower, bigger'}
$('dr').textContent=`Director: ${n} · spawn ${spawnMs}ms`}
cv.addEventListener('pointerdown',e=>{e.preventDefault();if(!run)return;const r=cv.getBoundingClientRect(),d=devicePixelRatio||1,px=(e.clientX-r.left)*d,py=(e.clientY-r.top)*d;audit(e);shots++;
const i=T.findIndex(t=>Math.hypot(t.x-px,t.y-py)<=t.r*1.15);
if(i>-1){const t=T.splice(i,1)[0];
if(t.type==='bomb'){cb=0;sc=Math.max(0,sc-15);burst(t.x,t.y,'255,59,59');say('Bomb! -15 points.');if(MODE==='survival')loseLife()}
else{hit++;cb++;let pts=Math.round(10*(1+cb*.1));if(t.type==='gold'){pts*=3;say('Golden ring! x3')}if(t.type==='ice'){freeze=performance.now()+3000;say('Freeze! Spawns slowed.')}sc+=pts;burst(t.x,t.y,t.type==='gold'?'255,211,77':t.type==='ice'?'111,216,255':'255,255,255');if(HAP&&navigator.vibrate)navigator.vibrate(10);if(cb%10===0)say(`Combo x${cb}! The crowd goes wild.`)}}
else{if(cb>=5)say('Combo broken. Tight recovery needed.');cb=0;burst(px,py,THEME.rgb);if(MODE==='precision')sc=Math.max(0,sc-5);if(MODE==='survival')loseLife()}
$('sc').textContent=sc;$('cb').textContent=cb;$('ac').textContent=Math.round(hit/shots*100)+'%'});
function loop(t){x.clearRect(0,0,W,H);
if(run){if(t>nextSp){spawn();nextSp=t+(t<freeze?spawnMs*2.2:spawnMs)}
T=T.filter(o=>{const a=(t-o.b)/life;if(a>=1){if(o.type!=='bomb'){cb=0;$('cb').textContent=0;shots++;if(MODE==='survival')loseLife()}return false}
const col=o.type==='gold'?'255,211,77':o.type==='ice'?'111,216,255':o.type==='bomb'?'255,59,59':'255,255,255';
x.beginPath();x.arc(o.x,o.y,o.r*(1-a*.3),0,6.28);x.strokeStyle=`rgba(${col},${1-a*.6})`;x.lineWidth=o.type==='n'?3:5;x.shadowColor=o.type==='n'?THEME.hex:`rgb(${col})`;x.shadowBlur=22;x.stroke();
x.fillStyle=o.type==='bomb'?'rgba(40,0,0,.85)':`rgba(${o.type==='n'?THEME.rgb:col},.45)`;x.fill();
if(o.type==='bomb'){const k=o.r*.4;x.beginPath();x.moveTo(o.x-k,o.y-k);x.lineTo(o.x+k,o.y+k);x.moveTo(o.x+k,o.y-k);x.lineTo(o.x-k,o.y+k);x.stroke()}
return true});
const left=DUR?Math.max(0,DUR-(t-st)/1000):1;$('tm').textContent=DUR?Math.ceil(left):'♥'.repeat(Math.max(0,lives));if(t-last>1000){last=t;direct()}if(DUR&&left<=0)end()}
P=P.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.l-=.03;x.fillStyle=`rgba(${p.c},${Math.max(0,p.l)})`;x.fillRect(p.x,p.y,4,4);return p.l>0});x.shadowBlur=0;requestAnimationFrame(loop)}
requestAnimationFrame(loop);
function end(){run=false;T=[];const acc=shots?hit/shots:0,cps=hit/Math.max(1,DUR||(performance.now()-st)/1000),pe=cps>3.5?'The Speed Demon':acc>.9?'Precision Sniper':'Tactical Strategist';
$('pf').textContent=`Profiler: ${pe} (acc ${Math.round(acc*100)}%, ${cps.toFixed(1)} hits/s)`;hist.push({sc,acc:Math.round(acc*100),persona:pe});hist=hist.slice(-20);store.set('hist',hist);best=Math.max(best,sc);
if(trust>=40){board.push(['YOU',sc]);board=board.sort((a,b)=>b[1]-a[1]).slice(0,10);store.set('lb',board);say(`Round over: ${sc} pts. Score submitted.`)}else say('Score rejected: trust score too low.');drawLb();$('go').textContent='Play again'}
$('go').onclick=()=>{const dayS=new Date().toISOString().slice(0,10),pr=MODE==='classic'?PRESET:null;PRESET=null;let o={...(MODES[MODE]||MODES.classic)};if(MODE==='daily')Object.assign(o,DM[dh(dayS)%4][1]);
DUR=o.dur;lives=o.lives||0;spawnMs=pr?pr[0]:(o.spawn||800);life=pr?pr[1]:(o.life||1400);rad=pr?pr[2]:(o.rad||26);
SEEDED=MODE==='daily'?mb(dh('np'+dayS)):(DUEL_SEED!=null?mb(DUEL_SEED):null);rng=SEEDED||Math.random;freeze=0;
sc=cb=hit=shots=0;clicks=[];T=[];setTrust(100);['sc','cb'].forEach(i=>$(i).textContent=0);$('ac').textContent='–';$('tm').textContent=DUR||'♥'.repeat(lives);st=performance.now();nextSp=st;run=true;say(MODE==='daily'?`Daily challenge: ${DM[dh(dayS)%4][0]}. Same rings for everyone today.`:'Round started. Hit the rings.')};
const MD={classic:'Classic: 30 seconds, adaptive Director.',survival:'Survival: 3 lives, rings speed up. Misses and expired rings cost a life.',precision:'Precision: small rings, every miss costs 5 points.',rush:'Rush: 15 seconds, very fast spawns.',daily:'Daily Challenge: same seeded rings for everyone today, with a daily twist.'};
$('modes').onclick=e=>{const m=e.target.dataset.m;if(!m||run)return;MODE=m;[...$('modes').children].forEach(b=>b.classList.toggle('on',b===e.target));say(MD[m]);drawLb()};
const KB=[["Combos","Each consecutive hit raises the multiplier by 0.1. Every 10-hit combo triggers commentary. A miss or an expired ring resets the combo to zero."],["Scoring","Base score is 10 points multiplied by 1 plus combo times 0.1. Accuracy and CPS feed the profiler after each round."],["Anti-cheat","Trust score runs 0 to 100. Macro-like regularity, CPS above 14 and synthetic events lower it. Below 40 the score is rejected from leaderboards."],["Director","The Gameplay Director shrinks rings and speeds spawns when accuracy exceeds 85 percent, and eases off below 60 percent."],["Personas","Speed Demon for high CPS, Precision Sniper for accuracy above 90 percent, Tactical Strategist otherwise."],["Skins","Unlock Cyberpunk Neon, Retro 8-Bit and Synthwave 80s themes via achievements such as a 20-combo or a 7-day streak."],["Easter eggs","Hitting rings in a clockwise pattern three rounds in a row reveals the hidden ghost skin."],["Esports strategy","Aim for rhythm, not raw speed. Keep eyes on the centre, pre-aim toward the next spawn and avoid mashing, which hurts accuracy and trust."],["Ghost mode","Race a recorded run of a top player or your personal best using replayed click coordinates."]];
const tok=s=>s.toLowerCase().match(/[a-z0-9]+/g)||[],tri=s=>{s=' '+s.toLowerCase()+' ';const m={};for(let i=0;i<s.length-2;i++)m[s.substr(i,3)]=(m[s.substr(i,3)]||0)+1;return m};
const docs=KB.map(d=>({t:d,w:tok(d.join(' ')),v:tri(d.join(' '))})),avg=docs.reduce((a,d)=>a+d.w.length,0)/docs.length;
const bm25=q=>docs.map((d,i)=>{let s=0;tok(q).forEach(w=>{const f=d.w.filter(z=>z===w||(w.length>4&&z.startsWith(w.slice(0,5)))).length,n=docs.filter(o=>o.w.includes(w)).length;if(f)s+=Math.log(1+(docs.length-n+.5)/(n+.5))*f*2.2/(f+1.2*(.25+.75*d.w.length/avg))});return[i,s]});
const dense=q=>docs.map((d,i)=>{const a=tri(q);let dot=0,na=0,nb=0;for(const k in a){na+=a[k]**2;if(d.v[k])dot+=a[k]*d.v[k]}for(const k in d.v)nb+=d.v[k]**2;return[i,dot/Math.sqrt(na*nb||1)]});
function rag(q,k=3){const s={};[bm25(q),dense(q)].forEach(l=>l.sort((a,b)=>b[1]-a[1]).forEach(([i],r)=>{s[i]=(s[i]||0)+1/(60+r)}));return Object.entries(s).sort((a,b)=>b[1]-a[1]).slice(0,k).map(e=>docs[e[0]].t)}
const tools={fetch_player_stats(){const l=hist[hist.length-1];return `Best score ${best||'n/a'}, rounds played ${hist.length}, trust ${Math.round(trust)}. Last: ${l?l.persona+', '+l.acc+'% accuracy':'none yet'}.`},
claim_daily_reward(){if(daily)return 'Daily reward already claimed today.';daily=true;sc+=100;$('sc').textContent=sc;return 'Claimed +100 bonus points!'},
trigger_custom_challenge(d){const m={easy:[1000,1700,32],hard:[450,900,16]}[d]||[600,1100,20];PRESET=m;return `Custom ${d||'medium'} challenge set (spawn ${m[0]}ms, ring ${m[2]}px). Press Start.`}};
const L=$('log');function add(t,c){const d=document.createElement('div');d.className='mg '+(c||'');d.textContent=t;L.appendChild(d);L.scrollTop=L.scrollHeight;return d}
async function ask(q){add(q,'u');let m;
if(/stat/i.test(q))return add(tools.fetch_player_stats());if(/daily|reward/i.test(q))return add(tools.claim_daily_reward());
if(m=q.match(/challenge\s*(easy|hard|medium)?/i))return add(tools.trigger_custom_challenge((m[1]||'').toLowerCase()));
const ctx=rag(q),src=ctx.map(c=>c[0]).join(', '),sys='You are Click-Bot Prime, a concise esports coach for a clicker game. Answer only from this context; say so if unknown.\n'+ctx.map(c=>c[0]+': '+c[1]).join('\n'),gk=$('kg').value.trim(),jk=$('kj').value.trim(),out=add('…');
try{if(gk){const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+gk},body:JSON.stringify({model:'llama-3.3-70b-versatile',stream:true,messages:[{role:'system',content:sys},{role:'user',content:q}]})});
if(!r.ok)throw 0;const rd=r.body.getReader(),dc=new TextDecoder();let buf='',txt='';for(;;){const{done,value}=await rd.read();if(done)break;buf+=dc.decode(value,{stream:true});const ls=buf.split('\n');buf=ls.pop();for(const l of ls)if(l.startsWith('data: ')&&!l.includes('[DONE]'))try{txt+=JSON.parse(l.slice(6)).choices[0].delta.content||'';out.textContent=txt}catch(e){}}}
else if(jk){const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+encodeURIComponent(jk),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:sys+'\n\nPlayer: '+q}]}]})});if(!r.ok)throw 0;out.textContent=(await r.json()).candidates[0].content.parts[0].text}
else{out.textContent=ctx[0][1];add('Offline RAG. Add a Groq or Gemini key for LLM answers.','s')}}
catch(e){out.textContent=ctx[0][1];add('LLM unreachable (check key or network). Showing RAG answer.','s')}
add('sources: '+src,'s')}
$('q').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim()){const v=e.target.value.trim();e.target.value='';ask(v)}});
const tgl=()=>$('chat').classList.toggle('o');$('fab').onclick=tgl;$('tg').onclick=tgl;
