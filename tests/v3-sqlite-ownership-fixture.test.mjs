// Standalone, fictional SQLite authorization-pattern test. Not Antadi source/schema.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';

function sandbox(){
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE toy_records (
    id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    title TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    private_note TEXT NOT NULL
  )`);
  const insert=db.prepare('INSERT INTO toy_records(id,owner,title,private_note) VALUES (?,?,?,?)');
  insert.run('fictional-a','fictional-user-a','Cedar draft','PRIVATE_CANARY_ALPHA');
  insert.run('fictional-b','fictional-user-b','Meadow draft','PRIVATE_CANARY_BETA');
  insert.run('fictional-c','fictional-user-a','Willow draft','PRIVATE_CANARY_GAMMA');
  const principal=(p)=>{
    if(p?.role==='ADMIN')return {role:'ADMIN'};
    if(p?.role==='EMPLOYEE'&&typeof p.id==='string'&&/^fictional-user-[a-z]$/.test(p.id))
      return {role:'EMPLOYEE',id:p.id};
    return null;
  };
  const list=p=>{
    const authority=principal(p);
    if(!authority)return [];
    if(authority.role==='ADMIN')return db.prepare('SELECT id,title,revision FROM toy_records ORDER BY id').all();
    return db.prepare('SELECT id,title,revision FROM toy_records WHERE owner=? ORDER BY id').all(authority.id);
  };
  const update=(p,id,expectedRevision,title)=>{
    const authority=principal(p);
    if(!authority||typeof id!=='string'||!Number.isSafeInteger(expectedRevision)||expectedRevision<1||typeof title!=='string')return false;
    const q=authority.role==='ADMIN'
      ?db.prepare('UPDATE toy_records SET title=?,revision=revision+1 WHERE id=? AND revision=?')
      :db.prepare('UPDATE toy_records SET title=?,revision=revision+1 WHERE id=? AND revision=? AND owner=?');
    const args=authority.role==='ADMIN'?[title,id,expectedRevision]:[title,id,expectedRevision,authority.id];
    return q.run(...args).changes===1;
  };
  return {db,list,update,close:()=>db.close()};
}
const alice={role:'EMPLOYEE',id:'fictional-user-a'};
const bob={role:'EMPLOYEE',id:'fictional-user-b'};
const admin={role:'ADMIN'};
const withDb=async callback=>{const s=sandbox();try{await callback(s);}finally{s.close();}};

test('SQLite deny-by-default for missing, unknown and malformed principal',()=>withDb(s=>{
  for(const p of [null,{}, {role:'GUEST'}, {role:'EMPLOYEE'}, {role:'EMPLOYEE',id:''}, {role:'ADMINISTRATOR'}]) {
    assert.deepEqual(s.list(p),[]);
    assert.equal(s.update(p,'fictional-a',1,'attempt'),false);
  }
}));

test('SQLite scoped lists give each fictional employee only their own projected records',()=>withDb(s=>{
  assert.deepEqual(s.list(alice).map(x=>x.id),['fictional-a','fictional-c']);
  assert.deepEqual(s.list(bob).map(x=>x.id),['fictional-b']);
  assert.deepEqual(s.list(admin).map(x=>x.id),['fictional-a','fictional-b','fictional-c']);
  for(const p of [admin,alice,bob])assert.doesNotMatch(JSON.stringify(s.list(p)),/PRIVATE_CANARY|private_note|owner/);
}));

test('SQLite update enforces row ownership even when record ID is known',()=>withDb(s=>{
  assert.equal(s.update(bob,'fictional-a',1,'illicit'),false);
  assert.equal(s.update(alice,'fictional-b',1,'illicit'),false);
  assert.equal(s.db.prepare('SELECT title FROM toy_records WHERE id=?').get('fictional-a').title,'Cedar draft');
  assert.equal(s.db.prepare('SELECT title FROM toy_records WHERE id=?').get('fictional-b').title,'Meadow draft');
}));

test('SQLite compare-and-set rejects stale revisions and does not overwrite fresh edit',()=>withDb(s=>{
  assert.equal(s.update(alice,'fictional-a',1,'first'),true);
  assert.equal(s.update(alice,'fictional-a',1,'stale'),false);
  assert.deepEqual({...s.db.prepare('SELECT title,revision FROM toy_records WHERE id=?').get('fictional-a')},{title:'first',revision:2});
  assert.equal(s.update(admin,'fictional-a',2,'admin review'),true);
  assert.equal(s.update(alice,'fictional-a',2,'stale again'),false);
}));

test('SQLite parameter binding stores SQL-looking text literally without changing structure',()=>withDb(s=>{
  const injected="Meadow'; DROP TABLE toy_records;--";
  assert.equal(s.update(bob,'fictional-b',1,injected),true);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS count FROM toy_records').get().count,3);
  assert.equal(s.db.prepare('SELECT title FROM toy_records WHERE id=?').get('fictional-b').title,injected);
  assert.equal(s.update(admin,"' OR 1=1 --",1,'bad id'),false);
}));
