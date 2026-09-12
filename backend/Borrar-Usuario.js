const Database = require('better-sqlite3');
const db = new Database('casino.db');

console.log("--- USUARIOS ACTUALES ---");
const users = db.prepare('SELECT id, username, nombre, role FROM users').all();
console.table(users);

console.log("\nPara borrar un usuario:");
console.log("node borrar-usuario.js casino_flores");
console.log("O:");
console.log("node borrar-usuario.js 3  (por ID)");

const target = process.argv[2];
if(!target){
  console.log("\nNo pasaste usuario. Solo listé.");
  process.exit(0);
}

let userToDelete = null;
if(!isNaN(Number(target))){
  userToDelete = db.prepare('SELECT * FROM users WHERE id=?').get(Number(target));
} else {
  userToDelete = db.prepare('SELECT * FROM users WHERE username=?').get(target);
}

if(!userToDelete){
  console.log(`No existe usuario ${target}`);
  process.exit(0);
}
if(userToDelete.username==='admin'){
  console.log("No podes borrar al admin principal!");
  process.exit(0);
}

db.prepare('DELETE FROM users WHERE id=?').run(userToDelete.id);
console.log(`>>> BORRADO: ${userToDelete.username} (${userToDelete.nombre}) ID ${userToDelete.id}`);
console.log("Usuarios restantes:");
console.table(db.prepare('SELECT id, username, nombre, role FROM users').all());
