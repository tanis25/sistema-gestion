<script>
  import { onMount } from 'svelte';
  import Layout from '../../lib/components/Layout.svelte';
  import Breadcrumb from '../../lib/components/Breadcrumb.svelte';
  import { token } from '../../lib/stores/auth.js';
  import { misPermisos, esAdmin, getPermisos } from '../../lib/stores/permisos.js';
  import { navegar } from '../../lib/navegador.js';

  let perfiles = $state([]);
  let perfilSeleccionado = $state('');
  let permisos = $state([]);
  let perfilInfo = $state(null);
  let cargando = $state(false);
  let guardando = $state(false);
  let error = $state('');
  let exito = $state('');
  let cambios = $state(false);

  let tokenVal = '';
  token.subscribe(t => tokenVal = t);

  let permisosVal = $state([]);
  let esAdminVal = $state(false);
  misPermisos.subscribe(v => permisosVal = v);
  esAdmin.subscribe(v => esAdminVal = v);
  let perms = $derived(getPermisos(permisosVal, esAdminVal, 'Permisos-Perfil'));

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenVal}`
  });

  async function cargarPerfiles() {
    try {
      const res = await fetch(`/api/permisos`, { headers: headers() });
      if (res.status === 401 || res.status === 403) { navegar('/login'); return; }
      perfiles = await res.json();
    } catch { error = 'Error al cargar perfiles.'; }
  }

  async function cargarPermisos() {
    if (!perfilSeleccionado) { permisos = []; perfilInfo = null; return; }
    cargando = true; error = ''; cambios = false;
    perfilInfo = perfiles.find(p => p.id == perfilSeleccionado);
    try {
      const res = await fetch(`/api/permisos/${perfilSeleccionado}`, { headers: headers() });
      const data = await res.json();
      permisos = data;
    } catch { error = 'Error al cargar permisos.'; }
    finally { cargando = false; }
  }

  onMount(cargarPerfiles);

  function onPerfilChange(e) {
    perfilSeleccionado = e.target.value;
    cargarPermisos();
  }

  function togglePermiso(idx, campo) {
    if (!perms.editar) return;
    permisos[idx][campo] = !permisos[idx][campo];
    cambios = true;
  }

  function toggleTodoModulo(idx, valor) {
    if (!perms.editar) return;
    const campos = ['bitAgregar', 'bitEditar', 'bitConsulta', 'bitEliminar', 'bitDetalle'];
    campos.forEach(c => permisos[idx][c] = valor);
    cambios = true;
  }

  function todosMarcados(permiso) {
    return permiso.bitAgregar && permiso.bitEditar &&
           permiso.bitConsulta && permiso.bitEliminar && permiso.bitDetalle;
  }

  function toggleColumna(campo) {
    if (!perms.editar) return;
    const todosActivos = permisos.every(p => p[campo]);
    permisos.forEach(p => p[campo] = !todosActivos);
    permisos = [...permisos];
    cambios = true;
  }

  async function guardar() {
    if (!perms.editar) return;
    guardando = true; error = '';
    try {
      const res = await fetch(`/api/permisos/${perfilSeleccionado}`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ permisos })
      });
      const data = await res.json();
      if (!res.ok) { error = data.error; return; }
      exito = 'Permisos guardados correctamente.';
      cambios = false;
      setTimeout(() => exito = '', 3000);
    } catch { error = 'Error al guardar permisos.'; }
    finally { guardando = false; }
  }
</script>

<Layout>
  <Breadcrumb items={[{ label: 'Seguridad' }, { label: 'Permisos-Perfil' }]} />

  <div class="page-header">
    <div>
      <h1 class="page-title">Gestión de Permisos</h1>
      <p class="page-subtitle">Administra los permisos por perfil y módulo</p>
    </div>
  </div>

  {#if exito}<div class="alerta alerta-success">✅ {exito}</div>{/if}
  {#if error}<div class="alerta alerta-error">⚠️ {error}</div>{/if}

  {#if !perms.consulta && !perms.editar}
    <div class="alerta alerta-error">⚠️ No tienes permiso para ver esta sección.</div>
  {:else}
    <div class="card selector-card">
      <label class="selector-label" for="perfil-select">Seleccionar Perfil</label>
      <select id="perfil-select" class="form-control selector-select" onchange={onPerfilChange} value={perfilSeleccionado}>
        <option value="">-- Seleccionar perfil --</option>
        {#each perfiles as p}
          <option value={p.id}>{p.strNombrePerfil} {p.bitAdministrador ? '★ (Administrador)' : ''}</option>
        {/each}
      </select>
    </div>

    {#if perfilSeleccionado}
      {#if perfilInfo?.bitAdministrador}
        <div class="admin-aviso">
          <span class="admin-icono">🛡️</span>
          <div>
            <p class="admin-titulo">Perfil Administrador</p>
            <p class="admin-desc">Los perfiles administradores tienen acceso completo a todos los módulos de forma predeterminada.</p>
          </div>
        </div>
      {/if}

      <div class="tabla-container">
        {#if cargando}
          <div class="cargando">Cargando permisos...</div>
        {:else if permisos.length === 0}
          <div class="vacio">No hay módulos disponibles.</div>
        {:else}
          <table class="tabla-permisos">
            <thead>
              <tr>
                <th class="th-modulo">Módulo</th>
                <th class="th-permiso">
                  <button class="th-btn" onclick={() => toggleColumna('bitAgregar')} disabled={perfilInfo?.bitAdministrador || !perms.editar}>Agregar</button>
                </th>
                <th class="th-permiso">
                  <button class="th-btn" onclick={() => toggleColumna('bitEditar')} disabled={perfilInfo?.bitAdministrador || !perms.editar}>Editar</button>
                </th>
                <th class="th-permiso">
                  <button class="th-btn" onclick={() => toggleColumna('bitEliminar')} disabled={perfilInfo?.bitAdministrador || !perms.editar}>Eliminar</button>
                </th>
                <th class="th-permiso">
                  <button class="th-btn" onclick={() => toggleColumna('bitConsulta')} disabled={perfilInfo?.bitAdministrador || !perms.editar}>Consultar</button>
                </th>
                <th class="th-permiso">
                  <button class="th-btn" onclick={() => toggleColumna('bitDetalle')} disabled={perfilInfo?.bitAdministrador || !perms.editar}>Detalle</button>
                </th>
                <th class="th-permiso">Todo</th>
              </tr>
            </thead>
            <tbody>
              {#each permisos as permiso, idx}
                <tr class:tr-admin={perfilInfo?.bitAdministrador}>
                  <td class="td-modulo">
                    <span class="modulo-nombre">{permiso.strNombreModulo}</span>
                  </td>
                  {#each ['bitAgregar', 'bitEditar', 'bitEliminar', 'bitConsulta', 'bitDetalle'] as campo}
                    <td class="td-check">
                      {#if perfilInfo?.bitAdministrador}
                        <span class="check-admin">✅</span>
                      {:else}
                        <button
                          class="check-btn {permiso[campo] ? 'activo' : ''}"
                          onclick={() => togglePermiso(idx, campo)}
                          disabled={!perms.editar}
                          aria-label="Toggle {campo}"
                        >{#if permiso[campo]}✓{/if}</button>
                      {/if}
                    </td>
                  {/each}
                  <td class="td-check">
                    {#if !perfilInfo?.bitAdministrador}
                      <button
                        class="check-todo {todosMarcados(permiso) ? 'activo' : ''}"
                        onclick={() => toggleTodoModulo(idx, !todosMarcados(permiso))}
                        disabled={!perms.editar}
                        aria-label="Toggle todo"
                      >{todosMarcados(permiso) ? '✓' : ''}</button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          {#if !perfilInfo?.bitAdministrador && perms.editar}
            <div class="guardar-bar">
              {#if cambios}
                <span class="cambios-aviso">⚠️ Tienes cambios sin guardar</span>
              {:else}
                <span class="sin-cambios">✓ Sin cambios pendientes</span>
              {/if}
              <button class="btn btn-primary" onclick={guardar} disabled={!cambios || guardando}>
                {guardando ? 'Guardando...' : '💾 Guardar Permisos'}
              </button>
            </div>
          {/if}
        {/if}
      </div>
    {:else}
      <div class="vacio-seleccion">
        <span class="vacio-icono">🔑</span>
        <p>Selecciona un perfil para ver y editar sus permisos.</p>
      </div>
    {/if}
  {/if}
</Layout>

<style>
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .page-title { font-size: 20px; font-weight: 700; color: #4A0E1A; }
  .page-subtitle { font-size: 13px; color: #757575; margin-top: 2px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
  .btn-primary { background: #6B1A2A; color: white; }
  .btn-primary:hover:not(:disabled) { background: #4A0E1A; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .alerta { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .alerta-error { background: #FFEBEE; color: #C62828; border-left: 4px solid #C62828; }
  .alerta-success { background: #E8F5E9; color: #2E7D32; border-left: 4px solid #2E7D32; }
  .card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 20px; }
  .selector-card { margin-bottom: 20px; }
  .selector-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 8px; }
  .selector-select { max-width: 360px; padding: 9px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 13px; font-family: inherit; background: white; }
  .selector-select:focus { outline: none; border-color: #6B1A2A; }
  .admin-aviso { display: flex; align-items: flex-start; gap: 14px; background: #EDE7F6; border: 1px solid #9575CD; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .admin-icono { font-size: 24px; flex-shrink: 0; }
  .admin-titulo { font-size: 14px; font-weight: 700; color: #4527A0; margin-bottom: 4px; }
  .admin-desc { font-size: 12px; color: #5E35B1; line-height: 1.5; }
  .tabla-container { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
  .tabla-permisos { width: 100%; border-collapse: collapse; }
  .tabla-permisos thead tr { background: #6B1A2A; }
  .th-modulo { padding: 12px 20px; color: white; font-size: 13px; font-weight: 600; text-align: left; width: 35%; }
  .th-permiso { padding: 8px; text-align: center; }
  .th-btn { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
  .th-btn:hover:not(:disabled) { background: rgba(255,255,255,0.3); }
  .th-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .td-modulo { padding: 12px 20px; border-bottom: 1px solid #F5F5F5; }
  .modulo-nombre { font-size: 13px; font-weight: 500; color: #3A3A3A; }
  .td-check { padding: 10px 8px; text-align: center; border-bottom: 1px solid #F5F5F5; }
  .tabla-permisos tbody tr:last-child td { border-bottom: none; }
  .tabla-permisos tbody tr:hover td { background: #FBF5F6; }
  .tr-admin td { background: #F8F4FF !important; }
  .check-btn { width: 26px; height: 26px; border: 2px solid #E0E0E0; border-radius: 6px; background: white; cursor: pointer; font-size: 14px; font-weight: 700; color: #6B1A2A; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .check-btn.activo { background: #6B1A2A; border-color: #6B1A2A; color: white; }
  .check-btn:hover:not(.activo):not(:disabled) { border-color: #6B1A2A; background: #FBF5F6; }
  .check-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .check-todo { width: 26px; height: 26px; border: 2px solid #C9A84C; border-radius: 6px; background: white; cursor: pointer; font-size: 14px; font-weight: 700; color: #C9A84C; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .check-todo.activo { background: #C9A84C; border-color: #C9A84C; color: white; }
  .check-todo:disabled { opacity: 0.5; cursor: not-allowed; }
  .check-admin { font-size: 16px; opacity: 0.7; }
  .guardar-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid #F0EEF0; background: #FAFAFA; }
  .cambios-aviso { font-size: 13px; color: #F57F17; font-weight: 500; }
  .sin-cambios { font-size: 13px; color: #757575; }
  .vacio-seleccion { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .vacio-icono { font-size: 48px; display: block; margin-bottom: 12px; opacity: 0.4; }
  .vacio-seleccion p { font-size: 14px; color: #757575; }
  .cargando, .vacio { text-align: center; padding: 40px; color: #757575; font-size: 14px; }
  .form-control { display: block; width: 100%; padding: 9px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 13px; font-family: inherit; }
  .form-control:focus { outline: none; border-color: #6B1A2A; }
</style>