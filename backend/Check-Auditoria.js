const db = require('better-sqlite3')('casino.db');
console.log('--- TABLAS ---');
try{
  const tablas = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t=>t.name);
  console.log(tablas);
  console.log('\n--- AUDITORIA COUNT ---');
  const count = db.prepare("SELECT COUNT(*) as c FROM auditoria").get().c;
  console.log('Count:', count);
  console.log('\n--- ULTIMOS 5 REGISTROS ---');
  const ultimos = db.prepare("SELECT * FROM auditoria ORDER BY id DESC LIMIT 5").all();
  console.log(ultimos);
  if(count===0) console.log('\n>>> TABLA EXISTE PERO VACIA - Necesitas crear 1 operacion NUEVA con el backend AUDITORIA prendido');
} catch(e){
  console.log('ERROR - No existe tabla auditoria:', e.message);
  console.log('>>> Estas corriendo el backend VIEJO sin auditoria. Reemplaza server-con-reset.js por server-con-auditoria.js');
}
