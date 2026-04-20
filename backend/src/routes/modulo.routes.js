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
      `SELECT COUNT(*) FROM modulo WHERE "strNombreModulo" ILIKE $1`,
      [`%${buscar}%`]
    );
    const datos = await pool.query(
      `SELECT * FROM modulo WHERE "strNombreModulo" ILIKE $1
       ORDER BY id ASC LIMIT $2 OFFSET $3`,
      [`%${buscar}%`, limite, offset]
    );
    res.json({ datos: datos.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener módulos' });
  }
});

// GET uno
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM modulo WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener módulo' });
  }
});

// POST crear — con asignación de menú automática
router.post('/', verificarToken, async (req, res) => {
  const { strNombreModulo, idMenu } = req.body;
  if (!strNombreModulo) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const existe = await pool.query(
      'SELECT id FROM modulo WHERE "strNombreModulo" ILIKE $1', [strNombreModulo]
    );
    if (existe.rows.length > 0) return res.status(400).json({ error: 'Ya existe un módulo con ese nombre' });

    const result = await pool.query(
      `INSERT INTO modulo ("strNombreModulo") VALUES ($1) RETURNING *`,
      [strNombreModulo]
    );

    const nuevoModulo = result.rows[0];

    if (idMenu) {
      // Si eligió un menú existente, asignarlo ahí
      await pool.query(
        `INSERT INTO menu ("idMenu", "idModulo") VALUES ($1, $2)`,
        [parseInt(idMenu), nuevoModulo.id]
      );
    } else {
      // Si no eligió menú, crear uno nuevo automático con id único
      const maxMenu = await pool.query(`SELECT MAX("idMenu") as max FROM menu`);
      const nuevoIdMenu = (maxMenu.rows[0].max || 3) + 1;
      await pool.query(
        `INSERT INTO menu ("idMenu", "idModulo") VALUES ($1, $2)`,
        [nuevoIdMenu, nuevoModulo.id]
      );
    }

    res.status(201).json(nuevoModulo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear módulo' });
  }
});

// PUT actualizar
router.put('/:id', verificarToken, async (req, res) => {
  const { strNombreModulo, idMenu } = req.body;
  if (!strNombreModulo) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const result = await pool.query(
      `UPDATE modulo SET "strNombreModulo"=$1 WHERE id=$2 RETURNING *`,
      [strNombreModulo, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });

    if (idMenu !== undefined) {
      const existeMenu = await pool.query(
        'SELECT id FROM menu WHERE "idModulo" = $1', [req.params.id]
      );
      if (existeMenu.rows.length > 0) {
        if (!idMenu) {
          // Sin menú — queda en el menú actual, no borrar
        } else {
          await pool.query(
            'UPDATE menu SET "idMenu" = $1 WHERE "idModulo" = $2',
            [parseInt(idMenu), req.params.id]
          );
        }
      } else if (idMenu) {
        await pool.query(
          'INSERT INTO menu ("idMenu", "idModulo") VALUES ($1, $2)',
          [parseInt(idMenu), req.params.id]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar módulo' });
  }
});

// DELETE
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM menu WHERE "idModulo" = $1', [req.params.id]);
    await pool.query('DELETE FROM modulo WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Módulo eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar módulo' });
  }
});

export default router;