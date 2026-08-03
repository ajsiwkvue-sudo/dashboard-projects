/* =========================================================================
 * ax_arch.js — AI-HOS 아키텍처 탭 (모던 대시보드 재설계 · 딥오션 톤)
 *  · 콘솔 번들 없이 자체 렌더: 위젯 · 세그먼트 타임라인 · 주/보조 데이터흐름
 *    · 카드형 노드 · 작동하는 줌/팬/전체화면 · 노드 클릭 → 중앙 모달(openTask)
 * =======================================================================*/
(function(){
  'use strict';
  var OCEAN='#12467a', OCEAND='#0b2a4a', ACCENT='#1d6fb8', TEAL='#0d9488', AMBER='#c1791d', RED='#c0492f';
  var S={900:'#0f172a',700:'#334155',500:'#64748b',400:'#94a3b8',300:'#cbd5e1',200:'#e2e8f0',100:'#f1f5f9',50:'#f8fafc'};
  var GOAL={1:{c:OCEAN,n:'거버넌스'},2:{c:TEAL,n:'프로세스'},3:{c:AMBER,n:'문화'}};
  function goalOf(m){ return GOAL[+String(m||1).charAt(0)]||GOAL[1]; }
  function esc(s){ try{ if(typeof escH==='function') return escH(s);}catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function TASKS_(){ try{ if(typeof TASKS!=='undefined') return TASKS; }catch(e){} return []; }
  function task(code){ return TASKS_().filter(function(t){return t.id===code;})[0]||null; }

  var IC={
    server:'<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9"/>',
    bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    chip:'<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
    board:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>',
    shield:'<path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    result:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 12l2 2 4-5"/>',
    hub:'<circle cx="12" cy="12" r="2.6"/><circle cx="4" cy="6" r="1.5"/><circle cx="20" cy="6" r="1.5"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="18" r="1.5"/><path d="M6 7l4 3M18 7l-4 3M6 17l4-3M18 17l-4-3"/>',
    data:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    tag:'<path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8" cy="8" r="1.4"/>',
    book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    plug:'<path d="M9 3v5M15 3v5"/><rect x="7" y="8" width="10" height="6" rx="2"/><path d="M12 14v4a3 3 0 0 0 3 3h1"/>',
    fsm:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.3 11l7.4-3M8.3 13l7.4 3"/>',
    loop:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/>',
    ui:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    spawn:'<circle cx="8" cy="8" r="3"/><path d="M14 8h6M17 5v6M8 12v3a3 3 0 0 0 3 3h3"/>',
    graph:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="9" cy="17" r="2"/><path d="M8 7l8 0M8 8l0 8M11 16l6-8"/>',
    brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 5 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-5 1"/>',
    mine:'<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5l4 4M11 8v6M8 11h6"/>',
    gauge:'<path d="M4 19a8 8 0 1 1 16 0"/><path d="M12 19l5-6"/><circle cx="12" cy="19" r="1.4"/>'
  };
  function icon(k,c,sz){ sz=sz||15; return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(IC[k]||IC.board)+'</svg>'; }

  var CW=1960, CH=980;
  var GROUPS=[
    {x:286,y:44,w:852,h:150,t:'G1 · 거버넌스 — AI 운영위원회',c:OCEAN},
    {x:214,y:270,w:430,h:390,t:'데이터 계층 — Semantic Fabric',c:TEAL},
    {x:680,y:270,w:322,h:372,t:'CAP + Runtime — Control Plane',c:TEAL},
    {x:684,y:684,w:382,h:290,t:'승인 · Write-back · 감사',c:OCEAN},
    {x:1156,y:214,w:340,h:120,t:'Context Engineering — RAG·PREF·Agent',c:AMBER},
    {x:1156,y:436,w:540,h:130,t:'Continual Learning — 모델(오프라인)',c:RED},
    {x:1156,y:588,w:380,h:250,t:'Process Intelligence — 운영 최적화',c:AMBER}
  ];
  // [id,x,y,w,h,ic,title,sub,maps,done,{ext,big,circ,rpal,hub}]
  var N=[
    ['source',40,300,150,90,'server','원천 데이터','EMR·OCS·PACS·LIS·IoMT',null,8,{ext:1}],
    ['users',40,720,150,110,'users','현업 · Key Player','과제발굴 · L3+ 30명','3-1',12,{ext:1}],
    ['llm',1730,300,175,132,'bolt','On-prem LLM','의료특화 FM','2-1',10,{ext:1,big:1}],
    ['gpu',1730,472,175,92,'chip','GPU 하드웨어','AI 컴퓨팅 인프라','2-1',9,{ext:1}],
    ['gov1',300,74,150,96,'board','전략·이행관리','AX 추진전략','1-1',9,{}],
    ['gov2',466,74,150,96,'shield','표준·윤리·안전','가이드라인','1-2',9,{}],
    ['gov3',632,74,150,96,'gear','KPI·성과·보상','12지표 · 보상','1-3',10,{}],
    ['gov4',798,74,150,96,'result','검증·테스트베드','FM 실증·검증','2-4',10,{}],
    ['gov5',964,74,160,96,'shield','IAM·보안·감사','Control Plane','2-4',10,{}],
    ['hub',230,300,164,82,'hub','Connector Hub','Event Bus · 수집','2-2',9,{}],
    ['binder',244,432,120,120,'data','데이터 바인더','Semantic Fabric','2-2',10,{circ:1}],
    ['catalog',230,602,164,82,'tag','데이터 카탈로그','Provenance · 품질','2-2',10,{}],
    ['kb',452,300,178,82,'book','Enterprise KB','지침·규정·SOP·심사','2-2',10,{}],
    ['pctx',452,432,178,82,'data','Patient Context','환자 실시간 · 조립','2-2',11,{}],
    ['mcp_read',452,564,178,82,'plug','Read Gateway','EMR·PACS 조회','2-3',11,{}],
    ['cab',698,300,134,60,'loop','CAB','Agent Builder','2-3',11,{}],
    ['cal',848,300,134,60,'board','CAL','Library · 30종','2-3',11,{}],
    ['rt_router',694,374,134,62,'fsm','Router·Planner','요청 배정','2-3',12,{}],
    ['rt_flow',842,374,142,62,'loop','Workflow·State','순서 · 재시도','2-3',12,{}],
    ['rt_policy',694,448,134,62,'shield','Policy·IAM','권한 통제','2-3',12,{}],
    ['rt_valid',842,448,142,62,'result','Validator','정확·안전 검증','2-3',12,{}],
    ['mwp',698,532,286,94,'ui','MWP · My Workplace','개인 맞춤 업무환경 · CAP 중심','2-3',10,{hub:1}],
    ['magent',506,702,152,76,'spawn','멀티에이전트','Orchestrator·Worker·A2A','2-3',11,{}],
    ['output',902,702,152,76,'result','아웃풋','Agent Draft','3-3',12,{}],
    ['happroval',902,802,152,76,'shield','Human Approval','의료진 검토·서명','2-3',12,{}],
    ['mcp_write',700,802,178,76,'plug','Write-back Ctrl','의무기록·오더·처방','2-3',12,{}],
    ['audit',700,892,178,58,'board','Audit · Version','감사 · 버전 기록','2-4',12,{}],
    ['rag',1172,244,102,62,'graph','RAG','KB 검색','2-2',11,{rpal:'R'}],
    ['pref',1280,244,102,62,'gear','PREF','선호','2-2',11,{rpal:'P'}],
    ['agent',1388,244,102,62,'brain','AGENT','Memory','2-2',11,{rpal:'A'}],
    ['OE',1172,344,172,82,'mine','운영지능 (OE)','Event Log·Process Mining','3-3',12,{}],
    ['pipe',1172,462,178,88,'gauge','학습 파이프라인','선별·비식별·라벨링·Gold','2-1',12,{}],
    ['lora',1376,454,110,110,'gear','LoRA','Adapter 학습','2-1',12,{circ:1,rpal:'L'}],
    ['registry',1524,462,160,88,'book','Model Registry','평가·버전·승인','2-4',12,{}],
    ['ooe',1172,612,172,82,'gauge','업무 최적화 엔진','로그 모니터링·최적화','3-3',12,{}],
    ['opt_wait',1172,732,82,100,'gauge','대기시간','외래·검사','3-3',12,{}],
    ['opt_res',1260,732,82,100,'users','자원배분','인력·장비','3-3',12,{}],
    ['opt_bed',1348,732,82,100,'board','병상·스케줄','회전','3-3',12,{}],
    ['opt_proc',1436,732,82,100,'fsm','프로세스','병목','3-3',12,{}]
  ];
  var NODES=N.map(function(a){ var o={id:a[0],x:a[1],y:a[2],w:a[3],h:a[4],ic:a[5],title:a[6],sub:a[7],maps:a[8],done:a[9]}; var f=a[10]||{}; for(var k in f)o[k]=f[k]; return o; });
  var NMAP={}; NODES.forEach(function(n){NMAP[n.id]=n;});
  var EDGES=[
    {a:'source',b:'hub',k:'p'},{a:'hub',b:'binder',k:'p'},{a:'hub',b:'mcp_read',k:'p'},
    {a:'binder',b:'kb',k:'p'},{a:'binder',b:'catalog',k:'s'},{a:'mcp_read',b:'pctx',k:'p'},
    {a:'kb',b:'mwp',k:'p'},{a:'pctx',b:'mwp',k:'p'},{a:'mwp',b:'output',k:'p'},
    {a:'output',b:'happroval',k:'p'},{a:'happroval',b:'mcp_write',k:'p'},
    {a:'mcp_write',b:'audit',k:'s'},{a:'gov5',b:'happroval',k:'s'},
    {a:'mwp',b:'OE',k:'s'},{a:'OE',b:'rag',k:'s'},{a:'rag',b:'mwp',k:'s'},
    {a:'pref',b:'mwp',k:'s'},{a:'agent',b:'mwp',k:'s'},{a:'llm',b:'mwp',k:'p'},
    {a:'OE',b:'pipe',k:'s'},{a:'pipe',b:'lora',k:'s'},{a:'lora',b:'registry',k:'p'},
    {a:'registry',b:'llm',k:'p'},{a:'gpu',b:'llm',k:'p'},
    {a:'OE',b:'ooe',k:'s'},{a:'ooe',b:'mwp',k:'p'},{a:'ooe',b:'opt_wait',k:'s'},
    {a:'ooe',b:'opt_res',k:'s'},{a:'ooe',b:'opt_bed',k:'s'},{a:'ooe',b:'opt_proc',k:'s'},
    {a:'gov2',b:'cab',k:'s'},{a:'cal',b:'rt_flow',k:'p'},{a:'rt_valid',b:'mwp',k:'p'},
    {a:'mwp',b:'magent',k:'p'}
  ];
  function anchor(n,side){ var cx=n.x+n.w/2, cy=n.y+n.h/2;
    if(side==='r')return[n.x+n.w,cy]; if(side==='l')return[n.x,cy];
    if(side==='t')return[cx,n.y]; return[cx,n.y+n.h]; }
  function edgePath(e){ var A=NMAP[e.a],B=NMAP[e.b]; if(!A||!B)return'';
    var acx=A.x+A.w/2, bcx=B.x+B.w/2;
    var as=bcx>acx+20?'r':(bcx<acx-20?'l':(B.y>A.y?'b':'t'));
    var bs=as==='r'?'l':as==='l'?'r':as==='b'?'t':'b';
    var p=anchor(A,as), q=anchor(B,bs);
    if(as==='r'||as==='l'){ var mx=(p[0]+q[0])/2; return 'M '+p[0]+' '+p[1]+' C '+mx+' '+p[1]+', '+mx+' '+q[1]+', '+q[0]+' '+q[1]; }
    var my=(p[1]+q[1])/2; return 'M '+p[0]+' '+p[1]+' C '+p[0]+' '+my+', '+q[0]+' '+my+', '+q[0]+' '+q[1]; }

  function nodeHTML(n){
    var g=n.maps?goalOf(n.maps):{c:S[400]};
    var chip=n.maps?'<span class="axn-chip" style="background:'+g.c+'">'+esc(n.maps)+'</span>':'';
    var rp=n.rpal?'<span class="axn-rp">RPAL·'+n.rpal+'</span>':'';
    var click=n.maps?' data-code="'+esc(n.maps)+'"':'';
    return '<div class="axn'+(n.circ?' circ':'')+(n.hub?' hub':'')+(n.maps?' clk':'')+'" data-done="'+n.done+'"'+click+
      ' style="left:'+n.x+'px;top:'+n.y+'px;width:'+n.w+'px;height:'+n.h+'px;--gc:'+g.c+'">'+rp+
      '<div class="axn-h"><span class="axn-ic" style="background:'+g.c+'14;color:'+g.c+'">'+icon(n.ic,g.c,n.big?18:15)+'</span><b>'+esc(n.title)+'</b></div>'+
      '<div class="axn-s">'+esc(n.sub)+'</div>'+chip+'</div>';
  }
  function widgetsHTML(){
    function w(ic,c,label,val,unit,body){ return '<div class="axw"><div class="axw-h"><span class="axw-ic" style="background:'+c+'1a;color:'+c+'">'+icon(ic,c,17)+'</span><span class="axw-l">'+label+'</span></div><div class="axw-v">'+val+(unit?'<span class="axw-u">'+unit+'</span>':'')+'</div>'+(body||'')+'</div>'; }
    function bar(l,p,c){ return '<div class="axw-bar"><div class="axw-bl"><span>'+l+'</span><span>'+p+'%</span></div><div class="axw-bt"><i style="width:'+p+'%;background:'+c+'"></i></div></div>'; }
    var spark=(function(){ var d=[40,55,48,70,66,82,75],mx=Math.max.apply(0,d),mn=Math.min.apply(0,d),W=100,H=30;
      var pts=d.map(function(v,i){return (i/(d.length-1))*W+','+(H-((v-mn)/(mx-mn||1))*(H-4)-2);}).join(' ');
      return '<svg width="100" height="30" style="overflow:visible"><polyline points="'+pts+'" fill="none" stroke="'+RED+'" stroke-width="2" stroke-linecap="round"/><circle cx="100" cy="'+(H-((d[d.length-1]-mn)/(mx-mn||1))*(H-4)-2)+'" r="2.6" fill="'+RED+'"/></svg>'; })();
    return '<div class="axw-row">'+
      w('bolt',AMBER,'System Health · On-prem LLM','i-FM','의료특화',bar('추론 부하',62,AMBER)+bar('가용률',99,TEAL))+
      w('chip',RED,'System Health · GPU','H200 ×2','+ 기존 4기','<div class="axw-sp"><span>사용률</span>'+spark+'</div>')+
      w('spawn',TEAL,'Service Catalog','30','AI Agent 종','<div class="axw-mini"><div><b>1</b> CAP Runtime</div><div><b>4</b> RPAL 루프</div></div>')+
      w('shield',OCEAN,'Governance · Compliance','5','통제 게이트','<div class="axw-mini"><div>✓ Human Approval</div><div>✓ Audit·Ver</div></div>')+
    '</div>';
  }

  var Z={s:0.62,x:120,y:14}, month=null, dragS=null;
  function applyTransform(){ var st=document.getElementById('axStage'); if(st) st.style.transform='translate('+Z.x+'px,'+Z.y+'px) scale('+Z.s+')'; var pc=document.getElementById('axPct'); if(pc)pc.textContent=Math.round(Z.s*100)+'%'; }
  function fit(){ var vp=document.getElementById('axVp'); if(!vp)return; var s=Math.min(vp.clientWidth/CW,vp.clientHeight/CH)*0.98; Z={s:s,x:(vp.clientWidth-CW*s)/2,y:(vp.clientHeight-CH*s)/2}; applyTransform(); }
  function zoomBy(f){ var vp=document.getElementById('axVp'); var cx=(vp?vp.clientWidth:800)/2, cy=(vp?vp.clientHeight:500)/2; var ns=Math.min(2.4,Math.max(0.3,Z.s*f)); Z={s:ns,x:cx-(cx-Z.x)*(ns/Z.s),y:cy-(cy-Z.y)*(ns/Z.s)}; applyTransform(); }
  function applyMonth(m){ month=m;
    var vp=document.getElementById('v-arch'); if(!vp)return;
    vp.querySelectorAll('.axm-seg').forEach(function(b){ b.classList.toggle('on', String(b.dataset.m)===String(m===null?'all':m)); });
    vp.querySelectorAll('.axn').forEach(function(el){ var d=+el.dataset.done; el.classList.toggle('dim', m!==null&&d>m); el.classList.toggle('due', m!==null&&d===m); });
    vp.querySelectorAll('#axStage svg path.axe').forEach(function(p){ var am=+p.dataset.am; p.classList.toggle('edim', m!==null&&am>m); });
  }

  function renderArchNew(root){
    var groups=GROUPS.map(function(g){ return '<div class="axg" style="left:'+g.x+'px;top:'+g.y+'px;width:'+g.w+'px;height:'+g.h+'px;--gc:'+g.c+'"></div><div class="axg-t" style="left:'+(g.x+12)+'px;top:'+(g.y+8)+'px;color:'+g.c+'">'+esc(g.t)+'</div>'; }).join('');
    var wires=EDGES.map(function(e){ var A=NMAP[e.a],B=NMAP[e.b]; if(!A||!B)return''; var am=Math.max(A.done,B.done); var pr=e.k==='p';
      return '<path class="axe'+(pr?' p':' s')+'" data-am="'+am+'" d="'+edgePath(e)+'" fill="none" stroke="'+(pr?TEAL:S[400])+'" stroke-width="'+(pr?2.4:1.6)+'" stroke-dasharray="'+(pr?'7 7':'3 6')+'" marker-end="url(#'+(pr?'axmp':'axms')+')"/>'; }).join('');
    var nodes=NODES.map(nodeHTML).join('');
    var segs=[['all','전체',NODES.length]].concat([8,9,10,11,12].map(function(m){return [m,m+'월',NODES.filter(function(n){return n.done===m;}).length];}));
    var segHTML=segs.map(function(s){ return '<button class="axm-seg'+(s[0]==='all'?' on':'')+'" data-m="'+s[0]+'">'+s[1]+'<span class="axm-c">'+s[2]+'</span></button>'; }).join('');
    root.innerHTML=
      '<div class="ax-head"><div class="ax-eyebrow">NARRATIVE · 05 / AI HOSPITAL OPERATING SYSTEM</div>'+
      '<h1 class="ax-h1">AI-HOS 아키텍처</h1>'+
      '<p class="ax-lede">AI-HOS 경계 안에 거버넌스 · 데이터 계층 · CAP+Runtime · Context Engineering · Continual Learning · Process Intelligence가 배치되고, 외부로 원천데이터 · 현업 · On-prem LLM · GPU가 연결됩니다.</p></div>'+
      widgetsHTML()+
      '<div class="ax-ctrl"><div class="axm">'+segHTML+'</div>'+
      '<div class="ax-legend"><span><i class="lp"></i> 핵심 흐름</span><span><i class="ls"></i> 보조 흐름</span></div></div>'+
      '<div class="ax-canvas" id="axCanvas"><div class="ax-vp" id="axVp"><div class="ax-stage" id="axStage" style="width:'+CW+'px;height:'+CH+'px">'+
        '<div class="axbd"></div><div class="axbd-lb">AI-HOS</div>'+groups+
        '<svg class="axsvg" width="'+CW+'" height="'+CH+'"><defs>'+
          '<marker id="axmp" markerWidth="7" markerHeight="7" refX="5" refY="3.2" orient="auto"><path d="M0,0 L6.5,3.2 L0,6.4 Z" fill="'+TEAL+'"/></marker>'+
          '<marker id="axms" markerWidth="7" markerHeight="7" refX="5" refY="3.2" orient="auto"><path d="M0,0 L6.5,3.2 L0,6.4 Z" fill="'+S[400]+'"/></marker>'+
        '</defs>'+wires+'</svg>'+nodes+
        '<div class="ax-zoomhint" id="axZh">Ctrl + 스크롤로 확대</div>'+
      '</div></div>'+
      '<div class="ax-zoom"><button data-z="in">+</button><button data-z="out">−</button><button data-z="fit">⟲</button><span class="ax-zdiv"></span><button data-z="fs">⛶</button></div>'+
      '<div class="ax-hud">Ctrl+휠 줌 · 드래그 이동 · <span id="axPct">62%</span></div>'+
      '</div>';
    // wire
    root.querySelectorAll('.axm-seg').forEach(function(b){ b.onclick=function(){ applyMonth(b.dataset.m==='all'?null:+b.dataset.m); }; });
    root.querySelectorAll('.axn.clk').forEach(function(el){ el.onclick=function(){ var c=el.dataset.code; if(c&&typeof window.openTask==='function'&&task(c)) window.openTask(c); }; });
    var zc=root.querySelector('.ax-zoom'); if(zc) zc.onclick=function(e){ var b=e.target.closest('button'); if(!b)return; var z=b.dataset.z; if(z==='in')zoomBy(1.2); else if(z==='out')zoomBy(0.83); else if(z==='fit')fit(); else if(z==='fs'){ var el=document.getElementById('axCanvas'); if(!document.fullscreenElement){ el&&el.requestFullscreen&&el.requestFullscreen(); } else { document.exitFullscreen&&document.exitFullscreen(); } } };
    var vp=document.getElementById('axVp');
    if(vp){
      vp.onwheel=function(e){ if(!(e.ctrlKey||e.metaKey)){ var zh=document.getElementById('axZh'); if(zh){zh.classList.add('show'); clearTimeout(vp._zt); vp._zt=setTimeout(function(){zh.classList.remove('show');},800);} return; } e.preventDefault(); var r=vp.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,ns=Math.min(2.4,Math.max(0.3,Z.s*(e.deltaY<0?1.12:0.9))); Z={s:ns,x:mx-(mx-Z.x)*(ns/Z.s),y:my-(my-Z.y)*(ns/Z.s)}; applyTransform(); };
      vp.onmousedown=function(e){ dragS={x:e.clientX,y:e.clientY,ox:Z.x,oy:Z.y}; vp.style.cursor='grabbing'; };
      vp.onmousemove=function(e){ if(!dragS)return; Z.x=dragS.ox+(e.clientX-dragS.x); Z.y=dragS.oy+(e.clientY-dragS.y); applyTransform(); };
      vp.onmouseup=vp.onmouseleave=function(){ dragS=null; vp.style.cursor='grab'; };
    }
    setTimeout(fit,50);
  }

  /* ── CSS (딥오션 디자인 시스템) ── */
  function injectCss(){
    if(document.getElementById('axArchCss2')) return;
    var st=document.createElement('style'); st.id='axArchCss2';
    st.textContent=[
      '#v-arch{font-family:"Noto Sans KR",system-ui,sans-serif;color:'+S[900]+'}',
      '#v-arch .ax-head{margin-bottom:16px}',
      '#v-arch .ax-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:'+TEAL+';margin-bottom:4px}',
      '#v-arch .ax-h1{font-size:24px;font-weight:800;color:'+OCEAND+';margin:0}',
      '#v-arch .ax-lede{font-size:13.5px;color:'+S[500]+';line-height:1.6;margin:6px 0 0;max-width:1000px}',
      '#v-arch .axw-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px}',
      '#v-arch .axw{flex:1;min-width:200px;background:#fff;border:1px solid '+S[200]+';border-radius:14px;padding:14px 16px;box-shadow:0 1px 3px rgba(15,23,42,.06)}',
      '#v-arch .axw-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}',
      '#v-arch .axw-ic{display:grid;place-items:center;width:30px;height:30px;border-radius:9px}',
      '#v-arch .axw-l{font-size:12px;font-weight:600;color:'+S[500]+'}',
      '#v-arch .axw-v{font-size:24px;font-weight:800;color:'+S[900]+'}',
      '#v-arch .axw-u{font-size:12px;font-weight:400;color:'+S[400]+';margin-left:5px}',
      '#v-arch .axw-bar{margin-top:8px}',
      '#v-arch .axw-bl{display:flex;justify-content:space-between;font-size:12px;color:'+S[500]+';margin-bottom:3px}',
      '#v-arch .axw-bt{height:6px;background:'+S[200]+';border-radius:5px;overflow:hidden}',
      '#v-arch .axw-bt i{display:block;height:100%;border-radius:5px}',
      '#v-arch .axw-sp{display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:12px;color:'+S[500]+'}',
      '#v-arch .axw-mini{display:flex;gap:16px;margin-top:8px;font-size:12px;color:'+S[500]+'}',
      '#v-arch .axw-mini b{color:'+S[900]+';font-size:16px}',
      '#v-arch .ax-ctrl{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:12px}',
      '#v-arch .axm{display:inline-flex;align-items:center;padding:4px;border:1px solid '+S[200]+';border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.05)}',
      '#v-arch .axm-seg{border:0;background:transparent;color:'+S[500]+';font:700 13.5px "Noto Sans KR";padding:7px 14px;border-radius:9px;cursor:pointer;transition:.15s}',
      '#v-arch .axm-seg .axm-c{font-size:11px;opacity:.7;margin-left:5px}',
      '#v-arch .axm-seg:hover{background:'+S[100]+'}',
      '#v-arch .axm-seg.on{background:'+OCEAN+';color:#fff}',
      '#v-arch .ax-legend{display:flex;gap:16px;font-size:12px;color:'+S[500]+'}',
      '#v-arch .ax-legend span{display:flex;align-items:center;gap:6px}',
      '#v-arch .ax-legend .lp{width:22px;height:2px;background:'+TEAL+';border-radius:2px}',
      '#v-arch .ax-legend .ls{width:22px;border-top:2px dashed '+S[400]+'}',
      '#v-arch .ax-canvas{position:relative;border:1px solid '+S[200]+';border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.07)}',
      '#v-arch .ax-vp{position:relative;height:600px;overflow:hidden;cursor:grab;background:radial-gradient(130% 130% at 15% 0%,#f8fbfe,#eef3f8)}',
      '#v-arch .ax-canvas:fullscreen{border-radius:0}',
      '#v-arch .ax-canvas:fullscreen .ax-vp{height:100vh}',
      '#v-arch .ax-stage{position:absolute;left:0;top:0;transform-origin:0 0}',
      '#v-arch .axsvg{position:absolute;left:0;top:0;z-index:3;overflow:visible}',
      '#v-arch .axbd{position:absolute;left:260px;top:44px;width:1200px;height:912px;border:2px dashed '+S[300]+';border-radius:24px;z-index:1}',
      '#v-arch .axbd-lb{position:absolute;left:1300px;top:52px;font-size:15px;font-weight:800;letter-spacing:.08em;color:'+S[300]+';z-index:1}',
      '#v-arch .axg{position:absolute;border:1px solid var(--gc);background:transparent;border-radius:16px;z-index:2;opacity:.28}',
      '#v-arch .axg-t{position:absolute;font-size:11px;font-weight:700;z-index:2}',
      '#v-arch .axe{transition:opacity .2s}',
      '#v-arch .axe.p{opacity:.95;animation:axflow 1.1s linear infinite}',
      '#v-arch .axe.s{opacity:.55;animation:axflow 2.6s linear infinite}',
      '#v-arch .axe.edim{opacity:.1 !important;animation:none}',
      '@keyframes axflow{to{stroke-dashoffset:-160}}',
      '#v-arch .axn{position:absolute;box-sizing:border-box;background:#fff;border:1.5px solid '+S[200]+';border-radius:14px;padding:9px 11px 8px;box-shadow:0 2px 6px rgba(15,23,42,.07);z-index:4;display:flex;flex-direction:column;justify-content:center;transition:box-shadow .15s,border-color .15s,opacity .2s}',
      '#v-arch .axn.clk{cursor:pointer}',
      '#v-arch .axn.clk:hover{border-color:var(--gc);box-shadow:0 8px 20px rgba(15,23,42,.14)}',
      '#v-arch .axn.circ{border-radius:50%;align-items:center;text-align:center;padding:6px}',
      '#v-arch .axn.hub{border-width:2px}',
      '#v-arch .axn.dim{opacity:.28;filter:grayscale(.4)}',
      '#v-arch .axn.due{border-color:var(--gc);box-shadow:0 0 0 3px color-mix(in srgb,var(--gc) 22%,transparent),0 8px 20px rgba(15,23,42,.12)}',
      '#v-arch .axn-h{display:flex;align-items:center;gap:6px;padding-right:34px}',
      '#v-arch .axn.circ .axn-h{padding-right:0;justify-content:center}',
      '#v-arch .axn.hub .axn-h{padding-right:46px}',
      '#v-arch .axn-h b{font-size:11.5px;line-height:1.12;color:'+S[900]+'}',
      '#v-arch .axn.hub .axn-h b{font-size:15px}',
      '#v-arch .axn-ic{display:grid;place-items:center;width:24px;height:24px;border-radius:7px;flex:none}',
      '#v-arch .axn.hub .axn-ic{width:30px;height:30px}',
      '#v-arch .axn-s{font-size:9.5px;color:'+S[500]+';line-height:1.3;margin-top:2px;padding-right:2px}',
      '#v-arch .axn.circ .axn-s{text-align:center}',
      '#v-arch .axn-chip{position:absolute;top:5px;right:6px;font-family:ui-monospace,monospace;font-size:8px;font-weight:700;color:#fff;padding:1px 5px;border-radius:5px}',
      '#v-arch .axn.circ .axn-chip{top:auto;bottom:9px;right:auto;left:50%;transform:translateX(-50%)}',
      '#v-arch .axn-rp{position:absolute;top:4px;left:7px;font-family:ui-monospace,monospace;font-size:8px;font-weight:700;color:'+AMBER+'}',
      '#v-arch .ax-zoom{position:absolute;right:16px;bottom:16px;z-index:40;display:flex;flex-direction:column;gap:5px;padding:6px;border:1px solid '+S[200]+';background:#fff;border-radius:12px;box-shadow:0 4px 14px rgba(15,23,42,.12)}',
      '#v-arch .ax-zoom button{width:34px;height:34px;border:0;background:transparent;border-radius:9px;font-size:17px;font-weight:700;color:'+S[700]+';cursor:pointer;line-height:1}',
      '#v-arch .ax-zoom button:hover{background:'+S[100]+'}',
      '#v-arch .ax-zoom button[data-z="fs"]{color:'+OCEAN+'}',
      '#v-arch .ax-zdiv{height:1px;background:'+S[200]+';margin:1px 2px}',
      '#v-arch .ax-hud{position:absolute;left:16px;bottom:16px;z-index:40;font-family:ui-monospace,monospace;font-size:11px;color:'+S[400]+';background:rgba(255,255,255,.85);padding:3px 9px;border-radius:6px}',
      '#v-arch .ax-zoomhint{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:rgba(15,23,42,.82);color:#fff;font-size:12px;padding:5px 12px;border-radius:8px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:40}',
      '#v-arch .ax-zoomhint.show{opacity:1}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── 탭 + 뷰 주입 ── */
  function ensureTab(){
    var bar=document.getElementById('tabbar'); if(!bar) return false;
    if(bar.querySelector('.tab[data-t="arch"]')) return true;
    var tab=document.createElement('div'); tab.className='tab'; tab.setAttribute('data-t','arch');
    tab.title='AI-HOS 아키텍처'; tab.textContent='🧭 AI-HOS 아키텍처';
    tab.onclick=function(){ try{ if(typeof switchTab==='function') switchTab('arch',tab); }catch(e){} renderIfNeeded(); };
    bar.appendChild(tab); return true;
  }
  function ensureView(){
    if(document.getElementById('v-arch')) return true;
    var ref=document.getElementById('v-overview'); if(!ref||!ref.parentNode) return false;
    var sec=document.createElement('section'); sec.className='view'; sec.id='v-arch';
    sec.innerHTML='<div class="wrap"><div id="axRoot"></div></div>';
    ref.parentNode.appendChild(sec); return true;
  }
  var rendered=false;
  function renderIfNeeded(){
    if(rendered){ setTimeout(fit,40); return; }
    var root=document.getElementById('axRoot'); if(!root) return;
    try{ renderArchNew(root); rendered=true; }catch(e){ console.warn('[ax-arch]',e&&e.message); }
  }

  injectCss();
  var n=0, t=setInterval(function(){
    injectCss(); ensureView(); ensureTab();
    try{ if(localStorage.getItem('ax_tab')==='arch'){ var v=document.getElementById('v-arch'); if(v&&!v.classList.contains('active')){ var tb=document.querySelector('.tab[data-t="arch"]'); if(tb&&typeof switchTab==='function') switchTab('arch',tb); } renderIfNeeded(); } }catch(e){}
    if(++n>120) clearInterval(t);
  }, 500);
})();
