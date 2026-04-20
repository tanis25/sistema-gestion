import bcrypt from 'bcrypt';
import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const password = 'Admin123!';
const hash = await bcrypt.hash(password, 10);

await pool.query(
  `UPDATE usuario SET "strPwd" = $1 WHERE "strCorreo" = 'admin@sistema.com'`,
  [hash]
);

console.log('✅ Contraseña del admin actualizada correctamente');
console.log('📧 Correo: admin@sistema.com');
console.log('🔑 Contraseña: Admin123!');
process.exit();