// Visual effects: WebGL plasma backdrop, 3D spotlight cards, cursor glow, scroll progress, count-up, generative music.
(()=>{
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches,still=matchMedia('(prefers-reduced-motion:reduce)').matches;
// ---- scroll progress ----
const sp=document.getElementById('sp'),upd=()=>{const h=document.documentElement;sp.style.width=(100*scrollY/Math.max(1,h.scrollHeight-innerHeight))+'%'};addEventListener('scroll',upd,{passive:true});upd();
// ---- WebGL plasma behind the hero text ----
const hero=document.getElementById('top'),cvs=document.createElement('canvas');cvs.id='fxbg';cvs.setAttribute('aria-hidden','true');
const vid=hero.querySelector('video');vid?vid.after(cvs):hero.prepend(cvs);
const gl=cvs.getContext('webgl',{antialias:false,powerPreference:'low-power'});let mouse=[.7,.4],visible=true;
if(gl){
const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}',FS=`precision mediump float;uniform vec2 R;uniform float T;uniform vec2 M;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/R;float asp=R.x/R.y;vec2 p=(uv-.5)*vec2(asp,1.)*2.2,m=(M-.5)*vec2(asp,1.)*2.2;float t=T*.12;
vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));float f=fbm(p+3.*q+vec2(t,-t));float d=length(p-m);float glow=.35/(.6+d*d*2.);
vec3 red=vec3(.78,.1,.11),cy=vec3(.1,.9,1.);
vec3 c=mix(vec3(0.),red,smoothstep(.35,.9,f))*1.2+cy*smoothstep(.62,.95,q.x*f*1.8)*.55+red*glow*.5;
c+=smoothstep(.97,1.,max(sin(uv.x*R.x/22.),sin(uv.y*R.y/22.)))*.05;
gl_FragColor=vec4(c*smoothstep(1.35,.2,length(uv-.5)*1.6),1.);}`;
const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o},pr=gl.createProgram();
gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
if(gl.getProgramParameter(pr,gl.LINK_STATUS)){gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const uR=gl.getUniformLocation(pr,'R'),uT=gl.getUniformLocation(pr,'T'),uM=gl.getUniformLocation(pr,'M');let last=0;
const fit=()=>{cvs.width=Math.max(2,hero.clientWidth*.5|0);cvs.height=Math.max(2,hero.clientHeight*.5|0);gl.viewport(0,0,cvs.width,cvs.height)};fit();addEventListener('resize',fit);
new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(hero);
hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();mouse=[(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height]});
const frame=t=>{if(document.documentElement.dataset.fx==='off'){requestAnimationFrame(frame);return}if(visible&&!document.hidden&&t-last>33){last=t;gl.uniform2f(uR,cvs.width,cvs.height);gl.uniform1f(uT,t/1000);gl.uniform2f(uM,mouse[0],mouse[1]);gl.drawArrays(gl.TRIANGLES,0,3)}if(!still)requestAnimationFrame(frame)};
requestAnimationFrame(frame);if(still)setTimeout(()=>frame(1e4),50)}else cvs.remove()}else cvs.remove();
// ---- 3D spotlight cards + cursor glow ----
if(fine){
document.querySelectorAll('.fg>div').forEach(c=>{c.addEventListener('pointermove',e=>{if(document.documentElement.dataset.fx==='off')return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.setProperty('--mx',x*100+'%');c.style.setProperty('--my',y*100+'%');c.style.transform=`perspective(700px) rotateX(${(.5-y)*7}deg) rotateY(${(x-.5)*9}deg) translateZ(4px)`});c.addEventListener('pointerleave',()=>c.style.transform='')});
const cg=document.getElementById('cg');let cx=0,cy=0,pend=false;addEventListener('pointermove',e=>{cx=e.clientX;cy=e.clientY;if(!pend){pend=true;requestAnimationFrame(()=>{cg.style.transform=`translate(${cx}px,${cy}px)`;pend=false})}},{passive:true})}
// ---- count-up stats ----
document.querySelectorAll('.stats b').forEach(el=>{const m=el.textContent.match(/^(\D*)(\d+)(.*)$/);if(!m||still)return;const n=+m[2],t0=performance.now();const s=t=>{const k=Math.min(1,(t-t0-900)/1200);el.textContent=m[1]+Math.round(n*(k<0?0:1-Math.pow(1-k,3)))+m[3];if(k<1)requestAnimationFrame(s)};requestAnimationFrame(s)});
// ---- generative synthwave music (WebAudio) ----
let ac=null,master=null,on=false,step=0,timer=0;const ms=document.getElementById('ms');
function note(f,t,d,type,g){const o=ac.createOscillator(),v=ac.createGain();o.type=type;o.frequency.value=f;v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(master);o.start(t);o.stop(t+d+.02)}
function tick(){if(!on)return;const bpm=96+Math.min(cb,30)*1.6+(run?14:0),sd=60/bpm/4,t=ac.currentTime+.05,roots=[110,87.31,130.81,98],sc=[1,1.2,1.3348,1.498,1.7818,2],bar=Math.floor(step/16)%4,root=roots[bar];
if(step%4===0)note(root,t,sd*3.5,'sawtooth',.5);note(root*2*sc[(step*3+bar)%6],t,sd*.9,'square',.22);if(step%8===4)note(root*4,t,sd*.6,'triangle',.25);step++;timer=setTimeout(tick,sd*1000)}
window.NP_music=()=>{try{if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.05;master.connect(ac.destination)}if(ac.state==='suspended')ac.resume()}catch(e){return}
on=!on;ms.textContent=on?'Music: on':'Music';clearTimeout(timer);if(on)tick()};
ms.onclick=window.NP_music;
})();
