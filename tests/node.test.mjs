import test from 'node:test';
import assert from 'node:assert/strict';
import {createFixture} from '../src/fixture.mjs';

async function withFixture(fn){
  const f=createFixture();
  try{return await fn(f);}finally{f.close();}
}

test('SQLite FTS5 searches a fictional property',()=>withFixture(f=>{
  const result=f.query('Cedar');
  assert.equal(result.status,200);
  assert.equal(result.body.results[0].name,'Hotel Cedar');
}));
test('public projection does not expose internal cost and canary',()=>withFixture(f=>{
  const result=f.query('Hotel');
  assert.equal(result.body.results.length,2);
  const text=JSON.stringify(result.body);
  for(const value of ['PRIVATE_CANARY','private_cost','owner_note','777','888'])
    assert.equal(text.includes(value),false,value);
}));
test('reject SQL and FTS injection strings before querying',()=>withFixture(f=>{
  for(const value of ['', '" OR *','foo; DROP TABLE hotels;','  '])
    assert.equal(f.query(value).status,400,value);
}));
test('unknown hotel returns zero rows',()=>withFixture(f=>{
  assert.deepEqual(f.query('Missing').body.results,[]);
}));
test('oversized query is rejected',()=>withFixture(f=>{
  assert.equal(f.query('X'.repeat(81)).status,400);
}));
