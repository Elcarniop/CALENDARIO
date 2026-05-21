const API = '../api/usuarios.php';
let editandoId = null;

async function cargarUsuarios() {
  try {
    const res  = await fetch(API);
    const json = await res.json();
    if (!json.ok) { alert(json.data); return; }

    renderizarLista('activos',   json.data.filter(u => u.estado === 'activo'),   'Desactivar', 'desactivar');
    renderizarLista('inactivos', json.data.filter(u => u.estado === 'inactivo'), 'Activar',    'activar');
  } catch {
    alert('Error de conexión con el servidor.');
  }
}

function renderizarLista(contenedorId, lista, btnTexto, accion) {
  const cont = document.getElementById(contenedorId);
  cont.innerHTML = '';
  if (lista.length === 0) { cont.innerHTML = '<p style="color:#888">Sin registros.</p>'; return; }

  lista.forEach(u => {
    const div = document.createElement('div');
    div.className = 'user-card' + (accion === 'activar' ? ' inactive' : '');
    div.innerHTML = `
      <div class="user-info">
        <p><strong>Oficina:</strong> ${u.nombre}</p>
        <p><strong>Tipo:</strong> ${u.tipo}</p>
        <p><strong>Jefe:</strong> ${u.jefe}</p>
        <p><strong>Correo:</strong> ${u.correo}</p>
        <p><strong>Estado:</strong> ${u.estado}</p>
      </div>
      <div class="inline-btns">
        <button onclick="${accion}(${u.id})">${btnTexto}</button>
        <button class="edit-btn" onclick="abrirEditar(${u.id})">Editar</button>
      </div>`;
    cont.appendChild(div);
  });
}

async function crearUsuario() {
  const nombre     = document.getElementById('oficina').value.trim();
  const tipo       = document.getElementById('tipo').value;
  const jefe       = document.getElementById('jefe').value.trim();
  const correo     = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contra').value;

  if (!nombre || !tipo || !jefe || !correo || !contrasena) {
    alert('Por favor complete todos los campos.'); return;
  }

  const res  = await fetch(API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ nombre, tipo, jefe, correo, contrasena }),
  });
  const json = await res.json();
  alert(json.data?.mensaje || json.data);
  if (json.ok) { limpiarFormulario(); cargarUsuarios(); }
}

async function desactivar(id) {
  if (!confirm('¿Desactivar esta oficina?')) return;
  await cambiarEstado(id, 'inactivo');
}

async function activar(id) { await cambiarEstado(id, 'activo'); }

async function cambiarEstado(id, estado) {
  const res  = await fetch(`${API}?id=${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ estado }),
  });
  const json = await res.json();
  alert(json.data);
  cargarUsuarios();
}

async function abrirEditar(id) {
  const res  = await fetch(API);
  const json = await res.json();
  const u    = json.data.find(x => x.id == id);
  if (!u) return;

  editandoId = id;
  document.getElementById('oficina').value  = u.nombre;
  document.getElementById('tipo').value     = u.tipo;
  document.getElementById('jefe').value     = u.jefe;
  document.getElementById('usuario').value  = u.correo;
  document.getElementById('contra').value   = '';
  document.getElementById('btn-crear').textContent = 'Guardar Cambios';
  window.scrollTo(0, 0);
}

async function guardarEdicion() {
  const nombre     = document.getElementById('oficina').value.trim();
  const tipo       = document.getElementById('tipo').value;
  const jefe       = document.getElementById('jefe').value.trim();
  const correo     = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contra').value;

  const body = { nombre, tipo, jefe, correo };
  if (contrasena) body.contrasena = contrasena;

  const res  = await fetch(`${API}?id=${editandoId}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  alert(json.data);
  if (json.ok) {
    editandoId = null;
    limpiarFormulario();
    document.getElementById('btn-crear').textContent = 'Crear Usuario';
    cargarUsuarios();
  }
}

function manejarCrearOGuardar() {
  if (editandoId) guardarEdicion();
  else             crearUsuario();
}

function limpiarFormulario() {
  ['oficina','jefe','usuario','contra'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

document.addEventListener('DOMContentLoaded', cargarUsuarios);