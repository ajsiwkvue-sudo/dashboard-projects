/* =========================================================================
 * aihos_arch_bundle.js  —  AI-HOS 아키텍처 인터랙티브 다이어그램 [콘솔 추출 실제 코드]
 * -------------------------------------------------------------------------
 * 이 번들은 콘솔에서 그대로 떼어낸 코드입니다. ilsan-AX에 붙이려면
 * 아래 "외부 의존성(재배선 지점)"만 ilsan-AX 쪽 값/함수로 연결하세요.
 *
 * ▶ 데이터/전역 (반드시 제공):
 *   - GOALS, goalOf(code)         : 목표 색/이름 (growth_cycle.js 의 GOALS 재사용 가능)
 *   - TASKS                       : {code:{name,goal,details[],outputs[]...}} — ilsan-AX ax_schedules 로 매핑
 *   - STATE.taskProgress[code]    : 과제 진척(%) — ilsan-AX 진척값으로 연결
 *   - STATE.outputs[code]         : 산출물 배열 — 없으면 TASKS[code].outputs 폴백
 * ▶ 드로어/헬퍼 (제공 또는 대체):
 *   - #drawer / #drawerBody DOM, closeDrawer(), drawerCode 변수
 *   - _gd(code), _outs(code), drawPhaseTimeline(), _ganttPhaseObj(code), updateNodeRing()
 *   → 노드 클릭 시 상세 패널용. ilsan-AX에 드로어가 없으면 openNode 내부를
 *     ilsan-AX의 상세 표시 방식으로 교체하면 됨(렌더 자체는 openNode 없이도 동작).
 * ▶ CSS: 같은 폴더의 aihos_arch.css 를 포함하세요.
 * ▶ HTML: renderArch(container) 가 container.innerHTML 을 채웁니다.
 *   타임라인/루프/팬줌/전체화면/발표모드 핸들러가 내부에 포함되어 있습니다.
 * =======================================================================*/

// === arch state + timeline/loop + pan/zoom + renderArch (1353-1597) ===
let archSel=null;
let archLoop=null;
function applyArchTimeline(m){archSel=m;archLoop=null;const V=document.getElementById('view');if(!V)return;
  const st=document.getElementById('archStage');if(st)st.classList.remove('loop-data','loop-perso','loop-opt','loop-model');
  V.querySelectorAll('.atl-loop').forEach(b=>b.classList.remove('sel'));
  V.querySelectorAll('.atl-seg').forEach(s=>{const mm=+s.dataset.m;s.classList.toggle('sel',m!==null&&mm===m);s.classList.toggle('past',m!==null&&mm<m);});
  V.querySelectorAll('.cn[data-done]').forEach(el=>{el.classList.remove('due','done-past','future','loop-on','loop-off');
    if(m===null)return;const d=+el.dataset.done;
    if(d===m)el.classList.add('due');else if(d<m)el.classList.add('done-past');else el.classList.add('future');});
  V.querySelectorAll('.aw polyline.awln').forEach(ln=>{const am=+ln.dataset.am;const on=(m===null)||(am<=m);ln.classList.toggle('flow',on);ln.classList.toggle('edim',!on);});
  if(m===null)closeDrawer();else openTimelineDrawer(m);
}
function applyArchLoop(id){const V=document.getElementById('view');if(!V)return;
  archLoop=(archLoop===id)?null:id;archSel=null;
  const st=document.getElementById('archStage');if(st){st.classList.remove('loop-data','loop-perso','loop-opt','loop-model');if(archLoop)st.classList.add('loop-'+archLoop);}
  V.querySelectorAll('.atl-seg').forEach(s=>s.classList.remove('sel','past'));
  V.querySelectorAll('.atl-loop').forEach(b=>b.classList.toggle('sel',archLoop!==null&&b.dataset.loop===archLoop));
  V.querySelectorAll('.cn[data-done]').forEach(el=>{el.classList.remove('due','done-past','future','loop-on','loop-off');
    if(archLoop===null)return;const lp=(el.dataset.loop||'').split(' ');
    el.classList.add(lp.indexOf(archLoop)>=0?'loop-on':'loop-off');});
  V.querySelectorAll('.aw polyline.awln').forEach(ln=>{ln.classList.remove('flow','edim');
    if(archLoop===null)return;const lp=(ln.dataset.loop||'').split(' ');
    ln.classList.add(lp.indexOf(archLoop)>=0?'flow':'edim');});
  if(archLoop===null)closeDrawer();else openLoopDrawer(archLoop);
}
function initArchPanZoom(){
  const vp=document.querySelector('.arch-vp'), st=document.getElementById('archStage');
  if(!vp||!st) return;
  const CWg=+st.dataset.cw, CHg=+st.dataset.ch;
  let s=1,tx=0,ty=0,drag=false,lx=0,ly=0,moved=false;
  const apply=()=>{st.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';};
  const cl=v=>Math.min(2.6,Math.max(0.3,v));
  const fit=()=>{const vw=vp.clientWidth,vh=vp.clientHeight;s=cl(Math.min(vw/CWg,vh/CHg));tx=(vw-CWg*s)/2;ty=(vh-CHg*s)/2;apply();};
  let _zht;const showZoomHint=()=>{const h=vp.querySelector('.zoom-hint');if(!h)return;h.classList.add('show');clearTimeout(_zht);_zht=setTimeout(()=>h.classList.remove('show'),900);};
  vp.onwheel=e=>{if(!(e.ctrlKey||e.metaKey)){showZoomHint();return;}e.preventDefault();const r=vp.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,ns=cl(s*(e.deltaY<0?1.12:0.892));tx=mx-(mx-tx)*(ns/s);ty=my-(my-ty)*(ns/s);s=ns;apply();};
  vp.onmousedown=e=>{drag=true;moved=false;lx=e.clientX;ly=e.clientY;};
  vp.onmousemove=e=>{if(!drag)return;const dx=e.clientX-lx,dy=e.clientY-ly;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;tx+=dx;ty+=dy;lx=e.clientX;ly=e.clientY;apply();};
  vp.onmouseup=()=>{drag=false;};
  vp.onmouseleave=()=>{drag=false;};
  st.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();}},true);
  const zb=document.querySelector('.arch-zoom');
  if(zb)zb.onclick=e=>{const b=e.target.closest('button');if(!b)return;const vw=vp.clientWidth,vh=vp.clientHeight,cx=vw/2,cy=vh/2;
    if(b.dataset.z==='fit'){fit();return;}
    const ns=cl(s*(b.dataset.z==='in'?1.2:0.83));tx=cx-(cx-tx)*(ns/s);ty=cy-(cy-ty)*(ns/s);s=ns;apply();};
  st._fit=fit;
  const wrap=document.getElementById('archFsRoot'), fsb=document.querySelector('.arch-fs');
  const isFS=()=>document.fullscreenElement||document.webkitFullscreenElement;
  if(fsb&&wrap)fsb.onclick=()=>{if(!isFS()){const rq=wrap.requestFullscreen||wrap.webkitRequestFullscreen;if(rq)rq.call(wrap);}else{const ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex)ex.call(document);}};
  if(!window._archFS){window._archFS=1;const rf=()=>{const fsEl=document.fullscreenElement||document.webkitFullscreenElement;const root=document.getElementById('archFsRoot');const dw=document.getElementById('drawer');if(dw){if(fsEl&&root&&fsEl===root){if(dw.parentElement!==root)root.appendChild(dw);}else if(dw.parentElement!==document.body){document.body.appendChild(dw);}}const s2=document.getElementById('archStage');if(s2&&s2._fit)setTimeout(s2._fit,60);const f=document.querySelector('.arch-fs');if(f)f.textContent=fsEl?'⤡ 종료':'⛶ 전체화면';};document.addEventListener('fullscreenchange',rf);document.addEventListener('webkitfullscreenchange',rf);window.addEventListener('resize',rf);}
  fit();
}
function renderArch(root){
  const CW=1920,CH=960;
  const IC={
    loop:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/>',
    ui:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    shield:'<path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    data:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    graph:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="9" cy="17" r="2"/><path d="M8 7l8 0M8 8l0 8M11 16l6-8"/>',
    brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 5 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-5 1"/>',
    server:'<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01"/>',
    bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    board:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>',
    plug:'<path d="M9 3v5M15 3v5"/><rect x="7" y="8" width="10" height="6" rx="2"/><path d="M12 14v4a3 3 0 0 0 3 3h1"/>',
    mine:'<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5l4 4M11 8v6M8 11h6"/>',
    fsm:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.3 11l7.4-3M8.3 13l7.4 3"/>',
    result:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 12l2 2 4-5"/>',
    chip:'<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
    book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    tag:'<path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8" cy="8" r="1.4"/>',
    hub:'<circle cx="12" cy="12" r="2.6"/><circle cx="4" cy="6" r="1.5"/><circle cx="20" cy="6" r="1.5"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="18" r="1.5"/><path d="M6 7l4 3M18 7l-4 3M6 17l4-3M18 17l-4-3"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9"/>',
    gauge:'<path d="M4 19a8 8 0 1 1 16 0"/><path d="M12 19l5-6"/><circle cx="12" cy="19" r="1.4"/>',
    spawn:'<circle cx="8" cy="8" r="3"/><path d="M14 8h6M17 5v6M8 12v3a3 3 0 0 0 3 3h3"/>'
  };
  const icon=(k,c)=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${IC[k]||IC.board}</svg>`;
  const GMETA={GOV:{t:"거버넌스 · AI 운영위원회",zn:"G1"},CAP:{t:"CAP · 플랫폼 + Runtime(Control Plane)",zn:"2-3"},RPA:{t:"RAG · PREF · AGENT",zn:"RPA · 2-2"},MODEL:{t:"모델 학습(오프라인) · Registry",zn:"2-1"},OPT:{t:"운영 최적화",zn:"3-3"},WB:{t:"승인 · Write-back · 감사",zn:"2-3 · 2-4"}};
  const N={
    // external
    source:{x:40,y:300,w:150,h:90,out:1,ic:"server",c:"#6c7d8e",title:"원천 데이터",sub:"EMR·OCS·PACS<br>LIS·IoMT",kind:"src"},
    users:{x:40,y:720,w:150,h:110,out:1,ic:"users",c:"#2f9e6a",title:"현업 · Key Player",sub:"과제발굴<br>L3+ 30명",kind:"src",maps:["3-1"]},
    llm:{x:1720,y:300,w:175,h:130,out:1,ic:"bolt",c:"#c1791d",title:"On-prem LLM",sub:"의료특화 FM",maps:["2-1","1-4"],kind:"model"},
    gpu:{x:1720,y:470,w:175,h:90,out:1,ic:"chip",c:"#c0492f",title:"GPU 하드웨어",sub:"AI 컴퓨팅 인프라",maps:["2-1"],kind:"gpu"},
    // governance
    gov1:{x:300,y:74,w:150,h:92,grp:"GOV",ic:"board",c:"#3d5a98",title:"전략·이행관리",sub:"AX 추진전략",maps:["1-1"]},
    gov2:{x:466,y:74,w:150,h:92,grp:"GOV",ic:"shield",c:"#3d5a98",title:"표준·윤리·안전",sub:"가이드라인",maps:["1-2"]},
    gov3:{x:632,y:74,w:150,h:92,grp:"GOV",ic:"gear",c:"#3d5a98",title:"KPI·성과·보상",sub:"12지표·보상",maps:["1-3"]},
    gov4:{x:798,y:74,w:150,h:92,grp:"GOV",ic:"result",c:"#3d5a98",title:"검증·테스트베드",sub:"FM 실증·검증",maps:["2-4"]},
    gov5:{x:964,y:74,w:160,h:92,grp:"GOV",ic:"shield",c:"#3d5a98",title:"IAM·보안·감사·버전",sub:"Control Plane",maps:["2-4"]},
    // data ingest / semantic
    hub:{x:230,y:300,w:160,h:80,ic:"hub",c:"#0e8c86",title:"Connector Hub",sub:"Event Bus·수집",maps:["2-2"]},
    binder:{x:248,y:430,w:120,h:120,shape:"circ",ic:"data",c:"#0e8c86",title:"데이터 바인더",sub:"Semantic Fabric",maps:["2-2"]},
    catalog:{x:230,y:600,w:160,h:80,ic:"tag",c:"#0e8c86",title:"데이터 카탈로그",sub:"Provenance·품질",maps:["2-2"]},
    // context & knowledge (KB vs Patient split)
    kb:{x:450,y:300,w:175,h:80,ic:"book",c:"#0e8c86",title:"Enterprise KB",sub:"지침·규정·SOP·심사",maps:["2-2"]},
    pctx:{x:450,y:430,w:175,h:80,ic:"data",c:"#0e8c86",title:"Patient Context",sub:"환자 실시간·조립",maps:["2-2"]},
    mcp_read:{x:450,y:560,w:175,h:80,ic:"plug",c:"#6c4bd8",title:"Read Gateway",sub:"EMR·PACS 조회",maps:["2-3"]},
    // CAP + Runtime
    cab:{x:700,y:300,w:132,h:58,grp:"CAP",ic:"loop",c:"#0b6e6b",title:"CAB",sub:"Agent Builder",maps:["2-3"]},
    cal:{x:850,y:300,w:132,h:58,grp:"CAP",ic:"board",c:"#0e8c86",title:"CAL",sub:"Library·30종",maps:["2-3"]},
    rt_router:{x:694,y:372,w:132,h:60,grp:"CAP",ic:"fsm",c:"#3d5a98",title:"Router·Planner",sub:"요청 배정",maps:["2-3"]},
    rt_flow:{x:842,y:372,w:140,h:60,grp:"CAP",ic:"loop",c:"#3d5a98",title:"Workflow·State",sub:"순서·재시도",maps:["2-3"]},
    rt_policy:{x:694,y:444,w:132,h:60,grp:"CAP",ic:"shield",c:"#3d5a98",title:"Policy·IAM",sub:"권한 통제",maps:["2-3"]},
    rt_valid:{x:842,y:444,w:140,h:60,grp:"CAP",ic:"result",c:"#3d5a98",title:"Validator",sub:"정확·안전 검증",maps:["2-3"]},
    mwp:{x:700,y:528,w:282,h:92,grp:"CAP",hub:1,ic:"ui",c:"#0b6e6b",title:"MWP · My Workplace",sub:"개인 맞춤 업무환경 · CAP 중심",maps:["2-3"]},
    magent:{x:510,y:700,w:150,h:74,ic:"spawn",c:"#0e8c86",title:"멀티에이전트",sub:"Orchestrator·Worker<br>Validator·A2A",maps:["2-3"]},
    // write-back / approval / audit
    output:{x:900,y:700,w:150,h:74,grp:"WB",ic:"result",c:"#2f9e6a",title:"아웃풋",sub:"Agent Draft",maps:["3-3"]},
    happroval:{x:900,y:800,w:150,h:74,grp:"WB",ic:"shield",c:"#c0492f",title:"Human Approval",sub:"의료진 검토·서명",maps:["2-3"]},
    mcp_write:{x:700,y:800,w:175,h:74,grp:"WB",ic:"plug",c:"#6c4bd8",title:"Write-back Ctrl",sub:"의무기록·오더·처방",maps:["2-3"]},
    audit:{x:700,y:889,w:175,h:56,grp:"WB",ic:"board",c:"#3d5a98",title:"Audit·Version",sub:"감사·버전 기록",maps:["2-4"]},
    // personalization (RPA)
    rag:{x:1170,y:240,w:100,h:60,grp:"RPA",ic:"graph",c:"#c1791d",title:"RAG",sub:"KB 검색",maps:["2-2"],rpal:"R"},
    pref:{x:1276,y:240,w:100,h:60,grp:"RPA",ic:"gear",c:"#6c4bd8",title:"PREF",sub:"선호",maps:["2-2"],rpal:"P"},
    agent:{x:1382,y:240,w:100,h:60,grp:"RPA",ic:"brain",c:"#6c4bd8",title:"AGENT",sub:"Memory",maps:["2-2"],rpal:"A"},
    OE:{x:1170,y:340,w:170,h:80,ic:"mine",c:"#6c7d8e",title:"운영지능 (OE)",sub:"Event Log·Process Mining",maps:["3-3"]},
    // model learning (offline)
    pipe:{x:1170,y:460,w:175,h:86,grp:"MODEL",ic:"gauge",c:"#c0492f",title:"학습 파이프라인",sub:"선별·비식별·라벨링·Gold",maps:["2-1"]},
    lora:{x:1372,y:452,w:110,h:110,grp:"MODEL",shape:"circ",ic:"gear",c:"#6c4bd8",title:"LoRA",sub:"Adapter 학습",maps:["2-1"],rpal:"L"},
    registry:{x:1520,y:460,w:160,h:86,grp:"MODEL",ic:"book",c:"#c0492f",title:"Model Registry",sub:"평가·버전·승인",maps:["2-4"]},
    // operational optimization
    ooe:{x:1170,y:610,w:170,h:80,grp:"OPT",ic:"gauge",c:"#c1791d",title:"업무 최적화 엔진",sub:"로그 모니터링·최적화",maps:["3-3"]},
    opt_wait:{x:1170,y:730,w:82,h:100,grp:"OPT",ic:"gauge",c:"#c1791d",title:"대기시간",sub:"외래·검사",maps:["3-3"]},
    opt_res:{x:1258,y:730,w:82,h:100,grp:"OPT",ic:"users",c:"#c1791d",title:"자원배분",sub:"인력·장비",maps:["3-3"]},
    opt_bed:{x:1346,y:730,w:82,h:100,grp:"OPT",ic:"board",c:"#c1791d",title:"병상·스케줄",sub:"회전",maps:["3-3"]},
    opt_proc:{x:1434,y:730,w:82,h:100,grp:"OPT",ic:"fsm",c:"#c1791d",title:"프로세스",sub:"병목",maps:["3-3"]}
  };
  const DONE={source:8,users:12,llm:10,gpu:9,gov1:9,gov2:9,gov3:10,gov4:10,gov5:10,hub:9,binder:10,catalog:10,kb:10,pctx:11,mcp_read:11,cab:11,cal:11,rt_router:12,rt_flow:12,rt_policy:12,rt_valid:12,mwp:10,magent:11,output:12,happroval:12,mcp_write:12,audit:12,rag:11,pref:11,agent:11,OE:12,pipe:12,lora:12,registry:12,ooe:12,opt_wait:12,opt_res:12,opt_bed:12,opt_proc:12};
  const EDGES=[
    {a:"source",as:"r",b:"hub",bs:"l",t:"solid",l:"수집·연계",lp:"data"},
    {a:"hub",as:"b",b:"binder",bs:"t",t:"solid",l:"정규화",lp:"data"},
    {a:"hub",as:"r",b:"mcp_read",bs:"l",t:"solid",l:"실시간 조회",lp:"data"},
    {a:"binder",as:"r",b:"kb",bs:"l",t:"solid",l:"지식화",lp:"data"},
    {a:"binder",as:"b",b:"catalog",bs:"t",t:"solid",l:"품질·계보",lp:"data"},
    {a:"mcp_read",as:"t",b:"pctx",bs:"b",t:"solid",l:"환자 컨텍스트",lp:"data"},
    {a:"kb",as:"r",b:"mwp",bs:"l",t:"solid",l:"지식 참조",lp:"data"},
    {a:"pctx",as:"r",b:"mwp",bs:"l",t:"solid",l:"환자 사실",lp:"data"},
    {a:"mwp",as:"b",b:"output",bs:"t",t:"solid",l:"임상 Draft",lp:"data"},
    {a:"output",as:"b",b:"happroval",bs:"t",t:"solid",l:"검토 요청",lp:"data"},
    {a:"happroval",as:"l",b:"mcp_write",bs:"r",t:"gate",l:"승인",lp:"data"},
    {a:"mcp_write",as:"b",b:"source",bs:"b",t:"solid",l:"write-back",big:1,lp:"data"},
    {a:"mcp_write",as:"b",b:"audit",bs:"t",t:"feed",l:"감사 기록",lp:"data"},
    {a:"gov5",as:"b",b:"happroval",bs:"t",t:"gate",l:"권한·감사"},
    {a:"mwp",as:"r",b:"OE",bs:"l",t:"feed",l:"사용 로그",lp:"perso opt model"},
    {a:"OE",as:"t",b:"rag",bs:"b",t:"fb",l:"색인 갱신",lp:"perso"},
    {a:"rag",as:"l",b:"mwp",bs:"r",t:"feed",l:"검색 증강",lp:"perso"},
    {a:"pref",as:"l",b:"mwp",bs:"r",t:"feed",l:"개인화",lp:"perso"},
    {a:"agent",as:"l",b:"mwp",bs:"r",t:"feed",l:"메모리",lp:"perso"},
    {a:"llm",as:"l",b:"mwp",bs:"r",t:"solid",l:"추론 응답",lp:"perso model"},
    {a:"OE",as:"b",b:"pipe",bs:"t",t:"fb",l:"학습 후보",lp:"model"},
    {a:"pipe",as:"r",b:"lora",bs:"l",t:"fb",l:"Gold DS 학습",lp:"model"},
    {a:"lora",as:"r",b:"registry",bs:"l",t:"solid",l:"평가·등록",lp:"model"},
    {a:"registry",as:"r",b:"llm",bs:"l",t:"solid",l:"검증 배포",lp:"model"},
    {a:"gpu",as:"t",b:"llm",bs:"b",t:"solid",l:"GPU"},
    {a:"gov4",as:"r",b:"registry",bs:"t",t:"gate",l:"모델 승인"},
    {a:"OE",as:"l",b:"ooe",bs:"l",t:"feed",l:"이벤트 마이닝",lp:"opt"},
    {a:"ooe",as:"b",b:"opt_wait",bs:"t",t:"fb",lp:"opt"},
    {a:"ooe",as:"b",b:"opt_res",bs:"t",t:"fb",lp:"opt"},
    {a:"ooe",as:"b",b:"opt_bed",bs:"t",t:"fb",lp:"opt"},
    {a:"ooe",as:"b",b:"opt_proc",bs:"t",t:"fb",lp:"opt"},
    {a:"ooe",as:"l",b:"mwp",bs:"r",t:"solid",l:"최적화 반영",lp:"opt"},
    {a:"gov2",as:"b",b:"cab",bs:"t",t:"gate",l:"거버넌스 게이트"},
    {a:"cab",as:"r",b:"cal",bs:"l",t:"solid"},
    {a:"cal",as:"b",b:"rt_flow",bs:"t",t:"solid"},
    {a:"rt_valid",as:"b",b:"mwp",bs:"t",t:"solid"},
    {a:"mwp",as:"b",b:"magent",bs:"t",t:"solid",l:"실행"}
  ];
  // auto group boxes
  const GB={};
  Object.entries(N).forEach(([id,n])=>{if(n.grp){const g=GB[n.grp]=GB[n.grp]||{x1:1e9,y1:1e9,x2:-1e9,y2:-1e9};g.x1=Math.min(g.x1,n.x);g.y1=Math.min(g.y1,n.y);g.x2=Math.max(g.x2,n.x+n.w);g.y2=Math.max(g.y2,n.y+n.h);}});
  const GROUPS=Object.keys(GB).map(k=>({...GMETA[k],x:GB[k].x1-14,y:GB[k].y1-28,w:(GB[k].x2-GB[k].x1)+28,h:(GB[k].y2-GB[k].y1)+42}));
  // auto boundary from non-external nodes
  let b={x1:1e9,y1:1e9,x2:-1e9,y2:-1e9};
  Object.values(N).forEach(n=>{if(!n.out){b.x1=Math.min(b.x1,n.x);b.y1=Math.min(b.y1,n.y);b.x2=Math.max(b.x2,n.x+n.w);b.y2=Math.max(b.y2,n.y+n.h);}});
  const BD={x:b.x1-26,y:b.y1-30,w:(b.x2-b.x1)+52,h:(b.y2-b.y1)+56,lb:"AI-HOS"};

  const anchor=(r,s)=>{const cx=r.x+r.w/2,cy=r.y+r.h/2;
    if(s==="r")return{x:r.x+r.w,y:cy,nx:1,ny:0};if(s==="l")return{x:r.x,y:cy,nx:-1,ny:0};
    if(s==="t")return{x:cx,y:r.y,nx:0,ny:-1};return{x:cx,y:r.y+r.h,nx:0,ny:1};};
  const ortho=(p,q)=>{const s=15;const p1={x:p.x+p.nx*s,y:p.y+p.ny*s},q1={x:q.x+q.nx*s,y:q.y+q.ny*s};
    let pts=[{x:p.x,y:p.y},p1];
    if(p.nx!==0){if(q.nx!==0){const mx=(p1.x+q1.x)/2;pts.push({x:mx,y:p1.y},{x:mx,y:q1.y});}else pts.push({x:q1.x,y:p1.y});}
    else{if(q.ny!==0){const my=(p1.y+q1.y)/2;pts.push({x:p1.x,y:my},{x:q1.x,y:my});}else pts.push({x:p1.x,y:q1.y});}
    pts.push(q1,{x:q.x,y:q.y});return pts;};
  const WC={solid:"#4a5e70",feed:"#9aa8b6",fb:"#6c4bd8",gate:"#3d5a98"};
  let wires="",labels="";
  EDGES.forEach(e=>{const A=N[e.a],B=N[e.b];let pts;
    if(e.big){const ax=A.x+A.w/2,ay=A.y+A.h,low=CH-30,lx=22,sy=B.y+B.h/2,sx=B.x;pts=[{x:ax,y:ay},{x:ax,y:low},{x:lx,y:low},{x:lx,y:sy},{x:sx,y:sy}];}
    else{const p=anchor(A,e.as),q=anchor(B,e.bs);pts=ortho(p,q);}
    const ps=pts.map(o=>o.x.toFixed(0)+","+o.y.toFixed(0)).join(' ');
    const dash=(e.t==='solid')?'':'stroke-dasharray="6 5"';
    wires+=`<polyline class="awln" data-am="${Math.max(DONE[e.a]||0,DONE[e.b]||0)}" data-loop="${e.lp||''}" points="${ps}" fill="none" stroke="${WC[e.t]}" stroke-width="${e.t==='solid'?2.2:1.8}" ${dash} marker-end="url(#aw-${e.t})"/>`;
    if(e.l){const mi=e.big?pts.length-1:Math.floor(pts.length/2);const a=pts[mi-1],bb=pts[mi];const mx=(a.x+bb.x)/2,my=(a.y+bb.y)/2;const w=e.l.length*6.2+8;
      labels+=`<rect class="aw-bg" x="${(mx-w/2).toFixed(0)}" y="${(my-8).toFixed(0)}" width="${w.toFixed(0)}" height="16" rx="4"/><text class="aw-lb" x="${mx.toFixed(0)}" y="${(my+3).toFixed(0)}" text-anchor="middle">${e.l}</text>`;}
  });
  const defs=`<defs>${Object.entries(WC).map(([k,c])=>`<marker id="aw-${k}" markerWidth="4.5" markerHeight="4.5" refX="3.5" refY="2.25" orient="auto"><path d="M0,0 L4.5,2.25 L0,4.5 Z" fill="${c}"/></marker>`).join('')}</defs>`;

  // node-loop membership
  const NL={};EDGES.forEach(e=>{if(e.lp)e.lp.split(' ').forEach(L=>{(NL[e.a]=NL[e.a]||[]).indexOf(L)<0&&NL[e.a].push(L);(NL[e.b]=NL[e.b]||[]).indexOf(L)<0&&NL[e.b].push(L);});});

  let nodes=`<div class="aihos-bd" style="left:${BD.x}px;top:${BD.y}px;width:${BD.w}px;height:${BD.h}px"></div><div class="aihos-bd-lb" style="left:${BD.x+BD.w-140}px;top:${BD.y+8}px">${BD.lb}</div>`;
  GROUPS.forEach(g=>{nodes+=`<div class="agrp" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px"></div><div class="agrp-title" style="left:${g.x+12}px;top:${g.y+8}px">${g.zn} · ${g.t}</div>`;});
  Object.entries(N).forEach(([id,n])=>{const oc=n.maps?`onclick="openNode('${n.maps[0]}')"`:'';
    nodes+=`<div class="cn ${n.hub?'hub':''} ${n.rpal?'rpal':''} ${n.kind||''} ${n.shape==='circ'?'circ':''}" data-loop="${NL[id]?NL[id].join(' '):''}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px" data-done="${DONE[id]}" ${oc}>`
      +`${n.rpal?`<span class="rb">RPAL·${n.rpal}</span>`:''}`
      +`<div class="cn-h"><span class="cn-ic">${icon(n.ic,n.c)}</span><b>${n.title}</b></div>`
      +`<div class="cn-s">${n.sub}</div>`
      +`${n.maps?`<span class="schip chip ${goalOf(n.maps[0]).cls}">${n.maps[0]}</span>`:''}</div>`;});

  let rows=[];Object.values(N).forEach(n=>{if(n.maps)rows.push([n.title.replace(/<br>/g,' '),n.sub.replace(/<br>/g,' '),n.maps,n.rpal]);});

  root.innerHTML=`
   <div class="eyebrow">Narrative · 05 / AI Hospital Operating System</div>
   <h2>AI-HOS 아키텍처</h2>
   <p class="lede"><b>AI-HOS 경계</b> 안에 거버넌스·데이터 계층·<b>CAP + Runtime</b>·<b>Context Engineering</b>(개인화·RPA)·<b>Continual Learning</b>(모델·오프라인)·<b>Process Intelligence</b>(운영)가 배치되고, 외부로 원천데이터·현업·On-prem LLM·GPU가 연결됩니다.</p>
   <div class="arch-fs-root" id="archFsRoot"><div class="arch-timeline"><div class="atl-track">${[8,9,10,11,12].map(m=>`<button class="atl-seg" data-m="${m}">${m}월<span class="cnt">${Object.values(DONE).filter(d=>d===m).length}개</span></button>`).join('')}</div><button class="atl-all">전체 보기</button><div class="atl-loops"><span class="atl-loops-lb">순환</span><button class="atl-loop" data-loop="data">Data Flywheel<span class="lp">수집·정제·Write-back</span></button><button class="atl-loop" data-loop="perso">Context Engineering<span class="lp">RAG·PREF·Memory</span></button><button class="atl-loop" data-loop="model">Continual Learning<span class="lp">LoRA·Registry</span></button><button class="atl-loop" data-loop="opt">Process Intelligence<span class="lp">Process Mining</span></button></div><span class="atl-cap">시점=완성 노드 · 순환=loop 흐름</span></div>
     <div class="arch-wrap" style="position:relative">
     <div class="arch-vp"><div class="arch-stage" id="archStage" data-cw="${CW}" data-ch="${CH}" style="width:${CW}px;height:${CH}px"><svg class="aw" width="${CW}" height="${CH}" style="width:${CW}px;height:${CH}px" viewBox="0 0 ${CW} ${CH}">${defs}${wires}${labels}</svg>${nodes}<div class="zoom-hint">Ctrl + 스크롤로 확대 · 축소</div></div></div>
     <div class="arch-zoom"><button data-z="in">+</button><button data-z="out">−</button><button data-z="fit">⟲</button></div>
     <div class="arch-hint">Ctrl+휠: 줌 · 드래그: 이동 · ⟲: 맞춤 · F: 전체화면</div><button class="arch-fs" title="전체화면">⛶ 전체화면</button>
   </div></div>

   <div class="rpal-legend"><b>RPAL</b> — <b>Context Engineering</b>(RAG·PREF·AGENT, 빠른 반영)과 <b>Continual Learning</b>(LoRA, 느린 통제 루프)을 분리했습니다. LoRA는 운영 로그를 바로 학습하지 않고 <b>학습 파이프라인(선별·비식별·라벨링·Gold Dataset)→평가→Model Registry 승인</b>을 거칩니다.
     <div class="rps"><span class="rp"><i>R</i> RAG</span><span class="rp"><i>P</i> PREF</span><span class="rp"><i>A</i> AGENT</span><span class="rp"><i>L</i> LoRA(오프라인 학습)</span></div>
   </div>

   <hr class="section-rule">
   <div class="eyebrow">정합표</div>
   <h2 style="font-size:20px;margin-top:6px">컴포넌트 ↔ 전략과제</h2>
   <div class="card pad" style="margin-top:12px;overflow-x:auto">
     <table class="map-table"><thead><tr><th>컴포넌트</th><th>세부 연결</th><th>과제</th></tr></thead>
       <tbody>${rows.map(r=>`<tr><td class="eng">${r[0]}${r[3]?` <span style="color:var(--cross);font-family:var(--mono);font-size:11px">RPAL·${r[3]}</span>`:''}</td><td style="color:var(--ink-2);font-size:12.5px">${r[1]}</td><td>${r[2].map(m=>`<span class="chip ${goalOf(m).cls}">${m}</span>`).join(' ')}</td></tr>`).join('')}</tbody></table>
     <div class="hint">GPT 리뷰 반영: ① CAP Runtime(Router·Workflow·Policy·Validator) ② 모델 학습 루프 분리 ③ Human Approval·Audit·Version ④ MCP Read/Write 분리 ⑤ Enterprise KB ↔ Patient Context 분리.</div>
   </div>`;
  const V=document.getElementById('view');
  V.querySelectorAll('.atl-seg').forEach(s=>s.onclick=()=>applyArchTimeline(+s.dataset.m));
  const ab=V.querySelector('.atl-all');if(ab)ab.onclick=()=>applyArchTimeline(null);
  V.querySelectorAll('.atl-loop').forEach(b=>b.onclick=()=>applyArchLoop(b.dataset.loop));
  initArchPanZoom();
}

/* =========================================================================
   PAGE: TECH TREE
   ========================================================================= */

// === node drawer + loop/timeline drawers + helpers (1752-1898) ===
function openNode(code){
  window._nodeClicked=true;
  const dEl=document.getElementById('drawer');
  if(drawerCode===code&&dEl&&dEl.classList.contains('open')){closeDrawer();return;}
  const t=TASKS[code],g=goalOf(code),v=STATE.taskProgress[code];
  const ups=EDGES.filter(e=>e[1]===code);
  const downs=EDGES.filter(e=>e[0]===code);
  document.getElementById('drawerHead').innerHTML=`
    <span class="chip ${g.cls}">${g.no} ${g.name}</span>
    <h3><span style="font-family:var(--mono);color:${g.hex}">${code}</span> ${t.name}</h3>
    <div class="owner" style="font-family:var(--mono);font-size:12px;color:var(--ink-3)">담당 ${t.owner} · 2026.07.13–12.24</div>`;
  const body=document.getElementById('drawerBody');body.oninput=body.onchange=body.onclick=null;
  body.innerHTML=`
    <div class="dsec">진행률</div>
    <div style="font-family:var(--mono);font-size:30px;font-weight:700;color:${g.hex}"><span id="bigProg">${pct(v)}</span><span style="font-size:15px;color:var(--ink-3)">%</span></div>
    <div class="prog-edit"><input type="range" min="0" max="100" step="5" value="${v}" id="progR">
      <span style="font-family:var(--mono);font-size:13px" id="progV">${pct(v)}%</span></div>
    <div class="dsec">세부 실행계획</div>
    <ul>${t.details.map(d=>`<li>${d}</li>`).join("")}</ul>
    <div class="dsec">기대 산출물</div>
    <ul>${((STATE.outputs&&STATE.outputs[code])||t.outputs).map(o=>`<li>${o}</li>`).join("")}</ul>
    <div class="dsec">일정 (추진단계)</div>
    <div class="ptl" id="ptl"></div>
    <div class="dsec">선행 — 무엇을 공급받는가</div>
    <div class="link-pills">${ups.length?ups.map(e=>linkPill(e[0],e[2],EDGE_LABEL[e[0]+">"+e[1]])).join(""):'<span style="color:var(--ink-3);font-size:12.5px">시작 노드 (선행 없음)</span>'}</div>
    <div class="dsec">후행 — 무엇을 공급하는가</div>
    <div class="link-pills">${downs.length?downs.map(e=>linkPill(e[1],e[2],EDGE_LABEL[e[0]+">"+e[1]])).join(""):'<span style="color:var(--ink-3);font-size:12.5px">종단 노드</span>'}</div>`;
  drawPhaseTimeline(body.querySelector('#ptl'),t,g);
  const r=body.querySelector('#progR');
  r.oninput=()=>{const val=+r.value;STATE.taskProgress[code]=val;body.querySelector('#progV').textContent=val+"%";
    body.querySelector('#bigProg').textContent=val;persist();updateNodeRing(code,val);};
  drawerCode=code;document.getElementById('drawer').classList.add('open');
}
function linkPill(code,type,label){
  const g=goalOf(code);const tag=type==="cross"?"목표간":(type==="feedback"?"복귀":"내부");
  return `<span class="link-pill" onclick="openNode('${code}')" title="${label||''}">
    <span style="color:${g.hex};font-weight:700">${code}</span> · ${tag}</span>`;
}
function drawPhaseTimeline(container,t,g){
  const months=["07","08","09","10","11","12"];
  const head=el('div','axis',months.map(m=>`<span>${m}</span>`).join(""));
  container.appendChild(head);
  function toX(md){const [mm,dd]=md.split('-').map(Number);const idx=mm-7+ (dd-1)/31;return (idx/6)*100;}
  const colors=["#3d5a98","#0e8c86","#c1791d","#6c4bd8","#5a9bd4","#c0492f"];
  t.phases.forEach((ph,i)=>{
    const row=el('div','prow');
    const x1=toX(ph[1]),x2=toX(ph[2]);
    row.innerHTML=`<span class="pn">${ph[0]}</span>
      <div class="ptrack"><i style="left:${x1}%;width:${Math.max(2,x2-x1)}%;background:${colors[i%6]}"></i></div>`;
    container.appendChild(row);
  });
}
function updateNodeRing(code,v){
  const holder=document.getElementById('treeHolder');if(!holder)return;
  const svg=holder.querySelector('svg');if(!svg||!svg._nodes[code])return;
  const ring=svg._nodes[code].querySelector('.node-ring');
  const circ=2*Math.PI*11;ring.setAttribute('stroke-dashoffset',circ*(1-v/100));
}
const LOOPMETA={
  data:{c:'#0e8c86',en:'Data Flywheel',ko:'데이터 순환',
    desc:'원천 시스템의 데이터를 수집·정규화·의미화하여 에이전트가 활용하고, 그 결과를 승인 절차를 거쳐 다시 기록으로 되돌리는 순환입니다. 쓸수록 데이터 자산이 축적됩니다.',
    flow:'원천데이터 → Connector Hub → 데이터 바인더(Semantic) → 카탈로그 · Enterprise KB · Patient Context → MWP → 아웃풋(Draft) → Human Approval → Write-back Controller → 원천(기록 반영) · Audit',
    note:'쓰기는 반드시 Human Approval → Write-back Controller → Audit 통제를 거칩니다. Read/Write Gateway는 분리되어 있습니다.'},
  perso:{c:'#6c4bd8',en:'Context Engineering',ko:'개인화',
    desc:'사용자의 선택·선호·업무 맥락을 RAG·PREF·Memory로 조립해 즉시 다음 응답에 반영하는 빠른 루프입니다. 모델 가중치는 바꾸지 않습니다.',
    flow:'MWP(사용) → 운영지능(OE) → RAG · PREF · AGENT 갱신 → MWP 즉시 반영 (On-prem LLM 추론 응답 결합)',
    note:'실시간 개인화는 Context Engineering으로 처리하고, 모델 학습(LoRA)과 분리합니다.'},
  model:{c:'#c0492f',en:'Continual Learning',ko:'모델 학습',
    desc:'검증된 데이터만 오프라인으로 학습하는, 가장 느리고 통제된 루프입니다. 운영 로그를 그대로 학습하지 않습니다.',
    flow:'운영지능(OE) → 학습 파이프라인(선별 · 비식별 · 라벨링 · Gold) → LoRA 학습 → Model Registry(평가 · 버전 · 승인) → On-prem LLM 배포',
    note:'검증위원회 승인과 Model Registry 등록을 거친 뒤에만 단계적으로 배포됩니다.'},
  opt:{c:'#c1791d',en:'Process Intelligence',ko:'운영 최적화',
    desc:'업무 이벤트 로그를 Process Mining으로 분석해 병목 · 대기 · 자원배분을 개선하는 루프입니다. 자동 변경이 아니라 개선안을 제시합니다.',
    flow:'MWP → 운영지능(OE) → 업무 최적화 엔진 → 대기시간 · 자원배분 · 병상 · 프로세스 개선안 → MWP 반영',
    note:'개선안은 거버넌스 승인 후 반영하는 것을 원칙으로 합니다.'}
};
const MONTHNOTE={
  8:'데이터 파이프라인 착수 — 원천 시스템 연계를 시작합니다.',
  9:'수집 · 연계 · GPU · 거버넌스의 기본 골격을 세웁니다.',
  10:'데이터 계층 · 지식화 · 검증 체계와 MWP 중심 골격이 완성됩니다.',
  11:'개인화(RPA) · Patient Context · Read Gateway와 에이전트 제작/배포가 이뤄집니다.',
  12:'CAP Runtime · 모델 학습 루프 · Write-back/감사 · 운영 최적화까지 전체가 가동됩니다.'
};
function _archTitle(el){const b=el.querySelector('.cn-h b');return b?b.textContent:'';}
function _archNodeCode(el){const s=el.querySelector('.schip');return s?s.textContent.trim():null;}
function _archTaskDetails(nodes,heading){
  const map={};
  nodes.forEach(el=>{const c=_archNodeCode(el);if(!c||!TASKS[c])return;(map[c]=map[c]||[]).push(_archTitle(el));});
  const codes=Object.keys(map).sort();
  if(!codes.length)return {html:'<div class="dsec">'+heading+'</div><p style="font-size:12.5px;color:var(--ink-3)">연결된 전략과제가 없습니다.</p>',tls:[]};
  let html='<div class="dsec">'+heading+' ('+codes.length+'개 과제)</div>';
  const tls=[];
  codes.forEach(c=>{
    const t=TASKS[c],g=goalOf(c),v=pct(STATE.taskProgress[c]||0);
    const id='ptl_'+c.replace(/[^0-9a-zA-Z]/g,'');
    html+='<div class="tdetail">'
      +'<div class="tdetail-h"><span class="chip '+g.cls+'">'+c+'</span> <b>'+t.name+'</b><span class="tdetail-own">담당 '+t.owner+'</span></div>'
      +'<div class="tdetail-cov">◦ '+[...new Set(map[c])].join(' · ')+'</div>'
      +'<div class="tdetail-prog"><div class="tdp-bar"><i style="width:'+v+'%;background:'+g.hex+'"></i></div><span>'+v+'%</span></div>'
      +'<div class="tdetail-sub">세부 실행계획</div><ul>'+t.details.map(d=>'<li>'+d+'</li>').join('')+'</ul>'
      +'<div class="tdetail-sub">기대 산출물</div><ul>'+((STATE.outputs&&STATE.outputs[c])||t.outputs).map(o=>'<li>'+o+'</li>').join('')+'</ul>'
      +'<div class="tdetail-sub">일정</div><div class="ptl" id="'+id+'"></div>'
      +'</div>';
    tls.push({id:id,t:_ganttPhaseObj(c),g:g});
  });
  return {html:html,tls:tls};
}
function openLoopDrawer(id){
  window._nodeClicked=true;
  const M=LOOPMETA[id];if(!M)return;
  const P='font-size:13px;color:var(--ink-2);line-height:1.65;margin:4px 0 8px';
  const nodes=Array.from(document.querySelectorAll('#archStage .cn')).filter(el=>(el.dataset.loop||'').split(' ').indexOf(id)>=0);
  const titles=[...new Set(nodes.map(_archTitle).filter(Boolean))];
  const _LD=_archTaskDetails(nodes,'포함 과제 상세');
  document.getElementById('drawerHead').innerHTML=
    '<span class="chip" style="background:'+M.c+';color:#fff">순환 · LOOP</span>'+
    '<h3><span style="color:'+M.c+'">'+M.en+'</span> · '+M.ko+'</h3>'+
    '<div class="owner" style="font-family:var(--mono);font-size:12px;color:var(--ink-3)">참여 컴포넌트 '+titles.length+'개</div>';
  document.getElementById('drawerBody').innerHTML=
    '<div class="dsec">개요</div><p style="'+P+'">'+M.desc+'</p>'+
    '<div class="dsec">순환 흐름</div><p style="'+P+'">'+M.flow+'</p>'+
    '<div class="dsec">참여 컴포넌트 ('+titles.length+')</div><ul>'+titles.map(t=>'<li>'+t+'</li>').join('')+'</ul>'+
    '<div class="dsec">핵심 통제</div><p style="'+P+'">'+M.note+'</p>'+_LD.html;
  _LD.tls.forEach(x=>{const c=document.getElementById(x.id);if(c)drawPhaseTimeline(c,x.t,x.g);});
  drawerCode='__loop_'+id;document.getElementById('drawer').classList.add('open');
}
function openTimelineDrawer(m){
  window._nodeClicked=true;
  const P='font-size:13px;color:var(--ink-2);line-height:1.65;margin:4px 0 8px';
  const C='#3d5a98';
  const all=Array.from(document.querySelectorAll('#archStage .cn[data-done]'));
  const due=all.filter(el=>+el.dataset.done===m);
  const cum=all.filter(el=>+el.dataset.done<=m);
  const fut=all.filter(el=>+el.dataset.done>m);
  const _TD=_archTaskDetails(due,'이번 달 완성 과제 상세');
  document.getElementById('drawerHead').innerHTML=
    '<span class="chip" style="background:'+C+';color:#fff">시점 · TIMELINE</span>'+
    '<h3><span style="color:'+C+'">2026 · '+m+'월</span> 마일스톤</h3>'+
    '<div class="owner" style="font-family:var(--mono);font-size:12px;color:var(--ink-3)">누적 '+cum.length+' / 전체 '+all.length+' · 이번 달 '+due.length+'개</div>';
  document.getElementById('drawerBody').innerHTML=
    '<div class="dsec">이번 달 개요</div><p style="'+P+'">'+(MONTHNOTE[m]||'')+'</p>'+
    '<div class="dsec">이번 달 완성 ('+due.length+')</div><ul>'+(due.length?due.map(e=>'<li>'+_archTitle(e)+'</li>').join(''):'<li style="color:var(--ink-3)">해당 없음</li>')+'</ul>'+
    '<div class="dsec">누적 완성 ('+cum.length+')</div><p style="'+P+'">'+(cum.map(_archTitle).join(' · ')||'—')+'</p>'+
    '<div class="dsec">예정 ('+fut.length+')</div><p style="'+P+'">'+(fut.map(_archTitle).join(' · ')||'모두 완료')+'</p>'+_TD.html;
  _TD.tls.forEach(x=>{const c=document.getElementById(x.id);if(c)drawPhaseTimeline(c,x.t,x.g);});
  drawerCode='__tl_'+m;document.getElementById('drawer').classList.add('open');
}
