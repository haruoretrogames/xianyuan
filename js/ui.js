// 仙緣對決｜畫面與操作
// ===================== LOGIC END =====================

// ===================== UI =====================
const PIMG=k=>`<div class="pimg ci-${k}" role="img" aria-label="${(CDEF[k]||CARDS[k]).name}" data-act="zoom" data-k="${k}"></div>`;
function openZoom(k,extra){
  $('#modal').innerHTML=`<div class="modal" data-act="closeModal"><div class="zoom"><div class="zimg ci-${k}" role="img" aria-label="${(CDEF[k]||CARDS[k]).name}"></div>${extra||''}<div class="zrow" id="zrow"></div></div></div>`;
}
function cardPop(k,who){ const el=$('#cardpop'); el.innerHTML=`<div class="ci ci-${k}"></div><span>${who}使用【${CARDS[k].name}】</span>`; el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),1050); }
const $=s=>document.querySelector(s);
let GEN=0, G=null, UI={mode:'idle'}, busy=false, DIFF='normal', D=null, logOpen=false, menuArm=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function show(id){ document.querySelectorAll('.screen').forEach(el=>el.hidden=el.id!==id); window.scrollTo(0,0); }

document.querySelectorAll('#diffSeg button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#diffSeg button').forEach(x=>x.classList.toggle('on',x===b)); DIFF=b.dataset.d; });
document.querySelectorAll('#verSeg button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#verSeg button').forEach(x=>x.classList.toggle('on',x===b)); RULEKEY=b.dataset.v; applyRules(RULEKEY); });
$('#btnDraft').onclick=startDraft;
$('#btnPresetA').onclick=()=>startGame(PRESET_A,PRESET_B,Math.random()<.5?0:1);
$('#btnPresetB').onclick=()=>startGame(PRESET_B,PRESET_A,Math.random()<.5?0:1);

// ---------- draft ----------
function startDraft(){
  D={order:['A','B','B','A','A','B'],step:0,pA:Math.random()<.5,picks:{A:[],B:[]}};
  show('scrDraft'); renderDraft(); draftNext();
}
const draftWho=l=>((l==='A')===D.pA)?0:1;
function renderDraft(){
  const meL=D.pA?'A':'B';
  $('#draftInfo').textContent=`你是 ${meL}（${meL==='B'?'先手':'後手'}）。依 A→B→B→A→A→B 輪流各選 3 名。點卡牌看大圖再選擇。`;
  $('#draftOrder').innerHTML=D.order.map((l,k)=>`<span class="${draftWho(l)===0?'me':'ai'} ${k===D.step?'cur':''} ${k<D.step?'done':''}">${l}${draftWho(l)===0?'・你':'・電腦'}</span>`).join('');
  const mine=D.picks[meL], theirs=D.picks[meL==='A'?'B':'A'];
  $('#pkMe').textContent=mine.map(id=>CDEF[id].name).join('、')||'—';
  $('#pkAi').textContent=theirs.map(id=>CDEF[id].name).join('、')||'—';
  const myTurn=D.step<6&&draftWho(D.order[D.step])===0;
  $('#draftGrid').className='dgrid im';
  $('#draftGrid').innerHTML=CHARS.map(c=>{
    const tm=mine.includes(c.id), ta=theirs.includes(c.id);
    return `<button class="dcard im ${tm||ta?'taken':''} ${myTurn&&!tm&&!ta?'pickable':''}" data-act="dpreview" data-id="${c.id}">
      <div class="ci ci-${c.id}" role="img" aria-label="${c.name}"></div>
      ${tm?'<span class="who me">我方</span>':ta?'<span class="who ai">電腦</span>':''}</button>`;}).join('');
}
function draftPreview(id){
  const taken=[...D.picks.A,...D.picks.B].includes(id), my=D.step<6&&draftWho(D.order[D.step])===0;
  const c=CDEF[id];
  openZoom(id, R.label==='平衡建議版'?`<p>${R.label}數值：HP ${c.hp}｜${c.skill}：${c.desc}</p>`:'');
  $('#zrow').innerHTML=(my&&!taken?`<button class="mbtn go" data-act="dpick" data-id="${id}">選擇${c.name}</button>`:'')+`<button class="mbtn" data-act="closeModal">${my&&!taken?'再看看':'關閉'}</button>`;
}
function draftPick(id){ D.picks[D.order[D.step]].push(id); D.step++; renderDraft(); draftNext(); }
function draftNext(){
  if(D.step>=6){
    const mine=D.pA?D.picks.A:D.picks.B, theirs=D.pA?D.picks.B:D.picks.A;
    setTimeout(()=>startGame(mine,theirs,D.pA?1:0),900); return;
  }
  if(draftWho(D.order[D.step])===1){
    const l=D.order[D.step];
    setTimeout(()=>{
      const taken=[...D.picks.A,...D.picks.B];
      draftPick(aiDraftPick(CHARS.map(c=>c.id).filter(id=>!taken.includes(id)),D.picks[l]));
    },650);
  }
}

// ---------- game flow ----------
function startGame(mine,theirs,first){
  GEN++; const gen=GEN; LOG=[]; FXQ=[]; UI={mode:'idle'}; busy=true; logOpen=false;
  G=newGame(mine,theirs,first);
  L(`開局（${R.label}）：${first===0?'你':'電腦'}先手。各持 3 張手牌，先手 1 點靈力、後手 ${1+(R.secondSpirit||0)} 點靈力。`,'sys');
  $('#verTag').textContent=R.label;
  show('scrGame');
  beginTurn(G); renderGame();
  banner(`第 1 輪・${G.cur===0?'你的回合':'電腦回合'}`);
  if(G.cur===1) setTimeout(()=>{ if(gen===GEN) aiTurn(); },900); else { busy=false; renderGame(); }
}
function banner(t){ const b=$('#banner'); b.textContent=t; b.classList.add('show'); clearTimeout(b._t); b._t=setTimeout(()=>b.classList.remove('show'),1000); }
async function endTurnFlow(){
  const gen=GEN; if(G.over) return;
  busy=true; UI={mode:'idle'};
  finishTurn(G); renderGame();
  if(G.over) return endGame();
  await sleep(450); if(gen!==GEN) return;
  beginTurn(G); renderGame();
  banner(`第 ${G.round} 輪・${G.cur===0?'你的回合':'電腦回合'}`);
  if(G.cur===1){ await sleep(900); if(gen!==GEN) return; await aiTurn(); }
  else { busy=false; renderGame(); }
}
async function aiTurn(){
  const gen=GEN; if(G.over) return;
  busy=true; renderGame();
  await sleep(500); if(gen!==GEN) return;
  const plan=aiPlan(G,1,DIFF);
  if(plan.card){
    UI={mode:'idle',aiCard:G.players[1].hand.find(h=>h.uid===plan.card.uid).key}; cardPop(UI.aiCard,'電腦');
    useCard(G,1,plan.card.uid,plan.card.ti); renderGame();
    await sleep(1100); if(gen!==GEN) return; UI={mode:'idle'};
    if(G.over) return endGame();
  }
  if(plan.act){
    UI={mode:'idle',acting:plan.act.ai}; renderGame(); await sleep(450); if(gen!==GEN) return;
    doAction(G,1,plan.act); renderGame();
    await sleep(1100); if(gen!==GEN) return; UI={mode:'idle'};
    if(G.over) return endGame();
  }
  const dc=aiDiscardChoice(G,1); if(dc.length) discardCards(G,1,dc);
  await endTurnFlow();
}
function playerCard(uid,ti){
  useCard(G,0,uid,ti); UI={mode:'idle'}; renderGame();
  if(G.over) endGame();
}
function playerAction(act){
  doAction(G,0,act); UI={mode:'idle'}; busy=true; renderGame();
  if(G.over) return endGame();
  if(G.players[0].hand.length>5){ busy=false; UI={mode:'discard',marks:[]}; renderGame(); return; }
  const gen=GEN; setTimeout(()=>{ if(gen===GEN) endTurnFlow(); },700);
}
function endGame(){
  if(!G.over||G.over.abort) return;
  busy=true; UI={mode:'idle'}; renderGame();
  const o=G.over; const cls=o.draw?'draw':o.winner===0?'win':'lose';
  const txt=o.draw?'平手':o.winner===0?'勝利':'敗北';
  const sub=o.draw?'雙方最後角色同時倒下。':o.winner===0?'你擊倒了電腦全部 3 名角色！':'我方 3 名角色全部被擊倒。';
  L(`遊戲結束：${txt}`,'r');
  setTimeout(()=>{
    $('#modal').innerHTML=`<div class="modal"><div class="mbox result"><div class="big ${cls}">${txt}</div><p>${sub}</p><p>共進行 ${G.round} 輪${G.finalRound!==null?'（含決戰階段）':''}</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
      <button class="mbtn go" data-act="again">同隊伍再來一局</button>
      <button class="mbtn" data-act="home">回到選單</button>
      <button class="mbtn" data-act="closeModal">查看戰場</button></div></div></div>`;
  },900);
}

// ---------- rendering ----------
function pips(n){ let h=''; for(let k=0;k<5;k++) h+=`<span class="pip ${k<n?'on':''}"></span>`; return h; }
function isTgt(s,i){ return UI.tg && UI.tg.some(t=>t.s===s&&t.i===i); }
function sideHTML(s){
  const p=G.players[s];
  const head=`<div class="shd"><b>${s===0?'我方':'電腦'}</b><span class="tag">${G.first===s?'先手':'後手'}</span>${p.reviveUsed?'<span class="tag" title="天香續命露已使用">續命露已用</span>':''}${s===1?`<span>手牌 ${p.hand.length}</span>`:''}<span class="sp">靈力 ${p.spirit}/5 ${pips(p.spirit)}</span></div>`;
  const chars=p.chars.map((c,i)=>{
    const d=CDEF[c.id]; const pct=c.hp/c.max*100;
    const cls=[!c.alive&&'dead', s===0&&UI.ai===i&&['charMenu','atkTarget','skillTarget'].includes(UI.mode)&&'sel', isTgt(s,i)&&'tgt', s===G.cur&&UI.acting===i&&'acting'].filter(Boolean).join(' ');
    return `<button class="cbox ${cls}" data-act="char" data-s="${s}" data-i="${i}">
      ${c.shield?'<span class="shield" title="金剛符">符</span>':''}
      <div class="art ci-${c.id}"></div><div class="nm">${c.name}</div>
      <div class="bar"><i class="${pct<=35?'low':''}" style="width:${pct}%"></i></div>
      <div class="hpt">${c.hp}<small> / ${c.max}</small></div>
      <div class="sk">${d.skill}</div></button>`;
  }).join('');
  return head+`<div class="chars">${chars}</div>`;
}
function renderGame(){
  const finalTxt = G.finalRound===null?'' : (G.round>G.finalRound?`<span class="final">決戰中｜每輪結束全體 -10</span>`:`<span class="final">決戰標記｜下一輪起扣血</span>`);
  $('#status').innerHTML=`<span>第 ${G.round} 輪</span><span>牌堆 ${G.deck.length}</span><span>棄牌 ${G.discard}</span><span class="fld">場地：${G.field?CARDS[G.field].name:'無'}</span>${finalTxt}`;
  $('#sideAI').className='side ai'+(G.cur===1&&!G.over?' turn':'');
  $('#sideMe').className='side me'+(G.cur===0&&!G.over?' turn':'');
  $('#sideAI').innerHTML=sideHTML(1);
  $('#sideMe').innerHTML=sideHTML(0);
  $('#prompt').innerHTML=promptHTML();
  // hand
  const h=G.players[0].hand;
  $('#handInfo').textContent=`${h.length} / 5${G.cur===0&&G.cardUsed?'｜本回合已出牌':''}`;
  const canPlay=myTurn()&&!G.cardUsed;
  $('#hand').innerHTML=h.length?h.map(c=>{const d=CARDS[c.key];
    const cls=[ 'c'+d.cat, UI.uid===c.uid&&['cardMenu','cardTarget'].includes(UI.mode)&&'sel', UI.mode==='discard'&&UI.marks.includes(c.uid)&&'mark', !canPlay&&UI.mode!=='discard'&&'dim'].filter(Boolean).join(' ');
    return `<button class="card im ${cls}" data-act="card" data-uid="${c.uid}"><div class="ci ci-${c.key}" role="img" aria-label="${d.name}"></div></button>`;}).join('')
    :'<div class="empty">沒有手牌</div>';
  const ph=panelHTML();
  $('#panel').innerHTML= ph?`<div class="pop" data-act="cancel"><div class="popin" data-act="noop">${ph}</div></div>`:'';
  if(['cardTarget','atkTarget','skillTarget'].includes(UI.mode) && !UI.scrolled){ UI.scrolled=true; const t=document.querySelector('.cbox.tgt'); if(t) t.scrollIntoView({block:'center',behavior:'smooth'}); }
  if(UI.mode==='discard' && !UI.scrolled){ UI.scrolled=true; $('#hand').scrollIntoView({block:'center',behavior:'smooth'}); }
  // log
  const last=LOG[LOG.length-1]; $('#lastLog').textContent=last?last.msg.trim():'';
  const lb=$('#logBox'); lb.hidden=!logOpen; $('#btnLog').textContent=logOpen?'收起紀錄':'戰鬥紀錄';
  lb.innerHTML=LOG.map(l=>`<div class="lg-${l.cls}">${l.msg}</div>`).join(''); lb.scrollTop=lb.scrollHeight;
  $('#btnMenu').textContent=menuArm?'確定離開？':'選單';
  flushFX();
}
function myTurn(){ return G && !G.over && G.cur===0 && !busy && UI.mode!=='discard'; }
function promptHTML(){
  if(G.over) return `<span class="msg">遊戲結束</span><button class="go" data-act="again">再來一局</button>`;
  if(UI.mode==='discard'){ const need=G.players[0].hand.length-5;
    return `<span class="msg">手牌超過 5 張，請點選 <b>${need}</b> 張棄置（已選 ${UI.marks.length}）</span><button class="go" data-act="confirmDiscard" ${UI.marks.length!==need?'disabled style="opacity:.4"':''}>確認棄牌</button>`; }
  if(G.cur===1||busy){
    if(UI.aiCard) return `<span class="msg">電腦使用了【${CARDS[UI.aiCard].name}】</span>`;
    return `<span class="msg">${G.cur===1?'電腦回合…':'結算中…'}</span>`; }
  if(UI.mode==='cardTarget') return `<span class="msg">選擇【${CARDS[cardKey(UI.uid)].name}】的目標（閃爍的${CARDS[cardKey(UI.uid)].t==='allyDead'?'陣亡':''}角色）</span><button data-act="cancel">取消</button>`;
  if(UI.mode==='atkTarget') return `<span class="msg">${G.players[0].chars[UI.ai].name} 普攻：選擇一名敵人</span><button data-act="cancel">取消</button>`;
  if(UI.mode==='skillTarget'){ const d=CDEF[G.players[0].chars[UI.ai].id]; return `<span class="msg">【${d.skill}】選擇${d.t==='ally'?'我方':'一名敵人'}目標</span><button data-act="cancel">取消</button>`; }
  return G.cardUsed ? `<span class="msg">點選我方 1 名角色行動：普攻或技能</span>`
                    : `<span class="msg">可先用 1 張手牌（不花靈力），再點選我方 1 名角色行動</span>`;
}
const cardKey=uid=>G.players[0].hand.find(h=>h.uid===uid)?.key;
function panelHTML(){
  if(UI.mode==='charMenu'){
    const c=G.players[0].chars[UI.ai], d=CDEF[c.id], sp=G.players[0].spirit;
    const atk=20+(G.field==='slp'?10:0);
    return `<div class="panel">${PIMG(c.id)}<h3>${c.name}<small>HP ${c.hp}/${c.max}${c.shield?'｜金剛符':''}</small></h3>
      <p><b>${d.skill}</b>：${d.desc}${G.field==='syt'&&d.t!=='ally'&&c.id!=='le'?'（鎖妖塔 +10）':''}</p>
      ${sp<3?`<div class="note">靈力不足 3 點，目前只能普攻</div>`:''}
      <div class="row"><button data-act="atk"><b>普攻</b><small>單體 ${atk} 傷害・免費</small></button>
      <button class="sk" data-act="skill" ${sp<3?'disabled':''}><b>${d.skill}</b><small>消耗 3 靈力</small></button>
      <button class="cx" data-act="cancel">取消</button></div></div>`;
  }
  if(UI.mode==='cardMenu'){
    const d=CARDS[cardKey(UI.uid)]; const tg=d.t==='none'?null:targets(G,0,d.t);
    const no=tg&&!tg.length;
    return `<div class="panel">${PIMG(cardKey(UI.uid))}<h3>${d.name}<small>${d.cat}</small></h3><p>${d.desc}${d.cat==='補品'&&G.field==='xld'?'（仙靈島 +10）':''}</p>
      ${no?`<div class="note">${d.t==='allyDead'?(G.players[0].reviveUsed?'每局限用 1 張，你已經用過了':'我方沒有陣亡角色'):'沒有可指定的目標'}</div>`:''}
      <div class="row"><button class="sk" data-act="useCard" ${no?'disabled':''}><b>使用</b><small>${d.t==='none'?'立即生效':'接著選擇目標'}</small></button><button class="cx" data-act="cancel">取消</button></div></div>`;
  }
  if(UI.mode==='info'){
    const c=G.players[UI.s].chars[UI.i], d=CDEF[c.id];
    return `<div class="panel">${PIMG(c.id)}<h3>${c.name}<small>${UI.s===0?'我方':'電腦'}｜HP ${c.hp}/${c.max}${c.shield?'｜金剛符':''}${c.alive?'':'｜已擊倒'}</small></h3>
      <p><b>${d.skill}</b>：${d.desc}</p><div class="row"><button class="cx" style="flex:1" data-act="cancel">關閉</button></div></div>`;
  }
  if(UI.mode==='cardInfo'){
    const d=CARDS[cardKey(UI.uid)];
    return `<div class="panel">${PIMG(cardKey(UI.uid))}<h3>${d.name}<small>${d.cat}</small></h3><p>${d.desc}</p><div class="row"><button class="cx" style="flex:1" data-act="cancel">關閉</button></div></div>`;
  }
  return '';
}
function flushFX(){
  const q=FXQ; FXQ=[];
  q.forEach((f,k)=>{
    const el=document.querySelector(`.cbox[data-s="${f.s}"][data-i="${f.i}"]`); if(!el) return;
    setTimeout(()=>{
      const sp=document.createElement('span'); sp.className='float '+f.kind; sp.textContent=f.txt; el.appendChild(sp);
      if(f.kind==='dmg'){ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
      setTimeout(()=>sp.remove(),1300);
    },k*120);
  });
}

// ---------- input ----------
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]'); if(!t) return;
  const act=t.dataset.act;
  if(act!=='menu' && menuArm){ menuArm=false; }
  switch(act){
    case 'rules': openRules(); return;
    case 'closeModal': $('#modal').innerHTML=''; return;
    case 'noop': return;
    case 'zoom': e.stopPropagation(); openZoom(t.dataset.k); $('#zrow').innerHTML='<button class="mbtn" data-act="closeModal">關閉</button>'; return;
    case 'dpreview': if(D) draftPreview(t.dataset.id); return;
    case 'dpick': { $('#modal').innerHTML=''; const id=t.dataset.id; if(D&&D.step<6&&draftWho(D.order[D.step])===0&&![...D.picks.A,...D.picks.B].includes(id)) draftPick(id); return; }
    case 'log': logOpen=!logOpen; renderGame(); return;
    case 'home': $('#modal').innerHTML=''; show('scrStart'); return;
    case 'again': { $('#modal').innerHTML=''; const ids=s=>G.players[s].chars.map(c=>c.id); startGame(ids(0),ids(1),Math.random()<.5?0:1); return; }
    case 'menu': if(menuArm){ menuArm=false; busy=true; GEN++; G.over=G.over||{abort:true}; show('scrStart'); } else { menuArm=true; renderGame(); setTimeout(()=>{ if(menuArm){menuArm=false; if(G) renderGame();} },2500);} return;
  }
  if(!G || G.over) { if(act==='char'&&G) { onChar(+t.dataset.s,+t.dataset.i); renderGame(); } return; }
  if(act==='char') onChar(+t.dataset.s,+t.dataset.i);
  else if(act==='card') onCard(+t.dataset.uid);
  else if(act==='cancel') UI={mode:'idle'};
  else if(act==='atk' && myTurn()) UI={mode:'atkTarget',ai:UI.ai,tg:targets(G,0,'enemy')};
  else if(act==='skill' && myTurn()){
    const d=CDEF[G.players[0].chars[UI.ai].id];
    if(G.players[0].spirit<3) return;
    if(d.t==='none'){ playerAction({type:'skill',ai:UI.ai}); return; }
    UI={mode:'skillTarget',ai:UI.ai,tg:targets(G,0,d.t)};
  }
  else if(act==='useCard' && myTurn()){
    const d=CARDS[cardKey(UI.uid)];
    if(d.t==='none'){ playerCard(UI.uid,null); return; }
    UI={mode:'cardTarget',uid:UI.uid,tg:targets(G,0,d.t)};
  }
  else if(act==='confirmDiscard' && UI.mode==='discard'){
    if(UI.marks.length!==G.players[0].hand.length-5) return;
    discardCards(G,0,UI.marks); UI={mode:'idle'}; busy=true; renderGame(); { const gen=GEN; setTimeout(()=>{ if(gen===GEN) endTurnFlow(); },300); } return;
  }
  renderGame();
});
function onChar(s,i){
  if(['cardTarget','atkTarget','skillTarget'].includes(UI.mode)){
    if(!isTgt(s,i)) return;
    if(UI.mode==='cardTarget') return playerCard(UI.uid,i);
    if(UI.mode==='atkTarget') return playerAction({type:'atk',ai:UI.ai,ti:i});
    return playerAction({type:'skill',ai:UI.ai,ti:i});
  }
  if(UI.mode==='discard') return;
  const c=G.players[s].chars[i];
  if(myTurn() && s===0 && c.alive) UI={mode:'charMenu',ai:i};
  else UI={mode:'info',s,i};
}
function onCard(uid){
  if(UI.mode==='discard'){
    const k=UI.marks.indexOf(uid); const need=G.players[0].hand.length-5;
    if(k>=0) UI.marks.splice(k,1); else if(UI.marks.length<need) UI.marks.push(uid);
    return;
  }
  if(myTurn() && !G.cardUsed) UI={mode:'cardMenu',uid};
  else UI={mode:'cardInfo',uid};
}
function openRules(){
  const cr=CHARS.map(c=>`<tr><td><b>${c.name}</b><br><small>HP ${c.hp}</small></td><td><b>${c.skill}</b><br>${c.desc}</td></tr>`).join('');
  const cd=Object.keys(CARDS).filter(k=>cardCount(k)>0).map(k=>{const c=CARDS[k]; return `<tr><td><b>${c.name}</b><br><small>${c.cat}×${cardCount(k)}</small></td><td>${c.desc}</td></tr>`;}).join('');
  $('#modal').innerHTML=`<div class="modal" data-act="closeModal"><div class="mbox" onclick="event.stopPropagation()">
   <h2>規則速查｜${R.label}</h2>
   ${R.notes?`<h4>${R.label} 改動（相對 V0.3）</h4><ul>${R.notes}</ul>`:''}
   <h4>勝利</h4><ul><li>擊倒對手全部 3 名角色即獲勝；雙方最後角色因同一效果同時倒下為平手。</li></ul>
   <h4>每回合流程</h4><ul>
    <li>① 準備：抽 1 張牌、靈力 +1（牌堆空時只加靈力）。</li>
    <li>② 出牌：最多使用 1 張手牌，不花靈力（也可以不用）。</li>
    <li>③ 行動：選我方 1 名角色，普攻（20 傷害、免費）或技能（3 靈力），二選一。</li>
    <li>④ 結束：手牌超過 5 張要棄到 5 張。</li>
    <li>開局各 3 張手牌；先手 1 點靈力，後手 ${1+(R.secondSpirit||0)} 點靈力。</li></ul>
   <h4>資源</h4><ul>
    <li>靈力全隊共用，上限 5。HP 不超過上限，歸 0 即擊倒；${cardCount('txl')?'只有天香續命露可以復活陣亡角色（每人每局 1 次）':'無復活'}。</li>
    <li>金剛符：下次受到傷害 -20 後移除，每人最多 1 個。劍神無視並移除；酒神自損與決戰扣血不受影響。</li>
    <li>場地全場最多 1 張，新場地取代舊場地。先算場地加成，再算金剛符。</li></ul>
   <h4>決戰階段</h4><ul>
    <li>抽走最後一張牌時放決戰標記，當輪照常打完；從下一輪起，每輪結束雙方全體存活角色同時 -10 HP（不能抵擋）。</li></ul>
   <h4>角色</h4><table>${cr}</table>
   <h4>共用牌堆（30 張）</h4><table>${cd}</table>
   <button class="mbtn go close" data-act="closeModal">關閉</button></div></div>`;
}
