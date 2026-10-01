/* =========================================================================
 * ax_arch.js - AI-HOS 아키텍처 탭 (자체 완결 모듈)
 *  · 데이터(노드·연결·순환·월별 시점) + 그리기 + 확대/이동 + 전체화면 + 사이드 패널
 *  · 전역은 window.axArch 하나만 만든다. (goalOf·openNode·closeDrawer 등 전역 덮어쓰기 없음)
 *  · 노드/과제칩 클릭 → 대시보드 공용 과제 상세 팝업(openTask)
 *  · 시점·순환 버튼 → 오른쪽 사이드 패널(#axaDrawer)
 *  · 대시보드 다크모드([data-theme=dark])와 탭 자체 어둡게 보기(발표용)를 지원
 * =======================================================================*/
(function(){
  'use strict';
  if(window.axArch) return;

  /* ───────────── 기본 데이터 ───────────── */
  var CW=2000, CH=1000;
  var GOAL_HEX={1:'#3d5a98',2:'#0e8c86',3:'#c1791d'};

  // 그룹(영역) - 원본 콘솔의 영역 코드·이름 그대로. 박스는 소속 노드 범위에서 자동 계산
  var GMETA={
    GOV:{t:'G1 · 거버넌스 · AI 운영위원회'},
    CAP:{t:'2-3 · CAP · 플랫폼 + Runtime(Control Plane)'},
    RPA:{t:'RPA · 2-2 · RAG · PREF · AGENT'},
    MODEL:{t:'2-1 · 모델 학습(오프라인) · Registry',pos:'b'},
    OPT:{t:'3-3 · 운영 최적화'},
    WB:{t:'2-3 · 2-4 · 승인 · Write-back · 감사'}
  };

  // 노드: 제목·부제·연결 과제(maps)는 원본 콘솔 그대로 (부제의 줄바꿈만 '·'로 이어 한 줄)
  var N={
    source:{x:14,y:300,w:176,h:72,out:1,ic:'server',c:'#6c7d8e',title:'원천 데이터',sub:'EMR·OCS·PACS·LIS·IoMT',lp:'data'},
    users:{x:14,y:780,w:176,h:78,out:1,ic:'users',c:'#2f9e6a',title:'현업 · Key Player',sub:'과제발굴·L3+ 30명',maps:['3-1']},
    llm:{x:1830,y:300,w:160,h:110,out:1,ic:'bolt',c:'#c1791d',title:'On-prem LLM',sub:'의료특화 FM',maps:['2-1','1-4'],lp:'perso model'},
    gpu:{x:1830,y:470,w:160,h:72,out:1,ic:'chip',c:'#c0492f',title:'GPU 하드웨어',sub:'AI 컴퓨팅 인프라',maps:['2-1']},

    gov1:{x:260,y:86,w:176,h:64,grp:'GOV',ic:'board',c:'#3d5a98',title:'전략·이행관리',sub:'AX 추진전략',maps:['1-1']},
    gov2:{x:452,y:86,w:176,h:64,grp:'GOV',ic:'shield',c:'#3d5a98',title:'표준·윤리·안전',sub:'가이드라인',maps:['1-2']},
    gov3:{x:644,y:86,w:176,h:64,grp:'GOV',ic:'gear',c:'#3d5a98',title:'KPI·성과·보상',sub:'12지표·보상',maps:['1-3']},
    gov4:{x:836,y:86,w:176,h:64,grp:'GOV',ic:'result',c:'#3d5a98',title:'검증·테스트베드',sub:'FM 실증·검증',maps:['2-4']},
    gov5:{x:1028,y:86,w:176,h:64,grp:'GOV',ic:'shield',c:'#3d5a98',title:'IAM·보안·감사·버전',sub:'Control Plane',maps:['2-4']},

    hub:{x:280,y:300,w:170,h:64,ic:'hub',c:'#0e8c86',title:'Connector Hub',sub:'Event Bus·수집',maps:['2-2'],lp:'data'},
    binder:{x:306,y:414,w:118,h:118,circ:1,ic:'data',c:'#0e8c86',title:'데이터 바인더',sub:'Semantic Fabric',maps:['2-2'],lp:'data'},
    catalog:{x:280,y:592,w:170,h:64,ic:'tag',c:'#0e8c86',title:'데이터 카탈로그',sub:'Provenance·품질',maps:['2-2'],lp:'data'},

    kb:{x:500,y:300,w:180,h:64,ic:'book',c:'#0e8c86',title:'Enterprise KB',sub:'지침·규정·SOP·심사',maps:['2-2'],lp:'data'},
    pctx:{x:500,y:420,w:180,h:64,ic:'data',c:'#0e8c86',title:'Patient Context',sub:'환자 실시간·조립',maps:['2-2'],lp:'data'},
    mcp_read:{x:500,y:540,w:180,h:64,ic:'plug',c:'#6c4bd8',title:'Read Gateway',sub:'EMR·PACS 조회',maps:['2-3'],lp:'data'},

    cab:{x:730,y:288,w:166,h:58,grp:'CAP',ic:'loop',c:'#0b6e6b',title:'CAB',sub:'Agent Builder',maps:['2-3']},
    cal:{x:908,y:288,w:166,h:58,grp:'CAP',ic:'board',c:'#0e8c86',title:'CAL',sub:'Library·30종',maps:['2-3']},
    rt_router:{x:730,y:352,w:166,h:58,grp:'CAP',ic:'fsm',c:'#3d5a98',title:'Router·Planner',sub:'요청 배정',maps:['2-3']},
    rt_flow:{x:908,y:352,w:166,h:58,grp:'CAP',ic:'loop',c:'#3d5a98',title:'Workflow·State',sub:'순서·재시도',maps:['2-3']},
    rt_policy:{x:730,y:416,w:166,h:58,grp:'CAP',ic:'shield',c:'#3d5a98',title:'Policy·IAM',sub:'권한 통제',maps:['2-3']},
    rt_valid:{x:908,y:416,w:166,h:58,grp:'CAP',ic:'result',c:'#3d5a98',title:'Validator',sub:'정확·안전 검증',maps:['2-3']},
    mwp:{x:730,y:502,w:344,h:84,grp:'CAP',hub:1,ic:'ui',c:'#0b6e6b',title:'MWP · My Workplace',sub:'개인 맞춤 업무환경 · CAP 중심',maps:['2-3']},

    magent:{x:500,y:690,w:200,h:64,ic:'spawn',c:'#0e8c86',title:'멀티에이전트',sub:'Orchestrator·Worker·Validator·A2A',maps:['2-3']},

    output:{x:908,y:690,w:166,h:60,grp:'WB',ic:'result',c:'#2f9e6a',title:'아웃풋',sub:'Agent Draft',maps:['3-3']},
    happroval:{x:908,y:786,w:166,h:60,grp:'WB',ic:'shield',c:'#c0492f',title:'Human Approval',sub:'의료진 검토·서명',maps:['2-3']},
    mcp_write:{x:908,y:882,w:166,h:60,grp:'WB',ic:'plug',c:'#6c4bd8',title:'Write-back Ctrl',sub:'의무기록·오더·처방',maps:['2-3']},
    audit:{x:660,y:884,w:160,h:58,grp:'WB',ic:'board',c:'#3d5a98',title:'Audit·Version',sub:'감사·버전 기록',maps:['2-4']},

    rag:{x:1180,y:262,w:116,h:56,grp:'RPA',ic:'graph',c:'#c1791d',title:'RAG',sub:'KB 검색',maps:['2-2'],tag:'R'},
    pref:{x:1306,y:262,w:116,h:56,grp:'RPA',ic:'gear',c:'#6c4bd8',title:'PREF',sub:'선호',maps:['2-2'],tag:'P'},
    agent:{x:1432,y:262,w:116,h:56,grp:'RPA',ic:'brain',c:'#6c4bd8',title:'AGENT',sub:'Memory',maps:['2-2'],tag:'A'},
    OE:{x:1180,y:362,w:210,h:64,ic:'mine',c:'#6c7d8e',title:'운영지능 (OE)',sub:'Event Log·Process Mining',maps:['3-3']},

    pipe:{x:1180,y:478,w:180,h:68,grp:'MODEL',ic:'gauge',c:'#c0492f',title:'학습 파이프라인',sub:'선별·비식별·라벨링·Gold',maps:['2-1']},
    lora:{x:1466,y:462,w:100,h:100,grp:'MODEL',circ:1,ic:'gear',c:'#6c4bd8',title:'LoRA',sub:'Adapter 학습',maps:['2-1'],tag:'L'},
    registry:{x:1640,y:478,w:160,h:68,grp:'MODEL',ic:'book',c:'#c0492f',title:'Model Registry',sub:'평가·버전·승인',maps:['2-4']},

    ooe:{x:1180,y:660,w:210,h:64,grp:'OPT',ic:'gauge',c:'#c1791d',title:'업무 최적화 엔진',sub:'로그 모니터링·최적화',maps:['3-3']},
    opt_wait:{x:1180,y:764,w:130,h:64,grp:'OPT',ic:'gauge',c:'#c1791d',title:'대기시간',sub:'외래·검사',maps:['3-3']},
    opt_res:{x:1320,y:764,w:130,h:64,grp:'OPT',ic:'users',c:'#c1791d',title:'자원배분',sub:'인력·장비',maps:['3-3']},
    opt_bed:{x:1460,y:764,w:130,h:64,grp:'OPT',ic:'board',c:'#c1791d',title:'병상·스케줄',sub:'회전',maps:['3-3']},
    opt_proc:{x:1600,y:764,w:130,h:64,grp:'OPT',ic:'fsm',c:'#c1791d',title:'프로세스',sub:'병목',maps:['3-3']}
  };

  // 완성 목표 월(2026) - 원본 그대로
  var DONE={source:8,users:12,llm:10,gpu:9,gov1:9,gov2:9,gov3:10,gov4:10,gov5:10,hub:9,binder:10,catalog:10,kb:10,pctx:11,mcp_read:11,cab:11,cal:11,rt_router:12,rt_flow:12,rt_policy:12,rt_valid:12,mwp:10,magent:11,output:12,happroval:12,mcp_write:12,audit:12,rag:11,pref:11,agent:11,OE:12,pipe:12,lora:12,registry:12,ooe:12,opt_wait:12,opt_res:12,opt_bed:12,opt_proc:12};

  // 연결 - 원본 콘솔의 연결·선 종류·라벨·순환(lp) 그대로. 겹침을 피하려고 경로(꺾는 위치·연결 지점)만 조정
  // as/bs 연결면(l r t b), ao/bo 면 위 위치 보정, mx/my 꺾는 위치, via 경유점
  var EDGES=[
    {a:'source',as:'r',b:'hub',bs:'l',t:'solid',l:'수집·연계',lp:'data'},
    {a:'hub',as:'b',b:'binder',bs:'t',t:'solid',l:'정규화',lp:'data'},
    {a:'hub',as:'r',b:'mcp_read',bs:'l',t:'solid',l:'실시간 조회',lp:'data',mx:470},
    {a:'binder',as:'r',b:'kb',bs:'l',t:'solid',l:'지식화',lp:'data',mx:485},
    {a:'binder',as:'b',b:'catalog',bs:'t',t:'solid',l:'품질·계보',lp:'data'},
    {a:'mcp_read',as:'t',b:'pctx',bs:'b',t:'solid',l:'환자 컨텍스트',lp:'data'},
    {a:'kb',as:'r',b:'mwp',bs:'l',t:'solid',l:'지식 참조',lp:'data',mx:698,bo:-20},
    {a:'pctx',as:'r',b:'mwp',bs:'l',t:'solid',l:'환자 사실',lp:'data',mx:714,bo:16},
    {a:'mwp',as:'b',b:'output',bs:'t',t:'solid',l:'임상 Draft',lp:'data',ao:89},
    {a:'output',as:'b',b:'happroval',bs:'t',t:'solid',l:'검토 요청',lp:'data'},
    {a:'happroval',as:'b',b:'mcp_write',bs:'t',t:'gate',l:'승인',lp:'data'},
    {a:'mcp_write',b:'source',t:'solid',l:'write-back',lp:'data',route:'writeback'},
    {a:'mcp_write',as:'l',b:'audit',bs:'r',t:'feed',l:'감사 기록',lp:'data'},
    {a:'gov5',as:'b',b:'happroval',bs:'r',t:'gate',l:'권한·감사',ao:-26},
    {a:'mwp',as:'r',b:'OE',bs:'l',t:'feed',l:'사용 로그',lp:'perso opt model',mx:1164,ao:30},
    {a:'OE',as:'t',b:'rag',bs:'b',t:'fb',l:'색인 갱신',lp:'perso',ao:-47},
    {a:'rag',as:'l',b:'mwp',bs:'r',t:'feed',l:'검색 증강',lp:'perso',mx:1110,bo:-34},
    {a:'pref',as:'b',b:'mwp',bs:'r',t:'feed',l:'개인화',lp:'perso',via:[[1364,336],[1122,336]],bo:-22},
    {a:'agent',as:'b',b:'mwp',bs:'r',t:'feed',l:'메모리',lp:'perso',via:[[1490,346],[1134,346]],bo:-10},
    {a:'llm',as:'l',b:'mwp',bs:'r',t:'solid',l:'추론 응답',lp:'perso model',mx:1146,ao:-30,bo:2},
    {a:'OE',as:'b',b:'pipe',bs:'t',t:'fb',l:'학습 후보',lp:'model',ao:-15},
    {a:'pipe',as:'r',b:'lora',bs:'l',t:'fb',l:'Gold DS 학습',lp:'model'},
    {a:'lora',as:'r',b:'registry',bs:'l',t:'solid',l:'평가·등록',lp:'model'},
    {a:'registry',as:'r',b:'llm',bs:'l',t:'solid',l:'검증 배포',lp:'model',mx:1815,bo:30},
    {a:'gpu',as:'t',b:'llm',bs:'b',t:'solid',l:'GPU'},
    {a:'gov4',as:'b',b:'registry',bs:'t',t:'gate',l:'모델 승인',my:200,bo:40},
    {a:'OE',as:'l',b:'ooe',bs:'l',t:'feed',l:'이벤트 마이닝',lp:'opt',mx:1170,ao:20,bo:-14},
    {a:'ooe',as:'b',b:'opt_wait',bs:'t',t:'fb',lp:'opt',my:744},
    {a:'ooe',as:'b',b:'opt_res',bs:'t',t:'fb',lp:'opt',my:744},
    {a:'ooe',as:'b',b:'opt_bed',bs:'t',t:'fb',lp:'opt',my:744},
    {a:'ooe',as:'b',b:'opt_proc',bs:'t',t:'fb',lp:'opt',my:744},
    {a:'ooe',as:'l',b:'mwp',bs:'r',t:'solid',l:'최적화 반영',lp:'opt',mx:1098,ao:14,bo:24},
    {a:'gov2',as:'b',b:'cab',bs:'l',t:'gate',l:'거버넌스 게이트',via:[[540,221],[714,221]]},
    {a:'cab',as:'r',b:'cal',bs:'l',t:'solid'},
    {a:'cal',as:'b',b:'rt_flow',bs:'t',t:'solid'},
    {a:'rt_valid',as:'b',b:'mwp',bs:'t',t:'solid',bo:89},
    {a:'mwp',as:'b',b:'magent',bs:'t',t:'solid',l:'실행',ao:-122}
  ];

  // 순환 - 원본 문구 그대로. 흐름(flow)만 단계로 나눠 보여준다
  var LOOPS={
    data:{c:'#0e8c86',en:'Data Flywheel',ko:'데이터 순환',lp:'수집·정제·Write-back',
      desc:'원천 시스템의 데이터를 수집·정규화·의미화하여 에이전트가 활용하고, 그 결과를 승인 절차를 거쳐 다시 기록으로 되돌리는 순환입니다. 쓸수록 데이터 자산이 축적됩니다.',
      flow:'원천데이터 → Connector Hub → 데이터 바인더(Semantic) → 카탈로그 · Enterprise KB · Patient Context → MWP → 아웃풋(Draft) → Human Approval → Write-back Controller → 원천(기록 반영) · Audit',
      note:'쓰기는 반드시 Human Approval → Write-back Controller → Audit 통제를 거칩니다. Read/Write Gateway는 분리되어 있습니다.'},
    perso:{c:'#6c4bd8',en:'Context Engineering',ko:'개인화',lp:'RAG·PREF·Memory',
      desc:'사용자의 선택·선호·업무 맥락을 RAG·PREF·Memory로 조립해 즉시 다음 응답에 반영하는 빠른 루프입니다. 모델 가중치는 바꾸지 않습니다.',
      flow:'MWP(사용) → 운영지능(OE) → RAG · PREF · AGENT 갱신 → MWP 즉시 반영 (On-prem LLM 추론 응답 결합)',
      note:'실시간 개인화는 Context Engineering으로 처리하고, 모델 학습(LoRA)과 분리합니다.'},
    model:{c:'#c0492f',en:'Continual Learning',ko:'모델 학습',lp:'LoRA·Registry',
      desc:'검증된 데이터만 오프라인으로 학습하는, 가장 느리고 통제된 루프입니다. 운영 로그를 그대로 학습하지 않습니다.',
      flow:'운영지능(OE) → 학습 파이프라인(선별 · 비식별 · 라벨링 · Gold) → LoRA 학습 → Model Registry(평가 · 버전 · 승인) → On-prem LLM 배포',
      note:'검증위원회 승인과 Model Registry 등록을 거친 뒤에만 단계적으로 배포됩니다.'},
    opt:{c:'#c1791d',en:'Process Intelligence',ko:'운영 최적화',lp:'Process Mining',
      desc:'업무 이벤트 로그를 Process Mining으로 분석해 병목 · 대기 · 자원배분을 개선하는 루프입니다. 자동 변경이 아니라 개선안을 제시합니다.',
      flow:'MWP → 운영지능(OE) → 업무 최적화 엔진 → 대기시간 · 자원배분 · 병상 · 프로세스 개선안 → MWP 반영',
      note:'개선안은 거버넌스 승인 후 반영하는 것을 원칙으로 합니다.'}
  };
  var MONTHNOTE={
    8:'데이터 파이프라인 착수 - 원천 시스템 연계를 시작합니다.',
    9:'수집 · 연계 · GPU · 거버넌스의 기본 골격을 세웁니다.',
    10:'데이터 계층 · 지식화 · 검증 체계와 MWP 중심 골격이 완성됩니다.',
    11:'개인화(RPA) · Patient Context · Read Gateway와 에이전트 제작/배포가 이뤄집니다.',
    12:'CAP Runtime · 모델 학습 루프 · Write-back/감사 · 운영 최적화까지 전체가 가동됩니다.'
  };
  // 순환 참여 = 원본처럼 연결(lp)에서 계산
  (function(){ EDGES.forEach(function(e){ (e.lp||'').split(' ').filter(Boolean).forEach(function(L){ [e.a,e.b].forEach(function(id){ var n=N[id]; var a=(n.lp||'').split(' ').filter(Boolean); if(a.indexOf(L)<0){ a.push(L); n.lp=a.join(' '); } }); }); }); })();
  var MONTHS=[8,9,10,11,12];

  var IC={
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

  /* ───────────── 공용 도우미 ───────────── */
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function goalNo(code){ return parseInt(String(code||'').charAt(0),10)||1; }
  function TASKS_(){ try{ if(typeof TASKS!=='undefined') return TASKS; }catch(e){} return []; }
  function taskOf(code){ return TASKS_().filter(function(t){return t.id===code;})[0]||null; }
  function openTaskSafe(code){
    if(!taskOf(code)) return;
    closeDrawer();
    try{ if(typeof window.openTask==='function') window.openTask(code); }catch(e){ console.warn('[ax-arch] openTask',e&&e.message); }
  }
  function textW(s,px){ // 라벨 폭 추정 (한글은 글자 크기만큼, 영문·기호는 0.6배)
    var w=0; for(var i=0;i<s.length;i++){ var c=s.charCodeAt(i); w+= (c>0x3000)? px : (c===32? px*0.32 : px*0.6); } return w;
  }
  function chipHtml(code,big){
    var t=taskOf(code);
    return '<button type="button" class="axa-chip g'+goalNo(code)+(big?' big':'')+'" data-code="'+esc(code)+'" title="'+esc(t?t.title:code)+'">'+esc(code)+'</button>';
  }

  /* ───────────── 그리기 ───────────── */
  function buildStage(){
    // 그룹 박스
    var GB={};
    Object.keys(N).forEach(function(id){ var n=N[id]; if(!n.grp) return;
      var g=GB[n.grp]=GB[n.grp]||{x1:1e9,y1:1e9,x2:-1e9,y2:-1e9};
      g.x1=Math.min(g.x1,n.x); g.y1=Math.min(g.y1,n.y); g.x2=Math.max(g.x2,n.x+n.w); g.y2=Math.max(g.y2,n.y+n.h); });
    var groups=Object.keys(GB).map(function(k){ var g=GB[k];
      var bt=GMETA[k].pos==='b'; return {k:k,t:GMETA[k].t,pos:GMETA[k].pos,x:g.x1-14,y:g.y1-(bt?14:30),w:(g.x2-g.x1)+28,h:(g.y2-g.y1)+(bt?44:44)}; });
    // AI-HOS 경계
    var b={x1:1e9,y1:1e9,x2:-1e9,y2:-1e9};
    Object.keys(N).forEach(function(id){ var n=N[id]; if(n.out) return;
      b.x1=Math.min(b.x1,n.x); b.y1=Math.min(b.y1,n.y); b.x2=Math.max(b.x2,n.x+n.w); b.y2=Math.max(b.y2,n.y+n.h); });
    var BD={x:b.x1-30,y:b.y1-56,w:(b.x2-b.x1)+60,h:(b.y2-b.y1)+86};

    // 라벨이 피해야 할 영역: 노드 + 그룹 제목
    var obst=[];
    Object.keys(N).forEach(function(id){ var n=N[id]; obst.push({x:n.x-4,y:n.y-4,w:n.w+8,h:n.h+8}); });
    groups.forEach(function(g){ var tw=textW(g.t,12.5)+16; obst.push({x:g.x+6,y:g.pos==='b'?g.y+g.h-24:g.y+4,w:tw,h:20}); });
    obst.push({x:BD.x+BD.w-110,y:BD.y+6,w:100,h:22});
    function hit(r){ for(var i=0;i<obst.length;i++){ var o=obst[i]; if(r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y) return true; } return r.x<2||r.y<2||r.x+r.w>CW-2||r.y+r.h>CH-2; }

    function anchor(n,s,off){ off=off||0; var cx=n.x+n.w/2, cy=n.y+n.h/2;
      if(s==='r') return {x:n.x+n.w,y:cy+off,nx:1,ny:0};
      if(s==='l') return {x:n.x,y:cy+off,nx:-1,ny:0};
      if(s==='t') return {x:cx+off,y:n.y,nx:0,ny:-1};
      return {x:cx+off,y:n.y+n.h,nx:0,ny:1}; }
    function ortho(p,q,e){ var s=16, p1={x:p.x+p.nx*s,y:p.y+p.ny*s}, q1={x:q.x+q.nx*s,y:q.y+q.ny*s}, pts=[{x:p.x,y:p.y},p1];
      if(p.nx!==0){ if(q.nx!==0){ var mx=(e.mx!=null)?e.mx:(p1.x+q1.x)/2; pts.push({x:mx,y:p1.y},{x:mx,y:q1.y}); } else pts.push({x:q1.x,y:p1.y}); }
      else { if(q.ny!==0){ var my=(e.my!=null)?e.my:(p1.y+q1.y)/2; pts.push({x:p1.x,y:my},{x:q1.x,y:my}); } else pts.push({x:p1.x,y:q1.y}); }
      pts.push(q1,{x:q.x,y:q.y});
      // 같은 점·일직선 정리
      var out=[]; pts.forEach(function(pt){ var L=out[out.length-1]; if(L&&Math.abs(L.x-pt.x)<.5&&Math.abs(L.y-pt.y)<.5) return; out.push(pt); });
      var res=[out[0]]; for(var i=1;i<out.length-1;i++){ var a=res[res.length-1],c=out[i],d=out[i+1]; if((Math.abs(a.x-c.x)<.5&&Math.abs(c.x-d.x)<.5)||(Math.abs(a.y-c.y)<.5&&Math.abs(c.y-d.y)<.5)) continue; res.push(c); } res.push(out[out.length-1]);
      return res; }

    var wires='', labels='', LBLPX=12.5;
    EDGES.forEach(function(e,ei){
      var A=N[e.a], B=N[e.b], pts;
      if(e.route==='writeback'){ var y0=A.y+A.h/2, low=CH-22, sx=B.x, sy=B.y+B.h/2;
        pts=[{x:A.x,y:y0},{x:A.x-18,y:y0},{x:A.x-18,y:low},{x:8,y:low},{x:8,y:sy},{x:sx,y:sy}]; }
      else if(e.via){ var pa=anchor(A,e.as,e.ao), pb=anchor(B,e.bs,e.bo);
        pts=[{x:pa.x,y:pa.y}].concat(e.via.map(function(v){return {x:v[0],y:v[1]};})).concat([{x:e.via[e.via.length-1][0],y:pb.y},{x:pb.x,y:pb.y}]); }
      else pts=ortho(anchor(A,e.as,e.ao),anchor(B,e.bs,e.bo),e);
      var lp=e.lp||'', am=Math.max(DONE[e.a]||0,DONE[e.b]||0);
      wires+='<polyline class="axa-w t-'+e.t+'" data-am="'+am+'" data-lp="'+lp+'" points="'+pts.map(function(o){return o.x.toFixed(0)+','+o.y.toFixed(0);}).join(' ')+'" marker-end="url(#axa-m-'+e.t+')"/>';
      if(!e.l) return;
      // 라벨 자리 찾기: 긴 구간부터, 구간 위 여러 지점 → 선 위/옆으로 비켜서
      var lw=textW(e.l,LBLPX)+14, lh=20, segs=[];
      for(var i=0;i<pts.length-1;i++){ var a=pts[i],c=pts[i+1]; segs.push({a:a,c:c,len:Math.abs(a.x-c.x)+Math.abs(a.y-c.y),h:Math.abs(a.y-c.y)<.5}); }
      segs.sort(function(s1,s2){return s2.len-s1.len;});
      var spot=null, ts=[.5,.35,.65,.2,.8];
      for(var si=0;si<segs.length&&!spot;si++){ var sg=segs[si];
        for(var ti=0;ti<ts.length&&!spot;ti++){ var mx=sg.a.x+(sg.c.x-sg.a.x)*ts[ti], my=sg.a.y+(sg.c.y-sg.a.y)*ts[ti];
          var cands=sg.h? [[0,0],[0,-15],[0,15]] : [[0,0],[lw/2+6,0],[-lw/2-6,0]];
          for(var k=0;k<cands.length;k++){ var r={x:mx+cands[k][0]-lw/2,y:my+cands[k][1]-lh/2,w:lw,h:lh};
            if(sg.h&&r.w>sg.len-10&&k===0) continue;
            if(!hit(r)){ spot=r; break; } } } }
      if(!spot){ var s0=segs[0]; var mx0=(s0.a.x+s0.c.x)/2,my0=(s0.a.y+s0.c.y)/2; spot={x:mx0-lw/2,y:my0-lh/2,w:lw,h:lh}; }
      obst.push(spot);
      labels+='<g class="axa-lb" data-am="'+am+'" data-lp="'+lp+'"><rect x="'+spot.x.toFixed(0)+'" y="'+spot.y.toFixed(0)+'" width="'+lw.toFixed(0)+'" height="'+lh+'" rx="5"/><text x="'+(spot.x+lw/2).toFixed(0)+'" y="'+(spot.y+14).toFixed(0)+'" text-anchor="middle">'+esc(e.l)+'</text></g>';
    });
    var defs='<defs>'+['solid','feed','fb','gate'].map(function(k){return '<marker id="axa-m-'+k+'" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path class="mk-'+k+'" d="M0,0 L5,2.5 L0,5 Z"/></marker>';}).join('')+'</defs>';

    var html='<div class="axa-bd" style="left:'+BD.x+'px;top:'+BD.y+'px;width:'+BD.w+'px;height:'+BD.h+'px"></div><div class="axa-bd-lb" style="left:'+(BD.x+BD.w-104)+'px;top:'+(BD.y+8)+'px">AI-HOS</div>';
    groups.forEach(function(g){
      html+='<div class="axa-grp" style="left:'+g.x+'px;top:'+g.y+'px;width:'+g.w+'px;height:'+g.h+'px"></div>'+
        '<div class="axa-grp-t" style="left:'+(g.x+12)+'px;top:'+(g.pos==='b'?g.y+g.h-22:g.y+6)+'px">'+esc(g.t)+'</div>';
    });
    Object.keys(N).forEach(function(id){ var n=N[id], maps=n.maps||[];
      html+='<div class="axa-n'+(n.hub?' hub':'')+(n.circ?' circ':'')+(n.tag?' rpal':'')+(n.out?' out':'')+(maps.length?' click':'')+'" data-id="'+id+'" data-done="'+DONE[id]+'" data-lp="'+(n.lp||'')+'"'+
        (maps.length?' data-code="'+maps[0]+'" tabindex="0" role="button" aria-label="'+esc(n.title)+' - 과제 '+maps.join(', ')+' 상세 열기"':'')+
        ' style="left:'+n.x+'px;top:'+n.y+'px;width:'+n.w+'px;height:'+n.h+'px">'+
        (n.tag?'<span class="axa-tag">RPAL·'+n.tag+'</span>':'')+
        '<div class="axa-nh"><span class="axa-ic"><svg viewBox="0 0 24 24" fill="none" stroke="'+n.c+'" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(IC[n.ic]||IC.board)+'</svg></span><b>'+esc(n.title)+'</b></div>'+
        '<div class="axa-ns">'+esc(n.sub)+'</div>'+
        (maps.length?'<div class="axa-chips">'+maps.map(function(c){return chipHtml(c);}).join('')+'</div>':'')+
        '</div>';
    });
    return '<svg class="axa-svg" width="'+CW+'" height="'+CH+'" viewBox="0 0 '+CW+' '+CH+'">'+defs+wires+labels+'</svg>'+html;
  }

  /* ───────────── 화면 골격 ───────────── */
  var state={month:null,loop:null,dark:false};
  try{ state.dark=localStorage.getItem('ax_arch_dark')==='1'; }catch(e){}

  function shellHtml(){
    var cnt={}; Object.keys(DONE).forEach(function(k){ cnt[DONE[k]]=(cnt[DONE[k]]||0)+1; });
    return ''+
    '<div class="axa-root'+(state.dark?' dark':'')+'" id="axaRoot">'+
      '<div class="axa-head">'+
        '<div class="axa-tt"><div class="axa-eyebrow">Narrative · 05 / AI Hospital Operating System</div><h2>AI-HOS 아키텍처</h2>'+
          '<p class="axa-lede"><b>AI-HOS 경계</b> 안에 거버넌스·데이터 계층·<b>CAP + Runtime</b>·<b>Context Engineering</b>(개인화·RPA)·<b>Continual Learning</b>(모델·오프라인)·<b>Process Intelligence</b>(운영)가 배치되고, 외부로 원천데이터·현업·On-prem LLM·GPU가 연결됩니다.</p></div>'+
        '<div class="axa-bar">'+
          '<div class="axa-seg-g"><div class="axa-track">'+MONTHS.map(function(m){return '<button type="button" class="axa-seg" data-m="'+m+'">'+m+'월<span>'+(cnt[m]||0)+'개</span></button>';}).join('')+'</div>'+
            '<button type="button" class="axa-all">전체 보기</button></div>'+
          '<div class="axa-seg-g"><span class="axa-lbl">순환</span>'+Object.keys(LOOPS).map(function(k){var L=LOOPS[k];return '<button type="button" class="axa-loop" data-loop="'+k+'" style="--lc:'+L.c+'"><b>'+esc(L.en)+'</b><span>'+esc(L.lp)+'</span></button>';}).join('')+'</div>'+
          '<div class="axa-tools"><button type="button" class="axa-tool axa-dark-btn" title="어둡게 보기 (발표용)">'+(state.dark?'☀ 밝게':'☾ 어둡게')+'</button><button type="button" class="axa-tool axa-fs-btn" title="전체화면 (F)">⛶ 전체화면</button></div>'+
        '</div>'+
      '</div>'+
      '<div class="axa-vp" id="axaVp"><div class="axa-stage" id="axaStage" style="width:'+CW+'px;height:'+CH+'px">'+buildStage()+'</div>'+
        '<div class="axa-zoom"><button type="button" data-z="in" aria-label="확대">+</button><button type="button" data-z="out" aria-label="축소">−</button><button type="button" data-z="fit" aria-label="화면에 맞춤">⟲</button></div>'+
      '</div>'+
      '<div class="axa-legend"><span>시점=완성 노드 · 순환=loop 흐름</span><span class="sep">|</span><span>Ctrl+휠: 줌 · 드래그: 이동 · ⟲: 맞춤 · F: 전체화면</span></div>'+
    '</div>';
  }

  /* ───────────── 확대·이동 ───────────── */
  var view={s:1,tx:0,ty:0};
  function applyT(){ var st=document.getElementById('axaStage'); if(st) st.style.transform='translate('+view.tx+'px,'+view.ty+'px) scale('+view.s+')'; }
  function clampS(v){ return Math.min(2.6,Math.max(.3,v)); }
  function sizeVp(){ var vp=document.getElementById('axaVp'), r=document.getElementById('axaRoot'); if(!vp||!r) return;
    if(r.classList.contains('fs')){ vp.style.height=''; return; }
    var lg=r.querySelector('.axa-legend'), top=vp.getBoundingClientRect().top+window.scrollY;
    vp.style.height=Math.max(560, window.innerHeight-top-(lg?lg.offsetHeight:0)-18)+'px'; }
  function fit(){ sizeVp(); var vp=document.getElementById('axaVp'); if(!vp||!vp.clientWidth) return;
    var vw=vp.clientWidth-60, vh=vp.clientHeight-8; view.s=clampS(Math.min(vw/CW,vh/CH)); view.tx=Math.max(4,(vw-CW*view.s)/2); view.ty=Math.max(4,(vh-CH*view.s)/2); applyT(); }
  function zoomAt(mx,my,ns){ ns=clampS(ns); view.tx=mx-(mx-view.tx)*(ns/view.s); view.ty=my-(my-view.ty)*(ns/view.s); view.s=ns; applyT(); }
  function bindPanZoom(vp){
    var drag=false,moved=false,lx=0,ly=0;
    vp.addEventListener('wheel',function(e){ if(!(e.ctrlKey||e.metaKey)) return; e.preventDefault(); var r=vp.getBoundingClientRect(); zoomAt(e.clientX-r.left,e.clientY-r.top,view.s*(e.deltaY<0?1.12:.892)); },{passive:false});
    vp.addEventListener('mousedown',function(e){ if(e.target.closest('.axa-zoom')) return; drag=true;moved=false;lx=e.clientX;ly=e.clientY; });
    window.addEventListener('mousemove',function(e){ if(!drag) return; var dx=e.clientX-lx,dy=e.clientY-ly; if(Math.abs(dx)+Math.abs(dy)>3) moved=true; view.tx+=dx; view.ty+=dy; lx=e.clientX; ly=e.clientY; applyT(); });
    window.addEventListener('mouseup',function(){ drag=false; });
    vp.addEventListener('click',function(e){ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } },true);
    vp.querySelector('.axa-zoom').addEventListener('click',function(e){ var bt=e.target.closest('button'); if(!bt) return;
      if(bt.dataset.z==='fit'){ fit(); return; } zoomAt(vp.clientWidth/2,vp.clientHeight/2,view.s*(bt.dataset.z==='in'?1.2:.83)); });
  }

  /* ───────────── 시점·순환 강조 ───────────── */
  function applyFilter(){
    var st=document.getElementById('axaStage'); if(!st) return;
    var m=state.month, L=state.loop;
    st.classList.toggle('filtering',m!==null||L!==null);
    st.querySelectorAll('.axa-n').forEach(function(el){
      el.classList.remove('due','past','future','on','off');
      if(m!==null){ var d=+el.dataset.done; el.classList.add(d===m?'due':(d<m?'past':'future')); }
      else if(L){ el.classList.add((' '+el.dataset.lp+' ').indexOf(' '+L+' ')>=0?'on':'off'); }
    });
    st.querySelectorAll('.axa-w,.axa-lb').forEach(function(el){
      var on=true;
      if(m!==null) on=(+el.dataset.am<=m);
      else if(L) on=(' '+el.dataset.lp+' ').indexOf(' '+L+' ')>=0;
      el.classList.toggle('dim',!on); el.classList.toggle('lit',(m!==null)?(+el.dataset.am===m):(on&&!!L));
      el.classList.toggle('faint',m!==null&&on&&+el.dataset.am<m);
    });
    if(L) st.style.setProperty('--loopc',LOOPS[L].c); else st.style.removeProperty('--loopc');
    var root=document.getElementById('axaRoot'); if(!root) return;
    root.querySelectorAll('.axa-seg').forEach(function(s){ var mm=+s.dataset.m; s.classList.toggle('sel',m===mm); s.classList.toggle('past',m!==null&&mm<m); });
    root.querySelectorAll('.axa-loop').forEach(function(b){ b.classList.toggle('sel',b.dataset.loop===L); });
    root.querySelector('.axa-all').classList.toggle('sel',m===null&&!L);
  }
  function selectMonth(m){ state.loop=null; state.month=(state.month===m)?null:m; applyFilter(); if(state.month===null) closeDrawer(); else openMonthDrawer(m); }
  function selectLoop(k){ state.month=null; state.loop=(state.loop===k)?null:k; applyFilter(); if(!state.loop) closeDrawer(); else openLoopDrawer(k); }
  function clearAll(){ state.month=null; state.loop=null; applyFilter(); closeDrawer(); }

  /* ───────────── 사이드 패널 ───────────── */
  function drawerEl(){
    var d=document.getElementById('axaDrawer');
    if(!d){ d=document.createElement('aside'); d.id='axaDrawer'; d.className='axa-drawer'; d.setAttribute('aria-hidden','true');
      d.innerHTML='<button type="button" class="axa-dx" aria-label="닫기">×</button><div class="axa-dhead"></div><div class="axa-dbody"></div>';
      document.body.appendChild(d);
      d.querySelector('.axa-dx').onclick=function(){ clearAll(); };
      d.addEventListener('click',function(e){ var c=e.target.closest('[data-code]'); if(c){ e.preventDefault(); openTaskSafe(c.dataset.code); return; }
        var f=e.target.closest('[data-focus]'); if(f) pulse(f.dataset.focus.split(',')); });
    }
    d.classList.toggle('dark',state.dark);
    return d;
  }
  function openDrawer(head,body){ var d=drawerEl(); d.querySelector('.axa-dhead').innerHTML=head; d.querySelector('.axa-dbody').innerHTML=body; d.scrollTop=0; d.classList.add('open'); d.setAttribute('aria-hidden','false'); setDrOn(true); }
  function closeDrawer(){ var d=document.getElementById('axaDrawer'); if(d){ d.classList.remove('open'); d.setAttribute('aria-hidden','true'); } setDrOn(false); }
  // 패널이 열리면 도구줄·그림이 패널 밑에 깔리지 않게 오른쪽 자리를 비우고 다시 맞춘다
  function setDrOn(on){ if(document.body.classList.contains('axa-dr-on')===on) return; document.body.classList.toggle('axa-dr-on',on); setTimeout(fit,280); }
  function pulse(ids){ var st=document.getElementById('axaStage'); if(!st) return;
    ids.forEach(function(id){ var el=st.querySelector('.axa-n[data-id="'+id+'"]'); if(!el) return; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }); }

  function codesOf(ids){ var s={}; ids.forEach(function(id){ (N[id].maps||[]).forEach(function(c){ s[c]=1; }); }); return Object.keys(s).sort(); }
  function taskRows(codes){
    if(!codes.length) return '<p class="axa-muted">연결된 과제가 없어요.</p>';
    return '<div class="axa-trows">'+codes.map(function(c){ var t=taskOf(c);
      return '<button type="button" class="axa-trow" data-code="'+esc(c)+'"><span class="axa-chip g'+goalNo(c)+'">'+esc(c)+'</span><span class="tt">'+esc(t?t.title:'')+'</span><span class="go">상세 ›</span></button>'; }).join('')+'</div>';
  }
  function grpName(id){ var n=N[id]; if(n.grp) return GMETA[n.grp].t; if(n.out) return 'AI-HOS 밖'; if(/^(hub|binder|catalog|kb|pctx|mcp_read)$/.test(id)) return '데이터 계층'; return '기타'; }

  function openMonthDrawer(m){
    var ids=Object.keys(DONE), due=ids.filter(function(i){return DONE[i]===m;}), cum=ids.filter(function(i){return DONE[i]<=m;}), fut=ids.filter(function(i){return DONE[i]>m;});
    var pct=Math.round(cum.length/ids.length*100);
    function byGroup(list,cls){ var g={}; list.forEach(function(id){ (g[grpName(id)]=g[grpName(id)]||[]).push(id); });
      return Object.keys(g).map(function(k){ return '<div class="axa-gl">'+esc(k)+'</div><div class="axa-items">'+g[k].map(function(id){ return '<button type="button" class="axa-item'+(cls?' '+cls:'')+'" data-focus="'+id+'">'+esc(N[id].title)+'</button>'; }).join('')+'</div>'; }).join(''); }
    var head='<span class="axa-dk" style="--k:#3d5a98">시점 · TIMELINE</span><h3>2026 · '+m+'월 마일스톤</h3>'+
      '<div class="axa-prog"><div class="bar"><i style="width:'+pct+'%"></i></div><span>누적 <b>'+cum.length+'</b> / 전체 '+ids.length+' · 이번 달 '+due.length+'개</span></div>';
    var body='<section><h4>이번 달 개요</h4><p>'+esc(MONTHNOTE[m]||'')+'</p></section>'+
      '<section><h4>이번 달 완성 <em>'+due.length+'</em></h4>'+(due.length?byGroup(due):'<p class="axa-muted">해당 없음</p>')+'</section>'+
      '<section><h4>이번 달 완성 과제 <em>'+codesOf(due).length+'</em></h4>'+taskRows(codesOf(due))+'</section>'+
      '<section><h4>누적 완성 <em>'+cum.length+'</em></h4>'+byGroup(cum,'ghost')+'</section>'+
      '<section><h4>예정 <em>'+fut.length+'</em></h4>'+(fut.length?byGroup(fut,'ghost'):'<p class="axa-muted">모두 완료</p>')+'</section>';
    openDrawer(head,body);
  }
  function openLoopDrawer(k){
    var L=LOOPS[k], ids=Object.keys(N).filter(function(id){ return (' '+(N[id].lp||'')+' ').indexOf(' '+k+' ')>=0; });
    var head='<span class="axa-dk" style="--k:'+L.c+'">순환 · LOOP</span><h3><span style="color:'+L.c+'">'+esc(L.en)+'</span> · '+esc(L.ko)+'</h3><div class="axa-dsub">참여 컴포넌트 '+ids.length+'개</div>';
    var body='<section><h4>개요</h4><p>'+esc(L.desc)+'</p></section>'+
      '<section><h4>순환 흐름</h4><ol class="axa-steps" style="--k:'+L.c+'">'+L.flow.split(' → ').map(function(s){ return '<li><b>'+esc(s)+'</b></li>'; }).join('')+'</ol></section>'+
      '<section class="axa-rule" style="--k:'+L.c+'"><h4>핵심 통제</h4><p>'+esc(L.note)+'</p></section>'+
      '<section><h4>참여 컴포넌트 <em>'+ids.length+'</em></h4><div class="axa-items">'+ids.map(function(id){ return '<button type="button" class="axa-item" data-focus="'+id+'">'+esc(N[id].title)+'</button>'; }).join('')+'</div></section>'+
      '<section><h4>포함 과제 <em>'+codesOf(ids).length+'</em></h4>'+taskRows(codesOf(ids))+'</section>';
    openDrawer(head,body);
  }

  /* ───────────── 전체화면 ───────────── */
  function isFs(){ var r=document.getElementById('axaRoot'); return !!(r&&r.classList.contains('fs')); }
  function setFs(on){
    var r=document.getElementById('axaRoot'); if(!r) return;
    r.classList.toggle('fs',on); document.body.classList.toggle('axa-fs-on',on);
    var b=r.querySelector('.axa-fs-btn'); if(b) b.textContent=on?'⤡ 전체화면 종료':'⛶ 전체화면';
    // 문서 전체를 브라우저 전체화면으로 → 과제 팝업·사이드 패널이 그대로 위에 뜬다
    try{
      if(on&&!document.fullscreenElement&&document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function(){});
      if(!on&&document.fullscreenElement&&document.exitFullscreen) document.exitFullscreen().catch(function(){});
    }catch(e){}
    setTimeout(fit,80);
  }
  document.addEventListener('fullscreenchange',function(){ if(!document.fullscreenElement&&isFs()) setFs(false); else setTimeout(fit,80); });
  document.addEventListener('keydown',function(e){
    var v=document.getElementById('v-arch'); if(!v||!v.classList.contains('active')) return;
    var tg=e.target; if(tg&&(/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)||tg.isContentEditable)) return;
    var ov=document.getElementById('overlay'); if(ov&&ov.classList.contains('open')) return;
    if((e.key==='f'||e.key==='F')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){ e.preventDefault(); setFs(!isFs()); }
    else if(e.key==='Escape'){ var d=document.getElementById('axaDrawer'); if(d&&d.classList.contains('open')) clearAll(); else if(isFs()) setFs(false); }
  });
  window.addEventListener('resize',function(){ var v=document.getElementById('v-arch'); if(v&&v.classList.contains('active')) fit(); });

  function setDark(on){ state.dark=on; try{ localStorage.setItem('ax_arch_dark',on?'1':'0'); }catch(e){}
    var r=document.getElementById('axaRoot'); if(r){ r.classList.toggle('dark',on); var b=r.querySelector('.axa-dark-btn'); if(b) b.textContent=on?'☀ 밝게':'☾ 어둡게'; }
    var d=document.getElementById('axaDrawer'); if(d) d.classList.toggle('dark',on); }

  /* ───────────── 탭·뷰 주입 ───────────── */
  var rendered=false;
  function render(){
    var v=document.getElementById('v-arch'); if(!v) return;
    if(!rendered){
      v.innerHTML='<div class="wrap axa-wrap">'+shellHtml()+'</div>';
      var root=document.getElementById('axaRoot'), vp=document.getElementById('axaVp'), st=document.getElementById('axaStage');
      bindPanZoom(vp);
      root.querySelectorAll('.axa-seg').forEach(function(s){ s.onclick=function(){ selectMonth(+s.dataset.m); }; });
      root.querySelector('.axa-all').onclick=clearAll;
      root.querySelectorAll('.axa-loop').forEach(function(b){ b.onclick=function(){ selectLoop(b.dataset.loop); }; });
      root.querySelector('.axa-fs-btn').onclick=function(){ setFs(!isFs()); };
      root.querySelector('.axa-dark-btn').onclick=function(){ setDark(!state.dark); };
      st.addEventListener('click',function(e){
        var chip=e.target.closest('.axa-chip'); if(chip){ e.stopPropagation(); openTaskSafe(chip.dataset.code); return; }
        var n=e.target.closest('.axa-n.click'); if(n) openTaskSafe(n.dataset.code);
      });
      st.addEventListener('keydown',function(e){ if(e.key!=='Enter'&&e.key!==' ') return; var n=e.target.closest('.axa-n.click'); if(n){ e.preventDefault(); openTaskSafe(n.dataset.code); } });
      rendered=true; applyFilter();
    }
    requestAnimationFrame(function(){ fit(); });
  }
  function ensureView(){
    if(document.getElementById('v-arch')) return true;
    var ref=document.getElementById('v-overview'); if(!ref||!ref.parentNode) return false;
    var sec=document.createElement('section'); sec.className='view'; sec.id='v-arch'; ref.parentNode.appendChild(sec); return true;
  }
  function ensureTab(){
    var bar=document.getElementById('tabbar'); if(!bar) return false;
    var tab=bar.querySelector('.tab[data-t="arch"]');
    if(!tab){ tab=document.createElement('div'); tab.className='tab'; tab.setAttribute('data-t','arch'); tab.title='AI-HOS 아키텍처'; tab.textContent='🧭 AI-HOS 아키텍처'; bar.appendChild(tab); }
    if(!tab.__axa){ tab.__axa=1; tab.addEventListener('click',function(){ try{ if(typeof switchTab==='function') switchTab('arch',tab); }catch(e){} render(); }); }
    return true;
  }
  // 다른 탭으로 가면 전체화면·패널 정리
  document.addEventListener('click',function(e){ var t=e.target.closest('#tabbar .tab'); if(t&&t.getAttribute('data-t')!=='arch'){ if(isFs()) setFs(false); closeDrawer(); } },true);

  /* ───────────── 스타일 ───────────── */
  function injectCss(){
    if(document.getElementById('axaCss')) return;
    var st=document.createElement('style'); st.id='axaCss';
    st.textContent=[
      '#v-arch .axa-wrap{max-width:none;padding:0 18px}',
      '.axa-root{--ink:#0f2133;--ink2:#2f4256;--ink3:#4f6276;--line:#b7c4d1;--line2:#d3dde6;--card:#fff;--canvas:#e3e9f0;--panel:#fff;--grp:rgba(255,255,255,.55);--grpb:#c3cfdb;',
        '--w-solid:#4a5e70;--w-feed:#9aa8b6;--w-fb:#6c4bd8;--w-gate:#3d5a98;--lb-bg:#fff;--lb-tx:#1f3347;--lb-bd:#c5d0db;--bd:#7f95ab;',
        'font-family:var(--font,"Noto Sans KR",sans-serif);color:var(--ink);word-break:keep-all;overflow-wrap:break-word}',
      '.axa-root.dark,[data-theme="dark"] .axa-root{--ink:#eef3f8;--ink2:#c9d4df;--ink3:#a3b1bf;--line:#3b4858;--line2:#2c3744;--card:#1b2330;--canvas:#0d131b;--panel:#141b25;--grp:rgba(255,255,255,.03);--grpb:#2e3a49;',
        '--w-solid:#c9d4df;--w-feed:#8a99a9;--w-fb:#a68fff;--w-gate:#8aa7e6;--lb-bg:#1b2330;--lb-tx:#e3eaf2;--lb-bd:#3b4858;--bd:#5d7086}',
      /* 머리·도구줄 */
      '.axa-head{display:flex;align-items:flex-end;flex-direction:column;align-items:stretch;gap:16px;flex-wrap:wrap;background:var(--panel);border:1px solid var(--line2);border-bottom:0;border-radius:14px 14px 0 0;padding:12px 16px}',
      '.axa-tt{flex:0 0 auto}',
      '.axa-eyebrow{font-size:11px;font-weight:800;letter-spacing:.08em;color:#0e8c86;text-transform:uppercase}',
      '.axa-root h2{margin:0;font-size:21px;font-weight:800;letter-spacing:-.015em;color:var(--ink)}',
      '.axa-lede{margin:4px 0 0;font-size:13px;line-height:1.6;color:var(--ink2);max-width:980px;text-wrap:pretty}',
      '.axa-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;flex:1 1 auto;justify-content:flex-end}',
      '.axa-seg-g{display:flex;align-items:center;gap:6px}',
      '.axa-lbl{font-size:12px;font-weight:700;color:var(--ink3);margin-right:2px}',
      '.axa-track{display:flex;border:1px solid var(--line2);border-radius:10px;overflow:hidden}',
      '.axa-seg{background:var(--card);border:0;border-right:1px solid var(--line2);padding:6px 12px;cursor:pointer;font:700 13px var(--font,"Noto Sans KR");color:var(--ink2);display:flex;flex-direction:column;align-items:center;line-height:1.2}',
      '.axa-seg:last-child{border-right:0}.axa-seg span{font-size:10.5px;font-weight:600;color:var(--ink3)}',
      '.axa-seg:hover{background:var(--line2)}.axa-seg.past{background:rgba(61,90,152,.12)}',
      '.axa-seg.sel{background:#3d5a98;color:#fff}.axa-seg.sel span{color:#d5e2f5}',
      '.axa-all,.axa-tool{background:var(--card);border:1px solid var(--line2);border-radius:9px;padding:7px 12px;font:600 12.5px var(--font,"Noto Sans KR");color:var(--ink2);cursor:pointer;white-space:nowrap}',
      '.axa-all:hover,.axa-tool:hover{border-color:#3d5a98;color:#3d5a98}.axa-all.sel{border-color:#3d5a98;color:#3d5a98;background:rgba(61,90,152,.08)}',
      '.axa-root.dark .axa-all.sel,[data-theme="dark"] .axa-all.sel,.axa-root.dark .axa-tool:hover,[data-theme="dark"] .axa-tool:hover,.axa-root.dark .axa-all:hover{border-color:#86a8ff;color:#b9ccff;background:rgba(134,168,255,.12)}',
      '.axa-root.dark .axa-ic,[data-theme="dark"] .axa-root .axa-ic{background:#eef3f8}',
      '.axa-loop{background:var(--card);border:1px solid var(--line2);border-left:4px solid var(--lc);border-radius:9px;padding:5px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:flex-start;line-height:1.25;font-family:var(--font,"Noto Sans KR");white-space:nowrap}',
      '.axa-loop b{font-size:12.5px;color:var(--ink)}.axa-loop span{font-size:10.5px;color:var(--ink3);font-weight:600}',
      '.axa-loop:hover{border-color:var(--lc)}.axa-loop.sel{background:var(--lc);border-color:var(--lc)}.axa-loop.sel b,.axa-loop.sel span{color:#fff}',
      '.axa-tools{display:flex;gap:6px}',
      /* 캔버스 */
      '.axa-vp{position:relative;height:640px;overflow:hidden;background:var(--canvas);border:1px solid var(--line2);cursor:grab;touch-action:none;user-select:none}',
      '.axa-vp:active{cursor:grabbing}',
      '.axa-stage{position:absolute;left:0;top:0;transform-origin:0 0}',
      '.axa-svg{position:absolute;left:0;top:0;z-index:3;overflow:visible;pointer-events:none}',
      '.axa-w{fill:none;stroke-linejoin:round;transition:opacity .2s}',
      '.axa-w.t-solid{stroke:var(--w-solid);stroke-width:2.2}.axa-w.t-feed{stroke:var(--w-feed);stroke-width:1.8}',
      '.axa-w.t-fb{stroke:var(--w-fb);stroke-width:1.8}.axa-w.t-gate{stroke:var(--w-gate);stroke-width:1.8}',
      '@keyframes axabase{to{stroke-dashoffset:-160}}',
      '.axa-w{stroke-dasharray:3 8;animation:axabase 11s linear infinite}',
      '.mk-solid{fill:var(--w-solid)}.mk-feed{fill:var(--w-feed)}.mk-fb{fill:var(--w-fb)}.mk-gate{fill:var(--w-gate)}',
      '@keyframes axaflow{to{stroke-dashoffset:-160}}',
      '.axa-stage.filtering .axa-w.lit{animation:axaflow 3.4s linear infinite;stroke-dasharray:6 6}',
      '.axa-stage.filtering .axa-w.lit.t-solid,.axa-stage.filtering .axa-w.lit.t-feed,.axa-stage.filtering .axa-w.lit.t-fb{stroke:var(--loopc,#3d5a98)}',
      '.axa-w.dim,.axa-lb.dim{opacity:.1;animation:none}',
      '.axa-lb rect{fill:var(--lb-bg);stroke:var(--lb-bd);stroke-width:1}',
      '.axa-lb text{fill:var(--lb-tx);font:600 12.5px var(--font,"Noto Sans KR",sans-serif)}',
      '.axa-bd{position:absolute;border:2px dashed var(--bd);border-radius:22px;z-index:1}',
      '.axa-bd-lb{position:absolute;font:800 15px var(--font,"Noto Sans KR");letter-spacing:.12em;color:var(--bd);z-index:1}',
      '.axa-grp{position:absolute;border:1px solid var(--grpb);border-radius:14px;background:var(--grp);z-index:2}',
      '.axa-grp-t{position:absolute;font:700 12.5px var(--font,"Noto Sans KR");color:var(--ink2);z-index:2;white-space:nowrap}',
      /* 노드 */
      '.axa-n{position:absolute;box-sizing:border-box;background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:7px 10px;box-shadow:0 2px 8px rgba(15,33,51,.10);display:flex;flex-direction:column;justify-content:center;gap:3px;z-index:4;transition:opacity .2s,box-shadow .15s,border-color .15s,filter .2s}',
      '.axa-n.click{cursor:pointer}.axa-n.click:hover,.axa-n.click:focus-visible{border-color:#3d5a98;box-shadow:0 0 0 2px rgba(61,90,152,.35),0 6px 18px rgba(15,33,51,.18);outline:none}',
      '.axa-n.hub{border-width:2.5px;border-color:#0b6e6b}.axa-n.rpal{border-style:dashed}.axa-n.out{border-style:solid;border-color:var(--ink3)}',
      '.axa-n.circ{border-radius:50%;align-items:center;text-align:center;padding:6px}',
      '.axa-nh{display:flex;align-items:center;gap:7px;min-width:0}',
      '.axa-n.circ .axa-nh{flex-direction:column;gap:3px}',
      '.axa-ic{flex:none;display:grid;place-items:center;width:25px;height:25px;border-radius:7px;background:var(--line2)}',
      '.axa-ic svg{width:16px;height:16px}',
      '.axa-nh b{font-size:13px;font-weight:700;line-height:1.15;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.axa-n.hub .axa-nh b{font-size:17px}',
      '.axa-ns{font-size:11px;line-height:1.25;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.axa-n.hub .axa-ns{font-size:12.5px;color:var(--ink2)}',
      '.axa-chips{position:absolute;top:-9px;right:8px;display:flex;gap:3px}',
      '.axa-n.circ .axa-chips{top:auto;bottom:-9px;right:auto;left:50%;transform:translateX(-50%)}',
      '.axa-chip{font:700 10.5px/1 var(--font,"Noto Sans KR");color:#fff;border:0;border-radius:6px;padding:3px 6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.18)}',
      '.axa-chip.g1{background:#3d5a98}.axa-chip.g2{background:#0e8c86}.axa-chip.g3{background:#c1791d}.axa-chip:hover{filter:brightness(1.12)}',
      '.axa-tag{position:absolute;top:-9px;left:8px;font:800 9.5px/1 var(--font,"Noto Sans KR");color:#fff;background:#6c4bd8;border-radius:5px;padding:3px 5px}',
      '.axa-n.due{box-shadow:0 0 0 3px #3d5a98,0 8px 20px rgba(61,90,152,.3);z-index:6}',
      '.axa-n.past{opacity:.5}','.axa-n.future{opacity:.12;filter:grayscale(.6)}','.axa-w.faint,.axa-lb.faint{opacity:.35}','.axa-stage.filtering .axa-w.lit.t-gate{stroke:#3d5a98}',
      '.axa-n.on{box-shadow:0 0 0 3px var(--loopc),0 8px 20px rgba(0,0,0,.18);z-index:6}',
      '.axa-n.off{opacity:.16;filter:grayscale(.6)}',
      '@keyframes axapulse{0%{box-shadow:0 0 0 0 rgba(61,90,152,.7)}100%{box-shadow:0 0 0 18px rgba(61,90,152,0)}}',
      '.axa-n.pulse{animation:axapulse 1s ease-out 2}',
      '.axa-zoom{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:6px;z-index:20}',
      '.axa-zoom button{width:36px;height:36px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.1)}',
      '.axa-legend{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:6px 14px;font-size:12px;color:var(--ink2);background:var(--panel);border:1px solid var(--line2);border-top:0;border-radius:0 0 14px 14px}',
      '.axa-legend .sep{color:var(--line)}',
      /* 전체화면: 문서 전체를 쓰고 팝업(z 1000)·패널(z 960)이 위에 뜨도록 z 900 */
      'body.axa-fs-on{overflow:hidden}','body.axa-fs-on #agentFab,body.axa-fs-on #agentWidget{display:none!important}',
      '@media (min-width:900px){body.axa-dr-on #v-arch .axa-root{margin-right:424px;transition:margin .25s}body.axa-dr-on #v-arch .axa-root.fs{right:420px;margin-right:0}}',
      '.axa-root.fs{position:fixed;inset:0;z-index:900;display:flex;flex-direction:column;background:var(--canvas);padding:10px 12px}',
      '.axa-root.fs .axa-vp{flex:1 1 auto;height:auto}','.axa-root.fs .axa-head{border-radius:14px 14px 0 0}','.axa-root.fs .axa-tt{display:none}',
      /* 사이드 패널 */
      '.axa-drawer{--ink:#0f2133;--ink2:#2f4256;--ink3:#5d7083;--line:#d3dde6;--bg:#fff;--soft:#f3f6f9;position:fixed;top:0;right:0;width:420px;max-width:94vw;height:100vh;background:var(--bg);color:var(--ink);box-shadow:-12px 0 36px rgba(15,33,51,.22);transform:translateX(104%);transition:transform .25s ease;z-index:960;overflow:auto;padding:22px 22px 48px;font-family:var(--font,"Noto Sans KR",sans-serif);word-break:keep-all;overflow-wrap:break-word;box-sizing:border-box}',
      '.axa-drawer.dark,[data-theme="dark"] .axa-drawer{--ink:#eef3f8;--ink2:#c9d4df;--ink3:#a3b1bf;--line:#2e3a49;--bg:#141b25;--soft:#1b2330}',
      '.axa-drawer.open{transform:translateX(0)}',
      '.axa-dx{position:absolute;top:14px;right:14px;width:32px;height:32px;border:1px solid var(--line);background:var(--bg);color:var(--ink2);border-radius:8px;font-size:18px;cursor:pointer}',
      '.axa-dk{display:inline-block;font-size:11.5px;font-weight:800;color:#fff;background:var(--k);border-radius:6px;padding:3px 8px}',
      '.axa-drawer h3{margin:8px 0 4px;font-size:20px;font-weight:800;letter-spacing:-.015em;text-wrap:balance}',
      '.axa-drawer h3 small{font-size:13px;font-weight:700;margin-left:4px}',
      '.axa-dsub{font-size:12.5px;color:var(--ink3)}',
      '.axa-prog{display:flex;align-items:center;gap:10px;margin-top:6px;font-size:12.5px;color:var(--ink2)}',
      '.axa-prog .bar{flex:1;height:8px;background:var(--soft);border-radius:5px;overflow:hidden}.axa-prog .bar i{display:block;height:100%;background:#3d5a98}',
      '.axa-dbody section{border-top:1px solid var(--line);padding:12px 0 2px;margin-top:12px}',
      '.axa-dbody h4{margin:0 0 7px;font-size:13px;font-weight:800;color:var(--ink2)}',
      '.axa-dbody h4 em{font-style:normal;font-weight:700;color:var(--ink3);margin-left:4px}',
      '.axa-dbody p{margin:0;font-size:13.5px;line-height:1.7;color:var(--ink2);text-wrap:pretty}',
      '.axa-muted{color:var(--ink3)!important}',
      '.axa-gl{font-size:11.5px;font-weight:700;color:var(--ink3);margin:6px 0 4px}',
      '.axa-items{display:flex;flex-wrap:wrap;gap:5px}',
      '.axa-item{border:1px solid var(--line);background:var(--soft);color:var(--ink);border-radius:8px;padding:5px 9px;font:600 12.5px var(--font,"Noto Sans KR");cursor:pointer}',
      '.axa-item:hover{border-color:#3d5a98}.axa-item.ghost{background:transparent;color:var(--ink2)}',
      '.axa-trows{display:flex;flex-direction:column;gap:5px}',
      '.axa-trow{display:flex;align-items:center;gap:8px;text-align:left;border:1px solid var(--line);background:var(--bg);border-radius:9px;padding:7px 9px;cursor:pointer;font-family:var(--font,"Noto Sans KR");color:var(--ink)}',
      '.axa-trow:hover{border-color:#3d5a98;background:var(--soft)}',
      '.axa-trow .tt{flex:1;font-size:13px;font-weight:600;line-height:1.4}.axa-trow .go{font-size:12px;color:var(--ink3);white-space:nowrap}',
      '.axa-trow .axa-chip{cursor:pointer;flex:none}',
      '.axa-steps{list-style:none;margin:0;padding:0;counter-reset:st}',
      '.axa-steps li{position:relative;padding:4px 0 12px 34px;counter-increment:st;min-height:22px}',
      '.axa-steps li:before{content:counter(st);position:absolute;left:0;top:3px;width:22px;height:22px;border-radius:50%;background:var(--k);color:#fff;font:700 12px/22px var(--font,"Noto Sans KR");text-align:center}',
      '.axa-steps li:not(:last-child):after{content:"";position:absolute;left:10.5px;top:27px;bottom:0;border-left:2px solid var(--line)}',
      '.axa-steps b{display:block;font-size:13.5px;color:var(--ink)}.axa-steps span{display:block;font-size:12.5px;color:var(--ink3);line-height:1.5}',
      '.axa-rule p{background:var(--soft);border-left:3px solid var(--k);border-radius:0 8px 8px 0;padding:9px 12px}',
      '@media (max-width:760px){.axa-bar{justify-content:flex-start}.axa-vp{height:560px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ───────────── 시작 ───────────── */
  injectCss();
  window.axArch={ render:render, fit:fit, setFs:setFs, openTask:openTaskSafe, closeDrawer:closeDrawer, data:{N:N,EDGES:EDGES,DONE:DONE,LOOPS:LOOPS} };
  var tries=0, timer=setInterval(function(){
    var okV=ensureView(), okT=ensureTab();
    if(okV&&okT){
      try{ if(localStorage.getItem('ax_tab')==='arch'){ var v=document.getElementById('v-arch'); var tb=document.querySelector('#tabbar .tab[data-t="arch"]'); if(v&&tb&&!v.classList.contains('active')&&typeof switchTab==='function') switchTab('arch',tb); if(v&&v.classList.contains('active')) render(); } }catch(e){}
      clearInterval(timer);
    }
    if(++tries>120) clearInterval(timer);
  },250);
})();
