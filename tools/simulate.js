// 仙緣對決｜平衡模擬器
// 讓兩個電腦 AI 互打很多局，統計先手勝率與各角色勝率。
// 用法：node tools/simulate.js [規則版本 v04|v03|bal] [局數]
// 例如：node tools/simulate.js v04 2000

const E = require('../js/engine.js');

const key = process.argv[2] || 'v04';
const N = parseInt(process.argv[3] || '1000', 10);
if (!E.RULESETS[key]) {
  console.log('找不到規則版本：' + key + '（可用：' + Object.keys(E.RULESETS).join('、') + '）');
  process.exit(1);
}
E.applyRules(key);

function play(team0, team1, first) {
  const G = E.newGame(team0, team1, first);
  let guard = 0;
  while (!G.over && guard++ < 400) {
    E.beginTurn(G);
    const plan = E.aiPlan(G, G.cur, 'hard');
    if (plan.card) E.useCard(G, G.cur, plan.card.uid, plan.card.ti);
    if (!G.over && plan.act) E.doAction(G, G.cur, plan.act);
    if (G.over) break;
    E.discardCards(G, G.cur, E.aiDiscardChoice(G, G.cur));
    E.finishTurn(G);
    E.resetLog();
  }
  E.resetLog();
  return G;
}

const ids = E.CHARS.map(c => c.id);
const nameOf = Object.fromEntries(E.CHARS.map(c => [c.id, c.name]));
let firstWins = 0, draws = 0, rounds = 0, finals = 0;
const wins = {}, picks = {};

for (let n = 0; n < N; n++) {
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const t0 = shuffled.slice(0, 3), t1 = shuffled.slice(3, 6), first = n % 2;
  const G = play(t0, t1, first);
  rounds += G.round;
  if (G.finalRound !== null) finals++;
  if (G.over.draw) draws++;
  else {
    if (G.over.winner === first) firstWins++;
    (G.over.winner ? t1 : t0).forEach(id => wins[id] = (wins[id] || 0) + 1);
  }
  [...t0, ...t1].forEach(id => picks[id] = (picks[id] || 0) + 1);
}

const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
console.log(`規則：${E.RULESETS[key].label}｜共 ${N} 局（隨機配隊、困難 AI 互打）`);
console.log(`先手勝率 ${pct(firstWins, N)}｜平手 ${pct(draws, N)}｜平均 ${(rounds / N).toFixed(1)} 輪｜進入決戰 ${pct(finals, N)}`);
console.log('角色勝率（有上場的對局中）：');
ids.map(id => [id, (wins[id] || 0) / picks[id]])
   .sort((a, b) => b[1] - a[1])
   .forEach(([id, r]) => console.log(`  ${nameOf[id].padEnd(5, '　')} ${(r * 100).toFixed(1)}%`));
