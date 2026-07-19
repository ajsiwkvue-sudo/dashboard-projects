/* ── done 확정 가드 ─────────────────────────────────────────────
   노드 선택 시 나머지를 흐리는 dim 은 인트로 애니메이션의 fill-forwards 가
   걷힌 뒤에야 적용된다(애니메이션 값은 일반 CSS 선언보다 우선하기 때문).
   .done 은 animationend 로 붙지만, 이벤트를 놓치면 dim·hover 가 통째로 죽는다.
   인트로 시작이 감지되면 소요시간 뒤에 무조건 확정한다. */
(function(){
  const t=setInterval(function(){
    const n=document.querySelector('#axGrowthCard .cy-nodes.play');
    if(!n) return;
    clearInterval(t);
    setTimeout(function(){
      n.querySelectorAll('.cy-n').forEach(function(e){ e.classList.add('done'); });
    },1400);
  },400);
  setTimeout(function(){ clearInterval(t); },40000);
})();
/* =========================================================================
 * growth_cycle.js — AI Platform Hospital · Growth Cycle
 * -------------------------------------------------------------------------
 * v5 (2026-07-19) 미니멀 화이트 리디자인
 *   · 중앙 짙은 원 제거 → 방사형 광채(호흡)
 *   · 노드 = 8px 도트 + 텍스트 라벨 (굵은 테두리 원 폐기)
 *   · 궤도 = 1px 점선 + 빛이 흐르는 light trail (화살표 폐기)
 *   · 노드 선택 시 나머지는 흐려지고(focus/dim) 오른쪽 패널이 같은 색으로 반응
 *   · 클릭해도 SVG/노드는 재생성하지 않는다 → 리플로우·깜빡임 없음
 * =======================================================================*/

const GOALS = {
  G1:{no:"①",name:"AI 통합 거버넌스 구축",hex:"#3d5a98"},
  G2:{no:"②",name:"AI 기반 업무 프로세스 운영",hex:"#0e8c86"},
  G3:{no:"③",name:"전 직원 AX 문화 조성",hex:"#c1791d"}
};

/* 12단계 — [링 라벨, 실제 과제 id] · 성장 선순환 순서 */
const CYCLE = [
 ["전략 수립","1-1"],   ["표준·윤리","1-2"],   ["AI 인프라","2-1"],
 ["데이터 확보","2-2"], ["AI 에이전트","2-3"], ["테스트베드","2-4"],
 ["성과 측정","1-3"],   ["가치창출","3-3"],    ["인재 양성","3-2"],
 ["성과 보상","3-4"],   ["과제 발굴","3-1"],   ["국책사업","1-4"]
];

/* ── 헬퍼 ─────────────────────────────────────────────────── */
function goalOf(code){ return GOALS['G'+String(code||'').split('-')[0]] || GOALS.G1; }
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
  #axGrowthCard{padding-top:16px!important;padding-bottom:16px!important}
  #axGrowthCard .cy-eyebrow{font-size:.68rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase;
    color:var(--muted);margin-bottom:3px}
  #axGrowthCard .cy-h{font-size:1.05rem;font-weight:800;color:var(--text);margin:0 0 2px}
  #axGrowthCard .cy-wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
    gap:20px;align-items:center;margin-top:6px}

  #axGrowthCard .cy-stage{position:relative;width:100%;max-width:400px;aspect-ratio:1;
    justify-self:center;overflow:visible}
  #axGrowthCard .cy-glow{position:absolute;top:50%;left:50%;width:56%;height:56%;border-radius:50%;
    transform:translate(-50%,-50%);
    background:radial-gradient(circle,rgba(14,140,134,.15) 0%,rgba(14,140,134,.05) 45%,rgba(14,140,134,0) 72%)}
  #axGrowthCard .cy-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
  #axGrowthCard .cy-track{fill:none;stroke:var(--border);stroke-width:1;stroke-dasharray:2 7;stroke-linecap:round}
  #axGrowthCard .cy-trail{fill:none;stroke:#0e8c86;stroke-width:2;stroke-linecap:round;opacity:0}

  #axGrowthCard .cy-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    text-align:center;pointer-events:none;opacity:0}
  #axGrowthCard .cy-c1{display:block;font-size:1.7rem;font-weight:800;color:var(--text);line-height:1;
    font-variant-numeric:tabular-nums}
  #axGrowthCard .cy-c2{display:block;font-size:.68rem;color:var(--muted);letter-spacing:.09em;margin-top:3px}

  #axGrowthCard .cy-n{position:absolute;transform:translate(-50%,-50%);width:8px;height:8px;
    padding:0;border:0;background:none;cursor:pointer;opacity:0}
  #axGrowthCard .cy-n::before{content:'';position:absolute;inset:-11px;border-radius:50%}
  #axGrowthCard .cy-dot{display:block;width:8px;height:8px;border-radius:50%;background:var(--c);
    transition:transform .22s ease}
  #axGrowthCard .cy-lab{position:absolute;white-space:nowrap;font-size:.71rem;font-weight:700;
    color:var(--muted);transition:color .22s ease}
  #axGrowthCard .cy-n.r .cy-lab{left:15px;top:50%;transform:translateY(-50%)}
  #axGrowthCard .cy-n.l .cy-lab{right:15px;top:50%;transform:translateY(-50%)}
  #axGrowthCard .cy-n.t .cy-lab{left:50%;bottom:15px;transform:translateX(-50%)}
  #axGrowthCard .cy-n.b .cy-lab{left:50%;top:15px;transform:translateX(-50%)}
  #axGrowthCard .cy-n:hover .cy-dot{transform:scale(1.5)}
  #axGrowthCard .cy-n:hover .cy-lab{color:var(--text)}
  #axGrowthCard .cy-n:focus-visible .cy-dot{box-shadow:0 0 0 3px rgba(61,90,152,.25)}
  #axGrowthCard .cy-n.on .cy-dot{transform:scale(1.9)}
  #axGrowthCard .cy-n.on .cy-lab{color:var(--text)}
  #axGrowthCard .cy-nodes{position:absolute;inset:0}
  #axGrowthCard .cy-nodes.sel .cy-n{transition:opacity .22s ease}
  #axGrowthCard .cy-nodes.sel .cy-n:not(.on){opacity:.3}

  /* 인트로 — 화면에 보일 때 1회 */
  @keyframes cyIn{from{opacity:0;transform:translate(-50%,-50%) scale(.7)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
  @keyframes cyFade{to{opacity:1}}
  @keyframes cyRun{to{stroke-dashoffset:-1885}}
  #axGrowthCard .cy-svg.play .cy-trail{opacity:.5;stroke-dasharray:70 1815;animation:cyRun 7s linear infinite}
  #axGrowthCard .cy-stage.play .cy-center{animation:cyFade .6s ease .5s forwards}
  #axGrowthCard .cy-stage.play .cy-glow{animation:cyBreathe 5s ease-in-out infinite alternate}
  @keyframes cyBreathe{from{transform:translate(-50%,-50%) scale(.9);opacity:.7}to{transform:translate(-50%,-50%) scale(1.1);opacity:1}}
  #axGrowthCard .cy-nodes.play .cy-n{animation:cyIn .45s cubic-bezier(.34,1.4,.64,1) forwards}
  #axGrowthCard .cy-n.done{animation:none!important;opacity:1;transform:translate(-50%,-50%)}

  /* 오른쪽 패널 */
  #axGrowthCard .cy-panel{border-left:1px solid var(--border);padding-left:20px;min-width:0}
  #axGrowthCard .cy-in{min-height:340px;display:flex;flex-direction:column;justify-content:center;
    transition:opacity .16s ease}
  #axGrowthCard .cy-in.out{opacity:0}
  #axGrowthCard .cy-hint{font-size:.74rem;color:var(--muted);margin-bottom:9px}
  #axGrowthCard .cy-list{display:grid;gap:1px}
  #axGrowthCard .cy-li{display:grid;grid-template-columns:16px 1fr auto auto;align-items:center;gap:9px;
    width:100%;text-align:left;padding:5px 8px 5px 4px;border:0;border-radius:7px;background:transparent;
    font-family:inherit;cursor:pointer;transition:background .15s ease}
  #axGrowthCard .cy-li:hover{background:rgba(61,90,152,.06)}
  #axGrowthCard .cy-li i{width:6px;height:6px;border-radius:50%;background:var(--c);justify-self:center}
  #axGrowthCard .cy-li b{font-size:.78rem;font-weight:600;color:var(--text);min-width:0;overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap}
  #axGrowthCard .cy-li s{font-size:.68rem;color:var(--muted);text-decoration:none;font-variant-numeric:tabular-nums}
  #axGrowthCard .cy-li u{font-size:.72rem;color:var(--muted);text-decoration:none;min-width:26px;
    text-align:right;font-variant-numeric:tabular-nums}
  #axGrowthCard .cy-acc{height:2px;border-radius:2px;background:var(--c);width:34px;margin-bottom:10px}
  #axGrowthCard .cy-code{font-size:.71rem;font-weight:800;color:var(--c);letter-spacing:.04em}
  #axGrowthCard .cy-title{font-size:.98rem;font-weight:800;color:var(--text);line-height:1.45;margin:4px 0 12px}
  #axGrowthCard .cy-meta{display:grid;grid-template-columns:52px 1fr;gap:4px 10px;font-size:.78rem;
    line-height:1.5;margin-bottom:12px}
  #axGrowthCard .cy-meta dt{color:var(--muted);font-weight:700}
  #axGrowthCard .cy-meta dd{margin:0;color:var(--text)}
  #axGrowthCard .cy-bar{display:flex;align-items:center;gap:9px;margin-bottom:14px}
  #axGrowthCard .cy-tr{flex:1;height:4px;border-radius:3px;background:var(--track,#e6eaef);overflow:hidden}
  #axGrowthCard .cy-tr i{display:block;height:100%;border-radius:3px;background:var(--c)}
  #axGrowthCard .cy-pct{font-size:.78rem;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}
  #axGrowthCard .cy-btn,#axGrowthCard .cy-back{padding:6px 11px;border-radius:8px;border:1px solid var(--border);
    background:transparent;color:var(--muted);font-family:inherit;font-size:.75rem;font-weight:700;
    cursor:pointer;transition:border-color .15s ease,color .15s ease}
  #axGrowthCard .cy-btn{align-self:flex-start;margin-bottom:10px;color:var(--text)}
  #axGrowthCard .cy-back{align-self:flex-start}
  #axGrowthCard .cy-btn:hover,#axGrowthCard .cy-back:hover{border-color:var(--primary);color:var(--primary)}

  @media(max-width:900px){
    #axGrowthCard .cy-wrap{grid-template-columns:1fr;gap:16px}
    #axGrowthCard .cy-panel{border-left:0;border-top:1px solid var(--border);padding:16px 0 0}
    #axGrowthCard .cy-in{min-height:0}
  }
  @media(prefers-reduced-motion:reduce){
    #axGrowthCard .cy-n{opacity:1;animation:none!important}
    #axGrowthCard .cy-center{opacity:1;animation:none!important}
    #axGrowthCard .cy-glow,#axGrowthCard .cy-trail{animation:none!important}
    #axGrowthCard .cy-svg.play .cy-trail{opacity:.35}
    #axGrowthCard .cy-in{transition:none}
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

/* ── 패널 내용 ────────────────────────────────────────────── */
function _cycListHTML(){
  const rows=CYCLE.map((c,i)=>{
    const t=_cycTask(c[1]), g=goalOf(c[1]);
    return `<button class="cy-li" data-i="${i}" style="--c:${g.hex}"><i></i>`+
      `<b>${_cycEsc(t?t.title:c[0])}</b><s>${_cycEsc(c[1])}</s><u>${_cycProg(t)}%</u></button>`;
  }).join('');
  return `<div class="cy-hint">앞 단계의 산출물이 다음 단계의 입력이 됩니다. 항목을 클릭하면 상세가 열립니다.</div>
    <div class="cy-list">${rows}</div>`;
}

function _cycDetailHTML(i){
  const c=CYCLE[i], t=_cycTask(c[1]), g=goalOf(c[1]);
  if(!t) return `<div class="cy-hint">${_cycEsc(c[1])} 과제를 찾을 수 없습니다.</div>
    <button class="cy-back">← 12단계 전체</button>`;
  const o=_cycOwners(c[1])||{}, pct=_cycProg(t), n=_cycRows(c[1]);
  return `<div class="cy-acc" style="--c:${g.hex}"></div>
    <div class="cy-code" style="--c:${g.hex}">${_cycEsc(t.id)} · ${_cycEsc(g.name)}</div>
    <div class="cy-title">${_cycEsc(t.title)}</div>
    <dl class="cy-meta">
      <dt>담당팀</dt><dd>${_cycEsc(t.team||'-')}</dd>
      <dt>담당자</dt><dd>정 ${_cycEsc(o.main||'-')}${o.sub?' · 부 '+_cycEsc(o.sub):''}</dd>
      <dt>협업</dt><dd>${_cycEsc((t.coop||[]).join(', ')||'-')}</dd>
    </dl>
    <div class="cy-bar" style="--c:${g.hex}">
      <span class="cy-tr"><i style="width:${pct}%"></i></span><span class="cy-pct">${pct}%</span>
    </div>
    <button class="cy-btn" data-open="${_cycEsc(t.id)}">세부계획 ${n}건 열기 →</button>
    <button class="cy-back">← 12단계 전체</button>`;
}

/* ── 렌더 ─────────────────────────────────────────────────── */
function renderCycle(root){
  _cycStyles();
  root.innerHTML=`
    <div class="cy-eyebrow">Narrative · 01 / 전체 연결 구조</div>
    <div class="cy-h">AI Platform Hospital — Growth Cycle</div>
    <div class="cy-wrap">
      <div class="cy-stage">
        <div class="cy-glow"></div>
        <svg class="cy-svg" viewBox="0 0 1000 1000" aria-hidden="true">
          <circle class="cy-track" cx="500" cy="500" r="300"/>
          <circle class="cy-trail" cx="500" cy="500" r="300"/>
        </svg>
        <div class="cy-nodes"></div>
        <div class="cy-center"><span class="cy-c1">12</span><span class="cy-c2">전략과제</span></div>
      </div>
      <div class="cy-panel"><div class="cy-in">${_cycListHTML()}</div></div>
    </div>`;

  const stage=root.querySelector('.cy-stage');
  const nodes=root.querySelector('.cy-nodes');
  const svg=root.querySelector('.cy-svg');
  const inner=root.querySelector('.cy-in');

  CYCLE.forEach((c,i)=>{
    const a=(-90+i*30)*Math.PI/180, g=goalOf(c[1]);
    const ux=Math.cos(a), uy=Math.sin(a);
    const b=document.createElement('button');
    b.className='cy-n '+(Math.abs(ux)<0.35 ? (uy<0?'t':'b') : (ux>0?'r':'l'));
    b.dataset.i=i;
    b.style.setProperty('--c',g.hex);
    b.style.left=(50+40*ux)+'%';
    b.style.top=(50+40*uy)+'%';
    b.style.animationDelay=(i*0.055)+'s';
    b.setAttribute('aria-label',c[0]+' '+c[1]);
    b.innerHTML=`<span class="cy-dot"></span><span class="cy-lab">${_cycEsc(c[0])}</span>`;
    nodes.appendChild(b);
  });

  nodes.addEventListener('animationend',e=>{
    if(e.target.classList&&e.target.classList.contains('cy-n')) e.target.classList.add('done');
  });

  let active=null, timer=null;
  function swap(html){
    clearTimeout(timer);
    inner.classList.add('out');
    timer=setTimeout(()=>{ inner.innerHTML=html; inner.classList.remove('out'); },160);
  }
  function select(i){
    nodes.querySelectorAll('.cy-n.on').forEach(x=>x.classList.remove('on'));
    if(i===null||active===i){ active=null; nodes.classList.remove('sel'); swap(_cycListHTML()); return; }
    active=i; nodes.classList.add('sel');
    const n=nodes.querySelector('.cy-n[data-i="'+i+'"]');
    if(n) n.classList.add('on');
    swap(_cycDetailHTML(i));
  }
  root.addEventListener('click',e=>{
    const n=e.target.closest('.cy-n');   if(n){ select(+n.dataset.i); return; }
    const l=e.target.closest('.cy-li');  if(l){ select(+l.dataset.i); return; }
    if(e.target.closest('.cy-back')){ select(null); return; }
    const b=e.target.closest('.cy-btn[data-open]');
    if(b && window.openSchedule) window.openSchedule(b.dataset.open);
  });

  /* 목록은 일정 로딩 전에 그려지면 진척률이 0으로 나온다.
     데이터 도착 시 "패널만" 한 번 다시 채운다 — 링은 건드리지 않으므로 애니메이션 재생 없음. */
  let k=0;
  const settle=setInterval(()=>{
    if(++k>20){ clearInterval(settle); return; }
    let ready=false;
    try{ ready=Object.keys(schedCache||{}).length>0; }catch(e){}
    if(!ready) return;
    clearInterval(settle);
    if(active===null && inner.querySelector('.cy-list')) inner.innerHTML=_cycListHTML();
  },500);

  _cycArm(stage,nodes,svg);
}

/* 인트로 발동 — 화면에 보일 때 1회.
   IntersectionObserver 는 백그라운드 탭에서 콜백을 전달하지 않으므로
   ① 탭 복귀 ② 주기 재확인 ③ 30초 후 무조건 표시 3중 안전장치를 둔다. */
function _cycArm(stage,nodes,svg){
  let armed=false, io=null, poll=null;
  function fire(){
    if(armed) return; armed=true;
    stage.classList.add('play'); nodes.classList.add('play'); svg.classList.add('play');
    if(io) io.disconnect();
    if(poll) clearInterval(poll);
    document.removeEventListener('visibilitychange',check);
  }
  function onScreen(){
    if(stage.offsetParent===null) return false;
    const r=stage.getBoundingClientRect();
    return r.height>0 && r.top<window.innerHeight && r.bottom>0;
  }
  function check(){ if(document.visibilityState==='visible' && onScreen()) fire(); }
  if('IntersectionObserver' in window){
    io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting) fire(); }); },{threshold:.2});
    io.observe(stage);
  }
  document.addEventListener('visibilitychange',check);
  poll=setInterval(check,700);
  setTimeout(fire,30000);
  check();
}

if(typeof window!=='undefined'){
  window.renderCycle=renderCycle;
  window.CYCLE=CYCLE;
}
