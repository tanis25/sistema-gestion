import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT u.*, p."strNombrePerfil", p."bitAdministrador"
       FROM usuario u
       JOIN perfil p ON u."idPerfil" = p.id
       WHERE u."strCorreo" = $1`,
      [correo]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    const usuario = result.rows[0];

    if (!usuario.idEstadoUsuario)
      return res.status(403).json({ error: 'Usuario inactivo' });

    const passwordValida = await bcrypt.compare(password, usuario.strPwd);
    if (!passwordValida)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.strCorreo,
        nombre: usuario.strNombreUsuario,
        perfil: usuario.strNombrePerfil,
        esAdmin: usuario.bitAdministrador,
        idPerfil: usuario.idPerfil
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.strNombreUsuario,
        correo: usuario.strCorreo,
        perfil: usuario.strNombrePerfil,
        esAdmin: usuario.bitAdministrador,
        imagen: usuario.strImagenPerfil
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/mis-permisos
router.get('/mis-permisos', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.esAdmin) {
      const modulos = await pool.query('SELECT * FROM modulo ORDER BY id ASC');
      const permisos = modulos.rows.map(m => ({
        idModulo: m.id,
        strNombreModulo: m.strNombreModulo,
        bitAgregar: true,
        bitEditar: true,
        bitConsulta: true,
        bitEliminar: true,
        bitDetalle: true
      }));
      return res.json({ esAdmin: true, permisos });
    }

    const result = await pool.query(
      `SELECT pp.*, m."strNombreModulo"
       FROM permisos_perfil pp
       JOIN modulo m ON pp."idModulo" = m.id
       WHERE pp."idPerfil" = $1`,
      [decoded.idPerfil]
    );

    res.json({ esAdmin: false, permisos: result.rows });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Token inválido' });
  }
});

export default router;