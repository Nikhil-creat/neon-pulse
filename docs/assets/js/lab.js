// Avatar Lab (client-side), unlockable themes, sound, offline cache.
(()=>{
const mix=(a,b,k)=>a.map((x,i)=>Math.round(x+(b[i]-x)*k)),src=new Image();let ready=false;
const v=$('av'),g=v.getContext('2d');function blank(){g.fillStyle='#000';g.fillRect(0,0,256,256);g.fillStyle='#949494';g.font="12px 'JetBrains Mono',monospace";g.textAlign='center';g.fillText('Upload a photo',128,128)}blank();
function draw(){const n=+$('ar').value,st=$('as2').value,t=document.createElement('canvas');t.width=t.height=n;const tg=t.getContext('2d'),s=Math.min(src.width,src.height);
tg.drawImage(src,(src.width-s)/2,(src.height-s)/2,s,s,0,0,n,n);const d=tg.getImageData(0,0,n,n),p=d.data;
for(let i=0;i<p.length;i+=4){const l=(.299*p[i]+.587*p[i+1]+.114*p[i+2])/255;let c;
if(st==='pixel')c=[p[i],p[i+1],p[i+2]].map(x=>Math.round(x/85)*85);
else if(st==='neon')c=l<.5?mix([6,6,10],[200,27,28],l*2):mix([200,27,28],[255,255,255],(l-.5)*2);
else c=l<.5?mix([20,10,0],[255,90,0],l*2):mix([255,90,0],[255,214,120],(l-.5)*2);
p[i]=c[0];p[i+1]=c[1];p[i+2]=c[2];p[i+3]=255}
tg.putImageData(d,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,256,256);g.drawImage(t,0,0,256,256)}
$('af').onchange=e=>{const fl=e.target.files[0];if(!fl)return;const u=URL.createObjectURL(fl);src.onload=()=>{ready=true;draw();URL.revokeObjectURL(u)};src.src=u};
['as2','ar'].forEach(i=>$(i).oninput=()=>ready&&draw());
$('adl').onclick=()=>{if(!ready)return;v.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='neon-avatar.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)})};
// themes: Cyberpunk Neon always; Retro 8-Bit and Synthwave 80s unlock via skins (API) or local rounds played (offline)
const TH={neon:{hex:'#c81b1c',rgb:'200,27,28',skin:'Cyberpunk Neon'},retro:{hex:'#1c9c10',rgb:'28,156,16',skin:'Retro 8-Bit',rounds:1},sun:{hex:'#d65a00',rgb:'214,90,0',skin:'Synthwave 80s',rounds:3},ice:{hex:'#0aa7c4',rgb:'10,167,196',skin:'Aurora Ice',rounds:5},gold:{hex:'#c98a00',rgb:'201,138,0',skin:'Ghost Gold',rounds:9999}};
const open_=t=>t==='neon'||(A.skins||[]).includes(TH[t].skin)||hist.length>=TH[t].rounds;
function setTheme(t){if(!open_(t)){say(`${TH[t].skin} is locked. Play ${TH[t].rounds} round(s) or earn the skin.`);return}document.documentElement.dataset.theme=t==='neon'?'':t;THEME={hex:TH[t].hex,rgb:TH[t].rgb};store.set('theme',t);[...$('themes').children].forEach(b=>b.classList.toggle('on',b.dataset.t===t))}
$('themes').onclick=e=>e.target.dataset.t&&setTheme(e.target.dataset.t);const sv=store.get('theme','neon');if(open_(sv))setTheme(sv);
// sound
let ac=null,mute=store.get('mute',false),lh=0;const mt=$('mt');mt.textContent=mute?'Sound off':'Sound on';
function beep(f,d=.06){if(mute)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),gn=ac.createGain();o.type='square';o.frequency.value=f;gn.gain.value=.04;o.connect(gn);gn.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
mt.onclick=()=>{mute=!mute;store.set('mute',mute);mt.textContent=mute?'Sound off':'Sound on'};
cv.addEventListener('pointerdown',()=>setTimeout(()=>{if(hit<lh)lh=hit;if(hit>lh)beep(520+Math.min(cb,20)*28);else if(run)beep(150,.09);lh=hit},0));
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
