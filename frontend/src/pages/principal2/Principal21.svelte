<script>
  import Layout from '../../lib/components/Layout.svelte';
  import Breadcrumb from '../../lib/components/Breadcrumb.svelte';
  import { misPermisos, esAdmin, getPermisos } from '../../lib/stores/permisos.js';

  let permisosVal = $state([]);
  let esAdminVal = $state(false);
  misPermisos.subscribe(v => permisosVal = v);
  esAdmin.subscribe(v => esAdminVal = v);
  let perms = $derived(getPermisos(permisosVal, esAdminVal, 'Principal 2.1'));

  let modalAbierto = $state(false);
  let modalEditar = $state(false);
  let modalEliminar = $state(false);
  let modalDetalle = $state(false);

  const datos = [
    { id: 1, nombre: 'Registro Eta', descripcion: 'Descripción del registro eta', estado: 'Activo', fecha: '2026-01-20' },
    { id: 2, nombre: 'Registro Theta', descripcion: 'Descripción del registro theta', estado: 'Activo', fecha: '2026-02-25' },
    { id: 3, nombre: 'Registro Iota', descripcion: 'Descripción del registro iota', estado: 'Inactivo', fecha: '2026-03-18' },
  ];

  let itemSeleccionado = $state(null);
  let form = $state({ nombre: '', descripcion: '', estado: 'Activo' });
</script>

<Layout>
  <Breadcrumb items={[{ label: 'Principal 2' }, { label: 'Principal 2.1' }]} />

  <div class="page-header">
    <div>
      <h1 class="page-title">Principal 2.1</h1>
      <p class="page-subtitle">Módulo de gestión — Vista estática</p>
    </div>
    {#if perms.agregar}
      <button class="btn btn-primary" onclick={() => modalAbierto = true}>+ Nuevo Registro</button>
    {/if}
  </div>

  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input type="text" placeholder="Buscar registro..." />
  </div>

  <div class="tabla-container">
    <table class="tabla">
      <thead>
        <tr>
          <th>#</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each datos as item, i}
          <tr>
            <td>{i + 1}</td>
            <td><strong>{item.nombre}</strong></td>
            <td>{item.descripcion}</td>
            <td><span class="badge {item.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">{item.estado}</span></td>
            <td>{item.fecha}</td>
            <td>
              <div class="acciones">
                {#if perms.detalle}
                  <button class="btn-accion ver" onclick={() => { itemSeleccionado = item; modalDetalle = true; }} title="Ver">👁️</button>
                {/if}
                {#if perms.editar}
                  <button class="btn-accion editar" onclick={() => { itemSeleccionado = item; form = { nombre: item.nombre, descripcion: item.descripcion, estado: item.estado }; modalEditar = true; }} title="Editar">✏️</button>
                {/if}
                {#if perms.eliminar}
                  <button class="btn-accion eliminar" onclick={() => { itemSeleccionado = item; modalEliminar = true; }} title="Eliminar">🗑️</button>
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
    <div class="paginacion">
      <span class="pag-info">Mostrando 1–3 de 3</span>
      <div class="pag-botones">
        <button disabled>«</button>
        <button disabled>‹</button>
        <span class="pag-num">Página 1 de 1</span>
        <button disabled>›</button>
        <button disabled>»</button>
      </div>
    </div>
  </div>
</Layout>

{#if modalAbierto && perms.agregar}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>➕ Nuevo Registro</h3>
        <button class="btn-cerrar" onclick={() => modalAbierto = false} aria-label="Cerrar">✕</button>
      </div>
      <div class="form-group">
        <label for="p21nombre">Nombre *</label>
        <input id="p21nombre" type="text" class="form-control" placeholder="Nombre del registro" bind:value={form.nombre} />
      </div>
      <div class="form-group">
        <label for="p21desc">Descripción</label>
        <textarea id="p21desc" class="form-control" rows="3" bind:value={form.descripcion} minlength="50"></textarea>
      </div>
      <div class="form-group">
        <label for="p21estado">Estado</label>
        <select id="p21estado" class="form-control" bind:value={form.estado}>
          <option>Activo</option><option>Inactivo</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalAbierto = false}>Cancelar</button>
        <button class="btn btn-primary" onclick={() => modalAbierto = false}>Guardar</button>
      </div>
    </div>
  </div>
{/if}

{#if modalEditar && itemSeleccionado && perms.editar}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>✏️ Editar Registro</h3>
        <button class="btn-cerrar" onclick={() => modalEditar = false} aria-label="Cerrar">✕</button>
      </div>
      <div class="form-group">
        <label for="p21enombre">Nombre *</label>
        <input id="p21enombre" type="text" class="form-control" bind:value={form.nombre} />
      </div>
      <div class="form-group">
        <label for="p21edesc">Descripción</label>
        <textarea id="p21edesc" class="form-control" rows="3" bind:value={form.descripcion} minlength="50"></textarea>
      </div>
      <div class="form-group">
        <label for="p21eestado">Estado</label>
        <select id="p21eestado" class="form-control" bind:value={form.estado}>
          <option>Activo</option><option>Inactivo</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalEditar = false}>Cancelar</button>
        <button class="btn btn-primary" onclick={() => modalEditar = false}>Actualizar</button>
      </div>
    </div>
  </div>
{/if}

{#if modalDetalle && itemSeleccionado && perms.detalle}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>👁️ Detalle del Registro</h3>
        <button class="btn-cerrar" onclick={() => modalDetalle = false} aria-label="Cerrar">✕</button>
      </div>
      <div class="detalle-grid">
        <div class="detalle-item"><span class="detalle-label">ID</span><span class="detalle-valor">#{itemSeleccionado.id}</span></div>
        <div class="detalle-item"><span class="detalle-label">Nombre</span><span class="detalle-valor">{itemSeleccionado.nombre}</span></div>
        <div class="detalle-item"><span class="detalle-label">Descripción</span><span class="detalle-valor">{itemSeleccionado.descripcion}</span></div>
        <div class="detalle-item"><span class="detalle-label">Estado</span><span class="detalle-valor"><span class="badge {itemSeleccionado.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">{itemSeleccionado.estado}</span></span></div>
        <div class="detalle-item"><span class="detalle-label">Fecha</span><span class="detalle-valor">{itemSeleccionado.fecha}</span></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalDetalle = false}>Cerrar</button>
        {#if perms.editar}
          <button class="btn btn-primary" onclick={() => { modalDetalle = false; form = { nombre: itemSeleccionado.nombre, descripcion: itemSeleccionado.descripcion, estado: itemSeleccionado.estado }; modalEditar = true; }}>Editar</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if modalEliminar && itemSeleccionado && perms.eliminar}
  <div class="modal-overlay">
    <div class="modal modal-sm">
      <div class="modal-header">
        <h3>🗑️ Eliminar Registro</h3>
        <button class="btn-cerrar" onclick={() => modalEliminar = false} aria-label="Cerrar">✕</button>
      </div>
      <p class="eliminar-msg">¿Estás seguro de eliminar <strong>"{itemSeleccionado.nombre}"</strong>?</p>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => modalEliminar = false}>Cancelar</button>
        <button class="btn btn-danger" onclick={() => modalEliminar = false}>Eliminar</button>
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
  .badge-danger { background: #FFEBEE; color: #C62828; }
  .acciones { display: flex; gap: 6px; align-items: center; }
  .btn-accion { width: 30px; height: 30px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .btn-accion.ver { background: #E3F2FD; }
  .btn-accion.ver:hover { background: #1565C0; }
  .btn-accion.editar { background: #FFF8E1; }
  .btn-accion.editar:hover { background: #F9A825; }
  .btn-accion.eliminar { background: #FFEBEE; }
  .btn-accion.eliminar:hover { background: #C62828; }
  .paginacion { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid #F0EEF0; flex-wrap: wrap; gap: 8px; }
  .pag-info { font-size: 12px; color: #757575; }
  .pag-botones { display: flex; align-items: center; gap: 4px; }
  .pag-botones button { width: 32px; height: 32px; border: 1px solid #E0E0E0; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
  .pag-botones button:disabled { opacity: 0.35; cursor: not-allowed; }
  .pag-num { font-size: 12px; color: #4A4A4A; padding: 0 8px; font-weight: 500; white-space: nowrap; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
  .modal { background: white; border-radius: 12px; padding: 28px; width: 90%; max-width: 480px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
  .modal-sm { max-width: 380px; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #F0EEF0; }
  .modal-header h3 { font-size: 16px; color: #4A0E1A; font-weight: 700; }
  .btn-cerrar { background: none; border: none; font-size: 18px; cursor: pointer; color: #757575; padding: 2px 6px; border-radius: 4px; }
  .btn-cerrar:hover { background: #F5F5F5; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #F0EEF0; }
  .form-group { margin-bottom: 14px; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
  .form-control { width: 100%; padding: 9px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 13px; font-family: inherit; }
  .form-control:focus { outline: none; border-color: #6B1A2A; }
  .detalle-grid { display: flex; flex-direction: column; gap: 10px; }
  .detalle-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #FAFAFA; border-radius: 8px; }
  .detalle-label { font-size: 12px; color: #757575; font-weight: 600; text-transform: uppercase; }
  .detalle-valor { font-size: 13px; color: #3A3A3A; font-weight: 500; }
  .eliminar-msg { font-size: 14px; color: #4A4A4A; line-height: 1.6; margin-bottom: 8px; }
</style>