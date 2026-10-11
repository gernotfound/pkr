'use strict';
// Optional local, REQUIRED in CI: pokersolver 2.1.4 is an independent MIT
// implementation; tests fail in CI if this dependency is missing.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let Hand;
try { ({Hand}=require('pokersolver')); }catch(error){
  if(error.code!=='MODULE_NOT_FOUND')throw error;
  if(process.env.CI)throw new Error('CI requires pokersolver@2.1.4', {cause:error});
}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].split('// UI CODE')[0];
const ctx=vm.createContext({Math,Int8Array,Set,Array,Object,Error});vm.runInContext(js,ctx);
const {deck,evaluate}=vm.runInContext('({deck:DECK,evaluate})',ctx);
const suit=['h','d','c','s'];const token=c=>({14:'A',13:'K',12:'Q',11:'J',10:'T'}[c.r]||String(c.r))+suit[c.s];
let seed=0xa11c0de;
function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296}
function sample(count){const d=[...deck];for(let i=0;i<count;i++){const j=i+Math.floor(random()*(d.length-i));[d[i],d[j]]=[d[j],d[i]]}return d.slice(0,count)}
test('Confronto con goldfire/pokersolver su 2.500 showdown multiway', {skip:!Hand},()=>{
  for(let i=0;i<2500;i++){
    const opponents=1+i%8,selected=sample(7+opponents*2);
    const board=selected.slice(0,5),hands=Array.from({length:opponents+1},(_,j)=>selected.slice(5+j*2,7+j*2));
    const ours=hands.map(h=>evaluate([...h,...board]).score);
    const maximum=Math.max(...ours),oursWinners=ours.map(v=>v===maximum);
    const theirs=hands.map(h=>Hand.solve([...h,...board].map(token)));
    const winners=Hand.winners(theirs),externalWinners=theirs.map(h=>winners.includes(h));
    assert.deepEqual(oursWinners,externalWinners,`Independent mismatch at case ${i}`);
  }
});
