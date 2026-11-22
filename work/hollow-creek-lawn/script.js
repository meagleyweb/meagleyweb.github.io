const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3200)}
$$('[data-demo]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();toast(b.dataset.demo)}));

/* ---------- mowing animation ---------- */
if(document.querySelector('#stripes')){
const ROWS=7,TOP=62,H=(510-TOP)/ROWS,W=500;
const sg=$('#stripes');
for(let i=0;i<ROWS;i++)sg.insertAdjacentHTML('beforeend',`<rect x="0" y="${TOP+i*H}" width="0" height="${H+0.5}" fill="${i%2?'#5cb052':'#3f8a3c'}" data-r="${i}"/>`);
const rects=$$('#stripes rect'),mower=$('#mower');
if(reduce){rects.forEach(r=>r.setAttribute('width',W));mower.style.display='none'}
else{
  const per=1700,total=per*ROWS+1400;let t0=null;
  const tick=ts=>{t0??=ts;const t=(ts-t0)%total;
    const row=Math.min(ROWS-1,Math.floor(t/per)),p=Math.min(1,(t-row*per)/per);
    if(t>per*ROWS){mower.setAttribute('transform','translate(-80 -80)');rects.forEach(r=>{r.setAttribute('width',W);r.removeAttribute('x');r.setAttribute('x',0)});requestAnimationFrame(tick);return}
    rects.forEach((r,i)=>{if(i<row){r.setAttribute('x',0);r.setAttribute('width',W)}else if(i>row){r.setAttribute('width',0)}else{const w=(W+60)*p;if(i%2===0){r.setAttribute('x',0);r.setAttribute('width',Math.min(W,w))}else{r.setAttribute('x',Math.max(0,W-w));r.setAttribute('width',Math.min(W,w))}}});
    const y=TOP+row*H+H/2,x=row%2===0?-30+(W+60)*p:W+30-(W+60)*p;
    mower.setAttribute('transform',`translate(${x} ${y})${row%2?' rotate(180)':''}`);
    requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
}

}
/* ---------- schedule helpers ---------- */
const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const full=d=>{const k=d.getDate()*7+d.getMonth()*3;return d.getDay()===0||k%5===0};
const days=[];{const d=new Date();d.setHours(0,0,0,0);while(days.length<14){d.setDate(d.getDate()+1);days.push(new Date(d))}}
const firstOpen=days.find(d=>!full(d));
if($('#nextOpen'))$('#nextOpen').textContent=DN[firstOpen.getDay()]+', '+MN[firstOpen.getMonth()].slice(0,3)+' '+firstOpen.getDate();

/* ---------- area ---------- */
if(document.querySelector('#areaForm')){
const TOWNS={'hometown':'Mondays & Thursdays','maple ridge':'Tuesdays','cedar flats':'Wednesdays','willow bend':'Thursdays','stone creek':'Fridays','pine hollow':'Tuesdays & Fridays'};
$('#towns').innerHTML=Object.keys(TOWNS).map(t=>`<option value="${t.replace(/\b\w/g,c=>c.toUpperCase())}">`).join('');
$('#areaForm').onsubmit=e=>{e.preventDefault();const v=$('#areaIn').value.trim().toLowerCase(),r=$('#areaRes');if(!v)return;
  r.className='res show '+(TOWNS[v]?'yes':'no');
  r.innerHTML=TOWNS[v]?`✓ Yes! We're in ${v.replace(/\b\w/g,c=>c.toUpperCase())} on ${TOWNS[v]}. <a href="contact.html" style="text-decoration:underline">Get a free quote →</a>`:`We're not in that area yet, but text us your address and we'll see what we can do.`};

}
/* ---------- before/after ---------- */
if(document.querySelector('#ba')){
const ba=$('#ba'),after=ba.querySelector('.after'),handle=$('#handle'),range=$('#baRange');
const setBA=p=>{after.style.clipPath=`inset(0 0 0 ${p}%)`;handle.style.left=p+'%'};
range.oninput=()=>setBA(range.value);
new IntersectionObserver((es,o)=>{if(!es[0].isIntersecting||reduce)return;o.disconnect();let t=0;const a=()=>{t+=.012;const p=50+Math.sin(t*6)*28*(1-t);setBA(p);range.value=p;if(t<1)requestAnimationFrame(a)};a()},{threshold:.5}).observe(ba);

}
/* ---------- seasons ---------- */
if(document.querySelector('#months')){
const PLAN=[
 ['Winter',[['🌳','Tree & shrub pruning','Dormant season is the best time to shape.'],['🧹','Winter cleanup','Limbs and debris cleared after storms.']]],
 ['Winter',[['🌾','Pre-emergent, step 1','Stops crabgrass before it starts.'],['🛠️','Equipment tune-up','Sharp blades mean a cleaner cut all year.']]],
 ['Spring',[['🧹','Spring cleanup','Beds cleared, last leaves hauled.'],['🌱','First mow of the year','Weekly service starts back up.']]],
 ['Spring',[['🟫','Fresh mulch','Spade-cut edges and new mulch in every bed.'],['🌾','Weed & feed, step 2','Green-up fertilizer and broadleaf control.']]],
 ['Spring',[['✂️','Hedge trimming','First shaping of the season.'],['🌼','Spring flowers','Seasonal color in front beds.']]],
 ['Summer',[['🌱','Weekly mowing','Mowed tall to protect from heat.'],['🌾','Weed & feed, step 3','Summer-safe feeding and spot weed control.']]],
 ['Summer',[['💧','Watering check','We flag dry spots and sprinkler problems.'],['🐛','Grub control','Stops grubs before they kill patches of lawn.']]],
 ['Summer',[['🌱','Weekly mowing','Same day every week, edges every visit.'],['✂️','Second hedge trim','Keep shrubs tight through fall.']]],
 ['Fall',[['🕳️','Core aeration','Opens the soil for air, water and seed.'],['🌾','Overseeding','Thickens thin spots before winter.']]],
 ['Fall',[['🍂','Leaf cleanup, round 1','Lawns cleared so the grass can breathe.'],['🌾','Weed & feed, step 5','Fall feeding for strong roots.']]],
 ['Fall',[['🍂','Leaf cleanup, round 2','Beds and gutters cleared of the last leaves.'],['🌱','Final mow','Cut a little shorter going into winter.']]],
 ['Winter',[['🌾','Winterizer, step 6','Last feeding of the year for a fast spring green-up.'],['🎄','Holiday lights','Ask about installing lights on shrubs and trees.']]]];
const cm=new Date().getMonth();
$('#months').innerHTML=MN.map((m,i)=>`<button class="mo${i===cm?' now on':''}" data-m="${i}">${m.slice(0,3)}<span class="bar"></span></button>`).join('');
function showMonth(i){$$('.mo').forEach(x=>x.classList.toggle('on',+x.dataset.m===i));$('#mSea').textContent=PLAN[i][0];$('#mName').textContent=MN[i];
  $('#mTasks').innerHTML=PLAN[i][1].map((t,j)=>`<li style="animation-delay:${j*80}ms"><span class="k">${t[0]}</span><div><b>${t[1]}</b><small>${t[2]}</small></div></li>`).join('')}
$('#months').onclick=e=>{const b=e.target.closest('.mo');if(b)showMonth(+b.dataset.m)};
showMonth(cm);

}
/* ---------- cta blades ---------- */
if(document.querySelector('#bladePath')){
let bp='M0 60';for(let x=0;x<=1200;x+=12){bp+=`L${x} ${30+Math.sin(x*.7)*14+Math.random()*10}L${x+6} 60`}
$('#bladePath').setAttribute('d',bp+'L1200 60Z');

}
/* ---------- scroll ---------- */
const nav=$('#nav'),mbar=$('#mbar');
addEventListener('scroll',()=>{nav.classList.toggle('solid',scrollY>20);mbar.classList.toggle('show',scrollY>600)},{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));

/* ---------- quote request form ---------- */
const qf=$('#quoteForm');
if(qf)qf.addEventListener('submit',e=>{e.preventDefault();toast('Sample site: on a real site, this request would be emailed to the business 🌱');qf.reset()});
