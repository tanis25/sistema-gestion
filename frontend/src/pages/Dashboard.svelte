<script>
  import { onMount } from 'svelte';
  import Layout from '../lib/components/Layout.svelte';
  import { usuario, token } from '../lib/stores/auth.js';
  import { navegar } from '../lib/navegador.js';

  let stats = $state({
    usuarios: '—', perfiles: '—', modulos: '—', permisos: '—'
  });

  let tokenVal = '';
  token.subscribe(t => tokenVal = t);

  const tarjetas = [
    { key: 'usuarios', label: 'Usuarios Activos', icono: '👥', color: '#6B1A2A', ruta: '/seguridad/usuarios' },
    { key: 'perfiles', label: 'Perfiles', icono: '🪪', color: '#8B2438', ruta: '/seguridad/perfiles' },
    { key: 'modulos', label: 'Módulos', icono: '📦', color: '#4A0E1A', ruta: '/seguridad/modulos' },
    { key: 'permisos', label: 'Permisos Config.', icono: '🔑', color: '#C9A84C', ruta: '/seguridad/permisos' },
  ];

  onMount(async () => {
    try {
      const res = await fetch(`/api/stats`, {
        headers: { 'Authorization': `Bearer ${tokenVal}` }
      });
      if (res.ok) {
        const data = await res.json();
        stats = data;
      }
    } catch {
      console.log('Error al cargar estadísticas');
    }
  });

  function fechaHoy() {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
</script>

<Layout>
  <div class="dashboard">
    <div class="dash-header">
      <div>
        <h1 class="dash-titulo">Bienvenido, {$usuario?.nombre || 'Usuario'}</h1>
        <p class="dash-fecha">{fechaHoy()}</p>
      </div>
    </div>

    <div class="stats-grid">
      {#each tarjetas as t}
        <button class="stat-card" onclick={() => navegar(t.ruta)}>
          <div class="stat-icono" style="background:{t.color}">{t.icono}</div>
          <div class="stat-info">
            <p class="stat-valor">{stats[t.key]}</p>
            <p class="stat-label">{t.label}</p>
          </div>
        </button>
      {/each}
    </div>
  </div>
</Layout>

<style>
  .dashboard { display: flex; flex-direction: column; gap: 28px; }
  .dash-header { display: flex; justify-content: space-between; align-items: center; }
  .dash-titulo { font-size: 24px; font-weight: 700; color: #4A0E1A; margin-bottom: 4px; }
  .dash-fecha { font-size: 13px; color: #757575; text-transform: capitalize; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .stat-card {
    background: white; border-radius: 12px; padding: 20px;
    display: flex; align-items: center; gap: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer;
    transition: all 0.2s; border-left: 4px solid #6B1A2A;
    border-top: none; border-right: none; border-bottom: none;
    text-align: left; font-family: inherit; width: 100%;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(107,26,42,0.15); }
  .stat-icono { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .stat-valor { font-size: 28px; font-weight: 700; color: #4A0E1A; line-height: 1; margin-bottom: 4px; }
  .stat-label { font-size: 12px; color: #757575; font-weight: 500; }

  @media (max-width: 768px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>