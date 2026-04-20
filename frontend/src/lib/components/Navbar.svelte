<script>
  import { navegar } from '../../lib/navegador.js';
  import { usuario, logout } from '../../lib/stores/auth.js';
  import { misPermisos, esAdmin, tieneAccesoModulo } from '../../lib/stores/permisos.js';
  import { menusDinamicos, moduloARuta } from '../../lib/stores/menus.js';
  import { API_URL } from '../config.js';

  let menuAbierto = $state('');
  let perfilAbierto = $state(false);

  const menuSeguridad = {
    id: 'seguridad',
    label: 'Seguridad',
    icono: '🔐',
    items: [
      { label: 'Perfiles', modulo: 'Perfil', ruta: '/seguridad/perfiles' },
      { label: 'Módulos', modulo: 'Modulo', ruta: '/seguridad/modulos' },
      { label: 'Permisos-Perfil', modulo: 'Permisos-Perfil', ruta: '/seguridad/permisos' },
      { label: 'Usuarios', modulo: 'Usuario', ruta: '/seguridad/usuarios' },
    ]
  };

  const iconosMenuFijos = { 1: '🔐', 2: '📋', 3: '📊' };
  const labelsMenuFijos = { 1: 'Seguridad', 2: 'Principal 1', 3: 'Principal 2' };

  function getLabelMenu(idMenu, items) {
    if (labelsMenuFijos[idMenu]) return labelsMenuFijos[idMenu];
    // Para menús nuevos usa el nombre del primer módulo como título del menú
    return items[0]?.label || `Menú ${idMenu}`;
  }

  function getIconoMenu(idMenu) {
    if (iconosMenuFijos[idMenu]) return iconosMenuFijos[idMenu];
    return '📁';
  }

  let menusDinamicosVal = $state([]);
  menusDinamicos.subscribe(v => menusDinamicosVal = v);

  let menuConfig = $derived.by(() => {
    const menus = [menuSeguridad];
    const grupos = {};

    menusDinamicosVal
      .filter(m => m.idMenu !== 1)
      .forEach(m => {
        if (!grupos[m.idMenu]) grupos[m.idMenu] = [];
        grupos[m.idMenu].push({
          label: m.strNombreModulo,
          modulo: m.strNombreModulo,
          ruta: moduloARuta(m.strNombreModulo)
        });
      });

    Object.keys(grupos)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(idMenu => {
        const items = grupos[idMenu];
        menus.push({
          id: `menu_${idMenu}`,
          label: getLabelMenu(parseInt(idMenu), items),
          icono: getIconoMenu(parseInt(idMenu)),
          items
        });
      });

    return menus;
  });

  let menusVisibles = $derived.by(() => {
    if ($esAdmin) return menuConfig;
    return menuConfig
      .map(menu => ({
        ...menu,
        items: menu.items.filter(item =>
          tieneAccesoModulo($misPermisos, item.modulo)
        )
      }))
      .filter(menu => menu.items.length > 0);
  });

  function toggleMenu(id) {
    menuAbierto = menuAbierto === id ? '' : id;
    perfilAbierto = false;
  }

  function irA(ruta) {
    navegar(ruta);
    menuAbierto = '';
    perfilAbierto = false;
  }

  function cerrarSesion() {
    logout();
    navegar('/login');
  }

  function cerrarTodo() {
    menuAbierto = '';
    perfilAbierto = false;
  }

  function getIniciales(nombre) {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
</script>

{#if menuAbierto || perfilAbierto}
  <button class="overlay" onclick={cerrarTodo} aria-label="Cerrar menú"></button>
{/if}

<nav class="navbar">
  <button class="navbar-brand" onclick={() => irA('/dashboard')}>
    <div class="brand-logo">
      <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
        <path d="M24 6L42 17V31L24 42L6 31V17L24 6Z" fill="white" opacity="0.9"/>
        <path d="M24 14L34 20V28L24 34L14 28V20L24 14Z" fill="rgba(107,26,42,0.5)"/>
      </svg>
    </div>
    <span class="brand-name">Sistema de Gestión</span>
  </button>

  <div class="navbar-menus">
    {#each menusVisibles as menu}
      <div class="menu-item">
        <button
          class="menu-btn {menuAbierto === menu.id ? 'activo' : ''}"
          onclick={() => toggleMenu(menu.id)}
        >
          <span>{menu.icono}</span>
          <span>{menu.label}</span>
          <span class="chevron {menuAbierto === menu.id ? 'arriba' : ''}">▾</span>
        </button>

        {#if menuAbierto === menu.id}
          <div class="dropdown">
            {#each menu.items as item}
              <button class="dropdown-item" onclick={() => irA(item.ruta)}>
                <span class="dropdown-dot"></span>
                {item.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="navbar-perfil">
    <button
      class="perfil-btn"
      onclick={() => { perfilAbierto = !perfilAbierto; menuAbierto = ''; }}
    >
      <div class="avatar">
        {#if $usuario?.imagen}
          <img src={`${API_URL}/uploads/${$usuario.imagen}`} alt="avatar" />
        {:else}
          {getIniciales($usuario?.nombre)}
        {/if}
      </div>
      <span class="perfil-nombre">{$usuario?.nombre || 'Usuario'}</span>
      <span class="chevron {perfilAbierto ? 'arriba' : ''}">▾</span>
    </button>

    {#if perfilAbierto}
      <div class="dropdown dropdown-right">
        <div class="dropdown-header">
          <p class="dh-nombre">{$usuario?.nombre}</p>
          <p class="dh-correo">{$usuario?.correo}</p>
          <span class="dh-perfil">{$usuario?.perfil}</span>
        </div>
        <hr class="dropdown-divider" />
        <button class="dropdown-item danger" onclick={cerrarSesion}>
          🚪 Cerrar Sesión
        </button>
      </div>
    {/if}
  </div>
</nav>

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 99;
    background: transparent; border: none;
    cursor: default; padding: 0; width: 100%; height: 100%;
  }
  .navbar {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center;
    background: linear-gradient(135deg, #4A0E1A 0%, #6B1A2A 100%);
    padding: 0 24px; height: 56px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2); gap: 8px;
  }
  .navbar-brand {
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; margin-right: 16px; flex-shrink: 0;
    background: none; border: none; padding: 0; color: white;
  }
  .brand-logo {
    width: 36px; height: 36px; background: rgba(255,255,255,0.15);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
  }
  .brand-name { font-size: 14px; font-weight: 700; color: white; letter-spacing: 0.3px; white-space: nowrap; }
  .navbar-menus { display: flex; align-items: center; gap: 4px; flex: 1; }
  .menu-item { position: relative; }
  .menu-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px;
    background: transparent; border: none; color: rgba(255,255,255,0.85);
    font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 6px;
    transition: all 0.15s; white-space: nowrap; font-family: inherit;
  }
  .menu-btn:hover, .menu-btn.activo { background: rgba(255,255,255,0.15); color: white; }
  .chevron { font-size: 10px; transition: transform 0.2s; display: inline-block; }
  .chevron.arriba { transform: rotate(180deg); }
  .dropdown {
    position: absolute; top: calc(100% + 8px); left: 0; background: white;
    border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    min-width: 200px; overflow: hidden; z-index: 101;
    border: 1px solid rgba(107,26,42,0.1);
  }
  .dropdown-right { left: auto; right: 0; }
  .dropdown-item {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 10px 16px; background: none; border: none; font-size: 13px;
    color: #3A3A3A; cursor: pointer; text-align: left;
    transition: background 0.15s; font-family: inherit;
  }
  .dropdown-item:hover { background: #FBF5F6; color: #6B1A2A; }
  .dropdown-item.danger { color: #C62828; }
  .dropdown-item.danger:hover { background: #FFEBEE; }
  .dropdown-dot { width: 6px; height: 6px; border-radius: 50%; background: #C9A84C; flex-shrink: 0; }
  .dropdown-header { padding: 12px 16px; background: #FBF5F6; }
  .dh-nombre { font-size: 13px; font-weight: 600; color: #4A0E1A; }
  .dh-correo { font-size: 11px; color: #757575; margin-top: 2px; }
  .dh-perfil {
    display: inline-block; margin-top: 6px; font-size: 10px; font-weight: 700;
    background: #6B1A2A; color: white; padding: 2px 8px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .dropdown-divider { border: none; border-top: 1px solid #F0E8EA; margin: 0; }
  .navbar-perfil { position: relative; margin-left: auto; }
  .perfil-btn {
    display: flex; align-items: center; gap: 8px; padding: 6px 12px;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px; color: white; cursor: pointer; font-size: 13px;
    font-weight: 500; transition: all 0.15s; font-family: inherit;
  }
  .perfil-btn:hover { background: rgba(255,255,255,0.2); }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%; background: #C9A84C;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: white; overflow: hidden; flex-shrink: 0;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .perfil-nombre { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>