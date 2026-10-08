// Public-safe, independently authored sample data. No private repository dependency.
import {DatabaseSync} from 'node:sqlite';

export function createFixture(){
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE hotels(id TEXT PRIMARY KEY,name TEXT NOT NULL,city TEXT NOT NULL,private_cost INTEGER NOT NULL,owner_note TEXT);CREATE VIRTUAL TABLE hotel_search USING fts5(name,content='hotels',content_rowid='rowid');");
  for(const [id,name,city,cost] of [
    ['fictional-001','Hotel Cedar','Example City',777],
    ['fictional-002','Hotel Meadow','Example Bay',888]
  ]){
    const row=db.prepare('INSERT INTO hotels(id,name,city,private_cost,owner_note) VALUES (?,?,?,?,?)')
      .run(id,name,city,cost,'PRIVATE_CANARY_NOT_FOR_PUBLIC');
    db.prepare('INSERT INTO hotel_search(rowid,name) VALUES (?,?)')
      .run(Number(row.lastInsertRowid),name);
  }
  const query=term=>{
    if(typeof term!=='string'||!term.trim()||term.length>80
      ||!/^[\p{L}\p{N}\s-]+$/u.test(term)){
      return {status:400,body:{success:false,error:'INVALID_QUERY'}};
    }
    const phrase='"'+term.trim()+'"';
    const results=db.prepare(
      'SELECT h.id,h.name,h.city FROM hotel_search s JOIN hotels h ON h.rowid=s.rowid WHERE hotel_search MATCH ? ORDER BY h.name LIMIT 10'
    ).all(phrase);
    return {status:200,body:{success:true,results}};
  };
  return {query,close(){db.close();}};
}
