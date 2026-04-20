<script>
  import { onMount } from 'svelte';
  import Layout from '../../lib/components/Layout.svelte';
  import Breadcrumb from '../../lib/components/Breadcrumb.svelte';
  import Pagination from '../../lib/components/Pagination.svelte';
  import { token } from '../../lib/stores/auth.js';
  import { misPermisos, esAdmin, getPermisos } from '../../lib/stores/permisos.js';
  import { navegar } from '../../lib/navegador.js';
  import { API_URL } from '../../lib/config.js';

  let usuarios = $state([]);
  let perfiles = $state([]);
  let total = $state(0);
  let pagina = $state(1);
  let buscar = $state('');
  let cargando = $state(false);
  let error = $state('');
  let exito = $state('');

  let modalAbierto = $state(false);
  let modalDetalle = $state(false);
  let modalEliminar = $state(false);
  let modoEditar = $state(false);
  let usuarioSeleccionado = $state(null);
  let mostrarPwd = $state(false);
  let mostrarPwd2 = $state(false);
  let imagenPreview = $state('');
  let imagenArchivo = $state(null);

  let form = $state({
    strNombreUsuario: '', strCorreo: '', strPwd: '',
    strPwdConfirm: '', idPerfil: '', idEstadoUsuario: true, strNumeroCelular: ''
  });
  let formError = $state('');

  const POR_PAGINA = 5;
  let tokenVal = '';
  token.subscribe(t => tokenVal = t);

  let permisosVal = $state([]);
  let esAdminVal = $state(false);
  misPermisos.subscribe(v => permisosVal = v);
  esAdmin.subscribe(v => esAdminVal = v);
  let perms = $derived(getPermisos(permisosVal, esAdminVal, 'Usuario'));

  const headersJSON = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenVal}`
  });

  const headersAuth = () => ({
    'Authorization': `Bearer ${tokenVal}`
  });

  async function cargar() {
    cargando = true; error = '';
    try {
      const [resU, resP] = await Promise.all([
        fetch(`${API_URL}/api/usuarios?pagina=${pagina}&limite=${POR_PAGINA}&buscar=${buscar}`, { headers: headersJSON() }),
        fetch(`${API_URL}/api/perfiles?pagina=1&limite=100`, { headers: headersJSON() })
      ]);
      if (resU.status === 401 || resU.status === 403) { navegar('/login'); return; }
      const dataU = await resU.json();
      const dataP = await resP.json();
      usuarios = dataU.datos;
      total = dataU.total;
      perfiles = dataP.datos;
    } catch { error = 'Error al conectar con el servidor.'; }
    finally { cargando = false; }
  }

  onMount(cargar);

  let buscarTimeout;
  function onBuscar(e) {
    buscar = e.target.value; pagina = 1;
    clearTimeout(buscarTimeout);
    buscarTimeout = setTimeout(cargar, 400);
  }

  function resetForm() {
    form = { strNombreUsuario: '', strCorreo: '', strPwd: '', strPwdConfirm: '', idPerfil: '', idEstadoUsuario: true, strNumeroCelular: '' };
    imagenPreview = ''; imagenArchivo = null;
    formError = ''; mostrarPwd = false; mostrarPwd2 = false;
  }

  function abrirNuevo() { modoEditar = false; resetForm(); modalAbierto = true; }

  function abrirEditar(u) {
    modoEditar = true; usuarioSeleccionado = u;
    form = { strNombreUsuario: u.strNombreUsuario, strCorreo: u.strCorreo, strPwd: '', strPwdConfirm: '', idPerfil: u.idPerfil, idEstadoUsuario: u.idEstadoUsuario, strNumeroCelular: u.strNumeroCelular || '' };
    imagenPreview = u.strImagenPerfil ? `${API_URL}/uploads/${u.strImagenPerfil}` : '';
    imagenArchivo = null; formError = ''; modalAbierto = true;
  }

  function abrirDetalle(u) { usuarioSeleccionado = u; modalDetalle = true; }
  function abrirEliminar(u) { usuarioSeleccionado = u; modalEliminar = true; }

  function onImagenChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { formError = 'La imagen no debe superar 2MB.'; return; }
    imagenArchivo = file;
    const reader = new FileReader();
    reader.onload = (ev) => { imagenPreview = ev.target.result; };
    reader.readAsDataURL(file);
  }

  function validar() {
    if (!form.strNombreUsuario.trim()) return 'El nombre es requerido.';
    if (!form.strCorreo.trim()) return 'El correo es requerido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.strCorreo)) return 'El correo no es válido.';
    if (!modoEditar && !form.strPwd) return 'La contraseña es requerida.';
    if (form.strPwd && form.strPwd.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (form.strPwd && form.strPwd !== form.strPwdConfirm) return 'Las contraseñas no coinciden.';
    if (!form.idPerfil) return 'Selecciona un perfil.';
    if (form.strNumeroCelular && !/^\d{10}$/.test(form.strNumeroCelular)) return 'El celular debe tener 10 dígitos.';
    return '';
  }

  async function guardar() {
    formError = validar();
    if (formError) return;
    try {
      const fd = new FormData();
      fd.append('strNombreUsuario', form.strNombreUsuario);
      fd.append('strCorreo', form.strCorreo);
      if (form.strPwd) fd.append('strPwd', form.strPwd);
      fd.append('idPerfil', form.idPerfil);
      fd.append('idEstadoUsuario', form.idEstadoUsuario);
      fd.append('strNumeroCelular', form.strNumeroCelular);
      if (imagenArchivo) fd.append('imagen', imagenArchivo);

      const url = modoEditar
        ? `${API_URL}/api/usuarios/${usuarioSeleccionado.id}`
        : `${API_URL}/api/usuarios`;

      const res = await fetch(url, { method: modoEditar ? 'PUT' : 'POST', headers: headersAuth(), body: fd });
      const data = await res.json();
      if (!res.ok) { formError = data.error; return; }
      exito = modoEditar ? 'Usuario actualizado.' : 'Usuario creado.';
      modalAbierto = false; cargar();
      setTimeout(() => exito = '', 3000);
    } catch { formError = 'Error al guardar.'; }
  }

  async function eliminar() {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioSeleccionado.id}`, { method: 'DELETE', headers: headersJSON() });
      const data = await res.json();
      if (!res.ok) { error = data.error; modalEliminar = false; return; }
      exito = 'Usuario eliminado.';
      modalEliminar = false;
      if (usuarios.length === 1 && pagina > 1) pagina--;
      cargar(); setTimeout(() => exito = '', 3000);
    } catch { error = 'Error al eliminar.'; }
  }

  function formatFecha(f) {
    return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getIniciales(nombre) {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
</script>

<Layout>
  <Breadcrumb items={[{ label: 'Seguridad' }, { label: 'Usuarios' }]} />

  <div class="page-header">
    <div>
      <h1 class="page-title">Gestión de Usuarios</h1>
      <p class="page-subtitle">{total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
    </div>
    {#if perms.agregar}
      <button class="btn btn-primary" onclick={abrirNuevo}>+ Nuevo Usuario</button>
    {/if}
  </div>

  {#if exito}<div class="alerta alerta-success">✅ {exito}</div>{/if}
  {#if error}<div class="alerta alerta-error">⚠️ {error}</div>{/if}

  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input type="text" placeholder="Buscar por nombre o correo..." oninput={onBuscar} />
  </div>

  <div class="tabla-container">
    {#if cargando}
      <div class="cargando">Cargando...</div>
    {:else if usuarios.length === 0}
      <div class="vacio">No se encontraron usuarios.</div>
    {:else}
      <table class="tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Perfil</th>
            <th>Celular</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each usuarios as u, i}
            <tr>
              <td>{(pagina - 1) * POR_PAGINA + i + 1}</td>
              <td>
                <div class="avatar-tabla">
                  {#if u.strImagenPerfil}
                    <img src={`${API_URL}/uploads/${u.strImagenPerfil}`} alt={u.strNombreUsuario} />
                  {:else}
                    {getIniciales(u.strNombreUsuario)}
                  {/if}
                </div>
              </td>
              <td><strong>{u.strNombreUsuario}</strong></td>
              <td>{u.strCorreo}</td>
              <td><span class="badge badge-perfil">{u.strNombrePerfil}</span></td>
              <td>{u.strNumeroCelular || '—'}</td>
              <td>
                <span class="badge {u.idEstadoUsuario ? 'badge-success' : 'badge-danger'}">
                  {u.idEstadoUsuario ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div class="acciones">
                  {#if perms.detalle}
                    <button class="btn-accion ver" onclick={() => abrirDetalle(u)} title="Ver">👁️</button>
                  {/if}
                  {#if perms.editar}
                    <button class="btn-accion editar" onclick={() => abrirEditar(u)} title="Editar">✏️</button>
                  {/if}
                  {#if perms.eliminar}
                    <button class="btn-accion eliminar" onclick={() => abrirEliminar(u)} title="Eliminar">🗑️</button>
                  {/if}
                  {#if !perms.detalle && !perms.editar && !perms.eliminar}
                    <span style="color:#BDBDBD; font-size:12px;">Sin acciones</span>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <Pagination
        pagina={pagina} total={total} porPagina={POR_PAGINA}
        onCambio={(p) => { pagina = p; cargar(); }}
      />
    {/if}
  </div>
</Layout>

{#if modalAbierto && (perms.agregar || perms.editar)}
  <div class="modal-overlay">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h3>{modoEditar ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h3>
        <button class="btn-cerrar" onclick={() => modalAbierto = false} aria-label="Cerrar">✕</button>
      </div>
      {#if formError}<div class="alerta alerta-error">⚠️ {formError}</div>{/if}

      <div class="imagen-section">
        <div class="imagen-preview">
          {#if imagenPreview}
            <img src={imagenPreview} alt="preview" />
          {:else}
            <span class="imagen-placeholder">📷</span>
          {/if}
        </div>
        <div class="imagen-info">
          <p class="imagen-titulo">Imagen de perfil</p>
          <p class="imagen-desc">JPG, PNG o WebP. Máximo 2MB.</p>
          <label class="btn-upload">
            📁 Seleccionar imagen
            <input type="file" accept="image/jpeg,image/png,image/webp" onchange={onImagenChange} style="display:none" />
          </label>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="unombre">Nombre completo *</label>
          <input id="unombre" type="text" class="form-control" placeholder="Nombre completo" bind:value={form.strNombreUsuario} />
        </div>
        <div class="form-group">
          <label for="ucorreo">Correo electrónico *</label>
          <input id="ucorreo" type="email" class="form-control" placeholder="correo@ejemplo.com" bind:value={form.strCorreo} />
        </div>
        <div class="form-group">
          <label for="ucel">Celular</label>
          <input id="ucel" type="text" class="form-control" placeholder="10 dígitos" bind:value={form.strNumeroCelular} maxlength="10" />
        </div>
        <div class="form-group">
          <label for="uperfil">Perfil *</label>
          <select id="uperfil" class="form-control" bind:value={form.idPerfil}>
            <option value="">-- Seleccionar perfil --</option>
            {#each perfiles as p}
              <option value={p.id}>{p.strNombrePerfil}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="upwd">Contraseña {modoEditar ? '(vacío = no cambiar)' : '*'}</label>
          <div class="input-pwd">
            <input id="upwd" type={mostrarPwd ? 'text' : 'password'} class="form-control" placeholder="••••••••" bind:value={form.strPwd} />
            <button type="button" class="toggle-pwd" onclick={() => mostrarPwd = !mostrarPwd}>{mostrarPwd ? '🙈' : '👁️'}</button>
          </div>
        </div>
        <div class="form-group">
          <label for="upwd2">Confirmar contraseña</label>
          <div class="input-pwd">
            <input id="upwd2" type={mostrarPwd2 ? 'text' : 'password'} class="form-control" placeholder="••••••••" bind:value={form.strPwdConfirm} />
            <button type="button" class="toggle-pwd" onclick={() => mostrarPwd2 = !mostrarPwd2}>{mostrarPwd2 ? '🙈' : '👁️'}</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <div class="toggle-wrap">
            <input type="checkbox" bind:checked={form.idEstadoUsuario} />
            <span class="toggle-slider"></span>
          </div>
          <div>
            <span class="toggle-text">Usuario Activo</span>
            <p class="toggle-desc">Los usuarios inactivos no pueden iniciar sesión.</p>
          </div>
        </label>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalAbierto = false}>Cancelar</button>
        <button class="btn btn-primary" onclick={guardar}>{modoEditar ? 'Actualizar' : 'Guardar Usuario'}</button>
      </div>
    </div>
  </div>
{/if}

{#if modalDetalle && usuarioSeleccionado && perms.detalle}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>👁️ Detalle del Usuario</h3>
        <button class="btn-cerrar" onclick={() => modalDetalle = false} aria-label="Cerrar">✕</button>
      </div>
      <div class="detalle-avatar">
        <div class="avatar-grande">
          {#if usuarioSeleccionado.strImagenPerfil}
            <img src={`${API_URL}/uploads/${usuarioSeleccionado.strImagenPerfil}`} alt="avatar" />
          {:else}
            {getIniciales(usuarioSeleccionado.strNombreUsuario)}
          {/if}
        </div>
        <div>
          <p class="detalle-nombre">{usuarioSeleccionado.strNombreUsuario}</p>
          <p class="detalle-correo">{usuarioSeleccionado.strCorreo}</p>
        </div>
      </div>
      <div class="detalle-grid">
        <div class="detalle-item"><span class="detalle-label">Perfil</span><span class="detalle-valor"><span class="badge badge-perfil">{usuarioSeleccionado.strNombrePerfil}</span></span></div>
        <div class="detalle-item"><span class="detalle-label">Celular</span><span class="detalle-valor">{usuarioSeleccionado.strNumeroCelular || '—'}</span></div>
        <div class="detalle-item">
          <span class="detalle-label">Estado</span>
          <span class="detalle-valor">
            <span class="badge {usuarioSeleccionado.idEstadoUsuario ? 'badge-success' : 'badge-danger'}">
              {usuarioSeleccionado.idEstadoUsuario ? 'Activo' : 'Inactivo'}
            </span>
          </span>
        </div>
        <div class="detalle-item"><span class="detalle-label">Registro</span><span class="detalle-valor">{formatFecha(usuarioSeleccionado.dtCreacion)}</span></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalDetalle = false}>Cerrar</button>
        {#if perms.editar}
          <button class="btn btn-primary" onclick={() => { modalDetalle = false; abrirEditar(usuarioSeleccionado); }}>Editar</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if modalEliminar && usuarioSeleccionado && perms.eliminar}
  <div class="modal-overlay">
    <div class="modal modal-sm">
      <div class="modal-header">
        <h3>🗑️ Eliminar Usuario</h3>
        <button class="btn-cerrar" onclick={() => modalEliminar = false} aria-label="Cerrar">✕</button>
      </div>
      <p class="eliminar-msg">¿Estás seguro de eliminar a <strong>"{usuarioSeleccionado.strNombreUsuario}"</strong>? Esta acción no se puede deshacer.</p>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalEliminar = false}>Cancelar</button>
        <button class="btn btn-danger" onclick={eliminar}>Eliminar</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .page-title { font-size: 20px; font-weight: 700; color: #4A0E1A; }
  .page-subtitle { font-size: 13px; color: #757575; margin-top: 2px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
  .btn-primary { background: #6B1A2A; color: white; }
  .btn-primary:hover { background: #4A0E1A; }
  .btn-secondary { background: #E0E0E0; color: #3A3A3A; }
  .btn-secondary:hover { background: #BDBDBD; }
  .btn-danger { background: #C62828; color: white; }
  .btn-danger:hover { background: #B71C1C; }
  .alerta { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .alerta-error { background: #FFEBEE; color: #C62828; border-left: 4px solid #C62828; }
  .alerta-success { background: #E8F5E9; color: #2E7D32; border-left: 4px solid #2E7D32; }
  .search-box { position: relative; margin-bottom: 16px; }
  .search-box input { width: 100%; padding: 9px 12px 9px 36px; border: 1px solid #E0E0E0; border-radius: 8px; font-size: 13px; font-family: inherit; background: white; }
  .search-box input:focus { outline: none; border-color: #6B1A2A; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; }
  .tabla-container { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
  .tabla { width: 100%; border-collapse: collapse; }
  .tabla th { background: #6B1A2A; color: white; padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; }
  .tabla td { padding: 10px 16px; border-bottom: 1px solid #F5F5F5; font-size: 13px; }
  .tabla tr:last-child td { border-bottom: none; }
  .tabla tr:hover td { background: #FBF5F6; }
  .avatar-tabla { width: 34px; height: 34px; border-radius: 50%; background: #6B1A2A; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; overflow: hidden; }
  .avatar-tabla img { width: 100%; height: 100%; object-fit: cover; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-success { background: #E8F5E9; color: #2E7D32; }
  .badge-danger { background: #FFEBEE; color: #C62828; }
  .badge-perfil { background: #F3E5F5; color: #6A1B9A; }
  .acciones { display: flex; gap: 6px; align-items: center; }
  .btn-accion { width: 30px; height: 30px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .btn-accion.ver { background: #E3F2FD; }
  .btn-accion.ver:hover { background: #1565C0; }
  .btn-accion.editar { background: #FFF8E1; }
  .btn-accion.editar:hover { background: #F9A825; }
  .btn-accion.eliminar { background: #FFEBEE; }
  .btn-accion.eliminar:hover { background: #C62828; }
  .cargando, .vacio { text-align: center; padding: 40px; color: #757575; font-size: 14px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
  .modal { background: white; border-radius: 12px; padding: 28px; width: 90%; max-width: 480px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
  .modal-lg { max-width: 620px; }
  .modal-sm { max-width: 380px; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #F0EEF0; }
  .modal-header h3 { font-size: 16px; color: #4A0E1A; font-weight: 700; }
  .btn-cerrar { background: none; border: none; font-size: 18px; cursor: pointer; color: #757575; padding: 2px 6px; border-radius: 4px; }
  .btn-cerrar:hover { background: #F5F5F5; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #F0EEF0; }
  .imagen-section { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 16px; background: #FAFAFA; border-radius: 10px; border: 1px solid #E0E0E0; }
  .imagen-preview { width: 72px; height: 72px; border-radius: 50%; background: #6B1A2A; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; flex-shrink: 0; }
  .imagen-preview img { width: 100%; height: 100%; object-fit: cover; }
  .imagen-titulo { font-size: 13px; font-weight: 600; color: #3A3A3A; margin-bottom: 2px; }
  .imagen-desc { font-size: 11px; color: #757575; margin-bottom: 8px; }
  .btn-upload { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #6B1A2A; color: white; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .form-group { margin-bottom: 12px; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
  .form-control { width: 100%; padding: 9px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 13px; font-family: inherit; background: white; }
  .form-control:focus { outline: none; border-color: #6B1A2A; }
  .input-pwd { position: relative; }
  .input-pwd .form-control { padding-right: 36px; }
  .toggle-pwd { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px; }
  .toggle-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; padding: 14px; border: 1.5px solid #E0E0E0; border-radius: 8px; background: #FAFAFA; }
  .toggle-wrap { position: relative; width: 44px; height: 24px; flex-shrink: 0; margin-top: 2px; }
  .toggle-wrap input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-slider { position: absolute; inset: 0; background: #E0E0E0; border-radius: 24px; transition: 0.2s; cursor: pointer; }
  .toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 0.2s; }
  .toggle-wrap input:checked + .toggle-slider { background: #6B1A2A; }
  .toggle-wrap input:checked + .toggle-slider::before { transform: translateX(20px); }
  .toggle-text { font-size: 13px; font-weight: 600; color: #3A3A3A; }
  .toggle-desc { font-size: 12px; color: #757575; margin-top: 2px; }
  .detalle-avatar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding: 16px; background: #FBF5F6; border-radius: 10px; }
  .avatar-grande { width: 56px; height: 56px; border-radius: 50%; background: #6B1A2A; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; overflow: hidden; flex-shrink: 0; }
  .avatar-grande img { width: 100%; height: 100%; object-fit: cover; }
  .detalle-nombre { font-size: 15px; font-weight: 700; color: #4A0E1A; }
  .detalle-correo { font-size: 12px; color: #757575; margin-top: 2px; }
  .detalle-grid { display: flex; flex-direction: column; gap: 10px; }
  .detalle-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #FAFAFA; border-radius: 8px; }
  .detalle-label { font-size: 12px; color: #757575; font-weight: 600; text-transform: uppercase; }
  .detalle-valor { font-size: 13px; color: #3A3A3A; font-weight: 500; }
  .eliminar-msg { font-size: 14px; color: #4A4A4A; line-height: 1.6; margin-bottom: 8px; }
</style>