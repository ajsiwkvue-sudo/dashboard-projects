/* =========================================================================
 * ax_port.js — 콘솔 기능의 ilsan-AX(Supabase) 이식 모듈 (+ 자체 UI 마운트)
 * -------------------------------------------------------------------------
 * schema.sql 실행 + Storage 'ax' 버킷(비공개) + authenticated 정책 필요.
 * index.html 하단 <script src="ax_port.js"></script> + axPort.init() 호출.
 * ========================================================================= */
(function(){
'use strict';

/* ===================== ADAPTER ===================== */
// 본체의 Supabase 클라이언트(window.supa 또는 전역 supa)를 런타임에 해석
function _sb(){
  if (typeof window !== 'undefined' && window.supa) return window.supa;
  try { if (typeof supa !== 'undefined' && supa) return supa; } catch(e){}
  return null;
}
const sb = {
  get from()    { const c=_sb(); return c.from.bind(c); },
  get channel() { const c=_sb(); return c.channel.bind(c); },
  get storage() { return _sb().storage; }
};
function currentUser(){ return window.whoAmI ? window.whoAmI() : '게스트'; }
function _tasks(){ if(typeof window!=='undefined' && window.TASKS) return window.TASKS; try{ if(typeof TASKS!=='undefined') return TASKS; }catch(e){} return []; }
function _tprog(t){ if(window.taskProgress) return window.taskProgress(t); try{ if(typeof taskProgress!=='undefined') return taskProgress(t); }catch(e){} return 0; }
const SCHED = () => (_tasks()).map(t => ({
  id: t.id, title: t.title, goal: t.goal, progress: _tprog(t)
}));
const taskTitle = (id) => { const r=SCHED().find(s=>s.id===id); return r? (r.title||id):id; };
/* ================================================== */

const $  = (s,r)=> (r||document).querySelector(s);
const esc = s => (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const toast = (window.toast || function(m){console.log('[toast]',m);});
let _consoleRender = null;   // 드로어 열려있을 때 실시간 재렌더 훅

/* ============ 0) 설정(초점/잠금) + 편집 잠금 게이트 ============ */
const CFG = { focus_text:'', locked:false, base_date:null };
async function loadCfg(){ const {data}=await sb.from('ax_cfg').select('*').eq('id','main').single(); if(data)Object.assign(CFG,data); }
async function saveCfg(patch){ Object.assign(CFG,patch); await sb.from('ax_cfg').update({...patch,updated_at:new Date().toISOString()}).eq('id','main'); }
function isAuthed(){
  try{ if(typeof authUser!=='undefined' && authUser) return true; }catch(e){}
  return !!(window.authUser);
}
function isLocked(){ return !!CFG.locked; }
function gate(){ if(!isAuthed()){ toast('🔐 구글 로그인 후 편집할 수 있어요.'); return false; } if(isLocked()){ toast('🔒 편집 잠금 상태'); return false; } return true; }
async function toggleLock(){ await saveCfg({locked:!CFG.locked}); await audit('편집 '+(CFG.locked?'잠금':'해제'),''); renderLockBtn(); }
function renderLockBtn(){ const b=$('#axLockBtn'); if(b){ b.textContent = CFG.locked?'🔒 잠금해제':'🔓 편집잠금'; b.classList.toggle('on',CFG.locked);} }

function renderFocus(root){
  if(!root)return;
  root.innerHTML = `<div class="ax-card"><div class="ax-h">📌 이번 분기 초점</div>
    <textarea id="axFocus" ${isLocked()?'disabled':''} placeholder="이번 분기 집중 사항을 적어두세요">${esc(CFG.focus_text||'')}</textarea></div>`;
  const t=$('#axFocus',root); if(t) t.onchange=async()=>{ if(!gate())return; await saveCfg({focus_text:t.value}); await audit('초점 수정',''); toast('저장됨'); };
}

/* ==================== 1) 변경 이력 ==================== */
async function audit(action,target){ try{ await sb.from('ax_audit').insert({usr:currentUser(),action,target}); }catch(e){console.warn(e);} }
async function renderAudit(root){
  if(!root)return;
  const {data}=await sb.from('ax_audit').select('*').order('ts',{ascending:false}).limit(200);
  root.innerHTML = `<div class="ax-card"><div class="ax-h">🕘 변경 이력 (${(data||[]).length})</div><div class="ax-logs">`+
    ((data||[]).map(e=>`<div class="ax-log"><span class="t">${new Date(e.ts).toLocaleString('ko-KR')}</span><span class="u">${esc(e.usr)}</span><span>${esc(e.action)} ${esc(e.target||'')}</span></div>`).join('')||'<div class="ax-empty">기록 없음</div>')+`</div></div>`;
}

/* ==================== 2) 리스크 보드 ==================== */
const SEVC={H:'#c0492f',M:'#c1791d',L:'#6c7d8e'};
async function renderRisks(root){
  if(!root)return;
  const {data}=await sb.from('ax_risks').select('*').order('sort');
  root.innerHTML = `<div class="ax-card"><div class="ax-h">⚠ 리스크 (${(data||[]).length})</div><div id="axRiskList">`+
    (data||[]).map(r=>`<div class="ax-risk">
      <select data-id="${r.id}" class="rsev" ${isLocked()?'disabled':''} style="background:${SEVC[r.sev]||SEVC.M}">
        ${['H','M','L'].map(s=>`<option ${r.sev===s?'selected':''}>${s}</option>`).join('')}</select>
      <input data-id="${r.id}" class="rtext" value="${esc(r.text)}" ${isLocked()?'disabled':''} placeholder="리스크 내용">
      <button data-id="${r.id}" class="rdel" ${isLocked()?'disabled':''}>✕</button></div>`).join('')+
    `</div><button id="axRiskAdd" class="ax-add" ${isLocked()?'disabled':''}>+ 리스크 추가</button></div>`;
  root.querySelectorAll('.rsev').forEach(el=>el.onchange=async()=>{ if(!gate())return; el.style.background=SEVC[el.value]||SEVC.M; await sb.from('ax_risks').update({sev:el.value}).eq('id',el.dataset.id); await audit('리스크 심각도 변경',''); });
  root.querySelectorAll('.rtext').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_risks').update({text:el.value}).eq('id',el.dataset.id); });
  root.querySelectorAll('.rdel').forEach(el=>el.onclick=async()=>{ if(!gate())return; await sb.from('ax_risks').delete().eq('id',el.dataset.id); await audit('리스크 삭제',''); renderRisks(root); });
  const add=$('#axRiskAdd',root); if(add)add.onclick=async()=>{ if(!gate())return; await sb.from('ax_risks').insert({sev:'M',text:''}); await audit('리스크 추가',''); renderRisks(root); };
}

/* ==================== 3) KPI 트래커 ==================== */
async function loadKpis(taskId){ let q=sb.from('ax_kpi').select('*').order('sort'); if(taskId)q=q.eq('task_id',taskId); const {data}=await q; return data||[]; }
async function renderKpis(root, taskId){
  if(!root)return;
  const list=await loadKpis(taskId);
  root.innerHTML = `<div class="ax-card"><div class="ax-h">🎯 성과지표 (KPI)${taskId?' · '+esc(taskTitle(taskId)):''} (${list.length})</div>`+
    (list.length?list.map(k=>{
      const p=k.target_num? Math.min(1,(k.current||0)/k.target_num)*100 : 0;
      const val = k.binary ? (k.current>=k.target_num?'달성':'미달성') : k.current;
      const input = k.binary
        ? `<label class="ax-ck"><input type="checkbox" data-id="${k.id}" class="kbin" ${k.current>=k.target_num?'checked':''} ${isLocked()?'disabled':''}> 달성 여부 (All-or-None)</label>`
        : `현재값 <input type="number" min="0" max="${k.target_num}" step="any" value="${k.current}" data-id="${k.id}" data-max="${k.target_num}" class="knum" ${isLocked()?'disabled':''}> ${esc(k.unit)} <span class="ax-cap">상한 ${k.target_num}${esc(k.unit)}</span>`;
      return `<div class="ax-kpi"><div class="kt">${esc(k.name)}</div>
        <div class="kfig"><b>${esc(String(val))}</b> / ${k.target_num}${esc(k.unit)}</div>
        <div class="ktrack"><i style="width:${p}%"></i></div>
        <div class="ked">${input}</div></div>`;
    }).join(''):'<div class="ax-empty">등록된 KPI 없음</div>')+`</div>`;
  root.querySelectorAll('.knum').forEach(el=>el.onchange=async()=>{ if(!gate())return;
    let v=parseFloat(el.value)||0; v=Math.max(0,Math.min(+el.dataset.max, v));
    await sb.from('ax_kpi').update({current:v}).eq('id',el.dataset.id); await audit('KPI 실적 입력',''); renderKpis(root,taskId); });
  root.querySelectorAll('.kbin').forEach(el=>el.onchange=async()=>{ if(!gate())return;
    const id=el.dataset.id; const k=list.find(x=>x.id===id);
    await sb.from('ax_kpi').update({current: el.checked? k.target_num : 0}).eq('id',id); await audit('KPI '+(el.checked?'달성':'미달성'),''); renderKpis(root,taskId); });
}

/* ==================== 4) 기대산출물 (비공개 버킷 → 서명 URL) ==================== */
async function renderOutputs(root, taskId){
  if(!root)return;
  const {data}=await sb.from('ax_outputs').select('*').eq('task_id',taskId).order('idx');
  root.innerHTML = `<div class="ax-card"><div class="ax-h">📎 기대 산출물</div>`+
    (data||[]).map(o=>`<div class="ax-out">
      <label><input type="checkbox" class="odone" data-id="${o.id}" ${o.done?'checked':''} ${isLocked()?'disabled':''}> <input class="otext" data-id="${o.id}" value="${esc(o.text)}" ${isLocked()?'disabled':''}></label>
      <div class="orow"><input class="olink" data-id="${o.id}" placeholder="파일서버 경로/URL" value="${esc(o.link)}" ${isLocked()?'disabled':''}>
        <input type="file" class="ofile" data-id="${o.id}" ${isLocked()?'disabled':''}>
        ${o.file_path?`<button class="ofview" data-path="${esc(o.file_path)}">📄 파일 열기</button>`:''}
        <button class="odel" data-id="${o.id}" ${isLocked()?'disabled':''}>✕</button></div></div>`).join('')+
    `<button id="axOutAdd" class="ax-add" ${isLocked()?'disabled':''}>+ 산출물 추가</button></div>`;
  root.querySelectorAll('.odone').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_outputs').update({done:el.checked}).eq('id',el.dataset.id); await audit('산출물 '+(el.checked?'완료':'해제'),''); });
  root.querySelectorAll('.otext').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_outputs').update({text:el.value}).eq('id',el.dataset.id); });
  root.querySelectorAll('.olink').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_outputs').update({link:el.value}).eq('id',el.dataset.id); });
  root.querySelectorAll('.ofview').forEach(el=>el.onclick=async()=>{ const {data:d,error}=await sb.storage.from('ax').createSignedUrl(el.dataset.path,3600); if(d&&d.signedUrl)window.open(d.signedUrl,'_blank'); else toast('파일 링크 생성 실패'); });
  root.querySelectorAll('.ofile').forEach(el=>el.onchange=async()=>{ if(!gate())return; const f=el.files[0]; if(!f)return;
    const path=`${taskId}/${Date.now()}_${f.name}`; const {error}=await sb.storage.from('ax').upload(path,f,{upsert:true});
    if(error){toast('업로드 실패: '+error.message);return;} await sb.from('ax_outputs').update({file_path:path}).eq('id',el.dataset.id); await audit('문서 업로드',f.name); toast('업로드 완료'); renderOutputs(root,taskId); });
  root.querySelectorAll('.odel').forEach(el=>el.onclick=async()=>{ if(!gate())return; await sb.from('ax_outputs').delete().eq('id',el.dataset.id); await audit('산출물 삭제',''); renderOutputs(root,taskId); });
  const add=$('#axOutAdd',root); if(add)add.onclick=async()=>{ if(!gate())return; await sb.from('ax_outputs').insert({task_id:taskId,idx:(data||[]).length,text:'새 산출물'}); renderOutputs(root,taskId); };
}

/* ==================== 5) 계획 대비 진척(근사) ==================== */
function plannedPct(subs){
  const today = CFG.base_date ? new Date(CFG.base_date) : new Date();
  let acc=0,n=0;
  (subs||[]).forEach(s=>{ if(!s.start||!s.end)return; const a=+new Date(s.start),b=+new Date(s.end),t=+today;
    let f=b>a?(t-a)/(b-a):(t>=a?1:0); f=Math.max(0,Math.min(1,f)); acc+=f; n++; });
  return n?Math.round(acc/n*100):0;
}

/* ==================== 6) 주간 상태보고 (인쇄/PDF) ==================== */
async function buildWeeklyReport(){
  const kpis=await loadKpis(); const {data:risks}=await sb.from('ax_risks').select('*');
  const sc=SCHED(); const all=sc.length? Math.round(sc.reduce((a,s)=>a+(s.progress||0),0)/sc.length):0;
  return `<div id="axReport"><h3>일산병원 AX 추진 · 주간 상태보고</h3>
    <div class="rsub">작성 ${new Date().toLocaleDateString('ko-KR')} · ${esc(currentUser())}</div>
    <p><b>전체 진척률 ${all}%</b></p>
    ${CFG.focus_text?`<div class="rsec">이번 분기 초점</div><p>${esc(CFG.focus_text)}</p>`:''}
    <div class="rsec">리스크 (${(risks||[]).length})</div><ul>${(risks||[]).map(r=>`<li>[${r.sev}] ${esc(r.text)}</li>`).join('')||'<li>없음</li>'}</ul>
    <div class="rsec">KPI 요약</div><table><tr><th>지표</th><th>실적</th><th>목표</th></tr>
      ${kpis.map(k=>`<tr><td>${esc(k.name)}</td><td>${k.current}${esc(k.unit)}</td><td>${k.target_num}${esc(k.unit)}</td></tr>`).join('')||'<tr><td colspan=3>없음</td></tr>'}</table></div>`;
}
async function printReport(){
  const html=await buildWeeklyReport();
  let o=document.getElementById('axPrintOverlay'); if(o)o.remove();
  o=document.createElement('div'); o.id='axPrintOverlay'; o.innerHTML=html; document.body.appendChild(o);
  document.body.classList.add('ax-printing'); window.print();
  setTimeout(()=>{ document.body.classList.remove('ax-printing'); o.remove(); },400);
}

/* ==================== 7) 실시간 구독 ==================== */
function subscribeAll(rerender){
  sb.channel('ax_port_ch')
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_kpi'},   rerender)
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_risks'}, rerender)
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_outputs'},rerender)
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_cfg'},   ()=>{loadCfg().then(()=>{renderLockBtn();rerender&&rerender();});})
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_audit'}, rerender)
    .subscribe();
}

/* ==================== 자체 UI (콘솔 버튼 + 드로어) ==================== */
function injectAxStyles(){
  if(document.getElementById('axPortStyle'))return;
  const st=document.createElement('style'); st.id='axPortStyle';
  st.textContent=`
  #axConsoleBtn{position:fixed;right:20px;bottom:88px;z-index:8000;height:52px;display:flex;align-items:center;background:#3d5a98;color:#fff;border:none;border-radius:26px;padding:0 20px;font-family:inherit;font-weight:800;font-size:.9rem;box-shadow:0 6px 20px rgba(18,38,58,.25);cursor:pointer}
  #axConsoleBtn:hover{background:#324b82}
  /* AI 비서 버튼: 문구 제거 · 말풍선 아이콘만 · 크기 통일 */
  #agentFab .fab-label{display:none!important}
  #agentFab{width:52px!important;min-width:52px!important;height:52px!important;padding:0!important;border-radius:50%!important;font-size:1.5rem!important;display:flex!important;align-items:center;justify-content:center;line-height:1}
  #axConsoleOv{position:fixed;inset:0;background:rgba(18,38,58,.45);z-index:8500;display:none}
  #axConsoleOv.open{display:flex;align-items:center;justify-content:center;padding:20px}
  #axConsoleOv .axc-panel{width:min(760px,96vw);max-height:90vh;background:#eef2f6;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;animation:axcIn .2s ease}
  @keyframes axcIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}
  #axConsoleOv .axc-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 16px;background:#3d5a98;color:#fff}
  #axConsoleOv .axc-head b{font-size:1rem}
  #axConsoleOv .axc-actions{display:flex;gap:6px;align-items:center}
  #axConsoleOv .axc-btn{background:rgba(255,255,255,.16);color:#fff;border:none;border-radius:7px;padding:6px 10px;font-family:inherit;font-weight:700;font-size:.78rem;cursor:pointer}
  #axConsoleOv .axc-btn.on{background:#c0492f}
  #axConsoleOv .axc-x{background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;line-height:1;padding:0 4px}
  #axConsoleOv .axc-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:14px;display:flex;flex-direction:column;gap:12px}
  .ax-card{background:#fff;border:1px solid #d3dde6;border-radius:11px;padding:12px 14px}
  .ax-card .ax-h{font-weight:800;color:#12263a;font-size:.9rem;margin-bottom:9px}
  .ax-card textarea{width:100%;min-height:64px;border:1px solid #d3dde6;border-radius:8px;padding:8px;font-family:inherit;font-size:.85rem;resize:vertical;box-sizing:border-box}
  .ax-logs{max-height:132px;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:3px}
  .ax-log{display:flex;gap:8px;font-size:.74rem;color:#12263a;padding:3px 0;border-bottom:1px solid #eef2f6}
  .ax-log .t{color:#6c7d8e;flex:0 0 auto}.ax-log .u{font-weight:700;flex:0 0 auto}
  .ax-empty{color:#6c7d8e;font-size:.8rem;padding:6px 0}
  .ax-risk{display:flex;gap:6px;margin-bottom:6px;align-items:center}
  .ax-risk .rsev{color:#fff;font-weight:800;border:none;border-radius:6px;padding:5px;cursor:pointer}
  .ax-risk .rtext{flex:1;border:1px solid #d3dde6;border-radius:6px;padding:6px 8px;font-family:inherit;font-size:.82rem}
  .ax-risk .rdel{background:none;border:1px solid #d3dde6;border-radius:6px;color:#c0492f;cursor:pointer;padding:4px 8px}
  .ax-tasksel{width:100%;padding:7px 9px;border:1px solid #d3dde6;border-radius:7px;font-family:inherit;font-size:.82rem;margin-bottom:8px;background:#fff}
  .ax-add{margin-top:6px;background:#eef2f6;border:1px dashed #b7c5d2;border-radius:7px;padding:7px 12px;font-family:inherit;font-weight:700;font-size:.8rem;color:#3d5a98;cursor:pointer}
  .ax-kpi{border-top:1px solid #eef2f6;padding:8px 0}
  .ax-kpi .kt{font-weight:700;font-size:.84rem}
  .ax-kpi .kfig{font-size:.8rem;color:#12263a;margin:2px 0}
  .ax-kpi .ktrack{height:7px;background:#e4ebf1;border-radius:5px;overflow:hidden;margin:4px 0}
  .ax-kpi .ktrack i{display:block;height:100%;background:#2e8b57;border-radius:5px}
  .ax-kpi .ked{font-size:.8rem;color:#12263a}
  .ax-kpi .knum{width:90px;border:1px solid #d3dde6;border-radius:6px;padding:4px 6px}
  .ax-kpi .ax-cap{color:#6c7d8e;font-size:.72rem;margin-left:4px}
  .ax-out{border-top:1px solid #eef2f6;padding:8px 0}
  .ax-out .otext{border:1px solid #d3dde6;border-radius:6px;padding:5px 7px;font-family:inherit;width:70%}
  .ax-out .orow{display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap}
  .ax-out .olink{flex:1;min-width:120px;border:1px solid #d3dde6;border-radius:6px;padding:5px 7px;font-size:.8rem}
  .ax-out .ofview{background:#3d5a98;color:#fff;border:none;border-radius:6px;padding:5px 9px;font-weight:700;cursor:pointer;font-size:.78rem}
  .ax-out .odel{background:none;border:1px solid #d3dde6;border-radius:6px;color:#c0492f;cursor:pointer;padding:4px 8px}
  #axReport{padding:20px;font-family:inherit;color:#12263a}
  #axReport h3{margin:0 0 4px}#axReport .rsub{color:#6c7d8e;font-size:.85rem;margin-bottom:10px}
  #axReport .rsec{font-weight:800;margin:12px 0 4px;border-bottom:2px solid #d3dde6}
  #axReport table{border-collapse:collapse;width:100%}#axReport th,#axReport td{border:1px solid #d3dde6;padding:5px 8px;font-size:.85rem;text-align:left}
  body.ax-printing>*:not(#axPrintOverlay){display:none!important}
  #axPrintOverlay{position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto}
  @media print{body.ax-printing>*:not(#axPrintOverlay){display:none!important}}
  #axGrowthCard{font-family:'Noto Sans KR',sans-serif}
  #axGrowthCard .eyebrow{font-size:.72rem;font-weight:800;letter-spacing:.08em;color:#0e8c86;text-transform:uppercase;margin-bottom:4px}
  #axGrowthCard h2{font-size:1.12rem;margin:0 0 8px;color:#12263a}
  #axGrowthCard .cyc-grid{display:grid;grid-template-columns:minmax(280px,400px) 1fr;gap:24px;align-items:center;margin-top:4px}
  #axGrowthCard .cyc-ring{display:grid;place-items:center;background:radial-gradient(120% 120% at 50% 0%,#f4f8fb,#e8eef4);border:1px solid #dbe4ec;border-radius:14px;padding:12px}
  #axGrowthCard .cyc-ring svg{max-width:370px}
  #axGrowthCard .lede{font-size:.86rem;color:#3a4a5a;line-height:1.62;margin:0 0 12px}
  #axGrowthCard .handoff{border-left:3px solid #0e8c86;padding:10px 14px;background:#f4faf9;border-radius:8px}
  #axGrowthCard .handoff .label{font-weight:800;color:#0e8c86;font-size:.78rem;margin-bottom:3px}
  #axGrowthCard .handoff p{margin:0;font-size:.82rem;color:#3a4a5a;line-height:1.55}
  @media(max-width:900px){#axGrowthCard .cyc-grid{grid-template-columns:1fr}}
  #axGrowthCard .cyc-arc{stroke-dasharray:7 7;animation:cycDash 1s linear infinite}
  @keyframes cycDash{to{stroke-dashoffset:-14}}
  #axGrowthCard .cyc-node{cursor:pointer;transform-box:fill-box;transform-origin:center;transition:transform .2s ease;animation:cycPop .5s backwards}
  #axGrowthCard .cyc-node:hover{transform:scale(1.15)}
  @keyframes cycPop{from{opacity:0;transform:scale(.35)}to{opacity:1;transform:scale(1)}}
  #axGrowthCard .cyc-center{transform-box:fill-box;transform-origin:center;animation:cycPulse 3.4s ease-in-out infinite}
  @keyframes cycPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  `;
  document.head.appendChild(st);
}
function _loadScript(src){return new Promise((res,rej)=>{ if([...document.scripts].some(s=>(s.src||'').indexOf(src)>=0))return res(); const s=document.createElement('script'); s.src=src; s.onload=()=>res(); s.onerror=()=>rej(new Error(src+' 로드 실패')); document.head.appendChild(s); });}
function mountGrowthCycle(){
  if(document.getElementById('axGrowthCard'))return;
  if(typeof window.renderCycle!=='function')return;
  injectAxStyles();
  const vm=document.getElementById('visionMap');
  const anchor=vm?vm.closest('.card'):null;
  const wrap=anchor?anchor.parentNode:document.querySelector('#v-overview .wrap');
  if(!wrap)return;
  const card=document.createElement('div'); card.id='axGrowthCard'; card.className='card'; card.style.marginTop='16px';
  if(anchor&&anchor.nextSibling) wrap.insertBefore(card,anchor.nextSibling); else wrap.appendChild(card);
  try{ window.renderCycle(card); }catch(e){ console.warn('[growth]',e); card.remove(); }
}
function styleFabs(){
  // AI 비서 버튼: 로봇 이모지 → 말풍선(💬), 라벨은 CSS로 숨김
  const ai=document.getElementById('agentFab');
  if(ai){ const n=[...ai.childNodes].find(c=>c.nodeType===3 && c.nodeValue.trim()); if(n) n.nodeValue='💬'; else if(!ai.querySelector('.ax-bubble')){ const s=document.createElement('span'); s.className='ax-bubble'; s.textContent='💬'; ai.insertBefore(s,ai.firstChild); } }
}
function mountConsoleUI(){
  if(document.getElementById('axConsoleBtn'))return;
  injectAxStyles();
  const btn=document.createElement('button');
  btn.id='axConsoleBtn'; btn.textContent='운영 콘솔'; btn.title='초점 · 리스크 · KPI · 변경이력 · 주간보고';
  document.body.appendChild(btn);
  const ov=document.createElement('div'); ov.id='axConsoleOv';
  ov.innerHTML=`<div class="axc-panel">
    <div class="axc-head"><b>🗂 AX 운영 콘솔</b>
      <span class="axc-actions">
        <button id="axLockBtn" class="axc-btn"></button>
        <button id="axPrintBtn" class="axc-btn">🖨 주간보고</button>
        <button id="axCloseBtn" class="axc-x" title="닫기">×</button>
      </span></div>
    <div class="axc-body">
      <div id="axFocusRoot"></div>
      <div id="axRiskRoot"></div>
      <div id="axKpiRoot"></div>
      <div id="axAuditRoot"></div>
    </div></div>`;
  document.body.appendChild(ov);
  const render=()=>{ renderFocus($('#axFocusRoot',ov)); renderRisks($('#axRiskRoot',ov)); renderKpis($('#axKpiRoot',ov)); renderAudit($('#axAuditRoot',ov)); renderLockBtn(); };
  btn.onclick=()=>{ ov.classList.add('open'); render(); };
  $('#axCloseBtn',ov).onclick=()=>ov.classList.remove('open');
  ov.onclick=e=>{ if(e.target===ov)ov.classList.remove('open'); };
  $('#axLockBtn',ov).onclick=()=>toggleLock().then(render);
  $('#axPrintBtn',ov).onclick=()=>printReport();
  _consoleRender=()=>{ if(ov.classList.contains('open'))render(); };
}

/* ==================== 세부계획(WBS) 리본: 산출물 탭으로 이동 ==================== */
function injectSchedTaskBtn(tid){
  const rb=document.querySelector('#swPanel .sw-ribbon'); if(!rb || rb.querySelector('#axSchedTaskBtn'))return;
  const b=document.createElement('button'); b.id='axSchedTaskBtn'; b.className='rb-ib rb-add'; b.textContent='📦 산출물 보기 →';
  b.title='이 과제의 산출물을 산출물 탭에서 봅니다';
  // 예전에는 여기서 빈 목록을 띄우는 팝업을 열었다. 이제 산출물 탭으로 보낸다.
  b.onclick=()=>{
    if(typeof window.closeSchedule==='function') window.closeSchedule();
    setTimeout(()=>{ if(typeof window.axOutputsGoto==='function') window.axOutputsGoto(tid); },120);
  };
  rb.appendChild(b);
}
function wrapRenderScheduleForPanel(){
  const orig=window.renderSchedule;
  if(typeof orig!=='function' || orig.__axPanel) return;
  const w=function(tid){ const r=orig.apply(this,arguments); try{ injectSchedTaskBtn(tid); }catch(e){} return r; };
  w.__axPanel=true; window.renderSchedule=w;
}

/* ==================== 본체 함수 래핑: 편집잠금 게이트 + 감사 로그 ==================== */
function _wrapFn(name, auditLabel){
  const orig = window[name];
  if(typeof orig !== 'function' || orig.__axWrapped) return;
  const w = function(){
    if(!isAuthed()){ toast('🔐 구글 로그인 후 편집할 수 있어요.'); return; }
    if(isLocked()){ toast('🔒 편집이 잠겨 있어요. 콘솔에서 잠금을 해제하세요.'); return; }
    const ret = orig.apply(this, arguments);
    if(auditLabel){ try{ Promise.resolve(ret).then(()=>{ audit(auditLabel, ''); }).catch(()=>{}); }catch(e){} }
    return ret;
  };
  w.__axWrapped = true;
  window[name] = w;
}
function wrapHostMutations(){
  // 잠금만(편집 차단)
  ['updateSchedField','updateExtraField','applyCellValues','cutCells','pasteCells','clearSelectedCells',
   'saveColWidth','applyFmtToCells','setColAlign','mergeCells','unmergeCells','saveMeetingField','saveActionField',
   'renameColumn'].forEach(n=>_wrapFn(n,null));
  // 잠금 + 감사 로그
  [['deleteRow','행 삭제'],['deleteSelected','행 삭제'],['addWbsNode','과제 추가'],['insertRow','행 삽입'],
   ['pasteRow','행 붙여넣기'],['moveRowBlock','행 이동'],['addColumn','열 추가'],['deleteColumn','열 삭제'],
   ['removeColumn','열 삭제'],['insertColumn','열 삽입'],['clearColumnData','열 비우기'],['_applyWbsImport','WBS 가져오기'],
   ['setMileStatus','마일스톤 상태변경'],['kanDrop','보드 상태변경'],['saveMile','마일스톤 일정수정'],['resetMile','마일스톤 초기화'],
   ['addMeeting','회의 추가'],['deleteMeeting','회의 삭제'],
   ['addAction','액션 추가'],['deleteAction','액션 삭제']].forEach(([n,l])=>_wrapFn(n,l));
}

/* ==================== 초기화 ==================== */
async function axPortInit(hooks){
  for(let i=0;i<40 && !_sb();i++){ await new Promise(r=>setTimeout(r,150)); }
  if(!_sb()){ console.warn('[ax_port] Supabase 클라이언트를 찾지 못해 초기화를 건너뜁니다.'); return; }
  try{
    await loadCfg();
    wrapHostMutations();
    wrapRenderScheduleForPanel();
    mountConsoleUI();
    styleFabs(); setTimeout(styleFabs,1500);
    renderLockBtn();
    _loadScript('growth_cycle.js').then(mountGrowthCycle).catch(e=>console.warn('[growth]',e && e.message||e));
    subscribeAll(()=>{ if(_consoleRender)_consoleRender(); if(hooks&&hooks.rerender)hooks.rerender(); });
  }catch(e){ console.warn('[ax_port] init 경고:', e && e.message || e); }
}

window.axPort = { init:axPortInit, CFG, isLocked, gate, toggleLock, audit,
  renderFocus, renderAudit, renderRisks, renderKpis, renderOutputs,
  plannedPct, buildWeeklyReport, printReport, loadCfg, mountConsoleUI };
})();

/* ── 산출물·KPI 탭 로더 ──────────────────────────────────────────────
   ax_outputs.js 는 자기완결적이라 로드만 하면 탭이 주입된다.
   (ax_outputs.js 가 다시 ax_gantt.js 를 잇는다) */
(function(){
  if([].slice.call(document.scripts).some(function(s){return (s.src||'').indexOf('ax_outputs.js')>=0;})) return;
  var s=document.createElement('script'); s.src='ax_outputs.js';
  s.onerror=function(){ console.warn('[ax] ax_outputs.js 로드 실패'); };
  document.head.appendChild(s);
})();

/* ── 프레즌스 보정 모듈 로더 ──────────────────────────────────────────
   동시접속자 위치정보가 유령 세션에 고정되던 문제를 바로잡는다. */
(function(){
  if([].slice.call(document.scripts).some(function(s){return (s.src||'').indexOf('ax_presence.js')>=0;})) return;
  var s=document.createElement('script'); s.src='ax_presence.js';
  s.onerror=function(){ console.warn('[ax] ax_presence.js 로드 실패'); };
  document.head.appendChild(s);
})();

/* ── 세부계획(WBS) 표 강화 모듈 로더 ────────────────────────────────── */
(function(){
  if([].slice.call(document.scripts).some(function(s){return (s.src||'').indexOf('ax_wbs.js')>=0;})) return;
  var s=document.createElement('script'); s.src='ax_wbs.js';
  s.onerror=function(){ console.warn('[ax] ax_wbs.js 로드 실패'); };
  document.head.appendChild(s);
})();

/* ── 개요 재구성 모듈 로더 ──────────────────────────────────────────── */
(function(){
  if([].slice.call(document.scripts).some(function(s){return (s.src||'').indexOf('ax_overview.js')>=0;})) return;
  var s=document.createElement('script'); s.src='ax_overview.js';
  s.onerror=function(){ console.warn('[ax] ax_overview.js 로드 실패'); };
  document.head.appendChild(s);
})();
