<script>
  import { toasts, removeToast } from '../stores/toast.js';
</script>

<div class="toaster">
  {#each $toasts as toast (toast.id)}
    <div class="toast {toast.type}">
      <span>{toast.message}</span>
      <button type="button" class="toast-close" on:click={() => removeToast(toast.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    top: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
    pointer-events: none;
  }

  .toast {
    min-width: 260px;
    max-width: 320px;
    border-radius: 10px;
    padding: 12px 14px;
    color: white;
    font-size: 13px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    pointer-events: auto;
    animation: slideIn 0.25s ease-out;
  }

  .toast.success { background: #2E7D32; }
  .toast.error { background: #C62828; }

  .toast-close {
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.85);
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  @keyframes slideIn {
    from { transform: translateX(16px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
</style>