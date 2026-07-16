/* =========================================================================
 * ax_port.js — 콘솔 기능의 ilsan-AX(Supabase) 이식 모듈
 * -------------------------------------------------------------------------
 * schema.sql 을 먼저 실행한 뒤 이 파일을 ilsan-AX <script> 하단에 포함하세요.
 * 아래 ADAPTER 3개만 ilsan-AX 실제 값으로 연결하면 됩니다.
 * ========================================================================= */
(function(){
'use strict';

/* ===================== ADAPTER (여기만 맞추세요) ===================== */
// 1) DB 클라이언트 해석: window.supa 또는 본체의 전역 supa(let) 를 런타임에 가져옴
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

// 2) 현재 사용자 이름
function currentUser(){ return window.whoAmI ? window.whoAmI() : '게스트'; }

// 3) WBS 배열 연결
const SCHED = () => (window.TASKS || []).map(t => ({
  id: t.id,
  title: t.title,
  goal: t.goal,
  progress: window.taskProgress ? window.taskProgress(t) : 0
}));
const taskProgress = (id) => { const r=SCHED().find(s=>s.id===id); return r? (r.progress||0):0; };
const taskTitle    = (id) => { const r=SCHED().find(s=>s.id===id); return r? (r.title||id):id; };
/* ==================================================================== */

const $ = (s,r)=> (r||document).querySelector(s);
const esc = s => (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const toast = (window.toast || function(m){console.log('[toast]',m);});

/* ============ 0) 설정(초점/잠금/기준일) + 편집 잠금 게이트 ============ */
const CFG = { focus_text:'', locked:false, base_date:null };
async function loadCfg(){ const {data}=await sb.from('ax_cfg').select('*').eq('id','main').single(); if(data)Object.assign(CFG,data); }
async function saveCfg(patch){ Object.assign(CFG,patch); await sb.from('ax_cfg').update({...patch,updated_at:new Date().toISOString()}).eq('id','main'); }
function isLocked(){ return !!CFG.locked; }
// 모든 mutation 앞에 gate() 호출 → 잠금 시 차단
function gate(){ if(isLocked()){ toast('🔒 편집 잠금 상태'); return false; } return true; }
async function toggleLock(){ await saveCfg({locked:!CFG.locked}); await audit('편집 '+(CFG.locked?'잠금':'해제'),''); renderLockBtn(); }
function renderLockBtn(){ const b=$('#axLockBtn'); if(b){ b.textContent = CFG.locked?'🔒 잠금해제':'🔓 잠금'; b.classList.toggle('on',CFG.locked);} }

// 이번 분기 초점 카드
function renderFocus(root){
  root.innerHTML = `<div class="ax-card"><div class="ax-h">이번 분기 초점</div>
    <textarea id="axFocus" ${isLocked()?'disabled':''} placeholder="이번 분기 집중 사항">${esc(CFG.focus_text||'')}</textarea></div>`;
  const t=$('#axFocus',root); if(t) t.onchange=async()=>{ if(!gate())return; await saveCfg({focus_text:t.value}); await audit('초점 수정',''); };
}

/* ==================== 1) 변경 이력(감사 로그) ==================== */
async function audit(action,target){ try{ await sb.from('ax_audit').insert({usr:currentUser(),action,target}); }catch(e){console.warn(e);} }
async function renderAudit(root){
  const {data}=await sb.from('ax_audit').select('*').order('ts',{ascending:false}).limit(300);
  root.innerHTML = `<div class="ax-card"><div class="ax-h">변경 이력 (${(data||[]).length})</div>`+
    ((data||[]).map(e=>`<div class="ax-log"><span class="t">${new Date(e.ts).toLocaleString('ko-KR')}</span><span class="u">${esc(e.usr)}</span><span>${esc(e.action)} ${esc(e.target||'')}</span></div>`).join('')||'<div class="ax-empty">기록 없음</div>')+`</div>`;
}

/* ==================== 2) 리스크 보드(H/M/L) ==================== */
const SEVC={H:'#c0492f',M:'#c1791d',L:'#6c7d8e'};
async function renderRisks(root){
  const {data}=await sb.from('ax_risks').select('*').order('sort');
  root.innerHTML = `<div class="ax-card"><div class="ax-h">리스크</div><div id="axRiskList">`+
    (data||[]).map(r=>`<div class="ax-risk">
      <select data-id="${r.id}" class="rsev" ${isLocked()?'disabled':''} style="background:${SEVC[r.sev]||SEVC.M}">
        ${['H','M','L'].map(s=>`<option ${r.sev===s?'selected':''}>${s}</option>`).join('')}</select>
      <input data-id="${r.id}" class="rtext" value="${esc(r.text)}" ${isLocked()?'disabled':''} placeholder="리스크 내용">
      <button data-id="${r.id}" class="rdel" ${isLocked()?'disabled':''}>✕</button></div>`).join('')+
    `</div><button id="axRiskAdd" ${isLocked()?'disabled':''}>+ 리스크 추가</button></div>`;
  root.querySelectorAll('.rsev').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_risks').update({sev:el.value}).eq('id',el.dataset.id); await audit('리스크 심각도 변경',''); });
  root.querySelectorAll('.rtext').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_risks').update({text:el.value}).eq('id',el.dataset.id); });
  root.querySelectorAll('.rdel').forEach(el=>el.onclick=async()=>{ if(!gate())return; await sb.from('ax_risks').delete().eq('id',el.dataset.id); await audit('리스크 삭제',''); renderRisks(root); });
  const add=$('#axRiskAdd',root); if(add)add.onclick=async()=>{ if(!gate())return; await sb.from('ax_risks').insert({sev:'M',text:''}); await audit('리스크 추가',''); renderRisks(root); };
}

/* ==================== 3) KPI 트래커(상한·All-or-None·과제매핑) ==================== */
async function loadKpis(taskId){ let q=sb.from('ax_kpi').select('*').order('sort'); if(taskId)q=q.eq('task_id',taskId); const {data}=await q; return data||[]; }
async function renderKpis(root, taskId){   // taskId 있으면 과제별(노드 편집), 없으면 전체 트래커
  const list=await loadKpis(taskId);
  root.innerHTML = `<div class="ax-card"><div class="ax-h">성과지표 (KPI)${taskId?' · '+esc(taskTitle(taskId)):''}</div>`+
    list.map(k=>{
      const p=k.target_num? Math.min(1,(k.current||0)/k.target_num)*100 : 0;
      const val = k.binary ? (k.current>=k.target_num?'달성':'미달성') : k.current;
      const input = k.binary
        ? `<label class="ax-ck"><input type="checkbox" data-id="${k.id}" class="kbin" ${k.current>=k.target_num?'checked':''} ${isLocked()?'disabled':''}> 달성 여부 (All-or-None)</label>`
        : `현재값 <input type="number" min="0" max="${k.target_num}" step="any" value="${k.current}" data-id="${k.id}" data-max="${k.target_num}" class="knum" ${isLocked()?'disabled':''}> ${esc(k.unit)} <span class="ax-cap">상한 ${k.target_num}${esc(k.unit)}</span>`;
      return `<div class="ax-kpi"><div class="kt">${esc(k.name)}</div>
        <div class="kfig"><b>${esc(String(val))}</b> / ${k.target_num}${esc(k.unit)}</div>
        <div class="ktrack"><i style="width:${p}%"></i></div>
        <div class="ked">${input}</div></div>`;
    }).join('')+`</div>`;
  root.querySelectorAll('.knum').forEach(el=>el.onchange=async()=>{ if(!gate())return;
    let v=parseFloat(el.value)||0; v=Math.max(0,Math.min(+el.dataset.max, v));   // ★ 상한 클램프
    await sb.from('ax_kpi').update({current:v}).eq('id',el.dataset.id); await audit('KPI 실적 입력',''); renderKpis(root,taskId); });
  root.querySelectorAll('.kbin').forEach(el=>el.onchange=async()=>{ if(!gate())return;
    const id=el.dataset.id; const k=list.find(x=>x.id===id);
    await sb.from('ax_kpi').update({current: el.checked? k.target_num : 0}).eq('id',id); await audit('KPI '+(el.checked?'달성':'미달성'),''); renderKpis(root,taskId); });
}

/* ==================== 4) 기대산출물(완료·링크·파일 업로드) ==================== */
async function renderOutputs(root, taskId){
  const {data}=await sb.from('ax_outputs').select('*').eq('task_id',taskId).order('idx');
  root.innerHTML = `<div class="ax-card"><div class="ax-h">기대 산출물</div>`+
    (data||[]).map(o=>`<div class="ax-out">
      <label><input type="checkbox" class="odone" data-id="${o.id}" ${o.done?'checked':''} ${isLocked()?'disabled':''}> <input class="otext" data-id="${o.id}" value="${esc(o.text)}" ${isLocked()?'disabled':''}></label>
      <div class="orow"><input class="olink" data-id="${o.id}" placeholder="파일서버 경로/URL" value="${esc(o.link)}" ${isLocked()?'disabled':''}>
        <input type="file" class="ofile" data-id="${o.id}" ${isLocked()?'disabled':''}>
        ${o.file_path?`<a href="${esc(sb.storage.from('ax').getPublicUrl(o.file_path).data.publicUrl)}" target="_blank">파일</a>`:''}
        <button class="odel" data-id="${o.id}" ${isLocked()?'disabled':''}>✕</button></div></div>`).join('')+
    `<button id="axOutAdd" ${isLocked()?'disabled':''}>+ 산출물 추가</button></div>`;
  root.querySelectorAll('.odone').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_outputs').update({done:el.checked}).eq('id',el.dataset.id); await audit('산출물 '+(el.checked?'완료':'해제'),''); });
  root.querySelectorAll('.otext').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_outputs').update({text:el.value}).eq('id',el.dataset.id); });
  root.querySelectorAll('.olink').forEach(el=>el.onchange=async()=>{ if(!gate())return; await sb.from('ax_outputs').update({link:el.value}).eq('id',el.dataset.id); });
  root.querySelectorAll('.ofile').forEach(el=>el.onchange=async()=>{ if(!gate())return; const f=el.files[0]; if(!f)return;
    const path=`${taskId}/${Date.now()}_${f.name}`; const {error}=await sb.storage.from('ax').upload(path,f,{upsert:true});
    if(error){toast('업로드 실패');return;} await sb.from('ax_outputs').update({file_path:path}).eq('id',el.dataset.id); await audit('문서 업로드',f.name); renderOutputs(root,taskId); });
  root.querySelectorAll('.odel').forEach(el=>el.onclick=async()=>{ if(!gate())return; await sb.from('ax_outputs').delete().eq('id',el.dataset.id); await audit('산출물 삭제',''); renderOutputs(root,taskId); });
  const add=$('#axOutAdd',root); if(add)add.onclick=async()=>{ if(!gate())return; await sb.from('ax_outputs').insert({task_id:taskId,idx:(data||[]).length,text:'새 산출물'}); renderOutputs(root,taskId); };
}
// ※ Supabase Storage 'ax' 버킷을 미리 생성(public 또는 정책 설정)하세요.

/* ==================== 5) 계획 대비 진척(flag) — 세부과제 있을 때 ==================== */
function plannedPct(subs){   // subs: [{start,end}] (ax_subtasks). 없으면 마일스톤 날짜로 대체 근사.
  const today = CFG.base_date ? new Date(CFG.base_date) : new Date();
  let acc=0,n=0;
  (subs||[]).forEach(s=>{ if(!s.start||!s.end)return; const a=+new Date(s.start),b=+new Date(s.end),t=+today;
    let f=b>a?(t-a)/(b-a):(t>=a?1:0); f=Math.max(0,Math.min(1,f)); acc+=f; n++; });
  return n?Math.round(acc/n*100):0;
}
// 진행바에 flag 마커: <div class="ax-bar"><i style="width:${actual}%"></i><span class="ax-flag" style="left:${plan}%"></span></div>

/* ==================== 6) 주간 상태보고 (인쇄/PDF) ==================== */
async function buildWeeklyReport(){
  const kpis=await loadKpis(); const {data:risks}=await sb.from('ax_risks').select('*');
  const sc=SCHED(); const all=sc.length? Math.round(sc.reduce((a,s)=>a+(s.progress||0),0)/sc.length):0;
  return `<div id="axReport"><h3>일산병원 AX 추진 · 주간 상태보고</h3>
    <div class="rsub">작성 ${new Date().toLocaleDateString('ko-KR')} · ${esc(currentUser())}</div>
    <p><b>전체 진척률 ${all}%</b></p>
    <div class="rsec">리스크 (${(risks||[]).length})</div><ul>${(risks||[]).map(r=>`<li>[${r.sev}] ${esc(r.text)}</li>`).join('')||'<li>없음</li>'}</ul>
    <div class="rsec">KPI 요약</div><table><tr><th>지표</th><th>실적</th><th>목표</th></tr>
      ${kpis.map(k=>`<tr><td>${esc(k.name)}</td><td>${k.current}${esc(k.unit)}</td><td>${k.target_num}${esc(k.unit)}</td></tr>`).join('')}</table></div>`;
}
async function printReport(){
  const html=await buildWeeklyReport();
  let o=document.getElementById('axPrintOverlay'); if(o)o.remove();
  o=document.createElement('div'); o.id='axPrintOverlay'; o.innerHTML=html; document.body.appendChild(o);
  document.body.classList.add('ax-printing'); window.print();
  setTimeout(()=>{ document.body.classList.remove('ax-printing'); o.remove(); },400);
}
// CSV 는 ilsan-AX 기존 내보내기를 재사용하세요.

/* ==================== 7) 실시간 구독 (다중사용자 반영) ==================== */
function subscribeAll(rerender){
  sb.channel('ax_port_ch')
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_kpi'},   rerender)
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_risks'}, rerender)
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_outputs'},rerender)
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_cfg'},   ()=>{loadCfg().then(()=>{renderLockBtn();rerender&&rerender();});})
    .on('postgres_changes',{event:'*',schema:'public',table:'ax_audit'}, rerender)
    .subscribe();
}

/* ==================== 초기화 ==================== */
async function axPortInit(hooks){   // hooks.rerender: 화면 갱신 콜백(선택)
  // 본체의 Supabase 클라이언트(supa)가 준비될 때까지 최대 6초 대기
  for(let i=0;i<40 && !_sb();i++){ await new Promise(r=>setTimeout(r,150)); }
  if(!_sb()){ console.warn('[ax_port] Supabase 클라이언트를 찾지 못해 초기화를 건너뜁니다.'); return; }
  try{ await loadCfg(); renderLockBtn(); subscribeAll(hooks&&hooks.rerender); }
  catch(e){ console.warn('[ax_port] init 경고:', e && e.message || e); }
}

// 전역 노출
window.axPort = { init:axPortInit, CFG, isLocked, gate, toggleLock, audit,
  renderFocus, renderAudit, renderRisks, renderKpis, renderOutputs,
  plannedPct, buildWeeklyReport, printReport, loadCfg };
})();
