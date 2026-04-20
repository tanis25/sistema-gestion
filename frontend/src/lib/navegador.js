export function navegar(ruta) {
  window.history.pushState({}, '', ruta);
  window.dispatchEvent(new CustomEvent('navegar', { detail: ruta }));
}