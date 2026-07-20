/* =========================================================================
 * ax_outputs.js — 산출물 · KPI 트래커 탭
 * -------------------------------------------------------------------------
 * 산출물은 두 층으로 이미 정의되어 있다. 빈 목록에서 새로 등록하는 게 아니라
 * 이미 정의된 항목에 "실물(상태·수량·파일·링크)"을 붙이는 화면이다.
 *   ① 전략과제 기대산출물 : TASKS[].outcome  ('/' 구분, 과제당 2~3개)
 *   ② 세부과제 산출물     : ax_schedules.deliverable (149행 중 125건 기재)
 * 저장은 ax_outputs 한 테이블. kind='goal'(task_id+idx) / 'sched'(sched_id) 로 구분.
 * 수량형 산출물(예: "AI Agent 30종")은 목표/실적을 입력해 진행률을 직접 트래킹하고,
 * 그 외는 완료체크(All-or-None)로 0% 또는 100% 처리한다.
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

  /* ── 정의된 산출물 목록(두 층) ── */
  function rows(){
    const out=[];
    _tasks().forEach(t=>{
      String(t.outcome||'').split('/').map(s=>s.trim()).filter(Boolean).forEach((txt,i)=>{
        out.push({key:t.id+'|goal|'+i, task_id:t.id, kind:'goal', idx:i, sched_id:null,
                  text:txt, sub:'', due:'', guess:parseTarget(txt)});
      });
      _sched(t.id).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).forEach(r=>{
        const d=String(r.deliverable||'').trim(); if(!d) return;
        out.push({key:t.id+'|sched|'+r.id, task_id:t.id, kind:'sched', idx:0, sched_id:r.id,
                  text:d, sub:(r.seq||'')+' '+(r.name||''), due:r.end_date||'', guess:parseTarget(d)});
      });
    });
    return out;
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
        const {data,error}=await sb.from('ax_outputs').update(patch).eq('id',cur.id).select().single();
        if(error) throw error; OUT[row.key]=data;
      }else{
        const {data,error}=await sb.from('ax_outputs').insert(body).select().single();
        if(error) throw error; OUT[row.key]=data;
      }
      try{ if(typeof window.audit==='function') window.audit('산출물 변경', row.text); }catch(e){}
      render();
    }catch(e){ console.warn('[outputs] save:',e&&e.message); toast('저장 실패: '+(e&&e.message||'')); }
  }

  /* ── 스타일 ── */
  function styles(){
    if(document.getElementById('axOutStyles')) return;
    const st=document.createElement('style'); st.id='axOutStyles';
    st.textContent=`
    #v-outputs .op-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
    #v-outputs .op-kpi{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
    #v-outputs .op-kpi b{display:block;font-size:1.5rem;font-weight:800;color:var(--text);line-height:1.1;
      font-variant-numeric:tabular-nums}
    #v-outputs .op-kpi span{font-size:.74rem;color:var(--muted)}
    #v-outputs .op-g{background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:12px;
      overflow:hidden}
    #v-outputs .op-gh{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;
      border-left:4px solid var(--c)}
    #v-outputs .op-gh:hover{background:rgba(61,90,152,.05)}
    #v-outputs .op-gid{font-size:.74rem;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}
    #v-outputs .op-gt{flex:1;min-width:0;font-size:.9rem;font-weight:800;color:var(--text);
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #v-outputs .op-gc{font-size:.76rem;color:var(--muted);font-variant-numeric:tabular-nums}
    #v-outputs .op-gb{width:90px;height:5px;border-radius:3px;background:var(--track,#e6eaef);overflow:hidden;flex-shrink:0}
    #v-outputs .op-gb i{display:block;height:100%;background:var(--c);border-radius:3px}
    #v-outputs .op-body{display:none;padding:0 14px 12px}
    #v-outputs .op-g.open .op-body{display:block}
    #v-outputs .op-sec{font-size:.72rem;font-weight:800;color:var(--muted);letter-spacing:.03em;
      padding:12px 0 6px;border-top:1px solid var(--border);margin-top:6px}
    #v-outputs .op-g .op-body>.op-sec:first-child{border-top:0;margin-top:0}
    #v-outputs .op-r{display:grid;grid-template-columns:26px 1fr 132px 108px 92px;gap:10px;align-items:center;
      padding:8px 6px;border-radius:8px}
    #v-outputs .op-r:hover{background:rgba(61,90,152,.04)}
    #v-outputs .op-r.goal{background:rgba(61,90,152,.035)}
    #v-outputs .op-chk{width:17px;height:17px;cursor:pointer;accent-color:var(--c)}
    #v-outputs .op-t{min-width:0}
    #v-outputs .op-t b{display:block;font-size:.83rem;font-weight:700;color:var(--text);line-height:1.35}
    #v-outputs .op-t span{display:block;font-size:.71rem;color:var(--muted);overflow:hidden;
      text-overflow:ellipsis;white-space:nowrap}
    #v-outputs .op-num{display:flex;align-items:center;gap:4px}
    #v-outputs .op-num input{width:44px;padding:4px 5px;border:1px solid var(--border);border-radius:6px;
      background:var(--bg);color:var(--text);font-family:inherit;font-size:.76rem;text-align:right;
      font-variant-numeric:tabular-nums}
    #v-outputs .op-num em{font-style:normal;font-size:.72rem;color:var(--muted)}
    #v-outputs .op-file{display:flex;gap:5px;align-items:center}
    #v-outputs .op-b{padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:transparent;
      color:var(--muted);font-family:inherit;font-size:.71rem;font-weight:700;cursor:pointer;white-space:nowrap}
    #v-outputs .op-b:hover{border-color:var(--primary);color:var(--primary)}
    #v-outputs .op-b.has{border-color:var(--c);color:var(--c)}
    #v-outputs .op-p{font-size:.76rem;font-weight:800;color:var(--c);text-align:right;
      font-variant-numeric:tabular-nums}
    #v-outputs .op-hint{font-size:.78rem;color:var(--muted);margin-bottom:14px;line-height:1.6}
    @media(max-width:820px){
      #v-outputs .op-r{grid-template-columns:26px 1fr;gap:6px}
      #v-outputs .op-num,#v-outputs .op-file,#v-outputs .op-p{grid-column:2}
    }`;
    document.head.appendChild(st);
  }

  /* ── 렌더 ── */
  function render(){
    const view=document.getElementById('v-outputs'); if(!view) return;
    const list=rows();
    const done=list.filter(r=>pctOf(r,OUT[r.key])>=100).length;
    const files=list.filter(r=>(OUT[r.key]||{}).file_path||(OUT[r.key]||{}).link).length;
    const goals=list.filter(r=>r.kind==='goal').length;

    const groups=_tasks().map(t=>{
      const mine=list.filter(r=>r.task_id===t.id); if(!mine.length) return '';
      const g=(typeof window.GOALS!=='undefined'&&window.GOALS['G'+t.goal])||{hex:'#3d5a98'};
      const dn=mine.filter(r=>pctOf(r,OUT[r.key])>=100).length;
      const pct=Math.round(mine.reduce((s,r)=>s+pctOf(r,OUT[r.key]),0)/mine.length);
      const open=view.dataset.open===t.id?' open':'';
      const sec=(k,label)=>{
        const arr=mine.filter(r=>r.kind===k); if(!arr.length) return '';
        return `<div class="op-sec">${label} (${arr.length})</div>`+arr.map(r=>row(r,g.hex)).join('');
      };
      return `<div class="op-g${open}" data-t="${esc(t.id)}" style="--c:${g.hex}">
        <div class="op-gh"><span class="op-gid">${esc(t.id)}</span>
          <span class="op-gt">${esc(t.title)}</span>
          <span class="op-gc">${dn}/${mine.length}</span>
          <span class="op-gb"><i style="width:${pct}%"></i></span></div>
        <div class="op-body">${sec('goal','기대산출물')}${sec('sched','세부과제 산출물')}</div>
      </div>`;
    }).join('');

    view.innerHTML=`<div class="wrap">
      <h2 style="margin:0 0 4px">📦 산출물 · KPI</h2>
      <p class="op-hint">사업계획서에 이미 정의된 산출물입니다. 수량형(예: AI Agent 30종)은 <b>목표/실적</b>을 입력하면 진행률이 계산되고,
      그 외는 <b>완료 체크</b>로 관리합니다. 파일은 업로드하거나 내부 파일서버 경로를 링크로 남길 수 있습니다.</p>
      <div class="op-sum">
        <div class="op-kpi"><b>${done}/${list.length}</b><span>완료 산출물</span></div>
        <div class="op-kpi"><b>${goals}</b><span>전략과제 기대산출물</span></div>
        <div class="op-kpi"><b>${list.length-goals}</b><span>세부과제 산출물</span></div>
        <div class="op-kpi"><b>${files}</b><span>파일·링크 등록</span></div>
      </div>
      ${groups}</div>`;
  }

  function row(r,hex){
    const s=OUT[r.key]||{};
    const tg=+(s.target_num|| (s.id?0:(r.guess?r.guess.target:0)) )||0;
    const cur=+(s.current_num||0);
    const unit=s.unit||(r.guess?r.guess.unit:'');
    const pct=pctOf(r,s);
    const numeric=tg>0||(!s.id&&r.guess);
    const fileBtn=s.file_path
      ? `<button class="op-b has" data-act="open" data-k="${esc(r.key)}">📎 파일</button>`
      : `<button class="op-b" data-act="up" data-k="${esc(r.key)}">＋파일</button>`;
    const linkBtn=s.link
      ? `<button class="op-b has" data-act="link" data-k="${esc(r.key)}">🔗 링크</button>`
      : `<button class="op-b" data-act="link" data-k="${esc(r.key)}">＋링크</button>`;
    return `<div class="op-r ${r.kind}">
      <input type="checkbox" class="op-chk" data-act="done" data-k="${esc(r.key)}" ${s.done?'checked':''}
        ${numeric?'disabled title="수량 입력으로 자동 판정"':''}>
      <div class="op-t"><b>${esc(r.text)}</b>${r.sub?`<span>${esc(r.sub)}${r.due?' · ~'+esc(r.due):''}</span>`:''}</div>
      <div class="op-num">${numeric
        ? `<input data-act="cur" data-k="${esc(r.key)}" value="${cur}"><em>/</em>
           <input data-act="tg" data-k="${esc(r.key)}" value="${tg}"><em>${esc(unit)}</em>`
        : `<em style="font-size:.72rem;color:var(--muted)">완료체크</em>`}</div>
      <div class="op-file">${fileBtn}${linkBtn}</div>
      <div class="op-p">${pct}%</div>
    </div>`;
  }

  /* ── 이벤트 ── */
  function bind(view){
    view.addEventListener('click',async e=>{
      const gh=e.target.closest('.op-gh');
      if(gh){ const g=gh.parentElement; const id=g.dataset.t;
        view.dataset.open = g.classList.contains('open')?'':id; render(); return; }
      const b=e.target.closest('[data-act]'); if(!b) return;
      const act=b.dataset.act, key=b.dataset.k;
      const r=rows().find(x=>x.key===key); if(!r) return;
      const s=OUT[key]||{};
      if(act==='done'){ await save(r,{done:b.checked, status:b.checked?'완료':'예정'}); return; }
      if(act==='link'){
        const v=prompt('파일서버 경로 또는 URL', s.link||'');
        if(v===null) return; await save(r,{link:v.trim()}); return;
      }
      if(act==='open'){
        const sb=_sb(); if(!sb||!s.file_path) return;
        try{
          const {data,error}=await sb.storage.from(BUCKET).createSignedUrl(s.file_path,3600);
          if(error) throw error; window.open(data.signedUrl,'_blank','noopener');
        }catch(err){ toast('파일 열기 실패'); }
        return;
      }
      if(act==='up'){
        const inp=document.createElement('input'); inp.type='file';
        inp.onchange=async()=>{
          const f=inp.files&&inp.files[0]; if(!f) return;
          const sb=_sb(); if(!sb) return;
          const path='outputs/'+r.task_id+'/'+Date.now()+'_'+f.name.replace(/[^\w.\-가-힣]/g,'_');
          try{
            const {error}=await sb.storage.from(BUCKET).upload(path,f,{upsert:true});
            if(error) throw error;
            await save(r,{file_path:path});
            toast('업로드 완료');
          }catch(err){ toast('업로드 실패: '+(err&&err.message||'')); }
        };
        inp.click(); return;
      }
    });
    view.addEventListener('change',async e=>{
      const i=e.target.closest('input[data-act="cur"],input[data-act="tg"]'); if(!i) return;
      const r=rows().find(x=>x.key===i.dataset.k); if(!r) return;
      const box=i.closest('.op-num');
      const cur=+(box.querySelector('[data-act="cur"]').value||0);
      const tg=+(box.querySelector('[data-act="tg"]').value||0);
      const c=Math.max(0,Math.min(tg||cur,cur));   // 실적은 목표를 넘지 않게
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
