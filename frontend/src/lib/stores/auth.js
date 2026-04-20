import { writable } from 'svelte/store';
import { cargarPermisos, misPermisos, esAdmin, permisosListos } from './permisos.js';
import { cargarMenus, menusDinamicos } from './menus.js';

const usuarioGuardado = localStorage.getItem('usuario');
const tokenGuardado = localStorage.getItem('token');

export const usuario = writable(usuarioGuardado ? JSON.parse(usuarioGuardado) : null);
export const token = writable(tokenGuardado || null);

export async function login(datos, tkn) {
  localStorage.setItem('usuario', JSON.stringify(datos));
  localStorage.setItem('token', tkn);
  usuario.set(datos);
  token.set(tkn);
  await Promise.all([
    cargarPermisos(tkn),
    cargarMenus(tkn)
  ]);
}

export function logout() {
  localStorage.removeItem('usuario');
  localStorage.removeItem('token');
  usuario.set(null);
  token.set(null);
  misPermisos.set([]);
  esAdmin.set(false);
  permisosListos.set(false);
  menusDinamicos.set([]);
}