import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/auth.routes.js';
import perfilRoutes from './src/routes/perfil.routes.js';
import moduloRoutes from './src/routes/modulo.routes.js';
import permisosRoutes from './src/routes/permisos.routes.js';
import usuarioRoutes from './src/routes/usuario.routes.js';
import pool from './src/config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/perfiles', perfilRoutes);
app.use('/api/modulos', moduloRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Estadísticas del dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const [usuarios, perfiles, modulos, permisos] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM usuario WHERE "idEstadoUsuario" = true'),
      pool.query('SELECT COUNT(*) FROM perfil'),
      pool.query('SELECT COUNT(*) FROM modulo'),
      pool.query('SELECT COUNT(*) FROM permisos_perfil')
    ]);
    res.json({
      usuarios: parseInt(usuarios.rows[0].count),
      perfiles: parseInt(perfiles.rows[0].count),
      modulos: parseInt(modulos.rows[0].count),
      permisos: parseInt(permisos.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Menús dinámicos
app.get('/api/menus', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m."idMenu", mo.id as "idModulo", mo."strNombreModulo"
       FROM menu m
       JOIN modulo mo ON m."idModulo" = mo.id
       ORDER BY m."idMenu", mo.id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener menús' });
  }
});

app.get('/', (req, res) => res.json({ mensaje: 'Backend Sistema de Gestión funcionando ✅' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));