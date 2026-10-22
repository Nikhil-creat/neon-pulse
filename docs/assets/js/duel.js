// Peer-to-peer duels over WebRTC. No server: two devices swap two codes. Both play the same seeded round.
(()=>{
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'}]},md=$('duel'),ds=$('ds');
let pc=null,dch=null,role=null,stage=0,oppDone=null,myDone=null,tick=null;
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))),dec=s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/\s/g,'')))));
const gather=p=>new Promise(r=>{if(p.iceGatheringState==='complete')return r();const f=()=>{if(p.iceGatheringState==='complete'){p.removeEventListener('icegatheringstatechange',f);r()}};p.addEventListener('icegatheringstatechange',f);setTimeout(r,4000)});
const desc=p=>enc({type:p.localDescription.type,sdp:p.localDescription.sdp}),stat=t=>ds.textContent=t;
const hud=document.createElement('div');hud.id='oh';hud.className='jb';hud.style.cssText='margin:-4px 0 8px;font-size:13px;color:var(--red)';document.querySelector('#play .hud').after(hud);
const send=o=>{try{if(dch&&dch.readyState==='open')dch.send(JSON.stringify(o))}catch(e){}};
function newPc(){pc=new RTCPeerConnection(ICE);pc.onconnectionstatechange=()=>{if(['failed','disconnected','closed'].includes(pc.connectionState))stat('Connection '+pc.connectionState+'.')}}
function wire(c){dch=c;c.onopen=()=>{stat('Connected. Round starts in 3 seconds…');if(role==='host'){const seed=Math.floor(Math.random()*2**31);send({t:'start',seed});begin(seed)}};
c.onmessage=e=>{let d;try{d=JSON.parse(e.data)}catch(x){return}if(d.t==='start')begin(d.seed);else if(d.t==='score')hud.textContent='Opponent: '+d.sc;else if(d.t==='done'){oppDone=d.sc;result()}}}
function begin(seed){md.classList.remove('o');oppDone=myDone=null;hud.textContent='Opponent: 0';DUEL_SEED=seed;if(run)return;[...$('modes').children].find(b=>b.dataset.m==='classic').click();document.getElementById('play').scrollIntoView({behavior:'smooth'});
let n=3;const iv=setInterval(()=>{say(n>0?`Duel starts in ${n}…`:'GO!');if(n--<=0){clearInterval(iv);$('go').click();clearInterval(tick);tick=setInterval(()=>{if(!run){clearInterval(tick);return}send({t:'score',sc})},400)}},1000)}
function result(){if(myDone==null||oppDone==null)return;const w=myDone>oppDone?'You win!':myDone<oppDone?'You lose.':'Draw!';say(`Duel result: you ${myDone} vs opponent ${oppDone}. ${w}`);hud.textContent=`Final: ${myDone} vs ${oppDone} · ${w}`;oppDone=myDone=null}
const prevEnd=end;end=async function(){const had=DUEL_SEED!=null;await prevEnd();if(had){myDone=sc;send({t:'done',sc});DUEL_SEED=null;result()}};
function reset(){try{if(pc)pc.close()}catch(e){}pc=dch=role=null;stage=0;$('dc1').value=$('dc2').value='';$('dl2').textContent='Paste their code';stat('Choose Host or Join.')}
$('du').onclick=()=>{md.classList.add('o');reset()};$('dx').onclick=()=>md.classList.remove('o');
$('dh').onclick=async()=>{reset();role='host';newPc();wire(pc.createDataChannel('duel'));stat('Creating code…');await pc.setLocalDescription(await pc.createOffer());await gather(pc);$('dc1').value=desc(pc);$('dl2').textContent="Paste your friend's reply code";stat('Send your code to a friend, then paste their reply code and press Connect.')};
$('dj').onclick=()=>{reset();role='guest';newPc();pc.ondatachannel=e=>wire(e.channel);$('dl2').textContent="Paste the host's code";stat("Paste the host's code and press Connect.")};
$('dgo').onclick=async()=>{try{const code=dec($('dc2').value);if(role==='host'){await pc.setRemoteDescription(code);stat('Connecting…')}else if(role==='guest'&&stage===0){await pc.setRemoteDescription(code);await pc.setLocalDescription(await pc.createAnswer());await gather(pc);$('dc1').value=desc(pc);stage=1;stat('Send this reply code back to the host. Waiting for connection…')}else stat('Already connecting.')}catch(e){stat('That code did not work. Ask for a fresh one.')}};
$('dcp').onclick=async()=>{try{await navigator.clipboard.writeText($('dc1').value);stat('Copied.')}catch(e){$('dc1').select();stat('Select the code and copy it.')}};
$('dsh').onclick=()=>{if(navigator.share)navigator.share({text:$('dc1').value}).catch(()=>{});else stat('Use Copy.')};
})();
