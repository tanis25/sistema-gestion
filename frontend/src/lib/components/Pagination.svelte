<script>
  let { pagina = 1, total = 0, porPagina = 5, onCambio } = $props();

  let totalPaginas = $derived(Math.ceil(total / porPagina));

  function ir(p) {
    if (p < 1 || p > totalPaginas) return;
    onCambio(p);
  }
</script>

{#if totalPaginas > 1}
<div class="paginacion">
  <span class="pag-info">
    Mostrando {Math.min((pagina-1)*porPagina+1, total)}–{Math.min(pagina*porPagina, total)} de {total}
  </span>
  <div class="pag-botones">
    <!-- Inicio -->
    <button onclick={() => ir(1)} disabled={pagina === 1} title="Primera página">
      «
    </button>
    <!-- Anterior -->
    <button onclick={() => ir(pagina - 1)} disabled={pagina === 1} title="Anterior">
      ‹
    </button>
    <!-- Número de página -->
    <span class="pag-num">
      Página {pagina} de {totalPaginas}
    </span>
    <!-- Siguiente -->
    <button onclick={() => ir(pagina + 1)} disabled={pagina === totalPaginas} title="Siguiente">
      ›
    </button>
    <!-- Último -->
    <button onclick={() => ir(totalPaginas)} disabled={pagina === totalPaginas} title="Última página">
      »
    </button>
  </div>
</div>
{/if}

<style>
  .paginacion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid #F0EEF0;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pag-info { font-size: 12px; color: #757575; }

  .pag-botones {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pag-botones button {
    width: 32px;
    height: 32px;
    border: 1px solid #E0E0E0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    color: #4A4A4A;
    font-weight: 600;
  }

  .pag-botones button:hover:not(:disabled) {
    background: #6B1A2A;
    color: white;
    border-color: #6B1A2A;
  }

  .pag-botones button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .pag-num {
    font-size: 12px;
    color: #4A4A4A;
    padding: 0 8px;
    font-weight: 500;
    white-space: nowrap;
  }
</style>