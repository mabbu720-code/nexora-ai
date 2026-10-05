/* Nexora AI - script.js (installable app version) */
const MODES={
chat:{n:"Chat",i:"💬",h:"Let's talk",d:"Ask anything or just chat.",s:["Aaj ka din boring hai, kuch interesting batao","Suggest a good movie for tonight","Mujhe motivation chahiye"],p:"You are Nexora AI, a friendly everyday chat companion. Keep replies warm and short."},
learn:{n:"Learn",i:"🎓",h:"Learn anything",d:"Simple explanations, examples and quizzes.",s:["Explain recursion like I'm 12","Photosynthesis ko simple Hindi mein samjhao","Give me a 5-question quiz on Python basics"],p:"You are Nexora AI in Learn mode. Teach step by step with simple words and a real-life example, then offer a short quiz."},
translate:{n:"Translate",i:"🌐",h:"Translate",d:"Pick a language and paste your text.",s:["Kal mera exam hai, mujhe dua do","Where is the nearest railway station?","Thank you for your help today"],p:"You are Nexora AI in Translate mode. Translate the user's text into the chosen target language. Output the translation first, then a short pronunciation or note only if useful."},
write:{n:"Communicate",i:"✉️",h:"Write better",d:"Emails, messages, letters and replies.",s:["Write a leave application email to my professor","Reply politely to decline an invitation","Make this message sound more professional: bhai kal nahi aa paunga"],p:"You are Nexora AI in Communicate mode. Draft clear, polite, ready-to-send messages. Ask for tone or recipient only if missing."},
code:{n:"Code Help",i:"💻",h:"Code help",d:"Write, explain and debug code.",s:["Write a JavaScript function to reverse a string","Explain this error: undefined is not a function","Make a simple login form in HTML and CSS"],p:"You are Nexora AI in Code Help mode. Give working code in fenced code blocks with a brief explanation. When debugging, name the cause first."},
analyze:{n:"Analyze",i:"📊",h:"Analyze",d:"Summaries, comparisons and insights.",s:["Compare Python and Java for a beginner","Summarize this paragraph in 3 points: ...","Pros and cons of studying abroad"],p:"You are Nexora AI in Analyze mode. Break the topic down, compare clearly, point out key insights and end with a short conclusion."}};
const $=id=>document.getElementById(id);
let mode="chat",busy=false,store={},sample=null,ctl=null;
try{store=JSON.parse(localStorage.getItem("nexora")||"{}")}catch(e){}
const save=()=>{try{localStorage.setItem("nexora",JSON.stringify(store))}catch(e){}};
const msgs=()=>store[mode]||(store[mode]=[]);
const esc=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function md(s){s=esc(s);const parts=s.split("```");return parts.map((p,i)=>i%2?"<pre><code>"+p.replace(/^\w*\n/,"")+"</code></pre>":p.replace(/`([^`\n]+)`/g,"<code>$1</code>").replace(/\*\*([^*\n]+)\*\*/g,"<b>$1</b>")).join("")}
function menu(){["nav","bar"].forEach(id=>{$(id).innerHTML="";for(const k in MODES){const b=document.createElement("button");b.className=k===mode?"on":"";b.textContent=(id==="nav"?MODES[k].i+"  ":"")+MODES[k].n;b.onclick=()=>{mode=k;menu();render()};$(id).appendChild(b)}})}
function add(role,text){const d=document.createElement("div");d.className="msg "+(role==="user"?"u":"b");if(role==="user")d.textContent=text;else d.innerHTML=md(text);$("chat").appendChild(d);$("chat").scrollTop=1e9;return d}
function render(){const c=$("chat");c.innerHTML="";$("opt").style.display=mode==="translate"?"block":"none";const m=msgs(),M=MODES[mode];
if(!m.length){const h=document.createElement("div");h.className="hello";h.innerHTML="<h2>"+M.i+" "+M.h+"</h2><p>"+M.d+"</p>";const t=document.createElement("div");t.className="tips";M.s.forEach(x=>{const b=document.createElement("button");b.textContent=x;b.onclick=()=>{$("t").value=x;send()};t.appendChild(b)});h.appendChild(t);c.appendChild(h)}
else m.forEach(x=>add(x.r,x.c))}
const CFG=(()=>{try{return JSON.parse(localStorage.getItem("nexora_cfg")||"{}")}catch(e){return{}}})();
const DEF_MODEL="gemini-2.5-flash-lite";
function openSet(msg){$("key").value=CFG.key||"";$("mdl").value=CFG.model||DEF_MODEL;$("srv").value=CFG.srv||"";$("snote").textContent=msg||"Optional. Leave all empty to use the app's built-in server. Or add your own Claude key (saved only on this device).";$("set").hidden=false}
$("st").onclick=()=>openSet();$("sx").onclick=()=>{$("set").hidden=true};
$("ss").onclick=()=>{CFG.key=$("key").value.trim();CFG.model=$("mdl").value.trim()||DEF_MODEL;CFG.srv=$("srv").value.trim();try{localStorage.setItem("nexora_cfg",JSON.stringify(CFG))}catch(e){}$("set").hidden=true};
async function askAI(system,messages){
if(CFG.srv||!CFG.key){const r=await fetch(CFG.srv||"/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({system,messages})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Server error "+r.status);return d.text||""}
const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+(CFG.model||DEF_MODEL)+":generateContent",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":CFG.key},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:messages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:1024}})});
const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error&&d.error.message||"Error "+r.status);
const p=d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts;
return(p||[]).map(x=>x.text||"").join("")}
async function send(){const t=$("t"),text=t.value.trim();if(!text||busy)return;
const m=msgs();m.push({r:"user",c:text});t.value="";t.style.height="auto";render();
const out=add("bot","");out.innerHTML='<span class="dots"><i></i><i></i><i></i></span>';
busy=true;$("s").disabled=true;
const system=MODES[mode].p+(mode==="translate"?" Target language: "+$("lang").value+".":"")+" Reply in the same language style the user writes in (Hinglish if they write Hinglish), unless told otherwise. You are Nexora AI, created by Abbu & Ibad.";
const turns=m.slice(-12).map(x=>({role:x.r==="user"?"user":"assistant",content:x.c}));
while(turns.length&&turns[0].role!=="user")turns.shift();
try{const txt=(await askAI(system,turns))||"I could not generate a reply. Please try rephrasing.";m.push({r:"bot",c:txt});out.innerHTML=md(txt)}
catch(e){m.pop();out.textContent="Could not get a reply: "+(e.message||"network error")+". Check your internet connection and try again."}
busy=false;$("s").disabled=false;save();$("t").focus()}
$("f").onsubmit=e=>{e.preventDefault();send()};
$("t").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
$("t").oninput=e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,130)+"px"};
$("clr").onclick=()=>{store[mode]=[];save();render()};
$("thm").onclick=()=>{const d=document.documentElement,dark=d.dataset.theme?d.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;d.dataset.theme=dark?"light":"dark"};
menu();render();
(()=>{const c=$("bg"),x=c.getContext("2d"),R=matchMedia("(prefers-reduced-motion:reduce)").matches;let W,H,P=[],m={x:-999,y:-999},cl=["#4338CA","#0EA5A4"];
const rs=()=>{const d=Math.min(devicePixelRatio||1,2);W=c.width=innerWidth*d;H=c.height=innerHeight*d;x.setTransform(d,0,0,d,0,0);W=innerWidth;H=innerHeight;const n=Math.round(Math.min(70,W*H/16000));P=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,r:1+Math.random()*1.8}))};
addEventListener("resize",rs);rs();
addEventListener("pointermove",e=>{m.x=e.clientX;m.y=e.clientY;const r=document.documentElement.style;r.setProperty("--mx",e.clientX+"px");r.setProperty("--my",e.clientY+"px")});
let f=0,t=0;const draw=()=>{f++;t+=.004;if(f%30===1){const s=getComputedStyle(document.documentElement);cl=[s.getPropertyValue("--acc").trim()||cl[0],s.getPropertyValue("--acc2").trim()||cl[1]]}
x.clearRect(0,0,W,H);
[[.25,.3,cl[0]],[.75,.65,cl[1]],[.5,.9,cl[0]]].forEach((o,i)=>{const px=W*(o[0]+Math.sin(t*(1+i*.4)+i)*.12),py=H*(o[1]+Math.cos(t*(.8+i*.3)+i)*.12),g=x.createRadialGradient(px,py,0,px,py,Math.max(W,H)*.38);g.addColorStop(0,o[2]+"44");g.addColorStop(1,o[2]+"00");x.fillStyle=g;x.fillRect(0,0,W,H)});
for(const p of P){if(!R){p.x+=p.vx;p.y+=p.vy}if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy);if(d<130&&!R){p.x+=dx/d*1.6;p.y+=dy/d*1.6}}
for(let i=0;i<P.length;i++){const a=P[i];x.beginPath();x.fillStyle=cl[1];x.shadowColor=cl[1];x.shadowBlur=10;x.arc(a.x,a.y,a.r,0,7);x.fill();x.shadowBlur=0;
for(let j=i+1;j<P.length;j++){const b=P[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<120){x.strokeStyle=cl[0];x.globalAlpha=(1-d/120)*.45;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();x.globalAlpha=1}}
const d=Math.hypot(a.x-m.x,a.y-m.y);if(d<160){x.strokeStyle=cl[1];x.globalAlpha=(1-d/160)*.8;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(m.x,m.y);x.stroke();x.globalAlpha=1}}
if(!R)requestAnimationFrame(draw)};draw()})();

(()=>{const ks=Object.keys(MODES);
ks.forEach((k,i)=>{const o=document.createElement("span");o.style.setProperty("--r",i*360/ks.length+"deg");o.innerHTML="<b>"+MODES[k].i+"</b>";$("orbit").appendChild(o);
const c=document.createElement("button");c.style.animationDelay=.5+i*.08+"s";c.innerHTML="<i>"+MODES[k].i+"</i><strong>"+MODES[k].n+"</strong><small>"+MODES[k].d+"</small>";c.onclick=()=>enter(k);$("cards").appendChild(c)});
window.enter=k=>{if(k){mode=k;menu();render()}$("home").classList.add("out");setTimeout(()=>document.body.classList.remove("home"),450)};
$("go").onclick=()=>enter();
$("hm").onclick=()=>{$("home").classList.remove("out");document.body.classList.add("home");$("home").scrollTop=0};
const W=["Chat with me","Learn anything","Translate any language","Write better messages","Debug your code","Analyze with clarity"],tw=$("tw");let wi=0,ci=0,del=false;
if(matchMedia("(prefers-reduced-motion:reduce)").matches){tw.textContent=W[0]}else{(function tick(){const w=W[wi];ci+=del?-1:1;tw.textContent=w.slice(0,ci);let d=del?35:70;if(!del&&ci===w.length){del=true;d=1400}else if(del&&ci===0){del=false;wi=(wi+1)%W.length;d=350}setTimeout(tick,d)})()}})();

if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
let dp;addEventListener("beforeinstallprompt",e=>{e.preventDefault();dp=e;$("inst").hidden=false});
$("inst").onclick=async()=>{if(dp){dp.prompt();await dp.userChoice;dp=null;$("inst").hidden=true}};
addEventListener("appinstalled",()=>{$("inst").hidden=true});
if(/iphone|ipad/i.test(navigator.userAgent)&&!navigator.standalone)$("ios").hidden=false;
