import { writable } from 'svelte/store';
import { API_URL } from '../config.js';

export const menusDinamicos = writable([]);

export async function cargarMenus(tokenVal) {
  try {
    const res = await fetch(`${API_URL}/api/menus`, {
      headers: { 'Authorization': `Bearer ${tokenVal}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    menusDinamicos.set(data);
  } catch {
    console.log('Error al cargar menús');
  }
}

export function moduloARuta(nombreModulo) {
  const mapa = {
    'Perfil': '/seguridad/perfiles',
    'Modulo': '/seguridad/modulos',
    'Permisos-Perfil': '/seguridad/permisos',
    'Usuario': '/seguridad/usuarios',
    'Principal 1.1': '/principal1/1',
    'Principal 1.2': '/principal1/2',
    'Principal 2.1': '/principal2/1',
    'Principal 2.2': '/principal2/2',
  };
  if (mapa[nombreModulo]) return mapa[nombreModulo];
  return `/modulo/${encodeURIComponent(nombreModulo)}`;
}