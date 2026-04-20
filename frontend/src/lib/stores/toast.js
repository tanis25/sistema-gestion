import { writable } from 'svelte/store';

const toasts = writable([]);

function removeToast(id) {
  toasts.update(items => items.filter(item => item.id !== id));
}

function notify(message, type = 'success', duration = 3000) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  toasts.update(items => [...items, { id, message, type }]);
  setTimeout(() => removeToast(id), duration);
  return id;
}

function notifySuccess(message, duration = 3000) {
  return notify(message, 'success', duration);
}

function notifyError(message, duration = 4000) {
  return notify(message, 'error', duration);
}

export { toasts, notifySuccess, notifyError, removeToast };