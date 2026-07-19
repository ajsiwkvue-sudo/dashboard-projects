/* =========================================================================
 * growth_cycle.js  —  AI Platform Hospital · Growth Cycle
 * -------------------------------------------------------------------------
 * v2 (2026-07-19) : 동심원 SVG → 클릭 확장형 단계 아코디언으로 전환.
 *   - 과도한 모션 제거(정적 기본 + 클릭 시에만 확장)
 *   - 전략과제 목록/진척률을 TASKS 실데이터에서 직접 생성 (하드코딩 없음)
 *   - 단계 클릭 → 확장, "마인드맵" 버튼 → openMindMap(goalId, name)
 *   - 기존 SVG 링은 renderCycleRing() 으로 보존 (복귀 시 renderCycle 내부 1줄 교체)
 * 외부 의존성: 없음. TASKS / taskProgress 가 있으면 실데이터, 없으면 라벨만 표시.
 * =======================================================================*/

// --- GOALS ---
const GOALS = {
  G1:{id:"G1",no:"①",name:"AI 통합 거버넌스 구축",color:"var(--g1)",hex:"#3d5a98",cls:"g1",
    slogan:"AI를 도입하는 병원이 아니라, AI가 스스로 성장하는 병원의 기반을 만든다.",
    body:"AI 기술보다 중요한 것은 AI를 지속적으로 활용·확산시키는 운영체계다. 전략·제도·데이터·정책을 하나의 거버넌스로 통합하여, AI가 일회성 프로젝트가 아닌 병원의 새로운 운영체계로 자리잡도록 한다.",
    kw:["AI Governance","AI Policy","AI Standard","AI Investment","AI Ecosystem"],
    handoff:"거버넌스는 전략 방향·표준·KPI·투자 재원을 정의하여 ② 업무 프로세스가 '무엇을, 어떤 기준으로' 구축할지를 결정한다."},
  G2:{id:"G2",no:"②",name:"AI 기반 업무 프로세스 운영",color:"var(--g2)",hex:"#0e8c86",cls:"g2",
    slogan:"모든 업무를 AI가 이해하고, 모든 직원이 AI를 활용하는 병원을 만든다.",
    body:"AI는 특정 솔루션을 쓰는 것이 아니라 업무 프로세스 자체를 바꾸는 기술이다. 원내 AI 인프라·데이터·Agent Platform 위에서 의료진과 직원이 직접 AI를 만들고 활용하는 업무환경을 구축한다.",
    kw:["AI Platform","AI Agent","AI Ready Data","AI Workflow","AI Testbed"],
    handoff:"업무 프로세스는 실증 데이터·성과·검증 결과를 만들어 ③ 문화 조성의 재료(가치창출·과제·역량)를 공급한다."},
  G3:{id:"G3",no:"③",name:"전 직원 AX 문화 조성",color:"var(--g3)",hex:"#c1791d",cls:"g3",
    slogan:"직원이 AI를 배우는 것이 아니라, AI가 직원의 업무를 배우는 병원.",
    body:"AI 전환은 기술이 아니라 문화의 변화다. 모든 직원이 아이디어를 제안하고, 직접 Agent를 만들고, 성과를 공유하는 선순환 구조를 만들어 AI가 조직의 일하는 방식 자체가 되도록 한다.",
    kw:["AI Culture","AI Talent","AI Community","AI Innovation","AI Value Creation"],
    handoff:"문화는 새 과제·성과·인재를 만들어 ① 거버넌스의 전략을 고도화한다 — 여기서 성장 선순환이 닫힌다."}
};

// --- CYCLE (9단계 라벨/색) · SVG 링 전용 ---
const CYCLE = [
 ["전략 수립","1-1"],["AI 인프라 구축","2-1"],["AI Ready Data 확보","2-2"],["AI Agent 개발","2-3"],
 ["현장 실증","2-4"],["성과 측정 (KPI)","1-3"],["논문·특허·국책사업","3-3"],["AI 문화 확산","3-2"],
 ["새 AI 과제 발굴","3-1"],["전략 고도화","1-1"]
];

/* ── 공용 헬퍼 ─────────────────────────────────────────────── */
function goalOf(code){ const g=String(code||'').split('-')[0]; return (typeof GOALS!=='undefined' && GOALS['G'+g]) || (typeof GOALS!=='undefined'?GOALS.G1:{hex:'#3d5a98'}); }

function _cycTasks(){
  try{ if(typeof TASKS!=='undefined' && TASKS) return TASKS; }catch(e){}
  if(typeof window!=='undefined' && window.TASKS) return window.TASKS;
  return [];
}
function _cycProg(t){
  try{ if(typeof taskProgress==='function') return taskProgress(t); }catch(e){}
  if(typeof window!=='undefined' && window.taskProgress) return window.taskProgress(t);
  return 0;
}
function _cycEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ── 스타일 (1회 주입) ─────────────────────────────────────── */
function _cycStyles(){
  if(document.getElementById('cycStyles')) return;
  const st=document.createElement('style'); st.id='cycStyles';
  st.textContent=`
  .cycle-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px}
  .cycle-hint{font-size:.82rem;color:var(--muted);margin:0 0 16px}
  .cycle-container{display:flex;align-items:flex-start;gap:10px;overflow-x:auto;padding-bottom:4px}
  .cycle-step{flex:1 1 0;min-width:230px;background:var(--bg);border:1px solid var(--border);
    border-left:3px solid var(--cyc-c,#3d5a98);border-radius:12px;padding:14px 16px;cursor:pointer;
    transition:border-color .15s ease, box-shadow .15s ease}
  .cycle-step:hover{border-color:var(--cyc-c,#3d5a98);box-shadow:0 4px 12px rgba(61,90,152,.10)}
  .step-header{display:flex;align-items:center;gap:10px}
  .step-num{width:30px;height:30px;flex-shrink:0;border-radius:50%;background:var(--cyc-c,#3d5a98);color:#fff;
    display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;
    font-variant-numeric:tabular-nums}
  .step-title{font-weight:800;font-size:.93rem;line-height:1.35;flex:1;min-width:0}
  .step-pct{font-weight:800;font-size:.9rem;color:var(--cyc-c,#3d5a98);font-variant-numeric:tabular-nums;flex-shrink:0}
  .step-caret{color:var(--muted);font-size:.7rem;flex-shrink:0;transition:transform .2s ease}
  .cycle-step.expanded .step-caret{transform:rotate(90deg)}
  .step-bar{height:5px;border-radius:3px;background:var(--track,#e6eaef);overflow:hidden;margin-top:10px}
  .step-bar i{display:block;height:100%;border-radius:3px;background:var(--cyc-c,#3d5a98)}
  .step-details{display:grid;gap:7px;max-height:0;overflow:hidden;opacity:0;
    transition:max-height .28s ease, opacity .28s ease, margin-top .28s ease}
  .cycle-step.expanded .step-details{max-height:640px;opacity:1;margin-top:14px}
  .step-slogan{font-size:.8rem;color:var(--muted);line-height:1.55;padding-bottom:2px}
  .cyc-t{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;
    background:var(--card,#fff);border:1px solid var(--border);font-size:.83rem;transition:background .15s}
  .cyc-t:hover{background:rgba(61,90,152,.07)}
  .cyc-t .cyc-tid{font-weight:800;font-size:.75rem;color:var(--cyc-c,#3d5a98);min-width:26px;flex-shrink:0;
    font-variant-numeric:tabular-nums}
  .cyc-t .cyc-tn{flex:1;min-width:0;font-weight:600;line-height:1.4}
  .cyc-t .cyc-tp{font-weight:800;font-size:.78rem;color:var(--muted);flex-shrink:0;font-variant-numeric:tabular-nums}
  .cyc-mm{margin-top:2px;padding:7px 10px;border:1px dashed var(--border);border-radius:8px;background:transparent;
    color:var(--muted);font-family:inherit;font-size:.79rem;font-weight:700;cursor:pointer;transition:.15s}
  .cyc-mm:hover{border-color:var(--cyc-c,#3d5a98);color:var(--cyc-c,#3d5a98)}
  .cycle-arrow{margin-top:22px;color:var(--muted);font-size:1.05rem;flex-shrink:0;user-select:none}
  .cycle-loop{margin-top:12px;font-size:.79rem;color:var(--muted);display:flex;align-items:center;gap:7px}
  @media(max-width:820px){
    .cycle-container{flex-direction:column}
    .cycle-step{width:100%;min-width:0}
    .cycle-arrow{margin:0 auto;transform:rotate(90deg)}
  }

  /* ── 모션 완화 오버라이드 (index.html 원본 규칙 이후에 주입되므로 적용됨) ── */
  .mm-center{animation:none!important;box-shadow:0 10px 30px rgba(61,90,152,.4)!important}
  .mm-node{transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease!important}
  .mm-node:hover{transform:translateY(-2px)!important;border-color:var(--primary)!important;box-shadow:0 8px 24px rgba(61,90,152,.15)!important}
  .kl-item.click:hover{background:rgba(61,90,152,.10)!important;transform:none!important}
  .dept-task:hover{background:rgba(61,90,152,.09)!important;transform:none!important}
  #axGrowthCard .cyc-center{animation:none!important}
  #axGrowthCard .cyc-arc{animation:none!important}
  #axGrowthCard .cyc-node{animation:none!important}
  #axGrowthCard .cyc-node:hover{transform:scale(1.04)!important}
  @media(prefers-reduced-motion:reduce){
    .mm-node:hover,.kl-item.click:hover,.dept-task:hover,#axGrowthCard .cyc-node:hover{transform:none!important}
    .cycle-step .step-details{transition:none!important}
  }`;
  document.head.appendChild(st);
}

/* ── 렌더: 단계 아코디언 ───────────────────────────────────── */
function renderCycle(root){
  _cycStyles();
  const tasks=_cycTasks();
  const order=['G1','G2','G3'];

  const steps=order.map((gk,idx)=>{
    const g=GOALS[gk];
    const gid=idx+1;
    const mine=tasks.filter(t=>String(t.goal)===String(gid));
    const pct=mine.length?Math.round(mine.reduce((s,t)=>s+_cycProg(t),0)/mine.length):0;
    const items=mine.length
      ? mine.map(t=>`<div class="cyc-t" onclick="event.stopPropagation();window.openTask&&window.openTask('${_cycEsc(t.id)}')">
            <span class="cyc-tid">${_cycEsc(t.id)}</span>
            <span class="cyc-tn">${_cycEsc(t.title)}</span>
            <span class="cyc-tp">${_cycProg(t)}%</span>
          </div>`).join('')
      : `<div class="step-slogan">등록된 전략과제가 없습니다.</div>`;
    return `
    <div class="cycle-step" style="--cyc-c:${g.hex}" onclick="this.classList.toggle('expanded')">
      <div class="step-header">
        <div class="step-num">${gid}</div>
        <div class="step-title">${_cycEsc(g.name)}</div>
        <div class="step-pct">${pct}%</div>
        <div class="step-caret">▶</div>
      </div>
      <div class="step-bar"><i style="width:${pct}%"></i></div>
      <div class="step-details">
        <div class="step-slogan">${_cycEsc(g.slogan)}</div>
        ${items}
        <button class="cyc-mm" onclick="event.stopPropagation();window.openMindMap&&window.openMindMap(${gid},'${_cycEsc(g.name)}')">🗺 목표 ${gid} 마인드맵 열기</button>
      </div>
    </div>`;
  });

  root.innerHTML=`
    <div class="cycle-head"><h3 style="margin:0">🔄 AI Platform Hospital — Growth Cycle</h3></div>
    <p class="cycle-hint">3대 핵심목표는 독립된 사업이 아니라 하나의 성장 선순환입니다. 앞 단계의 산출물이 다음 단계의 입력이 됩니다. <b>단계를 클릭하면 세부 전략과제가 펼쳐집니다.</b></p>
    <div class="cycle-container">
      ${steps[0]}<div class="cycle-arrow">➔</div>${steps[1]}<div class="cycle-arrow">➔</div>${steps[2]}
    </div>
    <div class="cycle-loop">↻ <span>③ 문화가 만든 새 과제·성과·인재가 다시 ① 거버넌스의 전략을 고도화하며 순환이 닫힙니다.</span></div>`;
}

/* =========================================================================
   (보존) 기존 동심원 SVG 링 — 복귀하려면 renderCycle 대신 renderCycleRing 호출
   ========================================================================= */
function renderCycleRing(root){
  root.innerHTML=`
   <div class="eyebrow">Narrative · 01 / 전체 연결 구조</div>
   <h2>AI Platform Hospital — Growth Cycle</h2>
   <div class="cyc-grid"><div id="ring" class="cyc-ring"></div><div class="cyc-side"><p class="lede">3대 핵심목표는 독립된 사업이 아니라, 하나의 성장 선순환으로 연결됩니다. 각 과제의 산출물이 다음 단계의 입력이 되어, 병원이 스스로 진화하는 <b>Self-Evolving AI Hospital</b>을 구현합니다. 노드를 클릭하면 해당 과제로 이동합니다.</p>
   <div class="handoff"><div class="label">왜 순환인가</div>
     <p>전략 수립(1-1)에서 시작해 인프라·데이터·Agent·실증을 거쳐 성과(KPI·논문·특허)를 만들고, 그 성과가 다시 문화 확산과 새 과제 발굴로 이어져 전략을 고도화합니다. 일회성 도입이 아니라 "쓸수록 똑똑해지는" 운영체계라는 점이 일산병원 AX의 핵심 차별점입니다.</p></div></div></div>`;
  drawRing(root.querySelector('#ring'));
}
function drawRing(container){
  const ns="http://www.w3.org/2000/svg";
  const S=900,cx=S/2,cy=S/2,R=250,NR=30,LR=R+56;
  const stages=CYCLE.slice(0,9);
  const N=stages.length, step=360/N;
  const ang=i=>(-90+i*step)*Math.PI/180;
  const svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox",`0 0 ${S} ${S}`);svg.setAttribute("width","100%");
  svg.style.maxWidth="370px"; svg.style.fontFamily="'Noto Sans KR',sans-serif";
  const defs=document.createElementNS(ns,"defs");
  defs.innerHTML=`<marker id="cyc-ah" markerWidth="10" markerHeight="10" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#0b6e6b"/></marker>`;
  svg.appendChild(defs);
  const base=document.createElementNS(ns,"circle");
  base.setAttribute("cx",cx);base.setAttribute("cy",cy);base.setAttribute("r",R);
  base.setAttribute("fill","none");base.setAttribute("stroke","#cfe0dd");base.setAttribute("stroke-width","2");
  svg.appendChild(base);
  for(let i=0;i<N;i++){
    const pad=NR/R+0.055;
    const s1=ang(i)+pad, s2=ang((i+1)%N)-pad;
    const x1=cx+R*Math.cos(s1), y1=cy+R*Math.sin(s1);
    const x2=cx+R*Math.cos(s2), y2=cy+R*Math.sin(s2);
    const p=document.createElementNS(ns,"path");
    p.setAttribute("d",`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`);
    p.setAttribute("fill","none");p.setAttribute("stroke","#0b6e6b");
    p.setAttribute("stroke-width","2.5");p.setAttribute("marker-end","url(#cyc-ah)");
    p.setAttribute("opacity",".72");p.classList.add('cyc-arc');
    if(i===N-1)p.setAttribute("stroke-dasharray","8 6");
    svg.appendChild(p);
  }
  const mA=(-90+(N-0.5)*step)*Math.PI/180;
  addText(svg,ns,cx+LR*Math.cos(mA),cy+LR*Math.sin(mA)+6,"↻",{size:31,fill:"#0b6e6b",weight:"700"});
  const c1=document.createElementNS(ns,"circle");
  c1.setAttribute("cx",cx);c1.setAttribute("cy",cy);c1.setAttribute("r",124);c1.setAttribute("fill","#12263a");c1.classList.add('cyc-center');
  svg.appendChild(c1);
  addText(svg,ns,cx,cy-8,"∞",{size:80,fill:"#15b3a6",weight:"700",mono:true});
  addText(svg,ns,cx,cy+36,"SELF-EVOLVING",{size:22,fill:"#cdd8e2",mono:true,ls:".14em"});
  addText(svg,ns,cx,cy+64,"AI Hospital",{size:18,fill:"#8ea0b2"});
  stages.forEach((c,i)=>{
    const a=ang(i), x=cx+R*Math.cos(a), y=cy+R*Math.sin(a), g=goalOf(c[1]);
    const grp=document.createElementNS(ns,"g");grp.style.cursor="pointer";grp.classList.add('cyc-node');grp.style.animationDelay=(i*0.07)+'s';
    grp.onclick=()=>{cycOpenNode(c[1]);};
    const dot=document.createElementNS(ns,"circle");
    dot.setAttribute("cx",x);dot.setAttribute("cy",y);dot.setAttribute("r",NR);
    dot.setAttribute("fill","#fff");dot.setAttribute("stroke",g.hex);dot.setAttribute("stroke-width","5");
    grp.appendChild(dot);
    addText(grp,ns,x,y+10,String(i+1),{size:29,fill:g.hex,weight:"700",mono:true});
    svg.appendChild(grp);
    const ux=Math.cos(a), uy=Math.sin(a);const LRi=LR+(/KPI/.test(c[0])?16:0);const lx=cx+LRi*ux, ly=cy+LRi*uy;
    const anchor=ux>0.25?"start":(ux<-0.25?"end":"middle");
    const lines=wrapLabel(c[0]);
    const lh=29;
    let ty;if(anchor==="middle"&&uy<0){ty=ly-lines.length*lh+1;}else if(anchor==="middle"&&uy>0){ty=ly;}
    else{ty=ly-(lines.length*lh+16)/2+lh-4;}
    lines.forEach(ln=>{addText(svg,ns,lx,ty,ln,{size:25,fill:"#26384a",weight:"650",anchor});ty+=lh;});
    addText(svg,ns,lx,ty-1,c[1],{size:17,fill:g.hex,weight:"700",mono:true,anchor});
  });
  container.appendChild(svg);
}
function addText(parent,ns,x,y,txt,o){o=o||{};
  const t=document.createElementNS(ns,"text");
  t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("text-anchor",o.anchor||"middle");
  t.setAttribute("font-size",o.size||14);t.setAttribute("fill",o.fill||"#26384a");
  if(o.weight)t.setAttribute("font-weight",o.weight);
  if(o.mono)t.setAttribute("font-family","ui-monospace,SFMono-Regular,Menlo,monospace");
  if(o.ls)t.setAttribute("letter-spacing",o.ls);
  t.textContent=txt;parent.appendChild(t);return t;
}
function wrapLabel(s){
  if(s.length<=7)return [s];
  const mid=s.length/2;let best=-1,bd=99;
  for(let i=0;i<s.length;i++){if(s[i]===' '){const d=Math.abs(i-mid);if(d<bd){bd=d;best=i;}}}
  if(best<0){for(let i=1;i<s.length-1;i++){if(s[i]==='·'){const d=Math.abs(i-mid);if(d<bd){bd=d;best=i;}}}}
  if(best<0){return [s.slice(0,Math.round(mid)),s.slice(Math.round(mid))];}
  const skip=(s[best]===' '||s[best]==='·');
  return [s.slice(0,best).trim(), s.slice(best+(skip?1:0)).trim()];
}
function cycOpenNode(code){
  try{
    var goalId=parseInt(String(code).split("-")[0],10);
    var goalName=(typeof GOALS!=="undefined"&&GOALS["G"+goalId])?GOALS["G"+goalId].name:"";
    if(window.openMindMap) return window.openMindMap(goalId, goalName);
    if(window.openTask) return window.openTask(code);
  }catch(e){ console.warn("[cycle] node click:", e&&e.message); }
}

if(typeof window!=='undefined'){ window.renderCycle = renderCycle; window.renderCycleRing = renderCycleRing; }

/* ── 진척률 갱신 훅 ───────────────────────────────────────────
   개요는 일정(schedCache) 로딩 전에 먼저 렌더되므로, 최초 렌더 시점엔
   진척률이 0으로 나온다. renderOverview 가 다시 불릴 때(로딩 완료·실시간
   반영) 사이클 카드도 같이 다시 그려 주고, 펼침 상태는 유지한다. */
function _cycHookRefresh(tries){
  if(typeof window==='undefined') return;
  const orig=window.renderOverview;
  if(typeof orig!=='function'){
    if((tries||0)<40) setTimeout(()=>_cycHookRefresh((tries||0)+1),300);
    return;
  }
  if(orig.__cycHooked) return;
  const w=function(){
    const r=orig.apply(this,arguments);
    try{
      const card=document.getElementById('axGrowthCard');
      if(card && card.querySelector('.cycle-step')){
        const open=[...card.querySelectorAll('.cycle-step')].map(s=>s.classList.contains('expanded'));
        renderCycle(card);
        card.querySelectorAll('.cycle-step').forEach((s,i)=>{ if(open[i]) s.classList.add('expanded'); });
      }
    }catch(e){ console.warn('[cycle] refresh:', e&&e.message); }
    return r;
  };
  w.__cycHooked=true;
  window.renderOverview=w;
}
_cycHookRefresh(0);

/* 초기 경합 보정 — 훅이 설치되기 전에 renderOverview 가 이미 끝났을 수 있다.
   일정 데이터(schedCache)가 도착하면 카드만 한 번 다시 그린다(차트 재렌더 없음). */
(function(){
  var n=0;
  var t=setInterval(function(){
    if(++n>20){ clearInterval(t); return; }
    var ready=false;
    try{ ready=Object.keys(schedCache||{}).length>0; }catch(e){}
    if(!ready) return;
    var card=document.getElementById('axGrowthCard');
    if(!card||!card.querySelector('.cycle-step')) return;
    var open=[].slice.call(card.querySelectorAll('.cycle-step')).map(function(s){return s.classList.contains('expanded');});
    renderCycle(card);
    card.querySelectorAll('.cycle-step').forEach(function(s,i){ if(open[i]) s.classList.add('expanded'); });
    clearInterval(t);
  },500);
})();
