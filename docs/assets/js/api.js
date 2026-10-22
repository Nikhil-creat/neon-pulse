// ===== Live API layer: auth, HMAC-signed scores, leaderboards, WS feed, SSE chat, ghost replay, webcam gestures =====
const A={base:store.get('api',''),tok:null,key:null,user:null,period:'all',rec:[],lh:0,run:[],ghost:[],ws:null,gz:false,cam:null};
$('api').value=A.base;const setS=t=>$('as').textContent=t;
async function f(p,o={},retry=true){const h={'Content-Type':'application/json',...(o.headers||{})};if(A.tok)h.Authorization='Bearer '+A.tok;
const r=await fetch(A.base+p,{credentials:'include',...o,headers:o.body instanceof FormData?{Authorization:h.Authorization}:h});
if(r.status===401&&A.user&&retry&&!p.includes('/auth/')){if(await refresh())return f(p,o,false)}
if(!r.ok){let d='';try{d=(await r.json()).detail}catch(e){}throw new Error(d||('HTTP '+r.status))}return r}
async function refresh(){try{const j=await(await fetch(A.base+'/api/v1/auth/refresh',{method:'POST',credentials:'include'})).json();A.tok=j.access_token;A.key=j.sign_key;return !!A.tok}catch(e){return false}}
async function sign(b){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(A.key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return[...new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(b)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function auth(kind){A.base=$('api').value.trim().replace(/\/$/,'');store.set('api',A.base);const b=JSON.stringify({name:$('un').value.trim(),password:$('pw').value});
try{if(kind==='reg')await f('/api/v1/auth/register',{method:'POST',body:b});const j=await(await f('/api/v1/auth/login',{method:'POST',body:b})).json();A.tok=j.access_token;A.key=j.sign_key;A.user=j.user;setS('Signed in as '+A.user+' · scores are signed & ranked server-side');ws();drawLb();stats()}catch(e){setS('Error: '+e.message+(/Failed to fetch/.test(e.message)?' (is the API reachable and CORS_ORIGINS set?)':''))}}
$('li').onclick=()=>auth('login');$('rg').onclick=()=>auth('reg');
async function stats(){try{const s=await(await f('/api/v1/me/stats')).json();best=s.best;$('pf').textContent=`Profiler: ${s.persona} · rank ${s.global_rank??'–'} · ${s.coins} coins · streak ${s.streak}`}catch(e){}}
drawLb=async function(){const el=$('lb');if(!A.tok){el.innerHTML=board.slice().sort((a,b)=>b[1]-a[1]).slice(0,8).map(e=>`<li class="${e[0]==='YOU'?'me':''}">${e[0]} — ${e[1]}</li>`).join('');return}
try{const r=await(await f('/api/v1/leaderboard?period='+A.period+'&limit=10&mode='+MODE)).json();el.innerHTML=r.length?r.map(e=>`<li class="${e.user===A.user?'me':''}">${e.user} — ${e.score}</li>`).join(''):'<li>No scores yet</li>'}catch(e){el.innerHTML='<li>'+e.message+'</li>'}};
$('tabs').onclick=e=>{const p=e.target.dataset.p;if(!p)return;A.period=p;[...$('tabs').children].forEach(b=>b.classList.toggle('on',b===e.target));drawLb()};
$('fa').onclick=async()=>{try{await f('/api/v1/friends/'+encodeURIComponent($('fr').value.trim()),{method:'POST'});setS('Friend added');$('fr').value=''}catch(e){setS('Friend: '+e.message)}};
function ws(){if(A.ws)A.ws.close();try{A.ws=new WebSocket(A.base.replace(/^http/,'ws')+'/ws/live');A.ws.onmessage=m=>{const d=JSON.parse(m.data);say(`${d.user} just scored ${d.score} (${d.persona})`);drawLb()}}catch(e){}}
cv.addEventListener('pointerdown',e=>{if(!run)return;A.rec.push(e.timeStamp);if(hit>A.lh){const r=cv.getBoundingClientRect();A.run.push([+((e.timeStamp-st)/1000).toFixed(3),+((e.clientX-r.left)/r.width).toFixed(4),+((e.clientY-r.top)/r.height).toFixed(4)])}A.lh=hit});
const oldGo=$('go').onclick;$('go').onclick=async()=>{A.rec=[];A.run=[];A.lh=0;A.ghost=[];oldGo();if(A.tok){try{A.ghost=(await(await f('/api/v1/ghosts/top')).json()).hits||[]}catch(e){}}};
const oldAudit=audit;audit=function(e){if(A.gz)return;return oldAudit(e)};
const oldEnd=end;end=async function(){oldEnd();if(!A.tok)return;const iv=A.rec.slice(1).map((t,i)=>t-A.rec[i]).slice(-500),body=JSON.stringify({score:sc,intervals:iv,hits:hit,shots,mode:MODE});
try{const j=await(await f('/api/v1/scores',{method:'POST',body,headers:{'X-Signature':await sign(body)}})).json();say(`Server accepted ${sc} pts · trust ${Math.round(j.trust)} · ${j.persona}`);setTrust(j.trust);
f('/api/v1/ghosts',{method:'POST',body:JSON.stringify({score:sc,hits:A.run.slice(0,500)})}).catch(()=>{})}catch(e){say('Server rejected score: '+e.message)}drawLb();stats()};
(function gl(){if(run&&A.ghost.length){const t=(performance.now()-st)/1000,d=devicePixelRatio||1;A.ghost.forEach(g=>{const a=t-g[0];if(a>-.6&&a<.25){x.beginPath();x.arc(g[1]*W,g[2]*H,26*d*(1+a),0,6.28);x.strokeStyle=`rgba(255,255,255,${.35*(1-Math.abs(a))})`;x.setLineDash([6,6]);x.lineWidth=2;x.stroke();x.setLineDash([])}})}requestAnimationFrame(gl)})();
const oldAsk=ask;ask=async function(q){if(!A.tok)return oldAsk(q);
if(/challenge/i.test(q)){add(q,'u');return add(tools.trigger_custom_challenge((q.match(/easy|hard/i)||[''])[0].toLowerCase()))}
add(q,'u');const out=add('…');
try{if(/daily|reward/i.test(q)){const j=await(await f('/api/v1/rewards/daily',{method:'POST'})).json();out.textContent=`Claimed +${j.bonus} coins · ${j.streak}-day streak`;return stats()}
if(/^\s*(my\s)?stats?\b/i.test(q)){const s=await(await f('/api/v1/me/stats')).json();out.textContent=`Best ${s.best} · ${s.rounds} rounds · ${s.accuracy_pct}% accuracy · rank ${s.global_rank??'–'} · ${s.persona}`;return}
const r=await f('/api/v1/chat',{method:'POST',body:JSON.stringify({message:q})}),rd=r.body.getReader(),dc=new TextDecoder();let buf='',txt='';
for(;;){const{done,value}=await rd.read();if(done)break;buf+=dc.decode(value,{stream:true});const ls=buf.split('\n');buf=ls.pop();for(const l of ls)if(l.startsWith('data: ')&&!l.includes('[DONE]'))try{txt+=JSON.parse(l.slice(6)).token;out.textContent=txt;L.scrollTop=L.scrollHeight}catch(e){}}}
catch(e){out.textContent='Chat error: '+e.message}};
const gb=document.createElement('button');gb.className='btn g';gb.textContent='Gesture mode';$('tg').after(gb);
gb.onclick=async()=>{if(A.cam){clearInterval(A.cam.t);A.cam.s.getTracks().forEach(t=>t.stop());A.cam=null;gb.textContent='Gesture mode';return}
if(!A.tok)return setS('Log in first: gesture frames go to the vision service.');
try{const s=await navigator.mediaDevices.getUserMedia({video:{width:320,height:240}}),v=document.createElement('video');v.srcObject=s;v.muted=true;await v.play();const c=document.createElement('canvas');c.width=160;c.height=120;const g=c.getContext('2d');gb.textContent='Stop gestures';
A.cam={s,t:setInterval(()=>{g.drawImage(v,0,0,160,120);c.toBlob(async b=>{try{const fd=new FormData();fd.append('frame',b,'f.jpg');const j=await(await f('/api/v1/vision/gesture',{method:'POST',body:fd})).json();$('ac1').textContent=`Vision: ${j.gesture} (${Math.round(j.confidence*100)}%)`;
if(j.click&&run&&T.length){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1,t=T[0];A.gz=true;cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+t.x/d,clientY:r.top+t.y/d}));A.gz=false}}catch(e){$('ac1').textContent='Vision: '+e.message}},'image/jpeg',.7)},300)}}catch(e){setS('Camera: '+e.message)}};
