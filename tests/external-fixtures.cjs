'use strict';
// Deterministic showdowns exported to a separate evaluator. This generator is
// deliberately independent of the reference evaluator's ranking algorithm.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].split('// UI CODE')[0];
const ctx=vm.createContext({Math,Int8Array,Set,Array,Object,Error});vm.runInContext(js,ctx);
const {deck,evaluate}=vm.runInContext('({deck:DECK,evaluate})',ctx);
const suit=['h','d','c','s'];
const token=c=>({14:'A',13:'K',12:'Q',11:'J',10:'T'}[c.r]||String(c.r))+suit[c.s];
let seed=0x514c0de;
function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296}
function sample(count){const d=[...deck];for(let i=0;i<count;i++){const j=i+Math.floor(random()*(d.length-i));[d[i],d[j]]=[d[j],d[i]]}return d.slice(0,count)}
const cases=[];
for(let i=0;i<2500;i++){
  const opponents=1+i%8;
  const d=sample(7+2*opponents);
  const board=d.slice(0,5),hands=Array.from({length:1+opponents},(_,j)=>d.slice(5+j*2,7+j*2));
  const scores=hands.map(h=>evaluate([...h,...board]).score);
  const max=Math.max(...scores);
  const winners=scores.map(x=>x===max);
  cases.push({board:board.map(token),hands:hands.map(h=>h.map(token)),winners});
}
// Cases exercising complete-board split pots, full houses, straight flushes.
function caseOf(b,hands){const used=[...b,...hands.flat()];if(new Set(used).size!==used.length)throw Error('Invalid explicit showdown');
  const get=s=>deck.find(c=>token(c)===s);
  const scores=hands.map(h=>evaluate([...h.map(get),...b.map(get)]).score);const best=Math.max(...scores);
  cases.push({board:b,hands,winners:scores.map(v=>v===best)});
}
caseOf(['Ts','Js','Qs','Ks','As'],[['2d','3d'],['4c','5c'],['6h','7h'],['8c','9c']]);
caseOf(['Ah','Ad','Kh','Kd','2c'],[['As','Ac'],['Kc','Ks'],['Qh','Qd']]);
caseOf(['2c','3d','4h','5s','9h'],[['As','Kd'],['Ac','Qd'],['6s','7s']]);
process.stdout.write(JSON.stringify({source:'pkr main index.html',seed:'0x514c0de',cases}));
