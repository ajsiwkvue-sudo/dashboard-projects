/* ── 확장 모듈 로더 ────────────────────────────────────────────────
   ax_port.js 는 이 파일만 로드한다. 이후 추가되는 자기완결 모듈은 여기서 잇는다.
   (ax_port.js 는 콘솔·편집잠금·감사로그가 얽혀 있어 수정 위험이 커 손대지 않는다) */
(function(){
  ['ax_gantt.js'].forEach(function(f){
    if([].slice.call(document.scripts).some(function(s){return (s.src||'').indexOf(f)>=0;})) return;
    var s=document.createElement('script'); s.src=f;
    s.onerror=function(){ console.warn('[ax] '+f+' 로드 실패'); };
    document.head.appendChild(s);
  });
})();

/* ── 세부계획 리본 → 산출물 탭 이동 (ax_port.js 의 버튼이 직접 호출한다) ──
   예전에는 ax_port.js 의 팝업을 캡처 단계에서 가로챘지만, 팝업 자체를 없애고
   버튼이 이 함수를 바로 부르도록 바꿨다. 가로채기 해킹은 더 이상 필요 없다. */
(function(){
  window.axOutputsGoto=function(tid){
    const tab=[].slice.call(document.querySelectorAll('nav.tabs .tab'))
                .find(function(t){return t.dataset.t==='outputs';});
    const view=document.getElementById('v-outputs');
    if(!tab||!view) return false;
    // 해당 과제가 속한 목표 그룹을 먼저 펼친다
    const task=(window.TASKS||[]).find(function(x){return x.id===tid;})
            || (function(){ try{ return TASKS.find(function(x){return x.id===tid;}); }catch(e){ return null; } })();
    if(task) view.dataset.g=String(task.goal);
    tab.click();
    // render() 가 innerHTML 을 통째로 갈아끼우기 때문에 한 번만 스크롤하면
    // 뒤이어 오는 재렌더에 밀려 원위치된다. 자리를 잡을 때까지 몇 번 다시 맞춘다.
    // behavior:'smooth' 를 반복 호출하면 매번 애니메이션이 취소돼 영영 도착하지 못한다.
    // 즉시 스크롤로 자리를 잡고, 자리가 맞으면 멈춘다.
    let n=0, settled=0;
    const t=setInterval(function(){
      const lane=view.querySelector('.sw[data-t="'+tid+'"]');
      if(lane){
        const r=lane.getBoundingClientRect();
        if(Math.abs(r.top+r.height/2-window.innerHeight/2)<80){ if(++settled>=2) return clearInterval(t); }
        else { settled=0; lane.scrollIntoView({block:'center'}); }
      }
      if(++n>14) clearInterval(t);
    },200);
    return true;
  };
})();

/* =========================================================================
 * ax_outputs.js — 산출물 · KPI 트래커 탭
 * -------------------------------------------------------------------------
 * 산출물은 두 층이다. 각 층의 "이름"이 어디서 오는지가 핵심이다.
 *   ① 전략과제 기대산출물 : ax_outputs(kind='goal') 가 원본 — 이 화면에서 추가·수정·삭제한다.
 *      (예전에는 index.html 의 TASKS[].outcome 하드코딩이었고, DB로 이관했다)
 *   ② 세부과제 산출물     : ax_schedules.deliverable 이 원본 — 이름은 세부계획에서만 고친다.
 *      ax_outputs 는 그 행의 상태·파일·링크만 보관하고, 이름은 표시에 쓰지 않는다.
 *      따라서 세부계획에서 산출물명을 바꾸면 이 탭도 즉시 따라간다(사본 불일치 없음).
 * 저장은 ax_outputs 한 테이블. kind='goal'(task_id+idx) / 'sched'(sched_id) 로 구분.
 *
 * 지표: 전략별 "산출물 등록률" = 세부과제 산출물 중 status='완료' 인 비율.
 *   담당자가 상태를 직접 '완료'로 바꿔야 집계된다(파일 첨부만으로는 오르지 않는다).
 *   이는 일정 진척률(taskProgress)과 별개의 지표다 — 혼동 주의.
 * 수량형 기대산출물(예: "AI Agent 30종")은 목표/실적을 입력해 진행률을 직접 트래킹한다.
 * index.html 은 건드리지 않는다 — 탭·뷰를 런타임에 주입한다.
 * =======================================================================*/
(function(){
  'use strict';

  const BUCKET='ax';
  let OUT={};            // key -> row(ax_outputs)
  let mounted=false;

  /* ── 접근자 (index.html 의 const/let 은 window 에 없다) ── */
  function _sb(){
    if(typeof window!=='undefined' && window.supa) return window.supa;
    try{ if(typeof supa!=='undefined' && supa) return supa; }catch(e){}
    return null;
  }
  function _tasks(){
    try{ if(typeof TASKS!=='undefined' && TASKS) return TASKS; }catch(e){}
    return (window.TASKS)||[];
  }
  function _sched(id){
    try{ if(typeof schedCache!=='undefined' && schedCache) return schedCache[id]||[]; }catch(e){}
    return [];
  }
  function _me(){
    try{ if(typeof whoAmI==='function') return whoAmI(); }catch(e){}
    return '';
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toast(m){ try{ if(typeof window.toast==='function') return window.toast(m); }catch(e){} }

  /* ── "AI Agent 30종" → {target:30, unit:'종'} · 없으면 완료체크형 ── */
  function parseTarget(text){
    const m=String(text||'').match(/(\d+)\s*(종|명|건|편|개|대)/);
    return m ? {target:+m[1], unit:m[2]} : null;
  }

  /* ── Storage 키: ASCII 만 남기고 확장자는 보존 ── */
  function _key(name){
    const s=String(name||'file');
    const i=s.lastIndexOf('.');
    const ext=(i>0? s.slice(i+1):'').replace(/[^A-Za-z0-9]/g,'').slice(0,8).toLowerCase();
    const base=(i>0? s.slice(0,i):s).replace(/[^A-Za-z0-9._-]/g,'').slice(0,40);
    return Date.now()+'_'+(base||'file')+(ext?'.'+ext:'');
  }

  /* ── 정의된 산출물 목록(두 층) ──
   *  기대산출물(goal) : ax_outputs 가 원본. (예전엔 TASKS[].outcome 하드코딩이었다)
   *  세부과제 산출물(sched) : ax_schedules.deliverable 이 원본. ax_outputs 는 첨부·상태만 보관.
   *    → 이름은 항상 세부계획에서 읽는다. ax_outputs.text 는 표시에 쓰지 않는다. */
  function rows(){
    const out=[];
    _tasks().forEach(t=>{
      Object.keys(OUT).forEach(k=>{
        const s=OUT[k];
        if(!s || s.kind!=='goal' || s.task_id!==t.id) return;
        out.push({key:t.id+'|goal|'+(s.idx||0), task_id:t.id, kind:'goal', idx:(s.idx||0), sched_id:null,
                  text:String(s.text||''), sub:'', due:'', guess:parseTarget(String(s.text||''))});
      });
      _sched(t.id).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).forEach(r=>{
        const d=String(r.deliverable||'').trim(); if(!d) return;
        out.push({key:t.id+'|sched|'+r.id, task_id:t.id, kind:'sched', idx:0, sched_id:r.id,
                  text:d, sub:(r.seq||'')+' '+(r.name||''), due:r.end_date||'',
                  rowPct:Math.max(0,Math.min(100,+(r.progress||0))), guess:parseTarget(d)});
      });
    });
    out.sort((a,b)=> a.task_id.localeCompare(b.task_id) || (a.kind===b.kind?0:(a.kind==='goal'?-1:1)) || (a.idx-b.idx));
    return out;
  }

  function _authed(){ try{ if(typeof authUser!=='undefined') return !!authUser; }catch(e){} return !!window.authUser; }

  /* ── 기대산출물 추가/삭제 (ax_outputs kind='goal' 이 원본) ── */
  async function addGoal(tid, txt){
    const sb=_sb(); if(!sb) return;
    // idx 는 해당 과제에서 가장 큰 값 +1 (삭제 후 빈 번호는 재사용하지 않는다)
    let mx=-1;
    Object.keys(OUT).forEach(k=>{ const s=OUT[k]; if(s&&s.kind==='goal'&&s.task_id===tid) mx=Math.max(mx,+(s.idx||0)); });
    try{
      const {data,error}=await sb.from('ax_outputs').insert({
        task_id:tid, kind:'goal', idx:mx+1, text:txt, status:'예정', done:false,
        updated_at:new Date().toISOString()
      }).select().single();
      if(error) throw error;
      OUT[tid+'|goal|'+data.idx]=data;
      try{ if(typeof window.audit==='function') window.audit('기대산출물 추가', tid+' · '+txt); }catch(e){}
      toast('기대산출물을 추가했어요.'); render();
    }catch(e){ console.warn('[outputs] addGoal:',e&&e.message); toast('추가 실패: '+(e&&e.message||'')); }
  }
  async function delGoal(r){
    const sb=_sb(); if(!sb) return;
    const cur=OUT[r.key]; if(!cur||!cur.id){ toast('삭제할 항목을 찾지 못했어요.'); return; }
    try{
      const {error}=await sb.from('ax_outputs').delete().eq('id',cur.id);
      if(error) throw error;
      delete OUT[r.key];
      try{ if(typeof window.audit==='function') window.audit('기대산출물 삭제', r.task_id+' · '+r.text); }catch(e){}
      toast('삭제했어요.'); render();
    }catch(e){ console.warn('[outputs] delGoal:',e&&e.message); toast('삭제 실패: '+(e&&e.message||'')); }
  }

  /* ── 등록 판정: 상태가 '완료' 여야 등록으로 센다 ── */
  function isDone(r){ const s=OUT[r.key]||{}; return s.status==='완료'; }
  /* 전략과제별 산출물 등록률 (세부과제 산출물 기준) */
  function laneStat(tid, list){
    const mic=list.filter(r=>r.task_id===tid && r.kind==='sched');
    const dn=mic.filter(isDone).length;
    return {done:dn, total:mic.length, pct: mic.length?Math.round(dn/mic.length*100):0};
  }

  /* ── 진행률: 수량형이면 실적/목표, 아니면 완료 0/100 ── */
  function pctOf(r,s){
    if(!s) return 0;
    const tg=+(s.target_num||0);
    if(tg>0) return Math.max(0,Math.min(100,Math.round((+(s.current_num||0)/tg)*100)));
    return s.done?100:0;
  }

  /* ── 데이터 ── */
  async function load(){
    const sb=_sb(); if(!sb) return;
    try{
      const {data,error}=await sb.from('ax_outputs').select('*');
      if(error) throw error;
      OUT={};
      (data||[]).forEach(r=>{
        const k = r.kind==='sched' ? (r.task_id+'|sched|'+r.sched_id) : (r.task_id+'|goal|'+(r.idx||0));
        OUT[k]=r;
      });
    }catch(e){ console.warn('[outputs] load:',e&&e.message); }
  }
  async function save(row,patch){
    const sb=_sb(); if(!sb) return;
    const cur=OUT[row.key];
    const body=Object.assign({
      task_id:row.task_id, kind:row.kind, idx:row.idx, sched_id:row.sched_id,
      text:row.text, updated_at:new Date().toISOString()
    }, patch);
    try{
      if(cur&&cur.id){
        // sched 산출물의 이름은 세부계획이 원본이다. 저장할 때마다 사본을 최신으로 맞춰 둔다.
        const up=Object.assign({updated_at:new Date().toISOString()}, patch);
        if(row.kind==='sched' && String(cur.text||'')!==String(row.text||'') && patch.text===undefined) up.text=row.text;
        const {data,error}=await sb.from('ax_outputs').update(up).eq('id',cur.id).select().single();
        if(error) throw error; OUT[row.key]=data;
      }else{
        const {data,error}=await sb.from('ax_outputs').insert(body).select().single();
        if(error) throw error; OUT[row.key]=data;
      }
      try{ if(typeof window.audit==='function') window.audit('산출물 변경', row.text); }catch(e){}
      render();
    }catch(e){ console.warn('[outputs] save:',e&&e.message); toast('저장 실패: '+(e&&e.message||'')); }
  }

  /* ── 스타일 (Jira 스타일 3단 보드) ── */
  function styles(){
    if(document.getElementById('axOutStyles')) return;
    const st=document.createElement('style'); st.id='axOutStyles';
    st.textContent=`
    #v-outputs .op-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
    #v-outputs .op-kpi{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
    #v-outputs .op-kpi b{display:block;font-size:1.5rem;font-weight:800;color:var(--text);line-height:1.1;font-variant-numeric:tabular-nums}
    #v-outputs .op-kpi span{font-size:.74rem;color:var(--muted)}
    #v-outputs .op-hint{font-size:.78rem;color:var(--muted);margin-bottom:14px;line-height:1.6}

    /* 목표 그룹 */
    #v-outputs .gz{margin-bottom:14px}
    #v-outputs .gz-h{display:flex;align-items:center;gap:9px;padding:9px 12px;cursor:pointer;
      background:var(--card);border:1px solid var(--border);border-left:4px solid var(--c);border-radius:10px}
    #v-outputs .gz-h:hover{background:rgba(61,90,152,.04)}
    #v-outputs .gz-tg{font-size:.66rem;color:var(--muted);width:12px;text-align:center}
    #v-outputs .gz-n{flex:1;min-width:0;font-size:.88rem;font-weight:800;color:var(--c);
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #v-outputs .gz-c{font-size:.74rem;color:var(--muted);font-variant-numeric:tabular-nums}
    #v-outputs .gz-b{display:none;margin-top:12px}
    #v-outputs .gz.open .gz-b{display:block}

    /* 스윔레인 */
    #v-outputs .sw{display:grid;grid-template-columns:1fr 1.2fr 1.5fr;gap:16px;background:var(--bg);
      padding:14px;border-radius:12px;border:1px solid var(--border);margin-bottom:12px}
    #v-outputs .swc{display:flex;flex-direction:column;gap:9px;min-width:0}
    #v-outputs .swh{font-size:.7rem;font-weight:800;color:var(--muted);letter-spacing:.04em}
    #v-outputs .swh i{font-style:normal;background:var(--border);color:var(--text);padding:1px 6px;
      border-radius:9px;font-size:.66rem;margin-left:4px;font-variant-numeric:tabular-nums}
    #v-outputs .swh .gadd{float:right;background:var(--bg);border:1px solid var(--border);border-radius:6px;
      width:20px;height:20px;line-height:1;cursor:pointer;color:var(--muted);font-weight:800;padding:0}
    #v-outputs .swh .gadd:hover{border-color:var(--c);color:var(--c);background:var(--card)}
    #v-outputs .gops{display:none;gap:4px;margin-top:6px}
    #v-outputs .jc:hover .gops{display:flex}
    #v-outputs .mn{font-size:.82rem;font-weight:700;color:var(--text);line-height:1.45;flex:1;min-width:0;word-break:break-word}
    #v-outputs .stsel{border-radius:20px;border:1px solid transparent;padding:2px 6px;font-size:.68rem;
      font-weight:800;cursor:pointer;flex-shrink:0;-webkit-appearance:none;appearance:none;text-align:center}
    #v-outputs .stsel.plan{background:rgba(108,125,142,.12);color:var(--gray)}
    #v-outputs .stsel.prog{background:rgba(217,131,36,.12);color:var(--warning)}
    #v-outputs .stsel.done{background:rgba(29,158,117,.14);color:#0e8c86}
    #v-outputs .stsel:hover{border-color:var(--c)}
    #v-outputs .jc{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;
      box-shadow:0 1px 3px rgba(0,0,0,.04);transition:box-shadow .18s,border-color .18s}
    #v-outputs .jc:hover{box-shadow:0 4px 12px rgba(61,90,152,.10);border-color:var(--c)}
    #v-outputs .mc .mt{font-size:.92rem;font-weight:800;color:var(--text);line-height:1.4;margin-bottom:11px}
    #v-outputs .mc .mp{display:flex;align-items:center;gap:8px}
    #v-outputs .mc .mb{flex:1;height:8px;background:var(--track);border-radius:4px;overflow:hidden}
    #v-outputs .mc .mb i{display:block;height:100%;background:var(--c);border-radius:4px}
    #v-outputs .mc .mv{font-size:.78rem;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}
    #v-outputs .mc .mm{font-size:.7rem;color:var(--muted);margin-top:8px}

    #v-outputs .cl{display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:.83rem;
      font-weight:700;line-height:1.4;color:var(--text)}
    #v-outputs .cl input{margin-top:3px;accent-color:var(--c);cursor:pointer;flex:0 0 auto}
    #v-outputs .num{display:flex;align-items:center;gap:5px;margin:9px 0 0 21px}
    #v-outputs .num input{width:46px;padding:3px 5px;border:1px solid var(--border);border-radius:5px;
      background:var(--bg);color:var(--text);font-family:inherit;font-size:.75rem;text-align:right;
      font-variant-numeric:tabular-nums}
    #v-outputs .num em{font-style:normal;font-size:.71rem;color:var(--muted)}
    #v-outputs .num b{margin-left:auto;font-size:.75rem;font-weight:800;color:var(--c)}

    #v-outputs .scroll{display:flex;flex-direction:column;gap:9px;max-height:290px;overflow-y:auto;
      padding-right:4px;overscroll-behavior:contain}
    #v-outputs .scroll::-webkit-scrollbar{width:5px}
    #v-outputs .scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
    #v-outputs .sh{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:5px}
    #v-outputs .sd{font-size:.73rem;color:var(--muted);margin:0 0 9px 21px;line-height:1.45}
    #v-outputs .sf{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-left:21px;
      padding-top:8px;border-top:1px dashed var(--border)}
    #v-outputs .due{font-size:.69rem;color:var(--muted);font-weight:700;white-space:nowrap}
    #v-outputs .acts{display:flex;gap:5px}
    #v-outputs .bs{background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 8px;
      font-size:.69rem;font-weight:700;color:var(--text);cursor:pointer;transition:.15s;font-family:inherit;white-space:nowrap}
    #v-outputs .bs:hover{background:var(--c);color:#fff;border-color:var(--c)}
    #v-outputs .bs.on{border-color:var(--c);color:var(--c)}
    #v-outputs .bg{font-size:.64rem;padding:2px 6px;border-radius:4px;font-weight:800;white-space:nowrap;flex:0 0 auto}
    #v-outputs .bg.plan{background:rgba(108,125,142,.12);color:var(--gray)}
    #v-outputs .bg.prog{background:rgba(217,131,36,.12);color:var(--warning)}
    #v-outputs .bg.done{background:rgba(29,158,117,.14);color:#0e8c86}
    #v-outputs .none{font-size:.74rem;color:var(--muted);padding:10px 2px}

    @media(max-width:1024px){
      #v-outputs .sw{grid-template-columns:1fr}
      #v-outputs .scroll{max-height:none}
    }`;
    document.head.appendChild(st);
  }

  /* ── 렌더 ── */
  function render(){
    const view=document.getElementById('v-outputs'); if(!view) return;
    const list=rows();
    const micAll=list.filter(r=>r.kind==='sched');
    const done=micAll.filter(isDone).length;
    const files=list.filter(r=>(OUT[r.key]||{}).file_path||(OUT[r.key]||{}).link).length;
    const goals=list.filter(r=>r.kind==='goal').length;
    const openG=view.dataset.g||'1';

    const zones=[1,2,3].map(g=>{
      let G={}; try{ if(typeof GOALS!=='undefined' && GOALS && GOALS['G'+g]) G=GOALS['G'+g]; }catch(e){}
      if(!G.name) G=(window.GOALS&&window.GOALS['G'+g])||{};
      const hex=G.hex||['','#3d5a98','#0e8c86','#c1791d'][g];
      const mine=_tasks().filter(t=>String(t.goal)===String(g));
      if(!mine.length) return '';
      const all=list.filter(r=>mine.some(t=>t.id===r.task_id) && r.kind==='sched');
      const dn=all.filter(isDone).length;
      const op=String(openG)===String(g)?' open':'';
      return `<div class="gz${op}" data-g="${g}" style="--c:${hex}">
        <div class="gz-h"><span class="gz-tg">${op?'▾':'▸'}</span>
          <span class="gz-n">${esc((G.no||'')+' '+(G.name||('목표'+g)))}</span>
          <span class="gz-c">산출물 ${dn}/${all.length}</span></div>
        <div class="gz-b">${mine.map(t=>lane(t,hex,list)).join('')}</div></div>`;
    }).join('');

    view.innerHTML=`<div class="wrap">
      <h2 style="margin:0 0 4px">📦 산출물 · KPI</h2>
      <p class="op-hint">사업계획서에 정의된 산출물입니다. <b>세부과제 산출물</b>의 이름은 세부계획(WBS)의 산출물 열이 원본이라 그곳에서 고치면 여기도 함께 바뀝니다.
      전략별 <b>산출물 등록률</b>은 상태를 <b>완료</b>로 바꾼 건수 기준이며, 일정 진척률과는 다른 지표입니다.
      기대산출물은 ＋ 버튼으로 직접 추가·수정할 수 있습니다.</p>
      <div class="op-sum">
        <div class="op-kpi"><b>${done}/${micAll.length}</b><span>산출물 등록(완료)</span></div>
        <div class="op-kpi"><b>${goals}</b><span>전략과제 기대산출물</span></div>
        <div class="op-kpi"><b>${list.length-goals}</b><span>세부과제 산출물</span></div>
        <div class="op-kpi"><b>${files}</b><span>파일·링크 등록</span></div>
      </div>${zones}</div>`;
  }

  function lane(t,hex,list){
    const mid=list.filter(r=>r.task_id===t.id&&r.kind==='goal');
    const mic=list.filter(r=>r.task_id===t.id&&r.kind==='sched');
    const st=laneStat(t.id,list);
    const n=_sched(t.id).length;
    return `<div class="sw" data-t="${esc(t.id)}" style="--c:${hex}">
      <div class="swc"><div class="swh">전략 개요</div>
        <div class="jc mc"><div class="mt">${esc(t.id)} ${esc(t.title)}</div>
          <div class="mp" title="세부과제 산출물 중 상태가 '완료'인 비율입니다. 일정 진척률과는 다릅니다.">
            <span class="mb"><i style="width:${st.pct}%"></i></span>
            <span class="mv">${st.done}/${st.total}</span></div>
          <div class="mm">산출물 등록률 ${st.pct}% · ${esc(t.team||'-')} · 세부계획 ${n}건</div></div></div>
      <div class="swc"><div class="swh">기대 산출물<i>${mid.length}</i>
          <button class="gadd" data-act="gadd" data-t="${esc(t.id)}" title="기대산출물 추가">＋</button></div>
        ${mid.length?mid.map(r=>midCard(r)).join(''):'<div class="none">등록된 기대산출물이 없습니다.</div>'}</div>
      <div class="swc"><div class="swh">세부과제 산출물<i>${mic.length}</i></div>
        ${mic.length?`<div class="scroll">${mic.map(r=>micCard(r)).join('')}</div>`
                    :'<div class="none">세부계획에 산출물이 기재되지 않았습니다.</div>'}</div>
    </div>`;
  }

  function midCard(r){
    const s=OUT[r.key]||{};
    // 이름에서 수량을 추정한다(예: "AI Agent 30종"). 기대산출물이 DB로 옮겨진 뒤에도
    // 목표치가 아직 비어 있으면 추정값을 기본으로 보여준다.
    const tg=+(s.target_num||(r.guess?r.guess.target:0))||0;
    const cur=+(s.current_num||0);
    const unit=s.unit||(r.guess?r.guess.unit:'');
    const numeric=tg>0||!!r.guess;
    const pct=pctOf(r,s);
    return `<div class="jc"><label class="cl"><input type="checkbox" data-act="done" data-k="${esc(r.key)}"
        ${s.done?'checked':''} ${numeric?'disabled title="수량 입력으로 자동 판정"':''}><span>${esc(r.text)}</span></label>
      <div class="gops"><button class="bs" data-act="gedit" data-k="${esc(r.key)}" title="이름 수정">✎</button>
        <button class="bs" data-act="gdel" data-k="${esc(r.key)}" title="삭제">🗑</button></div>
      ${numeric?`<div class="num"><input data-act="cur" data-k="${esc(r.key)}" value="${cur}"><em>/</em>
        <input data-act="tg" data-k="${esc(r.key)}" value="${tg}"><em>${esc(unit)}</em><b>${pct}%</b></div>`:''}</div>`;
  }

  function micCard(r){
    const s=OUT[r.key]||{};
    // 상태는 담당자가 직접 지정한다(등록 판정 기준). 미지정이면 '예정'.
    const cs=s.status||'예정';
    const st = cs==='완료'?['done','완료'] : cs==='진행중'?['prog','진행중'] : ['plan','예정'];
    const fn=s.file_name||'';
    const f=s.file_path?'<button class="bs on" data-act="open" data-k="'+esc(r.key)+'" title="'+esc(fn||'첨부파일 열기')+'">📎 파일</button>'
                       :'<button class="bs" data-act="up" data-k="'+esc(r.key)+'">＋파일</button>';
    const l=s.link?'<button class="bs on" data-act="link" data-k="'+esc(r.key)+'">🔗 링크</button>'
                  :'<button class="bs" data-act="link" data-k="'+esc(r.key)+'">＋링크</button>';
    return `<div class="jc">
      <div class="sh"><span class="mn">${esc(r.text)}</span>
        <select class="stsel ${st[0]}" data-act="status" data-k="${esc(r.key)}" title="산출물 상태 — '완료'로 바꾸면 등록률에 반영됩니다">
          ${['예정','진행중','완료'].map(o=>`<option ${o===cs?'selected':''}>${o}</option>`).join('')}
        </select></div>
      ${r.sub?`<div class="sd">${esc(r.sub)}</div>`:''}
      <div class="sf"><span class="due">${r.due?'~'+esc(r.due):'기한 미정'}</span>
        <div class="acts">${f}${l}</div></div></div>`;
  }

  /* ── 이벤트 ── */
  function bind(view){
    view.addEventListener('click',async e=>{
      const gh=e.target.closest('.gz-h');
      if(gh){ const z=gh.parentElement; view.dataset.g = z.classList.contains('open')?'':z.dataset.g; render(); return; }
      const b=e.target.closest('[data-act]'); if(!b) return;
      const act=b.dataset.act, key=b.dataset.k;

      // 기대산출물 추가는 대상 행이 없으므로 먼저 처리한다
      if(act==='gadd'){
        if(!_authed()){ toast('🔐 구글 로그인 후 추가할 수 있어요.'); return; }
        const tid=b.dataset.t;
        const v=prompt('추가할 기대산출물 이름'); if(v===null) return;
        const txt=v.trim(); if(!txt) return;
        await addGoal(tid,txt); return;
      }

      const r=rows().find(x=>x.key===key); if(!r) return;
      const s=OUT[key]||{};
      if(act==='gedit'){
        if(!_authed()){ toast('🔐 구글 로그인 후 수정할 수 있어요.'); return; }
        const v=prompt('기대산출물 이름 수정', r.text); if(v===null) return;
        const txt=v.trim(); if(!txt||txt===r.text) return;
        await save(r,{text:txt}); return;
      }
      if(act==='gdel'){
        if(!_authed()){ toast('🔐 구글 로그인 후 삭제할 수 있어요.'); return; }
        if(!confirm('이 기대산출물을 삭제할까요?\n\n'+r.text)) return;
        await delGoal(r); return;
      }
      if(act==='done'){ await save(r,{done:b.checked, status:b.checked?'완료':'예정'}); return; }
      if(act==='link'){ const v=prompt('파일서버 경로 또는 URL', s.link||''); if(v===null) return; await save(r,{link:v.trim()}); return; }
      if(act==='open'){
        const sb=_sb(); if(!sb||!s.file_path) return;
        try{ const {data,error}=await sb.storage.from(BUCKET).createSignedUrl(s.file_path,3600);
          if(error) throw error; window.open(data.signedUrl,'_blank','noopener');
        }catch(err){ toast('파일 열기 실패'); } return;
      }
      if(act==='up'){
        const inp=document.createElement('input'); inp.type='file';
        inp.onchange=async()=>{
          const f=inp.files&&inp.files[0]; if(!f) return;
          const sb=_sb(); if(!sb) return;
          // Supabase Storage 키는 ASCII 만 허용한다. 한글 파일명은 Invalid key 로 업로드가 실패했다.
          // 저장 경로는 ASCII 로 안전하게 만들고, 원래 파일명은 file_name 에 따로 보관한다.
          const path='outputs/'+r.task_id+'/'+_key(f.name);
          try{ const {error}=await sb.storage.from(BUCKET).upload(path,f,{upsert:true});
            if(error) throw error; await save(r,{file_path:path, file_name:f.name}); toast('업로드 완료');
          }catch(err){ toast('업로드 실패: '+(err&&err.message||'')); }
        };
        inp.click(); return;
      }
    });
    view.addEventListener('change',async e=>{
      const sel=e.target.closest('select[data-act="status"]');
      if(sel){
        const r=rows().find(x=>x.key===sel.dataset.k); if(!r) return;
        if(!_authed()){ toast('🔐 구글 로그인 후 변경할 수 있어요.'); render(); return; }
        const v=sel.value;
        await save(r,{status:v, done:(v==='완료')});
        return;
      }
      const i=e.target.closest('input[data-act="cur"],input[data-act="tg"]'); if(!i) return;
      const r=rows().find(x=>x.key===i.dataset.k); if(!r) return;
      const box=i.closest('.num');
      const cur=+(box.querySelector('[data-act="cur"]').value||0);
      const tg=+(box.querySelector('[data-act="tg"]').value||0);
      const c=Math.max(0,Math.min(tg||cur,cur));
      await save(r,{current_num:c, target_num:tg, unit:(r.guess?r.guess.unit:''), done:tg>0&&c>=tg});
    });
  }

  /* ── 탭 주입 ── */
  function mount(){
    if(mounted) return;
    const nav=document.querySelector('nav.tabs');
    const main=document.querySelector('main.main');
    if(!nav||!main||!document.getElementById('v-overview')) return;
    styles();

    const tab=document.createElement('div');
    tab.className='tab'; tab.dataset.t='outputs';
    tab.title='사업계획서에 정의된 기대산출물·세부과제 산출물을 한 곳에서 관리';
    tab.textContent='📦 산출물';
    nav.appendChild(tab);

    const view=document.createElement('div');
    view.className='view'; view.id='v-outputs';
    main.appendChild(view);
    bind(view);

    tab.addEventListener('click',()=>{
      document.querySelectorAll('nav.tabs .tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('main.main .view').forEach(x=>x.classList.remove('active'));
      tab.classList.add('active'); view.classList.add('active');
      try{ if(typeof window.myView!=='undefined') window.myView='산출물'; }catch(e){}
      try{ if(typeof window.updatePresence==='function') window.updatePresence(); }catch(e){}
      render();
    });

    mounted=true;
    load().then(render);

    // 세부계획이 바뀌면 산출물 목록도 따라간다
    const orig=window.renderOverview;
    if(typeof orig==='function' && !orig.__opHooked){
      const w=function(){ const r=orig.apply(this,arguments); try{ render(); }catch(e){} return r; };
      w.__opHooked=true; window.renderOverview=w;
    }
    // 다른 사람이 바꾼 산출물 실시간 반영
    const sb=_sb();
    if(sb){ try{
      sb.channel('ax_outputs_rt')
        .on('postgres_changes',{event:'*',schema:'public',table:'ax_outputs'},()=>{ load().then(render); })
        .subscribe();
    }catch(e){} }
  }

  let n=0;
  const t=setInterval(()=>{ if(++n>60){ clearInterval(t); return; } mount(); if(mounted) clearInterval(t); },500);
  mount();

  window.axOutputs={ render, load, mount };
})();
