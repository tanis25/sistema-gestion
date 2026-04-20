import { writable } from 'svelte/store';

export const misPermisos = writable([]);
export const esAdmin = writable(false);
export const permisosListos = writable(false);

export async function cargarPermisos(tokenVal) {
  try {
    const res = await fetch('http://localhost:3001/api/auth/mis-permisos', {
      headers: { 'Authorization': `Bearer ${tokenVal}` }
    });
    if (!res.ok) { permisosListos.set(true); return; }
    const data = await res.json();
    misPermisos.set(data.permisos || []);
    esAdmin.set(data.esAdmin || false);
    permisosListos.set(true);
  } catch {
    permisosListos.set(true);
  }
}

export function tieneAccesoModulo(permisos, nombreModulo) {
  if (!permisos || permisos.length === 0) return false;
  const p = permisos.find(p =>
    p.strNombreModulo?.toLowerCase().trim() === nombreModulo?.toLowerCase().trim()
  );
  if (!p) return false;
  return p.bitAgregar || p.bitEditar || p.bitConsulta || p.bitEliminar || p.bitDetalle;
}

export function tienePermiso(permisos, nombreModulo, tipo) {
  if (!permisos || permisos.length === 0) return false;
  const p = permisos.find(p =>
    p.strNombreModulo?.toLowerCase().trim() === nombreModulo?.toLowerCase().trim()
  );
  if (!p) return false;
  return p[tipo] === true;
}

export function getPermisos(permisos, esAdminVal, nombreModulo) {
  if (esAdminVal) {
    return { agregar: true, editar: true, eliminar: true, consulta: true, detalle: true };
  }
  if (!permisos || permisos.length === 0) {
    return { agregar: false, editar: false, eliminar: false, consulta: false, detalle: false };
  }
  const p = permisos.find(p =>
    p.strNombreModulo?.toLowerCase().trim() === nombreModulo?.toLowerCase().trim()
  );
  if (!p) {
    return { agregar: false, editar: false, eliminar: false, consulta: false, detalle: false };
  }
  return {
    agregar: p.bitAgregar || false,
    editar: p.bitEditar || false,
    eliminar: p.bitEliminar || false,
    consulta: p.bitConsulta || false,
    detalle: p.bitDetalle || false
  };
}