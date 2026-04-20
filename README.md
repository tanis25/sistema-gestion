# Sistema de Gestión

Aplicación fullstack con backend en Node.js/Express y frontend en Svelte + Vite. El proyecto está preparado para ejecutarse como un único Web Service desplegado en Render, donde el backend sirve también el frontend compilado.

---

## Índice

1. [Visión general](#visión-general)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Tecnologías y librerías](#tecnologías-y-librerías)
4. [Base de datos](#base-de-datos)
5. [Backend](#backend)
6. [Frontend](#frontend)
7. [Variables de entorno](#variables-de-entorno)
8. [Desarrollo local](#desarrollo-local)
9. [Despliegue en Render](#despliegue-en-render)
10. [Notas útiles](#notas-útiles)

---

## Visión general

Este proyecto es un sistema de gestión con:

- Gestión de usuarios, perfiles, permisos y módulos.
- Autenticación JWT.
- Frontend SPA hecho con Svelte.
- Backend API REST con Node.js/Express.
- PostgreSQL como base de datos.
- Despliegue unificado como un solo Web Service en Render.

---

## Estructura del proyecto

```
/sistema-gestion
  /backend
    package.json
    server.js
    src/
      config/db.js
      middlewares/auth.js
      routes/
      uploads/
    seed-admin.js
    .env
  /frontend
    package.json
    vite.config.js
    svelte.config.js
    src/
      app.css
      App.svelte
      main.js
      lib/
        components/
        stores/
      pages/
    public/
    dist/  # generado por build
  README.md
```

---

## Tecnologías y librerías

### Backend

- `express`
- `cors`
- `dotenv`
- `jsonwebtoken`
- `bcrypt`
- `pg`
- `multer`
- `nodemon` (dev)

### Frontend

- `svelte`
- `vite`
- `@sveltejs/vite-plugin-svelte`

---

## Base de datos

Usa PostgreSQL. El esquema completo del proyecto es el siguiente:

```sql
-- ============================================
-- SISTEMA DE GESTIÓN — Base de Datos completa
-- ============================================

-- Tabla: perfil
CREATE TABLE perfil (
  id SERIAL PRIMARY KEY,
  "strNombrePerfil" VARCHAR(100) NOT NULL UNIQUE,
  "bitAdministrador" BOOLEAN DEFAULT FALSE,
  "dtCreacion" TIMESTAMP DEFAULT NOW()
);

-- Tabla: modulo
CREATE TABLE modulo (
  id SERIAL PRIMARY KEY,
  "strNombreModulo" VARCHAR(100) NOT NULL UNIQUE,
  "dtCreacion" TIMESTAMP DEFAULT NOW()
);

-- Tabla: usuario
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  "strNombreUsuario" VARCHAR(150) NOT NULL,
  "idPerfil" INTEGER REFERENCES perfil(id),
  "strPwd" VARCHAR(255) NOT NULL,
  "idEstadoUsuario" BOOLEAN DEFAULT TRUE,
  "strCorreo" VARCHAR(150) NOT NULL UNIQUE,
  "strNumeroCelular" VARCHAR(15),
  "strImagenPerfil" TEXT,
  "dtCreacion" TIMESTAMP DEFAULT NOW()
);

-- Tabla: permisos_perfil
CREATE TABLE permisos_perfil (
  id SERIAL PRIMARY KEY,
  "idModulo" INTEGER REFERENCES modulo(id) ON DELETE CASCADE,
  "idPerfil" INTEGER REFERENCES perfil(id) ON DELETE CASCADE,
  "bitAgregar" BOOLEAN DEFAULT FALSE,
  "bitEditar" BOOLEAN DEFAULT FALSE,
  "bitConsulta" BOOLEAN DEFAULT FALSE,
  "bitEliminar" BOOLEAN DEFAULT FALSE,
  "bitDetalle" BOOLEAN DEFAULT FALSE,
  UNIQUE("idModulo", "idPerfil")
);

-- Tabla: menu (sin pantalla, enlaza módulos con menú)
CREATE TABLE menu (
  id SERIAL PRIMARY KEY,
  "idMenu" INTEGER NOT NULL,
  "idModulo" INTEGER REFERENCES modulo(id) ON DELETE CASCADE
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Perfiles base
INSERT INTO perfil ("strNombrePerfil", "bitAdministrador") VALUES
('Administrador', TRUE),
('Usuario', FALSE),
('Consultor', FALSE);

-- Módulos del sistema
INSERT INTO modulo ("strNombreModulo") VALUES
('Perfil'),
('Modulo'),
('Permisos-Perfil'),
('Usuario'),
('Principal 1.1'),
('Principal 1.2'),
('Principal 2.1'),
('Principal 2.2');

-- Usuario administrador inicial
-- Contraseña: Admin123! (hasheada con bcrypt rounds=10, se reemplaza al levantar el backend)
-- Por ahora insertamos el hash real desde Node, este es un placeholder
INSERT INTO usuario (
  "strNombreUsuario",
  "idPerfil",
  "strPwd",
  "idEstadoUsuario",
  "strCorreo",
  "strNumeroCelular"
) VALUES (
  'Administrador',
  1,
  '$2b$10$placeholder_se_actualizara_con_script',
  TRUE,
  'admin@sistema.com',
  '5530567163'
);

-- Permisos totales para Administrador (perfil id=1)
INSERT INTO permisos_perfil ("idModulo", "idPerfil", "bitAgregar", "bitEditar", "bitConsulta", "bitEliminar", "bitDetalle")
SELECT id, 1, TRUE, TRUE, TRUE, TRUE, TRUE FROM modulo;

-- Menú: idMenu 1=Seguridad, 2=Principal1, 3=Principal2
INSERT INTO menu ("idMenu", "idModulo") VALUES
(1, 1),(1, 2),(1, 3),(1, 4),
(2, 5),(2, 6),
(3, 7),(3, 8);
```

> Nota: el usuario administrador inicial debe actualizarse con `seed-admin.js` para generar el hash real de bcrypt.

---

## Backend

### Descripción

El backend se encuentra en `backend/server.js` y expone la API REST. Además, sirve el frontend compilado desde `frontend/dist`.

### Configuración de base de datos

- `backend/src/config/db.js` usa `process.env.DATABASE_URL`.
- Soporta SSL cuando se usa un servicio de base de datos en nube.

### Rutas principales

- `POST /api/auth/login` - iniciar sesión
- `GET /api/auth/me` - datos del usuario autenticado
- `GET /api/perfiles` - obtener perfiles
- `POST /api/perfiles` - crear perfil
- `PUT /api/perfiles/:id` - actualizar perfil
- `DELETE /api/perfiles/:id` - eliminar perfil
- `GET /api/modulos` - obtener módulos
- `POST /api/modulos` - crear módulo
- `PUT /api/modulos/:id` - actualizar módulo
- `DELETE /api/modulos/:id` - eliminar módulo
- `GET /api/usuarios` - obtener usuarios
- `POST /api/usuarios` - crear usuario
- `PUT /api/usuarios/:id` - actualizar usuario
- `DELETE /api/usuarios/:id` - eliminar usuario
- `GET /api/permisos` - obtener permisos por perfil
- `POST /api/permisos/:perfilId` - actualizar permisos
- `GET /api/menus` - obtener menú dinámico
- `GET /api/stats` - estadísticas del dashboard

### Dependencias del backend

- `express`
- `cors`
- `dotenv`
- `jsonwebtoken`
- `bcrypt`
- `pg`
- `multer`
- `nodemon` (dev)

### Scripts del backend

```json
{
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

---

## Frontend

### Descripción

El frontend es una aplicación Svelte que consume la API mediante rutas relativas (`/api/...`). No usa `VITE_API_URL`.

### Comportamiento clave

- Carga dinámica de menús desde `frontend/src/lib/stores/menus.js`
- Actualiza el navbar cuando se crean o eliminan módulos
- Validaciones de formularios: texto con longitud mínima, correo válido y teléfono de 10 dígitos numéricos
- Notificaciones tipo toaster para confirmar acciones exitosas y mostrar errores
- SPA con rutas internas manejadas por `App.svelte`

### Dependencias del frontend

- `svelte`
- `vite`
- `@sveltejs/vite-plugin-svelte`

### Scripts del frontend

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## Variables de entorno

### Backend

Crea un archivo `backend/.env` con estas variables:

```env
PORT=3001
DATABASE_URL=postgres://usuario:password@host:puerto/base_de_datos
JWT_SECRET=tu_secreto_jwt_aqui
```

- `PORT`: puerto de escucha (Render usa `process.env.PORT`).
- `DATABASE_URL`: cadena de conexión de PostgreSQL.
- `JWT_SECRET`: clave para firmar JWT.

### Frontend

No se requiere variable de entorno de API en frontend. El backend y frontend se despliegan juntos y el frontend usa rutas relativas.

---

## Desarrollo local

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Build de producción

```bash
cd frontend
npm run build
```

### Ejecutar el backend con frontend compilado

```bash
cd backend
npm start
```

Asegúrate de tener `frontend/dist` antes de iniciar el backend en modo producción.

---

## Despliegue en Render

### Pasos generales

1. Subir el repositorio completo a Render.
2. Configurar un solo Web Service.
3. Ajustar el build command:

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install
```

4. Ajustar el start command:

```bash
cd backend && npm start
```

### Variables de entorno en Render

- `PORT` - Render lo asigna automáticamente.
- `DATABASE_URL` - URL de PostgreSQL.
- `JWT_SECRET` - secreto para JWT.

### Notas de despliegue

- El backend sirve el contenido de `frontend/dist`.
- El catch-all `app.get('*')` devuelve `index.html` para el enrutado SPA.
- Se usa `process.env.PORT || 3001`.

---

## Notas útiles

- El menú dinámico se construye a partir de la tabla `menu`.
- Los módulos pueden asignarse a los menús 1, 2, 3 o generar nuevos menús dinámicos.
- Las validaciones del frontend son tanto HTML como JavaScript.
- La autenticación trabaja con JWT y el token se envía en el header `Authorization: Bearer ...`.
- El backend y frontend están integrados en una sola aplicación para despliegue en Render.

---

## Resumen final

Este repositorio contiene un sistema fullstack completo, listo para desarrollo local y despliegue en Render como un servicio único. La configuración actual soporta autenticación, permisos, menús dinámicos, validaciones de formularios y despliegue con `frontend/dist` servido por Express.
