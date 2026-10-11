'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(script, 'Script principale presente');
const core = script[1].split('// UI CODE')[0];
const context = vm.createContext({console, Math, Set, Int8Array, Error, Object, Array});
vm.runInContext(core, context);
const deck = vm.runInContext('DECK', context);
const evaluate = vm.runInContext('evaluate', context);
const remaining = vm.runInContext('getRemaining', context);
const sampleOnce = vm.runInContext('sampleOnce', context);
const card = (token) => {
  const match = token.match(/^(10|[2-9TJQKA])([hdcs])$/);
  assert.ok(match, token);
  const rank = {T:10,J:11,Q:12,K:13,A:14}[match[1]] || Number(match[1]);
  const suit = {h:0,d:1,c:2,s:3}[match[2]];
  return deck.find(c => c.r === rank && c.s === suit);
};
const hand = (...tokens) => tokens.map(card);
test('Mazzo: 52 carte distinte e 500.000 simulazioni configurate', () => {
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map(c => c.id)).size, 52);
  assert.equal(vm.runInContext('MONTE_CARLO_SAMPLES', context), 500000);
  assert.ok(!/id="example"/.test(html), 'nessun bottone Esempio');
  assert.ok(!/id="iterations"/.test(html), 'nessun selettore campioni');
});
test('Classificazione categorie e precedenze', () => {
  const cases = [
    [0,['As','Kd','9h','6c','3s']],
    [1,['As','Ad','Kh','6c','3s']],
    [2,['As','Ad','Kh','Kc','3s']],
    [3,['As','Ad','Ah','Kc','3s']],
    [4,['Ts','Jd','Qh','Kc','As']],
    [5,['As','Ks','8s','3s','2s']],
    [6,['As','Ad','Ah','Kc','Ks']],
    [7,['As','Ad','Ah','Ac','Ks']],
    [8,['9s','Ts','Js','Qs','Ks']]
  ];
  for (const [category,tokens] of cases) {
    assert.equal(evaluate(hand(...tokens)).category, category, tokens.join(' '));
  }
  assert.ok(evaluate(hand('As','2d','3h','4c','5s')).score <
            evaluate(hand('2s','3d','4h','5c','6s')).score, 'wheel è la scala più bassa');
  assert.ok(evaluate(hand('As','Ad','Ah','Kc','Ks')).score >
            evaluate(hand('Ks','Kd','Kh','Ac','As')).score, 'prevalenza del tris nel full');
});
test('Selezione della migliore mano a 5 su 7', () => {
  const best = evaluate(hand('As','Ks','8s','3s','2s','Qs','9s'));
  assert.ok(best.score > evaluate(hand('As','Ks','8s','3s','2s')).score);
  assert.equal(evaluate(hand('As','Ad','Ah','Ac','Ks','2h','7d')).score,
               evaluate(hand('As','Ad','Ah','Ac','Ks')).score);
});
test('Board di scala reale: split pot anche con otto avversari', () => {
  const hole = hand('2d','3c');
  const board = hand('Ts','Js','Qs','Ks','As');
  const pool = remaining([...hole, ...board]);
  for (let n = 1; n <= 8; n++) {
    const result = sampleOnce(hole, board, pool, n);
    assert.equal(result.result, 'tie');
    assert.equal(result.share, 1/(n+1));
  }
});
test('Scala reale esclusiva non può perdere', () => {
  const hole=hand('As','Ks'), board=hand('Qs','Js','Ts','2c','3d');
  const pool=remaining([...hole,...board]);
  for(let i=0;i<25;i++) assert.equal(sampleOnce(hole,board,pool,1).result,'win');
});
test('Carte non osservate: le duplicate vengono rifiutate', () => {
  assert.throws(() => remaining([card('As'),card('As')]), /più di una volta/);
  assert.equal(remaining(hand('As','Ks')).length, 50);
});
