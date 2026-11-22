// 仙緣對決｜規則引擎與電腦 AI（不含畫面）
// ===================== LOGIC START =====================
const CHARS=[
 {id:'xy',no:'001',name:'李逍遙',hp:120,skill:'萬劍訣',desc:'全體敵人各受到 30 點傷害。',t:'none'},
 {id:'yr',no:'002',name:'林月如',hp:110,skill:'斬龍訣',desc:'一名敵人受到 70 點傷害。',t:'enemy'},
 {id:'le',no:'003',name:'趙靈兒',hp:100,skill:'五氣朝元',desc:'我方全體存活角色各恢復 30 點 HP。',t:'none'},
 {id:'an',no:'004',name:'阿奴',hp:100,skill:'萬蠱蝕天',desc:'一名敵人受到 50 點傷害，敵方失去 1 點靈力。',t:'enemy'},
 {id:'jj',no:'005',name:'酒劍仙',hp:100,skill:'酒神',desc:'一名敵人受到 80 點傷害，自己失去 10 點 HP，不能抵擋。',t:'enemy'},
 {id:'js',no:'006',name:'獨孤劍聖',hp:120,skill:'劍神',desc:'一名敵人受到 60 點傷害，無視並移除其金剛符。',t:'enemy'},
 {id:'tn',no:'007',name:'林天南',hp:130,skill:'龍泉劍法',desc:'一名敵人受到 50 點傷害，自己恢復 20 點 HP。',t:'enemy'},
 {id:'sg',no:'008',name:'聖姑',hp:110,skill:'靈山仙術',desc:'我方一名存活角色恢復 80 點 HP。',t:'ally'},
 {id:'by',no:'009',name:'拜月教主',hp:120,skill:'血魔神功',desc:'一名敵人受到 50 點傷害，自己恢復 10 點 HP。',t:'enemy'},
 {id:'sz',no:'010',name:'石長老',hp:130,skill:'赤血毒焰',desc:'一名敵人受到 40 點傷害，自己獲得金剛符。',t:'enemy'},
];
const CDEF=Object.fromEntries(CHARS.map(c=>[c.id,c]));
// 規則版本：v=主要數值、x=附加數值
const RULESETS={
 v03:{label:'V0.3',c:{xy:{hp:120,v:30},yr:{hp:110,v:70},le:{hp:100,v:30},an:{hp:100,v:50,x:1},jj:{hp:100,v:80,x:10},js:{hp:120,v:60},tn:{hp:130,v:50,x:20},sg:{hp:110,v:80},by:{hp:120,v:50,x:10},sz:{hp:130,v:40}},
      secondSpirit:0,secondCards:0,firstSkipDraw:false},
 bal:{label:'平衡建議版',c:{xy:{hp:110,v:30},yr:{hp:110,v:60},le:{hp:100,v:40,x:1},an:{hp:110,v:50,x:2},jj:{hp:100,v:80,x:10},js:{hp:110,v:60},tn:{hp:120,v:50,x:10},sg:{hp:110,v:80},by:{hp:110,v:50,x:20},sz:{hp:120,v:40}},
      secondSpirit:1,secondCards:0,firstSkipDraw:false,
      notes:'<li>後手起始 2 點靈力（先手 1 點）。</li><li>角色數值調整：逍遙、劍聖、拜月、阿奴 HP 110；林天南、石長老 HP 120；斬龍訣 60；五氣朝元恢復 40 並得 1 靈力；萬蠱蝕天奪 2 靈力；龍泉劍法自癒 10；血魔神功自癒 20。</li><li>牌堆同 V0.3（無天香續命露）。</li>'},
};
RULESETS.v04={label:'V0.4',c:JSON.parse(JSON.stringify(RULESETS.v03.c)),secondSpirit:0,secondCards:0,firstSkipDraw:false,
  deck:{jcy:5,fwm:3,zjy:2,lhz:4,jiu:4,jgf:4,txl:2,slp:2,xld:2,syt:2},
  notes:'<li>新增道具【天香續命露】×2：復活我方一名陣亡角色，HP 設為 30。每位玩家每局限用 1 張，使用後移出遊戲；不受仙靈島加成。</li><li>金創藥 6 → 5 張、蜂王蜜 4 → 3 張。角色數值與開局同 V0.3。</li>'};
let RULEKEY='v04';
const cardCount=k=>(R.deck&&R.deck[k]!=null)?R.deck[k]:CARDS[k].n;
const DESC={
 xy:r=>`全體敵人各受到 ${r.v} 點傷害。`, yr:r=>`一名敵人受到 ${r.v} 點傷害。`,
 le:r=>`我方全體存活角色各恢復 ${r.v} 點 HP。`+(r.x?`我方獲得 ${r.x} 點靈力。`:''),
 an:r=>`一名敵人受到 ${r.v} 點傷害，敵方失去 ${r.x} 點靈力。`, jj:r=>`一名敵人受到 ${r.v} 點傷害，自己失去 ${r.x} 點 HP，不能抵擋。`,
 js:r=>`一名敵人受到 ${r.v} 點傷害，無視並移除其金剛符。`, tn:r=>`一名敵人受到 ${r.v} 點傷害，自己恢復 ${r.x} 點 HP。`,
 sg:r=>`我方一名存活角色恢復 ${r.v} 點 HP。`+(r.x?`並獲得金剛符。`:''), by:r=>`一名敵人受到 ${r.v} 點傷害，自己恢復 ${r.x} 點 HP。`,
 sz:r=>`一名敵人受到 ${r.v} 點傷害，自己獲得金剛符。`,
};
let R=RULESETS.v03;
function applyRules(key){ R=RULESETS[key]; CHARS.forEach(c=>{ c.hp=R.c[c.id].hp; c.desc=DESC[c.id](R.c[c.id]); }); }
applyRules('v04');
const CARDS={
 jcy:{name:'金創藥',cat:'補品',n:6,t:'ally',ef:'我方一人\n恢復 30',desc:'我方一名存活角色恢復 30 點 HP。'},
 fwm:{name:'蜂王蜜',cat:'補品',n:4,t:'ally',ef:'我方一人\n恢復 50',desc:'我方一名存活角色恢復 50 點 HP。'},
 zjy:{name:'紫菁玉蓉膏',cat:'補品',n:2,t:'none',ef:'我方全體\n各恢復 20',desc:'我方全體存活角色各恢復 20 點 HP。'},
 lhz:{name:'雷火珠',cat:'道具',n:4,t:'enemy',ef:'一名敵人\n20 傷害',desc:'對一名敵人造成 20 點傷害。（不受鎖妖塔加成，會被金剛符減免）'},
 jiu:{name:'酒',cat:'道具',n:4,t:'none',ef:'我方\n靈力 +1',desc:'我方獲得 1 點靈力，仍不可超過 5 點。'},
 jgf:{name:'金剛符',cat:'道具',n:4,t:'allyNoShield',ef:'我方一人\n下次受傷 -20',desc:'放在我方一名未持有金剛符的存活角色旁。下次受到傷害減少 20 點，然後棄置。'},
 txl:{name:'天香續命露',cat:'道具',n:0,t:'allyDead',ef:'復活我方一人\nHP 設為 30',desc:'復活我方一名已陣亡角色，HP 設為 30。每位玩家每局限用 1 張，使用後移出遊戲。不受仙靈島加成；復活的角色當回合可以行動。'},
 slp:{name:'十里坡',cat:'場地',n:2,t:'none',ef:'雙方普攻\n傷害 +10',desc:'場地（全場共用）：雙方普攻傷害增加 10 點。'},
 xld:{name:'仙靈島',cat:'場地',n:2,t:'none',ef:'補品卡\n恢復 +10',desc:'場地（全場共用）：使用補品卡時，每名接受恢復的角色多恢復 10 點 HP。不加強恢復技能。'},
 syt:{name:'鎖妖塔',cat:'場地',n:2,t:'none',ef:'雙方技能\n傷害 +10',desc:'場地（全場共用）：雙方技能對敵人造成的傷害增加 10 點，群體攻擊對每名敵人都增加。不加強雷火珠、恢復、自身扣血或決戰扣血。'},
};
const PRESET_A=['xy','yr','le'], PRESET_B=['js','by','sz'];
const SIDE=['我方','電腦'];
// 紀錄中的陣營以 ⟦0⟧／⟦1⟧ 標記，由畫面依觀看者換成「我方／對手」
const SN=s=>'⟦'+s+'⟧';
let SIM=false, LOG=[], FXQ=[];
function L(msg,cls){ if(!SIM) LOG.push({msg,cls:cls||'sys'}); }
function FX(s,i,txt,kind){ if(!SIM) FXQ.push({s,i,txt,kind}); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const clone=o=>JSON.parse(JSON.stringify(o));

function mkChar(id){ const d=CDEF[id]; return {id,name:d.name,max:d.hp,hp:d.hp,shield:false,alive:true}; }
function newGame(ids0,ids1,first){
  let uid=1; const deck=[];
  for(const k in CARDS) for(let n=0;n<cardCount(k);n++) deck.push({uid:uid++,key:k});
  shuffle(deck);
  const G={players:[{chars:ids0.map(mkChar),hand:[],spirit:1,reviveUsed:false,removed:0},{chars:ids1.map(mkChar),hand:[],spirit:1,reviveUsed:false,removed:0}],
    deck,discard:0,field:null,first,cur:first,round:1,finalRound:null,cardUsed:false,over:null,turns:0};
  for(let n=0;n<3;n++){ G.players[first].hand.push(G.deck.pop()); G.players[1-first].hand.push(G.deck.pop()); }
  for(let n=0;n<(R.secondCards||0);n++) G.players[1-first].hand.push(G.deck.pop());
  G.players[1-first].spirit+=R.secondSpirit||0;
  return G;
}
const aliveIdx=(G,s)=>G.players[s].chars.map((c,i)=>c.alive?i:-1).filter(i=>i>=0);
function checkWin(G){
  if(G.over) return;
  const a=aliveIdx(G,0).length, b=aliveIdx(G,1).length;
  if(!a&&!b) G.over={draw:true}; else if(!a) G.over={winner:1}; else if(!b) G.over={winner:0};
}
function damage(G,s,i,amt,pierce){
  const c=G.players[s].chars[i]; if(!c.alive) return 0;
  let d=amt;
  if(c.shield){
    c.shield=false; G.discard++;
    if(pierce){ L(`　劍神無視並移除 ${c.name} 的金剛符`); FX(s,i,'破符','info'); }
    else { d=Math.max(0,d-20); L(`　${c.name} 的金剛符抵擋 20 點傷害`); }
  }
  c.hp=Math.max(0,c.hp-d); FX(s,i,'-'+d,'dmg');
  L(`　${c.name} 受到 ${d} 點傷害（剩 ${c.hp}）`);
  if(c.hp===0){ c.alive=false; L(`　★ ${SN(s)} ${c.name} 被擊倒！`,'sys'); }
  return d;
}
function loseHp(G,s,i,amt,quiet){
  const c=G.players[s].chars[i]; if(!c.alive) return;
  c.hp=Math.max(0,c.hp-amt); FX(s,i,'-'+amt,'dmg');
  if(!quiet) L(`　${c.name} 失去 ${amt} 點 HP（剩 ${c.hp}）`);
  if(c.hp===0){ c.alive=false; if(c.shield){c.shield=false;G.discard++;} L(`　★ ${SN(s)} ${c.name} 被擊倒！`,'sys'); }
}
function heal(G,s,i,amt){
  const c=G.players[s].chars[i]; if(!c.alive) return;
  const b=c.hp; c.hp=Math.min(c.max,c.hp+amt); const d=c.hp-b;
  FX(s,i,'+'+d,'heal'); L(`　${c.name} 恢復 ${d} 點 HP（${c.hp}/${c.max}）`);
}
function targets(G,s,type){
  if(type==='enemy') return aliveIdx(G,1-s).map(i=>({s:1-s,i}));
  if(type==='ally') return aliveIdx(G,s).map(i=>({s,i}));
  if(type==='allyDead') return G.players[s].reviveUsed?[]:G.players[s].chars.map((c,i)=>c.alive?-1:i).filter(i=>i>=0).map(i=>({s,i}));
  if(type==='allyNoShield') return aliveIdx(G,s).filter(i=>!G.players[s].chars[i].shield).map(i=>({s,i}));
  return [];
}
function beginTurn(G){
  const p=G.players[G.cur]; G.cardUsed=false; G.turns++;
  L(`第 ${G.round} 輪｜${SN(G.cur)}回合`,'r');
  if(R.firstSkipDraw && G.turns===1){ L(`先手第一回合不抽牌`,'p'+G.cur); }
  else if(G.deck.length){
    p.hand.push(G.deck.pop());
    L(`${SN(G.cur)}抽 1 張牌（牌堆剩 ${G.deck.length}）`,'p'+G.cur);
    if(G.deck.length===0 && G.finalRound===null){ G.finalRound=G.round; L(`抽走最後一張牌，放置決戰標記！本輪打完後，從下一輪起每輪結束雙方全體 -10 HP`,'sys'); }
  } else L(`牌堆已空，略過抽牌`,'p'+G.cur);
  p.spirit=Math.min(5,p.spirit+1);
}
function useCard(G,s,uid,ti){
  const p=G.players[s]; const k=p.hand.findIndex(h=>h.uid===uid); if(k<0) return;
  const card=p.hand.splice(k,1)[0], def=CARDS[card.key];
  G.cardUsed=true;
  const tgtName = (ti!=null && def.t!=='none') ? ' → '+(def.t==='enemy'?G.players[1-s]:p).chars[ti].name : '';
  L(`${SN(s)}使用【${def.name}】${tgtName}`,'p'+s);
  const bonus=G.field==='xld'?10:0;
  switch(card.key){
    case 'jcy': heal(G,s,ti,30+bonus); break;
    case 'fwm': heal(G,s,ti,50+bonus); break;
    case 'zjy': aliveIdx(G,s).forEach(i=>heal(G,s,i,20+bonus)); break;
    case 'lhz': damage(G,1-s,ti,20); break;
    case 'jiu': { const b=p.spirit; p.spirit=Math.min(5,p.spirit+1); L(`　靈力 ${b} → ${p.spirit}`); break; }
    case 'jgf': p.chars[ti].shield=true; FX(s,ti,'金剛符','info'); L(`　${p.chars[ti].name} 獲得金剛符`); break;
    case 'txl': { const c=p.chars[ti]; c.alive=true; c.hp=30; c.shield=false; p.reviveUsed=true; p.removed++;
      FX(s,ti,'復活 30','heal'); L(`　★ ${c.name} 復活！HP 設為 30。天香續命露移出遊戲`,'sys'); break; }
    case 'slp': case 'xld': case 'syt':
      if(G.field){ G.discard++; L(`　舊場地【${CARDS[G.field].name}】棄置`); }
      G.field=card.key; L(`　場地變為【${def.name}】`); break;
  }
  if(!['slp','xld','syt','jgf','txl'].includes(card.key)) G.discard++;
  checkWin(G);
}
function doAction(G,s,act){
  const me=G.players[s], c=me.chars[act.ai];
  if(act.type==='atk'){
    const dmg=20+(G.field==='slp'?10:0);
    L(`${SN(s)}${c.name} 普攻 → ${G.players[1-s].chars[act.ti].name}`,'p'+s);
    damage(G,1-s,act.ti,dmg);
  } else {
    me.spirit-=3; const d=CDEF[c.id]; const op=G.players[1-s];
    const sk=b=>b+(G.field==='syt'?10:0);
    const tn = d.t==='enemy'? ' → '+op.chars[act.ti].name : d.t==='ally'? ' → '+me.chars[act.ti].name : '';
    L(`${SN(s)}${c.name} 施放【${d.skill}】${tn}（靈力 -3）`,'p'+s);
    const r=R.c[c.id];
    switch(c.id){
      case 'xy': aliveIdx(G,1-s).forEach(i=>damage(G,1-s,i,sk(r.v))); break;
      case 'yr': damage(G,1-s,act.ti,sk(r.v)); break;
      case 'le': aliveIdx(G,s).forEach(i=>heal(G,s,i,r.v)); if(r.x){ me.spirit=Math.min(5,me.spirit+r.x); L(`　${SN(s)}獲得 ${r.x} 點靈力（${me.spirit}）`);} break;
      case 'an': { damage(G,1-s,act.ti,sk(r.v)); const l=Math.min(op.spirit,r.x); if(l>0){op.spirit-=l; FX(1-s,act.ti,'靈力-'+l,'sp'); L(`　${SN(1-s)}失去 ${l} 點靈力（剩 ${op.spirit}）`);} break; }
      case 'jj': damage(G,1-s,act.ti,sk(r.v)); loseHp(G,s,act.ai,r.x); break;
      case 'js': damage(G,1-s,act.ti,sk(r.v),true); break;
      case 'tn': damage(G,1-s,act.ti,sk(r.v)); heal(G,s,act.ai,r.x); break;
      case 'sg': heal(G,s,act.ti,r.v); if(r.x){ const t=me.chars[act.ti]; if(t.alive&&!t.shield){t.shield=true; FX(s,act.ti,'金剛符','info'); L(`　${t.name} 獲得金剛符`);} } break;
      case 'by': damage(G,1-s,act.ti,sk(r.v)); heal(G,s,act.ai,r.x); break;
      case 'sz': damage(G,1-s,act.ti,sk(r.v)); if(c.alive&&!c.shield){c.shield=true; FX(s,act.ai,'金剛符','info'); L(`　${c.name} 獲得金剛符`);} break;
    }
  }
  checkWin(G);
}
function discardCards(G,s,uids){
  const p=G.players[s];
  uids.forEach(u=>{ const k=p.hand.findIndex(h=>h.uid===u); if(k>=0){ L(`${SN(s)}棄置【${CARDS[p.hand[k].key].name}】`,'p'+s); p.hand.splice(k,1); G.discard++; } });
}
function finishTurn(G){
  if(G.cur!==G.first){
    if(G.finalRound!==null && G.round>G.finalRound){
      L(`決戰扣血：雙方全體存活角色同時失去 10 HP`,'sys');
      [0,1].forEach(s=>aliveIdx(G,s).forEach(i=>loseHp(G,s,i,10)));
      checkWin(G);
    }
    G.round++;
  }
  G.cur=1-G.cur;
}

// ---------- AI ----------
const THREAT={xy:26,yr:20,le:22,an:14,jj:18,js:17,tn:11,sg:18,by:11,sz:12};
const KEEP={txl:10,jgf:9,fwm:8,lhz:7,jiu:7,jcy:6,zjy:6,syt:3,xld:2,slp:1};
function evaluate(G,me){
  if(G.over){ if(G.over.draw) return -50000; return G.over.winner===me?1e6:-1e6; }
  const sideVal=s=>{
    const p=G.players[s]; let v=0;
    p.chars.forEach(c=>{ if(c.alive) v+=c.hp+9*Math.sqrt(c.hp)+75+THREAT[c.id]+(c.shield?17:0); });
    v+=p.spirit*11;
    return v;
  };
  let sc=sideVal(me)-1.05*sideVal(1-me);
  const p=G.players[me];
  p.hand.forEach(h=>sc+=(h.key==='txl'&&p.reviveUsed)?0:6+KEEP[h.key]*.6);
  const dmgSk=s=>G.players[s].chars.filter(c=>c.alive&&!['le','sg'].includes(c.id)).length;
  if(G.field==='syt') sc+=7*(dmgSk(me)-dmgSk(1-me));
  if(G.field==='xld') sc+=3*p.hand.filter(h=>CARDS[h.key].cat==='補品').length;
  return sc;
}
function actionOptions(G,s){
  const out=[], p=G.players[s];
  aliveIdx(G,s).forEach(ai=>{
    targets(G,s,'enemy').forEach(t=>out.push({type:'atk',ai,ti:t.i}));
    if(p.spirit>=3){
      const d=CDEF[p.chars[ai].id];
      if(d.t==='none') out.push({type:'skill',ai});
      else targets(G,s,d.t).forEach(t=>out.push({type:'skill',ai,ti:t.i}));
    }
  });
  return out;
}
function aiPlan(G,s,diff){
  const noise={easy:70,normal:14,hard:0}[diff||'normal'];
  const p=G.players[s]; const cardOpts=[null]; const seen=new Set();
  p.hand.forEach(h=>{ if(seen.has(h.key)) return; seen.add(h.key); const t=CARDS[h.key].t;
    if(t==='none') cardOpts.push({uid:h.uid,ti:null}); else targets(G,s,t).forEach(x=>cardOpts.push({uid:h.uid,ti:x.i})); });
  let best=null, bestSc=-Infinity;
  SIM=true;
  try{
    for(const co of cardOpts){
      const g1=clone(G); if(co) useCard(g1,s,co.uid,co.ti);
      if(g1.over){ const sc=evaluate(g1,s); if(sc>bestSc){bestSc=sc;best={card:co,act:null};} continue; }
      for(const a of actionOptions(g1,s)){
        const g2=clone(g1); doAction(g2,s,a);
        const sc=evaluate(g2,s)+(Math.random()*2-1)*noise;
        if(sc>bestSc){bestSc=sc;best={card:co,act:a};}
      }
    }
  } finally { SIM=false; }
  return best;
}
function aiDiscardChoice(G,s){
  const p=G.players[s]; const need=p.hand.length-5; if(need<=0) return [];
  const kv=h=>(h.key==='txl'&&p.reviveUsed)?-1:KEEP[h.key];
  return [...p.hand].sort((a,b)=>kv(a)-kv(b)).slice(0,need).map(h=>h.uid);
}
function aiDraftPick(avail,mine){
  const R={xy:9,yr:8.2,le:8,jj:7.4,js:7.3,an:7,sg:7.4,tn:6.8,by:6.6,sz:7};
  const hasHeal=mine.some(id=>id==='le'||id==='sg');
  let best=null,bs=-1;
  avail.forEach(id=>{ let v=R[id]+Math.random()*2; if(hasHeal&&(id==='le'||id==='sg')) v-=2.5; if(!hasHeal&&mine.length===2&&(id==='le'||id==='sg')) v+=1.5; if(v>bs){bs=v;best=id;} });
  return best;
}

// Node.js（模擬器）使用
if (typeof module !== 'undefined') module.exports = {CHARS,CARDS,RULESETS,PRESET_A,PRESET_B,applyRules,newGame,beginTurn,useCard,doAction,discardCards,finishTurn,aiPlan,aiDiscardChoice,resetLog:()=>{LOG=[];FXQ=[];}};
