/* =========================================================================
 * ax_presence.js — 동시접속자 "위치정보"가 멈춰 보이던 버그 수정
 * -------------------------------------------------------------------------
 * 증상: 다른 사람(또는 나)의 칩에 표시되는 현재 위치가 실제와 다르고,
 *       탭을 옮겨도 바뀌지 않아 마치 연결이 끊긴 것처럼 보인다.
 *
 * 원인 두 가지
 *  ① index.html 의 renderPresence 는 presenceState() 를 이름 기준으로 dedupe 하는데,
 *     Object.values 순서상 "먼저 나온 키"를 채택한다. 새로고침/탭 종료로 남은 유령
 *     세션이 앞에 오면 살아있는 내 세션 대신 유령이 화면을 차지하고, 유령은 절대
 *     갱신되지 않으므로 위치가 영원히 고정된다.
 *     (실측: 실제 2명인데 키 6개, 내 살아있는 키는 한 번도 선택되지 않음)
 *  ② presence meta 에 시각 정보가 없어서 어느 세션이 최신인지 구분할 방법이 없다.
 *
 * 해결: index.html 을 건드리지 않고
 *  - myPresence() 에 ts(갱신시각)를 넣고, 현재 활성 탭에서 view 를 직접 읽는다.
 *    (산출물 탭처럼 나중에 주입된 탭도 자동으로 위치에 잡힌다)
 *  - presenceChannel.presenceState() 를 감싸 키당 최신 meta 1개만 남기고,
 *    같은 사람은 ts 가 가장 최신인 세션만 남기며, 오래된 유령은 버린다.
 *    내 세션은 항상 최우선으로 살린다.
 *  그러면 원래의 renderPresence / paintPresenceCells 가 그대로 올바르게 동작한다.
 * =======================================================================*/
(function(){
  'use strict';

  var MAX_AGE = 90000;   // 하트비트가 15초이므로 90초면 확실한 유령

  function myKey(){
    try{ if(typeof CLIENT_ID!=='undefined' && CLIENT_ID) return CLIENT_ID; }catch(e){}
    return null;
  }
  /* 현재 활성 탭 라벨 — index.html 의 switchTab 과 같은 형식 */
  function activeView(){
    var t=document.querySelector('nav.tabs .tab.active');
    return t ? t.textContent.trim() : null;
  }

  /* ── myPresence 에 ts + 실제 활성 탭을 주입 ── */
  function wrapMyPresence(){
    var orig=window.myPresence;
    if(typeof orig!=='function' || orig.__axPres) return false;
    var w=function(){
      var p=orig.apply(this,arguments)||{};
      var v=activeView(); if(v) p.view=v;
      p.ts=Date.now();
      return p;
    };
    w.__axPres=true;
    window.myPresence=w;
    return true;
  }

  /* ── presenceState() 를 정리해서 돌려준다 ── */
  function patchChannel(ch){
    if(!ch || ch.__axPresPatched) return false;
    var orig=ch.presenceState.bind(ch);
    ch.presenceState=function(){
      var raw=orig()||{}, now=Date.now(), me=myKey();
      var last={};
      Object.keys(raw).forEach(function(k){
        var arr=raw[k];
        if(arr && arr.length) last[k]=arr[arr.length-1];   // 키당 최신 meta 1개
      });
      var best={};
      Object.keys(last).forEach(function(k){
        var u=last[k], nm=(u&&u.name)||'?';
        var ts=(u && typeof u.ts==='number')?u.ts:0;
        if(k!==me && ts && (now-ts)>MAX_AGE) return;       // 유령 세션 제거
        var score=(k===me)?Infinity:ts;
        if(!best[nm] || score>best[nm].score) best[nm]={key:k,score:score};
      });
      var out={};
      Object.keys(best).forEach(function(nm){
        var k=best[nm].key; out[k]=[last[k]];
      });
      return out;
    };
    ch.__axPresPatched=true;
    return true;
  }

  function currentPresenceChannel(){
    try{ if(typeof presenceChannel!=='undefined' && presenceChannel) return presenceChannel; }catch(e){}
    try{
      var sb=window.supa||supa;
      return sb.getChannels().filter(function(c){return c.topic==='realtime:ax_presence';})[0]||null;
    }catch(e){}
    return null;
  }

  /* 재연결 때마다 채널 객체가 새로 만들어지므로 계속 지켜본다 */
  var n=0;
  var t=setInterval(function(){
    wrapMyPresence();
    var ch=currentPresenceChannel();
    if(patchChannel(ch)){
      try{ if(typeof window.renderPresence==='function') window.renderPresence(); }catch(e){}
      try{ if(typeof window.updatePresence==='function') window.updatePresence(); }catch(e){}
    }
    if(++n>600) clearInterval(t);   // 20분 후 감시 종료
  },2000);

  wrapMyPresence();
  patchChannel(currentPresenceChannel());

  window.axPresence={ patchChannel:patchChannel, activeView:activeView };
})();
