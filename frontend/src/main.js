import './app.css'
import App from './App.svelte'
import { mount } from 'svelte'
import { cargarPermisos } from './lib/stores/permisos.js'
import { cargarMenus } from './lib/stores/menus.js'

const token = localStorage.getItem('token')
if (token) {
  cargarPermisos(token)
  cargarMenus(token)
}

const app = mount(App, {
  target: document.getElementById('app')
})

export default app