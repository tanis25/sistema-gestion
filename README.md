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
/proyecto
  /backend
    package.json
    server.js
    src/
      config/db.js
      middlewares/auth.js
      routes/*.js
      uploads/
    seed-admin.js
    .env
  /frontend
    package.json
    vite.config.js
    src/
      App.svelte
      main.js
      pages/
      lib/
        components/
        stores/
    dist/  # generado por build
  package.json
  README.md
```

---

## Tecnologías y librerías

### Backend

- `express` - servidor HTTP y rutas.
- `cors` - manejo de CORS.
- `dotenv` - carga variables de entorno.
- `jsonwebtoken` - tokens JWT.
- `bcrypt` - hashing de contraseñas.
- `pg` - conexión PostgreSQL.
- `multer` - subida de archivos.
- `nodemon` (dev) - recarga automática en desarrollo.

### Frontend

- `svelte` - framework de UI.
- `vite` - bundler y servidor de desarrollo.
- `@sveltejs/vite-plugin-svelte` - integración Svelte/Vite.

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

> Nota: el usuario administrador inicial debe actualizarse con `seed-admin.js` para inyectar el hash real.

---

## Backend

### Rutas principales

El backend expone rutas bajo `/api` y atiende el frontend compilado:

- `/api/auth` - autenticación y permisos propios
- `/api/perfiles` - CRUD de perfiles
- `/api/modulos` - CRUD de módulos
- `/api/permisos` - permisos por perfil
- `/api/usuarios` - CRUD de usuarios
- `/api/menus` - menús dinámicos
- `/api/stats` - estadísticas para el dashboard

### Archivos clave

- `backend/server.js` - configuración de Express, rutas, serve-static del frontend.
- `backend/src/config/db.js` - configuración de PostgreSQL.
- `backend/seed-admin.js` - script para actualizar contraseña de admin.

### Dependencias del backend

```json
{
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "pg": "^8.11.3"
}
```

### Scripts del backend

```json
{
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

---

## Frontend

### Comportamiento

- SPA con Svelte.
- Consume la API usando rutas relativas como `/api/usuarios`.
- No utiliza variables de entorno para la URL del backend.
- El backend sirve los archivos estáticos desde `frontend/dist`.
- Tiene validaciones en formularios y notificaciones tipo toast.

### Dependencias del frontend

```json
{
  "@sveltejs/vite-plugin-svelte": "^7.0.0",
  "svelte": "^5.55.1",
  "vite": "^8.0.4"
}
```

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

El backend usa estas variables en `backend/.env` o en el entorno de Render:

- `DATABASE_URL` - conexión completa a PostgreSQL.
- `PORT` - puerto asignado por Render (opcional, `3001` por defecto localmente).

### Frontend

- No requiere `VITE_API_URL` en la configuración actual.

---

## Desarrollo local

1. Instala dependencias:

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Crea `backend/.env` con:

```env
DATABASE_URL=postgres://usuario:password@localhost:5432/nombredb
PORT=3001
```

3. Ejecuta el backend y frontend:

```bash
cd backend && npm run dev
cd ../frontend && npm run dev
```

4. Genera la base de datos y ejecuta el SQL del esquema.
5. Actualiza la contraseña del admin:

```bash
cd backend && node seed-admin.js
```

---

## Despliegue en Render

### Enfoque

El proyecto se despliega como un solo Web Service. El backend sirve el frontend compilado desde `frontend/dist`.

### Build Command

```bash
npm run build
```

### Start Command

```bash
npm start
```

### Variables de entorno en Render

- `DATABASE_URL` - cadena de conexión a PostgreSQL.
- `PORT` - no es necesario definirlo manualmente; Render lo asigna.

### Qué hace el build

El script de build raíz instala dependencias del frontend, construye `frontend/dist`, e instala dependencias del backend. El archivo `package.json` en la raíz define:

```json
{
  "scripts": {
    "build": "cd frontend && npm install && npm run build && cd ../backend && npm install",
    "start": "cd backend && npm start"
  }
}
```

---

## Notas útiles

- El backend atiende rutas estáticas desde `frontend/dist` y tiene un `catch-all` para SPA.
- El frontend hace fetch a `/api/...` y no depende de URLs hardcodeadas externas.
- El administrador inicial es `admin@sistema.com` con contraseña `Admin123!`, pero el hash se actualiza con `seed-admin.js`.
- Si se agrega más lógica, mantén las rutas `api` separadas de las rutas de página.

---

## Resumen rápido de despliegue

1. Subir el repo a Render.
2. Configurar Build Command: `npm run build`.
3. Configurar Start Command: `npm start`.
4. Añadir `DATABASE_URL`.
5. Deploy.

¡Listo! Con esto el sistema está documentado desde la base de datos hasta el despliegue final.
