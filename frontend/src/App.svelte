<script>
  import { onMount } from 'svelte';
  import { misPermisos, esAdmin, tieneAccesoModulo, permisosListos } from './lib/stores/permisos.js';
  import Login from './pages/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import Error from './pages/Error.svelte';
  import Perfiles from './pages/seguridad/Perfiles.svelte';
  import Modulos from './pages/seguridad/Modulos.svelte';
  import Permisos from './pages/seguridad/Permisos.svelte';
  import Usuarios from './pages/seguridad/Usuarios.svelte';
  import Principal11 from './pages/principal1/Principal11.svelte';
  import Principal12 from './pages/principal1/Principal12.svelte';
  import Principal21 from './pages/principal2/Principal21.svelte';
  import Principal22 from './pages/principal2/Principal22.svelte';
  import ModuloDinamico from './pages/ModuloDinamico.svelte';
  import Toaster from './lib/components/Toaster.svelte';

  let ruta = $state(window.location.pathname);
  let permisosOk = $state(false);
  let esAdminVal = $state(false);
  let permisosVal = $state([]);

  permisosListos.subscribe(v => permisosOk = v);
  esAdmin.subscribe(v => esAdminVal = v);
  misPermisos.subscribe(v => permisosVal = v);

  const rutas = {
    '/': { componente: Login, publico: true },
    '/login': { componente: Login, publico: true },
    '/dashboard': { componente: Dashboard, modulo: null },
    '/seguridad/perfiles': { componente: Perfiles, modulo: 'Perfil' },
    '/seguridad/modulos': { componente: Modulos, modulo: 'Modulo' },
    '/seguridad/permisos': { componente: Permisos, modulo: 'Permisos-Perfil' },
    '/seguridad/usuarios': { componente: Usuarios, modulo: 'Usuario' },
    '/principal1/1': { componente: Principal11, modulo: 'Principal 1.1' },
    '/principal1/2': { componente: Principal12, modulo: 'Principal 1.2' },
    '/principal2/1': { componente: Principal21, modulo: 'Principal 2.1' },
    '/principal2/2': { componente: Principal22, modulo: 'Principal 2.2' },
    '/error': { componente: Error, publico: true },
  };

  onMount(() => {
    const handlePop = () => { ruta = window.location.pathname; };
    window.addEventListener('popstate', handlePop);
    window.addEventListener('navegar', (e) => { ruta = e.detail; });
    return () => window.removeEventListener('popstate', handlePop);
  });

  let ComponenteActual = $derived.by(() => {
    const estaLogueado = !!localStorage.getItem('token');
    const config = rutas[ruta];

    // Ruta dinámica /modulo/:nombre
    if (ruta.startsWith('/modulo/')) {
      if (!estaLogueado) return Login;
      if (!permisosOk) return null;
      const nombreModulo = decodeURIComponent(ruta.split('/modulo/')[1]);
      if (esAdminVal) return ModuloDinamico;
      if (tieneAccesoModulo(permisosVal, nombreModulo)) return ModuloDinamico;
      return Error;
    }

    if (!config) return Error;
    if (config.publico) return config.componente;
    if (!estaLogueado) return Login;
    if (!config.modulo) return config.componente;
    if (!permisosOk) return null;
    if (esAdminVal) return config.componente;
    if (tieneAccesoModulo(permisosVal, config.modulo)) return config.componente;

    return Error;
  });
</script>

{#if ComponenteActual}
  <ComponenteActual />
{:else if !!localStorage.getItem('token')}
  <div class="cargando-app">
    <div class="spinner-grande"></div>
    <p>Cargando...</p>
  </div>
{/if}

<Toaster />

<style>
  .cargando-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #F0EEF0;
    gap: 16px;
  }
  .spinner-grande {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(107,26,42,0.2);
    border-top-color: #6B1A2A;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .cargando-app p {
    font-size: 14px;
    color: #757575;
    font-family: 'Segoe UI', sans-serif;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>