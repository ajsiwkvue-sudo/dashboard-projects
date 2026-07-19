
/* ── 인트로 안전장치 ────────────────────────────────────────────
   IntersectionObserver 는 백그라운드 탭에서 콜백을 전달하지 않는다(문서가 렌더되지 않음).
   그 상태로 남으면 노드/궤도가 opacity:0 인 채 빈 링만 보인다.
   ① 탭이 다시 보이면 재확인 ② 주기적 재확인 ③ 30초 뒤에는 조건 없이 표시. */
(function(){
  function arm(force){
    document.querySelectorAll('#axGrowthCard .cyc-svg:not(.play)').forEach(function(s){
      if(force){ s.classList.add('play'); return; }
      const st=s.parentElement; if(!st || st.offsetParent===null) return;
      const r=st.getBoundingClientRect();
      if(r.height>0 && r.top<window.innerHeight && r.bottom>0) s.classList.add('play');
    });
  }
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='visible') setTimeout(function(){arm(false);},120);
  });
  const t=setInterval(function(){ if(document.visibilityState==='visible') arm(false); },700);
  setTimeout(function(){ clearInterval(t); arm(true); },30000);
})();
/* =========================================================================
 * growth_cycle.js — AI Platform Hospital · Growth Cycle
 * -------------------------------------------------------------------------
 * v4 (2026-07-19)
 *   · 전략과제 12개를 모두 링에 배치 (라벨 = 실제 과제명 축약, 코드 = 실제 id)
 *   · 노드 클릭 → 오버레이 없이 같은 블록 오른쪽 패널만 교체
 *   · 인트로 애니메이션은 화면에 보일 때 1회만 (IntersectionObserver)
 *   · 클릭 시 SVG 재생성 없음 → 리플로우/깜빡임 없음
 * =======================================================================*/

const GOALS = {
  G1:{id:"G1",no:"①",name:"AI 통합 거버넌스 구축",hex:"#3d5a98",
    slogan:"AI를 도입하는 병원이 아니라, AI가 스스로 성장하는 병원의 기반을 만든다."},
  G2:{id:"G2",no:"②",name:"AI 기반 업무 프로세스 운영",hex:"#0e8c86",
    slogan:"모든 업무를 AI가 이해하고, 모든 직원이 AI를 활용하는 병원을 만든다."},
  G3:{id:"G3",no:"③",name:"전 직원 AX 문화 조성",hex:"#c1791d",
    slogan:"직원이 AI를 배우는 것이 아니라, AI가 직원의 업무를 배우는 병원."}
};

/* 12단계 — [축약 라벨, 실제 과제 id]. 순서는 성장 선순환 서사.
   1-1 전략 → 1-2 표준 → 2-1 인프라 → 2-2 데이터 → 2-3 에이전트 → 2-4 테스트베드
   → 1-3 성과측정 → 3-3 가치창출 → 3-2 인재 → 3-4 보상 → 3-1 과제발굴 → 1-4 국책사업 ↻ */
const CYCLE = [
 ["전략 수립","1-1"],   ["표준·윤리","1-2"],   ["AI 인프라","2-1"],
 ["데이터 확보","2-2"], ["AI 에이전트","2-3"], ["테스트베드","2-4"],
 ["성과 측정","1-3"],   ["가치창출","3-3"],    ["인재 양성","3-2"],
 ["성과 보상","3-4"],   ["과제 발굴","3-1"],   ["국책사업","1-4"]
];

/* ── 헬퍼 ─────────────────────────────────────────────────── */
function goalOf(code){ const g=String(code||'').split('-')[0]; return GOALS['G'+g] || GOALS.G1; }
function _cycTasks(){
  try{ if(typeof TASKS!=='undefined' && TASKS) return TASKS; }catch(e){}
  return (typeof window!=='undefined' && window.TASKS) || [];
}
function _cycTask(id){ return _cycTasks().find(t=>t.id===id) || null; }
function _cycProg(t){
  if(!t) return 0;
  try{ if(typeof taskProgress==='function') return taskProgress(t); }catch(e){}
  return (window.taskProgress? window.taskProgress(t):0);
}
function _cycOwners(id){
  try{ if(typeof OWNERS!=='undefined' && OWNERS && OWNERS[id]) return OWNERS[id]; }catch(e){}
  return (window.OWNERS&&window.OWNERS[id]) || null;
}
function _cycRows(id){
  try{ if(typeof schedCache!=='undefined' && schedCache) return (schedCache[id]||[]).length; }catch(e){}
  return 0;
}
function _cycEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ── 스타일 ───────────────────────────────────────────────── */
function _cycStyles(){
  if(document.getElementById('cycStyles')) return;
  const st=document.createElement('style'); st.id='cycStyles';
  st.textContent=`
  #axGrowthCard .cyc-wrap{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);
    gap:22px;align-items:center;margin-top:10px}
  #axGrowthCard .cyc-stage{position:relative;width:100%;min-width:0}
  #axGrowthCard .cyc-stage svg{display:block;width:100%;height:auto;overflow:visible}

  @keyframes gcPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}
  @keyframes gcDraw{to{stroke-dashoffset:0}}
  @keyframes gcBreathe{0%{transform:scale(.97);opacity:.5}100%{transform:scale(1.04);opacity:.95}}

  #axGrowthCard .cyc-n{opacity:0;transform-box:fill-box;transform-origin:center}
  #axGrowthCard .cyc-a{opacity:0}
  #axGrowthCard .cyc-glow{opacity:0;transform-box:fill-box;transform-origin:center}

  #axGrowthCard .cyc-svg.play .cyc-n{animation:gcPop .5s cubic-bezier(.34,1.56,.64,1) forwards}
  #axGrowthCard .cyc-svg.play .cyc-a{opacity:1;animation:gcDraw .6s ease-in-out forwards}
  #axGrowthCard .cyc-svg.play .cyc-glow{animation:gcBreathe 2.6s ease-in-out infinite alternate .6s forwards;opacity:.7}

  /* animation-fill-mode:forwards 는 transform 을 잠가서 이후 hover 전환을 막는다.
     인트로가 끝난 요소는 애니메이션을 걷어내고 최종 상태를 클래스로 고정한다. */
  #axGrowthCard .cyc-n.done{animation:none!important;opacity:1;transform:none}
  #axGrowthCard .cyc-a.done{animation:none!important;opacity:1;stroke-dashoffset:0}

  #axGrowthCard .cyc-g{cursor:pointer;transform-box:fill-box;transform-origin:center;
    transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
  #axGrowthCard .cyc-mark{transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
  #axGrowthCard .cyc-svg.play .cyc-g:hover .cyc-mark{transform:scale(1.16)}
  #axGrowthCard .cyc-g .cyc-dot{transition:stroke-width .2s ease, fill .2s ease}
  #axGrowthCard .cyc-g.on .cyc-dot{stroke-width:9}
  #axGrowthCard .cyc-g:focus-visible{outline:none}
  #axGrowthCard .cyc-g:focus-visible .cyc-dot{stroke-dasharray:4 3}

  #axGrowthCard .cyc-panel{min-height:322px;display:flex;flex-direction:column;justify-content:center;
    border-left:3px solid var(--border);padding:2px 0 2px 18px}
  #axGrowthCard .cyc-in{transition:opacity .16s ease, transform .16s ease}
  #axGrowthCard .cyc-in.out{opacity:0;transform:translateY(4px)}

  #axGrowthCard .cyc-eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
    color:var(--muted);margin-bottom:6px}
  #axGrowthCard .cyc-code{display:inline-block;font-size:.72rem;font-weight:800;letter-spacing:.04em;
    padding:3px 9px;border-radius:20px;color:#fff;margin-bottom:9px}
  #axGrowthCard .cyc-title{font-size:1.02rem;font-weight:800;line-height:1.4;color:var(--text);margin:0 0 12px}
  #axGrowthCard .cyc-meta{display:grid;grid-template-columns:64px 1fr;gap:5px 12px;font-size:.82rem;
    line-height:1.5;margin-bottom:13px}
  #axGrowthCard .cyc-meta dt{color:var(--muted);font-weight:700}
  #axGrowthCard .cyc-meta dd{margin:0;color:var(--text)}
  #axGrowthCard .cyc-prog{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  #axGrowthCard .cyc-track{flex:1;height:7px;border-radius:4px;background:var(--track,#e6eaef);overflow:hidden}
  #axGrowthCard .cyc-fill{display:block;height:100%;border-radius:4px;transition:width .45s ease}
  #axGrowthCard .cyc-pct{font-size:.86rem;font-weight:800;font-variant-numeric:tabular-nums;min-width:38px;text-align:right}
  #axGrowthCard .cyc-btn{align-self:flex-start;padding:8px 14px;border-radius:9px;border:1px solid var(--border);
    background:var(--bg);color:var(--text);font-family:inherit;font-size:.82rem;font-weight:700;cursor:pointer;
    transition:border-color .15s ease,color .15s ease}
  #axGrowthCard .cyc-btn:hover{border-color:var(--primary);color:var(--primary)}
  #axGrowthCard .cyc-lede{font-size:.86rem;color:var(--muted);line-height:1.65;margin:0 0 14px}
  #axGrowthCard .cyc-goals{display:grid;gap:7px}
  #axGrowthCard .cyc-goal{display:flex;align-items:center;gap:9px;font-size:.82rem}
  #axGrowthCard .cyc-swatch{width:9px;height:9px;border-radius:50%;flex-shrink:0}
  #axGrowthCard .cyc-gname{flex:1;min-width:0;font-weight:700;color:var(--text)}
  #axGrowthCard .cyc-gpct{font-weight:800;font-variant-numeric:tabular-nums;color:var(--muted)}
  #axGrowthCard .cyc-hint{font-size:.75rem;color:var(--muted);margin-top:14px}

  @media(max-width:900px){
    #axGrowthCard .cyc-wrap{grid-template-columns:1fr;gap:14px}
    #axGrowthCard .cyc-panel{border-left:0;border-top:3px solid var(--border);padding:16px 0 0;min-height:0}
    #axGrowthCard .cyc-stage{max-width:460px;margin:0 auto}
  }
  @media(prefers-reduced-motion:reduce){
    #axGrowthCard .cyc-svg .cyc-n,#axGrowthCard .cyc-svg .cyc-a{opacity:1;animation:none!important}
    #axGrowthCard .cyc-svg .cyc-a{stroke-dashoffset:0!important}
    #axGrowthCard .cyc-svg .cyc-glow{opacity:.7;animation:none!important}
    #axGrowthCard .cyc-g:hover{transform:none}
    #axGrowthCard .cyc-in{transition:none}
  }

  /* ── 원격 편집 표시: 고정 열 배경 비침 보정 ── */
  .sw-table td.peer-edit.peer-edit{
    background-color:var(--card)!important;
    background-image:linear-gradient(rgba(61,90,152,.07),rgba(61,90,152,.07))!important;
  }
  /* ── 모션 완화 ── */
  .mm-center{animation:none!important;box-shadow:0 10px 30px rgba(61,90,152,.4)!important}
  .mm-node{transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease!important}
  .mm-node:hover{transform:translateY(-2px)!important;border-color:var(--primary)!important;box-shadow:0 8px 24px rgba(61,90,152,.15)!important}
  .kl-item.click:hover{background:rgba(61,90,152,.10)!important;transform:none!important}
  .dept-task:hover{background:rgba(61,90,152,.09)!important;transform:none!important}
  `;
  document.head.appendChild(st);
}

/* ── 패널 ─────────────────────────────────────────────────── */
function _cycOverviewHTML(){
  const tasks=_cycTasks();
  const goals=[1,2,3].map(g=>{
    const mine=tasks.filter(t=>String(t.goal)===String(g));
    const pct=mine.length?Math.round(mine.reduce((s,t)=>s+_cycProg(t),0)/mine.length):0;
    const G=GOALS['G'+g];
    return `<div class="cyc-goal"><span class="cyc-swatch" style="background:${G.hex}"></span>
      <span class="cyc-gname">${_cycEsc(G.name)}</span><span class="cyc-gpct">${pct}%</span></div>`;
  }).join('');
  return `<div class="cyc-eyebrow">왜 순환인가</div>
    <p class="cyc-lede">전략 수립에서 시작해 인프라·데이터·에이전트·실증을 거쳐 성과를 만들고,
    그 성과가 다시 인재·문화·새 과제로 이어져 전략을 고도화합니다.
    일회성 도입이 아니라 <b>쓸수록 똑똑해지는 운영체계</b>라는 점이 일산병원 AX의 차별점입니다.</p>
    <div class="cyc-goals">${goals}</div>
    <div class="cyc-hint">노드를 클릭하면 해당 전략과제가 여기에 표시됩니다.</div>`;
}

function _cycDetailHTML(code){
  const t=_cycTask(code), g=goalOf(code);
  if(!t) return `<div class="cyc-eyebrow">${_cycEsc(code)}</div><p class="cyc-lede">해당 과제를 찾을 수 없습니다.</p>`;
  const o=_cycOwners(code)||{}, pct=_cycProg(t), n=_cycRows(code);
  return `<div class="cyc-eyebrow">${g.no} ${_cycEsc(g.name)}</div>
    <span class="cyc-code" style="background:${g.hex}">${_cycEsc(t.id)}</span>
    <h4 class="cyc-title">${_cycEsc(t.title)}</h4>
    <dl class="cyc-meta">
      <dt>담당팀</dt><dd>${_cycEsc(t.team||'-')}</dd>
      <dt>담당자</dt><dd>정 ${_cycEsc(o.main||'-')}${o.sub?' · 부 '+_cycEsc(o.sub):''}</dd>
      <dt>협업</dt><dd>${_cycEsc((t.coop||[]).join(', ')||'-')}</dd>
    </dl>
    <div class="cyc-prog">
      <span class="cyc-track"><i class="cyc-fill" style="width:${pct}%;background:${g.hex}"></i></span>
      <span class="cyc-pct" style="color:${g.hex}">${pct}%</span>
    </div>
    <button class="cyc-btn" data-open="${_cycEsc(t.id)}">세부계획 ${n}건 열기 →</button>`;
}

/* ── 렌더 ─────────────────────────────────────────────────── */
function renderCycle(root){
  _cycStyles();
  root.innerHTML=`
    <div class="cyc-eyebrow">Narrative · 01 / 전체 연결 구조</div>
    <h2 style="font-size:1.12rem;margin:0 0 2px;color:#12263a">AI Platform Hospital — Growth Cycle</h2>
    <div class="cyc-wrap">
      <div class="cyc-stage" id="cycStage"></div>
      <div class="cyc-panel"><div class="cyc-in" id="cycIn">${_cycOverviewHTML()}</div></div>
    </div>`;

  const stage=root.querySelector('#cycStage');
  const inner=root.querySelector('#cycIn');
  drawRing(stage);

  let active=null, timer=null;
  function swap(html){
    clearTimeout(timer);
    inner.classList.add('out');
    timer=setTimeout(()=>{ inner.innerHTML=html; inner.classList.remove('out'); },160);
  }
  stage.addEventListener('click',e=>{
    const g=e.target.closest('.cyc-g'); if(!g) return;
    const code=g.dataset.code;
    stage.querySelectorAll('.cyc-g.on').forEach(x=>x.classList.remove('on'));
    if(active===code){ active=null; swap(_cycOverviewHTML()); return; }
    active=code; g.classList.add('on'); swap(_cycDetailHTML(code));
  });
  root.addEventListener('click',e=>{
    const b=e.target.closest('.cyc-btn[data-open]'); if(!b) return;
    if(window.openSchedule) window.openSchedule(b.dataset.open);
  });

  /* 개요 패널은 일정(schedCache) 로딩 전에 그려지면 목표 진척률이 0으로 나온다.
     데이터가 도착하면 "패널만" 한 번 다시 채운다 — SVG 는 건드리지 않으므로 애니메이션 재생 없음.
     사용자가 노드를 이미 선택했다면 건드리지 않는다. */
  let settleN=0;
  const settle=setInterval(()=>{
    if(++settleN>20){ clearInterval(settle); return; }
    let ready=false;
    try{ ready=Object.keys(schedCache||{}).length>0; }catch(e){}
    if(!ready) return;
    clearInterval(settle);
    if(!active && inner.querySelector('.cyc-goals')) inner.innerHTML=_cycOverviewHTML();
  },500);

  // 화면에 보일 때 1회만 인트로 재생
  const svg=stage.querySelector('svg');
  if(svg){
    if(!('IntersectionObserver' in window)){ svg.classList.add('play'); }
    else{
      const io=new IntersectionObserver(es=>{
        es.forEach(en=>{ if(en.isIntersecting){ svg.classList.add('play'); io.disconnect(); } });
      },{threshold:.2});
      io.observe(stage);
    }
  }
}

function drawRing(container){
  const ns="http://www.w3.org/2000/svg";
  const S=1000, cx=S/2, cy=S/2, R=300, NR=30, LR=R+52, CORE=176;
  const N=CYCLE.length, step=360/N;
  const ang=i=>(-90+i*step)*Math.PI/180;

  const svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox",`0 0 ${S} ${S}`);
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label","성장 선순환 다이어그램 — 전략과제 12개");
  svg.classList.add('cyc-svg');
  svg.style.fontFamily="'Noto Sans KR',sans-serif";
  svg.addEventListener('animationend',ev=>{
    const t=ev.target;
    if(t&&t.classList&&(t.classList.contains('cyc-n')||t.classList.contains('cyc-a'))) t.classList.add('done');
  });

  const defs=document.createElementNS(ns,"defs");
  defs.innerHTML=`<marker id="cyc-ah" markerWidth="9" markerHeight="9" refX="6.5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#0b6e6b"/></marker>`;
  svg.appendChild(defs);

  const base=document.createElementNS(ns,"circle");
  base.setAttribute("cx",cx); base.setAttribute("cy",cy); base.setAttribute("r",R);
  base.setAttribute("fill","none"); base.setAttribute("stroke","rgba(207,224,221,.45)");
  base.setAttribute("stroke-width","2");
  svg.appendChild(base);

  const arcs=[];
  for(let i=0;i<N;i++){
    const pad=NR/R+0.052;
    const s1=ang(i)+pad, s2=ang((i+1)%N)-pad;
    const p=document.createElementNS(ns,"path");
    p.setAttribute("d",`M ${cx+R*Math.cos(s1)} ${cy+R*Math.sin(s1)} A ${R} ${R} 0 0 1 ${cx+R*Math.cos(s2)} ${cy+R*Math.sin(s2)}`);
    p.setAttribute("fill","none"); p.setAttribute("stroke","#0b6e6b");
    p.setAttribute("stroke-width","2.4"); p.setAttribute("marker-end","url(#cyc-ah)");
    p.setAttribute("opacity",".7"); p.classList.add('cyc-a');
    svg.appendChild(p); arcs.push(p);
  }
  arcs.forEach((p,i)=>{
    let L=70; try{ L=p.getTotalLength()||70; }catch(e){}
    p.style.strokeDasharray=L; p.style.strokeDashoffset=L;
    p.style.animationDelay=`${(i*0.16)+0.1}s`;
    if(i===N-1) p.addEventListener('animationend',()=>{ p.style.strokeDasharray='7 5'; p.style.strokeDashoffset='0'; });
  });

  const glow=document.createElementNS(ns,"circle");
  glow.setAttribute("cx",cx); glow.setAttribute("cy",cy); glow.setAttribute("r",CORE+22);
  glow.setAttribute("fill","rgba(21,179,166,.14)"); glow.classList.add('cyc-glow');
  svg.appendChild(glow);

  const core=document.createElementNS(ns,"circle");
  core.setAttribute("cx",cx); core.setAttribute("cy",cy); core.setAttribute("r",CORE);
  core.setAttribute("fill","#12263a");
  svg.appendChild(core);
  addText(svg,ns,cx,cy-14,"∞",{size:78,fill:"#15b3a6",weight:"700",mono:true});
  addText(svg,ns,cx,cy+34,"SELF-EVOLVING",{size:21,fill:"#cdd8e2",mono:true,ls:".14em"});
  addText(svg,ns,cx,cy+62,"AI Hospital",{size:17,fill:"#8ea0b2"});

  CYCLE.forEach((c,i)=>{
    const a=ang(i), x=cx+R*Math.cos(a), y=cy+R*Math.sin(a), g=goalOf(c[1]);
    const grp=document.createElementNS(ns,"g");
    grp.classList.add('cyc-g'); grp.dataset.code=c[1];
    grp.setAttribute("tabindex","0");
    grp.setAttribute("role","button");
    grp.setAttribute("aria-label",c[0]+' '+c[1]);

    /* 마커(원+번호)와 라벨을 분리한다. 한 그룹으로 묶으면 transform-box:fill-box 의
       기준 상자가 라벨까지 포함해, 팝인/호버 확대가 원 중심이 아닌 엉뚱한 점을 기준으로 돈다. */
    const mark=document.createElementNS(ns,"g");
    mark.classList.add('cyc-n','cyc-mark');
    mark.style.animationDelay=`${i*0.16}s`;

    const dot=document.createElementNS(ns,"circle");
    dot.setAttribute("cx",x); dot.setAttribute("cy",y); dot.setAttribute("r",NR);
    dot.setAttribute("fill","#fff"); dot.setAttribute("stroke",g.hex); dot.setAttribute("stroke-width","5");
    dot.classList.add('cyc-dot');
    mark.appendChild(dot);
    addText(mark,ns,x,y+9,String(i+1),{size:26,fill:g.hex,weight:"700",mono:true});

    const wrap=document.createElementNS(ns,"g");
    wrap.classList.add('cyc-n','cyc-lab');
    wrap.style.animationDelay=`${(i*0.16)+0.08}s`;

    const ux=Math.cos(a), uy=Math.sin(a);
    const lx=cx+LR*ux, ly=cy+LR*uy;
    const anchor=ux>0.25?"start":(ux<-0.25?"end":"middle");
    const lines=wrapLabel(c[0]);
    const lh=24;
    let ty;
    if(anchor==="middle"&&uy<0) ty=ly-lines.length*lh+2;
    else if(anchor==="middle"&&uy>0) ty=ly+4;
    else ty=ly-(lines.length*lh+14)/2+lh-5;
    lines.forEach(ln=>{ addText(wrap,ns,lx,ty,ln,{size:20,fill:"#26384a",weight:"650",anchor}); ty+=lh; });
    addText(wrap,ns,lx,ty-2,c[1],{size:15,fill:g.hex,weight:"700",mono:true,anchor});

    grp.appendChild(mark);
    grp.appendChild(wrap);
    grp.addEventListener('keydown',ev=>{
      if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); grp.dispatchEvent(new MouseEvent('click',{bubbles:true})); }
    });
    svg.appendChild(grp);
  });

  container.appendChild(svg);
}

function addText(parent,ns,x,y,txt,o){o=o||{};
  const t=document.createElementNS(ns,"text");
  t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("text-anchor",o.anchor||"middle");
  t.setAttribute("font-size",o.size||14);t.setAttribute("fill",o.fill||"#26384a");
  t.setAttribute("pointer-events","none");
  if(o.weight)t.setAttribute("font-weight",o.weight);
  if(o.mono)t.setAttribute("font-family","ui-monospace,SFMono-Regular,Menlo,monospace");
  if(o.ls)t.setAttribute("letter-spacing",o.ls);
  t.textContent=txt;parent.appendChild(t);return t;
}
function wrapLabel(s){
  if(s.length<=6) return [s];
  const mid=s.length/2; let best=-1,bd=99;
  for(let i=0;i<s.length;i++){ if(s[i]===' '||s[i]==='·'){ const d=Math.abs(i-mid); if(d<bd){bd=d;best=i;} } }
  if(best<0) return [s.slice(0,Math.round(mid)), s.slice(Math.round(mid))];
  return [s.slice(0,best).trim(), s.slice(best+1).trim()];
}

if(typeof window!=='undefined'){
  window.renderCycle=renderCycle;
  window.CYCLE=CYCLE;
}
