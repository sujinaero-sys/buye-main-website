const r=document.documentElement,th=document.getElementById('th');
th.onclick=()=>{const d=(r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark'?'light':'dark';r.dataset.theme=d;try{localStorage.setItem('buye-theme',d)}catch(e){}};
const ENDPOINT=(window.BUYE_CONFIG||{}).ENDPOINT||'';
const WA=(window.BUYE_CONFIG||{}).WHATSAPP||'919995863184',f=document.getElementById('f'),m=document.getElementById('msg');
function build(d){return 'Hello BUYE-Online, I would like to make an enquiry.\nName: '+d.name+'\nEmail: '+d.email+(d.phone?'\nPhone: '+d.phone:'')+'\nDivision: '+d.division+'\nMessage: '+d.message}
function links(d){const t=build(d);return {wa:'https://wa.me/'+WA+'?text='+encodeURIComponent(t),mail:'mailto:info@buye.online?subject='+encodeURIComponent('Enquiry: '+d.division)+'&body='+encodeURIComponent(t)}}
f.onsubmit=async e=>{e.preventDefault();let ok=true;
f.querySelectorAll('.err').forEach(s=>{const p=s.previousElementSibling,inp=p.matches('input,textarea')?p:p.querySelector('input,textarea');if(!inp)return;
const bad=!inp.checkValidity()||(inp.type!=='checkbox'&&!inp.value.trim());s.textContent=bad?(inp.type==='email'?'Enter a valid email address.':inp.type==='checkbox'?'Consent is required to send.':'This field is required.'):'';if(bad)ok=false});
if(!ok)return;const fd=new FormData(f);if(fd.get('website'))return;
const d=Object.fromEntries(fd),l=links(d);m.style.display='block';
const fallback='Your details are ready to send: <a href="'+l.wa+'" target="_blank" rel="noopener">send on WhatsApp</a> or <a href="'+l.mail+'">send by email</a>.';
if(!ENDPOINT){m.innerHTML='The enquiry database is not connected yet, so this form has not saved anything. '+fallback;return}
try{await fetch(ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(d)});m.textContent='Thank you. Your enquiry has been sent and the team will reply soon.';f.reset()}catch(x){m.innerHTML='We could not send your enquiry. '+fallback}};

(function(){const els=document.querySelectorAll('.card,.row,.steps li,details,form,.fb');els.forEach(e=>e.classList.add('rv'));
if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.12});els.forEach(e=>io.observe(e))})();
