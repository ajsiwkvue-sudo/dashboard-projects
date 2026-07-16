/* =========================================================================
 * growth_cycle.js  —  성장 사이클(동심원) 다이어그램  [콘솔에서 추출한 실제 코드]
 * -------------------------------------------------------------------------
 * 드롭인 방법:
 *   1) 아래 GOALS / CYCLE 데이터를 ilsan-AX 목표 체계에 맞게 값만 교체.
 *   2) 컨테이너 <div id="growthCycle"></div> 를 원하는 뷰에 두고
 *      renderCycle(document.getElementById('growthCycle')) 호출.
 * 외부 의존성: 없음 (순수 SVG). GOALS, CYCLE 두 데이터만 있으면 동작.
 * =======================================================================*/

// --- GOALS ---
const GOALS = {
  G1:{id:"G1",no:"①",name:"AI 통합 거버넌스 구축",color:"var(--g1)",hex:"#3d5a98",cls:"g1",
    slogan:"AI를 도입하는 병원이 아니라, AI가 스스로 성장하는 병원의 기반을 만든다.",
    body:"AI 기술보다 중요한 것은 AI를 지속적으로 활용·확산시키는 운영체계다. 전략·제도·데이터·정책을 하나의 거버넌스로 통합하여, AI가 일회성 프로젝트가 아닌 병원의 새로운 운영체계로 자리잡도록 한다.",
    kw:["AI Governance","AI Policy","AI Standard","AI Investment","AI Ecosystem"],
    handoff:"거버넌스는 전략 방향·표준·KPI·투자 재원을 정의하여 ② 업무 프로세스가 '무엇을, 어떤 기준으로' 구축할지를 결정한다."},
  G2:{id:"G2",no:"②",name:"AI 기반 업무 프로세스 운영",color:"var(--g2)",hex:"#0e8c86",cls:"g2",
    slogan:"모든 업무를 AI가 이해하고, 모든 직원이 AI를 활용하는 병원을 만든다.",
    body:"AI는 특정 솔루션을 쓰는 것이 아니라 업무 프로세스 자체를 바꾸는 기술이다. 원내 AI 인프라·데이터·Agent Platform 위에서 의료진과 직원이 직접 AI를 만들고 활용하는 업무환경을 구축한다.",
    kw:["AI Platform","AI Agent","AI Ready Data","AI Workflow","AI Testbed"],
    handoff:"업무 프로세스는 실증 데이터·성과·검증 결과를 만들어 ③ 문화 조성의 재료(가치창출·과제·역량)를 공급한다."},
  G3:{id:"G3",no:"③",name:"전 직원 AX 문화 조성",color:"var(--g3)",hex:"#c1791d",cls:"g3",
    slogan:"직원이 AI를 배우는 것이 아니라, AI가 직원의 업무를 배우는 병원.",
    body:"AI 전환은 기술이 아니라 문화의 변화다. 모든 직원이 아이디어를 제안하고, 직접 Agent를 만들고, 성과를 공유하는 선순환 구조를 만들어 AI가 조직의 일하는 방식 자체가 되도록 한다.",
    kw:["AI Culture","AI Talent","AI Community","AI Innovation","AI Value Creation"],
    handoff:"문화는 새 과제·성과·인재를 만들어 ① 거버넌스의 전략을 고도화한다 — 여기서 성장 선순환이 닫힌다."}
};

// --- CYCLE (9단계 라벨/색) ---
const CYCLE = [
 ["전략 수립","1-1"],["AI 인프라 구축","2-1"],["AI Ready Data 확보","2-2"],["AI Agent 개발","2-3"],
 ["현장 실증","2-4"],["성과 측정 (KPI)","1-3"],["논문·특허·국책사업","3-3"],["AI 문화 확산","3-2"],
 ["새 AI 과제 발굴","3-1"],["전략 고도화","1-1"]
];

// --- 렌더 함수 ---
function renderCycle(root){
  root.innerHTML=`
   <div class="eyebrow">Narrative · 01 / 전체 연결 구조</div>
   <h2>AI Platform Hospital — Growth Cycle</h2>
   <p class="lede">3대 핵심목표는 독립된 사업이 아니라, 하나의 성장 선순환으로 연결됩니다. 각 과제의 산출물이 다음 단계의 입력이 되어, 병원이 스스로 진화하는 <b>Self-Evolving AI Hospital</b>을 구현합니다. 노드를 클릭하면 해당 과제로 이동합니다.</p>
   <div class="card pad" style="display:grid;place-items:center;background:radial-gradient(120% 120% at 50% 0%,#f4f8fb,#e8eef4)">
     <div id="ring" style="width:100%;display:flex;justify-content:center"></div>
   </div>
   <div class="handoff"><div class="label">왜 순환인가</div>
     <p>전략 수립(1-1)에서 시작해 인프라·데이터·Agent·실증을 거쳐 성과(KPI·논문·특허)를 만들고, 그 성과가 다시 문화 확산과 새 과제 발굴로 이어져 전략을 고도화합니다. 일회성 도입이 아니라 "쓸수록 똑똑해지는" 운영체계라는 점이 일산병원 AX의 핵심 차별점입니다.</p></div>`;
  drawRing(root.querySelector('#ring'));
}
function drawRing(container){
  const ns="http://www.w3.org/2000/svg";
  const S=900,cx=S/2,cy=S/2,R=250,NR=30,LR=R+56;
  const stages=CYCLE.slice(0,9);
  const N=stages.length, step=360/N;
  const ang=i=>(-90+i*step)*Math.PI/180;
  const svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox",`0 0 ${S} ${S}`);svg.setAttribute("width","100%");
  svg.style.maxWidth="450px";
  const defs=document.createElementNS(ns,"defs");
  defs.innerHTML=`<marker id="cyc-ah" markerWidth="10" markerHeight="10" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#0b6e6b"/></marker>`;
  svg.appendChild(defs);
  const base=document.createElementNS(ns,"circle");
  base.setAttribute("cx",cx);base.setAttribute("cy",cy);base.setAttribute("r",R);
  base.setAttribute("fill","none");base.setAttribute("stroke","#cfe0dd");base.setAttribute("stroke-width","2");
  svg.appendChild(base);
  // directional arcs between nodes (clockwise); last arc dashed = loop-back(전략 고도화)
  for(let i=0;i<N;i++){
    const pad=NR/R+0.055;
    const s1=ang(i)+pad, s2=ang((i+1)%N)-pad;
    const x1=cx+R*Math.cos(s1), y1=cy+R*Math.sin(s1);
    const x2=cx+R*Math.cos(s2), y2=cy+R*Math.sin(s2);
    const p=document.createElementNS(ns,"path");
    p.setAttribute("d",`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`);
    p.setAttribute("fill","none");p.setAttribute("stroke","#0b6e6b");
    p.setAttribute("stroke-width","2.5");p.setAttribute("marker-end","url(#cyc-ah)");
    p.setAttribute("opacity",".72");
    if(i===N-1)p.setAttribute("stroke-dasharray","8 6");
    svg.appendChild(p);
  }
  // loop-back glyph on the closing arc
  const mA=(-90+(N-0.5)*step)*Math.PI/180;
  addText(svg,ns,cx+LR*Math.cos(mA),cy+LR*Math.sin(mA)+6,"↻",{size:31,fill:"#0b6e6b",weight:"700"});
  // center
  const c1=document.createElementNS(ns,"circle");
  c1.setAttribute("cx",cx);c1.setAttribute("cy",cy);c1.setAttribute("r",124);c1.setAttribute("fill","#12263a");
  svg.appendChild(c1);
  addText(svg,ns,cx,cy-8,"∞",{size:80,fill:"#15b3a6",weight:"700",mono:true});
  addText(svg,ns,cx,cy+36,"SELF-EVOLVING",{size:22,fill:"#cdd8e2",mono:true,ls:".14em"});
  addText(svg,ns,cx,cy+64,"AI Hospital",{size:18,fill:"#8ea0b2"});
  // nodes + labels
  stages.forEach((c,i)=>{
    const a=ang(i), x=cx+R*Math.cos(a), y=cy+R*Math.sin(a), g=goalOf(c[1]);
    const grp=document.createElementNS(ns,"g");grp.style.cursor="pointer";
    grp.onclick=()=>{openNode(c[1]);};
    const dot=document.createElementNS(ns,"circle");
    dot.setAttribute("cx",x);dot.setAttribute("cy",y);dot.setAttribute("r",NR);
    dot.setAttribute("fill","#fff");dot.setAttribute("stroke",g.hex);dot.setAttribute("stroke-width","5");
    grp.appendChild(dot);
    addText(grp,ns,x,y+10,String(i+1),{size:29,fill:g.hex,weight:"700",mono:true});
    svg.appendChild(grp);
    const ux=Math.cos(a), uy=Math.sin(a);const LRi=LR+(/KPI/.test(c[0])?16:0);const lx=cx+LRi*ux, ly=cy+LRi*uy;
    const anchor=ux>0.25?"start":(ux<-0.25?"end":"middle");
    const lines=wrapLabel(c[0]);
    const lh=29;
    let ty;if(anchor==="middle"&&uy<0){ty=ly-lines.length*lh+1;}else if(anchor==="middle"&&uy>0){ty=ly;}
    else{ty=ly-(lines.length*lh+16)/2+lh-4;}
    lines.forEach(ln=>{addText(svg,ns,lx,ty,ln,{size:25,fill:"#26384a",weight:"650",anchor});ty+=lh;});
    addText(svg,ns,lx,ty-1,c[1],{size:17,fill:g.hex,weight:"700",mono:true,anchor});
  });
  container.appendChild(svg);
}
function addText(parent,ns,x,y,txt,o){o=o||{};
  const t=document.createElementNS(ns,"text");
  t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("text-anchor",o.anchor||"middle");
  t.setAttribute("font-size",o.size||14);t.setAttribute("fill",o.fill||"#26384a");
  if(o.weight)t.setAttribute("font-weight",o.weight);
  if(o.mono)t.setAttribute("font-family","var(--mono)");
  if(o.ls)t.setAttribute("letter-spacing",o.ls);
  t.textContent=txt;parent.appendChild(t);return t;
}
function wrapLabel(s){
  if(s.length<=7)return [s];
  const mid=s.length/2;let best=-1,bd=99;
  for(let i=0;i<s.length;i++){if(s[i]===' '){const d=Math.abs(i-mid);if(d<bd){bd=d;best=i;}}}
  if(best<0){for(let i=1;i<s.length-1;i++){if(s[i]==='·'){const d=Math.abs(i-mid);if(d<bd){bd=d;best=i;}}}}
  if(best<0){return [s.slice(0,Math.round(mid)),s.slice(Math.round(mid))];}
  const skip=(s[best]===' '||s[best]==='·');
  return [s.slice(0,best).trim(), s.slice(best+(skip?1:0)).trim()];
}

/* =========================================================================
   PAGE: GOAL NARRATIVE
   ========================================================================= */
