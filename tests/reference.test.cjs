'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const context=vm.createContext({console,Math,Int8Array,Array,Set,Error,Object});
vm.runInContext(script.split('// UI CODE')[0],context);
const {deck,evaluate,remaining,enumerate,steps,riverTwo}=vm.runInContext('({deck:DECK,evaluate,remaining:getRemaining,enumerate:enumerateHeadsUp,steps:enumerateHeadsUpSteps,riverTwo:enumerateRiverTwoOpponents})',context);
const card=s=>{const m=/^(10|[2-9TJQKA])([hdcs])$/.exec(s);assert.ok(m,s);const rank=({T:10,J:11,Q:12,K:13,A:14})[m[1]]||+m[1];const suit=({h:0,d:1,c:2,s:3})[m[2]];return deck.find(c=>c.r===rank&&c.s===suit)};
const hand=(...t)=>t.map(card);
// Independent oracle: evaluate exactly five cards using multiplicities, then
// enumerate all C(7,5)=21 candidate hands. Does not call application ranking helpers.
function rankFive(cards){
  const ranks=cards.map(c=>c.r).sort((a,b)=>b-a);
  const counts=new Map();for(const r of ranks) counts.set(r,(counts.get(r)||0)+1);
  const groups=[...counts].map(([r,n])=>({r,n})).sort((a,b)=>b.n-a.n||b.r-a.r);
  const unique=[...counts.keys()];
  const flush=cards.every(c=>c.s===cards[0].s);
  let straight=0;
  for(let h=14;h>=5;h--){const seq=h===5?[5,4,3,2,14]:[h,h-1,h-2,h-3,h-4];if(seq.every(r=>unique.includes(r))){straight=h;break}}
  let kind=0,v=ranks;
  if(straight&&flush){kind=8;v=[straight]}
  else if(groups[0].n===4){kind=7;v=[groups[0].r,groups[1].r]}
  else if(groups[0].n===3&&groups[1].n===2){kind=6;v=[groups[0].r,groups[1].r]}
  else if(flush){kind=5;v=ranks}
  else if(straight){kind=4;v=[straight]}
  else if(groups[0].n===3){kind=3;v=[groups[0].r,...groups.slice(1).map(x=>x.r).sort((a,b)=>b-a)]}
  else if(groups[0].n===2&&groups[1].n===2){kind=2;v=[Math.max(groups[0].r,groups[1].r),Math.min(groups[0].r,groups[1].r),groups[2].r]}
  else if(groups[0].n===2){kind=1;v=[groups[0].r,...groups.slice(1).map(x=>x.r).sort((a,b)=>b-a)]}
  return v.concat(Array(5-v.length).fill(0)).reduce((n,r)=>n*15+r,kind);
}
function rankOracle(cs){
  assert.ok(cs.length>=5 && cs.length<=7);
  let best=-1;
  for(let a=0;a<cs.length-4;a++)for(let b=a+1;b<cs.length-3;b++)for(let c=b+1;c<cs.length-2;c++)for(let d=c+1;d<cs.length-1;d++)for(let e=d+1;e<cs.length;e++)
    best=Math.max(best,rankFive([cs[a],cs[b],cs[c],cs[d],cs[e]]));
  return best;
}
function rng(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function distinctRandomCards(amount,random){const pool=[...deck];for(let i=0;i<amount;i++){const j=i+Math.floor(random()*(pool.length-i));[pool[i],pool[j]]=[pool[j],pool[i]]}return pool.slice(0,amount)}
function referenceRiver(hole,board,knownDead=[]){
  assert.equal(board.length,5);
  const pool=remaining([...hole,...board,...knownDead]);
  const hero=rankOracle([...hole,...board]);
  let total=0,wins=0,ties=0,losses=0,share=0;
  for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
    const other=rankOracle([pool[i],pool[j],...board]);
    if(hero>other){wins++;share++}else if(hero===other){ties++;share+=0.5}else losses++;
    total++;
  }
  return {total,wins,ties,losses,share};
}

test('Valutatore indipendente a 5 carte: 10.000 combinazioni casuali di 7 carte',()=>{
  const random=rng(0xC0FFEE);
  for(let i=0;i<10000;i++){
    const cs=distinctRandomCards(7,random);
    assert.equal(evaluate(cs).score,rankOracle(cs),`Divergenza caso ${i}: ${cs.map(c=>c.id)}`);
  }
});
test('Enumerazione river: confronto esatto indipendente con carte escluse',()=>{
  const scenarios=[
    {h:hand('As','Kd'),b:hand('2c','3h','4s','5d','9c'),dead:[]},
    {h:hand('2d','3c'),b:hand('Ts','Js','Qs','Ks','As'),dead:hand('6c','7c')},
    {h:hand('Ah','Kh'),b:hand('Qh','Jh','Th','2c','3d'),dead:hand('4h','5h')}
  ];
  for(const {h,b,dead} of scenarios){
    const expected=referenceRiver(h,b,dead);
    const actual=enumerate(h,b,remaining([...h,...b,...dead]));
    for(const field of ['total','wins','ties','losses','share'])assert.equal(actual[field],expected[field],field);
    assert.equal(actual.categories.reduce((a,b)=>a+b,0),actual.total);
    assert.equal(actual.wins+actual.ties+actual.losses,actual.total);
  }
});
test('Turn: exact 46 × C(45,2) outcomes, and equal-weight independent river decomposition',()=>{
  const hole=hand('As','Kd'), board=hand('2c','3d','4s','5h');
  const pool=remaining([...hole,...board]);
  const actual=enumerate(hole,board,pool);
  assert.equal(actual.total,46*45*44/2);
  assert.equal(actual.categories.reduce((a,b)=>a+b,0),actual.total);
  assert.equal(actual.wins+actual.ties+actual.losses,actual.total);
  // Independent river oracle for each of the 46 possible final board cards.
  let total=0,wins=0,ties=0,losses=0,share=0;
  for(const river of pool){
    const perRiver=referenceRiver(hole,[...board,river]);
    total+=perRiver.total;wins+=perRiver.wins;ties+=perRiver.ties;losses+=perRiver.losses;share+=perRiver.share;
  }
  for(const k of ['total','wins','ties','losses','share'])assert.equal(actual[k],({total,wins,ties,losses,share})[k],k);
});
test('Termini generali: carta sul board uguale per tutti comporta split esatti',()=>{
  const hole=hand('2d','3c'),board=hand('Ts','Js','Qs','Ks','As');
  const e=enumerate(hole,board,remaining([...hole,...board]));
  assert.equal(e.wins,0);assert.equal(e.losses,0);assert.equal(e.ties,e.total);assert.equal(e.share/e.total,0.5);
});

function referenceRiverTwoOpponents(hole,board,dead=[]){
  const pool=remaining([...hole,...board,...dead]);
  const hero=rankOracle([...hole,...board]);
  const hands=[];
  for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++)
    hands.push({i,j,rank:rankOracle([pool[i],pool[j],...board])});
  let total=0,wins=0,ties=0,losses=0,share=0,shareSquares=0;
  for(let i=0;i<hands.length;i++)for(let j=i+1;j<hands.length;j++){
    const a=hands[i],b=hands[j];
    if(a.i===b.i||a.i===b.j||a.j===b.i||a.j===b.j)continue;
    const q=a.rank>hero||b.rank>hero?0:1/(1+Number(a.rank===hero)+Number(b.rank===hero));
    if(q===1)wins++;else if(q===0)losses++;else ties++;
    share+=q;shareSquares+=q*q;total++;
  }
  return {total,wins,ties,losses,share,shareSquares};
}
function referenceFlop(hole,board,dead=[]){
  const pool=remaining([...hole,...board,...dead]);
  let total=0,wins=0,ties=0,losses=0,share=0,shareSquares=0;
  const cat=Array(9).fill(0);
  for(let r=0;r<pool.length;r++)for(let t=r+1;t<pool.length;t++){
    const fullBoard=[...board,pool[r],pool[t]], hero=rankOracle([...hole,...fullBoard]);
    cat[Math.floor(hero/15**5)] += (pool.length-2)*(pool.length-3)/2;
    for(let i=0;i<pool.length;i++){
      if(i===r||i===t)continue;
      for(let j=i+1;j<pool.length;j++){
        if(j===r||j===t)continue;
        const rank=rankOracle([pool[i],pool[j],...fullBoard]);
        const q=hero>rank?1:hero===rank?0.5:0;
        if(q===1)wins++;else if(q===0.5)ties++;else losses++;
        share+=q;shareSquares+=q*q;total++;
      }
    }
  }
  return {total,wins,ties,losses,share,shareSquares,categories:cat};
}
test('River contro due avversari: enumerazione indipendente con split 2 e 3 giocatori',()=>{
  const cases=[
    {hole:hand('As','Kd'),board:hand('2c','3d','4s','5h','9c'),dead:[]},
    {hole:hand('2d','3c'),board:hand('Ts','Js','Qs','Ks','As'),dead:hand('4h','5d')},
    {hole:hand('Ah','Kh'),board:hand('Qh','Jh','Th','2c','3d'),dead:hand('4s','5s')}
  ];
  for(const {hole,board,dead} of cases){
    const actual=riverTwo(hole,board,remaining([...hole,...board,...dead]));
    const expected=referenceRiverTwoOpponents(hole,board,dead);
    for(const key of ['total','wins','ties','losses','share','shareSquares'])assert.equal(actual[key],expected[key],key);
    assert.equal(actual.categories.reduce((a,b)=>a+b,0),actual.total);
    assert.equal(actual.wins+actual.ties+actual.losses,actual.total);
  }
});
test('River a due avversari: 446.985 configurazioni equiprobabili, contro 1.000.000 Monte Carlo non esatte',()=>{
  const hole=hand('As','Kd'),board=hand('2c','3d','4s','5h','9c');
  const r=riverTwo(hole,board,remaining([...hole,...board]));
  const n=45;
  assert.equal(r.total,(n*(n-1)/2)*((n-2)*(n-3)/2)/2);
  assert.ok(r.share/r.total>=0&&r.share/r.total<=1);
});
test('Flop: enumerazione indipendente con carte escluse e somma combinatoria completa',()=>{
  const hole=hand('As','Kd'),board=hand('2c','3d','4s');
  const dead=deck.filter(c=>![...hole,...board].some(k=>k.id===c.id)).slice(0,24);
  const pool=remaining([...hole,...board,...dead]);
  const actual=enumerate(hole,board,pool);
  const expected=referenceFlop(hole,board,dead);
  for(const key of ['total','wins','ties','losses','share','shareSquares'])assert.equal(actual[key],expected[key],key);
  assert.equal(actual.categories.join(','),expected.categories.join(','));
  const all=remaining([...hole,...board]);
  const complete=enumerate(hole,board,all);
  assert.equal(complete.total,47*46/2*45*44/2);
  assert.equal(complete.wins+complete.ties+complete.losses,complete.total);
  assert.equal(complete.categories.reduce((a,b)=>a+b,0),complete.total);
});
test('Flop: iteratore fornisce progressione coerente e non salta nessun esito',()=>{
  const hole=hand('As','Kd'),board=hand('2c','3d','4s'),dead=remaining([...hand('As','Kd'),...hand('2c','3d','4s')]).slice(0,20);
  const pool=remaining([...hole,...board,...dead]);
  let prev=0,last=null,stepsCount=0;
  for(const partial of steps(hole,board,pool)){
    assert.equal(partial.total-prev,(pool.length-2)*(pool.length-3)/2);
    prev=partial.total;last=partial;stepsCount++;
  }
  assert.equal(stepsCount,pool.length*(pool.length-1)/2);
  assert.equal(last.total,prev);
});
test('Monte Carlo con generatore deterministico converge all\'equity esatta al river',()=>{
  const h=hand('As','Kd'),b=hand('2c','3h','4s','5d','9c');
  const pool=remaining([...h,...b]);
  const expected=referenceRiver(h,b);
  const sample=vm.runInContext('sampleOnce',context);
  const random=rng(0xABADBABE);
  const n=30000;
  let wins=0,ties=0,losses=0,share=0;
  for(let i=0;i<n;i++){
    const result=sample(h,b,pool,1,random);
    if(result.result==='win')wins++;else if(result.result==='tie')ties++;else losses++;
    share+=result.share;
  }
  assert.equal(wins+ties+losses,n);
  assert.ok(Math.abs(wins/n-expected.wins/expected.total)<0.02);
  assert.ok(Math.abs(share/n-expected.share/expected.total)<0.02);
});
