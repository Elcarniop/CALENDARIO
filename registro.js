const API = '../api/actividades.php';

async function guardarActividad(e) {
  e.preventDefault();
  const errDiv = document.getElementById('error-msg');
  errDiv.style.display = 'none';

  const datos = {
    nombre:        document.getElementById('nombre').value.trim(),
    descripcion:   document.getElementById('descripcion').value.trim(),
    fecha_inicio:  document.getElementById('fecha_inicio').value,
    fecha_fin:     document.getElementById('fecha_fin').value,
    hora_inicio:   document.getElementById('hora_inicio').value,
    hora_fin:      document.getElementById('hora_fin').value,
    lugar:         document.getElementById('lugar').value.trim(),
    dependencia:   document.getElementById('dependencia').value.trim(),
    tipo:          document.getElementById('tipo').value,
    es_repetitiva: document.getElementById('es_repetitiva').checked ? 1 : 0,
  };

  const inicio = new Date(`${datos.fecha_inicio}T${datos.hora_inicio}`);
  const horas  = (inicio - new Date()) / 3600000;

  if (horas < 24) {
    errDiv.textContent   = 'Solo puede registrar actividades con al menos 24 horas de anticipación.';
    errDiv.style.display = 'block';
    return;
  }

  try {
    const res  = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(datos),
    });
    const json = await res.json();

    if (!json.ok) {
      errDiv.textContent   = json.data;
      errDiv.style.display = 'block';
      return;
    }

    alert('¡Actividad registrada exitosamente!');
    window.location.href = 'actividades.html';

  } catch {
    errDiv.textContent   = 'Error de conexión. Verifique que XAMPP esté corriendo.';
    errDiv.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-registro');
  if (form) form.addEventListener('submit', guardarActividad);

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const minDate = manana.toISOString().split('T')[0];
  document.getElementById('fecha_inicio').min = minDate;
  document.getElementById('fecha_fin').min     = minDate;
});