/* =========================================================================
 * ax_gantt.js — 목표 › 전략과제 › 세부계획 3단 롤업 간트
 * -------------------------------------------------------------------------
 * 사업 타임라인 탭의 기존 "전략과제 간트"(#gantt)를 대체한다.
 *   L1 목표(3)      : 소속 과제들의 최이른 시작 ~ 최늦은 종료, 진척=과제 평균
 *   L2 전략과제(12) : 소속 WBS 행의 최이른 시작 ~ 최늦은 종료, 진척=가중 롤업
 *   L3 세부계획     : 행 자체의 시작~종료, 진척=행 진행률
 * 날짜 축은 실제 WBS 데이터 범위에서 월 단위로 자동 생성한다.
 * index.html 은 건드리지 않는다 — window.renderGantt 를 래핑해 덮어쓴다.
 * =======================================================================*/
(function(){
  'use strict';

  const OPEN={};                 // 접기/펼치기 상태 (goal:1 / task:'1-1')
  const DAY=86400000;

  function _tasks(){
    try{ if(typeof TASKS!=='undefined' && TASKS) return TASKS; }catch(e){}
    return window.TASKS||[];
  }
  function _rows(id){
    try{ if(typeof schedCache!=='undefined' && schedCache) return schedCache[id]||[]; }catch(e){}
    return [];
  }
  function _prog(t){
    try{ if(typeof taskProgress==='function') return taskProgress(t); }catch(e){}
    return window.taskProgress? window.taskProgress(t):0;
  }
  /* GOALS 는 growth_cycle.js 의 const 라 window 에 없다 — 전역 렉시컬로 접근한다 */
  function _G(g){
    try{ if(typeof GOALS!=='undefined' && GOALS && GOALS['G'+g]) return GOALS['G'+g]; }catch(e){}
    return (window.GOALS&&window.GOALS['G'+g])||null;
  }
  function _goalHex(g){
    const G=_G(g);
    return (G&&G.hex)||['','#3d5a98','#0e8c86','#c1791d'][g]||'#3d5a98';
  }
  function _goalName(g){
    const G=_G(g);
    return G? ((G.no?G.no+' ':'')+G.name) : ('목표'+g);
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  const D=s=>s?new Date(s+'T00:00:00'):null;

  /* ── 기간 집계 ── */
  function spanOf(list){
    let a=null,b=null;
    list.forEach(r=>{
      const s=D(r.start_date), e=D(r.end_date);
      if(s&&(!a||s<a))a=s;
      if(e&&(!b||e>b))b=e;
    });
    return {s:a,e:b};
  }
  function taskSpan(t){ return spanOf(_rows(t.id)); }
  function goalSpan(g){
    const list=[];
    _tasks().filter(t=>String(t.goal)===String(g)).forEach(t=>list.push(...(_rows(t.id))));
    return spanOf(list);
  }

  /* ── 축 ── */
  function axis(){
    let min=null,max=null;
    _tasks().forEach(t=>_rows(t.id).forEach(r=>{
      const s=D(r.start_date), e=D(r.end_date);
      if(s&&(!min||s<min))min=s;
      if(e&&(!max||e>max))max=e;
    }));
    if(!min||!max){ min=new Date(); max=new Date(Date.now()+180*DAY); }
    const a=new Date(min.getFullYear(),min.getMonth(),1);
    const b=new Date(max.getFullYear(),max.getMonth()+1,0);
    const months=[];
    let c=new Date(a);
    while(c<=b){ months.push(new Date(c)); c=new Date(c.getFullYear(),c.getMonth()+1,1); }
    return {a,b,months,total:(b-a)||1};
  }
  function pos(ax,d){ return Math.max(0,Math.min(100,((d-ax.a)/ax.total)*100)); }

  /* ── 스타일 ── */
  function styles(){
    if(document.getElementById('axGanttStyles')) return;
    const st=document.createElement('style'); st.id='axGanttStyles';
    st.textContent=`
    #gantt.rg{display:block;overflow-x:auto}
    #gantt.rg .rg-in{min-width:720px}
    #gantt.rg .rg-h{display:grid;grid-template-columns:var(--lw) 1fr;align-items:end;
      position:sticky;top:0;z-index:3;background:var(--card);padding-bottom:5px}
    #gantt.rg .rg-hl{font-size:.72rem;font-weight:800;color:var(--muted);padding-left:4px}
    #gantt.rg .rg-hm{display:flex;border-bottom:1px solid var(--border)}
    #gantt.rg .rg-hm span{flex:1;text-align:center;font-size:.68rem;font-weight:700;color:var(--muted);
      border-left:1px solid var(--border);padding-bottom:3px}
    #gantt.rg .rg-hm span:first-child{border-left:0}
    #gantt.rg .rg-r{display:grid;grid-template-columns:var(--lw) 1fr;align-items:center;
      min-height:26px;border-radius:6px}
    #gantt.rg .rg-r:hover{background:rgba(61,90,152,.05)}
    #gantt.rg .rg-l{display:flex;align-items:center;gap:5px;min-width:0;padding:2px 6px 2px 4px;cursor:default}
    #gantt.rg .rg-r.click .rg-l{cursor:pointer}
    #gantt.rg .rg-tg{width:13px;flex:0 0 13px;text-align:center;font-size:.6rem;color:var(--muted);
      cursor:pointer;user-select:none}
    #gantt.rg .rg-nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #gantt.rg .rg-pc{font-size:.68rem;font-weight:800;color:var(--muted);
      font-variant-numeric:tabular-nums;flex:0 0 auto}
    #gantt.rg .lv1 .rg-nm{font-size:.82rem;font-weight:800;color:var(--text)}
    #gantt.rg .lv2 .rg-nm{font-size:.78rem;font-weight:700;color:var(--text)}
    #gantt.rg .lv3 .rg-nm{font-size:.72rem;font-weight:500;color:var(--muted)}
    #gantt.rg .lv2 .rg-l{padding-left:14px}
    #gantt.rg .lv3 .rg-l{padding-left:30px}
    #gantt.rg .rg-t{position:relative;height:100%;min-height:26px}
    #gantt.rg .rg-grid{position:absolute;inset:0;display:flex;pointer-events:none}
    #gantt.rg .rg-grid i{flex:1;border-left:1px solid var(--border);opacity:.5}
    #gantt.rg .rg-grid i:first-child{border-left:0}
    #gantt.rg .rg-b{position:absolute;top:50%;transform:translateY(-50%);height:11px;border-radius:6px;
      background:var(--c);opacity:.22;min-width:3px}
    #gantt.rg .lv1 .rg-b{height:14px}
    #gantt.rg .rg-f{position:absolute;top:50%;transform:translateY(-50%);height:11px;border-radius:6px;
      background:var(--c);min-width:2px}
    #gantt.rg .lv1 .rg-f{height:14px}
    #gantt.rg .rg-now{position:absolute;top:0;bottom:0;width:2px;background:#e24b4a;opacity:.65;z-index:2}
    #gantt.rg .rg-sec{height:7px}
    #gantt.rg .rg-empty{font-size:.72rem;color:var(--muted);padding:2px 0 2px 30px}
    #gantt.rg .rg-cap{font-size:.7rem;color:var(--muted);margin-top:8px}`;
    document.head.appendChild(st);
  }

  /* ── 렌더 ── */
  function draw(){
    const box=document.getElementById('gantt'); if(!box) return;
    styles();
    box.classList.add('rg');
    const ax=axis();
    const sel=document.getElementById('rGoal');
    const gf=sel?String(sel.value||''):'';
    const now=new Date();
    const nowPct=(now>=ax.a&&now<=ax.b)?pos(ax,now):null;

    const grid='<div class="rg-grid">'+ax.months.map(()=>'<i></i>').join('')+'</div>';
    const nowLine=nowPct==null?'':`<div class="rg-now" style="left:${nowPct}%"></div>`;

    function bar(sp,pct,hex){
      if(!sp.s||!sp.e) return `<div class="rg-t">${grid}${nowLine}</div>`;
      const l=pos(ax,sp.s), r=pos(ax,sp.e), w=Math.max(0.6,r-l);
      return `<div class="rg-t" style="--c:${hex}">${grid}
        <div class="rg-b" style="left:${l}%;width:${w}%"></div>
        <div class="rg-f" style="left:${l}%;width:${(w*Math.max(0,Math.min(100,pct))/100)}%"></div>
        ${nowLine}</div>`;
    }

    let html='';
    [1,2,3].forEach(g=>{
      if(gf && gf!==String(g)) return;
      const hex=_goalHex(g);
      const mine=_tasks().filter(t=>String(t.goal)===String(g));
      if(!mine.length) return;
      const gp=mine.length?Math.round(mine.reduce((s,t)=>s+_prog(t),0)/mine.length):0;
      const gOpen=OPEN['g'+g]!==false;   // 목표는 기본 펼침
      html+=`<div class="rg-r lv1"><div class="rg-l">
        <span class="rg-tg" data-tg="g${g}">${gOpen?'▾':'▸'}</span>
        <span class="rg-nm" style="color:${hex}">${esc(_goalName(g))}</span>
        <span class="rg-pc">${gp}%</span></div>${bar(goalSpan(g),gp,hex)}</div>`;
      if(!gOpen) return;

      mine.forEach(t=>{
        const tp=_prog(t), rows=_rows(t.id), tOpen=!!OPEN['t'+t.id];
        html+=`<div class="rg-r lv2 click" data-open="${esc(t.id)}"><div class="rg-l">
          <span class="rg-tg" data-tg="t${esc(t.id)}">${rows.length?(tOpen?'▾':'▸'):'·'}</span>
          <span class="rg-nm">${esc(t.id)} ${esc(t.title)}</span>
          <span class="rg-pc">${tp}%</span></div>${bar(taskSpan(t),tp,hex)}</div>`;
        if(!tOpen) return;
        if(!rows.length){ html+=`<div class="rg-empty">세부계획 없음</div>`; return; }
        rows.slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).forEach(r=>{
          const p=Math.max(0,Math.min(100,+r.progress||0));
          html+=`<div class="rg-r lv3 click" data-open="${esc(t.id)}"><div class="rg-l">
            <span class="rg-tg"></span>
            <span class="rg-nm">${esc(r.seq||'')} ${esc(r.name||'')}</span>
            <span class="rg-pc">${p}%</span></div>${bar({s:D(r.start_date),e:D(r.end_date)},p,hex)}</div>`;
        });
        html+=`<div class="rg-sec"></div>`;
      });
      html+=`<div class="rg-sec"></div>`;
    });

    const head=`<div class="rg-h"><div class="rg-hl">목표 › 전략과제 › 세부계획</div>
      <div class="rg-hm">${ax.months.map(m=>`<span>${String(m.getFullYear()).slice(2)}.${String(m.getMonth()+1).padStart(2,'0')}</span>`).join('')}</div></div>`;

    box.innerHTML=`<div class="rg-in" style="--lw:min(46%,340px)">${head}${html}
      <div class="rg-cap">막대=계획 기간 · 진한 부분=진척률 · 빨간선=오늘 · ▸를 눌러 펼치고, 과제·세부계획을 클릭하면 세부계획 화면이 열립니다.</div></div>`;
  }

  /* ── 이벤트 (컨테이너가 매번 갈아끼워지므로 document 위임) ── */
  document.addEventListener('click',function(e){
    const box=document.getElementById('gantt');
    if(!box||!box.classList.contains('rg')||!box.contains(e.target)) return;
    const tg=e.target.closest('.rg-tg');
    if(tg&&tg.dataset.tg){
      const k=tg.dataset.tg;
      if(k[0]==='g') OPEN['g'+k.slice(1)] = (OPEN['g'+k.slice(1)]===false);
      else OPEN['t'+k.slice(1)] = !OPEN['t'+k.slice(1)];
      draw(); e.stopPropagation(); return;
    }
    const row=e.target.closest('.rg-r.click');
    if(row&&row.dataset.open&&window.openSchedule) window.openSchedule(row.dataset.open);
  });

  /* ── 기존 renderGantt 를 덮어쓴다 ── */
  function hook(tries){
    const orig=window.renderGantt;
    if(typeof orig!=='function'){ if((tries||0)<60) setTimeout(function(){hook((tries||0)+1);},400); return; }
    if(orig.__rgHooked) return;
    const w=function(){ try{ draw(); }catch(e){ console.warn('[gantt]',e&&e.message); try{return orig.apply(this,arguments);}catch(_){}} };
    w.__rgHooked=true;
    window.renderGantt=w;
    if(document.getElementById('gantt')) draw();
  }
  hook(0);

  // 데이터가 늦게 도착하면 다시 그린다
  let n=0; const t=setInterval(function(){
    if(++n>40){ clearInterval(t); return; }
    let ready=false;
    try{ ready=Object.keys(schedCache||{}).length>0; }catch(e){}
    if(!ready) return;
    clearInterval(t);
    if(document.getElementById('gantt')) draw();
  },500);

  window.axGantt={ draw };
})();
