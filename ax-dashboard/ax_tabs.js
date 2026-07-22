/* =========================================================================
 * ax_tabs.js — 상단 탭 순서 직접 조정
 * -------------------------------------------------------------------------
 * index.html 은 건드리지 않는다. 탭을 드래그해서 원하는 순서로 놓을 수 있게 하고,
 * 그 순서를 브라우저(localStorage)에 저장해 다음 방문에도 유지한다.
 *   · 순서는 탭의 data-t 키로 저장한다(라벨이 바뀌어도 안전).
 *   · 산출물 탭처럼 나중에 추가되는 탭도 폴링으로 감지해 순서를 다시 적용한다.
 *   · 저장된 순서에 없는 새 탭은 항상 뒤에 붙는다(사라지지 않게).
 *   · 개인 화면 설정이므로 DB가 아니라 브라우저에만 저장한다.
 * =======================================================================*/
(function(){
  'use strict';
  var KEY='ax_tab_order_v1';
  var nav=null, applied='', dragKey=null;

  function tabs(){ return nav ? [].slice.call(nav.querySelectorAll('.tab')) : []; }
  function keyOf(el){ return (el.dataset && el.dataset.t) || el.textContent.trim(); }
  function saved(){
    try{ var v=JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v)?v:[]; }catch(e){ return []; }
  }
  function store(list){ try{ localStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }
  function currentOrder(){ return tabs().map(keyOf); }

  /* 저장된 순서대로 DOM 을 재배치한다. 저장 목록에 없는 탭은 원래 자리 뒤쪽에 남긴다. */
  function apply(){
    if(!nav) return;
    var want=saved(); if(!want.length) return;
    var list=tabs(); if(!list.length) return;
    var sig=want.join('|')+'::'+currentOrder().join('|');
    if(sig===applied) return;            // 바뀐 게 없으면 DOM 을 건드리지 않는다
    var byKey={}; list.forEach(function(el){ byKey[keyOf(el)]=el; });
    want.forEach(function(k){ if(byKey[k]) nav.appendChild(byKey[k]); });
    list.forEach(function(el){ if(want.indexOf(keyOf(el))<0) nav.appendChild(el); });
    applied=want.join('|')+'::'+currentOrder().join('|');
  }

  function css(){
    if(document.getElementById('axTabsCss')) return;
    var st=document.createElement('style'); st.id='axTabsCss';
    st.textContent=[
      'nav.tabs .tab{cursor:pointer}',
      'nav.tabs .tab.ax-tdrag{opacity:.45}',
      'nav.tabs .tab.ax-tover{box-shadow:inset 3px 0 0 var(--primary,#3d5a98)}',
      'nav.tabs .tab.ax-tover-r{box-shadow:inset -3px 0 0 var(--primary,#3d5a98)}',
      '#axTabReset{margin-left:8px;background:none;border:1px dashed var(--border);color:var(--muted);',
      '  border-radius:6px;font-size:.66rem;padding:2px 7px;cursor:pointer;font-family:inherit}',
      '#axTabReset:hover{color:var(--text);border-style:solid}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function wire(){
    tabs().forEach(function(el){
      if(el.__axTabWired) return;
      el.__axTabWired=true;
      el.setAttribute('draggable','true');
      if(!el.title) el.title='드래그해서 탭 순서를 바꿀 수 있어요';

      el.addEventListener('dragstart',function(e){
        dragKey=keyOf(el); el.classList.add('ax-tdrag');
        try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain','tab:'+dragKey); }catch(_){}
      });
      el.addEventListener('dragend',function(){
        dragKey=null;
        tabs().forEach(function(x){ x.classList.remove('ax-tdrag','ax-tover','ax-tover-r'); });
      });
      el.addEventListener('dragover',function(e){
        if(!dragKey || keyOf(el)===dragKey) return;
        e.preventDefault();
        var rect=el.getBoundingClientRect();
        // 가로 탭이면 좌우, 세로로 쌓인 탭이면 상하 기준으로 삽입 위치를 판단한다
        var horiz = rect.width>=rect.height;
        var after = horiz ? (e.clientX > rect.left+rect.width/2) : (e.clientY > rect.top+rect.height/2);
        tabs().forEach(function(x){ x.classList.remove('ax-tover','ax-tover-r'); });
        el.classList.add(after?'ax-tover-r':'ax-tover');
      });
      el.addEventListener('drop',function(e){
        if(!dragKey || keyOf(el)===dragKey) return;
        e.preventDefault(); e.stopPropagation();
        var src=dragKey; dragKey=null;
        var rect=el.getBoundingClientRect();
        var horiz = rect.width>=rect.height;
        var after = horiz ? (e.clientX > rect.left+rect.width/2) : (e.clientY > rect.top+rect.height/2);
        var order=currentOrder();
        var from=order.indexOf(src); if(from<0) return;
        order.splice(from,1);
        var to=order.indexOf(keyOf(el)); if(to<0) to=order.length-1;
        order.splice(after?to+1:to, 0, src);
        store(order); applied=''; apply();
        tabs().forEach(function(x){ x.classList.remove('ax-tdrag','ax-tover','ax-tover-r'); });
        try{ if(typeof window.toast==='function') window.toast('탭 순서를 저장했어요.'); }catch(_){}
      });
    });
  }

  /* 원래 순서로 되돌리는 작은 버튼 — 저장값을 지우면 index.html 순서가 그대로 나온다 */
  function resetBtn(){
    if(!nav || document.getElementById('axTabReset')) return;
    if(!saved().length) return;                 // 사용자가 바꾼 적 있을 때만 보인다
    var b=document.createElement('button');
    b.id='axTabReset'; b.type='button'; b.textContent='탭 순서 초기화';
    b.title='탭 순서를 기본값으로 되돌립니다';
    b.onclick=function(e){
      e.stopPropagation();
      try{ localStorage.removeItem(KEY); }catch(_){}
      b.remove();
      try{ if(typeof window.toast==='function') window.toast('탭 순서를 초기화했어요. 새로고침하면 기본 순서로 보여요.'); }catch(_){}
    };
    nav.appendChild(b);
  }

  function tick(){
    if(!nav) nav=document.querySelector('nav.tabs');
    if(!nav) return;
    css(); wire(); apply(); resetBtn();
  }

  var n=0;
  var t=setInterval(function(){ tick(); if(++n>240) clearInterval(t); }, 500);
  tick();

  window.axTabs={ apply:apply, reset:function(){ try{ localStorage.removeItem(KEY); }catch(_){} applied=''; } };
})();
