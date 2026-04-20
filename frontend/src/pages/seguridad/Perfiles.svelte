<script>
  import { onMount } from 'svelte';
  import Layout from '../../lib/components/Layout.svelte';
  import Breadcrumb from '../../lib/components/Breadcrumb.svelte';
  import Pagination from '../../lib/components/Pagination.svelte';
  import { token } from '../../lib/stores/auth.js';
  import { misPermisos, esAdmin, getPermisos } from '../../lib/stores/permisos.js';
  import { navegar } from '../../lib/navegador.js';
  import { API_URL } from '../../lib/config.js';

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
  let perfilSeleccionado = $state(null);
  let form = $state({ strNombrePerfil: '', bitAdministrador: false });
  let formError = $state('');

  const POR_PAGINA = 5;
  let tokenVal = '';
  token.subscribe(t => tokenVal = t);

  let permisosVal = $state([]);
  let esAdminVal = $state(false);
  misPermisos.subscribe(v => permisosVal = v);
  esAdmin.subscribe(v => esAdminVal = v);
  let perms = $derived(getPermisos(permisosVal, esAdminVal, 'Perfil'));

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenVal}`
  });

  async function cargar() {
    cargando = true; error = '';
    try {
      const res = await fetch(
        `${API_URL}/api/perfiles?pagina=${pagina}&limite=${POR_PAGINA}&buscar=${buscar}`,
        { headers: headers() }
      );
      if (res.status === 401 || res.status === 403) { navegar('/login'); return; }
      const data = await res.json();
      perfiles = data.datos;
      total = data.total;
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

  function abrirNuevo() {
    modoEditar = false;
    form = { strNombrePerfil: '', bitAdministrador: false };
    formError = ''; modalAbierto = true;
  }

  function abrirEditar(perfil) {
    modoEditar = true; perfilSeleccionado = perfil;
    form = { strNombrePerfil: perfil.strNombrePerfil, bitAdministrador: perfil.bitAdministrador };
    formError = ''; modalAbierto = true;
  }

  function abrirDetalle(perfil) { perfilSeleccionado = perfil; modalDetalle = true; }
  function abrirEliminar(perfil) { perfilSeleccionado = perfil; modalEliminar = true; }

  async function guardar() {
    formError = '';
    if (!form.strNombrePerfil.trim()) { formError = 'El nombre es requerido.'; return; }
    try {
      const url = modoEditar
        ? `${API_URL}/api/perfiles/${perfilSeleccionado.id}`
        : `${API_URL}/api/perfiles`;
      const res = await fetch(url, {
        method: modoEditar ? 'PUT' : 'POST',
        headers: headers(), body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { formError = data.error; return; }
      exito = modoEditar ? 'Perfil actualizado.' : 'Perfil creado.';
      modalAbierto = false; cargar();
      setTimeout(() => exito = '', 3000);
    } catch { formError = 'Error al guardar.'; }
  }

  async function eliminar() {
    try {
      const res = await fetch(
        `${API_URL}/api/perfiles/${perfilSeleccionado.id}`,
        { method: 'DELETE', headers: headers() }
      );
      const data = await res.json();
      if (!res.ok) { error = data.error; modalEliminar = false; return; }
      exito = 'Perfil eliminado.';
      modalEliminar = false;
      if (perfiles.length === 1 && pagina > 1) pagina--;
      cargar(); setTimeout(() => exito = '', 3000);
    } catch { error = 'Error al eliminar.'; }
  }

  function formatFecha(f) {
    return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<Layout>
  <Breadcrumb items={[{ label: 'Seguridad' }, { label: 'Perfiles' }]} />

  <div class="page-header">
    <div>
      <h1 class="page-title">Gestión de Perfiles</h1>
      <p class="page-subtitle">{total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
    </div>
    {#if perms.agregar}
      <button class="btn btn-primary" onclick={abrirNuevo}>+ Nuevo Perfil</button>
    {/if}
  </div>

  {#if exito}<div class="alerta alerta-success">✅ {exito}</div>{/if}
  {#if error}<div class="alerta alerta-error">⚠️ {error}</div>{/if}

  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input type="text" placeholder="Buscar por nombre... (búsqueda automática)" oninput={onBuscar} />
  </div>

  <div class="tabla-container">
    {#if cargando}
      <div class="cargando">Cargando...</div>
    {:else if perfiles.length === 0}
      <div class="vacio">No se encontraron perfiles.</div>
    {:else}
      <table class="tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre Perfil</th>
            <th>Administrador</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each perfiles as perfil, i}
            <tr>
              <td>{(pagina - 1) * POR_PAGINA + i + 1}</td>
              <td><strong>{perfil.strNombrePerfil}</strong></td>
              <td>
                <span class="badge {perfil.bitAdministrador ? 'badge-success' : 'badge-info'}">
                  {perfil.bitAdministrador ? 'Sí' : 'No'}
                </span>
              </td>
              <td>{formatFecha(perfil.dtCreacion)}</td>
              <td>
                <div class="acciones">
                  {#if perms.detalle}
                    <button class="btn-accion ver" onclick={() => abrirDetalle(perfil)} title="Ver detalle">👁️</button>
                  {/if}
                  {#if perms.editar}
                    <button class="btn-accion editar" onclick={() => abrirEditar(perfil)} title="Editar">✏️</button>
                  {/if}
                  {#if perms.eliminar}
                    <button class="btn-accion eliminar" onclick={() => abrirEliminar(perfil)} title="Eliminar">🗑️</button>
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
    <div class="modal">
      <div class="modal-header">
        <h3>{modoEditar ? '✏️ Editar Perfil' : '➕ Nuevo Perfil'}</h3>
        <button class="btn-cerrar" onclick={() => modalAbierto = false} aria-label="Cerrar">✕</button>
      </div>
      {#if formError}<div class="alerta alerta-error">⚠️ {formError}</div>{/if}
      <div class="form-group">
        <label for="nombre">Nombre del Perfil *</label>
        <input id="nombre" type="text" class="form-control"
          placeholder="Nombre del perfil" bind:value={form.strNombrePerfil} maxlength="100" />
      </div>
      <div class="form-group">
        <label class="toggle-label">
          <div class="toggle-wrap">
            <input type="checkbox" bind:checked={form.bitAdministrador} />
            <span class="toggle-slider"></span>
          </div>
          <div>
            <span class="toggle-text">Perfil Administrador</span>
            <p class="toggle-desc">Los administradores tienen acceso completo al sistema.</p>
          </div>
        </label>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalAbierto = false}>Cancelar</button>
        <button class="btn btn-primary" onclick={guardar}>{modoEditar ? 'Actualizar' : 'Guardar'}</button>
      </div>
    </div>
  </div>
{/if}

{#if modalDetalle && perfilSeleccionado && perms.detalle}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>👁️ Detalle del Perfil</h3>
        <button class="btn-cerrar" onclick={() => modalDetalle = false} aria-label="Cerrar">✕</button>
      </div>
      <div class="detalle-grid">
        <div class="detalle-item">
          <span class="detalle-label">ID</span>
          <span class="detalle-valor">#{perfilSeleccionado.id}</span>
        </div>
        <div class="detalle-item">
          <span class="detalle-label">Nombre</span>
          <span class="detalle-valor">{perfilSeleccionado.strNombrePerfil}</span>
        </div>
        <div class="detalle-item">
          <span class="detalle-label">Administrador</span>
          <span class="detalle-valor">
            <span class="badge {perfilSeleccionado.bitAdministrador ? 'badge-success' : 'badge-info'}">
              {perfilSeleccionado.bitAdministrador ? 'Sí' : 'No'}
            </span>
          </span>
        </div>
        <div class="detalle-item">
          <span class="detalle-label">Creado</span>
          <span class="detalle-valor">{formatFecha(perfilSeleccionado.dtCreacion)}</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalDetalle = false}>Cerrar</button>
        {#if perms.editar}
          <button class="btn btn-primary" onclick={() => { modalDetalle = false; abrirEditar(perfilSeleccionado); }}>Editar</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if modalEliminar && perfilSeleccionado && perms.eliminar}
  <div class="modal-overlay">
    <div class="modal modal-sm">
      <div class="modal-header">
        <h3>🗑️ Eliminar Perfil</h3>
        <button class="btn-cerrar" onclick={() => modalEliminar = false} aria-label="Cerrar">✕</button>
      </div>
      <p class="eliminar-msg">
        ¿Estás seguro de eliminar el perfil <strong>"{perfilSeleccionado.strNombrePerfil}"</strong>?
        Esta acción no se puede deshacer.
      </p>
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
  .tabla td { padding: 11px 16px; border-bottom: 1px solid #F5F5F5; font-size: 13px; }
  .tabla tr:last-child td { border-bottom: none; }
  .tabla tr:hover td { background: #FBF5F6; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-success { background: #E8F5E9; color: #2E7D32; }
  .badge-info { background: #E3F2FD; color: #1565C0; }
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
  .modal { background: white; border-radius: 12px; padding: 28px; width: 90%; max-width: 480px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
  .modal-sm { max-width: 380px; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #F0EEF0; }
  .modal-header h3 { font-size: 16px; color: #4A0E1A; font-weight: 700; }
  .btn-cerrar { background: none; border: none; font-size: 18px; cursor: pointer; color: #757575; padding: 2px 6px; border-radius: 4px; }
  .btn-cerrar:hover { background: #F5F5F5; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #F0EEF0; }
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
  .form-control { width: 100%; padding: 9px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 13px; font-family: inherit; transition: border 0.2s; }
  .form-control:focus { outline: none; border-color: #6B1A2A; }
  .toggle-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; padding: 14px; border: 1.5px solid #E0E0E0; border-radius: 8px; background: #FAFAFA; }
  .toggle-wrap { position: relative; width: 44px; height: 24px; flex-shrink: 0; margin-top: 2px; }
  .toggle-wrap input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-slider { position: absolute; inset: 0; background: #E0E0E0; border-radius: 24px; transition: 0.2s; cursor: pointer; }
  .toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 0.2s; }
  .toggle-wrap input:checked + .toggle-slider { background: #6B1A2A; }
  .toggle-wrap input:checked + .toggle-slider::before { transform: translateX(20px); }
  .toggle-text { font-size: 13px; font-weight: 600; color: #3A3A3A; }
  .toggle-desc { font-size: 12px; color: #757575; margin-top: 2px; }
  .detalle-grid { display: flex; flex-direction: column; gap: 12px; }
  .detalle-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #FAFAFA; border-radius: 8px; }
  .detalle-label { font-size: 12px; color: #757575; font-weight: 600; text-transform: uppercase; }
  .detalle-valor { font-size: 13px; color: #3A3A3A; font-weight: 500; }
  .eliminar-msg { font-size: 14px; color: #4A4A4A; line-height: 1.6; margin-bottom: 8px; }
</style>