const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, 'casino.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  nombre TEXT,
  rol TEXT DEFAULT 'cajero',
  creado_en DATETIME DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT,
  dni TEXT,
  telefono TEXT,
  email TEXT,
  saldo REAL DEFAULT 0,
  creado_por INTEGER,
  creado_en DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(creado_por) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS operaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  tipo TEXT CHECK(tipo IN ('ingreso','egreso')) NOT NULL,
  monto REAL NOT NULL,
  concepto TEXT,
  metodo_pago TEXT DEFAULT 'efectivo',
  referencia TEXT,
  fecha DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(cliente_id) REFERENCES clientes(id),
  FOREIGN KEY(usuario_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS cierres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  fecha_cierre DATETIME DEFAULT (datetime('now','localtime')),
  total_ingresos REAL,
  total_egresos REAL,
  saldo_calculado REAL,
  arqueo_real REAL,
  diferencia REAL,
  estado TEXT,
  observaciones TEXT,
  FOREIGN KEY(usuario_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  accion TEXT,
  detalle TEXT,
  fecha DATETIME DEFAULT (datetime('now','localtime'))
);
`);

try{ db.exec("ALTER TABLE operaciones ADD COLUMN metodo_pago TEXT DEFAULT 'efectivo'"); }catch(e){}
try{ db.exec("ALTER TABLE operaciones ADD COLUMN referencia TEXT"); }catch(e){}

const adminExists = db.prepare("SELECT * FROM users WHERE username = 'admin' OR username = 'administrador'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (username, password_hash, nombre, rol) VALUES (?,?,?,?)").run('administrador',''+hash,'Administrador','admin');
  db.prepare("INSERT INTO users (username, password_hash, nombre, rol) VALUES (?,?,?,?)").run('admin',''+hash,'Administrador','admin');
}

function audit(userId, accion, detalle){
  try{ db.prepare("INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?,?,?)").run(userId||1, accion, detalle); }catch(e){}
}

app.post('/api/login', (req,res)=>{
  const {username,password} = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if(!user) return res.status(401).json({error:"Usuario no existe"});
  let ok=false;
  if(user.password_hash && user.password_hash.startsWith('$2')) ok = bcrypt.compareSync(password, user.password_hash);
  else ok = (password === user.password || password === user.password_hash);
  if(!ok) return res.status(401).json({error:"Clave incorrecta"});
  audit(user.id,'LOGIN',`Login ${username}`);
  res.json({id:user.id, username:user.username, nombre:user.nombre, rol:user.rol});
});

app.get('/api/users', (req,res)=>{ res.json(db.prepare("SELECT id, username, nombre, rol, creado_en FROM users ORDER BY id").all()); });
app.post('/api/users', (req,res)=>{
  const {username,password,nombre,rol, creador_id} = req.body;
  if(!username || !password) return res.status(400).json({error:"Faltan datos"});
  const hash = bcrypt.hashSync(password,10);
  try{
    const info = db.prepare("INSERT INTO users (username, password_hash, nombre, rol) VALUES (?,?,?,?)").run(username,hash,nombre||username,rol||'cajero');
    audit(creador_id,'CREAR_USUARIO',`Creo usuario ${username} rol ${rol}`);
    res.json({id:info.lastInsertRowid});
  }catch(e){ res.status(400).json({error:"Usuario ya existe"}); }
});
app.delete('/api/users/:id', (req,res)=>{
  if(Number(req.params.id)===1) return res.status(400).json({error:"No podes borrar admin principal"});
  db.prepare("DELETE FROM users WHERE id=?").run(req.params.id);
  audit(1,'BORRAR_USUARIO',`Borro usuario id ${req.params.id}`);
  res.json({ok:true});
});

app.get('/api/clientes', (req,res)=>{ res.json(db.prepare(`SELECT c.*, u.username as creador_nombre FROM clientes c LEFT JOIN users u ON c.creado_por = u.id ORDER BY c.id DESC`).all()); });
app.post('/api/clientes', (req,res)=>{
  const {nombre,apellido,dni,telefono,email, creado_por} = req.body;
  if(!nombre) return res.status(400).json({error:"Nombre requerido"});
  const info = db.prepare("INSERT INTO clientes (nombre,apellido,dni,telefono,email,creado_por) VALUES (?,?,?,?,?,?)").run(nombre,apellido,dni,telefono,email,creado_por||1);
  audit(creado_por,'CREAR_CLIENTE',`Cliente ${nombre} ${apellido||''}`);
  res.json({id:info.lastInsertRowid});
});

app.put('/api/clientes/:id', (req,res)=>{
  const {nombre,apellido,dni,telefono,email} = req.body;
  if(!nombre || !nombre.trim()) return res.status(400).json({error:"Nombre requerido"});
  try{
    db.prepare("UPDATE clientes SET nombre=?, apellido=?, dni=?, telefono=?, email=? WHERE id=?").run(nombre,apellido||'',dni||'',telefono||'',email||'',req.params.id);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:"Error al actualizar cliente"}); }
});

app.delete('/api/clientes/:id', (req,res)=>{
  const id=req.params.id;
  try{
    // FIX: borrar operaciones primero para que no bloquee
    db.prepare("DELETE FROM operaciones WHERE cliente_id=?").run(id);
    db.prepare("DELETE FROM clientes WHERE id=?").run(id);
    audit(1,'BORRAR_CLIENTE',`Borro cliente id ${id} y sus operaciones`);
    res.json({ok:true});
  }catch(e){
    res.status(500).json({error:"Error al borrar cliente"});
  }
});

app.get('/api/operaciones', (req,res)=>{
  const {cliente_id, desde, hasta, tipo, metodo_pago} = req.query;
  let where="1=1"; const p=[];
  if(cliente_id){ where+=" AND o.cliente_id=?"; p.push(cliente_id); }
  if(tipo){ where+= " AND o.tipo=?"; p.push(tipo); }
  if(metodo_pago){ where+= " AND o.metodo_pago=?"; p.push(metodo_pago); }
  if(desde){ where+= " AND date(o.fecha) >= date(?)"; p.push(desde); }
  if(hasta){ where+= " AND date(o.fecha) <= date(?)"; p.push(hasta); }
  res.json(db.prepare(`SELECT o.*, c.nombre || ' ' || COALESCE(c.apellido,'') as cliente_nombre, u.username as cajero FROM operaciones o JOIN clientes c ON c.id=o.cliente_id JOIN users u ON u.id=o.usuario_id WHERE ${where} ORDER BY o.fecha DESC LIMIT 500`).all(...p));
});
app.post('/api/operaciones', (req,res)=>{
  const {cliente_id, usuario_id, tipo, monto, concepto, metodo_pago, referencia} = req.body;
  if(!cliente_id || !usuario_id || !tipo || !monto) return res.status(400).json({error:"Faltan datos"});
  const info = db.prepare("INSERT INTO operaciones (cliente_id, usuario_id, tipo, monto, concepto, metodo_pago, referencia) VALUES (?,?,?,?,?,?,?)").run(cliente_id, usuario_id, tipo, monto, concepto, metodo_pago||'efectivo', referencia||'');
  audit(usuario_id,'OPERACION',`${tipo} $${monto} cliente ${cliente_id} via ${metodo_pago} - ${concepto}`);
  res.json({id:info.lastInsertRowid});
});
app.delete('/api/operaciones/:id', (req,res)=>{
  db.prepare("DELETE FROM operaciones WHERE id=?").run(req.params.id);
  audit(1,'BORRAR_OPERACION',`Borro operacion ${req.params.id}`);
  res.json({ok:true});
});

app.get('/api/cierres', (req,res)=>{ res.json(db.prepare(`SELECT c.*, u.username FROM cierres c LEFT JOIN users u ON u.id=c.usuario_id ORDER BY c.id DESC`).all()); });
app.post('/api/cierres', (req,res)=>{
  const {usuario_id, arqueo_real, observaciones} = req.body;
  const tot = db.prepare(`SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) as ing, COALESCE(SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END),0) as egr FROM operaciones WHERE date(fecha)=date('now','localtime') AND usuario_id=?`).get(usuario_id);
  const saldo = (tot.ing||0) - (tot.egr||0);
  const dif = (Number(arqueo_real)||0) - saldo;
  let estado='CUADRA'; if(dif>0) estado='SOBRANTE'; if(dif<0) estado='FALTANTE';
  const info = db.prepare("INSERT INTO cierres (usuario_id, total_ingresos, total_egresos, saldo_calculado, arqueo_real, diferencia, estado, observaciones) VALUES (?,?,?,?,?,?,?,?)").run(usuario_id, tot.ing, tot.egr, saldo, arqueo_real, dif, estado, observaciones);
  audit(usuario_id,'CIERRE',`Cierre ${estado} dif ${dif}`);
  res.json({id:info.lastInsertRowid, estado, diferencia:dif});
});

app.get('/api/auditoria', (req,res)=>{
  const {desde,hasta} = req.query; let where="1=1"; const p=[];
  if(desde){ where+=" AND date(a.fecha) >= date(?)"; p.push(desde); }
  if(hasta){ where+=" AND date(a.fecha) <= date(?)"; p.push(hasta); }
  res.json(db.prepare(`SELECT a.*, u.username FROM auditoria a LEFT JOIN users u ON u.id=a.usuario_id WHERE ${where} ORDER BY a.id DESC LIMIT 500`).all(...p));
});
app.delete('/api/auditoria', (req,res)=>{
  // FIX: borrar siempre, acepta con o sin confirmacion para que ande desde el boton
  try{
    db.exec("DELETE FROM auditoria; VACUUM;");
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:"Error al borrar"}); }
});
app.post('/api/auditoria/borrar', (req,res)=>{
  try{ db.exec("DELETE FROM auditoria; VACUUM;"); res.json({ok:true}); }catch(e){ res.status(500).json({error:"Error"}); }
});

app.get('/api/dashboard', (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let where = "1=1"; const params = [];
    if (desde) { where += " AND date(fecha) >= date(?)"; params.push(desde); }
    if (hasta) { where += " AND date(fecha) <= date(?)"; params.push(hasta); }
    const totales = db.prepare(`SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) as total_ingresos, COALESCE(SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END),0) as total_egresos, COUNT(*) as cantidad_ops FROM operaciones WHERE ${where}`).get(...params);
    const porMetodo = db.prepare(`SELECT metodo_pago, SUM(monto) as total, COUNT(*) as ops FROM operaciones WHERE ${where} GROUP BY metodo_pago`).all(...params);
    const porDia = db.prepare(`SELECT date(fecha) as dia, SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) as ingresos, SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END) as egresos FROM operaciones WHERE ${where} GROUP BY date(fecha) ORDER BY dia ASC`).all(...params);
    const topClientes = db.prepare(`SELECT c.id, c.nombre, c.apellido, SUM(ABS(o.monto)) as movimiento_total, COUNT(o.id) as ops FROM operaciones o JOIN clientes c ON c.id = o.cliente_id WHERE ${where.replace(/fecha/g,'o.fecha')} GROUP BY c.id ORDER BY movimiento_total DESC LIMIT 5`).all(...params);
    const rankingCajeros = db.prepare(`SELECT u.id, u.username, u.nombre as cajero_nombre, COUNT(o.id) as cantidad_ops, SUM(ABS(o.monto)) as movimiento_abs FROM operaciones o JOIN users u ON o.id = o.usuario_id WHERE ${where.replace(/fecha/g,'o.fecha')} GROUP BY u.id ORDER BY cantidad_ops DESC`).all(...params);
    res.json({ resumen:{ total_ingresos: totales.total_ingresos, total_egresos: totales.total_egresos, saldo: totales.total_ingresos - totales.total_egresos, cantidad_operaciones: totales.cantidad_ops }, por_metodo: porMetodo, grafico_diario: porDia, top_clientes: topClientes, ranking_cajeros: rankingCajeros });
  } catch (e) { res.status(500).json({ error: "Error dashboard" }); }
});

app.get('/api/clientes/:id/ficha', (req, res) => {
  const cliente = db.prepare(`SELECT c.*, u.username as creador_nombre FROM clientes c LEFT JOIN users u ON c.creado_por = u.id WHERE c.id = ?`).get(req.params.id);
  if (!cliente) return res.status(404).json({ error: "Cliente no existe" });
  const historial = db.prepare(`SELECT o.*, u.username as cajero, u.nombre as cajero_nombre FROM operaciones o JOIN users u ON o.usuario_id = u.id WHERE o.cliente_id = ? ORDER BY o.fecha DESC`).all(req.params.id);
  const totales = db.prepare(`SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) as ingresos, COALESCE(SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END),0) as egresos FROM operaciones WHERE cliente_id = ?`).get(req.params.id);
  res.json({ cliente, saldo_actual: totales.ingresos - totales.egresos, totales, historial });
});

app.get('/api/backup', (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups'); if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const now = new Date(); const pad = (n) => String(n).padStart(2,'0');
    const fileName = `casino-${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.db`;
    fs.copyFileSync(path.join(__dirname, 'casino.db'), path.join(backupDir, fileName));
    res.json({ ok: true, archivo: fileName });
  } catch(e) { res.status(500).json({error: "No se pudo crear backup"}); }
});

app.post('/api/cambiar-password', (req, res) => {
  const { userId, actual, nueva } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  let ok=false; if (user.password_hash?.startsWith('$2')) ok = bcrypt.compareSync(actual, user.password_hash); else ok = (actual === user.password);
  if (!ok) return res.status(401).json({error:"Contraseña actual incorrecta"});
  db.prepare("UPDATE users SET password_hash = ?, password = NULL WHERE id = ?").run(bcrypt.hashSync(nueva,10), userId);
  res.json({ok:true});
});


app.delete('/api/cierres/:id', (req,res)=>{
  try{
    db.prepare("DELETE FROM cierres WHERE id=?").run(req.params.id);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:"Error al borrar cierre"}); }
});
app.delete('/api/cierres', (req,res)=>{
  const {confirmacion}= req.body || {};
  if(confirmacion !== 'BORRAR CIERRES'){
    return res.status(400).json({error:"Confirmacion incorrecta"});
  }
  db.exec("DELETE FROM cierres; VACUUM;");
  res.json({ok:true});
});

app.listen(3001, ()=> console.log('Backend CasinoControl OK puerto 3001 - ETAPA 4 COMPLETO + HORA ARGENTINA localtime'));
