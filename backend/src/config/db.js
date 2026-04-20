import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  // === CONEXIÓN EN LA NUBE (Neon) ===
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necesario para Neon
  },

  // === CONFIGURACIÓN LOCAL (comentada) ===
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT,
  // database: process.env.DB_NAME,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
});

pool.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL (Neon)'))
  .catch(err => console.error('❌ Error de conexión BD:', err));

export default pool;