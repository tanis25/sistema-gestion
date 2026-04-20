<script>
  import { navegar } from '../navegador.js';
  let { items = [] } = $props();
</script>

<nav class="breadcrumb">
  <button class="bc-home" onclick={() => navegar('/dashboard')} aria-label="Ir al inicio">
    🏠
  </button>
  {#each items as item, i}
    <span class="bc-sep">›</span>
    {#if item.ruta && i < items.length - 1}
      <button class="bc-link" onclick={() => navegar(item.ruta)} aria-label="Ir a {item.label}">
        {item.label}
      </button>
    {:else}
      <span class="bc-actual">{item.label}</span>
    {/if}
  {/each}
</nav>

<style>
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    margin-bottom: 20px;
    color: #757575;
  }
  .bc-home {
    cursor: pointer;
    font-size: 15px;
    background: none;
    border: none;
    padding: 0;
    line-height: 1;
  }
  .bc-sep { color: #BDBDBD; font-size: 16px; }
  .bc-link {
    color: #6B1A2A;
    cursor: pointer;
    font-weight: 500;
    background: none;
    border: none;
    font-size: 13px;
    padding: 0;
    font-family: inherit;
  }
  .bc-link:hover { text-decoration: underline; }
  .bc-actual { color: #4A4A4A; font-weight: 500; }
</style>