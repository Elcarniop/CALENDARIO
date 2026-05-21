const API = '../api/actividades.php';

async function cargarActividades() {
  const cont = document.getElementById('lista-actividades');
  cont.innerHTML = '<p>Cargando...</p>';

  try {
    const res  = await fetch(API);
    const json = await res.json();
    if (!json.ok) { cont.innerHTML = `<p>${json.data}</p>`; return; }

    const actividades = json.data;
    if (actividades.length === 0) {
      cont.innerHTML = '<p>No tiene actividades registradas aún.</p>'; return;
    }

    cont.innerHTML = '';
    const colores = { Cultural: '#b50303', Academica: '#004c97', Ludica: '#2e7d32' };

    actividades.forEach(a => {
      const color        = colores[a.tipo] || '#555';
      const puedeElim    = puedeEliminar(a.fecha_inicio, a.hora_inicio);
      const div          = document.createElement('div');
      div.className      = 'activity-box';
      div.style.borderLeftColor = color;
      div.innerHTML = `
        <p><span class="label">Nombre:</span> ${a.nombre}</p>
        <p><span class="label">Descripción:</span> ${a.descripcion}</p>
        <p><span class="label">Inicio:</span> ${formatFecha(a.fecha_inicio)} ${a.hora_inicio}</p>
        <p><span class="label">Fin:</span> ${formatFecha(a.fecha_fin)} ${a.hora_fin}</p>
        <p><span class="label">Lugar:</span> ${a.lugar}</p>
        <p><span class="label">Tipo:</span>
          <span style="color:${color};font-weight:bold">${a.tipo}</span></p>
        <p><span class="label">Estado:</span>
          <span class="badge badge-${a.estado}">${a.estado}</span></p>
        <p><span class="label">Repetitiva:</span> ${a.es_repetitiva ? 'Sí' : 'No'}</p>
        <div class="inline-btns">
          <a href="registro.html?id=${a.id}">
            <button class="edit-btn">✏️ Editar</button>
          </a>
          ${puedeElim
            ? `<button class="delete-btn" onclick="eliminar(${a.id})">🗑️ Eliminar</button>`
            : `<button disabled title="No se puede eliminar a menos de 24h">🔒 Eliminar</button>`}
        </div>`;
      cont.appendChild(div);
    });
  } catch {
    cont.innerHTML = '<p>Error de conexión con el servidor.</p>';
  }
}

function puedeEliminar(fecha, hora) {
  return (new Date(`${fecha}T${hora}`) - new Date()) / 3600000 >= 24;
}

function formatFecha(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

async function eliminar(id) {
  if (!confirm('¿Está seguro de eliminar esta actividad?')) return;
  const res  = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  const json = await res.json();
  alert(json.data);
  if (json.ok) cargarActividades();
}

document.addEventListener('DOMContentLoaded', cargarActividades);