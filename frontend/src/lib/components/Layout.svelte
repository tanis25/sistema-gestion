<script>
  import Navbar from './Navbar.svelte';
  let { children } = $props();
</script>

<div class="app-layout">
  <Navbar />
  <main class="main-content">
    {@render children()}
  </main>
</div>

<style>
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #F0EEF0;
  }
  .main-content {
    flex: 1;
    padding: 28px 32px;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }
</style>