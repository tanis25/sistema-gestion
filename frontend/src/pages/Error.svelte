<script>
  import { navegar } from '../lib/navegador.js';
  import { usuario } from '../lib/stores/auth.js';

  const estaLogueado = !!localStorage.getItem('token');
</script>

<div class="error-page">
  <div class="error-card">
    <div class="error-icono">🚫</div>
    <h1 class="error-codigo">404</h1>
    <h2 class="error-titulo">Página no encontrada</h2>
    <p class="error-desc">
      La página que buscas no existe o no tienes permiso para acceder a ella.
    </p>

    <div class="error-acciones">
      {#if estaLogueado}
        <button class="btn btn-primary" onclick={() => navegar('/dashboard')}>
          🏠 Ir al Dashboard
        </button>
      {:else}
        <button class="btn btn-primary" onclick={() => navegar('/login')}>
          🔐 Ir al Login
        </button>
      {/if}
    </div>

    <div class="error-info">
      <p>Si crees que esto es un error, contacta al administrador del sistema.</p>
    </div>
  </div>
</div>

<style>
  .error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F0EEF0;
    padding: 24px;
  }

  .error-card {
    background: white;
    border-radius: 16px;
    padding: 56px 48px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    max-width: 480px;
    width: 100%;
    border-top: 6px solid #6B1A2A;
  }

  .error-icono {
    font-size: 56px;
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .error-codigo {
    font-size: 80px;
    font-weight: 700;
    color: #6B1A2A;
    line-height: 1;
    margin-bottom: 12px;
  }

  .error-titulo {
    font-size: 22px;
    font-weight: 600;
    color: #1A1A1A;
    margin-bottom: 12px;
  }

  .error-desc {
    font-size: 14px;
    color: #757575;
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .error-acciones {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #6B1A2A;
    color: white;
  }

  .btn-primary:hover {
    background: #4A0E1A;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107,26,42,0.3);
  }

  .error-info {
    padding-top: 20px;
    border-top: 1px solid #F0EEF0;
  }

  .error-info p {
    font-size: 12px;
    color: #BDBDBD;
  }

  @media (max-width: 480px) {
    .error-card { padding: 40px 24px; }
    .error-codigo { font-size: 60px; }
  }
</style>