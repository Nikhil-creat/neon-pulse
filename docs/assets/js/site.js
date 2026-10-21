// Site chrome: sticky header, mobile menu, reveal animations, contact form, live stats, achievements.
(()=>{
const hd=$('hd'),bg=$('bg'),mn=$('menu');
const sc2=()=>hd.classList.toggle('s',scrollY>20);addEventListener('scroll',sc2,{passive:true});sc2();
const closeM=()=>{mn.classList.remove('o');bg.classList.remove('o');bg.setAttribute('aria-expanded','false');bg.setAttribute('aria-label','Open menu');mn.setAttribute('aria-hidden','true');document.body.style.overflow=''};
bg.onclick=()=>{const o=!mn.classList.contains('o');mn.classList.toggle('o',o);bg.classList.toggle('o',o);bg.setAttribute('aria-expanded',o);bg.setAttribute('aria-label',o?'Close menu':'Open menu');mn.setAttribute('aria-hidden',!o);document.body.style.overflow=o?'hidden':''};
mn.addEventListener('click',e=>{if(e.target.closest('a'))closeM()});addEventListener('keydown',e=>{if(e.key==='Escape')closeM()});addEventListener('resize',()=>{if(innerWidth>1180)closeM()});
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08}):null;
document.querySelectorAll('.rv').forEach(el=>io?io.observe(el):el.classList.add('in'));
// contact form: API when logged-in backend is reachable, otherwise opens the mail app
$('cform').addEventListener('submit',async e=>{e.preventDefault();const n=$('cn').value.trim(),m=$('ce').value.trim(),t=$('cm2').value.trim(),st=$('cs');
if(!n||!/^\S+@\S+\.\S+$/.test(m)||t.length<5){st.textContent='Please fill all fields with a valid email.';return}
try{const r=await fetch(A.base+'/api/v1/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,email:m,message:t})});if(!r.ok)throw 0;st.textContent='Message sent. Thank you!';e.target.reset();return}catch(x){}
location.href='mailto:sriramojunikhil66@gmail.com?subject='+encodeURIComponent('Neon-Pulse message from '+n)+'&body='+encodeURIComponent(t+'\n\n'+n+' <'+m+'>');st.textContent='Opening your mail app…'});
// live global stats + achievements (after login)
async function loadGlobal(){try{const g=await(await f('/api/v1/stats/global')).json();$('gs').textContent=`LIVE · ${g.players} players · ${g.rounds} ranked rounds`}catch(e){}}
async function loadAch(){try{const j=await(await f('/api/v1/me/achievements')).json();A.skins=j.skins;window.dispatchEvent(new Event('skins'));$('ach').innerHTML='<h3>Achievements</h3>'+j.achievements.map(a=>`<div class="ach ${a.unlocked?'u':'l'}"><b>${a.name}</b><span>${a.unlocked?'unlocked':a.desc}</span></div>`).join('')+`<div class="jb" style="font-size:12px;color:var(--lab);margin-top:8px">Skins: ${j.skins.length?j.skins.join(', '):'none yet'}</div>`}catch(e){}}
const oldStats=stats;stats=async function(){await oldStats();loadAch();loadGlobal()};
setInterval(()=>{if(A.tok)loadGlobal()},30000);
})();
