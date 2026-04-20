import express from 'express';
import pool from '../config/db.js';
import { verificarToken } from '../middlewares/auth.js';

const router = express.Router();

// GET permisos de un perfil
router.get('/:idPerfil', verificarToken, async (req, res) => {
  try {
    const modulos = await pool.query('SELECT * FROM modulo ORDER BY id ASC');
    const permisos = await pool.query(
      'SELECT * FROM permisos_perfil WHERE "idPerfil" = $1',
      [req.params.idPerfil]
    );

    const mapa = {};
    permisos.rows.forEach(p => { mapa[p.idModulo] = p; });

    const resultado = modulos.rows.map(m => ({
      idModulo: m.id,
      strNombreModulo: m.strNombreModulo,
      bitAgregar: mapa[m.id]?.bitAgregar || false,
      bitEditar: mapa[m.id]?.bitEditar || false,
      bitConsulta: mapa[m.id]?.bitConsulta || false,
      bitEliminar: mapa[m.id]?.bitEliminar || false,
      bitDetalle: mapa[m.id]?.bitDetalle || false,
    }));

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
});

// POST guardar permisos de un perfil
router.post('/:idPerfil', verificarToken, async (req, res) => {
  const { idPerfil } = req.params;
  const { permisos } = req.body;

  try {
    for (const p of permisos) {
      await pool.query(
        `INSERT INTO permisos_perfil ("idModulo","idPerfil","bitAgregar","bitEditar","bitConsulta","bitEliminar","bitDetalle")
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT ("idModulo","idPerfil") DO UPDATE SET
         "bitAgregar"=$3,"bitEditar"=$4,"bitConsulta"=$5,"bitEliminar"=$6,"bitDetalle"=$7`,
        [p.idModulo, idPerfil, p.bitAgregar, p.bitEditar, p.bitConsulta, p.bitEliminar, p.bitDetalle]
      );
    }
    res.json({ mensaje: 'Permisos guardados correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar permisos' });
  }
});

// GET todos los perfiles para el select
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM perfil ORDER BY "strNombrePerfil" ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfiles' });
  }
});

export default router;