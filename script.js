const FEED_LOCAL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';
const factList = ["A day on Venus is longer than a year on Venus.","Light from the Sun takes about 8 minutes to reach Earth."];

function pickFact(){ const el=document.getElementById("factBox"); if(el) el.textContent="Did you know? "+factList[Math.floor(Math.random()*factList.length)]; }
function isoToday(){return new Date().toISOString().slice(0,10);}
function daysBefore(days){const d=new Date();d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);}

async function fetchAPODRange(start,end){
  try{
    const r=await fetch(FEED_LOCAL);
    if(!r.ok) throw new Error(r.status+" "+r.statusText);
    // 使用 text() 来预处理 BOM 或异常字符，再 parse
    let text = await r.text();
    // 去掉 UTF-8 BOM
    text = text.replace(/^\uFEFF/, '');
    const data = JSON.parse(text);
    const s=new Date(start), e=new Date(end);
    return data.filter(it=>{
      // 规范化 date 字符串：去掉前后单引号，移除非数字和连字符字符，取前 10 个字符 yyyy-mm-dd
      let ds = (it.date||'').toString().trim().replace(/^'+|'+$/g,'');
      ds = ds.replace(/[^0-9-]/g,'').slice(0,10);
      const d=new Date(ds);
      if(isNaN(d)) return false;
      return d>=s && d<=e;
    }).sort((a,b)=>b.date.localeCompare(a.date));
  }catch(err){
    const g=document.getElementById("gallery"); if(g) g.innerHTML='<p style="color:crimson">Error fetching feed: '+err.message+'</p>'; return [];
  }
}

function createThumb(item){
  const div=document.createElement("div"); div.className="gallery-item";
  const media=document.createElement("div");
  if(item.media_type==="image"){ const img=document.createElement("img"); img.src=item.hdurl||item.url; img.alt=item.title||""; media.appendChild(img); } else { const p=document.createElement("p"); p.textContent="(media not previewable)"; media.appendChild(p); }
  const t=document.createElement("p"); t.className="thumb-title"; t.textContent=item.title||"";
  const d=document.createElement("p"); d.className="thumb-date"; d.textContent=item.date||"";
  div.appendChild(media); div.appendChild(t); div.appendChild(d); div.addEventListener("click",()=>openModal(item));
  return div;
}

function openModal(item){
  const modal=document.getElementById("modal"); if(modal) modal.setAttribute("aria-hidden","false");
  const mt=document.getElementById("modalTitle"); if(mt) mt.textContent=item.title||"";
  const md=document.getElementById("modalDate"); if(md) md.textContent=item.date||"";
  const me=document.getElementById("modalExplanation"); if(me) me.textContent=item.explanation||"";
  const mediaEl=document.getElementById("modalMedia"); if(mediaEl){ mediaEl.innerHTML=""; if(item.media_type==="image"){ const img=document.createElement("img"); img.src=item.hdurl||item.url; img.alt=item.title||""; mediaEl.appendChild(img); } else { const p=document.createElement("p"); p.textContent="(media not previewable)"; mediaEl.appendChild(p); } }
}

function closeModal(){ const modal=document.getElementById("modal"); if(modal) modal.setAttribute("aria-hidden","true"); const me=document.getElementById("modalMedia"); if(me) me.innerHTML=""; }

document.addEventListener("DOMContentLoaded",()=>{
  pickFact();
  const si=document.getElementById("startDate"), ei=document.getElementById("endDate");
  if(ei) ei.value=isoToday(); if(si) si.value=daysBefore(6);
  const btn=document.getElementById("fetchBtn"); if(btn) btn.addEventListener("click",async()=>{
    const s=si?si.value:isoToday(), e=ei?ei.value:isoToday();
    const g=document.getElementById("gallery"); if(g) g.innerHTML="<p>Loading...</p>";
    const items=await fetchAPODRange(s,e);
    if(!items||items.length===0){ if(g) g.innerHTML='<p style="color:crimson">No APOD entries found for this range.</p>'; return; }
    if(g) g.innerHTML=""; items.forEach(it=>g.appendChild(createThumb(it)));
  });
  const mc=document.getElementById("modalClose"); if(mc) mc.addEventListener("click",closeModal);
  const modal=document.getElementById("modal"); if(modal) modal.addEventListener("click",(e)=>{ if(e.target.id==="modal") closeModal(); });
  if(btn) btn.click();
});