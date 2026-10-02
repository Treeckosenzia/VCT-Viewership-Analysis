const regions=[...new Set(teams.map(t=>t.r))];
let activeRegion=regions[0];
const regionsEl=document.getElementById('regions');
const rosterEl=document.getElementById('roster');
document.getElementById('teamCount').textContent=teams.length+' teams';

regions.forEach(r=>{
  const p=document.createElement('div');
  p.className='region-pill'+(r===activeRegion?' active':'');
  p.textContent=r;
  p.addEventListener('click', ()=>{ activeRegion=r; renderRoster(); [...regionsEl.children].forEach(c=>c.classList.toggle('active',c.textContent===r)); });
  regionsEl.appendChild(p);
});

function renderRoster(){
  rosterEl.innerHTML='';
  teams.filter(t=>t.r===activeRegion).forEach(t=>{
    const row=document.createElement('div');
    row.className='team-row'; row.draggable=true;
    row.appendChild(logoEl(t,false));
    const span=document.createElement('span'); span.className='tname'; span.textContent=t.n;
    row.appendChild(span);
    row.addEventListener('dragstart', e=>{ row.classList.add('dragging'); e.dataTransfer.setData('text/plain', JSON.stringify(t)); });
    row.addEventListener('dragend', ()=> row.classList.remove('dragging'));
    row.addEventListener('click', ()=> pickIntoOpenSlot(t));
    rosterEl.appendChild(row);
  });
}
renderRoster();

const evSel=document.getElementById('event');
events.forEach((e,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=e.name; evSel.appendChild(o); });

let picked={A:null,B:null};
const slots={A:document.getElementById('slotA'), B:document.getElementById('slotB')};

function renderSlot(key){
  const el=slots[key], t=picked[key];
  el.innerHTML='';
  if(!t){ el.innerHTML=`<div class="placeholder">drag team ${key}</div>`; return; }
  el.appendChild(logoEl(t,true));
  const nm=document.createElement('div'); nm.className='picked-name'; nm.textContent=t.n;
  const rg=document.createElement('div'); rg.className='region'; rg.textContent=t.r;
  el.appendChild(nm); el.appendChild(rg);
}
function pickIntoOpenSlot(t){
  if(!picked.A){picked.A=t;} else if(!picked.B){picked.B=t;} else {picked.A=t; picked.B=null;}
  renderSlot('A'); renderSlot('B'); compute();
}
Object.entries(slots).forEach(([key,el])=>{
  el.addEventListener('dragover', e=>{e.preventDefault(); el.classList.add('over');});
  el.addEventListener('dragleave', ()=>el.classList.remove('over'));
  el.addEventListener('drop', e=>{
    e.preventDefault(); el.classList.remove('over');
    try{ picked[key]=JSON.parse(e.dataTransfer.getData('text/plain')); renderSlot(key); compute(); }catch(err){}
  });
});
document.getElementById('marquee').addEventListener('change', compute);
evSel.addEventListener('change', compute);

function fmt(n){ return Math.round(n).toLocaleString('en-US'); }

function compute(){
  const result=document.getElementById('result');
  if(!picked.A||!picked.B){ result.innerHTML='<div class="empty">Pick two teams and an event above.</div>'; return; }
  const ev=events[evSel.value];
  const marquee=document.getElementById('marquee').checked;
  const teamFactor=(picked.A.p+picked.B.p)/2;
  const sameRegion=picked.A.r===picked.B.r;
  const matchupBonus=ev.intl?(sameRegion?1.0:1.1):(sameRegion?1.05:1.0);
  const avg=ev.avg*teamFactor*matchupBonus*(marquee?1.5:1.0);
  const peak=avg*ev.peakR*(marquee?1.15:1.0);
  result.innerHTML=`
    <div class="matchup-line">${picked.A.n} vs ${picked.B.n} \u2014 ${ev.name}${marquee?' \u00b7 marquee':''}</div>
    <div class="row">
      <div class="metric"><div class="num">${fmt(avg)}</div><div class="lbl">avg viewers</div></div>
      <div class="metric"><div class="num">${fmt(peak)}</div><div class="lbl">peak viewers</div></div>
    </div>`;
}
