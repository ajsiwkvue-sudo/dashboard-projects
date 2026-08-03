/* =========================================================================
 * ax_arch.js — AI-HOS 아키텍처 다이어그램 이식 로더
 *  · aihos_arch_bundle.js(renderArch) + aihos_arch.css 를 새 탭 'arch' 에 장착.
 *  · 렌더/팬줌/전체화면/타임라인/순환/정합표는 번들 원본 그대로.
 *  · 외부 의존 배선: goalOf(목표색), 노드/타임라인/순환 클릭 드로어(경량, ilsan 실데이터).
 *  · 콘솔의 복잡한 드로어 헬퍼(TASKS/STATE/drawPhaseTimeline 등)는 사용하지 않음.
 * =======================================================================*/
(function(){
  'use strict';

  function TASKS_(){ try{ if(typeof TASKS!=='undefined') return TASKS; }catch(e){} return []; }
  function OWNERS_(){ try{ if(typeof OWNERS!=='undefined') return OWNERS; }catch(e){} return {}; }
  function esc(s){ try{ if(typeof escH==='function') return escH(s); }catch(e){}
    return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function task(code){ return TASKS_().filter(function(t){return t.id===code;})[0]||null; }

  /* ── 목표색 (번들이 render/chip 에 사용) ── */
  function archGoalOf(code){
    var g=parseInt(String(code||'').charAt(0),10)||1;
    var m={1:{name:'거버넌스',hex:'#3d5a98'},2:{name:'프로세스',hex:'#0e8c86'},3:{name:'문화',hex:'#c1791d'}}[g]||{name:'',hex:'#3d5a98'};
    return {cls:'g'+g, no:'목표'+g, name:m.name, hex:m.hex, goal:g};
  }

  /* ── 드로어 (경량, ilsan 실데이터) ── */
  function archCloseDrawer(){ var d=document.getElementById('drawer'); if(d) d.classList.remove('open'); window.drawerCode=null; }

  function archOpenNode(code){
    // 다른 탭과 동일한 중앙 모달(과제 상세)로 통일
    if(typeof window.openTask==='function' && task(code)){ try{ window.openTask(code); return; }catch(e){} }
  }

  function _titleOf(el){ var b=el.querySelector('.cn-h b'); return b?b.textContent:''; }

  function archOpenTimeline(m){
    var d=document.getElementById('drawer'), head=document.getElementById('drawerHead'), body=document.getElementById('drawerBody'); if(!d)return;
    var all=[].slice.call(document.querySelectorAll('#archStage .cn[data-done]'));
    var due=all.filter(function(e){return +e.dataset.done===m;});
    var cum=all.filter(function(e){return +e.dataset.done<=m;});
    var fut=all.filter(function(e){return +e.dataset.done>m;});
    var note=''; try{ if(typeof MONTHNOTE!=='undefined') note=MONTHNOTE[m]||''; }catch(e){}
    head.innerHTML='<span class="chip" style="background:#3d5a98;color:#fff">시점 · TIMELINE</span>'+
      '<h3 style="margin:8px 0 2px;font-size:16px">2026 · '+m+'월 마일스톤</h3>'+
      '<div style="font-size:12px;color:var(--ink-3)">누적 '+cum.length+' / 전체 '+all.length+' · 이번 달 '+due.length+'개</div>';
    body.innerHTML='<div class="dsec">이번 달 개요</div><p>'+esc(note)+'</p>'+
      '<div class="dsec">이번 달 완성 ('+due.length+')</div><ul>'+(due.length?due.map(function(e){return '<li>'+esc(_titleOf(e))+'</li>';}).join(''):'<li style="color:var(--ink-3)">해당 없음</li>')+'</ul>'+
      '<div class="dsec">예정 ('+fut.length+')</div><p style="color:var(--ink-3)">'+(fut.map(_titleOf).map(esc).join(' · ')||'모두 완료')+'</p>';
    window.drawerCode='__tl_'+m; d.classList.add('open');
  }

  function archOpenLoop(id){
    var M=null; try{ if(typeof LOOPMETA!=='undefined') M=LOOPMETA[id]; }catch(e){}
    if(!M) return;
    var d=document.getElementById('drawer'), head=document.getElementById('drawerHead'), body=document.getElementById('drawerBody'); if(!d)return;
    var nodes=[].slice.call(document.querySelectorAll('#archStage .cn')).filter(function(el){return (el.dataset.loop||'').split(' ').indexOf(id)>=0;});
    var titles=[]; nodes.forEach(function(el){var s=_titleOf(el); if(s&&titles.indexOf(s)<0)titles.push(s);});
    head.innerHTML='<span class="chip" style="background:'+M.c+';color:#fff">순환 · LOOP</span>'+
      '<h3 style="margin:8px 0 2px;font-size:16px"><span style="color:'+M.c+'">'+esc(M.en)+'</span> · '+esc(M.ko)+'</h3>'+
      '<div style="font-size:12px;color:var(--ink-3)">참여 컴포넌트 '+titles.length+'개</div>';
    body.innerHTML='<div class="dsec">개요</div><p>'+esc(M.desc)+'</p>'+
      '<div class="dsec">순환 흐름</div><p>'+esc(M.flow)+'</p>'+
      '<div class="dsec">참여 컴포넌트 ('+titles.length+')</div><ul>'+titles.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>'+
      '<div class="dsec">핵심 통제</div><p>'+esc(M.note)+'</p>';
    window.drawerCode='__loop_'+id; d.classList.add('open');
  }

  function installOverrides(){
    window.goalOf=archGoalOf;
    window.closeDrawer=archCloseDrawer;
    window.openNode=archOpenNode;
    window.openTimelineDrawer=archOpenTimeline;
    window.openLoopDrawer=archOpenLoop;
    if(typeof window.drawerCode==='undefined') window.drawerCode=null;
  }

  /* ── CSS: 콘솔 디자인 변수 + chip + 드로어 ── */
  function injectCss(){
    if(document.getElementById('axArchCss')) return;
    if(!document.querySelector('link[href="aihos_arch.css"]')){
      var lk=document.createElement('link'); lk.rel='stylesheet'; lk.href='aihos_arch.css'; document.head.appendChild(lk);
    }
    var st=document.createElement('style'); st.id='axArchCss';
    st.textContent=[
      '#v-arch{--ink:#12263a;--ink-2:#3a4a5a;--ink-3:#6c7d8e;--line:#d8e0e8;--line-2:#e6ecf2;--surface:#f4f7fa;--surface-2:#eef2f6;--accent:#3d5a98;--cross:#6c4bd8;--shadow:0 2px 8px rgba(18,38,58,.06);--mono:ui-monospace,Menlo,monospace;--sans:"Noto Sans KR",system-ui,sans-serif;color:var(--ink)}',
      '#v-arch .eyebrow{font-size:.72rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:var(--cross);margin-bottom:4px}',
      '#v-arch h2{font-size:20px;font-weight:800;margin:2px 0 6px;color:var(--ink)}',
      '#v-arch .lede{font-size:13.5px;color:var(--ink-2);line-height:1.65;margin:0 0 14px;max-width:1000px}',
      '#v-arch .chip{display:inline-block;font-family:var(--mono);font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;color:#fff}',
      '#v-arch .chip.g1{background:#3d5a98}#v-arch .chip.g2{background:#0e8c86}#v-arch .chip.g3{background:#c1791d}',
      '#v-arch .section-rule{border:0;border-top:1px solid var(--line);margin:26px 0 16px}',
      '#v-arch .map-table{width:100%;border-collapse:collapse;font-size:12.5px}',
      '#v-arch .map-table th,#v-arch .map-table td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}',
      '#v-arch .map-table th{background:var(--surface-2);font-weight:700}',
      '#v-arch .map-table .eng{font-weight:700;color:var(--ink)}',
      '#v-arch .card.pad{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px}',
      '#v-arch .hint{font-size:12px;color:var(--ink-3);margin-top:10px;line-height:1.6}',
      '#v-arch .rpal-legend{font-size:12.5px;color:var(--ink-2);line-height:1.6;background:#fff;border:1px solid var(--line);border-left:3px solid var(--cross);border-radius:0 10px 10px 0;padding:12px 15px;margin:14px 0}',
      '#v-arch .rpal-legend .rps{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px}',
      '#v-arch .rpal-legend .rp{display:inline-flex;align-items:center;gap:5px;font-weight:700;color:var(--ink)}',
      '#v-arch .rpal-legend .rp i{display:grid;place-items:center;width:18px;height:18px;border-radius:5px;background:var(--cross);color:#fff;font-style:normal;font-size:11px}',
      /* drawer */
      '#v-arch #drawer{position:fixed;top:0;right:0;width:400px;max-width:94vw;height:100vh;background:#fff;box-shadow:-10px 0 34px rgba(18,38,58,.16);transform:translateX(102%);transition:transform .25s ease;z-index:99999;overflow:auto;padding:24px 22px 60px}',
      '#v-arch #drawer.open{transform:translateX(0)}',
      '#v-arch #drawer .drawer-x{position:absolute;top:12px;right:14px;width:30px;height:30px;border:1px solid var(--line);background:#fff;border-radius:8px;font-size:17px;cursor:pointer;color:var(--ink-3)}',
      '#v-arch #drawer h3{color:var(--ink)}',
      '#v-arch #drawer .dsec{font-size:11px;font-weight:800;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;margin:16px 0 5px}',
      '#v-arch #drawer p{font-size:13px;color:var(--ink-2);line-height:1.65;margin:0 0 6px}',
      '#v-arch #drawer ul{margin:2px 0 6px;padding-left:18px}#v-arch #drawer li{font-size:13px;color:var(--ink-2);line-height:1.6;margin:2px 0}',
      '#v-arch #drawer .ad-bar{height:8px;background:var(--surface-2);border-radius:5px;overflow:hidden;margin:7px 0 4px}#v-arch #drawer .ad-bar i{display:block;height:100%}',
      '#v-arch #drawer .ad-link{border:1px solid var(--accent);color:var(--accent);background:#fff;border-radius:8px;padding:8px 14px;font:600 13px var(--sans);cursor:pointer}',
      '#v-arch #drawer .ad-link:hover{background:var(--surface-2)}',
      /* ── 콘솔 CSS 누락분: 노드·그룹·경계·SVG·줌힌트 ── */
      '#archStage .cn{position:absolute;box-sizing:border-box;background:#fff;border:1px solid var(--line);border-radius:11px;padding:8px 10px;box-shadow:0 2px 6px rgba(18,38,58,.08);cursor:pointer;display:flex;flex-direction:column;gap:3px;justify-content:center;z-index:4;transition:box-shadow .15s,border-color .15s}',
      '#archStage .cn:hover{border-color:var(--accent);box-shadow:0 6px 18px rgba(18,38,58,.16)}',
      '#archStage .cn.circ{border-radius:50%;align-items:center;text-align:center;padding:6px}',
      '#archStage .cn.hub{border-width:2px}',
      '#archStage .cn.rpal{border-style:dashed}',
      '#archStage .cn .rb{position:absolute;top:4px;left:6px;font-family:var(--mono);font-size:8px;font-weight:700;color:var(--cross)}',
      '#archStage .cn .cn-ic svg{display:block}',
      '#archStage .aihos-bd{position:absolute;border:2px dashed #aebccb;border-radius:22px;background:rgba(61,90,152,.03);z-index:1}',
      '#archStage .aihos-bd-lb{position:absolute;font-weight:800;font-size:15px;letter-spacing:.08em;color:#9fb0c2;z-index:1;font-family:var(--mono)}',
      '#archStage .agrp{position:absolute;border:1px solid var(--line-2);border-radius:14px;background:rgba(120,132,150,.05);z-index:2}',
      '#archStage .agrp-title{position:absolute;font-size:11px;font-weight:700;color:var(--ink-3);z-index:2;font-family:var(--mono)}',
      '#archStage .aw{position:absolute;left:0;top:0;z-index:3;overflow:visible}',
      '#archStage .aw-bg{fill:rgba(255,255,255,.92)}',
      '#archStage .aw-lb{fill:var(--ink-3);font-size:11px;font-family:var(--mono)}',
      '#archStage .aw polyline.edim{opacity:.12}',
      '#archStage .aw polyline.flow{opacity:1}',
      '#archStage .cn.due{box-shadow:0 0 0 2px var(--accent),0 6px 16px rgba(61,90,152,.25);z-index:6}',
      '#archStage .cn.done-past{opacity:.92}',
      '#archStage .cn.future{opacity:.3;filter:grayscale(.4)}',
      '#archStage .zoom-hint{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:rgba(18,38,58,.82);color:#fff;font-size:12px;padding:5px 12px;border-radius:8px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:40}',
      '#archStage .zoom-hint.show{opacity:1}',
      /* ── 데이터 흐름 애니메이션 (속도 완화) ── */
      '@keyframes axflow{to{stroke-dashoffset:-160}}',
      '#archStage .aw polyline.awln{stroke-dasharray:3 8;animation:axflow 11s linear infinite}',
      '#archStage .aw polyline.flow{stroke-dasharray:6 6;animation:axflow 3.4s linear infinite}',
      '#archStage .aw polyline.edim{opacity:.1;animation:none}',
      /* ── 컨셉 톤 정리(베이지 제거·화이트 카드) + 영역 침범 방지 ── */
      '#v-arch .arch-wrap{background:#fff !important;border:1px solid #e6ecf2 !important;box-shadow:0 6px 22px rgba(18,38,58,.06) !important;padding:12px !important}',
      '#v-arch .arch-vp{background:radial-gradient(120% 120% at 15% 0%,#f7fafd,#eef3f8) !important;border-color:#e2e9f1 !important}',
      '#v-arch h2{font-size:22px;letter-spacing:-.3px}',
      '#v-arch .eyebrow{color:#0e8c86}',
      '#v-arch .arch-timeline{margin:2px 0 18px !important}',
      '#v-arch .rpal-legend{margin-top:18px}',
      '#archStage .aihos-bd{background:transparent}',
      '#archStage .agrp{background:rgba(120,132,150,.045)}',
      /* ── 컨셉 통일: 폰트·타임라인(월)·전체보기·순환 ── */
      '#v-arch{font-family:"Noto Sans KR",system-ui,sans-serif}',
      '#v-arch .lede{font-family:"Noto Sans KR",system-ui,sans-serif}',
      '#v-arch .atl-track{border:1px solid #e6e9ee;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden}',
      '#v-arch .atl-seg{background:#fff;color:#6c7d8e;font:700 13px "Noto Sans KR";border-right:1px solid #eef1f5}',
      '#v-arch .atl-seg .cnt{color:#9aa4b2;font-family:"Noto Sans KR";font-weight:600}',
      '#v-arch .atl-seg:hover{background:#f4f6f9}',
      '#v-arch .atl-seg.sel{background:#3d5a98;color:#fff}',
      '#v-arch .atl-seg.sel .cnt{color:#cfe0f5}',
      '#v-arch .atl-seg.past{background:#eef3f8}',
      '#v-arch .atl-all{background:#fff;border:1px solid #e6e9ee;border-radius:10px;color:#3a4a5a;font:600 12.5px "Noto Sans KR";box-shadow:0 1px 3px rgba(0,0,0,.04)}',
      '#v-arch .atl-all:hover{border-color:#3d5a98;color:#3d5a98}',
      '#v-arch .atl-loops-lb{color:#9aa4b2;font-family:"Noto Sans KR"}',
      '#v-arch .atl-loop{background:#fff;border:1px solid #e6e9ee;border-radius:10px;font-family:"Noto Sans KR"}',
      '#v-arch .atl-loop .lp{font-family:"Noto Sans KR";color:#9aa4b2}',
      '#v-arch .atl-cap{color:#9aa4b2;font-family:"Noto Sans KR"}',
      '#archStage .cn .cn-h b{font-family:"Noto Sans KR"}',
      '#archStage .cn .cn-s{font-family:"Noto Sans KR"}',
      '#archStage .agrp-title{font-family:"Noto Sans KR"}',
      '#archStage .aihos-bd-lb{font-family:"Noto Sans KR"}',
      /* ── 목표칩이 본문 텍스트를 가리지 않도록 우상단 코너로 재배치 ── */
      '#archStage .cn{padding-top:9px !important}',
      '#archStage .cn .schip{top:5px !important;right:6px !important;bottom:auto !important;font-size:7.5px !important;padding:1px 5px !important;line-height:1.35}',
      '#archStage .cn .cn-h{padding-right:34px}',
      '#archStage .cn.hub .cn-h{padding-right:46px}',
      '#archStage .cn .rb{padding-right:2px}',
      '#archStage .cn.circ .schip{top:auto !important;bottom:9px !important;right:auto !important;left:50% !important;transform:translateX(-50%)}',
      '#archStage .cn.circ .cn-h{padding-right:0}',
      '#archStage .cn .cn-s{padding-right:2px}',
      /* ── 노드 텍스트 강제 한 줄(개행·겹침 방지) ── */
      '#archStage .cn{overflow:visible}',
      '#archStage .cn .cn-h b{white-space:nowrap;font-size:10.6px;line-height:1.15}',
      '#archStage .cn.hub .cn-h b{font-size:14px}',
      '#archStage .cn .cn-s{white-space:nowrap;font-size:8.8px;line-height:1.2}',
      '#archStage .cn.hub .cn-s{font-size:10px}',
      '#archStage .agrp-title{white-space:nowrap}',
      '#archStage .aihos-bd-lb{white-space:nowrap}',
      '#v-arch .atl-seg{white-space:nowrap}',
      '#v-arch .atl-loop{white-space:nowrap}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── 탭 + 뷰 주입 ── */
  function ensureTab(){
    var bar=document.getElementById('tabbar'); if(!bar) return false;
    if(bar.querySelector('.tab[data-t="arch"]')) return true;
    var tab=document.createElement('div'); tab.className='tab'; tab.setAttribute('data-t','arch');
    tab.title='AI-HOS 아키텍처 다이어그램'; tab.textContent='🧭 AI-HOS 아키텍처';
    tab.onclick=function(){ try{ if(typeof switchTab==='function') switchTab('arch',tab); }catch(e){} renderArchIfNeeded(); };
    bar.appendChild(tab);
    return true;
  }
  function ensureView(){
    if(document.getElementById('v-arch')) return true;
    var ref=document.getElementById('v-overview'); if(!ref||!ref.parentNode) return false;
    var sec=document.createElement('section'); sec.className='view'; sec.id='v-arch';
    sec.innerHTML='<div class="wrap"><div id="view"></div></div>'+
      '<div id="drawer"><button class="drawer-x" onclick="closeDrawer()" aria-label="닫기">×</button><div id="drawerHead"></div><div id="drawerBody"></div></div>';
    ref.parentNode.appendChild(sec);
    return true;
  }

  var rendered=false;
  function renderArchIfNeeded(){
    if(rendered){ var st=document.getElementById('archStage'); if(st&&st._fit) setTimeout(st._fit,40); return; }
    if(typeof renderArch!=='function') return;
    var root=document.getElementById('view'); if(!root) return;
    try{
      installOverrides(); renderArch(root); rendered=true;
      // RPAL 부연설명 + 하단 정합표(컴포넌트↔전략과제) 제거
      var rl=root.querySelector('.rpal-legend');
      if(rl){ var n=rl.nextElementSibling; while(n){ var nx=n.nextElementSibling; if(n.parentNode)n.parentNode.removeChild(n); n=nx; } rl.parentNode.removeChild(rl); }
      else { var hr=root.querySelector('hr.section-rule'); if(hr){ var m=hr.nextElementSibling; while(m){ var mx=m.nextElementSibling; m.parentNode.removeChild(m); m=mx; } hr.parentNode.removeChild(hr); } }
    }
    catch(e){ console.warn('[ax-arch] render:',e&&e.message); }
  }

  function loadBundle(){
    if(window.__axArchBundle) return; window.__axArchBundle=1;
    var s=document.createElement('script'); s.src='aihos_arch_bundle.js';
    s.onload=function(){ installOverrides(); };   // 번들의 동명 함수 선언을 내 경량 버전으로 재설치
    s.onerror=function(){ console.warn('[ax-arch] bundle 로드 실패'); };
    document.head.appendChild(s);
  }

  injectCss();
  installOverrides();
  loadBundle();
  var n=0, t=setInterval(function(){
    injectCss(); ensureView(); ensureTab();
    // 새로고침 시 마지막 탭이 arch 였다면 자동 렌더
    try{ if(localStorage.getItem('ax_tab')==='arch'){ var v=document.getElementById('v-arch'); if(v&&!v.classList.contains('active')){ var tb=document.querySelector('.tab[data-t="arch"]'); if(tb&&typeof switchTab==='function'){ switchTab('arch',tb); } } renderArchIfNeeded(); } }catch(e){}
    if(++n>120) clearInterval(t);
  }, 500);
})();
