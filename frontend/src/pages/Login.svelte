<script>
  import { onMount } from 'svelte';
  import { navegar } from '../lib/navegador.js';
  import { login } from '../lib/stores/auth.js';

  let correo = $state('');
  let password = $state('');
  let mostrarPassword = $state(false);
  let cargando = $state(false);
  let error = $state('');
  let captchaToken = $state('');
  let captchaListo = $state(false);

  // Clave de prueba oficial hCaptcha (funciona siempre en desarrollo)
  const HCAPTCHA_SITE_KEY = 'b8844302-046e-4d60-ab8c-3986cff6029e';

  onMount(() => {
    // Cargar script de hCaptcha
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => { captchaListo = true; };
    document.head.appendChild(script);

    // Callback global para cuando se completa el captcha
    window.onCaptchaSuccess = (token) => {
      captchaToken = token;
    };
    window.onCaptchaExpired = () => {
      captchaToken = '';
    };

    return () => {
      document.head.removeChild(script);
    };
  });

  async function handleLogin(e) {
    e.preventDefault();
    error = '';

    if (!correo || !password) {
      error = 'Por favor completa todos los campos.';
      return;
    }

    if (!captchaToken) {
      error = 'Por favor completa el captcha.';
      return;
    }

    cargando = true;

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Error al iniciar sesión.';
        // Resetear captcha
        if (window.hcaptcha) window.hcaptcha.reset();
        captchaToken = '';
        return;
      }

      login(data.usuario, data.token);
      navegar('/dashboard');

    } catch (err) {
      error = 'No se pudo conectar con el servidor.';
    } finally {
      cargando = false;
    }
  }
</script>

<div class="login-page">
  <!-- Panel izquierdo decorativo -->
  <div class="login-left">
    <div class="login-brand">
      <div class="brand-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.15)"/>
          <path d="M24 10L36 18V30L24 38L12 30V18L24 10Z" fill="white" opacity="0.9"/>
          <path d="M24 16L30 20V28L24 32L18 28V20L24 16Z" fill="rgba(107,26,42,0.6)"/>
        </svg>
      </div>
      <h1 class="brand-title">Sistema de Gestión</h1>
      <p class="brand-subtitle">Plataforma administrativa empresarial</p>
    </div>

    <div class="login-features">
      <div class="feature-item">
        <span class="feature-icon">🔐</span>
        <span>Acceso seguro con JWT</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">👥</span>
        <span>Gestión de usuarios y perfiles</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">📋</span>
        <span>Control de permisos por módulo</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">📊</span>
        <span>Panel administrativo completo</span>
      </div>
    </div>

    <p class="login-footer-text">© 2026 Sistema de Gestión. Todos los derechos reservados.</p>
  </div>

  <!-- Panel derecho con formulario -->
  <div class="login-right">
    <div class="login-card">
      <div class="login-card-header">
        <h2>Iniciar Sesión</h2>
        <p>Ingresa tus credenciales para continuar</p>
      </div>

      {#if error}
        <div class="alerta alerta-error">
          <span>⚠️</span> {error}
        </div>
      {/if}

      <form onsubmit={handleLogin}>
        <!-- Correo -->
        <div class="form-group">
          <label for="correo">Correo electrónico</label>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input
              id="correo"
              type="email"
              class="form-control"
              placeholder="correo@ejemplo.com"
              bind:value={correo}
              required
              autocomplete="email"
            />
          </div>
        </div>

        <!-- Contraseña -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="password"
              type={mostrarPassword ? 'text' : 'password'}
              class="form-control"
              placeholder="••••••••"
              bind:value={password}
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-pwd"
              onclick={() => mostrarPassword = !mostrarPassword}
            >
              {mostrarPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <!-- hCaptcha -->
        <div class="form-group captcha-group">
          <div
            class="h-captcha"
            data-sitekey={HCAPTCHA_SITE_KEY}
            data-callback="onCaptchaSuccess"
            data-expired-callback="onCaptchaExpired"
          ></div>
        </div>

        <!-- Botón -->
        <button
          type="submit"
          class="btn-login"
          disabled={cargando}
        >
          {#if cargando}
            <span class="spinner"></span> Verificando...
          {:else}
            Iniciar Sesión
          {/if}
        </button>
      </form>

      <!-- Credenciales de prueba -->
      <div class="credenciales-prueba">
        <p class="cp-titulo">Credenciales de prueba</p>
        <div class="cp-datos">
          <span><strong>Correo:</strong> admin@proyecto.com</span>
          <span><strong>Contraseña:</strong> Admin25.</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .login-page {
    display: flex;
    min-height: 100vh;
  }

  /* ===== PANEL IZQUIERDO ===== */
  .login-left {
    flex: 1;
    background: linear-gradient(145deg, #4A0E1A 0%, #6B1A2A 50%, #8B2438 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 40px;
    color: white;
  }

  .brand-icon { margin-bottom: 20px; }

  .brand-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .brand-subtitle {
    font-size: 14px;
    opacity: 0.75;
    margin-bottom: 48px;
  }

  .login-features {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 14px;
    opacity: 0.9;
  }

  .feature-icon {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.15);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .login-footer-text {
    font-size: 11px;
    opacity: 0.5;
    margin-top: 48px;
  }

  /* ===== PANEL DERECHO ===== */
  .login-right {
    width: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F0EEF0;
    padding: 32px;
  }

  .login-card {
    background: white;
    border-radius: 16px;
    padding: 36px 32px;
    width: 100%;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  }

  .login-card-header {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2px solid #F0EEF0;
  }

  .login-card-header h2 {
    font-size: 22px;
    font-weight: 700;
    color: #4A0E1A;
    margin-bottom: 4px;
  }

  .login-card-header p {
    font-size: 13px;
    color: #757575;
  }

  /* ===== FORMULARIO ===== */
  .form-group {
    margin-bottom: 18px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #4A4A4A;
    margin-bottom: 6px;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    font-size: 14px;
    z-index: 1;
  }

  .form-control {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border: 1.5px solid #E0E0E0;
    border-radius: 8px;
    font-size: 14px;
    transition: border 0.2s, box-shadow 0.2s;
    background: #FAFAFA;
  }

  .form-control:focus {
    outline: none;
    border-color: #6B1A2A;
    background: white;
    box-shadow: 0 0 0 3px rgba(107,26,42,0.08);
  }

  .toggle-pwd {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
  }

  /* ===== CAPTCHA ===== */
  .captcha-group {
    display: flex;
    justify-content: center;
  }

  /* ===== BOTÓN LOGIN ===== */
  .btn-login {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #6B1A2A, #8B2438);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
    letter-spacing: 0.3px;
  }

  .btn-login:hover:not(:disabled) {
    background: linear-gradient(135deg, #4A0E1A, #6B1A2A);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107,26,42,0.3);
  }

  .btn-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* ===== SPINNER ===== */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ===== CREDENCIALES PRUEBA ===== */
  .credenciales-prueba {
    margin-top: 20px;
    background: #FBF5F6;
    border: 1px solid #E8D0D4;
    border-radius: 8px;
    padding: 14px 16px;
  }

  .cp-titulo {
    font-size: 11px;
    font-weight: 700;
    color: #6B1A2A;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .cp-datos {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #4A4A4A;
  }

  /* ===== ALERTA ===== */
  .alerta {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alerta-error {
    background: #FFEBEE;
    color: #C62828;
    border-left: 4px solid #C62828;
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .login-left { display: none; }
    .login-right { width: 100%; }
  }
</style>