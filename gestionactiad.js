const API = '../api/actividades.php';
let editandoId = null;

async function cargarActividades() {
  const cont = document.getElementById('lista');
  cont.innerHTML = '<p>Cargando...</p>';
  try {
    const res  = await fetch(API);
    const json = await res.json();
    if (!json.ok) { cont.innerHTML = `<p>${json.data}</p>`; return; }

    cont.innerHTML = '';
    if (json.data.length === 0) {
      cont.innerHTML = '<p>No hay actividades registradas.</p>'; return;
    }

    json.data.forEach(a => {
      const div = document.createElement('div');
      div.className = 'activity-card';
      div.innerHTML = `
        <p><strong>Actividad:</strong> ${a.nombre}</p>
        <p><strong>Tipo:</strong> ${a.tipo} ${a.es_repetitiva ? '🔁' : ''}</p>
        <p><strong>Inicio:</strong> ${a.fecha_inicio} ${a.hora_inicio}</p>
        <p><strong>Fin:</strong> ${a.fecha_fin} ${a.hora_fin}</p>
        <p><strong>Lugar:</strong> ${a.lugar}</p>
        <p><strong>Oficina:</strong> ${a.oficina_nombre}</p>
        <p><strong>Estado:</strong>
          <select onchange="cambiarEstado(${a.id}, this.value)">
            <option value="pendiente"   ${a.estado==='pendiente'   ?'selected':''}>Pendiente</option>
            <option value="aprobada"    ${a.estado==='aprobada'    ?'selected':''}>Aprobada</option>
            <option value="actualizada" ${a.estado==='actualizada' ?'selected':''}>Actualizada</option>
          </select>
        </p>
        <div class="inline-btns">
          <button class="edit-btn"   onclick="editarActividad(${a.id})">Editar</button>
          <button class="delete-btn" onclick="eliminarActividad(${a.id})">Eliminar</button>
        </div>`;
      cont.appendChild(div);
    });
  } catch { cont.innerHTML = '<p>Error de conexión.</p>'; }
}

async function cambiarEstado(id, estado) {
  const res  = await fetch(`${API}?id=${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body:   JSON.stringify({ estado }),
  });
  const json = await res.json();
  if (!json.ok) alert(json.data);
}

async function crearActividad() {
  const datos = leerFormulario();
  if (!datos) return;

  const url    = editandoId ? `${API}?id=${editandoId}` : API;
  const metodo = editandoId ? 'PUT' : 'POST';

  const res  = await fetch(url, {
    method: metodo, headers: { 'Content-Type': 'application/json' },
    body:   JSON.stringify(datos),
  });
  const json = await res.json();
  alert(json.data?.mensaje || json.data);
  if (json.ok) {
    editandoId = null;
    limpiarCampos();
    document.getElementById('btn-crear').textContent = 'Crear Actividad';
    cargarActividades();
  }
}

function leerFormulario() {
  const nombre = document.getElementById('nombre').value.trim();
  const inicio = document.getElementById('inicio').value;
  if (!nombre || !inicio) { alert('Complete al menos nombre y fecha de inicio.'); return null; }
  return {
    nombre,
    descripcion:   document.getElementById('descripcion').value.trim(),
    fecha_inicio:  inicio,
    fecha_fin:     document.getElementById('fin').value,
    hora_inicio:   document.getElementById('hora_inicio').value || '00:00',
    hora_fin:      document.getElementById('hora_fin').value    || '00:00',
    lugar:         document.getElementById('lugar').value.trim(),
    tipo:          document.getElementById('tipo').value,
    es_repetitiva: document.getElementById('es_repetitiva').checked ? 1 : 0,
  };
}

async function editarActividad(id) {
  try {
    const res  = await fetch(`${API}?id=${id}`);
    const json = await res.json();
    const a    = json.data;
    document.getElementById('nombre').value          = a.nombre;
    document.getElementById('descripcion').value     = a.descripcion;
    document.getElementById('inicio').value          = a.fecha_inicio;
    document.getElementById('fin').value             = a.fecha_fin;
    document.getElementById('hora_inicio').value     = a.hora_inicio;
    document.getElementById('hora_fin').value        = a.hora_fin;
    document.getElementById('lugar').value           = a.lugar;
    document.getElementById('tipo').value            = a.tipo;
    document.getElementById('es_repetitiva').checked = !!a.es_repetitiva;
    editandoId = id;
    document.getElementById('btn-crear').textContent = 'Guardar Cambios';
    window.scrollTo(0, 0);
  } catch { alert('Error al cargar la actividad.'); }
}

async function eliminarActividad(id) {
  if (!confirm('¿Eliminar esta actividad?')) return;
  const res  = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  const json = await res.json();
  alert(json.data);
  if (json.ok) cargarActividades();
}

function limpiarCampos() {
  ['nombre','descripcion','inicio','fin','hora_inicio','hora_fin','lugar'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const rep = document.getElementById('es_repetitiva');
  if (rep) rep.checked = false;
}

document.addEventListener('DOMContentLoaded', cargarActividades);