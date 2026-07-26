/* =========================================================================
 * ax_wbs.js — 세부계획(WBS) 표 편집 강화
 * -------------------------------------------------------------------------
 * index.html 은 건드리지 않고 런타임에 얹는다.
 *  ① 패널 폭 확대 (가로를 더 넓게)
 *  ② "📅 일정만" 버튼 — 날짜 중심 열만 남기고 나머지 열을 임시로 숨김
 *     (저장된 열 설정 schedCfg 는 건드리지 않는다. 버튼 토글로만 동작)
 *  ③ 대과제 라벨 전용 드래그 핸들 — 그룹 헤더를 잡고 끌면 그 대과제의
 *     세부과제 전체가 통째로 이동. (행 번호칸 드래그 = 세부과제 하나만 이동)
 *  ④ 추가·이동 후 번호 자동 정리 — 대과제 순서=앞자리, 세부 순서=뒷자리.
 *     (수동 seq 편집은 그대로 허용. 구조가 바뀔 때만 재계산)
 * =======================================================================*/
(function(){
  'use strict';

  /* ── 접근자 (index.html 의 const 는 window 에 없다) ── */
  function _sb(){ if(window.supa)return window.supa; try{ if(typeof supa!=='undefined')return supa; }catch(e){} return null; }
  function _cur(){ try{ if(typeof currentSchedTask!=='undefined')return currentSchedTask; }catch(e){} return window.currentSchedTask||null; }
  function _cache(id){ try{ if(typeof schedCache!=='undefined')return schedCache[id]||[]; }catch(e){} return []; }
  function _who(){ try{ if(typeof whoAmI==='function')return whoAmI(); }catch(e){} return '익명'; }
  function _authed(){ try{ if(typeof authUser!=='undefined')return !!authUser; }catch(e){} return !!window.authUser; }
  function _parts(seq){ try{ if(typeof _seqParts==='function')return _seqParts(seq); }catch(e){}
    return String(seq||'').split('.').map(function(x){return parseInt(x,10);}).filter(function(x){return !isNaN(x);}); }
  function _reload(id){ try{ if(typeof reloadSched==='function')return reloadSched(id); }catch(e){} }
  function _render(){ const id=_cur(); try{ if(typeof renderSchedule==='function')renderSchedule(id); }catch(e){} }

  /* ── ① 패널 폭 + ③ 핸들 스타일 ── */
  function injectCss(){
    if(document.getElementById('axWbsCss'))return;
    const st=document.createElement('style'); st.id='axWbsCss';
    st.textContent=[
      '.sw-modal{max-width:min(2200px,98vw)!important;width:98vw!important}',
      '.sw-overlay,#swOverlay{padding:10px!important}',
      '#axDateOnlyBtn.on{background:#0e8c86!important;color:#fff!important;border-color:#0e8c86!important}',
      '.sw-table tr.wbs-grp .ax-ghandle{display:inline-flex;align-items:center;gap:3px;cursor:grab;user-select:none;',
      '  font-size:.68rem;font-weight:800;line-height:1;margin-right:7px;padding:2px 7px;border-radius:11px;',
      '  color:#7a5c00;background:#fbe6a8;border:1px solid #e6c766;vertical-align:middle}',
      '.sw-table tr.wbs-grp .ax-ghandle:hover{background:#f5d97a;color:#5c4500}',
      '.sw-table tr.wbs-grp .ax-ghandle:active{cursor:grabbing}',
      '.sw-table tr.wbs-grp.ax-gdrag td{opacity:.5}',
      '.sw-table tr.wbs-grp.ax-gdrop td{box-shadow:inset 0 3px 0 #0e8c86}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── ② 일정만 보기: colHidden 을 감싸 날짜 외 열을 임시 숨김 ── */
  var KEEP=new Set(['phase','seq','name','start_date','end_date','calc_dur','progress']);
  window.__wbsDateOnly=false;
  function wrapColHidden(){
    if(typeof window.colHidden!=='function' || window.colHidden.__axWbs) return;
    var orig=window.colHidden;
    var w=function(f){ if(window.__wbsDateOnly && !KEEP.has(f)) return true; return orig.apply(this,arguments); };
    w.__axWbs=true; window.colHidden=w;
  }

  /* ── 번호 자동 정리 ── */
  function _lvl(r){ const p=_parts(r.seq); return p.length>=3?3:2; }
  async function renumber(){
    const id=_cur(); const sb=_sb(); if(!id||!sb)return;
    const rows=_cache(id).slice().sort(function(a,b){return (a.sort_order||0)-(b.sort_order||0);});
    if(!rows.length)return;
    let major=0,minor=0,sub=0,lastPhase=null,carry='';
    const upd=[];
    rows.forEach(function(r){
      const p=(r.phase||'').trim(); if(p)carry=p;
      const grp=carry||'(대과제 미지정)';
      const isHead=(grp!==lastPhase);
      if(isHead){ major++; minor=0; sub=0; lastPhase=grp; }
      let ns;
      if(_lvl(r)>=3){ if(minor===0)minor=1; sub++; ns=major+'.'+minor+'.'+sub; }
      else { minor++; sub=0; ns=major+'.'+minor; }
      const patch={};
      if(String(r.seq||'')!==ns){ r.seq=ns; patch.seq=ns; }
      // 대과제 라벨 앞의 번호도 위치에 맞춰 고친다 (예: "3. AI…" → "2. AI…")
      if(isHead && p){
        const relabeled=p.replace(/^\s*\d+[.)]\s*/, major+'. ');
        if(relabeled!==r.phase){ r.phase=relabeled; patch.phase=relabeled; }
      }
      if(Object.keys(patch).length){ patch.id=r.id; upd.push(patch); }
    });
    if(!upd.length)return;
    try{ for(const u of upd){ const body={updated_by:_who(),updated_at:new Date().toISOString()}; if(u.seq!=null)body.seq=u.seq; if(u.phase!=null)body.phase=u.phase; await sb.from('ax_schedules').update(body).eq('id',u.id); } }
    catch(e){ console.warn('[wbs] renumber:',e&&e.message); }
    await _reload(id);
  }

  /* ── ③ 대과제 그룹 통째 이동 ── */
  var _gDrag=null;   // 드래그 중인 대과제(phase 라벨)
  function _phaseMap(rows){ const m={}; let lp=''; rows.forEach(function(r){const p=(r.phase||'').trim();if(p)lp=p;m[r.id]=lp||'(대과제 미지정)';}); return m; }

  async function moveGroup(srcPhase, dstPhase){
    const id=_cur(); const sb=_sb(); if(!id||!sb)return;
    if(!_authed()){ alert('구글 로그인 후 이용하세요.'); return; }
    if(srcPhase===dstPhase)return;
    const rows=_cache(id).slice().sort(function(a,b){return (a.sort_order||0)-(b.sort_order||0);});
    const pm=_phaseMap(rows);
    const block=rows.filter(function(r){return pm[r.id]===srcPhase;});
    const rest=rows.filter(function(r){return pm[r.id]!==srcPhase;});
    if(!block.length)return;
    // 그룹 순서를 구해 드래그 방향을 판단한다
    const order=[]; rows.forEach(function(r){ const p=pm[r.id]; if(order[order.length-1]!==p) order.push(p); });
    const si=order.indexOf(srcPhase), di=order.indexOf(dstPhase);
    let insAt;
    if(si<di){
      // 아래로 이동 → dst 그룹 "뒤"에 넣는다
      insAt=rest.length;
      for(let i=rest.length-1;i>=0;i--){ if(pm[rest[i].id]===dstPhase){ insAt=i+1; break; } }
    } else {
      // 위로 이동 → dst 그룹 "앞"에 넣는다
      insAt=0;
      for(let i=0;i<rest.length;i++){ if(pm[rest[i].id]===dstPhase){ insAt=i; break; } }
    }
    const merged=rest.slice(0,insAt).concat(block, rest.slice(insAt));
    const before=rows.map(function(r){return {id:r.id,so:r.sort_order};});
    const upd=[]; merged.forEach(function(r,i){ const so=(i+1)*10; if(r.sort_order!==so){ r.sort_order=so; upd.push({id:r.id,so:so}); } });
    if(!upd.length)return;
    try{
      for(const u of upd){ await sb.from('ax_schedules').update({sort_order:u.so,updated_by:_who(),updated_at:new Date().toISOString()}).eq('id',u.id); }
      if(typeof pushUndo==='function') pushUndo({label:'대과제 이동',run:async function(){ for(const b of before){ await sb.from('ax_schedules').update({sort_order:b.so}).eq('id',b.id); } await _reload(id); }});
      await _reload(id);
      await renumber();
      if(typeof toast==='function') toast('대과제 “'+srcPhase+'” 이동 완료');
    }catch(e){ alert('대과제 이동 실패: '+(e&&e.message||'')); await _reload(id); }
  }

  /* 그룹 헤더에 드래그 핸들을 심고, 그룹 간 드롭을 연결한다 */
  function decorateGroups(){
    const tbl=document.querySelector('.sw-table'); if(!tbl)return;
    const canEdit=_authed();
    tbl.querySelectorAll('tr.wbs-grp').forEach(function(tr){
      const lab=tr.querySelector('.wbs-glabel'); if(!lab)return;
      const nameEl=lab.querySelector('.wbs-gname'); const phase=nameEl?nameEl.textContent.trim():'';
      tr.dataset.axPhase=phase;
      if(canEdit && !lab.querySelector('.ax-ghandle')){
        const h=document.createElement('span'); h.className='ax-ghandle'; h.innerHTML='⠿ 이동'; h.title='이 손잡이를 잡고 다른 대과제 위로 끌면 대과제 전체가 이동합니다'; h.draggable=true;
        h.addEventListener('dragstart',function(e){ _gDrag=phase; tr.classList.add('ax-gdrag'); try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','grp:'+phase);}catch(_){} e.stopPropagation(); });
        h.addEventListener('dragend',function(){ _gDrag=null; tbl.querySelectorAll('.ax-gdrag,.ax-gdrop').forEach(function(x){x.classList.remove('ax-gdrag','ax-gdrop');}); });
        lab.insertBefore(h, lab.firstChild);
      }
      tr.addEventListener('dragover',function(e){ if(!_gDrag)return; e.preventDefault(); tbl.querySelectorAll('.ax-gdrop').forEach(function(x){x.classList.remove('ax-gdrop');}); tr.classList.add('ax-gdrop'); });
      tr.addEventListener('drop',function(e){ if(!_gDrag)return; e.preventDefault(); const src=_gDrag; _gDrag=null; const dst=tr.dataset.axPhase; tbl.querySelectorAll('.ax-gdrag,.ax-gdrop').forEach(function(x){x.classList.remove('ax-gdrag','ax-gdrop');}); if(src&&dst&&src!==dst) moveGroup(src,dst); });
    });
  }

  /* ── ④ 추가·이동 후 자동 번호: 해당 함수들을 감싼다 ── */
  function wrapMutations(){
    ['addWbsNode','moveRowBlock'].forEach(function(name){
      const orig=window[name];
      if(typeof orig!=='function' || orig.__axRenum) return;
      const w=function(){
        const r=orig.apply(this,arguments);
        Promise.resolve(r).then(function(){ setTimeout(renumber,60); }).catch(function(){});
        return r;
      };
      w.__axRenum=true; window[name]=w;
    });
  }

  /* ── ⑤ 그룹 첫 행을 지워도 대과제 라벨이 사라지지 않게 한다 ──
   *  phase 는 그룹의 첫 행에만 저장되고 아래로 상속된다. 첫 행을 지우면
   *  라벨이 통째로 사라지므로, 삭제 직전에 다음 행으로 라벨을 넘겨준다. */
  function wrapDelete(){
    const orig=window.deleteRow;
    if(typeof orig!=='function' || orig.__axKeepPhase) return;
    const w=async function(delId){
      const id=_cur(); const sb=_sb();
      let ph='', nextId=null;
      try{
        if(id && sb && delId){
          const rows=_cache(id).slice().sort(function(a,b){return (a.sort_order||0)-(b.sort_order||0);});
          const i=rows.findIndex(function(r){return r.id===delId;});
          if(i>=0){
            ph=String(rows[i].phase||'').trim();
            const nx=rows[i+1];
            if(ph && nx && !String(nx.phase||'').trim()) nextId=nx.id;
          }
        }
      }catch(e){ console.warn('[wbs] keepPhase(pre):',e&&e.message); }
      const r=await orig.apply(this,arguments);
      try{
        // 실제로 지워졌을 때만 라벨을 다음 행으로 넘긴다 (취소/실패 시 원본 유지)
        if(nextId && sb){
          const still=_cache(id).some(function(x){return x.id===delId;});
          const nx=_cache(id).find(function(x){return x.id===nextId;});
          if(!still && nx && !String(nx.phase||'').trim()){
            nx.phase=ph;
            await sb.from('ax_schedules').update({phase:ph,updated_by:_who(),updated_at:new Date().toISOString()}).eq('id',nextId);
            await _reload(id);
          }
        }
      }catch(e){ console.warn('[wbs] keepPhase(post):',e&&e.message); }
      setTimeout(renumber,60);
      return r;
    };
    w.__axKeepPhase=true; window.deleteRow=w;
  }

  /* ── 일정만 버튼을 리본에 심는다 ── */
  function mountBtn(){
    const rb=document.querySelector('#swPanel .sw-ribbon'); if(!rb || rb.querySelector('#axDateOnlyBtn'))return;
    const b=document.createElement('button'); b.id='axDateOnlyBtn'; b.className='rb-ib'; b.textContent='📅 일정만';
    b.title='날짜 중심 열만 보기 (가중치·차이·담당·산출물 등 임시 숨김)';
    b.onclick=function(){ window.__wbsDateOnly=!window.__wbsDateOnly; b.classList.toggle('on',window.__wbsDateOnly); _render(); };
    // 접기/펼치기 버튼 근처에 놓는다
    rb.appendChild(b);
  }

  /* ── 스케줄이 다시 그려질 때마다 장식/버튼 재부착 ── */
  function afterRender(){ injectCss(); mountBtn(); decorateGroups(); if(window.__wbsDateOnly){ const b=document.getElementById('axDateOnlyBtn'); if(b)b.classList.add('on'); } }

  function hookRender(){
    const orig=window.renderSchedule;
    if(typeof orig!=='function' || orig.__axWbsHooked) return false;
    const w=function(){ const r=orig.apply(this,arguments); try{ afterRender(); }catch(e){ console.warn('[wbs]',e&&e.message); } return r; };
    w.__axWbsHooked=true; window.renderSchedule=w;
    return true;
  }

  /* ── 부팅: 필요한 전역이 준비될 때까지 지켜본다 ── */
  injectCss();
  wrapColHidden();
  let n=0;
  const t=setInterval(function(){
    wrapColHidden(); wrapMutations(); wrapDelete();
    if(hookRender()){ /* 이미 열려있으면 즉시 장식 */ if(document.querySelector('.sw-table')) afterRender(); }
    afterRender();
    if(++n>120) clearInterval(t);
  },500);

  window.axWbs={ renumber:renumber, moveGroup:moveGroup, decorate:decorateGroups };
})();

/* =========================================================================
 * ⑥ 개요 탭 드릴다운을 진척분석 탭과 같은 "대과제 ▶ 세부과제" 형식으로
 *    개요의 완료/진행중/지연 카드는 세부과제만 평면으로 보여주고 있었다.
 *    진척분석(openDeptList)과 동일한 행 구조·정렬로 맞춘다.
 *    집계 소스는 양쪽 모두 _wbsLeaves + wbsStatus 로 이미 동일하다.
 * =======================================================================*/
(function(){
  'use strict';
  var S_TOP='color:var(--muted); font-size:.8rem; font-weight:700;';
  var S_ARR='color:var(--border); margin:0 5px; font-size:.7rem;';
  var S_LEAF='font-weight:800;';
  function _esc(s){ try{ if(typeof escH==='function')return escH(s); }catch(e){}
    return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function _leaves(rows){ try{ if(typeof _wbsLeaves==='function')return _wbsLeaves(rows||[]); }catch(e){} return []; }
  function _cacheOf(id){ try{ if(typeof schedCache!=='undefined')return schedCache[id]||[]; }catch(e){} return []; }
  function _tasks(){ try{ if(typeof TASKS!=='undefined')return TASKS; }catch(e){} return []; }

  function hierList(key){
    var stKey={done:'완료',prog:'진행중',over:'지연'};
    var lab={miles:'세부계획(WBS) 전체',done:'완료 세부계획',prog:'진행중 세부계획',over:'지연 세부계획'};
    var all=[];
    _tasks().forEach(function(t){ _leaves(_cacheOf(t.id)).forEach(function(r){ all.push({r:r,tid:t.id,title:t.title}); }); });
    var filt=(key==='miles')?all:all.filter(function(x){ return wbsStatus(x.r)===stKey[key]; });
    // 대과제(전략과제) → 세부과제 번호 순으로 정렬해 계층이 눈에 들어오게 한다
    filt.sort(function(a,b){
      return a.tid.localeCompare(b.tid) ||
             String(a.r.seq||'').localeCompare(String(b.r.seq||''),undefined,{numeric:true});
    });
    var body=filt.map(function(x){
      var s=wbsStatus(x.r), sk=statusKey(s);
      return '<div class="kl-item click" onclick="openSchedule(\''+x.tid+'\')">'+
        '<span class="kl-main"><span class="dot '+sk+'"></span>'+
        '<span style="'+S_TOP+'">'+_esc(x.tid)+' '+_esc(x.title)+'</span>'+
        '<span style="'+S_ARR+'">▶</span>'+
        '<span style="'+S_LEAF+'">'+_esc(x.r.seq||'')+' '+_esc(x.r.name||'')+'</span></span>'+
        '<span class="kl-sub">시작일: '+_esc(x.r.start_date||'-')+'</span>'+
        '<span class="ms '+sk+'">'+s+'</span></div>';
    }).join('')||'<div class="hint">세부계획 항목이 없습니다.</div>';
    return {title:lab[key]+' '+filt.length+'개', body:body};
  }

  function wrapKpi(){
    var orig=window.openKpiList;
    if(typeof orig!=='function' || orig.__axHier) return;
    var w=function(key){
      // 목표·과제 카드는 원본 그대로 (계층 개념이 없다)
      if(key!=='done' && key!=='prog' && key!=='over' && key!=='miles') return orig.apply(this,arguments);
      try{
        var o=hierList(key);
        if(typeof modalTask!=='undefined'){ try{ modalTask=null; }catch(e){} }
        document.getElementById('modal').innerHTML=
          '<div class="mh"><div class="mt">'+o.title+'</div><button class="close" onclick="closeModal()">×</button></div>'+
          '<div class="hint" style="margin:2px 0 10px">항목을 클릭하면 해당 전략과제의 세부계획으로 이동합니다.</div>'+
          '<div class="kl-list">'+o.body+'</div>';
        document.getElementById('overlay').classList.add('open');
        if(typeof refreshBodyLock==='function') refreshBodyLock();
      }catch(e){ console.warn('[kpi-hier]',e&&e.message); return orig.apply(this,arguments); }
    };
    w.__axHier=true; window.openKpiList=w;
  }

  var n=0;
  var t=setInterval(function(){ wrapKpi(); if(++n>120) clearInterval(t); },500);
  wrapKpi();
})();

/* =========================================================================
 * ⑦ 세부계획 간트 헤더 월 표시 복구 + 사업 단계 위젯 지표 라벨
 *  (가) 간트 헤더는 두 줄(월 26.07 / 주차 1~5)인데 두 줄 모두 sticky top:0 이라
 *       세로 스크롤 시 주차 줄이 월 줄을 덮어 "월이 사라지고 주차만 남는" 문제.
 *       월 헤더 높이만큼 주차 헤더 top 을 내려 두 줄이 계단식으로 남게 한다.
 *  (나) 사업 타임라인 탭의 "단계 흐름" 위젯 진행률은 마일스톤(statusOf) 기준이라
 *       같은 화면의 종합 진척률(WBS 롤업)과 값이 다르다. 개요 탭처럼
 *       "마일스톤 기준" 안내 라벨을 붙여 지표 혼동을 막는다.
 * =======================================================================*/
(function(){
  'use strict';

  /* (가) 간트 헤더 sticky 층 분리: 월=top0, 주차=top(월높이)
   *  원본 fixStickyHeader() 가 주차 top 을 인라인으로 넣지만 다른 규칙에
   *  덮여 무력화된다. !important 로 확실히 적용한다. */
  function injectHeaderCss(){
    if(document.getElementById('axWbsHeadCss')) return;
    var st=document.createElement('style'); st.id='axWbsHeadCss';
    st.textContent=[
      '.sw-table thead .sw-mh{position:sticky !important;top:0 !important;z-index:16}',
      '.sw-table thead .sw-wh{position:sticky !important;top:var(--ax-mh-h,33px) !important;z-index:15}'
    ].join('\n');
    document.head.appendChild(st);
  }
  /* 월 헤더 실제 높이를 재서 CSS 변수에 반영(폰트·줌 변화 대응)
   * + 원본이 주차 th 에 박아둔 인라인 top 잔재를 지워 CSS 규칙이 이기게 한다 */
  function measureHead(){
    var tbl=document.querySelector('.sw-table'); if(!tbl) return;
    var mh=tbl.querySelector('.sw-mh'); if(!mh) return;
    var h=Math.round(mh.getBoundingClientRect().height);
    if(h>0) document.documentElement.style.setProperty('--ax-mh-h', h+'px');
    tbl.querySelectorAll('thead .sw-wh').forEach(function(w){ if(w.style.top) w.style.removeProperty('top'); });
  }

  /* (나) 단계 위젯에 "마일스톤 기준" 안내 라벨 삽입 */
  function tagPhaseWidget(){
    var pf=document.getElementById('phaseFlow');
    if(!pf || document.getElementById('axPhaseNote')) return;
    var note=document.createElement('div');
    note.id='axPhaseNote';
    note.style.cssText='font-size:.72rem;color:var(--muted);margin:2px 0 8px;line-height:1.5';
    note.textContent='※ 아래 단계별 진행률은 로드맵 단계(마일스톤 날짜) 기준입니다. 실제 사업 진척은 위 종합 진척률(세부계획 WBS 롤업)을 보세요.';
    pf.parentElement.insertBefore(note, pf);
  }
  function wrapRoute(){
    var orig=window.renderRoute;
    if(typeof orig!=='function' || orig.__axNoted) return false;
    var w=function(){ var r=orig.apply(this,arguments); try{ tagPhaseWidget(); }catch(e){} return r; };
    w.__axNoted=true; window.renderRoute=w;
    return true;
  }

  injectHeaderCss();

  var n=0;
  var t=setInterval(function(){
    injectHeaderCss(); measureHead();
    if(wrapRoute()){ if(document.getElementById('phaseFlow')) tagPhaseWidget(); }
    tagPhaseWidget();
    if(++n>120) clearInterval(t);
  },500);
})();

/* =========================================================================
 * ⑧ 세부계획 셀 안 여러 줄 입력 지원
 *  (가) 텍스트 셀에 줄바꿈이 화면에 보이도록 white-space:pre-wrap 적용.
 *  (나) Shift+Enter / Alt+Enter → 셀 안 줄바꿈 삽입(엑셀 Alt+Enter 호환).
 *       그냥 Enter 는 기존대로 아래 셀 이동.
 *  (다) ↑/↓ → 셀 안에 여러 줄이 있으면 줄 사이로 커서 이동, 첫 줄에서 ↑ ·
 *       마지막 줄에서 ↓ 일 때만 셀 이동. (기존엔 무조건 셀 이동이었다)
 *  cellKey 는 index.html 전역 함수라 window 재할당으로 덮어쓴다.
 * =======================================================================*/
(function(){
  'use strict';

  /* (가) 줄바꿈이 보이도록 — 날짜 셀은 제외(한 줄 숫자 입력용) */
  function injectCellCss(){
    if(document.getElementById('axWbsCellCss')) return;
    var st=document.createElement('style'); st.id='axWbsCellCss';
    st.textContent='.sw-table td[contenteditable="true"]:not(.sw-datece){white-space:pre-wrap !important;word-break:break-word}';
    document.head.appendChild(st);
  }

  /* 커서가 셀의 첫 줄(top) / 마지막 줄(bottom) 에 있는지 판정 */
  function _caretAtVEdge(el, edge){
    var sel=window.getSelection(); if(!sel||!sel.rangeCount) return true;
    var range=sel.getRangeAt(0);
    if(!el.contains(range.startContainer)) return true;
    var cr=range.getBoundingClientRect();
    if((!cr || (cr.top===0 && cr.bottom===0))){
      // collapsed 커서라 rect 가 비면 임시 마커로 위치를 잰다
      try{
        var m=document.createElement('span'); m.textContent='​';
        var r2=range.cloneRange(); r2.collapse(true); r2.insertNode(m);
        cr=m.getBoundingClientRect();
        var p=m.parentNode; if(p){ p.removeChild(m); if(p.normalize) p.normalize(); }
      }catch(_){ return true; }
    }
    var box=el.getBoundingClientRect();
    var lh=parseFloat(getComputedStyle(el).lineHeight)||18; if(!lh || isNaN(lh)) lh=18;
    if(edge==='top')    return (cr.top - box.top) <= lh*0.75;
    return (box.bottom - cr.bottom) <= lh*0.75;
  }

  function newCellKey(e, el){
    if(e.isComposing||e.keyCode===229) return;   // 한글 조합 중엔 처리 안 함
    var isEnter=(e.key==='Enter'||e.keyCode===13);
    // (나) Shift+Enter / Alt+Enter → 셀 안 줄바꿈
    if(isEnter && (e.altKey||e.shiftKey)){
      e.preventDefault();
      try{ document.execCommand('insertLineBreak'); }
      catch(_){ try{ document.execCommand('insertHTML',false,'<br>'); }catch(__){} }
      return;
    }
    if(isEnter){ e.preventDefault(); if(!window._swMoveCell(el,1,0)) el.blur(); return; }
    if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); el.blur(); return; }
    if(e.key==='Tab'){ e.preventDefault(); window._swMoveCell(el,0,e.shiftKey?-1:1); return; }
    // (다) 위/아래: 셀 안 줄 경계에서만 셀 이동, 아니면 기본 줄 이동 허용
    if(e.key==='ArrowUp'){ if(_caretAtVEdge(el,'top')){ e.preventDefault(); window._swMoveCell(el,-1,0);} return; }
    if(e.key==='ArrowDown'){ if(_caretAtVEdge(el,'bottom')){ e.preventDefault(); window._swMoveCell(el,1,0);} return; }
    if(e.key==='ArrowLeft' && window._caretAtEdge(el,'start')){ e.preventDefault(); window._swMoveCell(el,0,-1); return; }
    if(e.key==='ArrowRight' && window._caretAtEdge(el,'end')){ e.preventDefault(); window._swMoveCell(el,0,1); return; }
  }

  function wrapCellKey(){
    if(typeof window.cellKey==='function' && window.cellKey.__axMultiline) return;
    if(typeof window._swMoveCell!=='function' || typeof window._caretAtEdge!=='function') return; // 의존 함수 준비 대기
    newCellKey.__axMultiline=true; window.cellKey=newCellKey;
  }

  injectCellCss();
  var n=0;
  var t=setInterval(function(){ injectCellCss(); wrapCellKey(); if(++n>120) clearInterval(t); },500);
  wrapCellKey();
})();
