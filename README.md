# Sistema de Gestión

Un sistema de gestión con backend en Node.js/Express y frontend en Svelte.

## Despliegue en Render

### 1. Backend (Web Service)

- **Repositorio**: Apunta a la carpeta `backend/`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `DATABASE_URL`: URL de la base de datos PostgreSQL (crea una instancia en Render)
  - `PORT`: Asignado automáticamente por Render

Después de desplegar, ejecuta el script de seed para configurar el admin:
```bash
node seed-admin.js
```

### 2. Frontend (Static Site)

- **Repositorio**: Apunta a la carpeta `frontend/`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: URL del backend desplegado (ej: https://tu-backend.onrender.com)

### 3. Base de Datos

- Crea una instancia PostgreSQL en Render.
- Ejecuta el esquema de la base de datos (asegúrate de tener las tablas creadas).
- Usa el `seed-admin.js` para configurar la contraseña del admin.

### Credenciales por defecto
- Email: admin@sistema.com
- Password: Admin123!

## Desarrollo Local

1. Instala dependencias en ambas carpetas:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Configura `.env` en backend con tu DB local.

3. Ejecuta:
   ```bash
   cd backend && npm run dev
   cd ../frontend && npm run dev
   ```