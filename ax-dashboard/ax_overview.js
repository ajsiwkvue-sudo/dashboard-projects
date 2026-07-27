/* =========================================================================
 * ax_overview.js — 개요 탭 재구성
 *  · 상단: 비전 배너(축소) + KPI(핵심목표~지연) 나란히
 *  · 좌: "오늘 진행중인 세부계획"(시스템 날짜 기준 WBS 일자 매칭)
 *        전략과제 › 대과제(겹치면 한 번) › 세부과제 · D-day, 담당자 필터, 완료=회색
 *        높이는 우측 컬럼(성장사이클 하단)에 맞추고 넘치면 박스 안 스크롤
 *  · 우: 전체 사업 진척률 · 핵심목표별 진척도 · 성장사이클(기존 컴포넌트 그대로)
 *  · 제거(숨김): 세부계획(WBS) 진척현황 · 비전 체계도 · 월별 마일스톤 추이
 *  전역 const(TASKS/OWNERS/schedCache)는 window 미노출 → typeof 가드로 접근.
 * =======================================================================*/
(function(){
  'use strict';
  var OV='#v-overview';
  function q(s,r){ return (r||document).querySelector(s); }
  function TASKS_(){ try{ if(typeof TASKS!=='undefined') return TASKS; }catch(e){} return []; }
  function CACHE_(){ try{ if(typeof schedCache!=='undefined') return schedCache; }catch(e){} return {}; }
  function OWNERS_(){ try{ if(typeof OWNERS!=='undefined') return OWNERS; }catch(e){} return {}; }
  function leaves_(rows){ try{ if(typeof window._wbsLeaves==='function') return window._wbsLeaves(rows||[]); }catch(e){} return rows||[]; }

  var curOwner='';   // 담당자 필터 상태 유지
  var filterInit=false;

  function injectCss(){
    if(document.getElementById('axOvCss')) return;
    var st=document.createElement('style'); st.id='axOvCss';
    st.textContent=[
      '#axTopRow{display:grid;grid-template-columns:minmax(360px,440px) 1fr;gap:12px;margin-bottom:14px;align-items:stretch}',
      '#axTopRow .vision-hero{margin-bottom:0;padding:16px 22px}',
      '#axTopRow .vision-hero .vh-txt{font-size:1.1rem;line-height:1.3}',
      '#axTopRow #kpiGrid{margin-bottom:0;align-self:center;grid-template-columns:repeat(6,minmax(0,1fr))}',
      '@media(max-width:1200px){#axTopRow #kpiGrid{grid-template-columns:repeat(3,1fr)}}',
      '#axMainRow{display:grid;grid-template-columns:320px 1fr;gap:14px;align-items:start}',
      '#axRightCol{display:flex;flex-direction:column;gap:16px;min-width:0}',
      '#axRightCol>.card{margin:0 !important}',
      '#axTodo{display:flex;flex-direction:column;min-height:0}',
      '#axTodo .ax-td-h{font-size:1rem;font-weight:800;display:flex;align-items:center;gap:6px}',
      '#axTodo .ax-td-sub{font-size:.72rem;color:var(--muted);margin:3px 0 8px}',
      '#axTodo select{width:100%;font-size:.82rem;padding:7px 9px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);margin-bottom:8px;font-family:inherit}',
      '#axTodo .ax-td-cnt{font-size:.72rem;color:var(--muted);margin-bottom:8px}',
      '#axTodo .ax-td-list{overflow-y:auto;flex:1;min-height:0;padding-right:4px}',
      '.ax-grp{border-left:3px solid #3d5a98;padding-left:9px;margin-bottom:12px}',
      '.ax-grp.g1{border-color:#3d5a98}.ax-grp.g2{border-color:#0e8c86}.ax-grp.g3{border-color:#c1791d}',
      '.ax-grp .ax-tt{font-size:.8rem;font-weight:700}',
      '.ax-grp .ax-ph{font-size:.72rem;color:var(--muted);margin:4px 0 1px}',
      '.ax-it{font-size:.78rem;padding:3px 2px;display:flex;justify-content:space-between;gap:8px;align-items:flex-start;cursor:pointer;border-radius:6px}',
      '.ax-it:hover{background:rgba(61,90,152,.07)}',
      '.ax-it .ax-nm{min-width:0}',
      '.ax-it .ax-dd{font-size:.72rem;font-weight:700;white-space:nowrap;padding-top:1px}',
      '.ax-it .ax-dd.urg{color:#c0492f}.ax-it .ax-dd.soon{color:#d98324}.ax-it .ax-dd.far{color:var(--muted)}.ax-it .ax-dd.done{color:#2e8b57}',
      '.ax-it.done .ax-nm{color:var(--muted);text-decoration:line-through}',
      '.ax-td-empty{font-size:.8rem;color:var(--muted);padding:8px 2px}',
      '.ax-goalbars{display:flex;flex-direction:column;gap:12px;padding:6px 0}',
      '.ax-goalbars .ax-gr{display:flex;align-items:center;gap:11px}',
      '.ax-goalbars .ax-gl{width:118px;font-size:.82rem;color:var(--muted);flex-shrink:0}',
      '.ax-goalbars .ax-gt{flex:1;height:16px;background:rgba(120,132,150,.16);border-radius:6px;overflow:hidden}',
      '.ax-goalbars .ax-gf{display:block;height:100%;border-radius:6px}',
      '.ax-goalbars .ax-gp{width:44px;text-align:right;font-weight:800;font-size:.86rem}',
      '@media(max-width:900px){#axTopRow{grid-template-columns:1fr}#axMainRow{grid-template-columns:1fr}#axTodo{max-height:60vh}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── 오늘 기준 진행중 세부과제 수집 (전략 › 대과제 › 세부과제) ── */
  function today0(){ var d=new Date(); d.setHours(0,0,0,0); return d; }
  function dparse(s){ if(!s) return null; var m=String(s).match(/(\d{4})-(\d{1,2})-(\d{1,2})/); if(!m) return null; return new Date(+m[1], +m[2]-1, +m[3]); }
  function effPhase(rows){ var last='', map={}; rows.forEach(function(r){ var p=(r.phase||'').trim(); if(p) last=p; map[r.id]=last||'(대과제 미지정)'; }); return map; }
  function ownerNames(tid){ var o=OWNERS_()[tid]||{}; return ((o.main||'')+', '+(o.sub||'')).split(',').map(function(x){return x.trim();}).filter(Boolean); }

  function collect(){
    var t0=today0(), out=[];
    TASKS_().forEach(function(tk){
      var rows=(CACHE_()[tk.id]||[]).slice().sort(function(a,b){ return (a.sort_order||0)-(b.sort_order||0); });
      if(!rows.length) return;
      var pmap=effPhase(rows);
      leaves_(rows).forEach(function(r){
        var s=dparse(r.start_date), e=dparse(r.end_date);
        if(!s||!e) return;
        if(t0>=s && t0<=e){
          out.push({ task:tk.id, title:tk.title||'', phase:pmap[r.id]||'(대과제)', name:r.name||'(제목 없음)',
                     end:e, prog:Math.max(0,Math.min(100,+r.progress||0)) });
        }
      });
    });
    return out;
  }

  function esc(s){ try{ if(typeof escH==='function') return escH(s); }catch(e){}
    return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function renderList(){
    var list=document.getElementById('axTodoList'); if(!list) return;
    var all=collect();
    var shown = curOwner ? all.filter(function(x){ return ownerNames(x.task).indexOf(curOwner)>=0; }) : all;
    var cnt=document.getElementById('axTodoCnt');
    if(cnt) cnt.textContent='표시 '+shown.length+'건'+(curOwner?' · 담당자: '+curOwner:' · 추진단 전체');
    // 전략과제 → 대과제 그룹핑
    var byTask={}; shown.forEach(function(i){ (byTask[i.task]=byTask[i.task]||[]).push(i); });
    var t0=today0(), html='';
    Object.keys(byTask).sort().forEach(function(t){
      var g=t.charAt(0);
      html+='<div class="ax-grp g'+g+'"><div class="ax-tt">'+esc(t)+' · '+esc(byTask[t][0].title)+'</div>';
      var byPh={}, order=[];
      byTask[t].forEach(function(i){ if(!byPh[i.phase]){ byPh[i.phase]=[]; order.push(i.phase); } byPh[i.phase].push(i); });
      order.forEach(function(ph){
        html+='<div class="ax-ph">'+esc(ph)+'</div>';
        byPh[ph].forEach(function(i){
          var done=i.prog>=100, badge;
          if(done){ badge='<span class="ax-dd done">완료 ✓</span>'; }
          else{
            var d=Math.round((i.end - t0)/86400000);
            var cls=d<=7?'urg':(d<=30?'soon':'far');
            var md=(i.end.getMonth()+1);var dd=i.end.getDate();
            var ds=(md<10?'0':'')+md+'.'+(dd<10?'0':'')+dd;
            badge='<span class="ax-dd '+cls+'" title="마감 '+ds+'">D-'+d+'</span>';
          }
          var pct=(i.prog>0&&i.prog<100)?' <span style="color:#3d5a98">'+i.prog+'%</span>':'';
          html+='<div class="ax-it'+(done?' done':'')+'" onclick="openSchedule(\''+esc(t)+'\')" title="세부계획 열기">'+
                '<span class="ax-nm">'+esc(i.name)+pct+'</span>'+badge+'</div>';
        });
      });
      html+='</div>';
    });
    list.innerHTML=html||'<div class="ax-td-empty">'+(curOwner?'해당 담당자의 ':'')+'오늘 일정 세부계획이 없습니다.</div>';
    // 헤더 카운트/날짜
    var sub=document.getElementById('axTodoSub');
    if(sub){ var d=new Date(); sub.textContent=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+' 기준 · WBS 일자에 걸린 세부과제 '+all.length+'건'; }
  }

  function initFilter(){
    var selEl=document.getElementById('axTodoFilter'); if(!selEl) return;
    if(filterInit && selEl.options.length>1) return;
    var names={}; TASKS_().forEach(function(tk){ ownerNames(tk.id).forEach(function(n){ names[n]=1; }); });
    var arr=Object.keys(names).sort(function(a,b){ return a.localeCompare(b,'ko'); });
    if(!arr.length) return;
    var me=''; try{ if(typeof authUser!=='undefined' && authUser && authUser.name) me=authUser.name; }catch(e){}
    selEl.innerHTML='<option value="">담당자 전체</option>'+arr.map(function(n){
      return '<option value="'+esc(n)+'"'+(n===curOwner?' selected':'')+'>'+esc(n)+(n===me?' (나)':'')+'</option>';
    }).join('');
    selEl.onchange=function(){ curOwner=selEl.value; renderList(); setTimeout(syncHeight,30); };
    filterInit=true;
  }

  function buildTodoShell(){
    var d=document.createElement('div'); d.id='axTodo'; d.className='card';
    d.innerHTML=
      '<div class="ax-td-h">📅 오늘 일정 세부계획</div>'+
      '<div class="ax-td-sub" id="axTodoSub"></div>'+
      '<select id="axTodoFilter"><option value="">담당자 전체</option></select>'+
      '<div class="ax-td-cnt" id="axTodoCnt"></div>'+
      '<div class="ax-td-list" id="axTodoList"></div>';
    return d;
  }

  /* ── 레이아웃 재구성(멱등) ── */
  function buildLayout(){
    var wrap=q(OV+' .wrap'); if(!wrap) return false;
    var vision=q(OV+' .vision-hero'), kpi=document.getElementById('kpiGrid');
    var gauge=document.getElementById('ovFill') ? document.getElementById('ovFill').closest('.card') : null;
    var goalCard=document.getElementById('goalChart') ? document.getElementById('goalChart').closest('.card') : null;
    if(!vision||!kpi||!gauge||!goalCard) return false;
    var growth=document.getElementById('axGrowthCard');

    // 겹치는 박스 숨김
    ['#wbsCover','#visionMap','#monthChart'].forEach(function(sel){
      var el=q(sel); if(el){ var c=el.closest('.card'); if(c) c.style.display='none'; }
    });

    // 상단 행
    var top=document.getElementById('axTopRow');
    if(!top){ top=document.createElement('div'); top.id='axTopRow';
      vision.parentNode.insertBefore(top, vision);
      top.appendChild(vision); top.appendChild(kpi);
    }
    // 메인 행
    var main=document.getElementById('axMainRow');
    if(!main){ main=document.createElement('div'); main.id='axMainRow';
      top.parentNode.insertBefore(main, top.nextSibling);
      main.appendChild(buildTodoShell());
      var right=document.createElement('div'); right.id='axRightCol';
      main.appendChild(right);
    }
    var rc=document.getElementById('axRightCol');
    var grid2=goalCard.closest('.grid2');
    if(gauge.parentNode!==rc) rc.appendChild(gauge);
    if(goalCard.parentNode!==rc) rc.appendChild(goalCard);
    if(growth && growth.parentNode!==rc) rc.appendChild(growth);
    if(grid2) grid2.style.display='none';
    return true;
  }

  function isOverview(){ var v=document.getElementById('v-overview'); return v && v.classList.contains('active'); }

  function syncHeight(){
    var todo=document.getElementById('axTodo'), rc=document.getElementById('axRightCol');
    if(!todo||!rc) return;
    if(window.innerWidth<=900 || !isOverview()){ todo.style.height=''; return; }
    var h=rc.offsetHeight;
    if(h>200) todo.style.height=h+'px';
  }

  /* ── 핵심목표별 진척도: 세로 차트 → 가로 막대(높이 절약) ── */
  function installGoalBars(){
    if(typeof window.drawGoalChart==='function' && window.drawGoalChart.__axBars) return;
    var w=function(){
      try{
        var cv=document.getElementById('goalChart'); if(!cv) return;
        var box=cv.parentNode; if(!box) return;
        cv.style.display='none'; box.style.height='auto';
        var bars=box.querySelector('.ax-goalbars');
        if(!bars){ bars=document.createElement('div'); bars.className='ax-goalbars'; box.appendChild(bars); }
        var gs=(typeof goals!=='undefined')?goals:[];
        var colors=['#3d5a98','#0e8c86','#c1791d'];
        bars.innerHTML=gs.map(function(g,i){
          var gt=TASKS_().filter(function(t){return t.goal===g.id;});
          var p=gt.length?Math.round(gt.reduce(function(s,t){return s+taskProgress(t);},0)/gt.length):0;
          return '<div class="ax-gr"><span class="ax-gl">목표'+g.id+' '+esc(g.axis)+'</span>'+
                 '<span class="ax-gt"><span class="ax-gf" style="width:'+p+'%;background:'+colors[i%3]+'"></span></span>'+
                 '<span class="ax-gp">'+p+'%</span></div>';
        }).join('');
      }catch(e){ console.warn('[ax-ov] goalbars',e&&e.message); }
    };
    w.__axBars=true; window.drawGoalChart=w;
  }

  /* ── 전체 진척률 범례를 간결 형식으로 ── */
  function updateLegend(){
    try{
      var leg=document.getElementById('ovLegend'); if(!leg) return;
      var totLeaf=0, done=0, over=0;
      TASKS_().forEach(function(t){ leaves_(CACHE_()[t.id]||[]).forEach(function(r){ totLeaf++; var s=''; try{s=wbsStatus(r);}catch(e){} if(s==='완료')done++; else if(s==='지연')over++; }); });
      var inRange=collect().length;
      var plan=Math.max(0, totLeaf - inRange - done - over);
      leg.innerHTML='오늘 진행 '+inRange+' · 완료 '+done+' · 예정 '+plan+' · 지연 '+over+' · 세부과제 '+totLeaf+'개';
    }catch(e){ console.warn('[ax-ov] legend',e&&e.message); }
  }

  function apply(){
    if(!buildLayout()) return;
    initFilter();
    renderList();
    installGoalBars();
    try{ window.drawGoalChart(); }catch(e){}
    updateLegend();
    syncHeight();
  }

  function hook(){
    var orig=window.renderOverview;
    if(typeof orig!=='function' || orig.__axOv) return false;
    var w=function(){ var r=orig.apply(this,arguments); try{ apply(); }catch(e){ console.warn('[ax-ov]',e&&e.message); } return r; };
    w.__axOv=true; window.renderOverview=w; return true;
  }

  injectCss();
  window.addEventListener('resize', function(){ try{ syncHeight(); }catch(e){} });
  var n=0, t=setInterval(function(){
    injectCss(); hook();
    try{ apply(); }catch(e){}
    if(++n>160) clearInterval(t);
  }, 500);
})();
