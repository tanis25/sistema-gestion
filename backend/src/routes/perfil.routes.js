import express from 'express';
import pool from '../config/db.js';
import { verificarToken } from '../middlewares/auth.js';

const router = express.Router();

// GET todos con paginado
router.get('/', verificarToken, async (req, res) => {
  const { pagina = 1, limite = 5, buscar = '' } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const total = await pool.query(
      `SELECT COUNT(*) FROM perfil WHERE "strNombrePerfil" ILIKE $1`,
      [`%${buscar}%`]
    );
    const datos = await pool.query(
      `SELECT * FROM perfil WHERE "strNombrePerfil" ILIKE $1
       ORDER BY "dtCreacion" DESC LIMIT $2 OFFSET $3`,
      [`%${buscar}%`, limite, offset]
    );
    res.json({ datos: datos.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfiles' });
  }
});

// GET uno por id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM perfil WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// POST crear
router.post('/', verificarToken, async (req, res) => {
  const { strNombrePerfil, bitAdministrador = false } = req.body;
  if (!strNombrePerfil) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const existe = await pool.query(
      'SELECT id FROM perfil WHERE "strNombrePerfil" ILIKE $1', [strNombrePerfil]
    );
    if (existe.rows.length > 0) return res.status(400).json({ error: 'Ya existe un perfil con ese nombre' });

    const result = await pool.query(
      `INSERT INTO perfil ("strNombrePerfil", "bitAdministrador") VALUES ($1, $2) RETURNING *`,
      [strNombrePerfil, bitAdministrador]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear perfil' });
  }
});

// PUT actualizar
router.put('/:id', verificarToken, async (req, res) => {
  const { strNombrePerfil, bitAdministrador } = req.body;
  if (!strNombrePerfil) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const result = await pool.query(
      `UPDATE perfil SET "strNombrePerfil"=$1, "bitAdministrador"=$2 WHERE id=$3 RETURNING *`,
      [strNombrePerfil, bitAdministrador, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// DELETE eliminar
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const enUso = await pool.query('SELECT id FROM usuario WHERE "idPerfil" = $1 LIMIT 1', [req.params.id]);
    if (enUso.rows.length > 0) return res.status(400).json({ error: 'No se puede eliminar, hay usuarios con este perfil' });

    await pool.query('DELETE FROM perfil WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Perfil eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar perfil' });
  }
});

export default router;