import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verificarToken } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `usuario_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    if (tipos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
  }
});

const router = express.Router();

// GET todos con paginado
router.get('/', verificarToken, async (req, res) => {
  const { pagina = 1, limite = 5, buscar = '' } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const total = await pool.query(
      `SELECT COUNT(*) FROM usuario u
       WHERE u."strNombreUsuario" ILIKE $1 OR u."strCorreo" ILIKE $1`,
      [`%${buscar}%`]
    );
    const datos = await pool.query(
      `SELECT u.id, u."strNombreUsuario", u."strCorreo", u."strNumeroCelular",
              u."idEstadoUsuario", u."strImagenPerfil", u."dtCreacion",
              p."strNombrePerfil", u."idPerfil"
       FROM usuario u
       LEFT JOIN perfil p ON u."idPerfil" = p.id
       WHERE u."strNombreUsuario" ILIKE $1 OR u."strCorreo" ILIKE $1
       ORDER BY u."dtCreacion" DESC LIMIT $2 OFFSET $3`,
      [`%${buscar}%`, limite, offset]
    );
    res.json({ datos: datos.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET uno
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, p."strNombrePerfil" FROM usuario u
       LEFT JOIN perfil p ON u."idPerfil" = p.id WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// POST crear con imagen
router.post('/', verificarToken, upload.single('imagen'), async (req, res) => {
  const { strNombreUsuario, strCorreo, strPwd, idPerfil, idEstadoUsuario, strNumeroCelular } = req.body;

  if (!strNombreUsuario || !strCorreo || !strPwd || !idPerfil)
    return res.status(400).json({ error: 'Nombre, correo, contraseña y perfil son requeridos' });

  try {
    const existe = await pool.query('SELECT id FROM usuario WHERE "strCorreo" = $1', [strCorreo]);
    if (existe.rows.length > 0) return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });

    const hash = await bcrypt.hash(strPwd, 10);
    const imagen = req.file ? req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO usuario ("strNombreUsuario","strCorreo","strPwd","idPerfil","idEstadoUsuario","strNumeroCelular","strImagenPerfil")
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [strNombreUsuario, strCorreo, hash, idPerfil, idEstadoUsuario ?? true, strNumeroCelular || null, imagen]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT actualizar
router.put('/:id', verificarToken, upload.single('imagen'), async (req, res) => {
  const { strNombreUsuario, strCorreo, strPwd, idPerfil, idEstadoUsuario, strNumeroCelular } = req.body;

  try {
    let query, params;
    const imagen = req.file ? req.file.filename : null;

    if (strPwd) {
      const hash = await bcrypt.hash(strPwd, 10);
      if (imagen) {
        query = `UPDATE usuario SET "strNombreUsuario"=$1,"strCorreo"=$2,"strPwd"=$3,"idPerfil"=$4,
                 "idEstadoUsuario"=$5,"strNumeroCelular"=$6,"strImagenPerfil"=$7 WHERE id=$8 RETURNING *`;
        params = [strNombreUsuario, strCorreo, hash, idPerfil, idEstadoUsuario, strNumeroCelular, imagen, req.params.id];
      } else {
        query = `UPDATE usuario SET "strNombreUsuario"=$1,"strCorreo"=$2,"strPwd"=$3,"idPerfil"=$4,
                 "idEstadoUsuario"=$5,"strNumeroCelular"=$6 WHERE id=$7 RETURNING *`;
        params = [strNombreUsuario, strCorreo, hash, idPerfil, idEstadoUsuario, strNumeroCelular, req.params.id];
      }
    } else {
      if (imagen) {
        query = `UPDATE usuario SET "strNombreUsuario"=$1,"strCorreo"=$2,"idPerfil"=$3,
                 "idEstadoUsuario"=$4,"strNumeroCelular"=$5,"strImagenPerfil"=$6 WHERE id=$7 RETURNING *`;
        params = [strNombreUsuario, strCorreo, idPerfil, idEstadoUsuario, strNumeroCelular, imagen, req.params.id];
      } else {
        query = `UPDATE usuario SET "strNombreUsuario"=$1,"strCorreo"=$2,"idPerfil"=$3,
                 "idEstadoUsuario"=$4,"strNumeroCelular"=$5 WHERE id=$6 RETURNING *`;
        params = [strNombreUsuario, strCorreo, idPerfil, idEstadoUsuario, strNumeroCelular, req.params.id];
      }
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM usuario WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;